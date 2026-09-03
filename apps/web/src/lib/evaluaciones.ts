/** Tipos que cuentan como examen (no como entrega). */
export const TIPOS_EXAMEN = ['PARCIAL', 'FINAL', 'QUIZ'] as const;

export function esExamen(tipo: string): boolean {
  return (TIPOS_EXAMEN as readonly string[]).includes(tipo);
}
