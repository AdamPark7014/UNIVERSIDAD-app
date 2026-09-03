/**
 * Genera guías de estudio MEGA-detalladas (.docx) por cada examen/quiz/parcial.
 * Las escribe en <materia>/Docs/Guias-estudio/
 *
 * Uso: npx tsx scripts/generar-guias-estudio.ts
 *      npx tsx scripts/generar-guias-estudio.ts --solo=ale,ecu
 *      npx tsx scripts/generar-guias-estudio.ts --proximos=14
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

function diasHasta(fecha: Date, desde = new Date()): number {
  const a = Date.UTC(desde.getFullYear(), desde.getMonth(), desde.getDate());
  const b = Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate());
  return Math.round((b - a) / 86400000);
}

function parseArgs() {
  const soloArg = process.argv.find((a) => a.startsWith('--solo='));
  const proximosArg = process.argv.find((a) => a.startsWith('--proximos='));
  return {
    solo: soloArg
      ? soloArg
          .split('=')[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : null as string[] | null,
    proximos: proximosArg ? parseInt(proximosArg.split('=')[1], 10) : null as number | null,
  };
}

/* ───────────────────── CHEATSHEETS MEGA ───────────────────── */

function megaAleman(titulo: string, dias: number): Bloque[] {
  const b: Bloque[] = [
    { tipo: 'ENCABEZADO', texto: 'HOJA DE TRUCOS MEGA — Alemán I (léela 2× al día)' },
    { tipo: 'PARRAFO', texto: `Para: ${titulo}. Días restantes: ${dias}.` },

    { tipo: 'ENCABEZADO', texto: 'A. Conjugación Präsens — plantilla fija' },
    {
      tipo: 'PARRAFO',
      texto:
        'Regulares (machen = hacer): ich mache · du machst · er/sie/es macht · wir machen · ihr macht · sie/Sie machen. ' +
        'Terminaciones: -e / -st / -t / -en / -t / -en. Si el verbo termina en -t/-d/-chn/-fn/-tm/-dn, du/er llevan -est/-et ' +
        '(arbeiten → du arbeitest, er arbeitet; finden → du findest).',
    },
    {
      tipo: 'PARRAFO',
      texto:
        'sein: ich bin · du bist · er/sie/es ist · wir sind · ihr seid · sie/Sie sind. ' +
        'haben: ich habe · du hast · er/sie/es hat · wir haben · ihr habt · sie/Sie haben. ' +
        'Memoriza ambas en voz alta hasta que salgan sin pensar.',
    },
    {
      tipo: 'PARRAFO',
      texto:
        'Verbos con cambio de vocal (Kapitel 1–2 típicos): sprechen → du sprichst, er spricht; ' +
        'lesen → du liest, er liest; fahren → du fährst, er fährt; nehmen → du nimmst, er nimmt; ' +
        'geben → du gibst, er gibt; essen → du isst, er isst. Solo cambian du/er; ich/wir/ihr/sie siguen la raíz.',
    },

    { tipo: 'ENCABEZADO', texto: 'B. Posición del verbo (regla de oro — siempre cae)' },
    {
      tipo: 'VINETA',
      texto: 'Enunciativa: verbo conjugado en 2ª posición. «Heute gehe ich zur Uni.» (NO «Heute ich gehe…»)',
    },
    {
      tipo: 'VINETA',
      texto: 'Ja/Nein-Frage: verbo primero. «Bist du Student?» «Kommst du aus Mexiko?»',
    },
    {
      tipo: 'VINETA',
      texto: 'W-Frage: Wort + verbo + sujeto. «Wie heißt du?» «Woher kommst du?» «Was machst du?» «Wo wohnst du?»',
    },
    {
      tipo: 'VINETA',
      texto: 'Negación: nicht (niega verbo/adjetivo/toda la oración) · kein/keine (niega sustantivo con artículo indefinido). «Ich bin nicht müde.» «Ich habe keine Geschwister.»',
    },

    { tipo: 'ENCABEZADO', texto: 'C. Vocabulario mínimo Examen 1 (Kapitel 1 + 2)' },
    {
      tipo: 'VINETA',
      texto: 'Saludos: Hallo, Guten Morgen, Guten Tag, Guten Abend, Auf Wiedersehen, Tschüss, Bis bald',
    },
    {
      tipo: 'VINETA',
      texto: 'Presentarse: Ich heiße… / Ich bin… / Ich komme aus… / Ich wohne in… / Ich studiere… / Ich spreche…',
    },
    {
      tipo: 'VINETA',
      texto: 'Familia: die Mutter, der Vater, die Eltern, der Bruder, die Schwester, das Kind, die Tochter, der Sohn, die Großeltern',
    },
    {
      tipo: 'VINETA',
      texto:
        'Possessivos: mein/meine, dein/deine, sein/seine, ihr/ihre, unser/unsere, euer/eure. ' +
        'Sin -e en masculino/neutro singular; con -e en femenino y plural. «mein Vater / meine Mutter / meine Eltern»',
    },
    {
      tipo: 'VINETA',
      texto:
        'Profesiones (sin artículo tras sein): der Student/die Studentin, der Ingenieur/die Ingenieurin, ' +
        'der Arzt/die Ärztin, der Lehrer/die Lehrerin, der Informatiker/die Informatikerin. «Ich bin Studentin.»',
    },
    {
      tipo: 'VINETA',
      texto: 'Números: 0–20 de memoria; 21+ al revés (einundzwanzig). Teléfono: zwo a veces por zwei.',
    },
    {
      tipo: 'VINETA',
      texto: 'W-Wörter: wer, was, wo, woher, wohin, wie, wann, warum, welche(r/s)',
    },

    { tipo: 'ENCABEZADO', texto: 'D. Errores que restan puntos (evítalos)' },
    { tipo: 'VINETA', texto: 'Olvidar mayúscula en sustantivos (Student, Familie, Informatik)' },
    { tipo: 'VINETA', texto: '«Ich bin ein Student» → correcto: «Ich bin Student»' },
    { tipo: 'VINETA', texto: 'Responder ja a pregunta negativa cuando contradices → usa doch' },
    { tipo: 'VINETA', texto: 'Poner el verbo al final en oraciones simples' },
    { tipo: 'VINETA', texto: 'Confundir du/Sie (formal) en el examen escrito: mira el contexto' },
    { tipo: 'VINETA', texto: 'Olvidar Umlaut: Ärztin, spät, schön, fünf' },

    { tipo: 'ENCABEZADO', texto: 'E. Mini-examen (hazlo YA, sin mirar; luego chequea)' },
    { tipo: 'NUMERADA', texto: 'Conjuga «wohnen» en las 6 personas.' },
    { tipo: 'NUMERADA', texto: 'Conjuga «sein» y «haben» completo.' },
    { tipo: 'NUMERADA', texto: 'Traduce: «¿De dónde vienes?» / «Me llamo Ada.» / «Soy estudiante.» / «Vivo en Puebla.»' },
    { tipo: 'NUMERADA', texto: 'Escribe 4 oraciones sobre tu familia con mein/meine.' },
    { tipo: 'NUMERADA', texto: 'Haz 3 Ja/Nein-Fragen y 3 W-Fragen sobre estudios/familia.' },
    { tipo: 'NUMERADA', texto: 'Corrige: «Heute ich gehe zur Uni.» / «Ich bin ein Ingenieur.» / «Kommst du nicht? — Ja!» (si quieres decir que SÍ vienes)' },

    { tipo: 'ENCABEZADO', texto: 'F. Respuestas del mini-examen' },
    {
      tipo: 'PARRAFO',
      texto:
        'wohnen: wohne, wohnst, wohnt, wohnen, wohnt, wohnen. ' +
        'Woher kommst du? / Ich heiße Ada. / Ich bin Student(in). / Ich wohne in Puebla. ' +
        'Correcciones: «Heute gehe ich zur Uni.» · «Ich bin Ingenieur.» · «Doch!»',
    },

    { tipo: 'ENCABEZADO', texto: 'G. Rutina diaria hasta el examen (25–40 min)' },
    { tipo: 'NUMERADA', texto: '5 min: sein + haben + 1 regular + 1 con cambio de vocal, en voz alta' },
    { tipo: 'NUMERADA', texto: '10 min: vocabulario (artículo + palabra + 1 oración propia)' },
    { tipo: 'NUMERADA', texto: '10 min: escribir 8 oraciones nuevas sin mirar (familia + estudios + ciudad)' },
    { tipo: 'NUMERADA', texto: '5–10 min: audio (allango / libro) — solo escuchar y repetir' },
    { tipo: 'NUMERADA', texto: 'Día antes: simulación 20 min cronometrada + probar audífonos/laptop si es en plataforma' },
  ];
  return b;
}

