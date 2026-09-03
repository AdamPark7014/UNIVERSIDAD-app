/**
 * Interpreta fechas escritas como las escribe una persona.
 *
 * Sirve para que la búsqueda entienda "10 de septiembre", "10/09", "mañana" o
 * "miércoles" y devuelva las clases de ese día, en vez de obligar a navegar el
 * calendario semana por semana.
 */

const MESES: Record<string, number> = {
  enero: 0, ene: 0,
  febrero: 1, feb: 1,
  marzo: 2, mar: 2,
  abril: 3, abr: 3,
  mayo: 4, may: 4,
  junio: 5, jun: 5,
  julio: 6, jul: 6,
  agosto: 7, ago: 7,
  septiembre: 8, setiembre: 8, sep: 8, sept: 8,
  octubre: 9, oct: 9,
  noviembre: 10, nov: 10,
  diciembre: 11, dic: 11,
};

const DIAS: Record<string, number> = {
  lunes: 0,
  martes: 1,
  miercoles: 2,
  jueves: 3,
  viernes: 4,
  sabado: 5,
  domingo: 6,
};

const sinTildes = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export interface RangoFechas {
  desde: Date;
  hasta: Date;
  /** Cómo se interpretó, para decírselo al usuario. */
  etiqueta: string;
  /** 0=lunes … 6=domingo, cuando se buscó un día de la semana. */
  diaSemana?: number;
}

const soloFecha = (d: Date) =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

const unDia = (d: Date, etiqueta: string): RangoFechas => ({
  desde: d,
  hasta: d,
  etiqueta,
});

/**
 * Devuelve el rango que describe el término, o null si no habla de fechas.
 * `hoy` se inyecta para poder probarlo sin depender del reloj.
 */
export function interpretarFecha(termino: string, hoy = new Date()): RangoFechas | null {
  const q = sinTildes(termino);
  if (!q) return null;

  const base = soloFecha(hoy);
  const anio = base.getUTCFullYear();

  // --- relativas ---
  if (q === 'hoy') return unDia(base, 'hoy');
  if (q === 'manana' || q === 'mnana') {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + 1);
    return unDia(d, 'mañana');
  }
  if (q === 'ayer') {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() - 1);
    return unDia(d, 'ayer');
  }
  if (q === 'esta semana' || q === 'semana') {
    const lunes = new Date(base);
    lunes.setUTCDate(lunes.getUTCDate() - ((lunes.getUTCDay() + 6) % 7));
    const viernes = new Date(lunes);
    viernes.setUTCDate(viernes.getUTCDate() + 4);
    return { desde: lunes, hasta: viernes, etiqueta: 'esta semana' };
  }

  // --- día de la semana: "miercoles" ---
  if (q in DIAS) {
    // Todo el semestre, filtrado después por día. El rango amplio lo cubre.
    return {
      desde: new Date(Date.UTC(anio - 1, 0, 1)),
      hasta: new Date(Date.UTC(anio + 1, 11, 31)),
      etiqueta: termino.trim(),
      diaSemana: DIAS[q],
    };
  }

  // --- "10 de septiembre" / "10 sep" / "10 septiembre" ---
  let m = /^(\d{1,2})\s*(?:de\s+)?([a-z]+)(?:\s*(?:de\s+)?(\d{4}))?$/.exec(q);
  if (m) {
    const dia = Number(m[1]);
    const mes = MESES[m[2]];
    if (mes !== undefined && dia >= 1 && dia <= 31) {
      const y = m[3] ? Number(m[3]) : anio;
      return unDia(new Date(Date.UTC(y, mes, dia)), `${dia} de ${m[2]}`);
    }
  }

  // --- "septiembre" solo: el mes completo ---
  if (q in MESES) {
    const mes = MESES[q];
    return {
      desde: new Date(Date.UTC(anio, mes, 1)),
      hasta: new Date(Date.UTC(anio, mes + 1, 0)),
      etiqueta: q,
    };
  }

  // --- "10/09", "10-09-2026", "2026-09-10" ---
  m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(q);
  if (m) {
    return unDia(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])), q);
  }
  m = /^(\d{1,2})[/\-.](\d{1,2})(?:[/\-.](\d{2,4}))?$/.exec(q);
  if (m) {
    const dia = Number(m[1]);
    const mes = Number(m[2]) - 1;
    if (dia >= 1 && dia <= 31 && mes >= 0 && mes <= 11) {
      let y = m[3] ? Number(m[3]) : anio;
      if (y < 100) y += 2000;
      return unDia(new Date(Date.UTC(y, mes, dia)), q);
    }
  }

  return null;
}
