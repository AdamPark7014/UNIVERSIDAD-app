import Link from 'next/link';
import { obtenerSeguro } from '@/lib/api';
import { cuandoTexto, fechaLarga, diasDesdeHoy, ETIQUETA_EVAL } from '@/lib/formato';
import { SinApi } from '@/components/SinApi';
import { Icono } from '@/components/Icono';
import { FilaSesion } from '@/components/FilaSesion';
import { CardClaseHoy } from '@/components/CardClaseHoy';
import { BandaAlertas } from '@/components/BandaAlertas';

export const dynamic = 'force-dynamic';

interface Panel {
  semestre: {
    nombre: string;
    inicio: string;
    fin: string;
    semanaActual: number;
    totalSemanas: number;
    avance: number;
  };
  totales: {
    materias: number;
    sesiones: number;
    tareasAbiertas: number;
    pendientesDeEscribir: number;
    deuda: number;
  };
  sesionesHoy: any[];
  proximasSesiones: any[];
  proximasEvaluaciones: any[];
  tareasAbiertas: any[];
  deuda: any[];
}

export default async function Pagina() {
  const [panel, alertas] = await Promise.all([
    obtenerSeguro<Panel>('/dashboard'),
    obtenerSeguro<any>('/alertas'),
  ]);
  if (!panel) return <SinApi />;

  const { semestre, totales } = panel;
  const hoy = new Date();
  const urgentes = panel.proximasEvaluaciones.filter((e) => diasDesdeHoy(e.fecha) <= 7);
  const resto = panel.proximasEvaluaciones.filter((e) => diasDesdeHoy(e.fecha) > 7);

  return (
    <>
      <header className="cabecera-pagina">
        <div className="fila entre" style={{ alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="eyebrow">
              {hoy.toLocaleDateString('es-MX', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </div>
            <h1 style={{ marginTop: 8 }}>
              {panel.sesionesHoy.length > 0
                ? `Hoy tienes ${panel.sesionesHoy.length} ${panel.sesionesHoy.length === 1 ? 'clase' : 'clases'}`
                : 'Hoy no tienes clases'}
            </h1>
          </div>
          <div style={{ minWidth: 220 }}>
            <div className="fila entre mini silencio" style={{ marginBottom: 6 }}>
              <span className="dato">Semana {semestre.semanaActual} de {semestre.totalSemanas}</span>
              <span className="dato">{semestre.avance}%</span>
            </div>
            <div className="avance">
              <span style={{ width: `${semestre.avance}%` }} />
            </div>
          </div>
        </div>
      </header>

      {alertas && <BandaAlertas datos={alertas} />}

      {/* --- lo de hoy, que es a lo que se entra --- */}
      {panel.sesionesHoy.length > 0 && (
        <section className="bloque-hoy" style={{ marginBottom: 36 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Tu día</div>
          <div className={`rejilla-clases${panel.sesionesHoy.length === 1 ? ' una' : ''}`}>
            {panel.sesionesHoy.map((s) => (
              <CardClaseHoy key={s.id} sesion={s} />
            ))}
          </div>
        </section>
      )}

      {/* --- lo que requiere acción, si es que hay algo --- */}
      {urgentes.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Requiere atención</div>
          <div className="rejilla c2" style={{ alignItems: 'start' }}>
            {urgentes.length > 0 && (
              <div className="tarjeta aviso-suave">
                <div className="fila" style={{ gap: 8, marginBottom: 12 }}>
                  <Icono nombre="reloj" tamano={16} />
                  <strong>
                    {urgentes.length} {urgentes.length === 1 ? 'entrega' : 'entregas'} esta semana
                  </strong>
                </div>
                <div className="pila" style={{ gap: 10 }}>
                  {urgentes.map((e) => (
                    <div key={e.id} className="fila entre" style={{ gap: 10 }}>
                      <span style={{ minWidth: 0 }}>
                        <span className="fila" style={{ gap: 6 }}>
                          <span className="punto-materia" style={{ background: e.materia.color }} />
                          <span className="mini silencio">{e.materia.clave}</span>
                        </span>
                        <span className="mini" style={{ display: 'block' }}>{e.titulo}</span>
                      </span>
                      <span className="dato mini" style={{ flex: 'none', color: 'var(--alerta)' }}>
                        {cuandoTexto(e.fecha)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}


          </div>
        </section>
      )}

      {/* --- el resto de la semana --- */}
      <div className="rejilla c2" style={{ alignItems: 'start', marginBottom: 36 }}>
        <section>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Lo que sigue</div>
          {panel.proximasSesiones.length === 0 ? (
            <div className="vacio">No quedan clases por delante.</div>
          ) : (
            <div className="pila" style={{ gap: 6 }}>
              {panel.proximasSesiones.map((s) => (
                <FilaSesion key={s.id} sesion={s} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="fila entre" style={{ marginBottom: 12 }}>
            <div className="eyebrow">Más adelante</div>
            <Link href="/evaluaciones" className="mini">Ver todas →</Link>
          </div>
          {resto.length === 0 ? (
            <div className="vacio">Nada más en el horizonte.</div>
          ) : (
            <div className="tarjeta" style={{ padding: 0 }}>
              <table className="datos">
                <tbody>
                  {resto.map((e) => (
                    <tr key={e.id}>
                      <td style={{ width: 96 }}>
                        <span className="fila" style={{ gap: 6 }}>
                          <span className="punto-materia" style={{ background: e.materia.color }} />
                          <span className="mini silencio">{e.materia.clave}</span>
                        </span>
                      </td>
                      <td>
                        <span className="mini">{e.titulo}</span>
                        <div className="mini silencio">
                          {ETIQUETA_EVAL[e.tipo] ?? e.tipo}
                          {e.peso ? ` · ${Number(e.peso)}%` : ''}
                        </div>
                      </td>
                      <td className="dato mini silencio" style={{ width: 92, textAlign: 'right' }}>
                        {cuandoTexto(e.fecha)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* --- tareas propias --- */}
      {panel.tareasAbiertas.length > 0 && (
        <section>
          <div className="fila entre" style={{ marginBottom: 12 }}>
            <div className="eyebrow">
              Tareas propias · {totales.tareasAbiertas} abiertas
            </div>
            <Link href="/tareas" className="mini">Ver todas →</Link>
          </div>
          <div className="tarjeta" style={{ padding: 0 }}>
            <table className="datos">
              <tbody>
                {panel.tareasAbiertas.slice(0, 6).map((t) => (
                  <tr key={t.id}>
                    <td style={{ width: 96 }}>
                      <span className="fila" style={{ gap: 6 }}>
                        <span
                          className="punto-materia"
                          style={{ background: t.sesion.materia.color }}
                        />
                        <span className="mini silencio">{t.sesion.materia.clave}</span>
                      </span>
                    </td>
                    <td>
                      <Link href={`/sesiones/${t.sesion.id}`}>{limpiar(t.texto)}</Link>
                    </td>
                    <td className="mini silencio dato" style={{ width: 130, textAlign: 'right' }}>
                      {fechaLarga(t.sesion.fecha)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {totales.pendientesDeEscribir > 0 && (
        <div className="tarjeta hueso fila entre" style={{ marginTop: 24 }}>
          <span className="fila" style={{ gap: 8 }}>
            <Icono nombre="sync" tamano={16} />
            <span>
              <strong>{totales.pendientesDeEscribir} documentos</strong> editados aquí
              todavía no se escriben al .docx.
            </span>
          </span>
          <Link href="/sync" className="boton chico">Escribir ahora</Link>
        </div>
      )}
    </>
  );
}

/** Los apuntes vienen con numeración manual ("1.- …"); en una lista estorba. */
function limpiar(texto: string) {
  return texto.replace(/^\s*\d+\s*[.)-]+\s*/, '');
}
