import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocxService, TipoBloque } from '../docx/docx.service';
import { SyncService } from '../sync/sync.service';
import { BusquedaService } from '../busqueda/busqueda.service';
import config from '../config';
import { generarCuerpoDesdeGuia } from './generador-cuerpo';
import { DocumentosService } from '../documentos/documentos.service';
import * as path from 'node:path';
import { promises as fs } from 'node:fs';

export interface ResultadoGeneracion {
  sesionId: string;
  materia: string;
  tema: string;
  palabrasContenido: number;
  escritoDisco: boolean;
  omitido?: string;
}

@Injectable()
export class NotasGeneradorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly docx: DocxService,
    private readonly sync: SyncService,
    private readonly busqueda: BusquedaService,
    private readonly documentos: DocumentosService,
    @Inject(config.KEY) private readonly cfg: ConfigType<typeof config>,
  ) {}

  async generarParaSesion(
    sesionId: string,
    opciones: { escribirDisco?: boolean; forzar?: boolean } = {},
  ): Promise<ResultadoGeneracion> {
    const sesion = await this.prisma.sesion.findUnique({
      where: { id: sesionId },
      include: {
        materia: { select: { nombre: true, clave: true } },
        documentos: { include: { bloques: { orderBy: { orden: 'asc' } } } },
      },
    });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');

    const notas = sesion.documentos.find((d) => d.tipo === 'NOTAS');
    const guia = sesion.documentos.find((d) => d.tipo === 'GUIA');
    if (!notas) throw new NotFoundException('La sesión no tiene documento NOTAS');
    if (!guia) throw new NotFoundException('La sesión no tiene guía para basar las notas');

    const umbral = this.cfg.umbralNotas;
    if (!opciones.forzar && notas.palabrasContenido >= umbral) {
      return {
        sesionId,
        materia: sesion.materia.clave,
        tema: sesion.tema,
        palabrasContenido: notas.palabrasContenido,
        escritoDisco: false,
        omitido: 'ya tiene notas suficientes',
      };
    }

    const cabecera = notas.bloques.filter((b) =>
      ['TITULO', 'SUBTITULO', 'TEMA', 'SEPARADOR'].includes(b.tipo),
    );
    const cuerpoGenerado = generarCuerpoDesdeGuia(
      guia.bloques.map((b) => ({ tipo: b.tipo, texto: b.texto })),
      {
        tema: sesion.tema,
        materiaNombre: sesion.materia.nombre,
        materiaClave: sesion.materia.clave,
      },
    );

    // Conserva TAREA PROPIA de la plantilla si existía.
    const idxTarea = notas.bloques.findIndex((b) => b.tipo === 'TAREA_PROPIA_TITULO');
    const pie =
      idxTarea >= 0
        ? notas.bloques.slice(idxTarea).map((b) => ({ tipo: b.tipo, texto: b.texto }))
        : [
            { tipo: 'TAREA_PROPIA_TITULO', texto: 'TAREA PROPIA' },
            {
              tipo: 'PARRAFO',
              texto: '(ideas que se me ocurren en clase para investigar por mi cuenta)',
            },
            { tipo: 'ESPACIO', texto: '' },
          ];

    const bloques = [
      ...cabecera.length
        ? cabecera.map((b) => ({ tipo: b.tipo as TipoBloque, texto: b.texto }))
        : this.cabeceraPorDefecto(notas, sesion),
      ...cuerpoGenerado.map((b) => ({ tipo: b.tipo as TipoBloque, texto: b.texto })),
      ...pie.map((b) => ({ tipo: b.tipo as TipoBloque, texto: b.texto })),
    ];

    const actualizado = await this.documentos.aplicarBloques(notas.id, bloques);
    if (!actualizado) throw new NotFoundException('Error al guardar notas');

    let escritoDisco = false;
    if (opciones.escribirDisco) {
      await this.sync.escribirDocumento(notas.id);
      escritoDisco = true;
    }

    return {
      sesionId,
      materia: sesion.materia.clave,
      tema: sesion.tema,
      palabrasContenido: actualizado.palabrasContenido,
      escritoDisco,
    };
  }

  async generarPendientes(opciones: {
    limite?: number;
    materia?: string;
    escribirDisco?: boolean;
    forzar?: boolean;
  } = {}) {
    const umbral = this.cfg.umbralNotas;
    const hoy = new Date();

    const sesiones = await this.prisma.sesion.findMany({
      where: {
        fecha: { lte: hoy },
        ...(opciones.materia ? { materia: { codigo: opciones.materia } } : {}),
        documentos: {
          some: {
            tipo: 'NOTAS',
            ...(opciones.forzar ? {} : { palabrasContenido: { lt: umbral } }),
          },
        },
      },
      orderBy: { fecha: 'asc' },
      take: opciones.limite ?? 500,
      select: { id: true },
    });

    const resultados: ResultadoGeneracion[] = [];
    const errores: string[] = [];

    for (const s of sesiones) {
      try {
        resultados.push(
          await this.generarParaSesion(s.id, {
            escribirDisco: opciones.escribirDisco,
            forzar: opciones.forzar,
          }),
        );
      } catch (e: any) {
        errores.push(`${s.id}: ${e.message}`);
      }
    }

    const generados = resultados.filter((r) => !r.omitido).length;

    if (generados > 0) {
      await this.busqueda.reindexar();
    }

    return {
      total: sesiones.length,
      generados,
      omitidos: resultados.filter((r) => r.omitido).length,
      errores,
      resultados,
    };
  }

  /** Crea un .docx de NOTAS en blanco si la sesión no tiene documento (o se eliminó). */
  async crearDocumentoNotas(sesionId: string) {
    const sesion = await this.prisma.sesion.findUnique({
      where: { id: sesionId },
      include: {
        materia: { include: { semestre: true } },
        documentos: { where: { tipo: 'NOTAS' } },
      },
    });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
    if (sesion.documentos.length > 0) {
      throw new NotFoundException('La sesión ya tiene documento de notas');
    }

    const dd = String(sesion.fecha.getUTCDate()).padStart(2, '0');
    const mm = String(sesion.fecha.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = sesion.fecha.getUTCFullYear();
    const archivo = `Notas ${dd}-${mm}-${yyyy}.docx`;
    const ruta = path.join(
      sesion.materia.semestre.raizDocumentos,
      sesion.materia.carpeta,
      'Notas',
      archivo,
    );

    const bloques: { tipo: TipoBloque; texto: string }[] = [
      {
        tipo: 'TITULO',
        texto: `NOTAS ${dd}-${mm}-${String(yyyy).slice(2)} ${sesion.materia.nombre}`,
      },
      {
        tipo: 'SUBTITULO',
        texto: `${sesion.materia.clave} · Sesión ${sesion.numero} · ${sesion.horaInicio}-${sesion.horaFin}`,
      },
      { tipo: 'TEMA', texto: sesion.tema },
      { tipo: 'SEPARADOR', texto: '' },
      { tipo: 'TAREA_PROPIA_TITULO', texto: 'TAREA PROPIA' },
      {
        tipo: 'PARRAFO',
        texto: '(ideas que se me ocurren en clase para investigar por mi cuenta)',
      },
      { tipo: 'ESPACIO', texto: '' },
    ];

    try {
      await fs.access(ruta);
      const resultado = await this.sync.importarPorRuta(ruta);
      return { creado: true, ruta, importado: resultado };
    } catch {
      const { bytes, hash } = await this.docx.escribir(ruta, bloques);
      const leido = await this.docx.leer(ruta);
      const documento = await this.prisma.documento.create({
        data: {
          sesionId,
          tipo: 'NOTAS',
          ruta,
          archivo,
          hash,
          tamanoBytes: bytes,
          palabras: leido.palabras,
          palabrasContenido: leido.palabrasContenido,
          pendienteDeEscribir: false,
          origen: 'GENERADO',
          archivoModificadoEn: new Date(),
        },
      });
      await this.prisma.bloque.createMany({
        data: leido.bloques.map((b) => ({
          documentoId: documento.id,
          orden: b.orden,
          tipo: b.tipo as any,
          texto: b.texto,
        })),
      });
      await this.busqueda.reindexar();
      return { creado: true, documentoId: documento.id, ruta };
    }
  }

  private cabeceraPorDefecto(
    notas: { archivo: string },
    sesion: {
      tema: string;
      fecha: Date;
      horaInicio: string;
      horaFin: string;
      numero: number;
      materia: { clave: string };
    },
  ): { tipo: TipoBloque; texto: string }[] {
    const dd = String(sesion.fecha.getUTCDate()).padStart(2, '0');
    const mm = String(sesion.fecha.getUTCMonth() + 1).padStart(2, '0');
    const yy = String(sesion.fecha.getUTCFullYear()).slice(2);
    return [
      { tipo: 'TITULO', texto: notas.archivo.replace(/\.docx$/i, '') || `NOTAS ${dd}-${mm}-${yy}` },
      {
        tipo: 'SUBTITULO',
        texto: `${sesion.materia.clave} · Sesión ${sesion.numero} · ${sesion.horaInicio}-${sesion.horaFin}`,
      },
      { tipo: 'TEMA', texto: sesion.tema },
      { tipo: 'SEPARADOR', texto: '' },
    ];
  }
}
