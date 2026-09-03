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

@Controller('materias')
export class MateriasController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listar(@Query('semestre') codigo?: string) {
    const semestre = await this.semestre(codigo);
    return this.prisma.materia.findMany({
      where: { semestreId: semestre.id },
      orderBy: { orden: 'asc' },
      include: {
        horarios: { orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }] },
        criterios: true,
        _count: { select: { sesiones: true, evaluaciones: true, libros: true } },
      },
    });
  }

  @Get(':codigo')
  async detalle(@Param('codigo') codigo: string) {
    const materia = await this.prisma.materia.findFirst({
      where: { codigo },
      include: {
        horarios: { orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }] },
        criterios: true,
        libros: { orderBy: [{ esPrincipal: 'desc' }, { titulo: 'asc' }] },
        evaluaciones: { orderBy: { fecha: 'asc' } },
        sesiones: {
          orderBy: { fecha: 'asc' },
          include: {
            documentos: {
              select: {
                id: true,
                tipo: true,
                archivo: true,
                palabras: true,
                palabrasContenido: true,
                pendienteDeEscribir: true,
                origen: true,
                actualizadoEn: true,
              },
            },
            _count: { select: { tareas: true } },
          },
        },
      },
    });
    if (!materia) throw new NotFoundException(`No existe la materia ${codigo}`);
    return materia;
  }

  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body()
    dto: {
      profesor?: string;
      aula?: string;
      color?: string;
      notas?: string;
    },
  ) {
    return this.prisma.materia.update({ where: { id }, data: dto });
  }

  @Get(':codigo/libros')
  async libros(@Param('codigo') codigo: string) {
    const materia = await this.prisma.materia.findFirst({ where: { codigo } });
    if (!materia) throw new NotFoundException(`No existe la materia ${codigo}`);
    return this.prisma.libro.findMany({
      where: { materiaId: materia.id },
      orderBy: [{ esPrincipal: 'desc' }, { titulo: 'asc' }],
    });
  }

  private async semestre(codigo?: string) {
    const s = codigo
      ? await this.prisma.semestre.findUnique({ where: { codigo } })
      : await this.prisma.semestre.findFirst({ orderBy: { inicio: 'desc' } });
    if (!s) throw new NotFoundException('No hay semestre cargado. Corre el seed.');
    return s;
  }
}