function megaEdo(titulo: string, dias: number): Bloque[] {
  return [
    { tipo: 'ENCABEZADO', texto: 'HOJA DE TRUCOS MEGA — EDO (qué estamos haciendo)' },
    {
      tipo: 'PARRAFO',
      texto:
        `Para: ${titulo}. Días restantes: ${dias}. En español claro: te dan una ecuación que mezcla y con dy/dx (o y'). ` +
        'Tu trabajo es encontrar la función y(x) que la cumple. Casi nunca se «adivina»: se clasifica el tipo y se aplica un método.',
    },

    { tipo: 'ENCABEZADO', texto: '1. Diccionario mínimo (sin esto no hay examen)' },
    { tipo: 'VINETA', texto: "y' o dy/dx = derivada de y respecto a x (pendiente de la solución)" },
    { tipo: 'VINETA', texto: 'Orden = la derivada más alta (y\'\' → orden 2)' },
    { tipo: 'VINETA', texto: 'Solución general = familia con +C; particular = con condición inicial y(x₀)=y₀' },
    { tipo: 'VINETA', texto: 'PVI = problema de valor inicial (ecuación + condición)' },
    { tipo: 'VINETA', texto: 'Lineal = y y sus derivadas aparecen a la primera potencia, sin productos entre ellas' },

    { tipo: 'ENCABEZADO', texto: '2. Árbol de decisión — memorízalo y úsalo en este orden' },
    { tipo: 'NUMERADA', texto: 'Separable: dy/dx = g(x)·h(y) → ∫ dy/h(y) = ∫ g(x) dx + C' },
    { tipo: 'NUMERADA', texto: "Lineal 1er orden: y' + P(x)y = f(x) → μ = e^(∫P dx)" },
    { tipo: 'NUMERADA', texto: 'Exacta: M dx + N dy = 0 y ∂M/∂y = ∂N/∂x → F(x,y)=C' },
    { tipo: 'NUMERADA', texto: 'Homogénea: f(tx,ty)=f(x,y) → y = u·x (o x = v·y)' },
    { tipo: 'NUMERADA', texto: "Bernoulli: y' + P y = f yⁿ → v = y^(1−n) → lineal" },
    { tipo: 'NUMERADA', texto: 'Forma f(Ax+By+C) → u = Ax+By+C → separable' },

    { tipo: 'ENCABEZADO', texto: '3. Factor integrante — pasos en limpio (copia esto en el examen)' },
    { tipo: 'NUMERADA', texto: "Llevar a forma y' + P(x)y = f(x) (dividir si el coeficiente de y' ≠ 1)" },
    { tipo: 'NUMERADA', texto: 'Calcular μ(x) = exp(∫P(x) dx) — SIN +C en esta integral' },
    { tipo: 'NUMERADA', texto: 'Multiplicar TODA la ecuación por μ' },
    { tipo: 'NUMERADA', texto: 'Izquierda = d/dx[μ y]; integrar ambos lados' },
    { tipo: 'NUMERADA', texto: 'Despejar y; aplicar condición inicial si hay; VERIFICAR derivando' },

    { tipo: 'ENCABEZADO', texto: '4. Exactas — plantilla' },
    {
      tipo: 'PARRAFO',
      texto:
        'Escribe M(x,y) dx + N(x,y) dy = 0. Verifica ∂M/∂y = ∂N/∂x. Integra M respecto a x: F = ∫M dx + g(y). ' +
        'Impón ∂F/∂y = N para hallar g\'(y) y luego g(y). Solución: F(x,y)=C.',
    },

    { tipo: 'ENCABEZADO', texto: '5. Separables — plantilla' },
    {
      tipo: 'PARRAFO',
      texto:
        'Si y\' = g(x)h(y), escribe dy/h(y) = g(x) dx (cuidado si h(y)=0 son soluciones singulares). ' +
        'Integra ambos lados. Despeja y si es fácil; si no, deja implícito. Aplica PVI.',
    },

    { tipo: 'ENCABEZADO', texto: '6. Errores típicos del parcial' },
    { tipo: 'VINETA', texto: 'No normalizar el coeficiente de y\' antes del factor integrante' },
    { tipo: 'VINETA', texto: 'Poner +C al calcular μ' },
    { tipo: 'VINETA', texto: 'Olvidar multiplicar el lado derecho por μ' },
    { tipo: 'VINETA', texto: 'Declarar exacta sin verificar ∂M/∂y = ∂N/∂x' },
    { tipo: 'VINETA', texto: 'Perder soluciones constantes al dividir por h(y)' },
    { tipo: 'VINETA', texto: 'No verificar sustituyendo la respuesta en la EDO' },

    { tipo: 'ENCABEZADO', texto: '7. Banco de problemas tipo examen (resuélvelos a mano)' },
    { tipo: 'NUMERADA', texto: "Separable: y' = 2xy  con y(0)=3. (Resp: y = 3 e^(x²))" },
    { tipo: 'NUMERADA', texto: "Lineal: y' + y = e^x  con y(0)=0. (Resp: y = (e^x − e^(−x))/2 = sinh x)" },
    { tipo: 'NUMERADA', texto: "Lineal: y' − (2/x)y = x  (x>0). (μ=1/x²; y = x² ln|x| + C x² → ajustar forma)" },
    { tipo: 'NUMERADA', texto: 'Exacta: (2x + y) dx + (x − 2y) dy = 0. Verifica y resuelve F=C.' },
    { tipo: 'NUMERADA', texto: "Homogénea: y' = (x+y)/x. Sustituye y=ux." },
    {
      tipo: 'PARRAFO',
      texto:
        'Pista lineal y\'+y=e^x: P=1, μ=e^x, d/dx[ye^x]=e^(2x), ye^x = (1/2)e^(2x)+C, y=(1/2)e^x + C e^(−x). ' +
        'Con y(0)=0 → 0=1/2+C → C=−1/2 → y=(e^x − e^(−x))/2.',
    },

    { tipo: 'ENCABEZADO', texto: '8. Rutina de estudio de 40–50 minutos' },
    { tipo: 'NUMERADA', texto: '10 min: clasificar 10 ecuaciones SIN resolver (solo decir el método)' },
    { tipo: 'NUMERADA', texto: '25 min: resolver 2–3 problemas completos a mano, con verificación' },
    { tipo: 'NUMERADA', texto: '10 min: reescribir el árbol de decisión de memoria' },
    { tipo: 'NUMERADA', texto: 'Día antes: 1 simulación de 45–60 min con 3 problemas mixtos' },
  ];
}

