import { Module } from '@nestjs/common';
import { NotasController } from './notas.controller';
import { NotasGeneradorService } from './notas-generador.service';
import { DocumentosModule } from '../documentos/documentos.module';
import { SyncModule } from '../sync/sync.module';

@Module({
  imports: [DocumentosModule, SyncModule],
  controllers: [NotasController],
  providers: [NotasGeneradorService],
  exports: [NotasGeneradorService],
})
export class NotasModule {}
