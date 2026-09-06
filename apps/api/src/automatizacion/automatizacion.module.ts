import { Module } from '@nestjs/common';
import { SyncModule } from '../sync/sync.module';
import { NotasModule } from '../notas/notas.module';
import { DocxModule } from '../docx/docx.module';
import { GuiasExamenModule } from '../guias-examen/guias-examen.module';
import { AutomatizacionService } from './automatizacion.service';
import { AutomatizacionController } from './automatizacion.controller';
import { PrepararSesionesService } from './preparar-sesiones.service';

@Module({
  imports: [SyncModule, NotasModule, DocxModule, GuiasExamenModule],
  controllers: [AutomatizacionController],
  providers: [AutomatizacionService, PrepararSesionesService],
  exports: [AutomatizacionService, PrepararSesionesService],
})
export class AutomatizacionModule {}
