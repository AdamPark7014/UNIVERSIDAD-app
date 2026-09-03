import { Module } from '@nestjs/common';
import { ExportarController } from './exportar.controller';

@Module({ controllers: [ExportarController] })
export class ExportarModule {}
