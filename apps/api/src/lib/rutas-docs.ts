import { promises as fs } from 'node:fs';
import * as path from 'node:path';

const MARKER = '2026-Semestre-5';

/**
 * Reescribe una ruta absoluta (típicamente de Windows/OneDrive) para que apunte
 * a la raíz de documentos activa (DOCS_ROOT). Así la misma base funciona en
 * laptop y en el servidor Linux.
 */
export function remapearARaiz(ruta: string | null | undefined, raizDocs: string): string | null {
  if (!ruta) return null;
  const normalizada = ruta.replace(/\\/g, '/');
  const i = normalizada.indexOf(MARKER);
  if (i < 0) {
    // Ya parece relativa a la raíz, o es otra cosa: si es absoluta y distinta, no tocamos.
    if (path.isAbsolute(ruta)) return ruta;
    return path.join(raizDocs, ruta);
  }
  const rel = normalizada.slice(i + MARKER.length).replace(/^[/\\]+/, '');
  return path.join(raizDocs, rel);
}

/** Devuelve la primera ruta existente entre candidatas. */
export async function primeraExistente(...candidatas: Array<string | null | undefined>) {
  for (const c of candidatas) {
    if (!c) continue;
    try {
      await fs.access(c);
      return c;
    } catch {
      /* siguiente */
    }
  }
  return null;
}

/** Carpeta Libros de una materia bajo DOCS_ROOT. */
export function carpetaLibros(raizDocs: string, carpetaMateria: string) {
  return path.join(raizDocs, carpetaMateria, 'Libros');
}
