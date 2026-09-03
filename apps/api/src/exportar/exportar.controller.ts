import { Controller, Get, NotFoundException, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { DocxService, TipoBloque } from '../docx/docx.service';

type Bloque = { tipo: TipoBloque; texto: string };

const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

@Controller('exportar')
export class ExportarController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly docx: DocxService,
  ) {}

  /**
   * Compila en un solo .docx todo el material de una materia, para estudiar o
   * imprimir sin ir abriendo cincuenta archivos.
   *
   *   /api/exportar/materia/teo?tipo=GUIA
   *   /api/exportar/materia/teo?tipo=AMBOS&desde=2026-09-01&hasta=2026-10-15
   */
  @Get('materia/:codigo')
  async materia(
    @Param('codigo') codigo: string,
    @Res() res: Response,
    @Query('tipo') tipo: 'GUIA' | 'NOTAS' | 'AMBOS' = 'GUIA',
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    const materia = await this.prisma.materia.findFirst({
      where: { codigo },
      include: {
        semestre: true,
        horarios: true,
        criterios: true,
        evaluaciones: { orderBy: { fecha: 'asc' } },
      },
    });
    if (!materia) throw new NotFoundException(`No existe la materia ${codigo}`);

    const sesiones = await this.prisma.sesion.findMany({
      where: {
        materiaId: materia.id,
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
      include: {
        documentos: {
          where: tipo === 'AMBOS' ? {} : { tipo },
          include: { bloques: { orderBy: { orden: 'asc' } } },
          orderBy: { tipo: 'asc' },
        },
      },
    });

    const bloques: Bloque[] = [
      { tipo: 'TITULO', texto: materia.nombre },
      {
        tipo: 'SUBTITULO',
        texto:
          `${materia.clave}` +
          (materia.claveOficial ? ` · ${materia.claveOficial}` : '') +
          (materia.profesor ? ` · ${materia.profesor}` : '') +
          ` · ${materia.semestre.nombre}`,
      },
      { tipo: 'SEPARADOR', texto: '' },
    ];

    // Portada útil: horario, criterios y fechas, para no buscarlos aparte.
    if (materia.horarios.length) {
      bloques.push({ tipo: 'ENCABEZADO', texto: 'HORARIO' });
      for (const h of materia.horarios) {
        bloques.push({
          tipo: 'VINETA',
          texto: `${DIAS[h.diaSemana]} de ${h.horaInicio} a ${h.horaFin}${h.aula ? ` — ${h.aula}` : ''}`,
        });
      }
    }
    if (materia.criterios.length) {
      bloques.push({ tipo: 'ENCABEZADO', texto: 'CRITERIOS DE EVALUACIÓN' });
      for (const c of materia.criterios) {
        const pct = Number(c.porcentaje);
        bloques.push({
          tipo: 'VINETA',
          texto: `${c.concepto}${pct > 0 ? ` — ${pct}%` : ''}${c.notas ? ` (${c.notas})` : ''}`,
        });
      }
    }
    if (materia.evaluaciones.length) {
      bloques.push({ tipo: 'ENCABEZADO', texto: 'FECHAS' });
      for (const e of materia.evaluaciones) {
        bloques.push({
          tipo: 'VINETA',
          texto: `${this.fecha(e.fecha)} — ${e.titulo}${e.peso ? ` (${Number(e.peso)}%)` : ''}`,
        });
      }
    }

    bloques.push({ tipo: 'ESPACIO', texto: '' });
    bloques.push({ tipo: 'SEPARADOR', texto: '' });

    let incluidas = 0;
    for (const s of sesiones) {
      const conContenido = s.documentos.filter((d) =>
        d.bloques.some((b) => b.texto.trim().length > 0),
      );
      if (!conContenido.length) continue;
      incluidas++;

      bloques.push({ tipo: 'ESPACIO', texto: '' });
      bloques.push({
        tipo: 'TEMA',
        texto: `Sesión ${s.numero} · ${this.fecha(s.fecha)} — ${s.tema}`,
      });

      for (const d of conContenido) {
        if (tipo === 'AMBOS') {
          bloques.push({
            tipo: 'ENCABEZADO',
            texto: d.tipo === 'GUIA' ? '— GUÍA —' : '— MIS NOTAS —',
          });
        }
        // El título y el subtítulo de cada documento sobran aquí: la sesión ya
        // trae su propio encabezado.
        for (const b of d.bloques) {
          if (b.tipo === 'TITULO' || b.tipo === 'SUBTITULO' || b.tipo === 'TEMA') continue;
          if (b.tipo === 'ESPACIO' && !b.texto) continue;
          bloques.push({ tipo: b.tipo as TipoBloque, texto: b.texto });
        }
      }
      bloques.push({ tipo: 'SEPARADOR', texto: '' });
    }

    if (!incluidas) {
      throw new NotFoundException(
        'No hay contenido para exportar con ese filtro. ¿Ya importaste los documentos?',
      );
    }

    const buffer = await this.docx.aBuffer(bloques);
    const etiqueta = tipo === 'AMBOS' ? 'completo' : tipo.toLowerCase();
    const nombre = `${materia.clave} ${materia.nombre} — ${etiqueta}.docx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(nombre)}`,
    );
    res.setHeader('Content-Length', String(buffer.byteLength));
    res.end(buffer);
  }

  /** Todas las tareas propias pendientes, en un solo documento. */
  @Get('tareas')
  async tareas(@Res() res: Response, @Query('estado') estado?: string) {
    const tareas = await this.prisma.tareaPropia.findMany({
      where: estado ? { estado: estado as any } : { estado: { in: ['ABIERTA', 'EN_PROGRESO'] } },
      orderBy: [{ sesion: { fecha: 'asc' } }],
      include: {
        sesion: {
          select: {
            fecha: true,
            tema: true,
            materia: { select: { clave: true, nombre: true } },
          },
        },
      },
    });

    const bloques: Bloque[] = [
      { tipo: 'TITULO', texto: 'Tareas propias' },
      {
        tipo: 'SUBTITULO',
        texto: `${tareas.length} ideas por investigar · generado el ${this.fecha(new Date())}`,
      },
      { tipo: 'SEPARADOR', texto: '' },
    ];

    let materiaActual = '';
    for (const t of tareas) {
      const clave = t.sesion.materia.clave;
      if (clave !== materiaActual) {
        materiaActual = clave;
        bloques.push({ tipo: 'ENCABEZADO', texto: t.sesion.materia.nombre.toUpperCase() });
      }
      bloques.push({
        tipo: 'VINETA',
        texto: `${t.texto}  (${this.fecha(t.sesion.fecha)} — ${t.sesion.tema})`,
      });
      if (t.resultado) {
        bloques.push({ tipo: 'PARRAFO', texto: `   → ${t.resultado}` });
      }
    }

    const buffer = await this.docx.aBuffer(bloques);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent('Tareas propias.docx')}`,
    );
    res.end(buffer);
  }

  private fecha(d: Date) {
    return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
  }
}
