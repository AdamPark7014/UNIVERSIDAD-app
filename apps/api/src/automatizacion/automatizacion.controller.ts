import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AutomatizacionService } from './automatizacion.service';
import { PrepararSesionesService } from './preparar-sesiones.service';
import { GuiasEstudioService } from '../guias-examen/guias-estudio.service';
import { NotasGeneradorService } from '../notas/notas-generador.service';

@Controller('automatizacion')
export class AutomatizacionController {
  constructor(
    private readonly auto: AutomatizacionService,
    private readonly plantillas: PrepararSesionesService,
    private readonly guias: GuiasEstudioService,
    private readonly notas: NotasGeneradorService,
  ) {}

  @Get('estado')
  estado() {
    return this.auto.estado();
  }

  /** Corre el ciclo completo ahora (sync + notas post-clase + plantillas + guías cercanas). */
  @Post('ciclo')
  ciclo() {
    return this.auto.correrCiclo('manual');
  }

  @Post('preparar-plantillas')
  prepararPlantillas(@Query('dias') dias?: string) {
    return this.plantillas.prepararProximos(dias ? parseInt(dias, 10) : undefined);
  }

  @Post('generar-guias')
  generarGuias(
    @Body() cuerpo: { proximos?: number; solo?: string[] } = {},
    @Query('proximos') proximosQ?: string,
  ) {
    return this.guias.generar({
      proximos: cuerpo.proximos ?? (proximosQ ? parseInt(proximosQ, 10) : 21),
      solo: cuerpo.solo,
    });
  }

  @Post('generar-notas')
  generarNotas(
    @Query('limite') limite?: string,
    @Query('materia') materia?: string,
  ) {
    return this.notas.generarPendientes({
      limite: limite ? parseInt(limite, 10) : 100,
      materia,
      escribirDisco: true,
    });
  }
}
