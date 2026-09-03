import { obtenerSeguro } from '@/lib/api';
import { fechaLarga, cuandoTexto, diasDesdeHoy, ETIQUETA_EVAL } from '@/lib/formato';
import { SinApi } from '@/components/SinApi';
import { FilaEvaluacion } from '@/components/FilaEvaluacion';

export const dynamic = 'force-dynamic';

export default async function Pagina() {
  const evaluaciones = await obtenerSeguro<any[]>('/evaluaciones');
  if (!evaluaciones) return <SinApi />;

  const futuras = evaluaciones.filter((e) => diasDesdeHoy(e.fecha) >= 0);
  const pasadas = evaluaciones.filter((e) => diasDesdeHoy(e.fecha) < 0).reverse();

  return (
    <>
      <header className="cabecera-pagina">
        <div className="eyebrow">Exámenes, entregas y proyectos</div>
        <h1>Evaluaciones</h1>
        <p className="sub">
          {futuras.length} por delante · {pasadas.length} ya pasaron
        </p>
      </header>

      <section style={{ marginBottom: 40 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Por delante</div>
        {futuras.length === 0 ? (
          <div className="vacio">No queda nada pendiente en el calendario.</div>
        ) : (
          <div className="tarjeta" style={{ padding: 0 }}>
            <table className="datos">
              <thead>
                <tr>
                  <th style={{ width: 160 }}>Fecha</th>
                  <th style={{ width: 130 }}>Materia</th>
                  <th>Qué</th>
                  <th style={{ width: 90 }}>Tipo</th>
                  <th style={{ width: 60 }}>Peso</th>
                  <th style={{ width: 130 }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {futuras.map((e) => (
                  <FilaEvaluacion key={e.id} e={e} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {pasadas.length > 0 && (
        <section>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Ya pasaron</div>
          <div className="tarjeta" style={{ padding: 0 }}>
            <table className="datos">
              <tbody>
                {pasadas.map((e) => (
                  <tr key={e.id} style={{ opacity: 0.72 }}>
                    <td className="dato mini" style={{ width: 160 }}>
                      {fechaLarga(e.fecha)}
                      <div className="silencio">{cuandoTexto(e.fecha)}</div>
                    </td>
                    <td style={{ width: 130 }}>
                      <span className="fila">
                        <span className="punto-materia" style={{ background: e.materia.color }} />
                        <span className="mini">{e.materia.clave}</span>
                      </span>
                    </td>
                    <td>{e.titulo}</td>
                    <td className="mini silencio" style={{ width: 90 }}>
                      {ETIQUETA_EVAL[e.tipo] ?? e.tipo}
                    </td>
                    <td className="dato mini" style={{ width: 60 }}>
                      {e.peso ? `${Number(e.peso)}%` : ''}
                    </td>
                    <td style={{ width: 130 }}>
                      <span className="insignia gris">
                        {e.calificacion ? `${Number(e.calificacion)}` : e.estado.toLowerCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
