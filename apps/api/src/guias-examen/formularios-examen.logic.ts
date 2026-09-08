/**
 * Formularios de práctica imprimibles (blancos) + claves.
 * Archivos: PRACTICA-*.docx y PRACTICA-*-CLAVE.docx en Docs/Guias-estudio/
 * No se mezclan con las guías MEGA (esas llevan respuestas).
 */
import type { PrismaClient } from '@prisma/client';
import { DocxService, TipoBloque } from '../docx/docx.service';
import * as path from 'node:path';
import { promises as fs } from 'node:fs';

type Bloque = { tipo: TipoBloque; texto: string };

const L = '________________________________________________________________________';

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

function lineas(n: number): Bloque[] {
  return Array.from({ length: n }, () => ({ tipo: 'PARRAFO' as const, texto: L }));
}

function cabecera(
  tituloForm: string,
  materia: string,
  clave: string,
  fecha: Date,
  peso: number | null,
  minutos: number,
): Bloque[] {
  return [
    { tipo: 'TITULO', texto: tituloForm },
    {
      tipo: 'SUBTITULO',
      texto: `${clave} · ${materia} · ${fmtFecha(fecha)}${peso != null ? ` · peso ${peso}%` : ''}`,
    },
    {
      tipo: 'TEMA',
      texto: `Simulacro ~${minutos} min · escribe a mano · no mires la CLAVE hasta terminar`,
    },
    { tipo: 'SEPARADOR', texto: '' },
    {
      tipo: 'PARRAFO',
      texto:
        'Nombre: _______________________________  Fecha: ____________  Tiempo real: ______ min',
    },
    { tipo: 'SEPARADOR', texto: '' },
  ];
}

/* ───────────────────── ALEMÁN Kap. 1–2 ───────────────────── */

