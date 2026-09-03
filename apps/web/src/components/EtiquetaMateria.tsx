'use client';

/** Etiqueta de materia: nombre real + salón (nunca solo el código tipo CS109). */
export function EtiquetaMateria({
  nombre,
  aula,
  clave,
  color,
  esLaboratorio,
  compacta = false,
}: {
  nombre: string;
  aula?: string | null;
  clave?: string | null;
  color?: string;
  esLaboratorio?: boolean;
  compacta?: boolean;
}) {
  const salon = aula?.trim() || (clave ? clave.replace(/^([A-Z]+)(\d)/, '$1 $2') : null);
  const titulo = esLaboratorio && !nombre.toLowerCase().startsWith('lab')
    ? `Lab · ${nombre}`
    : nombre;

  return (
    <span className={`etiqueta-materia${compacta ? ' compacta' : ''}`}>
      {color && <span className="punto-materia" style={{ background: color }} />}
      <span className="etiqueta-materia-texto">
        <span className="etiqueta-materia-nombre">{titulo}</span>
        {salon && (
          <span className="etiqueta-materia-salon silencio">
            Salón {salon}
          </span>
        )}
      </span>
    </span>
  );
}
