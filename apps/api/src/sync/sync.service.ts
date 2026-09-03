import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { DocxService, TipoBloque } from '../docx/docx.service';
import { BusquedaService } from '../busqueda/busqueda.service';
import config from '../config';

const RE_ARCHIVO = /^(Guia|Notas)\s+(\d{2})-(\d{2})-(\d{4})\.docx$/i;

export interface ResumenSync {
  eventoId: string;
  leidos: number;
  creados: number;
  actualizados: number;
  sinCambios: number;
  errores: string[];
  tareasImportadas: number;
}

@Injectable()
export class SyncService {
  private readonly log = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly docx: DocxService,
    private readonly busqueda: BusquedaService,
    @Inject(config.KEY) private readonly cfg: ConfigType<typeof config>,
  ) {}

  // ---------------------------------------------------------------- disco → db

  /**
   * Recorre las carpetas Notas de cada materia, lee los .docx y actualiza la
   * base. Solo reprocesa los archivos cuyo hash cambió.
   */
  async importarDesdeDisco(opciones: { forzar?: boolean } = {}): Promise<ResumenSync> {
    const evento = await this.prisma.eventoSync.create({
      data: { direccion: 'disco->db' },
    });

    const resumen: ResumenSync = {
      eventoId: evento.id,
      leidos: 0,
      creados: 0,
      actualizados: 0,
      sinCambios: 0,
      errores: [],
      tareasImportadas: 0,
    };

    const semestre = await this.semestreActivo();
    const materias = await this.prisma.materia.findMany({
      where: { semestreId: semestre.id },
      orderBy: { orden: 'asc' },
    });

    for (const materia of materias) {
      const carpeta = path.join(semestre.raizDocumentos, materia.carpeta, 'Notas');
      let archivos: string[];
      try {
        archivos = await fs.readdir(carpeta);
      } catch {
        resumen.errores.push(`No se pudo leer la carpeta ${carpeta}`);
        continue;
      }

      // readdir devuelve orden alfabético y los nombres empiezan por día, así que
      // "Guia 02-09" iría antes que "Guia 17-08". Hay que ordenar por fecha real:
      // el número de sesión se calcula contando las anteriores y saldría mal.
      const pendientes = archivos
        .filter((a) => !a.startsWith('~$')) // bloqueo de Word abierto
        .map((archivo) => ({ archivo, m: RE_ARCHIVO.exec(archivo) }))
        .filter((x): x is { archivo: string; m: RegExpExecArray } => x.m !== null)
        .map(({ archivo, m }) => {
          const [, tipoRaw, dd, mm, yyyy] = m;
          return {
            archivo,
            tipo: (tipoRaw.toLowerCase() === 'guia' ? 'GUIA' : 'NOTAS') as 'GUIA' | 'NOTAS',
            fecha: new Date(Date.UTC(+yyyy, +mm - 1, +dd)),
          };
        })
        .sort(
          (a, b) =>
            a.fecha.getTime() - b.fecha.getTime() || a.tipo.localeCompare(b.tipo),
        );

      for (const { archivo, tipo, fecha } of pendientes) {
        const ruta = path.join(carpeta, archivo);
        resumen.leidos++;

        try {
          const cambios = await this.importarArchivo({
            semestreId: semestre.id,
            inicioSemestre: semestre.inicio,
            materiaId: materia.id,
            tipo,
            fecha,
            ruta,
            archivo,
            forzar: opciones.forzar ?? false,
          });
          if (cambios.creado) resumen.creados++;
          else if (cambios.actualizado) resumen.actualizados++;
          else resumen.sinCambios++;
          resumen.tareasImportadas += cambios.tareas;
        } catch (e: any) {
          resumen.errores.push(`${archivo}: ${e.message}`);
        }
      }

      // Red de seguridad: si se importó en varias tandas, los números pueden
      // haber quedado con huecos. Se renumeran por fecha.
      await this.renumerarSesiones(materia.id);
    }

    await this.prisma.eventoSync.update({
      where: { id: evento.id },
      data: {
        terminadoEn: new Date(),
        resultado: resumen.errores.length ? 'CON_ERRORES' : 'OK',
        leidos: resumen.leidos,
        creados: resumen.creados,
        actualizados: resumen.actualizados,
        errores: resumen.errores.length,
        detalle: resumen.errores.slice(0, 50).join('\n') || null,
      },
    });

    // El índice de búsqueda se reconstruye solo si algo cambió.
    if (resumen.creados || resumen.actualizados) {
      await this.busqueda.reindexar();
    }

    this.log.log(
      `Importación: ${resumen.leidos} leídos, ${resumen.creados} nuevos, ` +
        `${resumen.actualizados} actualizados, ${resumen.errores.length} errores`,
    );
    return resumen;
  }

  private async importarArchivo(a: {
    semestreId: string;
    inicioSemestre: Date;
    materiaId: string;
    tipo: 'GUIA' | 'NOTAS';
    fecha: Date;
    ruta: string;
    archivo: string;
    forzar: boolean;
  }) {
    const leido = await this.docx.leer(a.ruta);

    // La sesión se crea si no existe: el disco es la fuente de la verdad.
    let sesion = await this.prisma.sesion.findUnique({
      where: { materiaId_fecha: { materiaId: a.materiaId, fecha: a.fecha } },
    });

    if (!sesion) {
      // El tema real está en el bloque TEMA de la guía. Las notas en blanco no
      // lo traen, así que se cae al título y, si no, a un texto neutro.
      const titulo = leido.bloques.find((b) => b.tipo === 'TITULO')?.texto ?? '';
      const subtitulo = leido.bloques.find((b) => b.tipo === 'SUBTITULO')?.texto ?? '';
      const tema =
        leido.bloques.find((b) => b.tipo === 'TEMA' && b.texto)?.texto ||
        titulo.replace(/^(GUÍA|NOTAS)\s+\d{2}-\d{2}-\d{2}\s+/i, '') ||
        'Sesión';

      const numero = await this.siguienteNumeroSesion(a.materiaId);
      const horas = this.horasDe(subtitulo);

      sesion = await this.prisma.sesion.create({
        data: {
          materiaId: a.materiaId,
          numero,
          fecha: a.fecha,
          semana: this.semanaDe(a.inicioSemestre, a.fecha),
          diaSemana: (a.fecha.getUTCDay() + 6) % 7,
          horaInicio: horas.inicio,
          horaFin: horas.fin,
          tema,
        },
      });
    }

    const existente = await this.prisma.documento.findUnique({
      where: { sesionId_tipo: { sesionId: sesion.id, tipo: a.tipo } },
    });

    if (existente && existente.hash === leido.hash && !a.forzar) {
      return { creado: false, actualizado: false, tareas: 0 };
    }

    const datos = {
      ruta: a.ruta,
      archivo: a.archivo,
      hash: leido.hash,
      tamanoBytes: leido.tamanoBytes,
      archivoModificadoEn: leido.modificadoEn,
      palabras: leido.palabras,
      palabrasContenido: leido.palabrasContenido,
      pendienteDeEscribir: false,
      origen: (existente ? 'IMPORTADO' : 'GENERADO') as 'IMPORTADO' | 'GENERADO',
    };

    const documento = existente
      ? await this.prisma.documento.update({ where: { id: existente.id }, data: datos })
      : await this.prisma.documento.create({
          data: { sesionId: sesion.id, tipo: a.tipo, ...datos },
        });

    await this.prisma.bloque.deleteMany({ where: { documentoId: documento.id } });
    await this.prisma.bloque.createMany({
      data: leido.bloques.map((b) => ({
        documentoId: documento.id,
        orden: b.orden,
        tipo: b.tipo as any,
        texto: b.texto,
      })),
    });

    // La guía manda sobre el tema: si la sesión se creó desde unas notas en
    // blanco, quedó con un texto provisional que aquí se corrige.
    if (a.tipo === 'GUIA') {
      const tema = leido.bloques.find((b) => b.tipo === 'TEMA' && b.texto)?.texto;
      if (tema && tema !== sesion.tema) {
        await this.prisma.sesion.update({ where: { id: sesion.id }, data: { tema } });
      }
    }

    // Las tareas propias se extraen solo del documento de notas.
    let tareas = 0;
    if (a.tipo === 'NOTAS') {
      tareas = await this.sincronizarTareas(sesion.id, leido.bloques);
    }

    // El estado sigue al contenido en ambos sentidos: si el alumno borra sus
    // notas, la sesión vuelve a pendiente. REVISADA se respeta: es manual.
    if (a.tipo === 'NOTAS' && sesion.estado !== 'REVISADA') {
      const debeSer = leido.palabrasContenido > 0 ? 'CURSADA' : 'PENDIENTE';
      if (sesion.estado !== debeSer) {
        await this.prisma.sesion.update({
          where: { id: sesion.id },
          data: { estado: debeSer },
        });
      }
    }

    return { creado: !existente, actualizado: Boolean(existente), tareas };
  }

  /** Toma los renglones que van debajo de TAREA PROPIA y los vuelve registros. */
  private async sincronizarTareas(
    sesionId: string,
    bloques: { tipo: TipoBloque; texto: string }[],
  ): Promise<number> {
    const i = bloques.findIndex((b) => b.tipo === 'TAREA_PROPIA_TITULO');
    if (i === -1) return 0;

    const textos = bloques
      .slice(i + 1)
      .filter((b) => ['PARRAFO', 'NUMERADA', 'VINETA'].includes(b.tipo))
      .map((b) => b.texto.trim())
      .filter(Boolean)
      // la línea de ayuda que pone el generador no es una tarea
      .filter((t) => !/^\(ideas que se me ocurren/i.test(t));

    const existentes = await this.prisma.tareaPropia.findMany({ where: { sesionId } });
    const yaEstan = new Set(existentes.map((t) => t.texto.trim()));

    let n = 0;
    for (const [orden, texto] of textos.entries()) {
      if (yaEstan.has(texto)) continue;
      await this.prisma.tareaPropia.create({ data: { sesionId, texto, orden } });
      n++;
    }
    return n;
  }

  /**
   * Importa un solo archivo a partir de su ruta absoluta. Lo usa el vigilante
   * de disco cuando Word guarda un documento.
   */
  async importarPorRuta(ruta: string) {
    const archivo = path.basename(ruta);
    const m = RE_ARCHIVO.exec(archivo);
    if (!m) return { ignorado: true as const, motivo: 'nombre no reconocido' };

    const carpetaMateria = path.basename(path.dirname(path.dirname(ruta)));
    const semestre = await this.semestreActivo();
    const materia = await this.prisma.materia.findFirst({
      where: { semestreId: semestre.id, carpeta: carpetaMateria },
    });
    if (!materia) {
      return { ignorado: true as const, motivo: `carpeta desconocida: ${carpetaMateria}` };
    }

    const [, tipoRaw, dd, mm, yyyy] = m;
    const resultado = await this.importarArchivo({
      semestreId: semestre.id,
      inicioSemestre: semestre.inicio,
      materiaId: materia.id,
      tipo: tipoRaw.toLowerCase() === 'guia' ? 'GUIA' : 'NOTAS',
      fecha: new Date(Date.UTC(+yyyy, +mm - 1, +dd)),
      ruta,
      archivo,
      forzar: false,
    });
    await this.renumerarSesiones(materia.id);
    return { ignorado: false as const, ...resultado, archivo };
  }

  // ---------------------------------------------------------------- db → disco

  /** Reescribe en disco un documento a partir de sus bloques en la base. */
  async escribirDocumento(documentoId: string) {
    const documento = await this.prisma.documento.findUnique({
      where: { id: documentoId },
      include: { bloques: { orderBy: { orden: 'asc' } } },
    });
    if (!documento) throw new NotFoundException('Documento no encontrado');

    const { bytes, hash } = await this.docx.escribir(
      documento.ruta,
      documento.bloques.map((b) => ({ tipo: b.tipo as TipoBloque, texto: b.texto })),
      { respaldar: this.cfg.respaldarAlEscribir },
    );

    const relectura = await this.docx.leer(documento.ruta);

    return this.prisma.documento.update({
      where: { id: documentoId },
      data: {
        hash,
        tamanoBytes: bytes,
        palabras: relectura.palabras,
        palabrasContenido: relectura.palabrasContenido,
        pendienteDeEscribir: false,
        origen: 'EDITADO',
        archivoModificadoEn: new Date(),
      },
    });
  }

  /** Escribe todos los documentos marcados como pendientes. */
  async escribirPendientes(): Promise<{ escritos: number; errores: string[] }> {
    const evento = await this.prisma.eventoSync.create({
      data: { direccion: 'db->disco' },
    });
    const pendientes = await this.prisma.documento.findMany({
      where: { pendienteDeEscribir: true },
      select: { id: true, archivo: true },
    });

    const errores: string[] = [];
    let escritos = 0;
    for (const d of pendientes) {
      try {
        await this.escribirDocumento(d.id);
        escritos++;
      } catch (e: any) {
        errores.push(`${d.archivo}: ${e.message}`);
      }
    }

    await this.prisma.eventoSync.update({
      where: { id: evento.id },
      data: {
        terminadoEn: new Date(),
        resultado: errores.length ? 'CON_ERRORES' : 'OK',
        escritos,
        errores: errores.length,
        detalle: errores.join('\n') || null,
      },
    });

    return { escritos, errores };
  }

  // ---------------------------------------------------------------- estado

  async estado() {
    const [ultimo, pendientes, documentos, sesiones] = await Promise.all([
      this.prisma.eventoSync.findFirst({ orderBy: { iniciadoEn: 'desc' } }),
      this.prisma.documento.count({ where: { pendienteDeEscribir: true } }),
      this.prisma.documento.count(),
      this.prisma.sesion.count(),
    ]);
    return {
      ultimo,
      pendientesDeEscribir: pendientes,
      documentos,
      sesiones,
      raizDocumentos: this.cfg.raizDocumentos,
    };
  }

  async historial(limite = 20) {
    return this.prisma.eventoSync.findMany({
      orderBy: { iniciadoEn: 'desc' },
      take: limite,
    });
  }

  // ---------------------------------------------------------------- auxiliares

  private async semestreActivo() {
    const s = await this.prisma.semestre.findUnique({
      where: { codigo: this.cfg.semestreActivo },
    });
    if (!s) {
      throw new NotFoundException(
        `No existe el semestre ${this.cfg.semestreActivo}. Corre primero el seed.`,
      );
    }
    return s;
  }

  private semanaDe(inicio: Date, fecha: Date): number {
    const lunes = new Date(inicio);
    lunes.setUTCDate(lunes.getUTCDate() - ((lunes.getUTCDay() + 6) % 7));
    const dias = Math.floor((fecha.getTime() - lunes.getTime()) / 86_400_000);
    return Math.floor(dias / 7) + 1;
  }

  /**
   * Número provisional que nunca choca con la restricción única. El valor
   * definitivo lo pone `renumerarSesiones` al terminar la importación.
   */
  private async siguienteNumeroSesion(materiaId: string) {
    const max = await this.prisma.sesion.aggregate({
      where: { materiaId },
      _max: { numero: true },
    });
    return (max._max.numero ?? 0) + 1;
  }

  /**
   * Deja los números en 1..n por orden de fecha. Se hace en dos pasadas porque
   * (materiaId, numero) es único y una renumeración directa chocaría a media
   * vuelta con un número todavía ocupado.
   */
  private async renumerarSesiones(materiaId: string) {
    const sesiones = await this.prisma.sesion.findMany({
      where: { materiaId },
      orderBy: { fecha: 'asc' },
      select: { id: true, numero: true },
    });

    const correcto = sesiones.every((s, i) => s.numero === i + 1);
    if (correcto) return;

    await this.prisma.$transaction([
      // fuera del rango válido, para liberar los números de golpe
      ...sesiones.map((s, i) =>
        this.prisma.sesion.update({
          where: { id: s.id },
          data: { numero: -(i + 1) },
        }),
      ),
      ...sesiones.map((s, i) =>
        this.prisma.sesion.update({
          where: { id: s.id },
          data: { numero: i + 1 },
        }),
      ),
    ]);
  }

  /** Del subtítulo "CN220 · lunes 17/08/2026 · 10:00-11:40 · Sesión 2". */
  private horasDe(subtitulo: string) {
    const m = /(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/.exec(subtitulo);
    return m ? { inicio: m[1], fin: m[2] } : { inicio: '00:00', fin: '00:00' };
  }
}
