import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { createReadStream } from 'node:fs';
import { promises as fs } from 'node:fs';
import { LibrosService } from './libros.service';

@Controller('libros')
export class LibrosController {
  constructor(private readonly libros: LibrosService) {}

  @Get()
  listar(@Query('materia') materia?: string) {
    return this.libros.listar(materia);
  }

  @Post('importar')
  importar() {
    return this.libros.importar();
  }

  @Get(':id')
  uno(@Param('id') id: string) {
    return this.libros.uno(id);
  }

  /**
   * Sirve el PDF. `inline` para que el visor del navegador lo muestre embebido
   * en vez de descargarlo; con `?descargar=1` se fuerza la descarga.
   */
  @Get(':id/archivo')
  async archivo(
    @Param('id') id: string,
    @Res() res: Response,
    @Query('descargar') descargar?: string,
  ) {
    const libro = await this.libros.uno(id);
    const ruta = await this.libros.resolverRutaArchivo(libro);
    if (!ruta) {
      throw new NotFoundException(
        libro.ruta
          ? `El archivo ya no está en ${libro.ruta}`
          : 'Este libro no tiene archivo en disco.',
      );
    }

    // Si la DB aún tenía una ruta vieja (p. ej. Windows), la corregimos al vuelo.
    if (ruta !== libro.ruta) {
      const st = await fs.stat(ruta);
      await this.libros.actualizar(libro.id, {
        ruta,
        tamanoBytes: st.size,
        soloReferencia: false,
      });
    }

    const tamano = (await fs.stat(ruta)).size;
    const nombre = libro.archivo ?? `${libro.titulo}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', String(tamano));
    res.setHeader(
      'Content-Disposition',
      `${descargar ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(nombre)}`,
    );
    // El visor pide rangos para paginar sin bajar los 100 MB de golpe.
    res.setHeader('Accept-Ranges', 'bytes');
    // Permite embeber el PDF en el iframe de la misma app.
    res.setHeader('X-Content-Type-Options', 'nosniff');
    createReadStream(ruta).pipe(res);
  }

  /** Sube un PDF a la carpeta Libros de la materia. */
  @Post('subir')
  @UseInterceptors(FileInterceptor('archivo', { limits: { fileSize: 300 * 1024 * 1024 } }))
  subir(
    @UploadedFile() archivo: Express.Multer.File,
    @Body() body: { materiaId: string; titulo?: string; autor?: string; esPrincipal?: string },
  ) {
    if (!archivo) throw new NotFoundException('No llegó ningún archivo.');
    return this.libros.subir(body.materiaId, archivo, {
      titulo: body.titulo,
      autor: body.autor,
      esPrincipal: body.esPrincipal === 'true',
    });
  }

  /** Adjunta un PDF a un libro que ya estaba listado como referencia. */
  @Post(':id/archivo')
  @UseInterceptors(FileInterceptor('archivo', { limits: { fileSize: 300 * 1024 * 1024 } }))
  adjuntar(@Param('id') id: string, @UploadedFile() archivo: Express.Multer.File) {
    if (!archivo) throw new NotFoundException('No llegó ningún archivo.');
    return this.libros.adjuntarArchivo(id, archivo);
  }

  /** Registra un libro sin archivo: referencia de biblioteca o enlace. */
  @Post()
  agregar(
    @Body()
    dto: {
      materiaId: string;
      titulo: string;
      autor?: string;
      anio?: number;
      editorial?: string;
      isbn?: string;
      url?: string;
      notas?: string;
      esPrincipal?: boolean;
    },
  ) {
    return this.libros.agregarReferencia(dto);
  }

  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body()
    dto: {
      titulo?: string;
      autor?: string;
      anio?: number;
      editorial?: string;
      isbn?: string;
      url?: string;
      notas?: string;
      esPrincipal?: boolean;
    },
  ) {
    return this.libros.actualizar(id, dto);
  }

  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.libros.eliminar(id);
  }
}
