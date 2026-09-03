'use client';

import type { Bloque } from '@/lib/texto';

/**
 * Editor fino, bloque por bloque. Para escribir en clase estorba —para eso está
 * el modo texto—, pero es la única forma de mover cosas de sitio o de cambiar un
 * párrafo a viñeta sin reescribirlo.
 */
const TIPOS: [string, string][] = [
  ['PARRAFO', 'Párrafo'],
  ['ENCABEZADO', 'Encabezado'],
  ['VINETA', 'Viñeta'],
  ['NUMERADA', 'Numerada'],
  ['SEPARADOR', 'Separador'],
  ['ESPACIO', 'Espacio'],
  ['TAREA_PROPIA_TITULO', 'Tarea propia'],
];

const SIN_TEXTO = ['SEPARADOR', 'ESPACIO'];

export function EditorBloques({
  bloques,
  alCambiar,
}: {
  bloques: Bloque[];
  alCambiar: (b: Bloque[]) => void;
}) {
  const cambiar = (i: number, parche: Partial<Bloque>) =>
    alCambiar(bloques.map((b, j) => (j === i ? { ...b, ...parche } : b)));

  const insertar = (i: number) =>
    alCambiar([
      ...bloques.slice(0, i + 1),
      { tipo: 'PARRAFO', texto: '' },
      ...bloques.slice(i + 1),
    ]);

  const eliminar = (i: number) => alCambiar(bloques.filter((_, j) => j !== i));

  const mover = (i: number, delta: number) => {
    const j = i + delta;
    if (j < 0 || j >= bloques.length) return;
    const copia = [...bloques];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    alCambiar(copia);
  };

  return (
    <div>
      {bloques.length === 0 && (
        <p className="silencio mini">Sin bloques. Agrega uno para empezar.</p>
      )}

      {bloques.map((b, i) => (
        <div className="bloque-fila" key={i}>
          <select value={b.tipo} onChange={(e) => cambiar(i, { tipo: e.target.value })}>
            {TIPOS.map(([v, etq]) => (
              <option key={v} value={v}>
                {etq}
              </option>
            ))}
          </select>

          {SIN_TEXTO.includes(b.tipo) ? (
            <div className="silencio mini" style={{ paddingTop: 9 }}>
              {b.tipo === 'SEPARADOR' ? '── línea separadora ──' : '(línea en blanco)'}
            </div>
          ) : (
            <textarea
              value={b.texto}
              rows={Math.max(1, Math.ceil(b.texto.length / 88))}
              onChange={(e) => cambiar(i, { texto: e.target.value })}
            />
          )}

          <div className="bloque-acciones">
            <button onClick={() => mover(i, -1)} title="Subir" disabled={i === 0}>↑</button>
            <button
              onClick={() => mover(i, 1)}
              title="Bajar"
              disabled={i === bloques.length - 1}
            >
              ↓
            </button>
            <button onClick={() => insertar(i)} title="Insertar debajo">+</button>
            <button onClick={() => eliminar(i)} title="Eliminar">×</button>
          </div>
        </div>
      ))}

      <button
        className="boton secundario chico"
        style={{ marginTop: 12 }}
        onClick={() => insertar(bloques.length - 1)}
      >
        + Agregar bloque
      </button>
    </div>
  );
}
