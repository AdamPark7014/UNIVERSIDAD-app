import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import config from '../config';
import {
  carpetaLibros,
  primeraExistente,
  remapearARaiz,
} from '../lib/rutas-docs';

/** Extensiones que la app sabe mostrar embebidas. */
const LEGIBLES = ['.pdf'];

@Injectable()
export class LibrosService {
  private readonly log = new Logger(LibrosService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(config.KEY) private readonly cfg: ConfigType<typeof config>,
  ) {}

  /** Raíz efectiva: DOCS_ROOT manda sobre lo que diga la fila del semestre. */
  private raiz() {
    return this.cfg.raizDocumentos;
  }

  /**
   * Resuelve la ruta real del PDF en disco. Tolera bases sincronizadas desde
   * Windows (C:\Users\…\OneDrive\…) cuando el proceso corre en Linux.
   */
  async resolverRutaArchivo(libro: {
    ruta: string | null;
    archivo: string | null;
    materiaId: string;
  }): Promise<string | null> {
    const materia = await this.prisma.materia.findUnique({
      where: { id: libro.materiaId },
      select: { carpeta: true },
    });
    const porNombre =
      libro.archivo && materia
        ? path.join(carpetaLibros(this.raiz(), materia.carpeta), libro.archivo)
        : null;
    const remapeada = remapearARaiz(libro.ruta, this.raiz());
    return primeraExistente(porNombre, remapeada, libro.ruta);
  }

  /**
   * Recorre la carpeta Libros de cada materia y registra los PDF que encuentre.
   * Empareja por nombre de archivo, así que se puede correr las veces que sea.
   */
  async importar(): Promise<{ encontrados: number; nuevos: number; huerfanos: number }> {
    // Alinea la fila del semestre con DOCS_ROOT para que nada vuelva a Windows.
    await this.prisma.semestre.updateMany({
      where: { codigo: this.cfg.semestreActivo },
      data: { raizDocumentos: this.raiz() },
    });

    const materias = await this.prisma.materia.findMany({
      orderBy: { orden: 'asc' },
    });

    let encontrados = 0;
    let nuevos = 0;

    for (const materia of materias) {
      const carpeta = carpetaLibros(this.raiz(), materia.carpeta);
      let archivos: string[];
      try {
        archivos = await fs.readdir(carpeta);
      } catch {
        continue; // la materia no tiene carpeta de libros; no es un error
      }

      for (const archivo of archivos) {
        if (!LEGIBLES.includes(path.extname(archivo).toLowerCase())) continue;
        encontrados++;

        const ruta = path.join(carpeta, archivo);
        const stat = await fs.stat(ruta);

        const existente = await this.prisma.libro.findFirst({
          where: { materiaId: materia.id, archivo },
        });

        if (existente) {
          await this.prisma.libro.update({
            where: { id: existente.id },
            data: { ruta, tamanoBytes: stat.size },
          });
          continue;
        }

        // El nombre trae la pista: "Autor - Título.pdf"
        const base = path.basename(archivo, path.extname(archivo));
        const guion = base.indexOf(' - ');
        const autor = guion > 0 ? base.slice(0, guion).trim() : null;
        const titulo = guion > 0 ? base.slice(guion + 3).trim() : base;

        // Si ya estaba listado como referencia, se le cuelga el archivo en vez
        // de crear un duplicado.
        const porTitulo = await this.prisma.libro.findFirst({
          where: { materiaId: materia.id, ruta: null, titulo: { contains: titulo.slice(0, 18) } },
        });

        if (porTitulo) {
          await this.prisma.libro.update({
            where: { id: porTitulo.id },
            data: { ruta, archivo, tamanoBytes: stat.size, soloReferencia: false },
          });
        } else {
          await this.prisma.libro.create({
            data: {
              materiaId: materia.id,
              titulo,
              autor,
              ruta,
              archivo,
              tamanoBytes: stat.size,
            },
          });
        }
        nuevos++;
      }
    }

    // Los que apuntan a un archivo que ya no está se marcan como referencia.
    const conRuta = await this.prisma.libro.findMany({ where: { NOT: { ruta: null } } });
    let huerfanos = 0;
    for (const l of conRuta) {
      try {
        await fs.access(l.ruta!);
      } catch {
        await this.prisma.libro.update({
          where: { id: l.id },
          data: { ruta: null, archivo: null, tamanoBytes: null, soloReferencia: true },
        });
        huerfanos++;
      }
    }

    this.log.log(`Libros: ${encontrados} en disco, ${nuevos} nuevos, ${huerfanos} huérfanos`);
    return { encontrados, nuevos, huerfanos };
  }

  async listar(codigoMateria?: string) {
    return this.prisma.libro.findMany({
      where: codigoMateria ? { materia: { codigo: codigoMateria } } : {},
      orderBy: [{ esPrincipal: 'desc' }, { titulo: 'asc' }],
      include: {
        materia: { select: { codigo: true, clave: true, nombre: true, color: true } },
      },
    });
  }

  async uno(id: string) {
    const libro = await this.prisma.libro.findUnique({
      where: { id },
      include: { materia: { select: { codigo: true, clave: true, nombre: true, color: true } } },
    });
    if (!libro) throw new NotFoundException('Libro no encontrado');
    return libro;
  }

