import Link from 'next/link';
import { obtenerSeguro } from '@/lib/api';
import { SinApi } from '@/components/SinApi';
import { FilaEvaluacion } from '@/components/FilaEvaluacion';
import { PanelGuiasExamen, type GuiaExamenItem } from '@/components/PanelGuiasExamen';
import { diasDesdeHoy } from '@/lib/formato';
import { esExamen } from '@/lib/evaluaciones';

export const dynamic = 'force-dynamic';

export default async function Pagina() {
  const [evaluaciones, guias] = await Promise.all([
    obtenerSeguro<any[]>('/evaluaciones'),
    obtenerSeguro<GuiaExamenItem[]>('/guias-examen'),
  ]);
  if (!evaluaciones) return <SinApi />;

  const examenes = evaluaciones.filter((e) => esExamen(e.tipo));
  const activos = examenes.filter(
    (e) =>
      diasDesdeHoy(e.fecha) >= 0 || e.estado === 'PENDIENTE' || e.estado === 'EN_PROGRESO',
  );
  const cerrados = examenes
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
        <div className="eyebrow">Parciales · quizzes · finales</div>
        <h1>Exámenes</h1>
        <p className="sub">
          Solo exámenes. Las tareas, prácticas y reportes están en{' '}
          <Link href="/entregas">Entregas</Link>.
        </p>
      </header>

      <div id="guias-examen" style={{ marginBottom: 40 }}>
        <PanelGuiasExamen guias={guias ?? []} titulo="Guías de examen" mostrarMateria />
      </div>

      <section style={{ marginBottom: 40 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          Por delante · {activos.length}
        </div>
        {activos.length === 0 ? (
          <div className="vacio">No hay exámenes pendientes.</div>
        ) : (
          <Tabla filas={activos} />
        )}
      </section>

      {cerrados.length > 0 && (
        <section>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Ya pasaron</div>
          <Tabla filas={cerrados} />
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
            <th>Examen</th>
            <th style={{ width: 90 }}>Tipo</th>
            <th style={{ width: 60 }}>Peso</th>
            <th style={{ width: 200 }}>Estado</th>
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
