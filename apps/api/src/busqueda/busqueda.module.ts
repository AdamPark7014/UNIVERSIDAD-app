import { Global, Module } from '@nestjs/common';
import { BusquedaService } from './busqueda.service';
import { BusquedaController } from './busqueda.controller';

/** Global, como Prisma y Docx: el sync también reindexa al terminar. */
@Global()
@Module({
  providers: [BusquedaService],
  controllers: [BusquedaController],
  exports: [BusquedaService],
})
export class BusquedaModule {}
