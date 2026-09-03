/**
 * Genera apuntes para todas las sesiones pendientes en dev.
 * Uso: npx tsx scripts/generar-notas-pendientes.ts [--solo-app] [--limite N]
 */
import { PrismaClient } from '@prisma/client';
import { generarCuerpoDesdeGuia, contarPalabrasCuerpo } from '../src/notas/generador-cuerpo';

const prisma = new PrismaClient();
const soloApp = process.argv.includes('--solo-app');
const limiteArg = process.argv.find((a) => a.startsWith('--limite='));
const limite = limiteArg ? parseInt(limiteArg.split('=')[1], 10) : 500;
const umbral = parseInt(process.env.UMBRAL_NOTAS ?? '50', 10);

async function main() {
  const hoy = new Date();
  const sesiones = await prisma.sesion.findMany({
    where: {
      fecha: { lte: hoy },
      documentos: { some: { tipo: 'NOTAS', palabrasContenido: { lt: umbral } } },
    },
    orderBy: { fecha: 'asc' },
    take: limite,
    include: {
      materia: { select: { nombre: true, clave: true } },
      documentos: { include: { bloques: { orderBy: { orden: 'asc' } } } },
    },
  });

  console.log(`Sesiones pendientes a procesar: ${sesiones.length}`);

  let ok = 0;
  let err = 0;

  for (const sesion of sesiones) {
    const notas = sesion.documentos.find((d) => d.tipo === 'NOTAS');
    const guia = sesion.documentos.find((d) => d.tipo === 'GUIA');
    if (!notas || !guia) {
      console.warn('Omitida', sesion.id, 'sin guía o notas');
      continue;
    }

    const cabecera = notas.bloques.filter((b) =>
      ['TITULO', 'SUBTITULO', 'TEMA', 'SEPARADOR'].includes(b.tipo),
    );
    const idxTarea = notas.bloques.findIndex((b) => b.tipo === 'TAREA_PROPIA_TITULO');
    const pie =
      idxTarea >= 0
        ? notas.bloques.slice(idxTarea)
        : [
            { orden: 0, documentoId: notas.id, tipo: 'TAREA_PROPIA_TITULO', texto: 'TAREA PROPIA' },
            {
              orden: 1,
              documentoId: notas.id,
              tipo: 'PARRAFO',
              texto: '(ideas que se me ocurren en clase para investigar por mi cuenta)',
            },
            { orden: 2, documentoId: notas.id, tipo: 'ESPACIO', texto: '' },
          ];

    const cuerpo = generarCuerpoDesdeGuia(
      guia.bloques.map((b) => ({ tipo: b.tipo, texto: b.texto })),
      {
        tema: sesion.tema,
        materiaNombre: sesion.materia.nombre,
        materiaClave: sesion.materia.clave,
      },
    );

    const bloques = [
      ...cabecera.map((b, orden) => ({
        documentoId: notas.id,
        orden,
        tipo: b.tipo,
        texto: b.texto,
      })),
      ...cuerpo.map((b, i) => ({
        documentoId: notas.id,
        orden: cabecera.length + i,
        tipo: b.tipo,
        texto: b.texto,
      })),
      ...pie.map((b, i) => ({
        documentoId: notas.id,
        orden: cabecera.length + cuerpo.length + i,
        tipo: b.tipo,
        texto: b.texto,
      })),
    ];

    const palabras = bloques.reduce(
      (n, b) => n + (b.texto.trim() ? b.texto.trim().split(/\s+/).length : 0),
      0,
    );
    const palabrasContenido = contarPalabrasCuerpo(cuerpo);

    try {
      await prisma.$transaction([
        prisma.bloque.deleteMany({ where: { documentoId: notas.id } }),
        prisma.bloque.createMany({ data: bloques }),
        prisma.documento.update({
          where: { id: notas.id },
          data: {
            pendienteDeEscribir: !soloApp,
            palabras,
            palabrasContenido,
            origen: 'GENERADO',
          },
        }),
      ]);
      if (sesion.estado !== 'REVISADA') {
        await prisma.sesion.update({
          where: { id: sesion.id },
          data: { estado: palabrasContenido > 0 ? 'CURSADA' : 'PENDIENTE' },
        });
      }
      ok++;
      console.log(
        `✓ ${sesion.materia.clave} · ${sesion.tema.slice(0, 50)} — ${palabrasContenido} palabras`,
      );
    } catch (e: any) {
      err++;
      console.error('✗', sesion.id, e.message);
    }
  }

  console.log(`\nListo: ${ok} generados, ${err} errores`);
  if (!soloApp) {
    console.log(
      'Nota: los .docx no se escribieron en disco. Arranca la API y ejecuta POST /api/sync/escribir o usa la UI.',
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
