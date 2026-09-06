import { Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocxService, TipoBloque } from '../docx/docx.service';
import { SyncService } from '../sync/sync.service';
import config from '../config';
import * as path from 'node:path';
import { promises as fs } from 'node:fs';

export interface ResultadoPlantilla {
  materia: string;
  fecha: string;
  creada: boolean;
  omitido?: string;
  archivos?: string[];
}

/**
 * Crea pares Guía/Notas en disco para las próximas N clases del horario,
 * respetando días no lectivos. Así el vigilante y el generador post-clase
 * tienen material sin que Adam cree archivos a mano.
 */
@Injectable()
export class PrepararSesionesService {
  private readonly log = new Logger(PrepararSesionesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly docx: DocxService,
    private readonly sync: SyncService,
    @Inject(config.KEY) private readonly cfg: ConfigType<typeof config>,
  ) {}

  async prepararProximos(dias?: number): Promise<{
    dias: number;
    creadas: number;
    omitidas: number;
    resultados: ResultadoPlantilla[];
  }> {
    const horizonte = dias ?? this.cfg.autoPlantillasDias;
    const semestre = await this.prisma.semestre.findFirst({
      where: { codigo: this.cfg.semestreActivo },
      include: {
        diasNoLectivos: true,
        materias: {
          include: { horarios: true },
          orderBy: { orden: 'asc' },
        },
      },
    });
    if (!semestre) {
      return { dias: horizonte, creadas: 0, omitidas: 0, resultados: [] };
    }

    const noLectivos = new Set(
      semestre.diasNoLectivos.map((d) => d.fecha.toISOString().slice(0, 10)),
    );
    const resultados: ResultadoPlantilla[] = [];
    let creadas = 0;
    let omitidas = 0;

    const inicio = this.hoyMexicoUtcDate();
    for (let i = 0; i < horizonte; i++) {
      const fecha = new Date(inicio);
      fecha.setUTCDate(inicio.getUTCDate() + i);
      const iso = fecha.toISOString().slice(0, 10);
      if (noLectivos.has(iso)) continue;
      if (fecha < semestre.inicio || fecha > semestre.fin) continue;

      const diaSemana = (fecha.getUTCDay() + 6) % 7; // 0=lun
      if (diaSemana > 4) continue;

      for (const m of semestre.materias) {
        const bloques = m.horarios.filter((h) => h.diaSemana === diaSemana);
        for (const h of bloques) {
          const existente = await this.prisma.sesion.findUnique({
            where: { materiaId_fecha: { materiaId: m.id, fecha } },
            include: { documentos: { select: { tipo: true } } },
          });
          if (existente?.documentos.some((d) => d.tipo === 'GUIA' || d.tipo === 'NOTAS')) {
            omitidas++;
            resultados.push({
              materia: m.clave,
              fecha: iso,
              creada: false,
              omitido: 'ya existe',
            });
            continue;
          }

          try {
            const archivos = await this.escribirPlantillas({
              materia: m,
              fecha,
              horaInicio: h.horaInicio,
              horaFin: h.horaFin,
              raiz: semestre.raizDocumentos,
            });
            for (const ruta of archivos) {
              await this.sync.importarPorRuta(ruta);
            }
            creadas++;
            resultados.push({ materia: m.clave, fecha: iso, creada: true, archivos });
          } catch (e: any) {
            this.log.warn(`Plantilla ${m.clave} ${iso}: ${e.message}`);
            resultados.push({
              materia: m.clave,
              fecha: iso,
              creada: false,
              omitido: e.message,
            });
          }
        }
      }
    }

    return { dias: horizonte, creadas, omitidas, resultados };
  }

  private hoyMexicoUtcDate() {
    const partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.cfg.zonaHorario,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const y = Number(partes.find((p) => p.type === 'year')?.value);
    const m = Number(partes.find((p) => p.type === 'month')?.value);
    const d = Number(partes.find((p) => p.type === 'day')?.value);
    return new Date(Date.UTC(y, m - 1, d));
  }

  private async escribirPlantillas(a: {
    materia: { clave: string; nombre: string; carpeta: string };
    fecha: Date;
    horaInicio: string;
    horaFin: string;
    raiz: string;
  }) {
    const dd = String(a.fecha.getUTCDate()).padStart(2, '0');
    const mm = String(a.fecha.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = a.fecha.getUTCFullYear();
    const yy = String(yyyy).slice(2);
    const carpetaNotas = path.join(a.raiz, a.materia.carpeta, 'Notas');
    await fs.mkdir(carpetaNotas, { recursive: true });

    const archivoGuia = `Guia ${dd}-${mm}-${yyyy}.docx`;
    const archivoNotas = `Notas ${dd}-${mm}-${yyyy}.docx`;
    const rutaGuia = path.join(carpetaNotas, archivoGuia);
    const rutaNotas = path.join(carpetaNotas, archivoNotas);

    const cabecera = (tipo: 'GUÍA' | 'NOTAS'): { tipo: TipoBloque; texto: string }[] => [
      {
        tipo: 'TITULO',
        texto: `${tipo} ${dd}-${mm}-${yy} ${a.materia.nombre}`,
      },
      {
        tipo: 'SUBTITULO',
        texto: `${a.materia.clave} · ${a.horaInicio}-${a.horaFin}`,
      },
      { tipo: 'TEMA', texto: 'Sesión (plantilla automática)' },
      { tipo: 'SEPARADOR', texto: '' },
    ];

    const rutas: string[] = [];
    try {
      await fs.access(rutaGuia);
    } catch {
      await this.docx.escribir(rutaGuia, [
        ...cabecera('GUÍA'),
        {
          tipo: 'PARRAFO',
          texto: '(Pega aquí la guía del maestro o los puntos que anuncie en clase.)',
        },
      ]);
      rutas.push(rutaGuia);
    }

    try {
      await fs.access(rutaNotas);
    } catch {
      await this.docx.escribir(rutaNotas, [
        ...cabecera('NOTAS'),
        { tipo: 'TAREA_PROPIA_TITULO', texto: 'TAREA PROPIA' },
        {
          tipo: 'PARRAFO',
          texto: '(ideas que se me ocurren en clase para investigar por mi cuenta)',
        },
        { tipo: 'ESPACIO', texto: '' },
      ]);
      rutas.push(rutaNotas);
    }

    return rutas;
  }
}
