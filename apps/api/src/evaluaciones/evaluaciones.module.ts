import { Module } from '@nestjs/common';
import { EvaluacionesController } from './evaluaciones.controller';

@Module({ controllers: [EvaluacionesController] })
export class EvaluacionesModule {}
