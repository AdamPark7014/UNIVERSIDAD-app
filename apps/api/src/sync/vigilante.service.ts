import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import * as chokidar from 'chokidar';
import * as path from 'node:path';
import { SyncService } from './sync.service';
import config from '../config';

/**
 * Vigila la carpeta de documentos y reimporta lo que Word vaya guardando.
 *
 * Word no escribe el archivo en su sitio: crea un temporal y lo renombra, así
 * que se ven varios eventos por guardado. Por eso hay espera de estabilidad y
 * un retardo por archivo antes de tocar la base.
 */
@Injectable()
export class VigilanteService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(VigilanteService.name);
  private observador?: chokidar.FSWatcher;
  private readonly pendientes = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly sync: SyncService,
    @Inject(config.KEY) private readonly cfg: ConfigType<typeof config>,
  ) {}

  onModuleInit() {
    if (!this.cfg.vigilarDisco) {
      this.log.log('Vigilante desactivado (VIGILAR_DISCO=false)');
      return;
    }

    const patron = path.join(this.cfg.raizDocumentos, '*', 'Notas', '*.docx');
    this.observador = chokidar.watch(patron, {
      ignoreInitial: true,
      // los ~$ son los archivos de bloqueo que deja Word al abrir un documento
      ignored: (ruta) => path.basename(ruta).startsWith('~$'),
      awaitWriteFinish: { stabilityThreshold: 1500, pollInterval: 200 },
    });

    this.observador
      .on('add', (ruta) => this.programar(ruta))
      .on('change', (ruta) => this.programar(ruta))
      .on('error', (e) => this.log.warn(`Vigilante: ${String(e)}`));

    this.log.log(`Vigilando ${patron}`);
  }

  async onModuleDestroy() {
    for (const t of this.pendientes.values()) clearTimeout(t);
    this.pendientes.clear();
    await this.observador?.close();
  }

  /** Agrupa los eventos repetidos del mismo archivo en una sola importación. */
  private programar(ruta: string) {
    const anterior = this.pendientes.get(ruta);
    if (anterior) clearTimeout(anterior);

    this.pendientes.set(
      ruta,
      setTimeout(() => {
        this.pendientes.delete(ruta);
        void this.importar(ruta);
      }, 2000),
    );
  }

  private async importar(ruta: string) {
    try {
      const r = await this.sync.importarPorRuta(ruta);
      if (r.ignorado) {
        this.log.debug(`Ignorado ${path.basename(ruta)}: ${r.motivo}`);
      } else if (r.creado || r.actualizado) {
        this.log.log(
          `${r.archivo} → ${r.creado ? 'nuevo' : 'actualizado'}` +
            (r.tareas ? `, ${r.tareas} tareas nuevas` : ''),
        );
      }
    } catch (e: any) {
      this.log.warn(`No se pudo importar ${path.basename(ruta)}: ${e.message}`);
    }
  }
}
