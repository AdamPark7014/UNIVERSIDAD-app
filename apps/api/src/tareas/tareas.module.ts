import { Module } from '@nestjs/common';
import { TareasController } from './tareas.controller';

@Module({ controllers: [TareasController] })
export class TareasModule {}
