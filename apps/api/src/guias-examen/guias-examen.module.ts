import { Module } from '@nestjs/common';
import { GuiasExamenController } from './guias-examen.controller';

@Module({ controllers: [GuiasExamenController] })
export class GuiasExamenModule {}
