import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import config from '../config';

export type Gravedad = 'critica' | 'aviso' | 'informativa';

export interface Alerta {
  tipo: 'nota-vacia' | 'nota-corta' | 'entrega-cerca' | 'entrega-vencida' | 'sin-escribir';
  gravedad: Gravedad;
  titulo: string;
  detalle: string;
  /** A dónde lleva el clic. */
  enlace: string;
  fecha?: Date;
  materia?: { codigo: string; clave: string; nombre: string; color: string };
}

const RESUMEN_MATERIA = {
  select: { id: true, codigo: true, clave: true, nombre: true, color: true },
};

const dias = (a: Date, b: Date) =>
  Math.round((a.getTime() - b.getTime()) / 86_400_000);

@Injectable()
export class AlertasService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(config.KEY) private readonly cfg: ConfigType<typeof config>,
  ) {}

  private hoy() {
    const h = new Date();
    return new Date(Date.UTC(h.getUTCFullYear(), h.getUTCMonth(), h.getUTCDate()));
  }

  /**
   * Clases que ya se dieron y cuyas notas no llegan al umbral.
   *
   * Se separa "vacía" de "corta" a propósito: no es lo mismo no haber abierto
   * el documento que haber anotado cuatro palabras. La primera es deuda total;
   * la segunda, un apunte que no va a servir para estudiar.
   */
  async notasPendientes(umbral?: number, codigoMateria?: string) {
    const limite = umbral ?? this.cfg.umbralNotas;
    const hoy = this.hoy();

    const sesiones = await this.prisma.sesion.findMany({
      where: {
        fecha: { lte: hoy },
        ...(codigoMateria ? { materia: { codigo: codigoMateria } } : {}),
        documentos: { some: { tipo: 'NOTAS', palabrasContenido: { lt: limite } } },
      },
      orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }],
      include: {
        materia: RESUMEN_MATERIA,
        documentos: {
          select: { id: true, tipo: true, palabras: true, palabrasContenido: true },
        },
        evaluaciones: { select: { id: true, tipo: true, titulo: true } },
      },
    });

    const items = sesiones.map((s) => {
      const notas = s.documentos.find((d) => d.tipo === 'NOTAS');
      const escritas = notas?.palabrasContenido ?? 0;
      return {
        ...s,
        palabrasEscritas: escritas,
        faltan: Math.max(0, limite - escritas),
        estadoNotas: (escritas === 0 ? 'vacia' : 'corta') as 'vacia' | 'corta',
        diasDesde: dias(hoy, s.fecha),
      };
    });

    const porMateria = new Map<string, any>();
    for (const i of items) {
      const m = porMateria.get(i.materia.codigo) ?? {
        ...i.materia,
        vacias: 0,
        cortas: 0,
        total: 0,
      };
      m.total++;
      if (i.estadoNotas === 'vacia') m.vacias++;
      else m.cortas++;
      porMateria.set(i.materia.codigo, m);
    }

    // Cuántas clases ya pasaron en total, para poder dar un porcentaje honesto.
    const cursadas = await this.prisma.sesion.count({
      where: {
        fecha: { lte: hoy },
        ...(codigoMateria ? { materia: { codigo: codigoMateria } } : {}),
      },
    });

    return {
      umbral: limite,
      cursadas,
      pendientes: items.length,
      alDia: cursadas - items.length,
      porcentajeAlDia: cursadas ? Math.round(((cursadas - items.length) / cursadas) * 100) : 100,
      vacias: items.filter((i) => i.estadoNotas === 'vacia').length,
      cortas: items.filter((i) => i.estadoNotas === 'corta').length,
      porMateria: [...porMateria.values()].sort((a, b) => b.total - a.total),
      sesiones: items,
    };
  }

  /** Todo lo que merece un aviso, junto y ordenado por gravedad. */
  async resumen(umbral?: number) {
    const limite = umbral ?? this.cfg.umbralNotas;
    const hoy = this.hoy();
    const enUnaSemana = new Date(hoy.getTime() + 7 * 86_400_000);

    const [notas, entregasCerca, entregasVencidas, sinEscribir] = await Promise.all([
      this.notasPendientes(limite),
      this.prisma.evaluacion.findMany({
        where: { fecha: { gte: hoy, lte: enUnaSemana }, estado: 'PENDIENTE' },
        orderBy: { fecha: 'asc' },
        include: { materia: RESUMEN_MATERIA },
      }),
      this.prisma.evaluacion.findMany({
        where: { fecha: { lt: hoy }, estado: 'PENDIENTE' },
        orderBy: { fecha: 'desc' },
        take: 10,
        include: { materia: RESUMEN_MATERIA },
      }),
      this.prisma.documento.count({ where: { pendienteDeEscribir: true } }),
    ]);

    const alertas: Alerta[] = [];

    for (const e of entregasVencidas) {
      alertas.push({
        tipo: 'entrega-vencida',
        gravedad: 'critica',
        titulo: e.titulo,
        detalle: `Venció hace ${dias(hoy, e.fecha)} días y sigue marcada como pendiente.`,
        enlace: '/evaluaciones',
        fecha: e.fecha,
        materia: e.materia,
      });
    }

    for (const e of entregasCerca) {
      const cuantos = dias(e.fecha, hoy);
      alertas.push({
        tipo: 'entrega-cerca',
        gravedad: cuantos <= 2 ? 'critica' : 'aviso',
        titulo: e.titulo,
        detalle: cuantos === 0 ? 'Es hoy.' : cuantos === 1 ? 'Es mañana.' : `Faltan ${cuantos} días.`,
        enlace: '/evaluaciones',
        fecha: e.fecha,
        materia: e.materia,
      });
    }

    if (notas.vacias > 0) {
      alertas.push({
        tipo: 'nota-vacia',
        gravedad: 'critica',
        titulo: `${notas.vacias} ${notas.vacias === 1 ? 'clase' : 'clases'} sin una sola nota`,
        detalle: 'Ya se dieron y su hoja sigue en blanco.',
        enlace: '/notas-pendientes',
      });
    }

    if (notas.cortas > 0) {
      alertas.push({
        tipo: 'nota-corta',
        gravedad: 'aviso',
        titulo: `${notas.cortas} ${notas.cortas === 1 ? 'clase' : 'clases'} con notas muy cortas`,
        detalle: `Tienen menos de ${limite} palabras: no alcanzan para estudiar de ahí.`,
        enlace: '/notas-pendientes',
      });
    }

    if (sinEscribir > 0) {
      alertas.push({
        tipo: 'sin-escribir',
        gravedad: 'aviso',
        titulo: `${sinEscribir} documentos editados sin volcar al .docx`,
        detalle: 'Los cambios están en la base pero no en el archivo de Word.',
        enlace: '/sync',
      });
    }

    const orden: Record<Gravedad, number> = { critica: 0, aviso: 1, informativa: 2 };
    alertas.sort((a, b) => orden[a.gravedad] - orden[b.gravedad]);

    return {
      umbral: limite,
      total: alertas.length,
      criticas: alertas.filter((a) => a.gravedad === 'critica').length,
      alertas,
      notas: {
        umbral: notas.umbral,
        cursadas: notas.cursadas,
        pendientes: notas.pendientes,
        alDia: notas.alDia,
        porcentajeAlDia: notas.porcentajeAlDia,
        vacias: notas.vacias,
        cortas: notas.cortas,
        porMateria: notas.porMateria,
      },
    };
  }
}
