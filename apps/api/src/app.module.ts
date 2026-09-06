import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import config from './config';
import { PrismaModule } from './prisma/prisma.module';
import { DocxModule } from './docx/docx.module';
import { SyncModule } from './sync/sync.module';
import { MateriasModule } from './materias/materias.module';
import { SesionesModule } from './sesiones/sesiones.module';
import { DocumentosModule } from './documentos/documentos.module';
import { TareasModule } from './tareas/tareas.module';
import { EvaluacionesModule } from './evaluaciones/evaluaciones.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CalendarioModule } from './calendario/calendario.module';
import { BusquedaModule } from './busqueda/busqueda.module';
import { ExportarModule } from './exportar/exportar.module';
import { SaludModule } from './salud/salud.module';
import { LibrosModule } from './libros/libros.module';
import { AlertasModule } from './alertas/alertas.module';
import { NotasModule } from './notas/notas.module';
import { GuiasExamenModule } from './guias-examen/guias-examen.module';
import { AutomatizacionModule } from './automatizacion/automatizacion.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
      envFilePath: ['../../.env', '.env'],
    }),
    PrismaModule,
    DocxModule,
    SyncModule,
    MateriasModule,
    SesionesModule,
    DocumentosModule,
    TareasModule,
    EvaluacionesModule,
    DashboardModule,
    CalendarioModule,
    BusquedaModule,
    ExportarModule,
    SaludModule,
    LibrosModule,
    AlertasModule,
    NotasModule,
    GuiasExamenModule,
    AutomatizacionModule,
  ],
})
export class AppModule {}