function megaEmbebidos(titulo: string): Bloque[] {
  return [
    { tipo: 'ENCABEZADO', texto: 'HOJA DE TRUCOS — Sistemas Embebidos (Unidad 1)' },
    { tipo: 'PARRAFO', texto: `Para: ${titulo}` },
    {
      tipo: 'PARRAFO',
      texto:
        'Un sistema embebido es un sistema de cómputo dedicado dentro de un producto (no una PC de propósito general). ' +
        'En Unidad 1 el foco es: HDL (Verilog/VHDL), circuitos combinacionales vs secuenciales, y modelado de flip-flops.',
    },
    { tipo: 'ENCABEZADO', texto: 'Checklist conceptual' },
    { tipo: 'VINETA', texto: 'Combinacional: salidas = f(entradas actuales). Sin memoria. Ej: sumador, mux, decoder.' },
    { tipo: 'VINETA', texto: 'Secuencial: salidas dependen también del estado (memoria). Reloj + flip-flops.' },
    { tipo: 'VINETA', texto: 'Flip-flop D: Q sigue a D en flanco de reloj. Base de registros.' },
    { tipo: 'VINETA', texto: 'always @(*) → combinacional; always @(posedge clk) → secuencial síncrono.' },
    { tipo: 'VINETA', texto: 'blocking (=) vs non-blocking (<=): en secuencial usa <=; en combinacional suele =.' },
    { tipo: 'VINETA', texto: 'HDL describe hardware concurrente: no es «un programa que corre línea a línea» como C.' },
    { tipo: 'ENCABEZADO', texto: 'Errores típicos de evaluación' },
    { tipo: 'VINETA', texto: 'Describir latches no intencionales (if sin else en combinacional)' },
    { tipo: 'VINETA', texto: 'Mezclar = y <= mal en el mismo proceso' },
    { tipo: 'VINETA', texto: 'Olvidar sensibilidad del always / lista incompleta' },
    { tipo: 'ENCABEZADO', texto: 'Rutina pre-examen' },
    { tipo: 'NUMERADA', texto: 'Redibuja de memoria: mux, decoder, FF-D, registro de N bits' },
    { tipo: 'NUMERADA', texto: 'Escribe un always combinacional y uno secuencial correctos' },
    { tipo: 'NUMERADA', texto: 'Explica en 4 frases qué es un embebido y por qué usamos HDL' },
  ];
}

