import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const RESUMEN_MATERIA = {
  select: {
    id: true,
    codigo: true,
    clave: true,
    nombre: true,
    color: true,
    carpeta: true,
    esLaboratorio: true,
  },
};

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async resumen(@Query('hoy') hoyIso?: string) {
    const semestre = await this.prisma.semestre.findFirst({
      orderBy: { inicio: 'desc' },
    });
    if (!semestre) throw new NotFoundException('No hay semestre cargado.');

    const hoy = hoyIso ? new Date(hoyIso) : new Date();
    const soloFecha = new Date(
      Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()),
    );

    const [
      materias,
      sesiones,
      documentos,
      cursadas,
      notasVacias,
      tareasAbiertas,
      pendientesDeEscribir,
      proximasSesiones,
      proximasEvaluaciones,
      listaTareas,
      sesionesHoy,
      deuda,
    ] = await Promise.all([
      this.prisma.materia.count({ where: { semestreId: semestre.id } }),
      this.prisma.sesion.count(),
      this.prisma.documento.count(),
      this.prisma.sesion.count({ where: { estado: { not: 'PENDIENTE' } } }),
      this.prisma.documento.count({ where: { tipo: 'NOTAS', palabrasContenido: 0 } }),
      this.prisma.tareaPropia.count({ where: { estado: { in: ['ABIERTA', 'EN_PROGRESO'] } } }),
      this.prisma.documento.count({ where: { pendienteDeEscribir: true } }),
      this.prisma.sesion.findMany({
        where: { fecha: { gt: soloFecha } },
        orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }],
        take: 6,
        include: {
          materia: RESUMEN_MATERIA,
          documentos: { select: { id: true, tipo: true, palabras: true, palabrasContenido: true } },
        },
      }),
      this.prisma.evaluacion.findMany({
        where: { fecha: { gte: soloFecha }, estado: { not: 'CALIFICADA' } },
        orderBy: { fecha: 'asc' },
        take: 8,
        include: { materia: RESUMEN_MATERIA },
      }),
      this.prisma.tareaPropia.findMany({
        where: { estado: { in: ['ABIERTA', 'EN_PROGRESO'] } },
        orderBy: { creadoEn: 'desc' },
        take: 10,
        include: {
          sesion: {
            select: {
              id: true,
              fecha: true,
              numero: true,
              materia: RESUMEN_MATERIA,
            },
          },
        },
      }),
      this.prisma.sesion.findMany({
        where: { fecha: soloFecha },
        orderBy: { horaInicio: 'asc' },
        include: {
          materia: RESUMEN_MATERIA,
          documentos: { select: { id: true, tipo: true, palabras: true, palabrasContenido: true } },
        },
      }),
      // La deuda real: clases que YA ocurrieron y siguen sin apuntes. Una nota
      // vacía de una clase futura no es un pendiente, es lo esperado.
      this.prisma.sesion.findMany({
        where: {
          fecha: { lt: soloFecha },
          documentos: { some: { tipo: 'NOTAS', palabrasContenido: 0 } },
        },
        orderBy: { fecha: 'desc' },
        take: 12,
        include: {
          materia: RESUMEN_MATERIA,
          documentos: { select: { id: true, tipo: true, palabras: true, palabrasContenido: true } },
        },
      }),
    ]);

    const deudaTotal = await this.prisma.sesion.count({
      where: {
        fecha: { lt: soloFecha },
        documentos: { some: { tipo: 'NOTAS', palabrasContenido: 0 } },
      },
    });

    const totalSemanas = this.semanasEntre(semestre.inicio, semestre.fin);
    const semanaActual = Math.min(
      Math.max(this.semanaDe(semestre.inicio, soloFecha), 1),
      totalSemanas,
    );

    return {
      semestre: {
        codigo: semestre.codigo,
        nombre: semestre.nombre,
        inicio: semestre.inicio,
        fin: semestre.fin,
        finalesDesde: semestre.finalesDesde,
        finalesHasta: semestre.finalesHasta,
        semanaActual,
        totalSemanas,
        avance: Math.round((semanaActual / totalSemanas) * 100),
      },
      totales: {
        materias,
        sesiones,
        documentos,
        sesionesCursadas: cursadas,
        notasVacias,
        tareasAbiertas,
        pendientesDeEscribir,
        deuda: deudaTotal,
      },
      sesionesHoy,
      deuda,
      proximasSesiones,
      proximasEvaluaciones,
      tareasAbiertas: listaTareas,
    };
  }

  /** Avance por materia: cuántas sesiones llevan notas escritas. */
  @Get('avance')
  async avance() {
    const materias = await this.prisma.materia.findMany({
      orderBy: { orden: 'asc' },
      include: {
        sesiones: {
          select: {
            id: true,
            estado: true,
            documentos: { select: { tipo: true, palabras: true, palabrasContenido: true } },
          },
        },
      },
    });

    return materias.map((m) => {
      const total = m.sesiones.length;
      const conNotas = m.sesiones.filter((s) =>
        s.documentos.some((d) => d.tipo === 'NOTAS' && d.palabrasContenido > 0),
      ).length;
      const cursadas = m.sesiones.filter((s) => s.estado !== 'PENDIENTE').length;
      return {
        id: m.id,
        codigo: m.codigo,
        clave: m.clave,
        nombre: m.nombre,
        color: m.color,
        total,
        conNotas,
        cursadas,
        porcentaje: total ? Math.round((conNotas / total) * 100) : 0,
      };
    });
  }

  private semanaDe(inicio: Date, fecha: Date) {
    const lunes = new Date(inicio);
    lunes.setUTCDate(lunes.getUTCDate() - ((lunes.getUTCDay() + 6) % 7));
    return Math.floor((fecha.getTime() - lunes.getTime()) / (7 * 86_400_000)) + 1;
  }

  private semanasEntre(inicio: Date, fin: Date) {
    return Math.max(1, Math.ceil((fin.getTime() - inicio.getTime()) / (7 * 86_400_000)));
  }
}
