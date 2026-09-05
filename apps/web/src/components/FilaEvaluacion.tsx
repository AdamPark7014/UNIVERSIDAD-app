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

const CLASE_ESTADO: Record<string, string> = {
  PENDIENTE: 'est-pendiente',
  EN_PROGRESO: 'est-progreso',
  ENTREGADA: 'est-ok',
  ENTREGADA_TARDE: 'est-tarde',
  CALIFICADA: 'est-calificada',
};

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
    if (nuevo === estado) return;
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
    <tr
      className={[
        esExamen ? 'fila-examen' : '',
        vencida ? 'fila-vencida' : '',
        urge ? 'fila-urge' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <td className="celda-fecha">
        <div className="dato">{fechaLarga(e.fecha)}</div>
        <div className={`cuando${urge || vencida ? ' urgente' : ' silencio'}`}>
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
        <div className="celda-titulo">
          {esExamen && <span className="insignia examen">Examen</span>}
          <span className="titulo-eval">{e.titulo}</span>
        </div>
        {e.descripcion && <div className="mini silencio desc-eval">{e.descripcion}</div>}
      </td>
      <td className="mini silencio">{ETIQUETA_EVAL[e.tipo] ?? e.tipo}</td>
      <td className="dato mini">{e.peso ? `${Number(e.peso)}%` : '—'}</td>
      <td className="celda-estado">
        {mostrarSelect ? (
          <select
            className={`select-estado ${CLASE_ESTADO[estado] ?? ''}${vencida ? ' vencida' : ''}`}
            value={estado}
            disabled={guardando}
            aria-label={`Estado de ${e.titulo}`}
            onChange={(ev) => cambiar(ev.target.value)}
          >
            {ESTADOS_EVAL_OPCIONES.map(([v, etq]) => (
              <option key={v} value={v}>
                {etq}
              </option>
            ))}
          </select>
        ) : (
          <span className={`chip-estado ${CLASE_ESTADO[estado] ?? ''}`}>
            {ETIQUETA_ESTADO_EVAL[estado] ?? estado}
          </span>
        )}
      </td>
    </tr>
  );
}