function formAlemanKap12(): { practica: Bloque[]; clave: Bloque[] } {
  const practica: Bloque[] = [
    { tipo: 'ENCABEZADO', texto: 'A. Conjugación (escribe las 6 personas + español de la 1ª)' },
    {
      tipo: 'PARRAFO',
      texto: '1) sein (= ser/estar) — ich ____ / du ____ / er·sie ____ / wir ____ / ihr ____ / sie·Sie ____',
    },
    { tipo: 'PARRAFO', texto: '   ES (ich): ________________________________' },
    {
      tipo: 'PARRAFO',
      texto: '2) haben (= tener) — ich ____ / du ____ / er·sie ____ / wir ____ / ihr ____ / sie·Sie ____',
    },
    { tipo: 'PARRAFO', texto: '   ES (ich): ________________________________' },
    {
      tipo: 'PARRAFO',
      texto: '3) wohnen (= vivir) — ich ____ / du ____ / er·sie ____ / wir ____ / ihr ____ / sie·Sie ____',
    },
    {
      tipo: 'PARRAFO',
      texto: '4) sprechen (= hablar; du/er cambian) — ich ____ / du ____ / er·sie ____ / wir ____ / ihr ____ / sie·Sie ____',
    },
    {
      tipo: 'PARRAFO',
      texto: '5) fahren (= ir/conducir; du/er cambian) — ich ____ / du ____ / er·sie ____ / wir ____ / ihr ____ / sie·Sie ____',
    },

    { tipo: 'ENCABEZADO', texto: 'B. Artículos + vocabulario (der/die/das + español)' },
    {
      tipo: 'PARRAFO',
      texto:
        '___ Vater (____) · ___ Mutter (____) · ___ Kind (____) · ___ Schwester (____) · ___ Bruder (____)',
    },
    {
      tipo: 'PARRAFO',
      texto:
        '___ Student (____) · ___ Universität (____) · ___ Freund (____) · ___ Familie (____) · ___ Haus (____)',
    },

    { tipo: 'ENCABEZADO', texto: 'C. Español → alemán (oración completa)' },
    { tipo: 'PARRAFO', texto: '1. Me llamo Ada. →' },
    ...lineas(1),
    { tipo: 'PARRAFO', texto: '2. ¿De dónde vienes? →' },
    ...lineas(1),
    { tipo: 'PARRAFO', texto: '3. Soy estudiante. →' },
    ...lineas(1),
    { tipo: 'PARRAFO', texto: '4. Vivo en Puebla. →' },
    ...lineas(1),
    { tipo: 'PARRAFO', texto: '5. Hablo español. →' },
    ...lineas(1),
    { tipo: 'PARRAFO', texto: '6. ¿Tienes hermanos? →' },
    ...lineas(1),
    { tipo: 'PARRAFO', texto: '7. Mi madre es médica. →' },
    ...lineas(1),
    { tipo: 'PARRAFO', texto: '8. Él estudia informática. →' },
    ...lineas(1),

    { tipo: 'ENCABEZADO', texto: 'D. Alemán → español' },
    { tipo: 'PARRAFO', texto: '1. Wie heißt du? → _______________________________' },
    { tipo: 'PARRAFO', texto: '2. Woher kommst du? → ____________________________' },
    { tipo: 'PARRAFO', texto: '3. Ich komme aus Mexiko. → _______________________' },
    { tipo: 'PARRAFO', texto: '4. Was studierst du? → ____________________________' },
    { tipo: 'PARRAFO', texto: '5. Hast du Geschwister? → _________________________' },
    { tipo: 'PARRAFO', texto: '6. Das ist meine Familie. → _______________________' },
    { tipo: 'PARRAFO', texto: '7. Ich bin Ingenieur. → ___________________________' },
    { tipo: 'PARRAFO', texto: '8. Wir wohnen in Puebla. → ________________________' },

    { tipo: 'ENCABEZADO', texto: 'E. W-Fragen — completa la palabra interrogativa' },
    {
      tipo: 'PARRAFO',
      texto:
        '___ heißt du? (cómo/quién nombre) · ___ wohnst du? (dónde) · ___ kommst du? (de dónde) · ___ studierst du? (qué)',
    },
    {
      tipo: 'PARRAFO',
      texto: '___ ist das? (quién) · ___ ist das? (qué) · ___ alt bist du? (cuántos años / qué tan)',
    },

    { tipo: 'ENCABEZADO', texto: 'F. Possessivos (mein/meine)' },
    {
      tipo: 'PARRAFO',
      texto:
        '___ Vater · ___ Mutter · ___ Bruder · ___ Schwester · ___ Familie · ___ Freund · ___ Universität',
    },
    { tipo: 'PARRAFO', texto: 'Escribe 4 oraciones con mein/meine (DE) y traduce debajo:' },
    ...lineas(8),

    { tipo: 'ENCABEZADO', texto: 'G. Corrige el error + traduce' },
    { tipo: 'PARRAFO', texto: '1. Heute ich gehe zur Uni.' },
    ...lineas(2),
    { tipo: 'PARRAFO', texto: '2. Ich bin ein Student.' },
    ...lineas(2),
    { tipo: 'PARRAFO', texto: '3. Kommst du nicht? — Ja!  (quieres decir que SÍ vienes)' },
    ...lineas(2),

    { tipo: 'ENCABEZADO', texto: 'H. Números — escribe en alemán' },
    {
      tipo: 'PARRAFO',
      texto: '1 ____ · 2 ____ · 3 ____ · 4 ____ · 5 ____ · 6 ____ · 7 ____ · 8 ____ · 9 ____ · 10 ____',
    },
    {
      tipo: 'PARRAFO',
      texto: '11 ____ · 12 ____ · 13 ____ · 15 ____ · 20 ____ · 30 ____ · 100 ____',
    },

    { tipo: 'ENCABEZADO', texto: 'I. Mini-diálogo (escribe A y B en alemán; ES debajo)' },
    {
      tipo: 'PARRAFO',
      texto: 'Presentarse: nombre, origen, estudios, 1 dato de familia. 6–8 líneas.',
    },
    ...lineas(10),

    { tipo: 'ENCABEZADO', texto: 'Autoevaluación (marca)' },
    {
      tipo: 'VINETA',
      texto: 'sein/haben sin dudar ☐ · W-Fragen ☐ · familia+possessivos ☐ · 0 errores de mayúscula ☐',
    },
  ];

  const clave: Bloque[] = [
    { tipo: 'ENCABEZADO', texto: 'CLAVE — Alemán Examen 1 (Kap. 1–2)' },
    {
      tipo: 'PARRAFO',
      texto:
        'A) sein: bin, bist, ist, sind, seid, sind · haben: habe, hast, hat, haben, habt, haben · ' +
        'wohnen: wohne, wohnst, wohnt, wohnen, wohnt, wohnen · ' +
        'sprechen: spreche, sprichst, spricht, sprechen, sprecht, sprechen · ' +
        'fahren: fahre, fährst, fährt, fahren, fahrt, fahren.',
    },
    {
      tipo: 'PARRAFO',
      texto:
        'B) der Vater (padre) · die Mutter (madre) · das Kind (niño/a) · die Schwester (hermana) · ' +
        'der Bruder (hermano) · der Student (estudiante m.) · die Universität (universidad) · ' +
        'der Freund (amigo) · die Familie (familia) · das Haus (casa).',
    },
    {
      tipo: 'PARRAFO',
      texto:
        'C) Ich heiße Ada. · Woher kommst du? · Ich bin Student(in). · Ich wohne in Puebla. · ' +
        'Ich spreche Spanisch. · Hast du Geschwister? · Meine Mutter ist Ärztin. · Er studiert Informatik.',
    },
    {
      tipo: 'PARRAFO',
      texto:
        'D) ¿Cómo te llamas? · ¿De dónde vienes? · Vengo de México. · ¿Qué estudias? · ' +
        '¿Tienes hermanos? · Esta es mi familia. · Soy ingeniero. · Vivimos en Puebla.',
    },
    {
      tipo: 'PARRAFO',
      texto: 'E) Wie · Wo · Woher · Was · Wer · Was · Wie',
    },
    {
      tipo: 'PARRAFO',
      texto:
        'F) mein Vater · meine Mutter · mein Bruder · meine Schwester · meine Familie · ' +
        'mein Freund · meine Universität (mein + masc/neutro; meine + fem/plural).',
    },
    {
      tipo: 'PARRAFO',
      texto:
        'G) Heute gehe ich zur Uni. (= Hoy voy a la uni.) · Ich bin Student. (= Soy estudiante.) · ' +
        'Doch! (= ¡Sí que sí / Sí vengo!).',
    },
    {
      tipo: 'PARRAFO',
      texto:
        'H) eins, zwei, drei, vier, fünf, sechs, sieben, acht, neun, zehn · ' +
        'elf, zwölf, dreizehn, fünfzehn, zwanzig, dreißig, hundert.',
    },
  ];

  return { practica, clave };
}