function megaArquitectura(titulo: string): Bloque[] {
  return [
    { tipo: 'ENCABEZADO', texto: 'HOJA DE TRUCOS — Arquitecturas (1er parcial)' },
    { tipo: 'PARRAFO', texto: `Para: ${titulo}` },
    {
      tipo: 'PARRAFO',
      texto:
        'El parcial suele pedir: evolución de arquitecturas, RISC vs CISC, y taxonomía de Flynn. ' +
        'Estudia definiciones precisas + 1 ejemplo de cada clase.',
    },
    { tipo: 'VINETA', texto: 'CISC: pocas instrucciones complejas, varios ciclos, más modos de direccionamiento (x86 clásico).' },
    { tipo: 'VINETA', texto: 'RISC: muchas instrucciones simples, pipeline amigable, load/store (MIPS, ARM, RISC-V).' },
    { tipo: 'VINETA', texto: 'Flynn: SISD (clásico), SIMD (vector/GPU lanes), MISD (raro), MIMD (multicore/clusters).' },
    { tipo: 'VINETA', texto: 'Pipeline: solapa etapas IF/ID/EX/MEM/WB; hazards: datos, control, estructurales.' },
    { tipo: 'ENCABEZADO', texto: 'Auto-test' },
    { tipo: 'NUMERADA', texto: 'Define RISC y CISC con 3 diferencias medibles' },
    { tipo: 'NUMERADA', texto: 'Clasifica: CPU un núcleo, GPU, cluster de servidores' },
    { tipo: 'NUMERADA', texto: 'Explica por qué RISC facilita el pipeline' },
  ];
}

