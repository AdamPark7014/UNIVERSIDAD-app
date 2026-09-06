import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SyncService } from '../sync/sync.service';
import { NotasGeneradorService } from '../notas/notas-generador.service';
import { PrepararSesionesService } from './preparar-sesiones.service';
import { GuiasEstudioService } from '../guias-examen/guias-estudio.service';
import config from '../config';

export interface ResumenCiclo {
  corridoEn: string;
  escritos: number;
  notasGeneradas: number;
  plantillasCreadas: number;
  guiasCercanas: number;
  errores: string[];
  detalle: string[];
}

/**
 * Motor de automatización del caso de uso personal:
 * 1) escribe a disco lo pendiente
 * 2) tras horaFin de una clase, genera notas desde la guía
 * 3) mantiene plantillas de las próximas 2 semanas
 * 4) regenera guías MEGA de exámenes en ≤14 días si faltan o están viejas
 */
@Injectable()
export class AutomatizacionService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(AutomatizacionService.name);
  private timer?: NodeJS.Timeout;
  private corriendo = false;
  private ultimo?: ResumenCiclo;
  private ciclos = 0;
  private ultimaGuiaMs = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sync: SyncService,
    private readonly notas: NotasGeneradorService,
    private readonly preparar: PrepararSesionesService,
    private readonly guias: GuiasEstudioService,
    @Inject(config.KEY) private readonly cfg: ConfigType<typeof config>,
  ) {}

  onModuleInit() {
    if (!this.cfg.autoCiclo) {
      this.log.log('AUTO_CICLO=false — motor en pausa (sigue disponible por API)');
      return;
    }
    const ms = Math.max(60_000, this.cfg.autoIntervaloMs);
    this.log.log(`Motor automático cada ${Math.round(ms / 1000)}s (${this.cfg.zonaHorario})`);
    // Primera pasada a los 45s para no competir con el arranque/import.
    setTimeout(() => void this.correrCiclo('arranque'), 45_000);
    this.timer = setInterval(() => void this.correrCiclo('intervalo'), ms);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  estado() {
    return {
      activo: this.cfg.autoCiclo,
      intervaloMs: this.cfg.autoIntervaloMs,
      zona: this.cfg.zonaHorario,
      plantillasDias: this.cfg.autoPlantillasDias,
      ciclos: this.ciclos,
      corriendo: this.corriendo,
      ultimo: this.ultimo ?? null,
    };
  }

  async correrCiclo(origen = 'manual'): Promise<ResumenCiclo> {
    if (this.corriendo) {
      return (
        this.ultimo ?? {
          corridoEn: new Date().toISOString(),
          escritos: 0,
          notasGeneradas: 0,
          plantillasCreadas: 0,
          guiasCercanas: 0,
          errores: ['ciclo ya en curso'],
          detalle: [],
        }
      );
    }
    this.corriendo = true;
    const errores: string[] = [];
    const detalle: string[] = [`origen=${origen}`];
    let escritos = 0;
    let notasGeneradas = 0;
    let plantillasCreadas = 0;
    let guiasCercanas = 0;

    try {
      try {
        const w = await this.sync.escribirPendientes();
        escritos = w.escritos;
        if (w.errores.length) errores.push(...w.errores.map((e) => `sync: ${e}`));
        if (escritos) detalle.push(`escritos=${escritos}`);
      } catch (e: any) {
        errores.push(`sync: ${e.message}`);
      }

      try {
        const post = await this.generarNotasPostClase();
        notasGeneradas = post.generados;
        detalle.push(...post.detalle);
        if (post.errores.length) errores.push(...post.errores);
      } catch (e: any) {
        errores.push(`notas: ${e.message}`);
      }

      try {
        const p = await this.preparar.prepararProximos();
        plantillasCreadas = p.creadas;
        if (p.creadas) detalle.push(`plantillas=+${p.creadas}`);
      } catch (e: any) {
        errores.push(`plantillas: ${e.message}`);
      }

      try {
        // Guías MEGA: como máximo 1× cada 12 h en el ciclo automático
        // (siguen disponibles al instante con POST /automatizacion/generar-guias).
        const hace = this.ultimaGuiaMs ? Date.now() - this.ultimaGuiaMs : Infinity;
        if (hace > 12 * 60 * 60 * 1000) {
          const g = await this.guias.generar({ proximos: 14 });
          guiasCercanas = g.generadas;
          this.ultimaGuiaMs = Date.now();
          if (g.generadas) detalle.push(`guias=${g.generadas}`);
          if (g.errores.length) errores.push(...g.errores.slice(0, 5));
        } else {
          detalle.push('guias=omitido(<12h)');
        }
      } catch (e: any) {
        errores.push(`guias: ${e.message}`);
      }

      this.ciclos++;
      this.ultimo = {
        corridoEn: new Date().toISOString(),
        escritos,
        notasGeneradas,
        plantillasCreadas,
        guiasCercanas,
        errores,
        detalle,
      };
      if (escritos || notasGeneradas || plantillasCreadas || guiasCercanas) {
        this.log.log(
          `Ciclo: sync=${escritos} notas=${notasGeneradas} plantillas=${plantillasCreadas} guias=${guiasCercanas}`,
        );
      }
      return this.ultimo;
    } finally {
      this.corriendo = false;
    }
  }

  /**
   * Clases de hoy (hora MX) cuya horaFin ya pasó y cuyas notas están bajo el umbral.
   */
  private async generarNotasPostClase() {
    const { fechaUtc, minutosAhora } = this.ahoraMexico();
    const umbral = this.cfg.umbralNotas;

    const sesiones = await this.prisma.sesion.findMany({
      where: {
        fecha: fechaUtc,
        documentos: {
          some: { tipo: 'GUIA' },
        },
      },
      include: {
        materia: { select: { clave: true } },
        documentos: {
          select: { tipo: true, palabrasContenido: true },
        },
      },
    });

    const candidatos = sesiones.filter((s) => {
      const notas = s.documentos.find((d) => d.tipo === 'NOTAS');
      if (!notas || notas.palabrasContenido >= umbral) return false;
      if (!s.documentos.some((d) => d.tipo === 'GUIA')) return false;
      return this.minutosDe(s.horaFin) + 5 <= minutosAhora; // 5 min de gracia
    });

    // También recupera deuda reciente (últimos 3 días) con guía y notas vacías.
    const hace3 = new Date(fechaUtc);
    hace3.setUTCDate(hace3.getUTCDate() - 3);
    const deuda = await this.prisma.sesion.findMany({
      where: {
        fecha: { gte: hace3, lt: fechaUtc },
        documentos: {
          some: { tipo: 'NOTAS', palabrasContenido: { lt: umbral } },
        },
      },
      include: {
        materia: { select: { clave: true } },
        documentos: { select: { tipo: true, palabrasContenido: true } },
      },
      take: 20,
    });

    const ids = new Set(candidatos.map((c) => c.id));
    const cola = [
      ...candidatos,
      ...deuda.filter(
        (s) =>
          !ids.has(s.id) &&
          s.documentos.some((d) => d.tipo === 'GUIA') &&
          s.documentos.some((d) => d.tipo === 'NOTAS' && d.palabrasContenido < umbral),
      ),
    ];

    let generados = 0;
    const errores: string[] = [];
    const detalle: string[] = [];

    for (const s of cola) {
      try {
        const r = await this.notas.generarParaSesion(s.id, { escribirDisco: true });
        if (!r.omitido) {
          generados++;
          detalle.push(`notas ${s.materia.clave} ${r.palabrasContenido}p`);
        }
      } catch (e: any) {
        errores.push(`${s.materia.clave}: ${e.message}`);
      }
    }

    return { generados, errores, detalle };
  }

  private ahoraMexico() {
    const partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.cfg.zonaHorario,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
    const num = (t: string) => Number(partes.find((p) => p.type === t)?.value);
    const y = num('year');
    const m = num('month');
    const d = num('day');
    let h = num('hour');
    const min = num('minute');
    // en-CA a veces da 24:00
    if (h === 24) h = 0;
    return {
      fechaUtc: new Date(Date.UTC(y, m - 1, d)),
      minutosAhora: h * 60 + min,
    };
  }

  private minutosDe(hhmm: string) {
    const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
    return (h || 0) * 60 + (m || 0);
  }
}
