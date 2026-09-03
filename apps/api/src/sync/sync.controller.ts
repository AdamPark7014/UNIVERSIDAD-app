import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly sync: SyncService) {}

  @Get('estado')
  estado() {
    return this.sync.estado();
  }

  @Get('historial')
  historial(@Query('limite') limite?: string) {
    return this.sync.historial(limite ? parseInt(limite, 10) : 20);
  }

  /** Lee el disco y actualiza la base. `?forzar=1` reprocesa aunque no cambie el hash. */
  @Post('importar')
  importar(@Query('forzar') forzar?: string) {
    return this.sync.importarDesdeDisco({ forzar: forzar === '1' });
  }

  /** Escribe a disco todos los documentos con cambios sin guardar. */
  @Post('escribir')
  escribirPendientes() {
    return this.sync.escribirPendientes();
  }

  @Post('escribir/:documentoId')
  escribirUno(@Param('documentoId') id: string) {
    return this.sync.escribirDocumento(id);
  }
}
