import { Module } from '@nestjs/common';
import { GuiasExamenController } from './guias-examen.controller';
import { GuiasEstudioService } from './guias-estudio.service';
import { DocxModule } from '../docx/docx.module';

@Module({
  imports: [DocxModule],
  controllers: [GuiasExamenController],
  providers: [GuiasEstudioService],
  exports: [GuiasEstudioService],
})
export class GuiasExamenModule {}
