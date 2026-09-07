import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { createReadStream, promises as fs } from 'node:fs';
import * as path from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import type { Response } from 'express';

export interface GuiaExamenDTO {
  materiaCodigo: string;
  materiaClave: string;
  materiaNombre: string;
  materiaColor: string;
  archivo: string;
  titulo: string;
  tipo: string;
  rutaRelativa: string;
  tamanoBytes: number;
  modificadoEn: string;
  url: string;
}

@Controller('guias-examen')
export class GuiasExamenController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listar(@Query('materia') materia?: string): Promise<GuiaExamenDTO[]> {
    const materias = await this.prisma.materia.findMany({
      where: materia ? { codigo: materia } : undefined,
      include: { semestre: { select: { raizDocumentos: true } } },
      orderBy: { orden: 'asc' },
    });

    const out: GuiaExamenDTO[] = [];
    for (const m of materias) {
      const carpeta = path.join(m.semestre.raizDocumentos, m.carpeta, 'Docs', 'Guias-estudio');
      let archivos: string[] = [];
      try {
        archivos = (await fs.readdir(carpeta)).filter((f) => {
          const low = f.toLowerCase();
          if (low.endsWith('.bak') || low.startsWith('~$')) return false;
          return low.endsWith('.docx') || low.endsWith('.pdf');
        });
      } catch {
        continue;
      }

      for (const archivo of archivos.sort()) {
        const ruta = path.join(carpeta, archivo);
        const st = await fs.stat(ruta);
        const { titulo, tipo } = parseNombreGuia(archivo);
        out.push({
          materiaCodigo: m.codigo,
          materiaClave: m.clave,
          materiaNombre: m.nombre,
          materiaColor: m.color,
          archivo,
          titulo,
          tipo,
          rutaRelativa: path.join(m.carpeta, 'Docs', 'Guias-estudio', archivo),
          tamanoBytes: st.size,
          modificadoEn: st.mtime.toISOString(),
          url: `/api/guias-examen/${m.codigo}/${encodeURIComponent(archivo)}`,
        });
      }
    }

    // Exámenes / parciales primero, luego quizzes, por nombre
    const pesoTipo = (t: string) =>
      t === 'PARCIAL' || t === 'FINAL' ? 0 : t === 'QUIZ' ? 1 : 2;
    out.sort(
      (a, b) =>
        pesoTipo(a.tipo) - pesoTipo(b.tipo) ||
        a.materiaNombre.localeCompare(b.materiaNombre, 'es') ||
        a.titulo.localeCompare(b.titulo, 'es'),
    );
    return out;
  }

  @Get(':materia/:archivo')
  @Header('Cache-Control', 'private, max-age=60')
  async descargar(
    @Param('materia') materiaCodigo: string,
    @Param('archivo') archivoRaw: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const archivo = decodeURIComponent(archivoRaw);
    if (archivo.includes('..') || archivo.includes('/') || archivo.includes('\\')) {
      throw new NotFoundException('Archivo inválido');
    }
    if (
      !archivo.toLowerCase().endsWith('.docx') &&
      !archivo.toLowerCase().endsWith('.pdf')
    ) {
      throw new NotFoundException('Solo .docx o .pdf');
    }

    const m = await this.prisma.materia.findFirst({
      where: { codigo: materiaCodigo },
      include: { semestre: { select: { raizDocumentos: true } } },
    });
    if (!m) throw new NotFoundException('Materia no encontrada');

    const ruta = path.join(
      m.semestre.raizDocumentos,
      m.carpeta,
      'Docs',
      'Guias-estudio',
      archivo,
    );
    try {
      await fs.access(ruta);
    } catch {
      throw new NotFoundException('Guía no encontrada');
    }

    const esPdf = archivo.toLowerCase().endsWith('.pdf');
    res.set({
      'Content-Type': esPdf
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `inline; filename="${archivo}"`,
    });
    return new StreamableFile(createReadStream(ruta));
  }
}

function parseNombreGuia(archivo: string): { titulo: string; tipo: string } {
  const base = archivo.replace(/\.(docx|pdf)$/i, '');
  const m = base.match(/^(PARCIAL|FINAL|QUIZ)-(.+)$/i);
  if (!m) return { titulo: base.replace(/-/g, ' '), tipo: 'OTRO' };
  return {
    tipo: m[1].toUpperCase(),
    titulo: m[2].replace(/-/g, ' ').replace(/\s+/g, ' ').trim(),
  };
}
