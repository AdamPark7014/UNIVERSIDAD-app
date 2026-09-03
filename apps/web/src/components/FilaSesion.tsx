import Link from 'next/link';
import { Icono } from './Icono';
import { diasDesdeHoy, fechaLarga } from '@/lib/formato';

/**
 * Estado de los apuntes de una sesión.
 *
 * La distinción que importa: una nota vacía de una clase que todavía no ocurre
 * NO es un pendiente, es lo normal. Solo es deuda si la clase ya pasó. Sin esta
 * regla, las 248 sesiones aparecen marcadas y el aviso deja de significar nada.
 */
export function estadoNotas(sesion: any): 'al-dia' | 'deuda' | 'por-venir' {
  const notas = sesion.documentos?.find((d: any) => d.tipo === 'NOTAS');
  const escrito = (notas?.palabrasContenido ?? 0) > 0;
  if (escrito) return 'al-dia';
  return diasDesdeHoy(sesion.fecha) < 0 ? 'deuda' : 'por-venir';
}

export function SelloNotas({ sesion }: { sesion: any }) {
  const estado = estadoNotas(sesion);
  if (estado === 'al-dia') {
    return (
      <span className="sello al-dia" title="Con apuntes escritos">
        <Icono nombre="check" tamano={13} />
        apuntes
      </span>
    );
  }
  if (estado === 'deuda') {
    return (
      <span className="sello deuda" title="La clase ya pasó y sigue sin apuntes">
        <Icono nombre="alerta" tamano={13} />
        sin apuntes
      </span>
    );
  }
  return null;
}

export function FilaSesion({
  sesion,
  mostrarFecha = true,
  destacada = false,
}: {
  sesion: any;
  mostrarFecha?: boolean;
  destacada?: boolean;
}) {
  return (
    <Link
      href={`/sesiones/${sesion.id}`}
      className={`fila-sesion${destacada ? ' destacada' : ''}`}
      style={{ borderLeftColor: sesion.materia.color }}
    >
      <span className="hora dato">{sesion.horaInicio}</span>

      <span className="cuerpo">
        <span className="titulo">{sesion.materia.nombre}</span>
        <span className="tema">{sesion.tema}</span>
      </span>

      <span className="cola">
        {mostrarFecha && (
          <span className="mini silencio dato">{fechaLarga(sesion.fecha)}</span>
        )}
        <SelloNotas sesion={sesion} />
        <Icono nombre="flecha" tamano={15} className="flecha" />
      </span>
    </Link>
  );
}
