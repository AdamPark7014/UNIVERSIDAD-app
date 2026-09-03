import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { interpretarFecha, RangoFechas } from './fechas';

export interface Coincidencia {
  bloqueId: string;
  documentoId: string;
  documentoTipo: 'GUIA' | 'NOTAS';
  sesionId: string;
  fecha: Date;
  numero: number;
  tema: string;
  materiaCodigo: string;
  materiaClave: string;
  materiaNombre: string;
  materiaColor: string;
  tipoBloque: string;
  texto: string;
}

export interface ResultadoBusqueda {
  termino: string;
  modo: 'indice' | 'aproximada';
  total: number;
  /** Cómo se interpretó el término si hablaba de fechas: "10 de septiembre". */
  fecha: string | null;
  /** Clases que coinciden por tema, materia o fecha. */
  sesiones: any[];
  bloques: (Coincidencia & { extracto: string })[];
  tareas: any[];
  evaluaciones: any[];
  porMateria: { codigo: string; clave: string; nombre: string; color: string; n: number }[];
}

const COMBINANTES = /[̀-ͯ]/g;
const sinTildes = (s: string) => s.normalize('NFD').replace(COMBINANTES, '').toLowerCase();

/**
 * Búsqueda sobre el contenido de los documentos.
 *
 * Usa FTS5 de SQLite con `remove_diacritics`, así que "automata" encuentra
 * "autómata" y "Ubungsbuch" encuentra "Übungsbuch". El índice es una tabla
 * aparte que se reconstruye tras cada importación: con ~12 000 bloques tarda
 * milisegundos, y así no hay que mantener disparadores.
 */
