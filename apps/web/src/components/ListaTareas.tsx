'use client';

import { useState } from 'react';
import { enviar } from '@/lib/api';
import { ETIQUETA_ESTADO_TAREA } from '@/lib/formato';

interface Tarea {
  id: string;
  texto: string;
  estado: string;
  resultado: string | null;
}

const ESTADOS = ['ABIERTA', 'EN_PROGRESO', 'HECHA', 'DESCARTADA'];

export function ListaTareas({
  sesionId,
  iniciales,
}: {
  sesionId: string;
  iniciales: Tarea[];
}) {
  const [tareas, setTareas] = useState<Tarea[]>(iniciales);
  const [nueva, setNueva] = useState('');
  const [abierta, setAbierta] = useState<string | null>(null);

  const cambiarEstado = async (id: string, estado: string) => {
    setTareas((prev) => prev.map((t) => (t.id === id ? { ...t, estado } : t)));
    await enviar(`/tareas/${id}`, { metodo: 'PATCH', cuerpo: { estado } }).catch(() => {});
  };

  const guardarResultado = async (id: string, resultado: string) => {
    setTareas((prev) => prev.map((t) => (t.id === id ? { ...t, resultado } : t)));
    await enviar(`/tareas/${id}`, { metodo: 'PATCH', cuerpo: { resultado } }).catch(() => {});
  };

  const agregar = async () => {
    const texto = nueva.trim();
    if (!texto) return;
    setNueva('');
    try {
      const t = await enviar<Tarea>('/tareas', { cuerpo: { sesionId, texto } });
      setTareas((prev) => [...prev, t]);
    } catch {
      /* si falla, el texto se pierde; es una nota corta, no vale bloquear la UI */
    }
  };

  const eliminar = async (id: string) => {
    setTareas((prev) => prev.filter((t) => t.id !== id));
    await enviar(`/tareas/${id}`, { metodo: 'DELETE' }).catch(() => {});
  };

  return (
    <div className="tarjeta" style={{ padding: 16 }}>
      {tareas.length === 0 && (
        <p className="silencio mini" style={{ marginTop: 0 }}>
          Nada anotado en esta sesión todavía.
        </p>
      )}

      <div className="pila" style={{ gap: 8 }}>
        {tareas.map((t) => (
          <div key={t.id} style={{ borderBottom: '1px solid var(--linea)', paddingBottom: 8 }}>
            <div className="fila entre" style={{ gap: 8 }}>
              <span
                style={{
                  flex: 1,
                  textDecoration: t.estado === 'HECHA' ? 'line-through' : 'none',
                  opacity: t.estado === 'DESCARTADA' ? 0.5 : 1,
                }}
              >
                {t.texto}
              </span>
              <select
                value={t.estado}
                onChange={(e) => cambiarEstado(t.id, e.target.value)}
                style={{ width: 130, fontSize: 12 }}
              >
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {ETIQUETA_ESTADO_TAREA[e]}
                  </option>
                ))}
              </select>
              <button
                className="boton secundario chico"
                onClick={() => setAbierta(abierta === t.id ? null : t.id)}
              >
                Notas
              </button>
              <button className="boton secundario chico" onClick={() => eliminar(t.id)}>
                ×
              </button>
            </div>
            {abierta === t.id && (
              <textarea
                style={{ marginTop: 8 }}
                rows={3}
                placeholder="Qué encontraste al investigarla…"
                defaultValue={t.resultado ?? ''}
                onBlur={(e) => guardarResultado(t.id, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="fila" style={{ marginTop: 14, gap: 8 }}>
        <input
          type="text"
          placeholder="Nueva idea para investigar por mi cuenta…"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && agregar()}
        />
        <button className="boton chico" onClick={agregar} disabled={!nueva.trim()}>
          Agregar
        </button>
      </div>
    </div>
  );
}