function megaEscritura(titulo: string): Bloque[] {
  return [
    { tipo: 'ENCABEZADO', texto: 'HOJA DE TRUCOS — Escritura Académica (1er parcial)' },
    { tipo: 'PARRAFO', texto: `Para: ${titulo}` },
    {
      tipo: 'PARRAFO',
      texto:
        'El parcial evalúa lectura crítica, postura propia y manejo de fuentes — no solo «escribir bonito». ' +
        'Prepara: definición de tu tema, pregunta de investigación, mapa de fuentes y diferencias entre resumen/paráfrasis/cita.',
    },
    { tipo: 'VINETA', texto: 'Resumen: ideas principales con tus palabras, más corto que el original.' },
    { tipo: 'VINETA', texto: 'Paráfrasis: misma idea, otras palabras, extensión similar; sigue citando la fuente.' },
    { tipo: 'VINETA', texto: 'Cita textual: entre comillas + referencia; úsala cuando la redacción exacta importa.' },
    { tipo: 'VINETA', texto: 'Postura: tesis clara + argumentos + contraargumento + evidencia.' },
    { tipo: 'VINETA', texto: 'Plagio: no citar, citar mal, o «parafrasear» cambiando solo sinónimos.' },
    { tipo: 'ENCABEZADO', texto: 'Checklist del día antes' },
    { tipo: 'NUMERADA', texto: 'Escribe tu tema en 1 oración y tu pregunta en 1 oración' },
    { tipo: 'NUMERADA', texto: 'Lista 3 fuentes y qué aporta cada una' },
    { tipo: 'NUMERADA', texto: 'Practica un párrafo: afirmación → evidencia → comentario' },
  ];
}