/* ───────────────────── EDO Examen 1 ───────────────────── */

function formEdo1(): { practica: Bloque[]; clave: Bloque[] } {
  const practica: Bloque[] = [
    { tipo: 'ENCABEZADO', texto: 'A. Clasifica SOLO el método (no resuelvas) — 1 línea c/u' },
    { tipo: 'PARRAFO', texto: "1. y' = 3x² y  → método: ____________________" },
    { tipo: 'PARRAFO', texto: "2. y' + 2y = e^(−x)  → ____________________" },
    { tipo: 'PARRAFO', texto: '3. (2xy + 1) dx + (x² − 2y) dy = 0  → ____________________' },
    { tipo: 'PARRAFO', texto: "4. y' = (x + y)/x  → ____________________" },
    { tipo: 'PARRAFO', texto: "5. y' + y = y²  → ____________________" },
    { tipo: 'PARRAFO', texto: "6. y' = (2x + 3y − 1)²  → ____________________" },
    { tipo: 'PARRAFO', texto: "7. x y' + 2y = x³  → ____________________" },
    { tipo: 'PARRAFO', texto: "8. y' = y/x + x  → ____________________" },

    { tipo: 'ENCABEZADO', texto: 'B. Separable — resuelve completo + verifica' },
    { tipo: 'PARRAFO', texto: "y' = 2xy ,  y(0)=3.  Muestra: separación → integral → C → PVI → check." },
    ...lineas(8),

    { tipo: 'ENCABEZADO', texto: 'C. Lineal 1er orden — factor integrante' },
    { tipo: 'PARRAFO', texto: "y' + y = e^x ,  y(0)=0.  Escribe: forma · P · μ · d/dx[μy] · y · C · check." },
    ...lineas(10),

    { tipo: 'ENCABEZADO', texto: 'D. Lineal (normalizar primero)' },
    { tipo: 'PARRAFO', texto: "x y' − 2y = x³  (x>0).  Lleva a y'+P y=f, luego μ." },
    ...lineas(8),

    { tipo: 'ENCABEZADO', texto: 'E. Exacta' },
    {
      tipo: 'PARRAFO',
      texto: '(2x + y) dx + (x − 2y) dy = 0.  Verifica ∂M/∂y=∂N/∂x; halla F(x,y)=C.',
    },
    ...lineas(8),

    { tipo: 'ENCABEZADO', texto: 'F. Homogénea / sustitución' },
    { tipo: 'PARRAFO', texto: "y' = (x+y)/x.  Usa y=ux.  Deja solución general." },
    ...lineas(8),

    { tipo: 'ENCABEZADO', texto: 'G. Checklist final (marca al terminar cada problema)' },
    {
      tipo: 'VINETA',
      texto: 'Clasifiqué antes de integrar ☐ · +C solo al final ☐ · PVI aplicado ☐ · verifiqué derivando ☐',
    },
  ];

  const clave: Bloque[] = [
    { tipo: 'ENCABEZADO', texto: 'CLAVE — EDO Examen 1' },
    {
      tipo: 'PARRAFO',
      texto:
        'A) 1 separable · 2 lineal · 3 exacta (verificar) · 4 homogénea · 5 Bernoulli n=2 · ' +
        '6 sustitución u=2x+3y−1 · 7 lineal (dividir por x) · 8 homogénea o lineal tras reordenar.',
    },
    {
      tipo: 'PARRAFO',
      texto: 'B) dy/y = 2x dx → ln|y|=x²+C₁ → y=C e^(x²); y(0)=3 → C=3 → y=3 e^(x²).',
    },
    {
      tipo: 'PARRAFO',
      texto:
        'C) P=1, μ=e^x, d/dx[y e^x]=e^(2x), y e^x=(1/2)e^(2x)+C, y=(1/2)e^x + C e^(−x); ' +
        'y(0)=0 → C=−1/2 → y=(e^x − e^(−x))/2.',
    },
    {
      tipo: 'PARRAFO',
      texto:
        'D) y\' − (2/x)y = x².  P=−2/x, μ=1/x².  d/dx[y/x²]=1 → y/x² = x+C → y = x³ + C x².',
    },
    {
      tipo: 'PARRAFO',
      texto:
        'E) M=2x+y, N=x−2y; ∂M/∂y=1=∂N/∂x.  F=x²+xy − y² = C (integrar M en x; ajustar g(y)).',
    },
    {
      tipo: 'PARRAFO',
      texto:
        'F) y=ux → u+x u\' = 1+u → x u\'=1 → u=ln|x|+C → y=x ln|x| + C x.',
    },
  ];

  return { practica, clave };
}