@Injectable()
export class BusquedaService implements OnModuleInit {
  private readonly log = new Logger(BusquedaService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Los índices se preparan al arrancar; es idempotente. */
  async onModuleInit() {
    await this.asegurarIndice();
  }

  async asegurarIndice() {
    try {
      await this.prisma.$executeRawUnsafe(
        `CREATE VIRTUAL TABLE IF NOT EXISTS bloques_fts
         USING fts5(bloque_id UNINDEXED, texto,
                    tokenize = "unicode61 remove_diacritics 2")`,
      );
      const filas = await this.prisma.$queryRawUnsafe<{ n: number }[]>(
        `SELECT COUNT(*) AS n FROM bloques_fts`,
      );
      const n = Number(filas[0]?.n ?? 0);
      if (n === 0) await this.reindexar();
      else this.log.log(`Índice de búsqueda listo (${n} bloques)`);
    } catch (e: any) {
      this.log.warn(`No se pudo preparar el índice de búsqueda: ${e.message}`);
    }
  }

  /** Reconstruye el índice desde cero. Se llama al terminar una importación. */
  async reindexar(): Promise<number> {
    await this.prisma.$executeRawUnsafe(`DELETE FROM bloques_fts`);
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO bloques_fts (bloque_id, texto)
       SELECT id, texto FROM bloques WHERE texto <> ''`,
    );
    const filas = await this.prisma.$queryRawUnsafe<{ n: number }[]>(
      `SELECT COUNT(*) AS n FROM bloques_fts`,
    );
    const n = Number(filas[0]?.n ?? 0);
    this.log.log(`Índice de búsqueda reconstruido: ${n} bloques`);
    return n;
  }

  async buscar(
    termino: string,
    opciones: { materia?: string; tipo?: 'GUIA' | 'NOTAS'; limite?: number } = {},
  ): Promise<ResultadoBusqueda> {
    const q = termino.trim();
    const limite = Math.min(opciones.limite ?? 60, 200);

    if (q.length < 2) {
      return {
        termino: q,
        modo: 'indice',
        total: 0,
        fecha: null,
        sesiones: [],
        bloques: [],
        tareas: [],
        evaluaciones: [],
        porMateria: [],
      };
    }

    let modo: 'indice' | 'aproximada' = 'indice';
    let bloques = await this.porIndice(q, opciones, limite);

    // El índice tokeniza por palabra; para trozos sueltos se cae a una búsqueda
    // por subcadena, más lenta pero que encuentra de todo.
    if (bloques.length === 0) {
      modo = 'aproximada';
      bloques = await this.porSubcadena(q, opciones, limite);
    }

    const rango = interpretarFecha(q);
    const [sesiones, tareas, evaluaciones] = await Promise.all([
      this.buscarSesiones(q, rango, opciones),
      this.prisma.$queryRawUnsafe<any[]>(
        `SELECT t.id, t.texto, t.estado, s.id AS sesionId, s.fecha,
                m.codigo AS materiaCodigo, m.clave AS materiaClave,
                m.nombre AS materiaNombre, m.color AS materiaColor
         FROM tareas_propias t
         JOIN sesiones s ON s.id = t.sesionId
         JOIN materias m ON m.id = s.materiaId
         WHERE t.texto LIKE '%' || ? || '%'
         LIMIT 20`,
        q,
      ),
      this.prisma.$queryRawUnsafe<any[]>(
        `SELECT e.id, e.tipo, e.titulo, e.descripcion, e.fecha, e.peso, e.estado,
                m.codigo AS materiaCodigo, m.clave AS materiaClave,
                m.nombre AS materiaNombre, m.color AS materiaColor
         FROM evaluaciones e
         JOIN materias m ON m.id = e.materiaId
         WHERE e.titulo LIKE '%' || ? || '%'
            OR COALESCE(e.descripcion, '') LIKE '%' || ? || '%'
         ORDER BY e.fecha ASC
         LIMIT 20`,
        q,
        q,
      ),
    ]);

    const cuenta = new Map<string, any>();
    for (const b of bloques) {
      const actual = cuenta.get(b.materiaCodigo);
      if (actual) actual.n++;
      else
        cuenta.set(b.materiaCodigo, {
          codigo: b.materiaCodigo,
          clave: b.materiaClave,
          nombre: b.materiaNombre,
          color: b.materiaColor,
          n: 1,
        });
    }

    return {
      termino: q,
      modo,
      fecha: rango?.etiqueta ?? null,
      sesiones,
      total: bloques.length + tareas.length + evaluaciones.length + sesiones.length,
      bloques: bloques.map((b) => ({ ...b, extracto: this.extracto(b.texto, q) })),
      tareas: tareas.map((t) => this.anidarMateria(t, 'sesion')),
      evaluaciones: evaluaciones.map((e) => this.anidarMateria(e, 'materia')),
      porMateria: [...cuenta.values()].sort((a, b) => b.n - a.n),
    };
  }

  /**
   * Clases que encajan con el término: por tema, por nombre de materia, o por
   * fecha si el texto describe un día ("10 de septiembre", "miércoles", "hoy").
   */
  private async buscarSesiones(
    q: string,
    rango: RangoFechas | null,
    opciones: { materia?: string },
  ): Promise<any[]> {
    const where: any = {};
    if (opciones.materia) where.materia = { codigo: opciones.materia };

    if (rango) {
      where.fecha = { gte: rango.desde, lte: rango.hasta };
      if (rango.diaSemana !== undefined) where.diaSemana = rango.diaSemana;
    } else {
      where.OR = [
        { tema: { contains: q } },
        { materia: { nombre: { contains: q } } },
        { materia: { clave: { contains: q } } },
      ];
    }

    return this.prisma.sesion.findMany({
      where,
      orderBy: { fecha: 'asc' },
      take: rango ? 40 : 12,
      include: {
        materia: { select: { codigo: true, clave: true, nombre: true, color: true } },
        documentos: { select: { id: true, tipo: true, palabrasContenido: true } },
        evaluaciones: { select: { id: true, tipo: true, titulo: true } },
      },
    });
  }

  // ------------------------------------------------------------------ internos

  private readonly columnas = `
      b.id      AS bloqueId,
      b.tipo    AS tipoBloque,
      b.texto   AS texto,
      d.id      AS documentoId,
      d.tipo    AS documentoTipo,
      s.id      AS sesionId,
      s.fecha   AS fecha,
      s.numero  AS numero,
      s.tema    AS tema,
      m.codigo  AS materiaCodigo,
      m.clave   AS materiaClave,
      m.nombre  AS materiaNombre,
      m.color   AS materiaColor`;

  private filtros(opciones: { materia?: string; tipo?: string }, params: any[]) {
    const extra: string[] = [];
    if (opciones.materia) {
      extra.push('m.codigo = ?');
      params.push(opciones.materia);
    }
    if (opciones.tipo) {
      extra.push('d.tipo = ?');
      params.push(opciones.tipo);
    }
    return extra.length ? ` AND ${extra.join(' AND ')}` : '';
  }

  private async porIndice(
    q: string,
    opciones: { materia?: string; tipo?: 'GUIA' | 'NOTAS' },
    limite: number,
  ): Promise<Coincidencia[]> {
    // Cada palabra como prefijo: "lema bombe" encuentra "lema del bombeo".
    const consulta = q
      .split(/\s+/)
      .map((t) => t.replace(/["*()^:-]/g, ''))
      .filter(Boolean)
      .map((t) => `"${t}"*`)
      .join(' AND ');
    if (!consulta) return [];

    const params: any[] = [consulta];
    const extra = this.filtros(opciones, params);
    params.push(limite);

    try {
      return await this.prisma.$queryRawUnsafe<Coincidencia[]>(
        `SELECT ${this.columnas}
         FROM bloques_fts f
         JOIN bloques    b ON b.id = f.bloque_id
         JOIN documentos d ON d.id = b.documentoId
         JOIN sesiones   s ON s.id = d.sesionId
         JOIN materias   m ON m.id = s.materiaId
         WHERE bloques_fts MATCH ?${extra}
         ORDER BY bm25(bloques_fts), s.fecha
         LIMIT ?`,
        ...params,
      );
    } catch (e: any) {
      this.log.warn(`Búsqueda por índice falló, se usa subcadena: ${e.message}`);
      return [];
    }
  }

  private async porSubcadena(
    q: string,
    opciones: { materia?: string; tipo?: 'GUIA' | 'NOTAS' },
    limite: number,
  ): Promise<Coincidencia[]> {
    const params: any[] = [q];
    const extra = this.filtros(opciones, params);
    params.push(limite);

    return this.prisma.$queryRawUnsafe<Coincidencia[]>(
      `SELECT ${this.columnas}
       FROM bloques b
       JOIN documentos d ON d.id = b.documentoId
       JOIN sesiones   s ON s.id = d.sesionId
       JOIN materias   m ON m.id = s.materiaId
       WHERE b.texto <> '' AND b.texto LIKE '%' || ? || '%'${extra}
       ORDER BY s.fecha
       LIMIT ?`,
      ...params,
    );
  }

  /** Las consultas crudas vienen planas; el front espera la materia anidada. */
  private anidarMateria(fila: any, bajo: 'sesion' | 'materia') {
    const materia = {
      codigo: fila.materiaCodigo,
      clave: fila.materiaClave,
      nombre: fila.materiaNombre,
      color: fila.materiaColor,
    };
    if (bajo === 'materia') return { ...fila, materia };
    return { ...fila, sesion: { id: fila.sesionId, fecha: fila.fecha, materia } };
  }

  /** Recorta el texto alrededor de la primera aparición del término. */
  private extracto(texto: string, termino: string, ancho = 170): string {
    const palabra = termino.split(/\s+/)[0];
    const i = sinTildes(texto).indexOf(sinTildes(palabra));
    if (i === -1) {
      return texto.length > ancho ? texto.slice(0, ancho) + '…' : texto;
    }
    const desde = Math.max(0, i - Math.floor(ancho / 3));
    const hasta = Math.min(texto.length, desde + ancho);
    return (desde > 0 ? '…' : '') + texto.slice(desde, hasta) + (hasta < texto.length ? '…' : '');
  }
}
