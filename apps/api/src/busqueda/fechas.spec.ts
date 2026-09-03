import { describe, expect, it } from 'vitest';
import { interpretarFecha } from './fechas';

/** Martes 18 de agosto de 2026, para no depender del reloj de la máquina. */
const HOY = new Date(Date.UTC(2026, 7, 18));

const iso = (d: Date) => d.toISOString().slice(0, 10);

describe('interpretarFecha · relativas', () => {
  it('hoy', () => {
    const r = interpretarFecha('hoy', HOY)!;
    expect(iso(r.desde)).toBe('2026-08-18');
    expect(iso(r.hasta)).toBe('2026-08-18');
  });

  it('mañana y ayer', () => {
    expect(iso(interpretarFecha('mañana', HOY)!.desde)).toBe('2026-08-19');
    expect(iso(interpretarFecha('ayer', HOY)!.desde)).toBe('2026-08-17');
  });

  it('esta semana va de lunes a viernes', () => {
    const r = interpretarFecha('esta semana', HOY)!;
    expect(iso(r.desde)).toBe('2026-08-17'); // lunes
    expect(iso(r.hasta)).toBe('2026-08-21'); // viernes
  });
});

describe('interpretarFecha · fechas escritas', () => {
  it('"10 de septiembre"', () => {
    const r = interpretarFecha('10 de septiembre', HOY)!;
    expect(iso(r.desde)).toBe('2026-09-10');
    expect(r.diaSemana).toBeUndefined();
  });

  it('acepta el mes abreviado y sin "de"', () => {
    expect(iso(interpretarFecha('10 sep', HOY)!.desde)).toBe('2026-09-10');
    expect(iso(interpretarFecha('5 noviembre', HOY)!.desde)).toBe('2026-11-05');
  });

  it('un mes solo abarca el mes completo', () => {
    const r = interpretarFecha('septiembre', HOY)!;
    expect(iso(r.desde)).toBe('2026-09-01');
    expect(iso(r.hasta)).toBe('2026-09-30');
  });

  it('formatos numéricos', () => {
    expect(iso(interpretarFecha('10/09', HOY)!.desde)).toBe('2026-09-10');
    expect(iso(interpretarFecha('10-09-2026', HOY)!.desde)).toBe('2026-09-10');
    expect(iso(interpretarFecha('2026-09-10', HOY)!.desde)).toBe('2026-09-10');
  });

  it('el año de dos cifras se completa a 20xx', () => {
    expect(iso(interpretarFecha('10/09/26', HOY)!.desde)).toBe('2026-09-10');
  });
});

describe('interpretarFecha · días de la semana', () => {
  it('devuelve el día para filtrar, no un rango de un día', () => {
    const r = interpretarFecha('miércoles', HOY)!;
    expect(r.diaSemana).toBe(2);
    expect(r.hasta.getTime()).toBeGreaterThan(r.desde.getTime());
  });

  it('funciona sin acento, que es como se teclea', () => {
    expect(interpretarFecha('miercoles', HOY)!.diaSemana).toBe(2);
    expect(interpretarFecha('MIÉRCOLES', HOY)!.diaSemana).toBe(2);
  });

  it('lunes es 0 y viernes 4, como en el horario', () => {
    expect(interpretarFecha('lunes', HOY)!.diaSemana).toBe(0);
    expect(interpretarFecha('viernes', HOY)!.diaSemana).toBe(4);
  });
});

describe('interpretarFecha · lo que NO es una fecha', () => {
  it('un tema normal no se confunde con fecha', () => {
    for (const q of ['autómata', 'lema del bombeo', 'Übungsbuch', 'parcial', 'RISC-V']) {
      expect(interpretarFecha(q, HOY)).toBeNull();
    }
  });

  it('días imposibles se descartan', () => {
    expect(interpretarFecha('45 de septiembre', HOY)).toBeNull();
    expect(interpretarFecha('32/13', HOY)).toBeNull();
  });

  it('cadena vacía', () => {
    expect(interpretarFecha('', HOY)).toBeNull();
    expect(interpretarFecha('   ', HOY)).toBeNull();
  });
});
