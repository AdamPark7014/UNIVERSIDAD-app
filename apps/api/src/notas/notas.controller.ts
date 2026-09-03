import { Body, Controller, Param, Post, Query } from '@nestjs/common';
import { NotasGeneradorService } from './notas-generador.service';

@Controller('notas')
export class NotasController {
  constructor(private readonly generador: NotasGeneradorService) {}

  /** Genera apuntes para una sesión a partir de su guía. */
  @Post('generar/:sesionId')
  generarSesion(
    @Param('sesionId') sesionId: string,
    @Query('escribir') escribir?: string,
    @Query('forzar') forzar?: string,
  ) {
    return this.generador.generarParaSesion(sesionId, {
      escribirDisco: escribir === '1' || escribir === 'true',
      forzar: forzar === '1' || forzar === 'true',
    });
  }

  /** Genera apuntes para todas las sesiones con notas incompletas. */
  @Post('generar-pendientes')
  generarPendientes(
    @Body()
    dto: {
      limite?: number;
      materia?: string;
      escribirDisco?: boolean;
      forzar?: boolean;
    } = {},
  ) {
    return this.generador.generarPendientes(dto);
  }

  /** Crea documento NOTAS en blanco para una sesión sin notas. */
  @Post('crear/:sesionId')
  crear(@Param('sesionId') sesionId: string) {
    return this.generador.crearDocumentoNotas(sesionId);
  }
}
