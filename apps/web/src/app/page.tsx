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
import { SeccionCabecera } from '@/components/SeccionCabecera';
import { PanelAutomatizacion } from '@/components/PanelAutomatizacion';

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
  const entregasSemana = otrasEntregas.filter((e) => diasDesdeHoy(e.fecha) <= 7);
  const guiasPrioridad = (guias ?? []).filter((g) => ['PARCIAL', 'FINAL'].includes(g.tipo));

  return (
    <>
      <header className="cabecera-pagina cabecera-amplia">
        <div className="fila entre" style={{ alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div className="eyebrow">
              {hoy.toLocaleDateString('es-MX', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </div>
            <h1 style={{ marginTop: 10 }}>
              {examenesSemana.length > 0
                ? `${examenesSemana.length} examen${examenesSemana.length === 1 ? '' : 'es'} cerca`
                : panel.sesionesHoy.length > 0
                  ? `Hoy tienes ${panel.sesionesHoy.length} ${panel.sesionesHoy.length === 1 ? 'clase' : 'clases'}`
                  : 'Hoy no tienes clases'}
            </h1>
            <p className="sub" style={{ marginTop: 10, maxWidth: 520 }}>
              {examenesSemana.length > 0
                ? 'Prioridad: abre las guías de examen y repasa. Clases y entregas van más abajo.'
                : 'Todo lo importante del día, en un solo vistazo.'}
            </p>
          </div>
          <div className="tarjeta-avance-semana">
            <div className="fila entre mini" style={{ marginBottom: 8 }}>
              <span className="dato silencio">
                Semana {semestre.semanaActual}/{semestre.totalSemanas}
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

      <section className="bloque-seccion">
        <PanelAutomatizacion />
      </section>

      <section className="bloque-seccion">
        <SeccionCabecera eyebrow="Exámenes próximos" accion="Ver módulo →" href="/examenes" />
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
                <div className="fila entre" style={{ gap: 8, marginBottom: 10 }}>
                  <span className="insignia examen">{ETIQUETA_EVAL[e.tipo] ?? e.tipo}</span>
                  <span className="dato cuando urgente">{cuandoTexto(e.fecha)}</span>
                </div>
                <EtiquetaMateria
                  nombre={e.materia.nombre}
                  aula={e.materia.aula}
                  clave={e.materia.clave}
                  color={e.materia.color}
                  compacta
                />
                <strong className="titulo-card-examen">{e.titulo}</strong>
                {e.peso != null && (
                  <div className="mini silencio dato" style={{ marginTop: 6 }}>
                    Peso {Number(e.peso)}%
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {(guiasPrioridad.length > 0 || (guias ?? []).length > 0) && (
        <div className="bloque-seccion">
          <PanelGuiasExamen
            guias={guiasPrioridad.length ? guiasPrioridad : guias ?? []}
            titulo="Guías de examen"
            limite={6}
          />
        </div>
      )}

      {panel.sesionesHoy.length > 0 && (
        <section className="bloque-seccion">
          <SeccionCabecera eyebrow="Tu día" />
          <div className={`rejilla-clases${panel.sesionesHoy.length === 1 ? ' una' : ''}`}>
            {panel.sesionesHoy.map((s) => (
              <CardClaseHoy key={s.id} sesion={s} />
            ))}
          </div>
        </section>
      )}

      {entregasSemana.length > 0 && (
        <section className="bloque-seccion">
          <SeccionCabecera eyebrow="Entregas esta semana" accion="Ir a Entregas →" href="/entregas" />
          <div className="tarjeta lista-compacta">
            {entregasSemana.map((e) => (
              <Link key={e.id} href="/entregas" className="fila-compacta">
                <span style={{ minWidth: 0 }}>
                  <EtiquetaMateria
                    nombre={e.materia.nombre}
                    aula={e.materia.aula}
                    clave={e.materia.clave}
                    color={e.materia.color}
                    compacta
                  />
                  <span className="titulo-compacto">{e.titulo}</span>
                </span>
                <span className="dato cuando urgente">{cuandoTexto(e.fecha)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="rejilla c2 bloque-seccion" style={{ alignItems: 'start' }}>
        <section>
          <SeccionCabecera eyebrow="Lo que sigue" />
          {panel.proximasSesiones.length === 0 ? (
            <div className="vacio">No quedan clases por delante.</div>
          ) : (
            <div className="pila" style={{ gap: 8 }}>
              {panel.proximasSesiones.map((s) => (
                <FilaSesion key={s.id} sesion={s} />
              ))}
            </div>
          )}
        </section>

        <section>
          <SeccionCabecera eyebrow="Más exámenes" accion="Ver todas →" href="/examenes" />
          {examenes.filter((e) => diasDesdeHoy(e.fecha) > 10).length === 0 ? (
            <div className="vacio">Nada más en el horizonte.</div>
          ) : (
            <div className="tarjeta lista-compacta">
              {examenes
                .filter((e) => diasDesdeHoy(e.fecha) > 10)
                .slice(0, 6)
                .map((e) => (
                  <Link key={e.id} href="/examenes" className="fila-compacta">
                    <span style={{ minWidth: 0 }}>
                      <EtiquetaMateria
                        nombre={e.materia.nombre}
                        aula={e.materia.aula}
                        clave={e.materia.clave}
                        color={e.materia.color}
                        compacta
                      />
                      <span className="titulo-compacto">{e.titulo}</span>
                      <span className="mini silencio">
                        {ETIQUETA_EVAL[e.tipo] ?? e.tipo}
                        {e.peso ? ` · ${Number(e.peso)}%` : ''}
                      </span>
                    </span>
                    <span className="dato mini silencio">{cuandoTexto(e.fecha)}</span>
                  </Link>
                ))}
            </div>
          )}
        </section>
      </div>

      {panel.tareasAbiertas.length > 0 && (
        <section className="bloque-seccion">
          <SeccionCabecera
            eyebrow={`Tareas propias · ${totales.tareasAbiertas}`}
            accion="Ver todas →"
            href="/tareas"
          />
          <div className="tarjeta lista-compacta">
            {panel.tareasAbiertas.slice(0, 5).map((t) => (
              <Link key={t.id} href={`/sesiones/${t.sesion.id}`} className="fila-compacta">
                <span style={{ minWidth: 0 }}>
                  <EtiquetaMateria
                    nombre={t.sesion.materia.nombre}
                    clave={t.sesion.materia.clave}
                    color={t.sesion.materia.color}
                    compacta
                  />
                  <span className="titulo-compacto">{limpiar(t.texto)}</span>
                </span>
                <span className="mini silencio dato">{fechaLarga(t.sesion.fecha)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {totales.pendientesDeEscribir > 0 && (
        <div className="tarjeta hueso fila entre aviso-sync">
          <span className="fila" style={{ gap: 10 }}>
            <Icono nombre="sync" tamano={18} />
            <span>
              <strong>{totales.pendientesDeEscribir} documentos</strong> editados aquí aún no están
              en el .docx.
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
