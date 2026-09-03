import { Module } from '@nestjs/common';
import { CalendarioController } from './calendario.controller';

@Module({ controllers: [CalendarioController] })
export class CalendarioModule {}
