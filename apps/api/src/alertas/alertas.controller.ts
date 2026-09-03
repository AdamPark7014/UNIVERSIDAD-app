import { Controller, Get, Query } from '@nestjs/common';
import { AlertasService } from './alertas.service';

@Controller('alertas')
export class AlertasController {
  constructor(private readonly alertas: AlertasService) {}

  /** Todo lo que requiere atención, ordenado por urgencia. */
  @Get()
  resumen(@Query('umbral') umbral?: string) {
    return this.alertas.resumen(umbral ? parseInt(umbral, 10) : undefined);
  }

  /** Solo las notas incompletas, para la pantalla de puesta al día. */
  @Get('notas')
  notas(@Query('umbral') umbral?: string, @Query('materia') materia?: string) {
    return this.alertas.notasPendientes(
      umbral ? parseInt(umbral, 10) : undefined,
      materia,
    );
  }
}
