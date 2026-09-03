import { Controller, Get, Query } from '@nestjs/common';
import { BusquedaService } from './busqueda.service';

@Controller('busqueda')
export class BusquedaController {
  constructor(private readonly busqueda: BusquedaService) {}

  @Get()
  buscar(
    @Query('q') q?: string,
    @Query('materia') materia?: string,
    @Query('tipo') tipo?: 'GUIA' | 'NOTAS',
    @Query('limite') limite?: string,
  ) {
    return this.busqueda.buscar(q ?? '', {
      materia,
      tipo,
      limite: limite ? parseInt(limite, 10) : undefined,
    });
  }
}