function planDias(dias: number, materiaCodigo: string): Bloque[] {
  const out: Bloque[] = [
    { tipo: 'ENCABEZADO', texto: 'Plan día a día hasta el examen' },
    {
      tipo: 'PARRAFO',
      texto:
        dias <= 0
          ? 'El examen es hoy o ya pasó: usa solo el checklist final y la hoja de trucos.'
          : `Quedan ${dias} día(s). Sigue este plan (ajusta si llegas tarde: prioriza hoja de trucos + 1 simulación).`,
    },
  ];
  if (dias <= 0) return out;

  for (let d = dias; d >= 1; d--) {
    let foco = 'Repaso general del mapa de sesiones + 1 bloque débil.';
    if (materiaCodigo === 'ale') {
      if (d >= 4) foco = 'Conjugación sein/haben/regulares + vocabulario Kapitel 1 (saludos, números, W-Fragen).';
      else if (d === 3) foco = 'Familia + possessivos + profesiones (Kapitel 2). 15 oraciones escritas.';
      else if (d === 2) foco = 'Mini-examen de la hoja de trucos + audio 10 min + corregir errores.';
      else foco = 'Simulación 20 min + sein/haben en voz alta + probar equipo si aplica.';
    } else if (materiaCodigo === 'ecu') {
      if (d >= 4) foco = 'Clasificar 15 ecuaciones (solo método) + 2 separables completas.';
      else if (d === 3) foco = 'Factor integrante: 3 problemas lineales con verificación.';
      else if (d === 2) foco = 'Exactas + 1 sustitución; reescribe el árbol de memoria.';
      else foco = 'Simulación 45–60 min: 1 separable, 1 lineal, 1 exacta/sustitución.';
    } else if (materiaCodigo === 'emb') {
      if (d >= 2) foco = 'Combinacional vs secuencial + always/@ + 1 diagrama FF-D.';
      else foco = 'Repaso rápido Unidad 1 + escribe 2 snippets Verilog de memoria.';
    } else if (d === 1) {
      foco = 'Simulación corta + checklist del día antes + dormir temprano.';
    }
    out.push({ tipo: 'VINETA', texto: `Faltan ${d} día(s): ${foco}` });
  }
  return out;
}

/* ───────────────────── CONSTRUCCIÓN ───────────────────── */

