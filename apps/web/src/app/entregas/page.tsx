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

  return (
    <>
      <header className="cabecera-pagina">
        <div className="eyebrow">Tareas · prácticas · proyectos · reportes</div>
        <h1>Entregas</h1>
        <p className="sub">
          Marca cada una: <strong>No entregado</strong>,{' '}
          <strong>Envío en tiempo y forma</strong> o <strong>Envío atrasado</strong>. Los exámenes
          están en <Link href="/examenes">Exámenes</Link>.
        </p>
      </header>

      <section style={{ marginBottom: 40 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          Activas · {activas.length}
        </div>
        <p className="mini silencio" style={{ marginBottom: 12 }}>
          Si no has entregado nada, déjalas en «No entregado». Cuando envíes, elige si fue a tiempo o
          atrasado.
        </p>
        {activas.length === 0 ? (
          <div className="vacio">Nada pendiente aquí.</div>
        ) : (
          <Tabla filas={activas} />
        )}
      </section>

      {cerradas.length > 0 && (
        <section>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Ya cerradas</div>
          <Tabla filas={cerradas} />
        </section>
      )}
    </>
  );
}

function Tabla({ filas }: { filas: any[] }) {
  return (
    <div className="tarjeta" style={{ padding: 0 }}>
      <table className="datos tabla-evaluaciones">
        <thead>
          <tr>
            <th style={{ width: 160 }}>Fecha</th>
            <th style={{ width: 180 }}>Materia</th>
            <th>Qué</th>
            <th style={{ width: 90 }}>Tipo</th>
            <th style={{ width: 60 }}>Peso</th>
            <th style={{ width: 200 }}>Estado de envío</th>
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
