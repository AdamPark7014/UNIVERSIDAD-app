/**
 * Puente entre los bloques del documento y texto plano.
 *
 * El editor por bloques sirve para retocar, pero para escribir en clase estorba:
 * nadie elige "párrafo" en un desplegable mientras el profesor habla. Aquí los
 * bloques se aplanan a texto con cuatro convenciones y se vuelven a levantar al
 * guardar, así se escribe de corrido sin perder la estructura del .docx.
 */

export interface Bloque {
  tipo: string;
  texto: string;
}

/** Lo que no se edita a mano: identifica al documento, no es contenido. */
const CABECERA = ['TITULO', 'SUBTITULO', 'TEMA'];

export const AYUDA_SINTAXIS = [
  ['# Texto', 'encabezado en negrita'],
  ['- Texto', 'viñeta'],
  ['---', 'línea separadora'],
  ['* TAREA PROPIA', 'inicia el bloque de tareas propias'],
] as const;

/**
 * Parte el documento en la cabecera intocable y el cuerpo editable.
 * El separador que sigue a la cabecera también es decoración, no contenido.
 */
export function separarCabecera(bloques: Bloque[]): {
  cabecera: Bloque[];
  cuerpo: Bloque[];
} {
  let i = 0;
  while (i < bloques.length && CABECERA.includes(bloques[i].tipo)) i++;
  if (i > 0 && bloques[i]?.tipo === 'SEPARADOR') i++;
  return { cabecera: bloques.slice(0, i), cuerpo: bloques.slice(i) };
}

/** Bloques → texto plano editable. */
export function bloquesATexto(bloques: Bloque[]): string {
  return bloques
    .map((b) => {
      switch (b.tipo) {
        case 'ENCABEZADO':
          return `# ${b.texto}`;
        case 'TAREA_PROPIA_TITULO':
          return '* TAREA PROPIA';
        case 'VINETA':
          return `- ${b.texto}`;
        case 'SEPARADOR':
          return '---';
        case 'ESPACIO':
          return '';
        default:
          return b.texto;
      }
    })
    .join('\n')
    // La plantilla en blanco trae veinte líneas vacías; en el editor son ruido.
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Texto plano → bloques. */
export function textoABloques(texto: string): Bloque[] {
  return texto.split('\n').map((linea) => {
    const t = linea.trim();
    if (!t) return { tipo: 'ESPACIO', texto: '' };
    if (/^-{3,}$/.test(t)) return { tipo: 'SEPARADOR', texto: '' };
    if (/^\*\s*TAREA\s+PROPIA\s*$/i.test(t)) {
      return { tipo: 'TAREA_PROPIA_TITULO', texto: 'TAREA PROPIA' };
    }
    if (t.startsWith('#')) {
      return { tipo: 'ENCABEZADO', texto: t.replace(/^#+\s*/, '') };
    }
    // "- " es viñeta; "-palabra" sin espacio es un guion normal, no una lista.
    if (/^-\s+/.test(t)) return { tipo: 'VINETA', texto: t.replace(/^-\s+/, '') };
    return { tipo: 'PARRAFO', texto: t };
  });
}

/** Palabras escritas, con el mismo criterio que usa la API. */
export function contarContenido(bloques: Bloque[]): number {
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
