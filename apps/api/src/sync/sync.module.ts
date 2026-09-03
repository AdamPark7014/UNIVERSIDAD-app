import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { VigilanteService } from './vigilante.service';

@Module({
  providers: [SyncService, VigilanteService],
  controllers: [SyncController],
  exports: [SyncService],
})
export class SyncModule {}
