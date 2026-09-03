import { obtenerSeguro } from '@/lib/api';
import { SinApi } from '@/components/SinApi';
import { FilaEvaluacion } from '@/components/FilaEvaluacion';
import { PanelGuiasExamen, type GuiaExamenItem } from '@/components/PanelGuiasExamen';
import { diasDesdeHoy } from '@/lib/formato';

export const dynamic = 'force-dynamic';

export default async function Pagina() {
  const [evaluaciones, guias] = await Promise.all([
    obtenerSeguro<any[]>('/evaluaciones'),
    obtenerSeguro<GuiaExamenItem[]>('/guias-examen'),
  ]);
  if (!evaluaciones) return <SinApi />;

  const examenes = evaluaciones.filter((e) =>
    ['PARCIAL', 'FINAL', 'QUIZ'].includes(e.tipo),
  );
  const entregas = evaluaciones.filter(
    (e) => !['PARCIAL', 'FINAL', 'QUIZ'].includes(e.tipo),
  );

  const porDelante = (lista: any[]) =>
    lista.filter((e) => diasDesdeHoy(e.fecha) >= 0 || e.estado === 'PENDIENTE' || e.estado === 'EN_PROGRESO');
  const yaPasaronHechas = (lista: any[]) =>
    lista
      .filter(
        (e) =>
          diasDesdeHoy(e.fecha) < 0 &&
          e.estado !== 'PENDIENTE' &&
          e.estado !== 'EN_PROGRESO',
      )
      .reverse();

  const examenesActivos = porDelante(examenes);
  const entregasActivas = porDelante(entregas);
  const historial = [...yaPasaronHechas(examenes), ...yaPasaronHechas(entregas)].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  );

  return (
    <>
      <header className="cabecera-pagina">
        <div className="eyebrow">Prioridad del semestre</div>
        <h1>Exámenes y entregas</h1>
        <p className="sub">
          Marca cada actividad: <strong>No entregado</strong>,{' '}
          <strong>Envío en tiempo y forma</strong> o <strong>Envío atrasado</strong>. También las
          vencidas se pueden editar.
        </p>
      </header>

      <div id="guias-examen" style={{ marginBottom: 40 }}>
        <PanelGuiasExamen
          guias={guias ?? []}
          titulo="Guías de examen"
          mostrarMateria
        />
      </div>

      <section style={{ marginBottom: 40 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          Exámenes · {examenesActivos.length}
        </div>
        {examenesActivos.length === 0 ? (
          <div className="vacio">No hay exámenes pendientes de marcar.</div>
        ) : (
          <TablaEvaluaciones filas={examenesActivos} />
        )}
      </section>

      <section style={{ marginBottom: 40 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          Entregas y prácticas · {entregasActivas.length}
        </div>
        <p className="mini silencio" style={{ marginBottom: 12 }}>
          Si no has entregado nada, déjalas en «No entregado». Cuando envíes, elige si fue a tiempo o
          atrasado.
        </p>
        {entregasActivas.length === 0 ? (
          <div className="vacio">Nada pendiente aquí.</div>
        ) : (
          <TablaEvaluaciones filas={entregasActivas} />
        )}
      </section>

      {historial.length > 0 && (
        <section>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Ya cerradas</div>
          <TablaEvaluaciones filas={historial} />
        </section>
      )}
    </>
  );
}

function TablaEvaluaciones({ filas }: { filas: any[] }) {
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
