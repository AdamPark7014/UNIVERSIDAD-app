import Link from 'next/link';
import { obtenerSeguro } from '@/lib/api';
import { cuandoTexto, fechaLarga, diasDesdeHoy, ETIQUETA_EVAL } from '@/lib/formato';
import { SinApi } from '@/components/SinApi';
import { Icono } from '@/components/Icono';
import { FilaSesion } from '@/components/FilaSesion';
import { CardClaseHoy } from '@/components/CardClaseHoy';
import { BandaAlertas } from '@/components/BandaAlertas';
import { PanelGuiasExamen, type GuiaExamenItem } from '@/components/PanelGuiasExamen';
import { EtiquetaMateria } from '@/components/EtiquetaMateria';

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
  const [panel, alertas, guias] = await Promise.all([
    obtenerSeguro<Panel>('/dashboard'),
    obtenerSeguro<any>('/alertas'),
    obtenerSeguro<GuiaExamenItem[]>('/guias-examen'),
  ]);
  if (!panel) return <SinApi />;

  const { semestre, totales } = panel;
  const hoy = new Date();
  const examenes = panel.proximasEvaluaciones.filter((e) =>
    ['PARCIAL', 'FINAL', 'QUIZ'].includes(e.tipo),
  );
  const otrasEntregas = panel.proximasEvaluaciones.filter(
    (e) => !['PARCIAL', 'FINAL', 'QUIZ'].includes(e.tipo),
  );
  const examenesSemana = examenes.filter((e) => diasDesdeHoy(e.fecha) <= 10);
  const guiasPrioridad = (guias ?? []).filter((g) =>
    ['PARCIAL', 'FINAL'].includes(g.tipo),
  );

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
              {examenesSemana.length > 0
                ? `${examenesSemana.length} examen${examenesSemana.length === 1 ? '' : 'es'} cerca`
                : panel.sesionesHoy.length > 0
                  ? `Hoy tienes ${panel.sesionesHoy.length} ${panel.sesionesHoy.length === 1 ? 'clase' : 'clases'}`
                  : 'Hoy no tienes clases'}
            </h1>
            {examenesSemana.length > 0 && (
              <p className="sub" style={{ marginTop: 8 }}>
                Prioridad: estudiar con las guías de examen. Las clases de hoy están más abajo.
              </p>
            )}
          </div>
          <div style={{ minWidth: 220 }}>
            <div className="fila entre mini silencio" style={{ marginBottom: 6 }}>
              <span className="dato">
                Semana {semestre.semanaActual} de {semestre.totalSemanas}
              </span>
              <span className="dato">{semestre.avance}%</span>
            </div>
            <div className="avance">
              <span style={{ width: `${semestre.avance}%` }} />
            </div>
          </div>
        </div>
      </header>

      {alertas && <BandaAlertas datos={alertas} />}

      {/* --- EXÁMENES PRIMERO --- */}
      <section className="bloque-examenes-prioridad" style={{ marginBottom: 40 }}>
          <div className="fila entre" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div className="eyebrow">Exámenes próximos</div>
          <div className="fila" style={{ gap: 8 }}>
            <Link href="/examenes" className="boton chico">
              Ir a Exámenes
            </Link>
            <Link href="/entregas" className="boton chico secundario">
              Entregas
            </Link>
          </div>
        </div>
        {examenesSemana.length === 0 ? (
          <div className="vacio">No hay exámenes en los próximos 10 días.</div>
        ) : (
          <div className="rejilla-examenes">
            {examenesSemana.map((e) => (
              <Link
                key={e.id}
                href="/examenes"
                className="tarjeta-examen-prioridad"
                style={{ borderLeftColor: e.materia.color }}
              >
                <div className="fila entre" style={{ gap: 8, marginBottom: 8 }}>
                  <span className="insignia examen">{ETIQUETA_EVAL[e.tipo] ?? e.tipo}</span>
                  <span className="dato" style={{ color: 'var(--alerta)' }}>
                    {cuandoTexto(e.fecha)}
                  </span>
                </div>
                <EtiquetaMateria
                  nombre={e.materia.nombre}
                  aula={e.materia.aula}
                  clave={e.materia.clave}
                  color={e.materia.color}
                  compacta
                />
                <strong style={{ display: 'block', marginTop: 8, fontSize: 17 }}>{e.titulo}</strong>
                {e.peso != null && (
                  <div className="mini silencio dato" style={{ marginTop: 4 }}>
                    Peso {Number(e.peso)}%
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {(guiasPrioridad.length > 0 || (guias ?? []).length > 0) && (
        <div style={{ marginBottom: 40 }}>
          <PanelGuiasExamen
            guias={guiasPrioridad.length ? guiasPrioridad : guias ?? []}
            titulo="Guías de examen"
            limite={8}
          />
        </div>
      )}

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

      {otrasEntregas.filter((e) => diasDesdeHoy(e.fecha) <= 7).length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <div className="fila entre" style={{ marginBottom: 12 }}>
            <div className="eyebrow">Entregas esta semana</div>
            <Link href="/entregas" className="mini">
              Ir a Entregas →
            </Link>
          </div>
          <div className="tarjeta aviso-suave">
            <div className="pila" style={{ gap: 12 }}>
              {otrasEntregas
                .filter((e) => diasDesdeHoy(e.fecha) <= 7)
                .map((e) => (
                  <Link
                    key={e.id}
                    href="/entregas"
                    className="fila entre"
                    style={{ gap: 10, color: 'inherit' }}
                  >
                    <span style={{ minWidth: 0 }}>
                      <EtiquetaMateria
                        nombre={e.materia.nombre}
                        aula={e.materia.aula}
                        clave={e.materia.clave}
                        color={e.materia.color}
                        compacta
                      />
                      <span className="mini" style={{ display: 'block', marginTop: 2 }}>
                        {e.titulo}
                      </span>
                    </span>
                    <span className="dato mini" style={{ flex: 'none', color: 'var(--alerta)' }}>
                      {cuandoTexto(e.fecha)}
                    </span>
                  </Link>
                ))}
            </div>
          </div>
        </section>
      )}

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
            <div className="eyebrow">Más exámenes adelante</div>
            <Link href="/examenes" className="mini">
              Ver todas →
            </Link>
          </div>
          {examenes.filter((e) => diasDesdeHoy(e.fecha) > 10).length === 0 ? (
            <div className="vacio">Nada más en el horizonte.</div>
          ) : (
            <div className="tarjeta" style={{ padding: 0 }}>
              <table className="datos">
                <tbody>
                  {examenes
                    .filter((e) => diasDesdeHoy(e.fecha) > 10)
                    .slice(0, 8)
                    .map((e) => (
                      <tr key={e.id}>
                        <td style={{ minWidth: 140 }}>
                          <EtiquetaMateria
                            nombre={e.materia.nombre}
                            aula={e.materia.aula}
                            clave={e.materia.clave}
                            color={e.materia.color}
                            compacta
                          />
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

      {panel.tareasAbiertas.length > 0 && (
        <section>
          <div className="fila entre" style={{ marginBottom: 12 }}>
            <div className="eyebrow">Tareas propias · {totales.tareasAbiertas} abiertas</div>
            <Link href="/tareas" className="mini">
              Ver todas →
            </Link>
          </div>
          <div className="tarjeta" style={{ padding: 0 }}>
            <table className="datos">
              <tbody>
                {panel.tareasAbiertas.slice(0, 6).map((t) => (
                  <tr key={t.id}>
                    <td style={{ minWidth: 140 }}>
                      <EtiquetaMateria
                        nombre={t.sesion.materia.nombre}
                        clave={t.sesion.materia.clave}
                        color={t.sesion.materia.color}
                        compacta
                      />
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
              <strong>{totales.pendientesDeEscribir} documentos</strong> editados aquí todavía no se
              escriben al .docx.
            </span>
          </span>
          <Link href="/sync" className="boton chico">
            Escribir ahora
          </Link>
        </div>
      )}
    </>
  );
}

function limpiar(texto: string) {
  return texto.replace(/^\s*\d+\s*[.)-]+\s*/, '');
}
