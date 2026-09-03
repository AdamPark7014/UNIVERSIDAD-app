export const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** Las fechas llegan como ISO en UTC; se leen en UTC para no recorrer el día. */
export function fecha(iso: string | Date): Date {
  return typeof iso === 'string' ? new Date(iso) : iso;
}

export function fechaCorta(iso: string | Date): string {
  const d = fecha(iso);
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
}

export function fechaLarga(iso: string | Date): string {
  const d = fecha(iso);
  return `${DIAS[(d.getUTCDay() + 6) % 7]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`;
}

export function diaDeSemana(iso: string | Date): string {
  return DIAS[(fecha(iso).getUTCDay() + 6) % 7];
}

export function esHoy(iso: string | Date): boolean {
  const d = fecha(iso);
  const h = new Date();
  return (
    d.getUTCFullYear() === h.getFullYear() &&
    d.getUTCMonth() === h.getMonth() &&
    d.getUTCDate() === h.getDate()
  );
}

export function diasDesdeHoy(iso: string | Date): number {
  const d = fecha(iso);
  const hoy = new Date();
  const a = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const b = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((a - b) / 86_400_000);
}

export function cuandoTexto(iso: string | Date): string {
  const n = diasDesdeHoy(iso);
  if (n === 0) return 'hoy';
  if (n === 1) return 'mañana';
  if (n === -1) return 'ayer';
  if (n > 1) return `en ${n} días`;
  return `hace ${Math.abs(n)} días`;
}

export const ETIQUETA_EVAL: Record<string, string> = {
  PARCIAL: 'Parcial',
  FINAL: 'Final',
  QUIZ: 'Quiz',
  ENTREGA: 'Entrega',
  PROYECTO: 'Proyecto',
  PRACTICA: 'Práctica',
  EXPOSICION: 'Exposición',
  REPORTE: 'Reporte',
};

export const ETIQUETA_ESTADO_TAREA: Record<string, string> = {
  ABIERTA: 'Abierta',
  EN_PROGRESO: 'En progreso',
  HECHA: 'Hecha',
  DESCARTADA: 'Descartada',
};