/* ───────────────────── Arquitecturas 1er parcial ───────────────────── */

function formArq1(): { practica: Bloque[]; clave: Bloque[] } {
  const practica: Bloque[] = [
    { tipo: 'ENCABEZADO', texto: 'A. Definiciones en 1–2 líneas (tus palabras)' },
    { tipo: 'PARRAFO', texto: '1. Arquitectura de computadoras:' },
    ...lineas(2),
    { tipo: 'PARRAFO', texto: '2. ISA (Instruction Set Architecture):' },
    ...lineas(2),
    { tipo: 'PARRAFO', texto: '3. Microarquitectura:' },
    ...lineas(2),

    { tipo: 'ENCABEZADO', texto: 'B. RISC vs CISC — completa la tabla (3 diferencias medibles)' },
    {
      tipo: 'PARRAFO',
      texto: 'Aspecto | RISC | CISC',
    },
    { tipo: 'PARRAFO', texto: 'Instrucciones: ________________ | ________________' },
    { tipo: 'PARRAFO', texto: 'Ciclos/instr.: ________________ | ________________' },
    { tipo: 'PARRAFO', texto: 'Memoria: ________________ | ________________' },
    { tipo: 'PARRAFO', texto: 'Ejemplo CPU: ________________ | ________________' },

    { tipo: 'ENCABEZADO', texto: 'C. Taxonomía de Flynn — define + 1 ejemplo' },
    { tipo: 'PARRAFO', texto: 'SISD:' },
    ...lineas(2),
    { tipo: 'PARRAFO', texto: 'SIMD:' },
    ...lineas(2),
    { tipo: 'PARRAFO', texto: 'MISD:' },
    ...lineas(2),
    { tipo: 'PARRAFO', texto: 'MIMD:' },
    ...lineas(2),

    { tipo: 'ENCABEZADO', texto: 'D. Clasifica (Flynn)' },
    {
      tipo: 'PARRAFO',
      texto: 'CPU un núcleo clásico: ____ · GPU con miles de cores: ____ · cluster de servidores: ____',
    },

    { tipo: 'ENCABEZADO', texto: 'E. Pipeline — responde breve' },
    { tipo: 'PARRAFO', texto: '1. ¿Qué problema resuelve el pipeline?' },
    ...lineas(2),
    { tipo: 'PARRAFO', texto: '2. Nombra las 5 etapas clásicas (IF…WB):' },
    ...lineas(1),
    { tipo: 'PARRAFO', texto: '3. Tres tipos de hazard:' },
    ...lineas(2),
    { tipo: 'PARRAFO', texto: '4. ¿Por qué RISC facilita el pipeline?' },
    ...lineas(3),

    { tipo: 'ENCABEZADO', texto: 'F. Evolución — 5 hitos en orden cronológico (nombre + idea)' },
    ...lineas(6),
  ];

  const clave: Bloque[] = [
    { tipo: 'ENCABEZADO', texto: 'CLAVE — Arquitecturas 1er parcial (guía, no única)' },
    {
      tipo: 'PARRAFO',
      texto:
        'A) Arquitectura = interfaz lógica + organización que ve el programador/sistema. ' +
        'ISA = conjunto de instrucciones, registros, modos. Microarquitectura = implementación interna (pipeline, caches…).',
    },
    {
      tipo: 'PARRAFO',
      texto:
        'B) RISC: muchas instr. simples, ~1 ciclo, load/store, ARM/RISC-V/MIPS. ' +
        'CISC: instr. complejas, varios ciclos, acceso a mem. en más ops, x86 clásico.',
    },
    {
      tipo: 'PARRAFO',
      texto:
        'C/D) SISD=1 flujo instr./datos (PC clásico). SIMD=1 instr. muchos datos (GPU/vector). ' +
        'MISD=raro. MIMD=muchos instr. y datos (multicore/cluster). GPU→SIMD/MIMD híbrido; cluster→MIMD.',
    },
    {
      tipo: 'PARRAFO',
      texto:
        'E) Throughput. IF ID EX MEM WB. Hazards: datos, control, estructurales. ' +
        'RISC: instr. regulares, load/store → etapas más uniformes.',
    },
  ];

  return { practica, clave };
}

