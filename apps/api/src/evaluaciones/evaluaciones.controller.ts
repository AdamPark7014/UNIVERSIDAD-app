import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const CON_MATERIA = {
  materia: {
    select: { id: true, codigo: true, clave: true, nombre: true, color: true },
  },
};

@Controller('evaluaciones')
export class EvaluacionesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  listar(
    @Query('materia') materia?: string,
    @Query('estado') estado?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.prisma.evaluacion.findMany({
      where: {
        ...(materia ? { materia: { codigo: materia } } : {}),
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
      orderBy: { fecha: 'asc' },
      include: CON_MATERIA,
    });
  }

  /** Lo que viene en los próximos N días. */
  @Get('proximas')
  proximas(@Query('dias') dias?: string) {
    const n = dias ? parseInt(dias, 10) : 21;
    const hoy = new Date();
    const hasta = new Date(hoy.getTime() + n * 86_400_000);
    return this.prisma.evaluacion.findMany({
      where: { fecha: { gte: hoy, lte: hasta }, estado: { not: 'CALIFICADA' } },
      orderBy: { fecha: 'asc' },
      include: CON_MATERIA,
    });
  }

  @Post()
  crear(
    @Body()
    dto: {
      materiaId: string;
      sesionId?: string;
      tipo: string;
      titulo: string;
      descripcion?: string;
      fecha: string;
      peso?: number;
    },
  ) {
    return this.prisma.evaluacion.create({
      data: {
        materiaId: dto.materiaId,
        sesionId: dto.sesionId ?? null,
        tipo: dto.tipo as any,
        titulo: dto.titulo,
        descripcion: dto.descripcion ?? null,
        fecha: new Date(dto.fecha),
        peso: dto.peso ?? null,
      },
      include: CON_MATERIA,
    });
  }

  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body()
    dto: {
      titulo?: string;
      descripcion?: string;
      fecha?: string;
      peso?: number;
      estado?: 'PENDIENTE' | 'EN_PROGRESO' | 'ENTREGADA' | 'CALIFICADA';
      calificacion?: number;
    },
  ) {
    return this.prisma.evaluacion.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.fecha ? { fecha: new Date(dto.fecha) } : {}),
        ...(dto.estado === 'ENTREGADA' ? { entregadaEn: new Date() } : {}),
      },
      include: CON_MATERIA,
    });
  }

  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.prisma.evaluacion.delete({ where: { id } });
  }
}
