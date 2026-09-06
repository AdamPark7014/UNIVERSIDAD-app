import Link from 'next/link';
import { obtenerSeguro } from '@/lib/api';
import { SinApi } from '@/components/SinApi';
import { FilaEvaluacion } from '@/components/FilaEvaluacion';
import { PanelGuiasExamen, type GuiaExamenItem } from '@/components/PanelGuiasExamen';
import { SeccionCabecera } from '@/components/SeccionCabecera';
import { BotonRegenerarGuias } from '@/components/BotonRegenerarGuias';
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
  const urgentes = activos.filter((e) => diasDesdeHoy(e.fecha) <= 10).length;

  return (
    <>
      <header className="cabecera-pagina cabecera-amplia">
        <div className="fila entre" style={{ alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="eyebrow">Parciales · quizzes · finales</div>
            <h1>Exámenes</h1>
            <p className="sub">
              Estudia con las guías y marca el estado cuando termines. Las entregas van aparte en{' '}
              <Link href="/entregas">Entregas</Link>.
            </p>
          </div>
          <div className="chips-resumen">
            <span className="chip-resumen">
              <strong>{activos.length}</strong> activos
            </span>
            {urgentes > 0 && (
              <span className="chip-resumen alerta">
                <strong>{urgentes}</strong> en ≤10 días
              </span>
            )}
            <span className="chip-resumen">
              <strong>{(guias ?? []).length}</strong> guías
            </span>
          </div>
        </div>
      </header>

      <div id="guias-examen" className="bloque-seccion">
        <div className="fila entre" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div className="eyebrow" style={{ margin: 0 }}>
            Guías de examen
          </div>
          <BotonRegenerarGuias proximos={21} />
        </div>
        <PanelGuiasExamen guias={guias ?? []} titulo="" mostrarMateria />
      </div>

      <section className="bloque-seccion">
        <SeccionCabecera eyebrow={`Por delante · ${activos.length}`} />
        {activos.length === 0 ? (
          <div className="vacio vacio-grande">No hay exámenes pendientes. Buen momento para adelantar.</div>
        ) : (
          <Tabla filas={activos} />
        )}
      </section>

      {cerrados.length > 0 && (
        <section className="bloque-seccion">
          <SeccionCabecera eyebrow={`Ya pasaron · ${cerrados.length}`} />
          <Tabla filas={cerrados} />
        </section>
      )}
    </>
  );
}

function Tabla({ filas }: { filas: any[] }) {
  return (
    <div className="tarjeta tarjeta-tabla wrap-tabla-scroll">
      <table className="datos tabla-evaluaciones">
        <thead>
          <tr>
            <th style={{ width: 160 }}>Fecha</th>
            <th style={{ width: 180 }}>Materia</th>
            <th>Examen</th>
            <th style={{ width: 90 }}>Tipo</th>
            <th style={{ width: 60 }}>Peso</th>
            <th style={{ width: 210 }}>Estado</th>
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