/* ───────────────────── Escritura 1er parcial ───────────────────── */

function formEsc1(): { practica: Bloque[]; clave: Bloque[] } {
  const practica: Bloque[] = [
    { tipo: 'ENCABEZADO', texto: 'A. Distingue en 1 línea cada una' },
    { tipo: 'PARRAFO', texto: 'Resumen:' },
    ...lineas(1),
    { tipo: 'PARRAFO', texto: 'Paráfrasis:' },
    ...lineas(1),
    { tipo: 'PARRAFO', texto: 'Cita textual:' },
    ...lineas(1),

    { tipo: 'ENCABEZADO', texto: 'B. ¿Plagio? Sí/No + por qué (1 línea)' },
    {
      tipo: 'PARRAFO',
      texto: '1. Copias un párrafo, cambias 4 sinónimos, no citas. →',
    },
    ...lineas(1),
    {
      tipo: 'PARRAFO',
      texto: '2. Paráfrasis con tus palabras + (Autor, año). →',
    },
    ...lineas(1),
    {
      tipo: 'PARRAFO',
      texto: '3. Cita entre comillas sin referencia. →',
    },
    ...lineas(1),

    { tipo: 'ENCABEZADO', texto: 'C. Tu investigación (llena de verdad)' },
    { tipo: 'PARRAFO', texto: 'Tema (1 oración):' },
    ...lineas(2),
    { tipo: 'PARRAFO', texto: 'Pregunta de investigación:' },
    ...lineas(2),
    { tipo: 'PARRAFO', texto: 'Tesis / postura (1 oración):' },
    ...lineas(2),

    { tipo: 'ENCABEZADO', texto: 'D. Mapa de 3 fuentes' },
    {
      tipo: 'PARRAFO',
      texto: 'Fuente 1 (autor/título) · aporta: ________________________________',
    },
    {
      tipo: 'PARRAFO',
      texto: 'Fuente 2 · aporta: ______________________________________________',
    },
    {
      tipo: 'PARRAFO',
      texto: 'Fuente 3 · aporta: ______________________________________________',
    },

    { tipo: 'ENCABEZADO', texto: 'E. Párrafo académico (afirmación → evidencia → comentario)' },
    {
      tipo: 'PARRAFO',
      texto: 'Escribe UN párrafo (~120–150 palabras) sobre tu tema. Marca mentalmente las 3 partes.',
    },
    ...lineas(12),

    { tipo: 'ENCABEZADO', texto: 'F. Unidades 0–2 — responde corto' },
    { tipo: 'PARRAFO', texto: '1. ¿Qué es lectura crítica? (2 líneas)' },
    ...lineas(2),
    { tipo: 'PARRAFO', texto: '2. Diferencia entre opinión y argumento con evidencia:' },
    ...lineas(2),
    { tipo: 'PARRAFO', texto: '3. Tres acciones antes de escribir el protocolo:' },
    ...lineas(3),
  ];

  const clave: Bloque[] = [
    { tipo: 'ENCABEZADO', texto: 'CLAVE — Escritura 1er parcial (criterios)' },
    {
      tipo: 'PARRAFO',
      texto:
        'A) Resumen=ideas principales, más corto. Paráfrasis=misma idea, otras palabras, extensión similar + cita. ' +
        'Cita=texto exacto entre comillas + referencia.',
    },
    {
      tipo: 'PARRAFO',
      texto: 'B) 1 Sí (parafraseo cosmético sin cita). 2 No (si la paráfrasis es real). 3 Sí (falta referencia).',
    },
    {
      tipo: 'PARRAFO',
      texto:
        'C–E) Se evalúa claridad de pregunta/tesis, uso de fuentes y estructura afirmación→evidencia→comentario. ' +
        'No hay “respuesta única”: debe ser coherente y citable.',
    },
    {
      tipo: 'PARRAFO',
      texto:
        'F) Lectura crítica=evaluar argumentos/sesgos, no solo resumir. Opinión≠argumento. ' +
        'Antes del protocolo: delimitar tema, mapear fuentes, formular pregunta.',
    },
  ];

  return { practica, clave };
}

