import { Module } from '@nestjs/common';
import { SesionesController } from './sesiones.controller';

@Module({ controllers: [SesionesController] })
export class SesionesModule {}
