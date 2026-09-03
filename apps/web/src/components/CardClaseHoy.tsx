import Link from 'next/link';
import type { CSSProperties } from 'react';
import { Icono } from './Icono';
import { SelloNotas } from './FilaSesion';

/** Tarjeta grande para una clase de hoy en el panel. */
export function CardClaseHoy({ sesion }: { sesion: any }) {
  const estilo = { '--materia-color': sesion.materia.color } as CSSProperties;

  return (
    <Link href={`/sesiones/${sesion.id}`} className="card-clase-hoy" style={estilo}>
      <div className="card-clase-hora">
        <span className="dato">{sesion.horaInicio}</span>
        {sesion.horaFin && <span className="mini silencio">{sesion.horaFin}</span>}
      </div>
      <div className="card-clase-cuerpo">
        <div className="fila" style={{ gap: 8, marginBottom: 6 }}>
          <span className="punto-materia" style={{ background: sesion.materia.color }} />
          <span className="dato mini silencio">{sesion.materia.clave}</span>
          {sesion.materia.esLaboratorio && (
            <span className="sello mini-lab">Lab</span>
          )}
        </div>
        <h2 className="card-clase-titulo">{sesion.materia.nombre}</h2>
        <p className="card-clase-tema">{sesion.tema}</p>
        <div className="card-clase-pie">
          <SelloNotas sesion={sesion} />
          <span className="card-clase-cta">
            Abrir sesión
            <Icono nombre="flecha" tamano={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
