/**
 * Genera guías de estudio completas (.docx) por cada examen/quiz/parcial.
 * Las escribe en <materia>/Docs/Guias-estudio/
 *
 * Uso: npx tsx scripts/generar-guias-estudio.ts
 */
import { PrismaClient } from '@prisma/client';
import { DocxService, TipoBloque } from '../src/docx/docx.service';
import * as path from 'node:path';
import { promises as fs } from 'node:fs';

const prisma = new PrismaClient();
const docx = new DocxService();

type Bloque = { tipo: TipoBloque; texto: string };

function slug(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function fmtFecha(d: Date) {
  return d.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Contenido fijo extra para Alemán — hoja de trucos del examen. */
function cheatsheetAleman(titulo: string): Bloque[] {
  return [
    { tipo: 'ENCABEZADO', texto: 'HOJA DE TRUCOS — Alemán (léela cada día 10 min)' },
    { tipo: 'PARRAFO', texto: `Para: ${titulo}` },
    { tipo: 'ENCABEZADO', texto: '1. Conjugación Präsens — regulares' },
    {
      tipo: 'PARRAFO',
      texto:
        'Plantilla (machen = hacer): ich mache · du machst · er/sie/es macht · wir machen · ihr macht · sie/Sie machen. ' +
        'Terminaciones fijas: -e / -st / -t / -en / -t / -en. Si el verbo termina en -t/-d/-chn/-fn, du/er llevan -est/-et (arbeiten → du arbeitest).',
    },
    { tipo: 'ENCABEZADO', texto: '2. sein y haben (obligatorio de memoria)' },
    {
      tipo: 'VINETA',
      texto: 'sein: bin, bist, ist, sind, seid, sind',
    },
    {
      tipo: 'VINETA',
      texto: 'haben: habe, hast, hat, haben, habt, haben',
    },
    { tipo: 'ENCABEZADO', texto: '3. Posición del verbo' },
    {
      tipo: 'VINETA',
      texto: 'Enunciativa: 2ª posición → «Heute gehe ich zur Uni.» (no «Heute ich gehe…»)',
    },
    {
      tipo: 'VINETA',
      texto: 'Ja/Nein-Frage: verbo primero → «Bist du Student?»',
    },
    {
      tipo: 'VINETA',
      texto: 'W-Frage: Wort + verbo + sujeto → «Wie heißt du?» «Woher kommst du?»',
    },
    { tipo: 'ENCABEZADO', texto: '4. Vocabulario mínimo que siempre cae' },
    {
      tipo: 'VINETA',
      texto: 'Saludos: Hallo, Guten Tag, Guten Morgen, Auf Wiedersehen, Tschüss',
    },
    {
      tipo: 'VINETA',
      texto: 'Yo soy / me llamo: Ich bin… / Ich heiße… / Ich komme aus… / Ich wohne in…',
    },
    {
      tipo: 'VINETA',
      texto: 'Familia: die Mutter, der Vater, der Bruder, die Schwester, die Eltern, das Kind',
    },
    {
      tipo: 'VINETA',
      texto: 'Profesiones: der Student/die Studentin, der Ingenieur/die Ingenieurin, der Arzt/die Ärztin (¡con Umlaut!)',
    },
    {
      tipo: 'VINETA',
      texto: 'Possessivos: mein, dein, sein, ihr, unser, euer — +e en femenino/plural (meine Schwester)',
    },
    { tipo: 'ENCABEZADO', texto: '5. Errores que restan puntos' },
    {
      tipo: 'VINETA',
      texto: 'Olvidar mayúscula en sustantivos',
    },
    {
      tipo: 'VINETA',
      texto: 'Decir «Ich bin ein Student» → correcto: «Ich bin Student»',
    },
    {
      tipo: 'VINETA',
      texto: 'Responder ja a pregunta negativa cuando quieres contradecir → usa doch',
    },
    {
      tipo: 'VINETA',
      texto: 'Poner el verbo al final en oraciones simples',
    },
    { tipo: 'ENCABEZADO', texto: '6. Rutina de estudio de 25 minutos' },
    {
      tipo: 'NUMERADA',
      texto: '5 min: conjugación sein/haben + 1 regular en voz alta',
    },
    {
      tipo: 'NUMERADA',
      texto: '10 min: vocabulario de la guía (artículo + palabra + oración)',
    },
    {
      tipo: 'NUMERADA',
      texto: '5 min: escribir 5 oraciones nuevas sin mirar',
    },
    {
      tipo: 'NUMERADA',
      texto: '5 min: audio (allango / libro) — solo escuchar y repetir',
    },
  ];
}

/** Contenido fijo extra para EDO. */
function cheatsheetEdo(titulo: string): Bloque[] {
  return [
    { tipo: 'ENCABEZADO', texto: 'HOJA DE TRUCOS — EDO (qué estamos haciendo)' },
    { tipo: 'PARRAFO', texto: `Para: ${titulo}` },
    {
      tipo: 'PARRAFO',
      texto:
        'En español claro: te dan una ecuación que mezcla y con dy/dx (o y\'). Tu trabajo es ' +
        'encontrar la función y(x) que la cumple. Casi nunca se «adivina»: se clasifica el tipo y se aplica un método.',
    },
    { tipo: 'ENCABEZADO', texto: '1. Diccionario mínimo' },
    {
      tipo: 'VINETA',
      texto: 'y\' o dy/dx = derivada de y respecto a x (pendiente)',
    },
    {
      tipo: 'VINETA',
      texto: 'Orden = la derivada más alta (y\'\' → orden 2)',
    },
    {
      tipo: 'VINETA',
      texto: 'Solución general = familia con +C; particular = con condición inicial y(x0)=y0',
    },
    {
      tipo: 'VINETA',
      texto: 'PVI = problema de valor inicial (ecuación + condición)',
    },
    { tipo: 'ENCABEZADO', texto: '2. Árbol de decisión (memorízalo)' },
    {
      tipo: 'NUMERADA',
      texto: 'Separable: dy/dx = g(x)·h(y) → separa e integra ambos lados',
    },
    {
      tipo: 'NUMERADA',
      texto: 'Lineal 1er orden: y\' + P(x)y = f(x) → μ = e^(∫P dx)',
    },
    {
      tipo: 'NUMERADA',
      texto: 'Exacta: M dx + N dy = 0 y ∂M/∂y = ∂N/∂x → F(x,y)=C',
    },
    {
      tipo: 'NUMERADA',
      texto: 'Homogénea: f(tx,ty)=f(x,y) → y = u x',
    },
    {
      tipo: 'NUMERADA',
      texto: 'Bernoulli: y\' + P y = f y^n → v = y^(1−n)',
    },
    {
      tipo: 'NUMERADA',
      texto: 'Forma f(Ax+By+C) → u = Ax+By+C',
    },
    { tipo: 'ENCABEZADO', texto: '3. Factor integrante — pasos en limpio' },
    {
      tipo: 'NUMERADA',
      texto: 'Llevar a forma y\' + P(x)y = f(x) (dividir si hace falta)',
    },
    {
      tipo: 'NUMERADA',
      texto: 'Calcular μ(x) = exp(∫P(x) dx) — sin +C en esta integral',
    },
    {
      tipo: 'NUMERADA',
      texto: 'Multiplicar toda la ecuación por μ',
    },
    {
      tipo: 'NUMERADA',
      texto: 'Izquierda = d/dx[μ y]; integrar ambos lados',
    },
    {
      tipo: 'NUMERADA',
      texto: 'Despejar y; aplicar condición inicial si hay',
    },
    { tipo: 'ENCABEZADO', texto: '4. Errores típicos del parcial' },
    {
      tipo: 'VINETA',
      texto: 'No normalizar el coeficiente de y\' antes del factor integrante',
    },
    {
      tipo: 'VINETA',
      texto: 'Poner +C al calcular μ',
    },
    {
      tipo: 'VINETA',
      texto: 'Olvidar multiplicar el lado derecho por μ',
    },
    {
      tipo: 'VINETA',
      texto: 'Declarar exacta sin verificar ∂M/∂y = ∂N/∂x',
    },
    { tipo: 'ENCABEZADO', texto: '5. Rutina de estudio de 40 minutos' },
    {
      tipo: 'NUMERADA',
      texto: '10 min: clasificar 10 ecuaciones SIN resolver (solo decir el método)',
    },
    {
      tipo: 'NUMERADA',
      texto: '20 min: resolver 2 problemas completos a mano, con verificación',
    },
    {
      tipo: 'NUMERADA',
      texto: '10 min: reescribir el árbol de decisión de memoria',
    },
  ];
}

async function construirGuia(evalId: string): Promise<{ ruta: string; bloques: number } | null> {
  const ev = await prisma.evaluacion.findUnique({
    where: { id: evalId },
    include: {
      materia: {
        include: {
          criterios: true,
          horarios: true,
          semestre: true,
        },
      },
    },
  });
  if (!ev) return null;

  const materia = ev.materia;
  const hasta = ev.fecha;

  const sesiones = await prisma.sesion.findMany({
    where: { materiaId: materia.id, fecha: { lte: hasta } },
    orderBy: { fecha: 'asc' },
    include: {
      documentos: {
        include: { bloques: { orderBy: { orden: 'asc' } } },
      },
    },
  });

  const bloques: Bloque[] = [
    { tipo: 'TITULO', texto: `GUÍA DE ESTUDIO — ${ev.titulo}` },
    {
      tipo: 'SUBTITULO',
      texto: `${materia.clave} · ${materia.nombre} · ${fmtFecha(ev.fecha)}`,
    },
    { tipo: 'TEMA', texto: `${ev.tipo}${ev.peso != null ? ` · peso ${ev.peso}%` : ''}` },
    { tipo: 'SEPARADOR', texto: '' },
  ];

  bloques.push({ tipo: 'ENCABEZADO', texto: 'Qué es este examen' });
  bloques.push({
    tipo: 'PARRAFO',
    texto:
      ev.descripcion?.trim() ||
      `Evaluación tipo ${ev.tipo} de ${materia.nombre}. Fecha: ${fmtFecha(ev.fecha)}.`,
  });
  if (ev.peso != null) {
    bloques.push({
      tipo: 'PARRAFO',
      texto: `Peso en la calificación final: ${ev.peso}%.`,
    });
  }

  if (materia.criterios.length) {
    bloques.push({ tipo: 'ENCABEZADO', texto: 'Cómo se califica la materia' });
    for (const c of materia.criterios) {
      bloques.push({
        tipo: 'VINETA',
        texto: `${c.concepto}: ${c.porcentaje}%${c.notas ? ` — ${c.notas}` : ''}`,
      });
    }
  }

  // Cheatsheets materia-específicos
  if (materia.codigo === 'ale') {
    bloques.push({ tipo: 'SEPARADOR', texto: '' });
    bloques.push(...cheatsheetAleman(ev.titulo));
  } else if (materia.codigo === 'ecu') {
    bloques.push({ tipo: 'SEPARADOR', texto: '' });
    bloques.push(...cheatsheetEdo(ev.titulo));
  }

  bloques.push({ tipo: 'SEPARADOR', texto: '' });
  bloques.push({ tipo: 'ENCABEZADO', texto: 'Mapa de sesiones a dominar' });
  bloques.push({
    tipo: 'PARRAFO',
    texto: `Hasta la fecha del examen hay ${sesiones.length} sesiones. Estudia en este orden:`,
  });
  for (const s of sesiones) {
    bloques.push({
      tipo: 'VINETA',
      texto: `S${s.numero} · ${fmtFecha(s.fecha)} · ${s.tema}`,
    });
  }

  bloques.push({ tipo: 'SEPARADOR', texto: '' });
  bloques.push({ tipo: 'ENCABEZADO', texto: 'Contenido condensado por sesión' });

  for (const s of sesiones) {
    const guia = s.documentos.find((d) => d.tipo === 'GUIA');
    const notas = s.documentos.find((d) => d.tipo === 'NOTAS');
    bloques.push({ tipo: 'ENCABEZADO', texto: `Sesión ${s.numero}: ${s.tema}` });
    bloques.push({
      tipo: 'PARRAFO',
      texto: `${fmtFecha(s.fecha)} · ${s.horaInicio}-${s.horaFin}`,
    });

    const fuente = (notas?.palabrasContenido ?? 0) > 40 ? notas : guia;
    if (!fuente) {
      bloques.push({ tipo: 'PARRAFO', texto: '(Sin documento aún.)' });
      continue;
    }

    const utiles = fuente.bloques.filter(
      (b) =>
        ['ENCABEZADO', 'PARRAFO', 'VINETA', 'NUMERADA'].includes(b.tipo) &&
        b.texto.trim() &&
        !/^\(ideas que se me ocurren/i.test(b.texto),
    );

    // Limitar para no hacer monstruos, pero ser generosos
    let count = 0;
    for (const b of utiles) {
      if (count >= 28) break;
      if (b.tipo === 'ENCABEZADO') {
        bloques.push({ tipo: 'ENCABEZADO', texto: b.texto });
      } else {
        bloques.push({ tipo: b.tipo as TipoBloque, texto: b.texto });
      }
      count++;
    }
  }

  bloques.push({ tipo: 'SEPARADOR', texto: '' });
  bloques.push({ tipo: 'ENCABEZADO', texto: 'Checklist el día antes' });
  bloques.push({ tipo: 'VINETA', texto: 'Repasar el mapa de sesiones (arriba) y marcar lo débil' });
  bloques.push({ tipo: 'VINETA', texto: 'Hacer 1 simulación cronometrada (sin apuntes)' });
  bloques.push({ tipo: 'VINETA', texto: 'Dormir: la memoria de procedimientos se consolida con sueño' });
  if (materia.codigo === 'ale') {
    bloques.push({ tipo: 'VINETA', texto: 'Probar audífonos + laptop (examen en plataforma)' });
    bloques.push({ tipo: 'VINETA', texto: 'Repetir sein/haben y 10 oraciones en voz alta' });
  }
  if (materia.codigo === 'ecu') {
    bloques.push({ tipo: 'VINETA', texto: 'Reescribir el árbol de decisión de memoria' });
    bloques.push({ tipo: 'VINETA', texto: 'Resolver 3 problemas: 1 separable, 1 lineal, 1 exacta/sustitución' });
  }

  const carpeta = path.join(materia.semestre.raizDocumentos, materia.carpeta, 'Docs', 'Guias-estudio');
  await fs.mkdir(carpeta, { recursive: true });
  const nombre = `${slug(ev.tipo + '-' + ev.titulo)}.docx`;
  const ruta = path.join(carpeta, nombre);
  await docx.escribir(ruta, bloques, { respaldar: true });
  return { ruta, bloques: bloques.length };
}

async function main() {
  const exams = await prisma.evaluacion.findMany({
    where: { tipo: { in: ['PARCIAL', 'FINAL', 'QUIZ'] } },
    orderBy: { fecha: 'asc' },
    include: { materia: { select: { codigo: true, clave: true } } },
  });

  console.log(`Generando ${exams.length} guías de estudio…`);
  let ok = 0;
  for (const e of exams) {
    try {
      const r = await construirGuia(e.id);
      if (r) {
        ok++;
        console.log(`✓ ${e.materia.clave} · ${e.titulo} → ${r.ruta} (${r.bloques} bloques)`);
      }
    } catch (err: any) {
      console.error(`✗ ${e.titulo}:`, err.message);
    }
  }
  console.log(`\nListo: ${ok}/${exams.length} guías escritas en Docs/Guias-estudio/`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
