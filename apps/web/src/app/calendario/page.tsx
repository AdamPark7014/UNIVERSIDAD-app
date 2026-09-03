import Link from 'next/link';
import { obtenerSeguro } from '@/lib/api';
import { fechaCorta, diaDeSemana, esHoy, ETIQUETA_EVAL } from '@/lib/formato';
import { SinApi } from '@/components/SinApi';
import { estadoNotas } from '@/components/FilaSesion';
import { Icono } from '@/components/Icono';

export const dynamic = 'force-dynamic';

export default async function Pagina({
  searchParams,
}: {
  searchParams: { semana?: string; todo?: string };
}) {
  const cal = await obtenerSeguro<any>('/calendario');
  if (!cal) return <SinApi />;

  const noLectivos = new Map<string, string>(
    cal.diasNoLectivos.map((d: any) => [d.fecha.slice(0, 10), d.motivo]),
  );

  const numeros: number[] = cal.semanas.map((s: any) => s.numero);
  const actual = Math.min(Math.max(cal.semestre.semanaActual ?? 1, numeros[0]), numeros.at(-1) ?? 1);
  const todo = searchParams.todo === '1';
  const elegida = searchParams.semana ? parseInt(searchParams.semana, 10) : actual;

  const visibles = todo
    ? cal.semanas
    : cal.semanas.filter((s: any) => s.numero === elegida);

  const anterior = numeros.filter((n) => n < elegida).at(-1);
  const siguiente = numeros.find((n) => n > elegida);

  return (
    <>
      <header className="cabecera-pagina">
        <div className="fila entre" style={{ flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="eyebrow">
              {cal.semestre.nombre} · {fechaCorta(cal.semestre.inicio)} al{' '}
              {fechaCorta(cal.semestre.fin)}
            </div>
            <h1 style={{ marginTop: 8 }}>
              {todo ? 'Todo el semestre' : `Semana ${elegida}`}
              {!todo && elegida === actual && (
                <span className="sello al-dia" style={{ marginLeft: 12, verticalAlign: 'middle' }}>
                  en curso
                </span>
              )}
            </h1>
          </div>

          <div className="fila" style={{ gap: 6 }}>
            {!todo && (
              <>
                <Link
                  href={anterior ? `/calendario?semana=${anterior}` : '#'}
                  className={`boton secundario chico${anterior ? '' : ' inhabilitado'}`}
                  aria-disabled={!anterior}
                >
                  ← Semana {anterior ?? ''}
                </Link>
                {elegida !== actual && (
                  <Link href="/calendario" className="boton chico">Hoy</Link>
                )}
                <Link
                  href={siguiente ? `/calendario?semana=${siguiente}` : '#'}
                  className={`boton secundario chico${siguiente ? '' : ' inhabilitado'}`}
                  aria-disabled={!siguiente}
                >
                  Semana {siguiente ?? ''} →
                </Link>
              </>
            )}
            <Link
              href={todo ? '/calendario' : '/calendario?todo=1'}
              className="boton secundario chico"
            >
              <Icono nombre="calendario" tamano={14} />
              {todo ? 'Ver una semana' : 'Ver las 16'}
            </Link>
          </div>
        </div>

        {/* Regleta de semanas: dónde estás de un vistazo, y saltar a cualquiera. */}
        {!todo && (
          <div className="regleta">
            {numeros.map((n) => (
              <Link
                key={n}
                href={`/calendario?semana=${n}`}
                className={`paso${n === elegida ? ' elegida' : ''}${n < actual ? ' pasada' : ''}${n === actual ? ' actual' : ''}`}
                title={`Semana ${n}`}
              >
                {n}
              </Link>
            ))}
          </div>
        )}
      </header>

      {cal.diasNoLectivos.length > 0 && todo && (
        <div className="tarjeta hueso" style={{ marginBottom: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Días sin clase</div>
          <div className="fila" style={{ gap: 16, flexWrap: 'wrap' }}>
            {cal.diasNoLectivos.map((d: any) => (
              <span key={d.id} className="mini">
                <span className="dato">{fechaCorta(d.fecha)}</span>{' '}
                <span className="silencio">{d.motivo}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {visibles.length === 0 ? (
        <div className="vacio">Esa semana no tiene clases registradas.</div>
      ) : (
        <div className="pila" style={{ gap: 28 }}>
          {visibles.map((s: any) => (
            <section key={s.numero}>
              {todo && (
                <div className="eyebrow" style={{ marginBottom: 10 }}>
                  Semana {s.numero}
                  {s.numero === actual && ' · en curso'}
                </div>
              )}
              <div className="rejilla-semana">
                {s.dias.map((d: any) => {
                  const feriado = noLectivos.get(d.fecha);
                  return (
                    <div
                      key={d.fecha}
                      className={`tarjeta dia${esHoy(d.fecha) ? ' hoy' : ''}`}
                    >
                      <div className="fila entre" style={{ marginBottom: 10 }}>
                        <span className="mini dato" style={{ fontWeight: 500 }}>
                          {diaDeSemana(d.fecha)} {d.fecha.slice(8, 10)}
                        </span>
                        {esHoy(d.fecha) && <span className="sello al-dia">hoy</span>}
                      </div>

                      {feriado && <div className="insignia gris">{feriado}</div>}

                      <div className="pila" style={{ gap: 8 }}>
                        {d.sesiones.map((ses: any) => {
                          const estado = estadoNotas(ses);
                          return (
                            <Link
                              key={ses.id}
                              href={`/sesiones/${ses.id}`}
                              className="clase-dia"
                              style={{ borderLeftColor: ses.materia.color }}
                            >
                              <span className="fila entre" style={{ gap: 6 }}>
                                <span className="mini" style={{ fontWeight: 500 }}>
                                  {ses.materia.clave}
                                </span>
                                <span className="mini dato silencio">{ses.horaInicio}</span>
                              </span>
                              <span className="tema-dia">{ses.tema}</span>
                              {estado === 'deuda' && (
                                <span className="sello deuda">sin apuntes</span>
                              )}
                              {estado === 'al-dia' && (
                                <span className="sello al-dia">
                                  <Icono nombre="check" tamano={11} /> apuntes
                                </span>
                              )}
                            </Link>
                          );
                        })}

                        {d.evaluaciones.map((e: any) => (
                          <div key={e.id} className="eval-dia">
                            <Icono nombre="alerta" tamano={12} />
                            <span>
                              <strong>{ETIQUETA_EVAL[e.tipo] ?? e.tipo}</strong> · {e.titulo}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
