import Link from 'next/link';
import { Icono } from './Icono';

/**
 * Lo primero que se ve al entrar. Solo aparece cuando hay algo que hacer:
 * una banda que sale siempre deja de leerse a los tres días.
 */
export function BandaAlertas({ datos }: { datos: any }) {
  const { alertas = [], notas, umbral } = datos;

  if (alertas.length === 0) {
    return (
      <div className="banda-alertas tranquila">
        <div className="fila" style={{ gap: 10 }}>
          <Icono nombre="check" tamano={18} />
          <div>
            <strong>Todo al día.</strong>{' '}
            <span className="silencio mini">
              Las {notas?.cursadas ?? 0} clases dadas tienen apuntes de al menos {umbral}{' '}
              palabras, y no hay entregas encima.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="banda-alertas">
      <div className="fila entre" style={{ marginBottom: 10 }}>
        <span className="eyebrow" style={{ color: 'var(--alerta)' }}>
          {datos.criticas > 0 ? `${datos.criticas} urgentes` : 'Atención'}
        </span>
        {notas?.pendientes > 0 && (
          <Link href="/notas-pendientes" className="mini">
            Ponerme al día →
          </Link>
        )}
      </div>

      {alertas.slice(0, 5).map((a: any, i: number) => (
        <Link key={i} href={a.enlace} className={`alerta-fila ${a.gravedad}`}>
          <Icono nombre={a.gravedad === 'critica' ? 'alerta' : 'reloj'} tamano={15} className="punta" />
          <span className="texto">
            <strong>{a.titulo}</strong>
            <span className="mini silencio" style={{ display: 'block' }}>
              {a.materia ? `${a.materia.clave} · ` : ''}
              {a.detalle}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
