import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('calendario')
export class CalendarioController {
  constructor(private readonly prisma: PrismaService) {}

  /** Semana por semana, con las sesiones y evaluaciones de cada día. */
  @Get()
  async calendario(@Query('semana') semanaQuery?: string) {
    const semestre = await this.prisma.semestre.findFirst({
      orderBy: { inicio: 'desc' },
    });
    if (!semestre) throw new NotFoundException('No hay semestre cargado.');

    const where = semanaQuery ? { semana: parseInt(semanaQuery, 10) } : {};

    const [sesiones, evaluaciones, noLectivos] = await Promise.all([
      this.prisma.sesion.findMany({
        where,
        orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }],
        include: {
          materia: {
            select: { id: true, codigo: true, clave: true, nombre: true, color: true },
          },
          documentos: { select: { id: true, tipo: true, palabras: true, palabrasContenido: true } },
        },
      }),
      this.prisma.evaluacion.findMany({
        orderBy: { fecha: 'asc' },
        include: {
          materia: { select: { codigo: true, clave: true, nombre: true, color: true } },
        },
      }),
      this.prisma.diaNoLectivo.findMany({
        where: { semestreId: semestre.id },
        orderBy: { fecha: 'asc' },
      }),
    ]);

    // agrupar por semana y por día
    const semanas = new Map<number, Map<string, any>>();
    for (const s of sesiones) {
      const dia = s.fecha.toISOString().slice(0, 10);
      if (!semanas.has(s.semana)) semanas.set(s.semana, new Map());
      const mapaDias = semanas.get(s.semana)!;
      if (!mapaDias.has(dia)) {
        mapaDias.set(dia, { fecha: dia, diaSemana: s.diaSemana, sesiones: [], evaluaciones: [] });
      }
      mapaDias.get(dia).sesiones.push(s);
    }
    for (const e of evaluaciones) {
      const dia = e.fecha.toISOString().slice(0, 10);
      for (const mapaDias of semanas.values()) {
        if (mapaDias.has(dia)) mapaDias.get(dia).evaluaciones.push(e);
      }
    }

    // La semana en curso, para que la pantalla abra donde el alumno está.
    const hoy = new Date();
    const soloFecha = new Date(
      Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()),
    );
    const lunes = new Date(semestre.inicio);
    lunes.setUTCDate(lunes.getUTCDate() - ((lunes.getUTCDay() + 6) % 7));
    const semanaActual = Math.floor(
      (soloFecha.getTime() - lunes.getTime()) / (7 * 86_400_000),
    ) + 1;

    return {
      semestre: {
        codigo: semestre.codigo,
        nombre: semestre.nombre,
        inicio: semestre.inicio,
        fin: semestre.fin,
        semanaActual,
      },
      diasNoLectivos: noLectivos,
      semanas: [...semanas.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([numero, dias]) => ({
          numero,
          dias: [...dias.values()].sort((a, b) => a.fecha.localeCompare(b.fecha)),
        })),
    };
  }

  /** El horario semanal fijo, como la tabla original. */
  @Get('horario')
  async horario() {
    const materias = await this.prisma.materia.findMany({
      orderBy: { orden: 'asc' },
      include: { horarios: true },
    });

    const rejilla: Record<number, any[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };
    for (const m of materias) {
      for (const h of m.horarios) {
        rejilla[h.diaSemana]?.push({
          materiaId: m.id,
          codigo: m.codigo,
          clave: m.clave,
          nombre: m.nombre,
          color: m.color,
          aula: h.aula ?? m.aula,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin,
        });
      }
    }
    for (const d of Object.keys(rejilla)) {
      rejilla[+d].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    }
    return rejilla;
  }
}
