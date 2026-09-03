import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { createReadStream } from 'node:fs';
import { promises as fs } from 'node:fs';
import { PrismaService } from '../prisma/prisma.service';
import { DocxService, TipoBloque } from '../docx/docx.service';
import { SyncService } from '../sync/sync.service';
import { DocumentosService } from './documentos.service';

interface BloqueEntrada {
  tipo: TipoBloque;
  texto: string;
}

@Controller('documentos')
export class DocumentosController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly docx: DocxService,
    private readonly sync: SyncService,
    private readonly documentos: DocumentosService,
  ) {}

  @Get(':id')
  async detalle(@Param('id') id: string) {
    const doc = await this.buscar(id);
    return {
      ...doc,
      html: this.docx.aHtml(
        doc.bloques.map((b) => ({ tipo: b.tipo as TipoBloque, texto: b.texto })),
      ),
    };
  }

  @Get(':id/html')
  async html(@Param('id') id: string) {
    const doc = await this.buscar(id);
    return {
      html: this.docx.aHtml(
        doc.bloques.map((b) => ({ tipo: b.tipo as TipoBloque, texto: b.texto })),
      ),
    };
  }

  @Get(':id/archivo')
  async archivo(@Param('id') id: string, @Res() res: Response) {
    const doc = await this.prisma.documento.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    try {
      await fs.access(doc.ruta);
    } catch {
      throw new NotFoundException(`El archivo ya no está en disco: ${doc.ruta}`);
    }
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(doc.archivo)}"`,
    );
    createReadStream(doc.ruta).pipe(res);
  }

  @Put(':id/bloques')
  async reemplazarBloques(
    @Param('id') id: string,
    @Body() dto: { bloques: BloqueEntrada[] },
  ) {
    const doc = await this.prisma.documento.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Documento no encontrado');

    return this.documentos.aplicarBloques(
      id,
      (dto.bloques ?? []).map((b) => ({
        tipo: b.tipo,
        texto: b.texto ?? '',
      })),
      { reindexar: true },
    );
  }

  @Post(':id/guardar')
  guardar(@Param('id') id: string) {
    return this.sync.escribirDocumento(id);
  }

  @Post(':id/recargar')
  async recargar(@Param('id') id: string) {
    const doc = await this.prisma.documento.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Documento no encontrado');

    const leido = await this.docx.leer(doc.ruta);
    await this.prisma.$transaction([
      this.prisma.bloque.deleteMany({ where: { documentoId: id } }),
      this.prisma.bloque.createMany({
        data: leido.bloques.map((b) => ({
          documentoId: id,
          orden: b.orden,
          tipo: b.tipo as any,
          texto: b.texto,
        })),
      }),
      this.prisma.documento.update({
        where: { id },
        data: {
          hash: leido.hash,
          palabras: leido.palabras,
          palabrasContenido: leido.palabrasContenido,
          tamanoBytes: leido.tamanoBytes,
          archivoModificadoEn: leido.modificadoEn,
          pendienteDeEscribir: false,
          origen: 'IMPORTADO',
        },
      }),
    ]);

    const sesion = await this.prisma.sesion.findFirst({
      where: { documentos: { some: { id } } },
      select: { id: true, estado: true },
    });
    if (doc.tipo === 'NOTAS' && sesion && sesion.estado !== 'REVISADA') {
      const estado = leido.palabrasContenido > 0 ? 'CURSADA' : 'PENDIENTE';
      await this.prisma.sesion.update({ where: { id: sesion.id }, data: { estado } });
    }

    return this.buscar(id);
  }

  /** Vacía el contenido editable y deja la plantilla en blanco. */
  @Post(':id/vaciar')
  async vaciar(@Param('id') id: string) {
    const doc = await this.buscar(id);
    if (doc.tipo !== 'NOTAS') {
      throw new NotFoundException('Solo se puede vaciar documentos de NOTAS');
    }
    const bloques = this.documentos.plantillaVacia(
      doc.bloques.map((b) => ({ tipo: b.tipo, texto: b.texto })),
    );
    const actualizado = await this.documentos.aplicarBloques(id, bloques, { reindexar: true });
    await this.sync.escribirDocumento(id);
    return actualizado;
  }

  /** Elimina el .docx del disco y el registro en la base (solo NOTAS). */
  @Delete(':id')
  async eliminar(@Param('id') id: string) {
    const doc = await this.prisma.documento.findUnique({
      where: { id },
      include: { sesion: true },
    });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    if (doc.tipo !== 'NOTAS') {
      throw new NotFoundException('Solo se pueden eliminar notas del alumno, no la guía');
    }

    try {
      await fs.unlink(doc.ruta);
    } catch {
      /* ya no existe en disco */
    }

    await this.prisma.documento.delete({ where: { id } });

    if (doc.sesion.estado !== 'REVISADA') {
      await this.prisma.sesion.update({
        where: { id: doc.sesionId },
        data: { estado: 'PENDIENTE' },
      });
    }

    return { eliminado: true, sesionId: doc.sesionId };
  }

  private async buscar(id: string) {
    const doc = await this.prisma.documento.findUnique({
      where: { id },
      include: {
        bloques: { orderBy: { orden: 'asc' } },
        sesion: {
          include: {
            materia: {
              select: { id: true, codigo: true, nombre: true, clave: true, color: true },
            },
          },
        },
      },
    });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    return doc;
  }
}