/* ───────────────────── selector + escritura ───────────────────── */

function elegirFormulario(
  codigo: string,
  titulo: string,
): { practica: Bloque[]; clave: Bloque[]; etiqueta: string; minutos: number } | null {
  const t = titulo.toLowerCase();
  if (codigo === 'ale' && t.includes('examen 1')) {
    const f = formAlemanKap12();
    return { ...f, etiqueta: 'FORMULARIO DE PRÁCTICA — Alemán Examen 1 (Kap. 1–2)', minutos: 40 };
  }
  if (codigo === 'ecu' && t.includes('examen 1')) {
    const f = formEdo1();
    return { ...f, etiqueta: 'FORMULARIO DE PRÁCTICA — EDO Examen 1', minutos: 60 };
  }
  if (codigo === 'arq' && t.includes('primer')) {
    const f = formArq1();
    return { ...f, etiqueta: 'FORMULARIO DE PRÁCTICA — Arquitecturas 1er parcial', minutos: 45 };
  }
  if (codigo === 'esc' && t.includes('primer')) {
    const f = formEsc1();
    return { ...f, etiqueta: 'FORMULARIO DE PRÁCTICA — Escritura 1er parcial', minutos: 45 };
  }
  return null;
}

export async function construirFormularios(
  prisma: PrismaClient,
  docx: DocxService,
  evalId: string,
): Promise<
  | {
      generados: {
        ruta: string;
        bloques: number;
        kb: number;
        titulo: string;
        materia: string;
        tipoArchivo: 'practica' | 'clave';
      }[];
    }
  | null
