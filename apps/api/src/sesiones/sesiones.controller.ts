import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
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

@Controller('sesiones')
export class SesionesController {
  constructor(private readonly prisma: PrismaService) {}

  /** Listado filtrable: por materia, por rango de fechas o por semana. */
  @Get()
  listar(
    @Query('materia') materia?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('semana') semana?: string,
    @Query('estado') estado?: string,
    @Query('limite') limite?: string,
  ) {
    return this.prisma.sesion.findMany({
      where: {
        ...(materia ? { materia: { codigo: materia } } : {}),
        ...(semana ? { semana: parseInt(semana, 10) } : {}),
        ...(estado ? { estado: estado as any } : {}),
        ...(desde || hasta
          ? {
              fecha: {
                ...(desde ? { gte: new Date(desde) } : {}),
                ...(hasta ? { lte: new Date(hasta) } : {}),
              },
            }
          : {}),
      },
      orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }],
      take: limite ? parseInt(limite, 10) : undefined,
      include: {
        materia: RESUMEN_MATERIA,
        documentos: {
          select: {
            id: true,
            tipo: true,
            archivo: true,
            palabras: true, palabrasContenido: true,
            pendienteDeEscribir: true,
          },
        },
        _count: { select: { tareas: true } },
      },
    });
  }

  /** El día completo: todas las clases de una fecha, en orden de horario. */
  @Get('dia/:fecha')
  dia(@Param('fecha') fecha: string) {
    const d = new Date(fecha);
    return this.prisma.sesion.findMany({
      where: { fecha: d },
      orderBy: { horaInicio: 'asc' },
      include: {
        materia: RESUMEN_MATERIA,
        documentos: {
          select: { id: true, tipo: true, archivo: true, palabras: true, palabrasContenido: true },
        },
        tareas: { orderBy: { orden: 'asc' } },
        evaluaciones: true,
      },
    });
  }

  @Get(':id')
  async detalle(@Param('id') id: string) {
    const sesion = await this.prisma.sesion.findUnique({
      where: { id },
      include: {
        materia: {
          include: { horarios: true },
        },
        documentos: {
          include: { bloques: { orderBy: { orden: 'asc' } } },
          orderBy: { tipo: 'asc' },
        },
        tareas: { orderBy: { orden: 'asc' } },
        evaluaciones: true,
      },
    });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');

    // sesión anterior y siguiente de la misma materia, para navegar
    const [anterior, siguiente] = await Promise.all([
      this.prisma.sesion.findFirst({
        where: { materiaId: sesion.materiaId, fecha: { lt: sesion.fecha } },
        orderBy: { fecha: 'desc' },
        select: { id: true, fecha: true, numero: true, tema: true },
      }),
      this.prisma.sesion.findFirst({
        where: { materiaId: sesion.materiaId, fecha: { gt: sesion.fecha } },
        orderBy: { fecha: 'asc' },
        select: { id: true, fecha: true, numero: true, tema: true },
      }),
    ]);

    return { ...sesion, anterior, siguiente };
  }

  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body()
    dto: {
      tema?: string;
      estado?: 'PENDIENTE' | 'CURSADA' | 'REVISADA';
      destacada?: boolean;
      asistio?: boolean | null;
    },
  ) {
    return this.prisma.sesion.update({ where: { id }, data: dto });
  }
}
