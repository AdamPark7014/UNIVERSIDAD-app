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
  /** Fecha del examen asociado (ISO), si se pudo cruzar con evaluaciones. */
  fecha: string | null;
  diasRestantes: number | null;
  evaluacionTitulo: string | null;
}

@Controller('guias-examen')
export class GuiasExamenController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listar(@Query('materia') materia?: string): Promise<GuiaExamenDTO[]> {
    const materias = await this.prisma.materia.findMany({
      where: materia ? { codigo: materia } : undefined,
      include: {
        semestre: { select: { raizDocumentos: true } },
        evaluaciones: {
          where: { tipo: { in: ['PARCIAL', 'FINAL', 'QUIZ'] } },
          select: { id: true, tipo: true, titulo: true, fecha: true },
          orderBy: { fecha: 'asc' },
        },
      },
      orderBy: { orden: 'asc' },
    });

    const partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Mexico_City',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const num = (t: string) => Number(partes.find((p) => p.type === t)?.value);
    const hoyUtc = Date.UTC(num('year'), num('month') - 1, num('day'));

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
        const match = emparejarEvaluacion(titulo, tipo, m.evaluaciones);
        const fechaIso = match?.fecha?.toISOString() ?? null;
        let diasRestantes: number | null = null;
        if (match?.fecha) {
          const f = match.fecha;
          const a = Date.UTC(f.getUTCFullYear(), f.getUTCMonth(), f.getUTCDate());
          diasRestantes = Math.round((a - hoyUtc) / 86_400_000);
        }
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
          fecha: fechaIso,
          diasRestantes,
          evaluacionTitulo: match?.titulo ?? null,
        });
      }
    }

    // Más cercanos primero; sin fecha al final
    const pesoTipo = (t: string) =>
      t === 'PARCIAL' || t === 'FINAL' ? 0 : t === 'QUIZ' ? 1 : 2;
    out.sort((a, b) => {
      const da = a.diasRestantes ?? 9999;
      const db = b.diasRestantes ?? 9999;
      // próximos (incl. hoy) antes que pasados
      const pa = da < 0 ? 10000 - da : da;
      const pb = db < 0 ? 10000 - db : db;
      return (
        pa - pb ||
        pesoTipo(a.tipo) - pesoTipo(b.tipo) ||
        a.materiaNombre.localeCompare(b.materiaNombre, 'es') ||
        a.titulo.localeCompare(b.titulo, 'es')
      );
    });
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
  if (!m) {
    // Banco-Ejercicios-Evaluacion-1-RESUELTO.pdf → tipo OTRO, título limpio
    return { titulo: base.replace(/-/g, ' '), tipo: 'OTRO' };
  }
  return {
    tipo: m[1].toUpperCase(),
    titulo: m[2].replace(/-/g, ' ').replace(/\s+/g, ' ').trim(),
  };
}

function normalizarTitulo(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(papel|resuelto|banco|ejercicios|guia|mega|de estudio)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function emparejarEvaluacion(
  tituloGuia: string,
  tipoGuia: string,
  evaluaciones: { tipo: string; titulo: string; fecha: Date }[],
) {
  if (!evaluaciones.length) return null;
  const ng = normalizarTitulo(tituloGuia);

  // 1) mismo tipo + título contenido (Examen 1 PAPEL → Examen 1)
  const mismosTipo =
    tipoGuia === 'OTRO'
      ? evaluaciones
      : evaluaciones.filter((e) => e.tipo === tipoGuia);

  let mejor: { tipo: string; titulo: string; fecha: Date; score: number } | null = null;
  for (const e of mismosTipo.length ? mismosTipo : evaluaciones) {
    const ne = normalizarTitulo(e.titulo);
    let score = 0;
    if (ng === ne) score = 100;
    else if (ng.includes(ne) || ne.includes(ng)) score = 80;
    else {
      // tokens compartidos (examen, 1) / (evaluacion, 1)
      const tg = new Set(ng.split(' ').filter((t) => t.length > 0));
      const te = new Set(ne.split(' ').filter((t) => t.length > 0));
      let inter = 0;
      for (const t of tg) if (te.has(t)) inter++;
      score = inter * 20;
      // bonus número de examen
      const numG = ng.match(/\b(\d+)\b/)?.[1];
      const numE = ne.match(/\b(\d+)\b/)?.[1];
      if (numG && numE && numG === numE) score += 25;
    }
    if (!mejor || score > mejor.score) mejor = { ...e, score };
  }
  return mejor && mejor.score >= 40 ? mejor : null;
}