> {
  const ev = await prisma.evaluacion.findUnique({
    where: { id: evalId },
    include: {
      materia: { include: { semestre: true } },
    },
  });
  if (!ev) return null;
  if (ev.tipo !== 'PARCIAL' && ev.tipo !== 'FINAL') return null;

  const form = elegirFormulario(ev.materia.codigo, ev.titulo);
  if (!form) return null;

  const carpeta = path.join(
    ev.materia.semestre.raizDocumentos,
    ev.materia.carpeta,
    'Docs',
    'Guias-estudio',
  );
  await fs.mkdir(carpeta, { recursive: true });

  const base = `PRACTICA-${slug(ev.titulo)}`;
  const generados: {
    ruta: string;
    bloques: number;
    kb: number;
    titulo: string;
    materia: string;
    tipoArchivo: 'practica' | 'clave';
  }[] = [];

  const practBlocks: Bloque[] = [
    ...cabecera(
      form.etiqueta,
      ev.materia.nombre,
      ev.materia.clave,
      ev.fecha,
      ev.peso,
      form.minutos,
    ),
    ...form.practica,
  ];
  const rutaP = path.join(carpeta, `${base}.docx`);
  await docx.escribir(rutaP, practBlocks, { respaldar: true });
  const stP = await fs.stat(rutaP);
  generados.push({
    ruta: rutaP,
    bloques: practBlocks.length,
    kb: Math.round(stP.size / 1024),
    titulo: `${ev.titulo} (práctica)`,
    materia: ev.materia.clave,
    tipoArchivo: 'practica',
  });

  const claveBlocks: Bloque[] = [
    { tipo: 'TITULO', texto: `${form.etiqueta.replace('FORMULARIO DE PRÁCTICA', 'CLAVE')}` },
    {
      tipo: 'SUBTITULO',
      texto: `${ev.materia.clave} · ${ev.materia.nombre} · ${fmtFecha(ev.fecha)}`,
    },
    {
      tipo: 'TEMA',
      texto: 'Ábrela SOLO después de resolver el formulario de práctica',
    },
    { tipo: 'SEPARADOR', texto: '' },
    ...form.clave,
  ];
  const rutaC = path.join(carpeta, `${base}-CLAVE.docx`);
  await docx.escribir(rutaC, claveBlocks, { respaldar: true });
  const stC = await fs.stat(rutaC);
  generados.push({
    ruta: rutaC,
    bloques: claveBlocks.length,
    kb: Math.round(stC.size / 1024),
    titulo: `${ev.titulo} (clave)`,
    materia: ev.materia.clave,
    tipoArchivo: 'clave',
  });

  return { generados };
}
