/**
 * Genera guías MEGA de estudio.
 * Uso: npx tsx scripts/generar-guias-estudio.ts [--solo=ale,ecu] [--proximos=14]
 */
import { PrismaClient } from '@prisma/client';
import { DocxService } from '../src/docx/docx.service';
import {
  generarGuiasEstudio,
  parseArgsCli,
} from '../src/guias-examen/generar-guias.logic';

async function main() {
  const prisma = new PrismaClient();
  const docx = new DocxService();
  const opts = parseArgsCli(process.argv);
  try {
    const r = await generarGuiasEstudio(prisma, docx, opts);
    console.log(`Generando ${r.total} guías MEGA de estudio…`);
    for (const g of r.resultados) {
      console.log(`✓ ${g.materia} · ${g.titulo} → ${g.kb} KB · ${g.bloques} bloques\n  ${g.ruta}`);
    }
    for (const e of r.errores) console.error(`✗ ${e}`);
    console.log(`\nListo: ${r.generadas}/${r.total} guías escritas en Docs/Guias-estudio/`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
