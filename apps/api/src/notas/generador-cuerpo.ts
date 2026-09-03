/**
 * Genera el cuerpo de notas (sin cabecera) a partir de la guía del maestro.
 * El contenido sigue el temario publicado en la guía y lo expande en formato de apuntes.
 * Para Alemán (CS109) y EDO (HU325) añade atajos de estudio explícitos.
 */

export interface BloqueSimple {
  tipo: string;
  texto: string;
}

export interface ContextoSesion {
  tema: string;
  materiaNombre: string;
  materiaClave: string;
  fecha?: string;
}

const ANDAMIAJE_GUIA = ['TITULO', 'SUBTITULO', 'ESPACIO', 'SEPARADOR'];

/** Palabras de contenido aproximadas (mismo criterio que el front). */
export function contarPalabrasCuerpo(bloques: BloqueSimple[]): number {
  const pista = /^\(ideas que se me ocurren/i;
  return bloques
    .filter(
      (b) =>
        !['TITULO', 'SUBTITULO', 'TEMA', 'SEPARADOR', 'ESPACIO', 'TAREA_PROPIA_TITULO'].includes(
          b.tipo,
        ) &&
        b.texto &&
        !pista.test(b.texto),
    )
    .reduce((n, b) => n + b.texto.trim().split(/\s+/).length, 0);
}

export function generarCuerpoDesdeGuia(
  guiaBloques: BloqueSimple[],
  ctx: ContextoSesion,
): BloqueSimple[] {
  const guia = guiaBloques.filter((b) => !ANDAMIAJE_GUIA.includes(b.tipo) || b.tipo === 'TEMA');
  const temaGuia =
    guia.find((b) => b.tipo === 'TEMA' && b.texto.trim())?.texto.trim() || ctx.tema;
  const vineta = guia.filter((b) => b.tipo === 'VINETA' && b.texto.trim());
  const numeradas = guia.filter((b) => b.tipo === 'NUMERADA' && b.texto.trim());
  const encabezados = guia.filter((b) => b.tipo === 'ENCABEZADO' && b.texto.trim());
  const parrafos = guia.filter(
    (b) => b.tipo === 'PARRAFO' && b.texto.trim().length > 12,
  );
  const puntos = [...vineta, ...numeradas];

  const cuerpo: BloqueSimple[] = [];

  cuerpo.push({ tipo: 'ENCABEZADO', texto: 'Resumen de la sesión' });
  cuerpo.push({
    tipo: 'PARRAFO',
    texto: resumenSesion(temaGuia, ctx, puntos, parrafos),
  });

  cuerpo.push({ tipo: 'ENCABEZADO', texto: 'Temario según la guía' });
  cuerpo.push({ tipo: 'PARRAFO', texto: temaGuia });
  for (const p of parrafos.slice(0, 10)) {
    cuerpo.push({ tipo: 'PARRAFO', texto: p.texto });
  }

  if (puntos.length) {
    cuerpo.push({ tipo: 'ENCABEZADO', texto: 'Puntos que el programa marca' });
    for (const p of puntos.slice(0, 18)) {
      cuerpo.push({ tipo: 'VINETA', texto: p.texto });
    }
  }

  cuerpo.push({ tipo: 'ENCABEZADO', texto: 'Explicación — para estudiar después' });
  if (encabezados.length) {
    for (const enc of encabezados.slice(0, 8)) {
      cuerpo.push({ tipo: 'ENCABEZADO', texto: enc.texto });
      cuerpo.push({
        tipo: 'PARRAFO',
        texto: explicarSeccion(enc.texto, temaGuia, ctx),
      });
      // Tras cada encabezado de la guía, pega el contenido concreto que venía debajo.
      const idx = guia.findIndex((b) => b === enc);
      if (idx >= 0) {
        for (let i = idx + 1; i < guia.length && i < idx + 8; i++) {
          const b = guia[i];
          if (b.tipo === 'ENCABEZADO') break;
          if (['VINETA', 'NUMERADA', 'PARRAFO'].includes(b.tipo) && b.texto.trim()) {
            cuerpo.push({ tipo: b.tipo, texto: b.texto });
          }
        }
      }
    }
  }

  for (const pt of puntos.slice(0, 12)) {
    cuerpo.push({ tipo: 'PARRAFO', texto: explicarPunto(pt.texto, temaGuia, ctx) });
  }

  if (parrafos.length > 10) {
    cuerpo.push({ tipo: 'ENCABEZADO', texto: 'Detalles adicionales de la guía' });
    for (const p of parrafos.slice(10, 20)) {
      cuerpo.push({ tipo: 'PARRAFO', texto: p.texto });
    }
  }

  if (ctx.materiaClave === 'CS109') {
    cuerpo.push(...atajosAleman(temaGuia));
  } else if (ctx.materiaClave === 'HU325') {
    cuerpo.push(...atajosEdo(temaGuia));
  }

  cuerpo.push({ tipo: 'SEPARADOR', texto: '' });
  cuerpo.push({ tipo: 'ENCABEZADO', texto: 'Preguntas para repasar' });
  for (const p of puntos.slice(0, 8)) {
    cuerpo.push({
      tipo: 'VINETA',
      texto: preguntaRepaso(p.texto, ctx),
    });
  }
  cuerpo.push({
    tipo: 'VINETA',
    texto: `¿Cómo se conecta «${temaGuia}» con evaluaciones o tareas de ${ctx.materiaNombre}?`,
  });

  return cuerpo;
}

function resumenSesion(
  tema: string,
  ctx: ContextoSesion,
  puntos: BloqueSimple[],
  parrafos: BloqueSimple[],
): string {
  const lista =
    puntos
      .slice(0, 4)
      .map((p) => p.texto)
      .join('; ') || parrafos[0]?.texto?.slice(0, 120) || tema;
  return (
    `En ${ctx.materiaClave} (${ctx.materiaNombre}), esta sesión gira en torno a «${tema}». ` +
    `Según la guía del maestro, lo central es: ${lista}. ` +
    `Estos apuntes recopilan el temario publicado y lo desarrollan con explicaciones ` +
    `para que puedas repasar sin abrir la guía: definiciones, relaciones entre ideas y ` +
    `lo que conviene memorizar antes de evaluaciones.`
  );
}

function explicarSeccion(encabezado: string, tema: string, ctx: ContextoSesion): string {
  if (ctx.materiaClave === 'CS109') {
    return (
      `Sección «${encabezado}» de «${tema}». En alemán conviene siempre: (1) memorizar ` +
      `la forma exacta (conjugación / vocabulario), (2) decirla en voz alta, (3) escribir ` +
      `una oración propia. No traduzcas palabra por palabra: fíjate en la posición del verbo.`
    );
  }
  if (ctx.materiaClave === 'HU325') {
    return (
      `Sección «${encabezado}» de «${tema}». En EDO el examen no pide memorice de teoría larga: ` +
      `pide reconocer el tipo de ecuación y aplicar el método correcto. Lee la forma, ` +
      `elige el método, escribe los pasos y verifica sustituyendo la solución.`
    );
  }
  return (
    `Bajo «${encabezado}» en la sesión «${tema}» de ${ctx.materiaNombre}, el programa pide entender ` +
    `no solo el nombre del tema sino cómo se usa en problemas. Repasa la definición formal, ` +
    `un ejemplo resuelto paso a paso y el error típico que aparece en clase o en el laboratorio. ` +
    `Si puedes explicar esta sección en voz alta sin leer, ya tienes la base para el examen.`
  );
}

function explicarPunto(punto: string, tema: string, ctx: ContextoSesion): string {
  const corto = punto.length > 80 ? `${punto.slice(0, 77)}…` : punto;
  if (ctx.materiaClave === 'CS109') {
    return (
      `• ${corto}: practícalo en 3 oraciones (ich / du / er). Si es verbo, conjugalo completo; ` +
      `si es vocabulario, di el artículo (der/die/das) y el plural si lo sabes. Tema: «${tema}».`
    );
  }
  if (ctx.materiaClave === 'HU325') {
    return (
      `• ${corto}: anota (a) cuándo se usa, (b) la fórmula o pasos, (c) un error típico. ` +
      `En el examen de «${tema}» lo que gana puntos es el procedimiento limpio, no solo la respuesta.`
    );
  }
  return (
    `• ${corto}: en el contexto de «${tema}» (${ctx.materiaClave}), conviene fijar qué es, qué propiedades ` +
    `tiene y cuándo se aplica. Relaciona este punto con lo anterior del semestre y anota un ` +
    `ejemplo propio; eso es lo que suele pedirse en preguntas abiertas o en el seguimiento de tareas.`
  );
}

function preguntaRepaso(punto: string, ctx: ContextoSesion): string {
  if (ctx.materiaClave === 'CS109') {
    return `Di en alemán (sin mirar): «${punto.slice(0, 60)}» — ¿conjugación / artículo / posición del verbo?`;
  }
  if (ctx.materiaClave === 'HU325') {
    return `Dado un problema de «${punto.slice(0, 50)}…», ¿qué método usas y cuál es el primer paso?`;
  }
  return `¿Qué es «${punto}» y por qué importa en ${ctx.materiaClave}?`;
}

/** Atajos permanentes para Alemán I — se pegan en cada sesión. */
function atajosAleman(tema: string): BloqueSimple[] {
  const out: BloqueSimple[] = [
    { tipo: 'SEPARADOR', texto: '' },
    { tipo: 'ENCABEZADO', texto: 'ATAJO RÁPIDO — conjugación Präsens (siempre)' },
    {
      tipo: 'PARRAFO',
      texto:
        'Verbo regular (machen): ich mache · du machst · er/sie/es macht · wir machen · ihr macht · sie/Sie machen. ' +
        'Terminaciones: -e, -st, -t, -en, -t, -en. Memoriza esto como tabla fija.',
    },
    {
      tipo: 'PARRAFO',
      texto:
        'sein (ser/estar): ich bin · du bist · er/sie/es ist · wir sind · ihr seid · sie/Sie sind.',
    },
    {
      tipo: 'PARRAFO',
      texto:
        'haben (tener): ich habe · du hast · er/sie/es hat · wir haben · ihr habt · sie/Sie haben.',
    },
    { tipo: 'ENCABEZADO', texto: 'Posición del verbo (regla de oro)' },
    {
      tipo: 'VINETA',
      texto: 'Oración normal: el verbo conjugado va en 2ª posición. «Ich komme aus Mexiko.»',
    },
    {
      tipo: 'VINETA',
      texto: 'Pregunta sí/no: verbo en 1ª posición. «Kommst du aus Mexiko?»',
    },
    {
      tipo: 'VINETA',
      texto: 'Pregunta con W (wer, was, wo, wie, woher…): W + verbo + sujeto. «Woher kommst du?»',
    },
    { tipo: 'ENCABEZADO', texto: 'Trucos que salvan puntos' },
    {
      tipo: 'VINETA',
      texto: 'TODOS los sustantivos van con mayúscula: Student, Familie, Informatik.',
    },
    {
      tipo: 'VINETA',
      texto: 'Profesión sin artículo: «Ich bin Student» (NO «Ich bin ein Student»).',
    },
    {
      tipo: 'VINETA',
      texto: 'Pregunta negativa + contradicción = doch (no ja). «Kommst du nicht? — Doch!»',
    },
    {
      tipo: 'VINETA',
      texto: 'Possessivartikel: mein/dein/sein/ihr — en masculino/neutro sin -e; femenino/plural con -e (meine).',
    },
    {
      tipo: 'VINETA',
      texto: 'Números 21+: se dicen al revés. 21 = einundzwanzig (uno-y-veinte).',
    },
    {
      tipo: 'PARRAFO',
      texto:
        `Relacionado con esta sesión («${tema}»): repasa primero la conjugación de arriba, ` +
        `luego el vocabulario de la guía en voz alta 2 veces, y al final escribe 5 oraciones nuevas.`,
    },
  ];
  return out;
}

/** Atajos permanentes para Ecuaciones Diferenciales. */
function atajosEdo(tema: string): BloqueSimple[] {
  return [
    { tipo: 'SEPARADOR', texto: '' },
    { tipo: 'ENCABEZADO', texto: 'ATAJO RÁPIDO — ¿de qué estamos hablando?' },
    {
      tipo: 'PARRAFO',
      texto:
        'Una ecuación diferencial ordinaria (EDO) relaciona una función y(x) con sus derivadas y\', y\'\', … ' +
        '«Resolver» = encontrar la función y(x) (a veces implícita F(x,y)=C). ' +
        'Orden = la derivada más alta que aparece. Lineal = y y sus derivadas aparecen a la primera potencia.',
    },
    { tipo: 'ENCABEZADO', texto: 'Árbol de decisión (úsalo en el examen, en este orden)' },
    {
      tipo: 'NUMERADA',
      texto: '¿Se separan variables? → dy/dx = g(x)h(y) → ∫ dy/h(y) = ∫ g(x) dx + C',
    },
    {
      tipo: 'NUMERADA',
      texto: '¿Forma y\' + P(x)y = f(x)? → LINEAL → factor integrante μ = e^(∫P dx)',
    },
    {
      tipo: 'NUMERADA',
      texto: '¿M dx + N dy = 0 con ∂M/∂y = ∂N/∂x? → EXACTA → reconstruir F(x,y)=C',
    },
    {
      tipo: 'NUMERADA',
      texto: '¿Homogénea f(tx,ty)=f(x,y)? → sustituir y = u·x',
    },
    {
      tipo: 'NUMERADA',
      texto: '¿Bernoulli y\' + P y = f yⁿ? → v = y^(1−n) → queda lineal',
    },
    {
      tipo: 'NUMERADA',
      texto: '¿dy/dx = f(Ax+By+C)? → u = Ax+By+C → separable',
    },
    { tipo: 'ENCABEZADO', texto: 'Fórmulas que debes escribir sin dudar' },
    {
      tipo: 'VINETA',
      texto: 'Factor integrante: μ(x)=e^(∫P(x)dx). Luego d/dx[μ y] = μ f → y = (1/μ)(∫μ f dx + C)',
    },
    {
      tipo: 'VINETA',
      texto: 'Exacta: integrar M en x → F=∫M dx + g(y); luego ∂F/∂y = N → sacar g(y)',
    },
    {
      tipo: 'VINETA',
      texto: 'Siempre verifica: deriva tu solución y sustitúyela en la EDO original',
    },
    {
      tipo: 'PARRAFO',
      texto:
        `Para esta sesión («${tema}»): identifica el tipo con el árbol, escribe el método en 3–5 pasos, ` +
        `haz un ejemplo de la guía y otro del Zill. Si no sabes por dónde empezar, es que aún no clasificaste.`,
    },
  ];
}
