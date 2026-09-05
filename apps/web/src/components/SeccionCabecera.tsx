import Link from 'next/link';

/** Cabecera de sección consistente en todo el panel. */
export function SeccionCabecera({
  eyebrow,
  titulo,
  accion,
  href,
}: {
  eyebrow: string;
  titulo?: string;
  accion?: string;
  href?: string;
}) {
  return (
    <div className="seccion-cabecera">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        {titulo && <h2 className="seccion-titulo">{titulo}</h2>}
      </div>
      {href && accion && (
        <Link href={href} className="enlace-seccion">
          {accion}
        </Link>
      )}
    </div>
  );
}
