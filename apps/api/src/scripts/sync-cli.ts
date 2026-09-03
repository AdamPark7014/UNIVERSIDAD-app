/**
 * Sincronización desde la terminal, sin levantar la API.
 *
 *   pnpm --filter @universidad/api sync            # disco -> base
 *   pnpm --filter @universidad/api sync -- --forzar
 *   pnpm --filter @universidad/api sync -- --escribir   # base -> disco
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SyncService } from '../sync/sync.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const sync = app.get(SyncService);

  const args = process.argv.slice(2);

  if (args.includes('--escribir')) {
    const r = await sync.escribirPendientes();
    console.log(`\nEscritos ${r.escritos} documentos.`);
    if (r.errores.length) console.error(r.errores.join('\n'));
  } else {
    const r = await sync.importarDesdeDisco({ forzar: args.includes('--forzar') });
    console.log('');
    console.log(`  leídos        ${r.leidos}`);
    console.log(`  nuevos        ${r.creados}`);
    console.log(`  actualizados  ${r.actualizados}`);
    console.log(`  sin cambios   ${r.sinCambios}`);
    console.log(`  tareas nuevas ${r.tareasImportadas}`);
    if (r.errores.length) {
      console.error(`\n  errores (${r.errores.length}):`);
      r.errores.slice(0, 20).forEach((e) => console.error(`   - ${e}`));
    }
  }

  await app.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
