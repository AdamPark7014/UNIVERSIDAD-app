import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const hoy = new Date();
const pend = await p.sesion.count({
  where: {
    fecha: { lte: hoy },
    documentos: { some: { tipo: 'NOTAS', palabrasContenido: { lt: 50 } } },
  },
});
const ok = await p.sesion.count({
  where: { documentos: { some: { tipo: 'NOTAS', palabrasContenido: { gte: 50 } } } },
});
console.log('pendientes', pend, 'con notas', ok);
await p.$disconnect();