  /** Carpeta Libros de una materia, creada si hacía falta. */
  private async carpetaDe(materiaId: string) {
    const materia = await this.prisma.materia.findUnique({
      where: { id: materiaId },
    });
    if (!materia) throw new NotFoundException('Materia no encontrada');
    const carpeta = carpetaLibros(this.raiz(), materia.carpeta);
    await fs.mkdir(carpeta, { recursive: true });
    return carpeta;
  }

  /** Guarda un PDF subido dentro de la carpeta de la materia. */
  async subir(
    materiaId: string,
    archivo: { originalname: string; buffer: Buffer; mimetype: string },
    datos: { titulo?: string; autor?: string; esPrincipal?: boolean },
  ) {
    if (path.extname(archivo.originalname).toLowerCase() !== '.pdf') {
      throw new BadRequestException('Por ahora solo se aceptan archivos PDF.');
    }

    const carpeta = await this.carpetaDe(materiaId);
    // Nombre saneado: nada de separadores de ruta ni caracteres ilegales.
    const limpio = archivo.originalname
      .replace(/[\\/:*?"<>|]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();

    let nombre = limpio;
    let n = 1;
    while (await this.existe(path.join(carpeta, nombre))) {
      const ext = path.extname(limpio);
      nombre = `${path.basename(limpio, ext)} (${n})${ext}`;
      n++;
    }

    const ruta = path.join(carpeta, nombre);
    await fs.writeFile(ruta, archivo.buffer);

    const base = path.basename(nombre, path.extname(nombre));
    const guion = base.indexOf(' - ');

    return this.prisma.libro.create({
      data: {
        materiaId,
        titulo: datos.titulo?.trim() || (guion > 0 ? base.slice(guion + 3).trim() : base),
        autor: datos.autor?.trim() || (guion > 0 ? base.slice(0, guion).trim() : null),
        esPrincipal: datos.esPrincipal ?? false,
        ruta,
        archivo: nombre,
        tamanoBytes: archivo.buffer.length,
      },
      include: { materia: { select: { codigo: true, clave: true, nombre: true, color: true } } },
    });
  }

  /**
   * Adjunta un PDF a un libro que ya estaba listado como referencia.
   *
   * Es el caso de los que no se encontraron al principio: el título y el autor
   * ya están bien escritos, así que se conservan y solo se les cuelga el archivo.
   */
  async adjuntarArchivo(
    id: string,
    archivo: { originalname: string; buffer: Buffer },
  ) {
    const libro = await this.uno(id);
    if (path.extname(archivo.originalname).toLowerCase() !== '.pdf') {
      throw new BadRequestException('Por ahora solo se aceptan archivos PDF.');
    }

    const carpeta = await this.carpetaDe(libro.materiaId);

    // El nombre sale del título ya registrado, no del archivo descargado, que
    // suele venir como "9781234567890.pdf" o "download (3).pdf".
    const base = [libro.autor, libro.titulo].filter(Boolean).join(' - ');
    // La contrabarra va incluida: en Windows es separador de ruta, y un titulo
    // con una dentro escribiria el archivo fuera de la carpeta de la materia.
    const limpio = base
      .replace(/[\\/:*?"<>|]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120);

    let nombre = `${limpio}.pdf`;
    let n = 1;
    while (await this.existe(path.join(carpeta, nombre))) {
      nombre = `${limpio} (${n}).pdf`;
      n++;
    }

    const ruta = path.join(carpeta, nombre);
    await fs.writeFile(ruta, archivo.buffer);

    return this.prisma.libro.update({
      where: { id },
      data: {
        ruta,
        archivo: nombre,
        tamanoBytes: archivo.buffer.length,
        soloReferencia: false,
      },
      include: { materia: { select: { codigo: true, clave: true, nombre: true, color: true } } },
    });
  }

  /** Registra un libro sin archivo: una referencia de biblioteca o un enlace. */
  async agregarReferencia(datos: {
    materiaId: string;
    titulo: string;
    autor?: string;
    anio?: number;
    editorial?: string;
    isbn?: string;
    url?: string;
    notas?: string;
    esPrincipal?: boolean;
  }) {
    if (!datos.titulo?.trim()) throw new BadRequestException('El título es obligatorio.');
    return this.prisma.libro.create({
      data: {
        materiaId: datos.materiaId,
        titulo: datos.titulo.trim(),
        autor: datos.autor?.trim() || null,
        anio: datos.anio ?? null,
        editorial: datos.editorial?.trim() || null,
        isbn: datos.isbn?.trim() || null,
        url: datos.url?.trim() || null,
        notas: datos.notas?.trim() || null,
        esPrincipal: datos.esPrincipal ?? false,
        soloReferencia: true,
      },
      include: { materia: { select: { codigo: true, clave: true, nombre: true, color: true } } },
    });
  }

  async actualizar(id: string, datos: any) {
    await this.uno(id);
    return this.prisma.libro.update({
      where: { id },
      data: datos,
      include: { materia: { select: { codigo: true, clave: true, nombre: true, color: true } } },
    });
  }

  /**
   * Quita el libro de la base. El PDF en disco NO se borra: es del alumno y
   * OneDrive lo respalda. Se explica en la interfaz.
   */
  async eliminar(id: string) {
    await this.uno(id);
    return this.prisma.libro.delete({ where: { id } });
  }

  private async existe(ruta: string) {
    try {
      await fs.access(ruta);
      return true;
    } catch {
      return false;
    }
  }
}
