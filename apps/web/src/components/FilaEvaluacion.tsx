'use client';

import { useState } from 'react';
import { enviar } from '@/lib/api';
import {
  fechaLarga,
  cuandoTexto,
  diasDesdeHoy,
  ETIQUETA_EVAL,
  ESTADOS_EVAL_OPCIONES,
  ETIQUETA_ESTADO_EVAL,
} from '@/lib/formato';
import { EtiquetaMateria } from './EtiquetaMateria';

export function FilaEvaluacion({
  e,
  mostrarSelect = true,
}: {
  e: any;
  mostrarSelect?: boolean;
}) {
  const [estado, setEstado] = useState<string>(e.estado);
  const [guardando, setGuardando] = useState(false);
  const dias = diasDesdeHoy(e.fecha);
  const noEntregada = estado === 'PENDIENTE' || estado === 'EN_PROGRESO';
  const urge = dias <= 7 && noEntregada;
  const vencida = dias < 0 && noEntregada;
  const esExamen = ['PARCIAL', 'FINAL', 'QUIZ'].includes(e.tipo);

  const cambiar = async (nuevo: string) => {
    const prev = estado;
    setEstado(nuevo);
    setGuardando(true);
    try {
      await enviar(`/evaluaciones/${e.id}`, {
        metodo: 'PATCH',
        cuerpo: { estado: nuevo },
      });
    } catch {
      setEstado(prev);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <tr className={esExamen ? 'fila-examen' : undefined}>
      <td className="dato mini">
        {fechaLarga(e.fecha)}
        <div
          className={urge || vencida ? '' : 'silencio'}
          style={urge || vencida ? { color: 'var(--alerta)' } : undefined}
        >
          {cuandoTexto(e.fecha)}
          {vencida ? ' · vencida' : ''}
        </div>
      </td>
      <td>
        <EtiquetaMateria
          nombre={e.materia.nombre}
          aula={e.materia.aula}
          clave={e.materia.clave}
          color={e.materia.color}
          esLaboratorio={e.materia.esLaboratorio}
          compacta
        />
      </td>
      <td>
        <span className="fila" style={{ gap: 8, flexWrap: 'wrap' }}>
          {esExamen && <span className="insignia examen">Examen</span>}
          <span>{e.titulo}</span>
        </span>
        {e.descripcion && <div className="mini silencio">{e.descripcion}</div>}
      </td>
      <td className="mini silencio">{ETIQUETA_EVAL[e.tipo] ?? e.tipo}</td>
      <td className="dato mini">{e.peso ? `${Number(e.peso)}%` : ''}</td>
      <td>
        {mostrarSelect ? (
          <select
            className={`select-estado${vencida ? ' vencida' : ''}`}
            value={estado}
            disabled={guardando}
            onChange={(ev) => cambiar(ev.target.value)}
          >
            {ESTADOS_EVAL_OPCIONES.map(([v, etq]) => (
              <option key={v} value={v}>
                {etq}
              </option>
            ))}
          </select>
        ) : (
          <span className="insignia gris">{ETIQUETA_ESTADO_EVAL[estado] ?? estado}</span>
        )}
      </td>
    </tr>
  );
}
