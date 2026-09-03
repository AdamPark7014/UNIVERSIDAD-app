import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TipoBloque } from '../docx/docx.service';
import { BusquedaService } from '../busqueda/busqueda.service';

const ANDAMIAJE = ['TITULO', 'SUBTITULO', 'TEMA', 'SEPARADOR', 'ESPACIO', 'TAREA_PROPIA_TITULO'];
const PISTA = /^\(ideas que se me ocurren/i;

@Injectable()
export class DocumentosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly busqueda: BusquedaService,
  ) {}

  contarPalabras(bloques: { texto: string }[]): number {
    return bloques.reduce(
      (n, b) => n + (b.texto.trim() ? b.texto.trim().split(/\s+/).length : 0),
      0,
    );
  }

  contarPalabrasContenido(bloques: { tipo: string; texto: string }[]): number {
    return bloques
      .filter((b) => !ANDAMIAJE.includes(b.tipo) && b.texto && !PISTA.test(b.texto))
      .reduce((n, b) => n + b.texto.trim().split(/\s+/).length, 0);
  }

  async aplicarBloques(
    documentoId: string,
    bloquesEntrada: { tipo: TipoBloque; texto: string }[],
    opciones: { reindexar?: boolean } = {},
  ) {
    const doc = await this.prisma.documento.findUnique({
      where: { id: documentoId },
      include: { sesion: { select: { id: true, estado: true } } },
    });
    if (!doc) throw new NotFoundException('Documento no encontrado');

    const bloques = (bloquesEntrada ?? []).map((b, orden) => ({
      documentoId,
      orden,
      tipo: b.tipo as any,
      texto: b.texto ?? '',
    }));

    const palabras = this.contarPalabras(bloques);
    const palabrasContenido = this.contarPalabrasContenido(bloques);

    await this.prisma.$transaction([
      this.prisma.bloque.deleteMany({ where: { documentoId } }),
      this.prisma.bloque.createMany({ data: bloques }),
      this.prisma.documento.update({
        where: { id: documentoId },
        data: {
          pendienteDeEscribir: true,
          palabras,
          palabrasContenido,
          origen: 'EDITADO',
        },
      }),
    ]);

    if (doc.tipo === 'NOTAS' && doc.sesion.estado !== 'REVISADA') {
      const estado = palabrasContenido > 0 ? 'CURSADA' : 'PENDIENTE';
      await this.prisma.sesion.update({
        where: { id: doc.sesion.id },
        data: { estado },
      });
    }

    if (opciones.reindexar) {
      await this.busqueda.reindexar();
    }

    return this.prisma.documento.findUnique({
      where: { id: documentoId },
      include: { bloques: { orderBy: { orden: 'asc' } } },
    });
  }

  /** Deja solo cabecera + plantilla TAREA PROPIA. */
  plantillaVacia(notasBloques: { tipo: string; texto: string }[]): { tipo: TipoBloque; texto: string }[] {
    let i = 0;
    while (i < notasBloques.length && ['TITULO', 'SUBTITULO', 'TEMA'].includes(notasBloques[i].tipo)) {
      i++;
    }
    if (i > 0 && notasBloques[i]?.tipo === 'SEPARADOR') i++;

    const cabecera = notasBloques.slice(0, i).map((b) => ({
      tipo: b.tipo as TipoBloque,
      texto: b.texto,
    }));

    return [
      ...cabecera,
      { tipo: 'SEPARADOR', texto: '' },
      { tipo: 'TAREA_PROPIA_TITULO', texto: 'TAREA PROPIA' },
      {
        tipo: 'PARRAFO',
        texto: '(ideas que se me ocurren en clase para investigar por mi cuenta)',
      },
      { tipo: 'ESPACIO', texto: '' },
    ];
  }
}
