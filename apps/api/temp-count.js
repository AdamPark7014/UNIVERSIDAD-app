const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
Promise.all([p.materia.count(), p.sesion.count(), p.bloque.count()])
  .then(([m, s, b]) => console.log(JSON.stringify({ materias: m, sesiones: s, bloques: b })))
  .finally(() => p.$disconnect());
