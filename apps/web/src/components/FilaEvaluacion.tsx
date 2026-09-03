'use client';

import { useState } from 'react';
import { enviar } from '@/lib/api';
import { fechaLarga, cuandoTexto, diasDesdeHoy, ETIQUETA_EVAL } from '@/lib/formato';

const ESTADOS = [
  ['PENDIENTE', 'Pendiente'],
  ['EN_PROGRESO', 'En progreso'],
  ['ENTREGADA', 'Entregada'],
  ['CALIFICADA', 'Calificada'],
];

export function FilaEvaluacion({ e }: { e: any }) {
  const [estado, setEstado] = useState<string>(e.estado);
  const dias = diasDesdeHoy(e.fecha);
  const urge = dias <= 7 && estado === 'PENDIENTE';

  const cambiar = async (nuevo: string) => {
    setEstado(nuevo);
    await enviar(`/evaluaciones/${e.id}`, {
      metodo: 'PATCH',
      cuerpo: { estado: nuevo },
    }).catch(() => {});
  };

  return (
    <tr>
      <td className="dato mini">
        {fechaLarga(e.fecha)}
        <div className={urge ? '' : 'silencio'} style={urge ? { color: 'var(--alerta)' } : undefined}>
          {cuandoTexto(e.fecha)}
        </div>
      </td>
      <td>
        <span className="fila">
          <span className="punto-materia" style={{ background: e.materia.color }} />
          <span className="mini">{e.materia.clave}</span>
        </span>
      </td>
      <td>
        {e.titulo}
        {e.descripcion && <div className="mini silencio">{e.descripcion}</div>}
      </td>
      <td className="mini silencio">{ETIQUETA_EVAL[e.tipo] ?? e.tipo}</td>
      <td className="dato mini">{e.peso ? `${Number(e.peso)}%` : ''}</td>
      <td>
        <select value={estado} onChange={(ev) => cambiar(ev.target.value)} style={{ fontSize: 12 }}>
          {ESTADOS.map(([v, etq]) => (
            <option key={v} value={v}>
              {etq}
            </option>
          ))}
        </select>
      </td>
    </tr>
  );
}
