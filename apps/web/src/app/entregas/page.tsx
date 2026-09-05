import Link from 'next/link';
import { obtenerSeguro } from '@/lib/api';
import { SinApi } from '@/components/SinApi';
import { FilaEvaluacion } from '@/components/FilaEvaluacion';
import { diasDesdeHoy } from '@/lib/formato';
import { esExamen } from '@/lib/evaluaciones';

export const dynamic = 'force-dynamic';

export default async function Pagina() {
  const evaluaciones = await obtenerSeguro<any[]>('/evaluaciones');
  if (!evaluaciones) return <SinApi />;

  const entregas = evaluaciones.filter((e) => !esExamen(e.tipo));
  const activas = entregas.filter(
    (e) =>
      diasDesdeHoy(e.fecha) >= 0 || e.estado === 'PENDIENTE' || e.estado === 'EN_PROGRESO',
  );
  const cerradas = entregas
    .filter(
      (e) =>
        diasDesdeHoy(e.fecha) < 0 &&
        e.estado !== 'PENDIENTE' &&
        e.estado !== 'EN_PROGRESO',
    )
    .reverse();
  const sinEntregar = activas.filter((e) => e.estado === 'PENDIENTE').length;

  return (
    <>
      <header className="cabecera-pagina cabecera-amplia">
        <div className="fila entre" style={{ alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="eyebrow">Tareas · prácticas · proyectos · reportes</div>
            <h1>Entregas</h1>
            <p className="sub">
              Elige el estado de cada una. Los exámenes están en{' '}
              <Link href="/examenes">Exámenes</Link>.
            </p>
          </div>
          <div className="chips-resumen">
            <span className="chip-resumen">
              <strong>{activas.length}</strong> activas
            </span>
            {sinEntregar > 0 && (
              <span className="chip-resumen alerta">
                <strong>{sinEntregar}</strong> sin entregar
              </span>
            )}
          </div>
        </div>
      </header>

      <section className="bloque-seccion">
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          Activas · {activas.length}
        </div>
        <p className="leyenda-estados">
          <span className="chip-estado est-pendiente">No entregado</span>
          <span className="chip-estado est-ok">En tiempo y forma</span>
          <span className="chip-estado est-tarde">Atrasado</span>
        </p>
        {activas.length === 0 ? (
          <div className="vacio vacio-grande">Nada pendiente. Todo al corriente.</div>
        ) : (
          <Tabla filas={activas} />
        )}
      </section>

      {cerradas.length > 0 && (
        <section className="bloque-seccion">
          <div className="eyebrow" style={{ marginBottom: 14 }}>Ya cerradas</div>
          <Tabla filas={cerradas} />
        </section>
      )}
    </>
  );
}

function Tabla({ filas }: { filas: any[] }) {
  return (
    <div className="tarjeta tarjeta-tabla">
      <table className="datos tabla-evaluaciones">
        <thead>
          <tr>
            <th style={{ width: 160 }}>Fecha</th>
            <th style={{ width: 180 }}>Materia</th>
            <th>Qué</th>
            <th style={{ width: 90 }}>Tipo</th>
            <th style={{ width: 60 }}>Peso</th>
            <th style={{ width: 210 }}>Estado de envío</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((e) => (
            <FilaEvaluacion key={e.id} e={e} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
