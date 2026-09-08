/**
 * Lógica pura de guías MEGA (Docs/Guias-estudio).
 * Usada por la API (POST /guias-examen/generar) y por el CLI.
 */
import type { PrismaClient } from '@prisma/client';
import { DocxService, TipoBloque } from '../docx/docx.service';
import { construirFormularios } from './formularios-examen.logic';
import * as path from 'node:path';
import { promises as fs } from 'node:fs';

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

function parseArgsCli(argv: string[]) {
  const soloArg = argv.find((a) => a.startsWith('--solo='));
  const proximosArg = argv.find((a) => a.startsWith('--proximos='));
  return {
    solo: soloArg
      ? soloArg
          .split('=')[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : (null as string[] | null),
    proximos: proximosArg ? parseInt(proximosArg.split('=')[1], 10) : (null as number | null),
  };
}

/* ───────────────────── CHEATSHEETS MEGA ───────────────────── */

function megaAleman(titulo: string, dias: number): Bloque[] {
  /** Guía para quien empieza de cero: TODO en alemán va con traducción al español. */
  const b: Bloque[] = [
    { tipo: 'ENCABEZADO', texto: 'HOJA DE TRUCOS — Alemán I (cero alemán → español al lado)' },
    {
      tipo: 'PARRAFO',
      texto:
        `Para: ${titulo}. Días restantes: ${dias}. ` +
        'REGLA DE ESTA GUÍA: cada palabra o frase en alemán lleva su significado en español entre paréntesis. ' +
        'No asumas que «ya sabes» nada. Lee alemán → español en voz alta.',
    },

    { tipo: 'ENCABEZADO', texto: '0. Alfabeto mental (lo mínimo)' },
    {
      tipo: 'PARRAFO',
      texto:
        'Umlauts (puntos encima): ä ≈ «e» abierta, ö ≈ «e» redondeada, ü ≈ «i» con labios de «u». ' +
        'ß (Eszett) = ss. Los SUSTANTIVOS siempre con MAYÚSCULA: Student (estudiante), Familie (familia).',
    },
    {
      tipo: 'VINETA',
      texto:
        'Artículos: der = el (masculino) · die = la / las (femenino o plural) · das = lo/el (neutro). ' +
        'Ej.: der Vater (el padre), die Mutter (la madre), das Kind (el niño/a).',
    },

    { tipo: 'ENCABEZADO', texto: 'A. Verbos en presente (Präsens = tiempo presente)' },
    {
      tipo: 'PARRAFO',
      texto:
        'Plantilla de un verbo regular. Ejemplo machen = hacer. ' +
        'ich mache (yo hago) · du machst (tú haces) · er/sie/es macht (él/ella/eso hace) · ' +
        'wir machen (nosotros hacemos) · ihr macht (vosotros hacéis) · sie/Sie machen (ellos hacen / usted hace). ' +
        'Terminaciones: -e / -st / -t / -en / -t / -en.',
    },
    {
      tipo: 'PARRAFO',
      texto:
        'Si el verbo termina en -t/-d (o grupos difíciles), du/er llevan -est/-et: ' +
        'arbeiten = trabajar → du arbeitest (tú trabajas), er arbeitet (él trabaja). ' +
        'finden = encontrar → du findest (tú encuentras).',
    },
    {
      tipo: 'PARRAFO',
      texto:
        'sein = ser/estar (OBLIGATORIO de memoria): ' +
        'ich bin (yo soy/estoy) · du bist (tú eres/estás) · er/sie/es ist (él/ella es/está) · ' +
        'wir sind (nosotros somos/estamos) · ihr seid (vosotros sois/estáis) · sie/Sie sind (ellos son / usted es).',
    },
    {
      tipo: 'PARRAFO',
      texto:
        'haben = tener: ' +
        'ich habe (yo tengo) · du hast (tú tienes) · er/sie/es hat (él/ella tiene) · ' +
        'wir haben (nosotros tenemos) · ihr habt (vosotros tenéis) · sie/Sie haben (ellos tienen / usted tiene).',
    },
    {
      tipo: 'PARRAFO',
      texto:
        'Cambio de vocal en du/er (Kapitel 1–2): ' +
        'sprechen = hablar → du sprichst (tú hablas), er spricht (él habla); ' +
        'lesen = leer → du liest, er liest; ' +
        'fahren = ir/conducir → du fährst, er fährt; ' +
        'nehmen = tomar → du nimmst, er nimmt; ' +
        'geben = dar → du gibst, er gibt; ' +
        'essen = comer → du isst, er isst. ' +
        'ich/wir/ihr/sie NO cambian la vocal.',
    },

    { tipo: 'ENCABEZADO', texto: 'B. Dónde va el verbo (si fallas esto, la oración suena mal)' },
    {
      tipo: 'VINETA',
      texto:
        'Frase normal: el verbo conjugado va en 2ª posición. ' +
        '«Heute gehe ich zur Uni.» = Hoy voy a la uni. (NO: «Heute ich gehe…»)',
    },
    {
      tipo: 'VINETA',
      texto:
        'Pregunta sí/no: verbo primero. «Bist du Student?» = ¿Eres estudiante? ' +
        '«Kommst du aus Mexiko?» = ¿Vienes de México?',
    },
    {
      tipo: 'VINETA',
      texto:
        'Pregunta con W: palabra W + verbo + sujeto. ' +
        '«Wie heißt du?» = ¿Cómo te llamas? ' +
        '«Woher kommst du?» = ¿De dónde vienes? ' +
        '«Was machst du?» = ¿Qué haces? ' +
        '«Wo wohnst du?» = ¿Dónde vives?',
    },
    {
      tipo: 'VINETA',
      texto:
        'Negación: nicht = no (niega verbo/adjetivo/frase). «Ich bin nicht müde.» = No estoy cansado/a. ' +
        'kein/keine = ningún/ninguna (niega un sustantivo). «Ich habe keine Geschwister.» = No tengo hermanos.',
    },

    { tipo: 'ENCABEZADO', texto: 'C. Vocabulario Kapitel 1+2 — alemán (español)' },
    {
      tipo: 'PARRAFO',
      texto: 'Saludos:',
    },
    {
      tipo: 'VINETA',
      texto:
        'Hallo (hola) · Guten Morgen (buenos días) · Guten Tag (buenas / hola de día) · ' +
        'Guten Abend (buenas noches al llegar) · Auf Wiedersehen (adiós formal) · ' +
        'Tschüss (chao) · Bis bald (hasta pronto)',
    },
    {
      tipo: 'PARRAFO',
      texto: 'Presentarse (frases listas):',
    },
    {
      tipo: 'VINETA',
      texto: 'Ich heiße… = Me llamo… · Ich bin… = Soy… · Ich komme aus… = Vengo de…',
    },
    {
      tipo: 'VINETA',
      texto: 'Ich wohne in… = Vivo en… · Ich studiere… = Estudio… · Ich spreche… = Hablo…',
    },
    {
      tipo: 'PARRAFO',
      texto: 'Familia (con artículo):',
    },
    {
      tipo: 'VINETA',
      texto:
        'die Mutter (la madre) · der Vater (el padre) · die Eltern (los padres) · ' +
        'der Bruder (el hermano) · die Schwester (la hermana) · das Kind (el niño/a) · ' +
        'die Tochter (la hija) · der Sohn (el hijo) · die Großeltern (los abuelos) · ' +
        'die Geschwister (los hermanos, hermanos y hermanas)',
    },
    {
      tipo: 'PARRAFO',
      texto: 'Possessivos (mi / tu / su…):',
    },
    {
      tipo: 'VINETA',
      texto:
        'mein/meine = mi · dein/deine = tu · sein/seine = su (de él) · ihr/ihre = su (de ella) / su (de ellos) · ' +
        'unser/unsere = nuestro · euer/eure = vuestro. ' +
        'Sin -e: masculino/neutro singular (mein Vater = mi padre). Con -e: femenino y plural (meine Mutter = mi madre; meine Eltern = mis padres).',
    },
    {
      tipo: 'PARRAFO',
      texto: 'Profesiones (tras sein = ser, SIN artículo «ein»):',
    },
    {
      tipo: 'VINETA',
      texto:
        'der Student / die Studentin (el/la estudiante) · der Ingenieur / die Ingenieurin (ingeniero/a) · ' +
        'der Arzt / die Ärztin (médico/a) · der Lehrer / die Lehrerin (maestro/a) · ' +
        'der Informatiker / die Informatikerin (informático/a). ' +
        'Correcto: «Ich bin Studentin.» = Soy estudiante. Incorrecto: «Ich bin eine Studentin.»',
    },
    {
      tipo: 'PARRAFO',
      texto: 'Números (di la traducción en español mientras memorizas):',
    },
    {
      tipo: 'VINETA',
      texto:
        'null (0) eins (1) zwei (2) drei (3) vier (4) fünf (5) sechs (6) sieben (7) acht (8) neun (9) zehn (10) ' +
        'elf (11) zwölf (12) dreizehn (13) … zwanzig (20). ' +
        '21 = einundzwanzig (uno-y-veinte: se dice «al revés»).',
    },
    {
      tipo: 'PARRAFO',
      texto: 'Palabras pregunta (W-Wörter):',
    },
    {
      tipo: 'VINETA',
      texto:
        'wer (quién) · was (qué) · wo (dónde) · woher (de dónde) · wohin (a dónde) · ' +
        'wie (cómo) · wann (cuándo) · warum (por qué) · welche/r/s (cuál / qué)',
    },

    { tipo: 'ENCABEZADO', texto: 'D. Diálogos modelo (alemán = español)' },
    {
      tipo: 'VINETA',
      texto: 'A: Hallo! Wie heißt du? = ¡Hola! ¿Cómo te llamas?',
    },
    {
      tipo: 'VINETA',
      texto: 'B: Ich heiße Ada. Und du? = Me llamo Ada. ¿Y tú?',
    },
    {
      tipo: 'VINETA',
      texto: 'A: Ich komme aus Mexiko. Woher kommst du? = Vengo de México. ¿De dónde vienes?',
    },
    {
      tipo: 'VINETA',
      texto: 'B: Ich wohne in Puebla und studiere Informatik. = Vivo en Puebla y estudio informática.',
    },
    {
      tipo: 'VINETA',
      texto: 'A: Hast du Geschwister? = ¿Tienes hermanos?',
    },
    {
      tipo: 'VINETA',
      texto: 'B: Ja, ich habe eine Schwester. / Nein, ich habe keine Geschwister. = Sí, tengo una hermana. / No, no tengo hermanos.',
    },

    { tipo: 'ENCABEZADO', texto: 'E. Errores que restan puntos' },
    {
      tipo: 'VINETA',
      texto: 'Olvidar MAYÚSCULA en sustantivos: Student (estudiante), Familie (familia), Informatik (informática).',
    },
    {
      tipo: 'VINETA',
      texto: '«Ich bin ein Student» → correcto: «Ich bin Student» (= Soy estudiante).',
    },
    {
      tipo: 'VINETA',
      texto:
        'Si te preguntan con no y quieres decir que SÍ (contradecir): usa doch (sí que sí), no ja. ' +
        'Ej.: «Kommst du nicht?» (= ¿No vienes?) → «Doch!» (= ¡Sí vengo!).',
    },
    {
      tipo: 'VINETA',
      texto: 'Poner el verbo al final en oraciones simples (en alemán básico va en 2ª posición).',
    },
    {
      tipo: 'VINETA',
      texto: 'du = tú (informal) · Sie = usted (formal, con mayúscula). Mira el contexto del examen.',
    },
    {
      tipo: 'VINETA',
      texto: 'Umlauts: Ärztin (médica), spät (tarde), schön (bonito/a), fünf (cinco).',
    },

    { tipo: 'ENCABEZADO', texto: 'F. Mini-examen (hazlo YA sin mirar)' },
    {
      tipo: 'NUMERADA',
      texto: 'Conjuga wohnen (= vivir) en las 6 personas y escribe qué significa cada forma.',
    },
    {
      tipo: 'NUMERADA',
      texto: 'Conjuga sein (= ser/estar) y haben (= tener) completo con traducción.',
    },
    {
      tipo: 'NUMERADA',
      texto:
        'Traduce al alemán: «¿De dónde vienes?» / «Me llamo Ada.» / «Soy estudiante.» / «Vivo en Puebla.»',
    },
    {
      tipo: 'NUMERADA',
      texto: 'Escribe 4 oraciones sobre tu familia usando mein/meine (= mi) y tradúcelas al español.',
    },
    {
      tipo: 'NUMERADA',
      texto: 'Escribe 3 preguntas sí/no y 3 con W sobre estudios/familia; pon la traducción debajo.',
    },
    {
      tipo: 'NUMERADA',
      texto:
        'Corrige y traduce: «Heute ich gehe zur Uni.» / «Ich bin ein Ingenieur.» / ' +
        '«Kommst du nicht? — Ja!» (si quieres decir que SÍ vienes).',
    },

    { tipo: 'ENCABEZADO', texto: 'G. Respuestas del mini-examen (con español)' },
    {
      tipo: 'PARRAFO',
      texto:
        'wohnen: ich wohne (yo vivo), du wohnst (tú vives), er/sie wohnt (él/ella vive), ' +
        'wir wohnen (nosotros vivimos), ihr wohnt (vosotros vivís), sie/Sie wohnen (ellos viven / usted vive).',
    },
    {
      tipo: 'PARRAFO',
      texto:
        '¿De dónde vienes? → Woher kommst du? · Me llamo Ada. → Ich heiße Ada. · ' +
        'Soy estudiante. → Ich bin Student(in). · Vivo en Puebla. → Ich wohne in Puebla.',
    },
    {
      tipo: 'PARRAFO',
      texto:
        'Correcciones: «Heute gehe ich zur Uni.» (= Hoy voy a la uni.) · ' +
        '«Ich bin Ingenieur.» (= Soy ingeniero.) · «Doch!» (= ¡Sí que sí / Sí vengo!).',
    },

    { tipo: 'ENCABEZADO', texto: 'H. Rutina diaria hasta el examen (25–40 min)' },
    {
      tipo: 'NUMERADA',
      texto: '5 min: sein + haben + 1 regular + 1 con cambio de vocal, en voz alta, diciendo el español',
    },
    {
      tipo: 'NUMERADA',
      texto: '10 min: vocabulario — di: artículo + palabra alemana + español + 1 oración',
    },
    {
      tipo: 'NUMERADA',
      texto: '10 min: escribe 8 oraciones nuevas (familia + estudios + ciudad) y tradúcelas debajo',
    },
    {
      tipo: 'NUMERADA',
      texto: '5–10 min: usa el panel de Pronunciación en la app (oír de-DE)',
    },
    {
      tipo: 'NUMERADA',
      texto: 'Día antes: simulación 20 min + probar audífonos/laptop si el examen es en plataforma',
    },
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

export async function construirGuia(
  prisma: PrismaClient,
  docx: DocxService,
  evalId: string,
): Promise<{ ruta: string; bloques: number; kb: number; titulo: string; materia: string } | null> {
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
  return {
    ruta,
    bloques: bloques.length,
    kb: Math.round(st.size / 1024),
    titulo: ev.titulo,
    materia: materia.clave,
  };
}

export interface OpcionesGenerarGuias {
  solo?: string[] | null;
  proximos?: number | null;
}

export async function generarGuiasEstudio(
  prisma: PrismaClient,
  docx: DocxService,
  opciones: OpcionesGenerarGuias = {},
) {
  const ahora = new Date();
  const limite =
    opciones.proximos != null
      ? new Date(ahora.getTime() + opciones.proximos * 86400000)
      : null;

  const exams = await prisma.evaluacion.findMany({
    where: {
      tipo: { in: ['PARCIAL', 'FINAL', 'QUIZ'] },
      ...(opciones.solo?.length ? { materia: { codigo: { in: opciones.solo } } } : {}),
      ...(limite ? { fecha: { lte: limite } } : {}),
    },
    orderBy: { fecha: 'asc' },
    include: { materia: { select: { codigo: true, clave: true } } },
  });

  const resultados: {
    titulo: string;
    materia: string;
    ruta: string;
    kb: number;
    bloques: number;
  }[] = [];
  const errores: string[] = [];

  for (const e of exams) {
    try {
      const r = await construirGuia(prisma, docx, e.id);
      if (r) resultados.push(r);
    } catch (err: any) {
      errores.push(`${e.titulo}: ${err.message}`);
    }

    if (e.tipo === 'PARCIAL' || e.tipo === 'FINAL') {
      try {
        const forms = await construirFormularios(prisma, docx, e.id);
        if (forms) {
          for (const f of forms.generados) {
            resultados.push({
              titulo: f.titulo,
              materia: f.materia,
              ruta: f.ruta,
              kb: f.kb,
              bloques: f.bloques,
            });
          }
        }
      } catch (err: any) {
        errores.push(`formulario ${e.titulo}: ${err.message}`);
      }
    }
  }

  return {
    total: exams.length,
    generadas: resultados.length,
    resultados,
    errores,
  };
}

export { parseArgsCli };