async function construirGuia(evalId: string): Promise<{ ruta: string; bloques: number; kb: number } | null> {
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
  const dias = diasHasta(ev.fecha);

  const sesiones = await prisma.sesion.findMany({
    where: {
      materiaId: materia.id,
      fecha: { lte: hasta },
      // excluye la sesión del día del examen si el tema es solo el examen
      NOT: {
        AND: [{ fecha: hasta }, { tema: { contains: 'Examen' } }],
      },
    },
    orderBy: { fecha: 'asc' },
    include: {
      documentos: {
        include: { bloques: { orderBy: { orden: 'asc' } } },
      },
    },
  });

  const bloques: Bloque[] = [
    { tipo: 'TITULO', texto: `GUÍA MEGA DE ESTUDIO — ${ev.titulo}` },
    {
      tipo: 'SUBTITULO',
      texto: `${materia.clave} · ${materia.nombre} · ${fmtFecha(ev.fecha)}`,
    },
    {
      tipo: 'TEMA',
      texto: `${ev.tipo}${ev.peso != null ? ` · peso ${ev.peso}%` : ''} · ${dias >= 0 ? `${dias} día(s) para prepararte` : 'fecha pasada'}`,
    },
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
      texto: `Peso en la calificación final: ${ev.peso}%. Trátalo como prioridad alta si el peso es ≥15%.`,
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

  bloques.push({ tipo: 'SEPARADOR', texto: '' });
  bloques.push(...planDias(Math.min(Math.max(dias, 0), 10), materia.codigo));

  // Cheatsheets materia-específicos
  bloques.push({ tipo: 'SEPARADOR', texto: '' });
  if (materia.codigo === 'ale') bloques.push(...megaAleman(ev.titulo, dias));
  else if (materia.codigo === 'ecu') bloques.push(...megaEdo(ev.titulo, dias));
  else if (materia.codigo === 'emb') bloques.push(...megaEmbebidos(ev.titulo));
  else if (materia.codigo === 'arq') bloques.push(...megaArquitectura(ev.titulo));
  else if (materia.codigo === 'esc') bloques.push(...megaEscritura(ev.titulo));

  bloques.push({ tipo: 'SEPARADOR', texto: '' });
  bloques.push({ tipo: 'ENCABEZADO', texto: 'Mapa de sesiones a dominar' });
  bloques.push({
    tipo: 'PARRAFO',
    texto: `Hasta la fecha del examen hay ${sesiones.length} sesiones de contenido. Estudia en este orden y marca ✓ lo que ya dominas:`,
  });
  for (const s of sesiones) {
    const notas = s.documentos.find((d) => d.tipo === 'NOTAS');
    const estado =
      (notas?.palabrasContenido ?? 0) >= 50 ? 'apuntes listos' : 'apuntes flojos — prioriza la guía';
    bloques.push({
      tipo: 'VINETA',
      texto: `S${s.numero} · ${fmtFecha(s.fecha)} · ${s.tema} · (${estado})`,
    });
  }

  bloques.push({ tipo: 'SEPARADOR', texto: '' });
  bloques.push({ tipo: 'ENCABEZADO', texto: 'Contenido detallado por sesión (de tus notas + guía)' });
  bloques.push({
    tipo: 'PARRAFO',
    texto:
      'Abajo está condensado lo más útil de cada sesión. Si una sección está delgada, abre el .docx de Notas de esa fecha.',
  });

  const flashcards: string[] = [];

  for (const s of sesiones) {
    const guia = s.documentos.find((d) => d.tipo === 'GUIA');
    const notas = s.documentos.find((d) => d.tipo === 'NOTAS');
    bloques.push({ tipo: 'ENCABEZADO', texto: `Sesión ${s.numero}: ${s.tema}` });
    bloques.push({
      tipo: 'PARRAFO',
      texto: `${fmtFecha(s.fecha)} · ${s.horaInicio}-${s.horaFin}`,
    });

    const fuente =
      (notas?.palabrasContenido ?? 0) > 40
        ? notas
        : guia ?? notas;
    if (!fuente) {
      bloques.push({ tipo: 'PARRAFO', texto: '(Sin documento aún — revisa la carpeta de la materia.)' });
      continue;
    }

    const utiles = fuente.bloques.filter(
      (b) =>
        ['ENCABEZADO', 'PARRAFO', 'VINETA', 'NUMERADA'].includes(b.tipo) &&
        b.texto.trim() &&
        !/^\(ideas que se me ocurren/i.test(b.texto) &&
        !/^ATAJO RÁPIDO/i.test(b.texto) &&
        !/^HOJA DE TRUCOS/i.test(b.texto),
    );

    // Generoso: hasta 55 bloques útiles por sesión
    let count = 0;
    for (const b of utiles) {
      if (count >= 55) break;
      if (b.tipo === 'ENCABEZADO') {
        bloques.push({ tipo: 'ENCABEZADO', texto: b.texto });
      } else {
        bloques.push({ tipo: b.tipo as TipoBloque, texto: b.texto });
      }
      if (['VINETA', 'NUMERADA'].includes(b.tipo) && b.texto.length < 120 && flashcards.length < 40) {
        flashcards.push(b.texto);
      }
      count++;
    }

    if (count >= 55 && utiles.length > 55) {
      bloques.push({
        tipo: 'PARRAFO',
        texto: `(… +${utiles.length - 55} bloques más en el documento de ${fuente.tipo === 'NOTAS' ? 'Notas' : 'Guía'} de esta sesión.)`,
      });
    }
  }

  if (flashcards.length) {
    bloques.push({ tipo: 'SEPARADOR', texto: '' });
    bloques.push({ tipo: 'ENCABEZADO', texto: 'Flashcards rápidas (cubre la respuesta)' });
    bloques.push({
      tipo: 'PARRAFO',
      texto: 'Lee la pregunta, di la respuesta en voz alta, luego destapa. Marca las que falles y repítelas mañana.',
    });
    for (const f of flashcards.slice(0, 25)) {
      bloques.push({
        tipo: 'VINETA',
        texto: `¿Qué debes recordar de: «${f}»?`,
      });
    }
  }

  bloques.push({ tipo: 'SEPARADOR', texto: '' });
  bloques.push({ tipo: 'ENCABEZADO', texto: 'Checklist el día antes' });
  bloques.push({ tipo: 'VINETA', texto: 'Repasar el mapa de sesiones y marcar lo débil' });
  bloques.push({ tipo: 'VINETA', texto: 'Hacer 1 simulación cronometrada (sin apuntes)' });
  bloques.push({ tipo: 'VINETA', texto: 'Releer solo la hoja de trucos (no todo el archivo)' });
  bloques.push({ tipo: 'VINETA', texto: 'Dormir: la memoria de procedimientos se consolida con sueño' });
  if (materia.codigo === 'ale') {
    bloques.push({ tipo: 'VINETA', texto: 'Probar audífonos + laptop (examen en plataforma)' });
    bloques.push({ tipo: 'VINETA', texto: 'Repetir sein/haben y 10 oraciones en voz alta' });
  }
  if (materia.codigo === 'ecu') {
    bloques.push({ tipo: 'VINETA', texto: 'Reescribir el árbol de decisión de memoria' });
    bloques.push({ tipo: 'VINETA', texto: 'Resolver 3 problemas: 1 separable, 1 lineal, 1 exacta/sustitución' });
  }
  if (materia.codigo === 'emb') {
    bloques.push({ tipo: 'VINETA', texto: 'Escribir de memoria un always combinacional y uno secuencial' });
  }

  const carpeta = path.join(materia.semestre.raizDocumentos, materia.carpeta, 'Docs', 'Guias-estudio');
  await fs.mkdir(carpeta, { recursive: true });
  const nombre = `${slug(ev.tipo + '-' + ev.titulo)}.docx`;
  const ruta = path.join(carpeta, nombre);
  await docx.escribir(ruta, bloques, { respaldar: true });
  const st = await fs.stat(ruta);
  return { ruta, bloques: bloques.length, kb: Math.round(st.size / 1024) };
}

async function main() {
  const { solo, proximos } = parseArgs();
  const ahora = new Date();
  const limite = proximos != null ? new Date(ahora.getTime() + proximos * 86400000) : null;

  const exams = await prisma.evaluacion.findMany({
    where: {
      tipo: { in: ['PARCIAL', 'FINAL', 'QUIZ'] },
      ...(solo ? { materia: { codigo: { in: solo } } } : {}),
      ...(limite ? { fecha: { lte: limite } } : {}),
    },
    orderBy: { fecha: 'asc' },
    include: { materia: { select: { codigo: true, clave: true } } },
  });

  console.log(`Generando ${exams.length} guías MEGA de estudio…`);
  let ok = 0;
  for (const e of exams) {
    try {
      const r = await construirGuia(e.id);
      if (r) {
        ok++;
        console.log(
          `✓ ${e.materia.clave} · ${e.titulo} → ${r.kb} KB · ${r.bloques} bloques\n  ${r.ruta}`,
        );
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
