/**
 * Prueba del lector/escritor de .docx contra archivos reales, sin base de datos.
 *
 *   pnpm --filter @universidad/api exec tsx src/scripts/probar-docx.ts
 *
 * Lee tres documentos representativos, muestra cómo quedaron clasificados sus
 * bloques y hace un viaje redondo (leer → escribir → releer) sobre una copia,
 * para comprobar que no se pierde contenido.
 */
import * as path from 'node:path';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import { DocxService } from '../docx/docx.service';

const RAIZ =
  process.env.DOCS_ROOT ??
  'C:\\Users\\adpoz\\OneDrive\\Documentos\\Universidad\\2026-Semestre-5';

const MUESTRAS = [
  ['03-Teoria-de-la-Computacion-NE111', 'Guia 19-08-2026.docx'],
  ['03-Teoria-de-la-Computacion-NE111', 'Notas 17-08-2026.docx'], // escrito a mano por el alumno
  ['06-Aleman-I-CS109', 'Notas 26-11-2026.docx'], // hoja en blanco
];

async function main() {
  const docx = new DocxService();

  for (const [carpeta, archivo] of MUESTRAS) {
    const ruta = path.join(RAIZ, carpeta, 'Notas', archivo);
    console.log('\n' + '='.repeat(78));
    console.log(`${carpeta}\\${archivo}`);
    console.log('='.repeat(78));

    let leido;
    try {
      leido = await docx.leer(ruta);
    } catch (e: any) {
      console.log(`  no se pudo leer: ${e.message}`);
      continue;
    }

    console.log(`  ${leido.bloques.length} bloques · ${leido.palabras} palabras`);
    const conteo: Record<string, number> = {};
    for (const b of leido.bloques) {
      conteo[b.tipo] = (conteo[b.tipo] ?? 0) + 1;
    }
    console.log(
      '  tipos: ' +
        Object.entries(conteo)
          .map(([t, n]) => `${t}=${n}`)
          .join(' '),
    );

    console.log('\n  primeros bloques:');
    for (const b of leido.bloques.slice(0, 8)) {
      const t = b.texto.length > 62 ? b.texto.slice(0, 62) + '…' : b.texto;
      console.log(`    ${b.tipo.padEnd(20)} ${JSON.stringify(t)}`);
    }

    // viaje redondo sobre una copia temporal
    const copia = path.join(os.tmpdir(), `rt-${archivo}`);
    await docx.escribir(
      copia,
      leido.bloques.map((b) => ({ tipo: b.tipo, texto: b.texto })),
    );
    const relectura = await docx.leer(copia);

    const textoOriginal = leido.bloques.map((b) => b.texto).filter(Boolean);
    const textoNuevo = relectura.bloques.map((b) => b.texto).filter(Boolean);
    const iguales =
      textoOriginal.length === textoNuevo.length &&
      textoOriginal.every((t, i) => t === textoNuevo[i]);

    console.log(
      `\n  viaje redondo: ${relectura.bloques.length} bloques, ` +
        `${relectura.palabras} palabras — texto ${iguales ? 'IDÉNTICO' : 'CON DIFERENCIAS'}`,
    );
    if (!iguales) {
      for (let i = 0; i < Math.max(textoOriginal.length, textoNuevo.length); i++) {
        if (textoOriginal[i] !== textoNuevo[i]) {
          console.log(`    [${i}] antes: ${JSON.stringify(textoOriginal[i]?.slice(0, 60))}`);
          console.log(`    [${i}] ahora: ${JSON.stringify(textoNuevo[i]?.slice(0, 60))}`);
          break;
        }
      }
    }
    await fs.unlink(copia).catch(() => {});
  }
  console.log('');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
