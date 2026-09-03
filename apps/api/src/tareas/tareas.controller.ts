import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const CON_SESION = {
  sesion: {
    select: {
      id: true,
      fecha: true,
      numero: true,
      tema: true,
      materia: {
        select: { id: true, codigo: true, clave: true, nombre: true, color: true },
      },
    },
  },
};

@Controller('tareas')
export class TareasController {
  constructor(private readonly prisma: PrismaService) {}

  /** Todas las tareas propias del semestre, filtrables por estado y materia. */
  @Get()
  listar(
    @Query('estado') estado?: string,
    @Query('materia') materia?: string,
    @Query('limite') limite?: string,
  ) {
    return this.prisma.tareaPropia.findMany({
      where: {
        ...(estado ? { estado: estado as any } : {}),
        ...(materia ? { sesion: { materia: { codigo: materia } } } : {}),
      },
      orderBy: [{ estado: 'asc' }, { creadoEn: 'desc' }],
      take: limite ? parseInt(limite, 10) : undefined,
      include: CON_SESION,
    });
  }

  @Get('resumen')
  async resumen() {
    const porEstado = await this.prisma.tareaPropia.groupBy({
      by: ['estado'],
      _count: { _all: true },
    });
    return porEstado.reduce<Record<string, number>>((acc, r) => {
      acc[r.estado] = r._count._all;
      return acc;
    }, {});
  }

  @Post()
  crear(@Body() dto: { sesionId: string; texto: string; fechaLimite?: string }) {
    return this.prisma.tareaPropia.create({
      data: {
        sesionId: dto.sesionId,
        texto: dto.texto,
        fechaLimite: dto.fechaLimite ? new Date(dto.fechaLimite) : null,
      },
      include: CON_SESION,
    });
  }

  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body()
    dto: {
      texto?: string;
      estado?: 'ABIERTA' | 'EN_PROGRESO' | 'HECHA' | 'DESCARTADA';
      resultado?: string;
      fechaLimite?: string | null;
    },
  ) {
    return this.prisma.tareaPropia.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.fechaLimite !== undefined
          ? { fechaLimite: dto.fechaLimite ? new Date(dto.fechaLimite) : null }
          : {}),
        ...(dto.estado === 'HECHA' ? { completadaEn: new Date() } : {}),
        ...(dto.estado && dto.estado !== 'HECHA' ? { completadaEn: null } : {}),
      },
      include: CON_SESION,
    });
  }

  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.prisma.tareaPropia.delete({ where: { id } });
  }
}
