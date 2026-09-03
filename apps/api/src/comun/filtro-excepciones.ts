import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

/**
 * Convierte cualquier fallo en una respuesta legible.
 *
 * Sin esto, un error de Prisma o un archivo que ya no está devuelven un 500
 * con "Internal server error" y el motivo real solo queda en la consola. Aquí
 * se traduce a un código correcto y a un mensaje que se pueda enseñar en la
 * interfaz sin filtrar rutas ni consultas.
 */
@Catch()
export class FiltroExcepciones implements ExceptionFilter {
  private readonly log = new Logger('Error');

  catch(excepcion: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const { estado, mensaje, detalle } = this.traducir(excepcion);

    // 4xx es culpa de quien llama: basta una línea. 5xx sí lleva traza.
    if (estado >= 500) {
      this.log.error(`${req.method} ${req.url} → ${estado}: ${mensaje}`, (excepcion as Error)?.stack);
    } else {
      this.log.warn(`${req.method} ${req.url} → ${estado}: ${mensaje}`);
    }

    res.status(estado).json({
      estado,
      mensaje,
      ...(detalle ? { detalle } : {}),
      ruta: req.url,
      momento: new Date().toISOString(),
    });
  }

  private traducir(e: unknown): { estado: number; mensaje: string; detalle?: string } {
    if (e instanceof HttpException) {
      const cuerpo = e.getResponse();
      const mensaje =
        typeof cuerpo === 'string'
          ? cuerpo
          : ((cuerpo as any)?.message ?? e.message);
      return {
        estado: e.getStatus(),
        mensaje: Array.isArray(mensaje) ? mensaje.join('. ') : String(mensaje),
      };
    }

    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      switch (e.code) {
        case 'P2002':
          return { estado: HttpStatus.CONFLICT, mensaje: 'Ya existe un registro con esos datos.' };
        case 'P2025':
          return { estado: HttpStatus.NOT_FOUND, mensaje: 'No se encontró el registro.' };
        case 'P2003':
          return {
            estado: HttpStatus.BAD_REQUEST,
            mensaje: 'El registro está referenciado por otro y no se puede modificar así.',
          };
        case 'P2022':
          return {
            estado: HttpStatus.INTERNAL_SERVER_ERROR,
            mensaje: 'La base está desfasada del esquema. Corre las migraciones.',
            detalle: `Falta la columna ${(e.meta as any)?.column ?? '(desconocida)'}`,
          };
        default:
          return {
            estado: HttpStatus.INTERNAL_SERVER_ERROR,
            mensaje: 'Error de base de datos.',
            detalle: e.code,
          };
      }
    }

    if (e instanceof Prisma.PrismaClientInitializationError) {
      return {
        estado: HttpStatus.SERVICE_UNAVAILABLE,
        mensaje: 'No se pudo abrir la base de datos. Revisa DATABASE_URL.',
      };
    }

    // Errores de sistema de archivos: pasan seguido con OneDrive de por medio.
    const err = e as NodeJS.ErrnoException;
    if (err?.code === 'ENOENT') {
      return { estado: HttpStatus.NOT_FOUND, mensaje: 'El archivo ya no está en disco.' };
    }
    if (err?.code === 'EBUSY' || err?.code === 'EPERM') {
      return {
        estado: HttpStatus.CONFLICT,
        mensaje: 'El archivo está abierto en Word. Ciérralo y vuelve a intentar.',
      };
    }
    if (err?.code === 'EACCES') {
      return { estado: HttpStatus.FORBIDDEN, mensaje: 'Sin permisos para leer o escribir el archivo.' };
    }

    return {
      estado: HttpStatus.INTERNAL_SERVER_ERROR,
      mensaje: (e as Error)?.message ?? 'Error inesperado.',
    };
  }
}
