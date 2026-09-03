'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { API } from '@/lib/api';
import { fechaCorta, fechaLarga, ETIQUETA_EVAL } from '@/lib/formato';
import { Icono } from './Icono';
import { SelloNotas } from './FilaSesion';

interface Resultado {
  termino: string;
  modo: 'indice' | 'aproximada';
  total: number;
  fecha: string | null;
  sesiones: any[];
  bloques: any[];
  tareas: any[];
  evaluaciones: any[];
  porMateria: { codigo: string; clave: string; nombre: string; color: string; n: number }[];
}

const EJEMPLOS = [
  { q: 'hoy', que: 'las clases de hoy' },
  { q: '10 de septiembre', que: 'qué toca ese día' },
  { q: 'miércoles', que: 'todos los miércoles' },
  { q: 'lema del bombeo', que: 'un tema concreto' },
  { q: 'Übungsbuch', que: 'con o sin acentos' },
  { q: 'parcial', que: 'exámenes y entregas' },
];

export function Buscador({ inicial }: { inicial: string }) {
  const params = useSearchParams();
  const [q, setQ] = useState(inicial);
  const [materia, setMateria] = useState<string | null>(null);
  const [tipo, setTipo] = useState<'GUIA' | 'NOTAS' | null>(null);
  const [datos, setDatos] = useState<Resultado | null>(null);
  const [cargando, setCargando] = useState(false);
  const caja = useRef<HTMLInputElement>(null);
  const peticion = useRef(0);

  // Si se busca desde la barra lateral estando ya en esta pantalla, Next no
  // remonta el componente: hay que seguir el cambio de la URL a mano.
  useEffect(() => {
    const desdeUrl = params.get('q') ?? '';
    if (desdeUrl && desdeUrl !== q) setQ(desdeUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const buscar = useCallback(
    async (termino: string, mat: string | null, tp: 'GUIA' | 'NOTAS' | null) => {
      if (termino.trim().length < 2) {
        setDatos(null);
        setCargando(false);
        return;
      }
      const mio = ++peticion.current;
      setCargando(true);
      try {
        const url = new URL(`${API}/api/busqueda`);
        url.searchParams.set('q', termino);
        if (mat) url.searchParams.set('materia', mat);
        if (tp) url.searchParams.set('tipo', tp);
        const r = await fetch(url, { cache: 'no-store' });
        const json = await r.json();
        if (mio === peticion.current) setDatos(json); // descarta respuestas viejas
      } catch {
        if (mio === peticion.current) setDatos(null);
      } finally {
        if (mio === peticion.current) setCargando(false);
      }
    },
    [],
  );

  useEffect(() => {
    const t = setTimeout(() => buscar(q, materia, tipo), 220);
    return () => clearTimeout(t);
  }, [q, materia, tipo, buscar]);

  const usarEjemplo = (texto: string) => {
    setQ(texto);
    caja.current?.focus();
  };

  const sinEscribir = q.trim().length < 2;

  return (
    <>
      <div className="caja-busqueda">
        <Icono nombre="buscar" tamano={19} />
        <input
          ref={caja}
          type="text"
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Un tema, una fecha, un día de la semana…"
        />
        {q && (
          <button className="limpiar" onClick={() => setQ('')} title="Limpiar">
            ×
          </button>
        )}
      </div>

      <div className="fila" style={{ gap: 6, margin: '14px 0 24px', flexWrap: 'wrap' }}>
        <div className="grupo-botones chico">
          <button className={tipo === null ? 'activo' : ''} onClick={() => setTipo(null)}>
            Todo
          </button>
          <button className={tipo === 'GUIA' ? 'activo' : ''} onClick={() => setTipo('GUIA')}>
            Guías
          </button>
          <button className={tipo === 'NOTAS' ? 'activo' : ''} onClick={() => setTipo('NOTAS')}>
            Mis notas
          </button>
        </div>
        {materia && (
          <button className="boton chico" onClick={() => setMateria(null)}>
            {materia} ×
          </button>
        )}
      </div>

      {/* --- nada escrito: en vez de una pantalla muerta, por dónde empezar --- */}
      {sinEscribir && (
        <div className="tarjeta hueso">
          <div className="eyebrow" style={{ marginBottom: 14 }}>Prueba con</div>
          <div className="rejilla c3" style={{ gap: 10 }}>
            {EJEMPLOS.map((e) => (
              <button key={e.q} className="ejemplo" onClick={() => usarEjemplo(e.q)}>
                <span className="dato">{e.q}</span>
                <span className="silencio mini">{e.que}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {cargando && !datos && <p className="silencio mini">Buscando…</p>}

      {!sinEscribir && !cargando && datos && datos.total === 0 && (
        <div className="vacio">
          Nada para <strong>{q}</strong>. Prueba con menos palabras o con una fecha.
        </div>
      )}

      {datos && datos.total > 0 && (
        <>
          <div className="fila entre" style={{ marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
            <span className="mini silencio dato">
              {datos.total} coincidencias
              {datos.fecha && ` · interpretado como «${datos.fecha}»`}
              {datos.modo === 'aproximada' && ' · por subcadena'}
            </span>
            {datos.porMateria.length > 1 && (
              <div className="fila" style={{ gap: 6, flexWrap: 'wrap' }}>
                {datos.porMateria.slice(0, 7).map((m) => (
                  <button
                    key={m.codigo}
                    className={`boton chico${materia === m.codigo ? '' : ' secundario'}`}
                    onClick={() => setMateria(materia === m.codigo ? null : m.codigo)}
                  >
                    <span className="punto-materia" style={{ background: m.color }} />
                    {m.clave} · {m.n}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Las clases van primero: es lo más accionable de un resultado. */}
          {datos.sesiones.length > 0 && (
            <section style={{ marginBottom: 32 }}>
              <div className="eyebrow" style={{ marginBottom: 12 }}>
                Clases · {datos.sesiones.length}
              </div>
              <div className="pila" style={{ gap: 6 }}>
                {datos.sesiones.slice(0, 20).map((s) => (
                  <Link
                    key={s.id}
                    href={`/sesiones/${s.id}`}
                    className="fila-sesion"
                    style={{ borderLeftColor: s.materia.color }}
                  >
                    <span className="hora dato">{s.horaInicio}</span>
                    <span className="cuerpo">
                      <span className="titulo">{s.materia.nombre}</span>
                      <span className="tema">{s.tema}</span>
                    </span>
                    <span className="cola">
                      {s.evaluaciones?.length > 0 && (
                        <span className="sello deuda">
                          {ETIQUETA_EVAL[s.evaluaciones[0].tipo] ?? 'entrega'}
                        </span>
                      )}
                      <span className="mini silencio dato">{fechaLarga(s.fecha)}</span>
                      <SelloNotas sesion={s} />
                      <Icono nombre="flecha" tamano={15} className="flecha" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {datos.bloques.length > 0 && (
            <section style={{ marginBottom: 32 }}>
              <div className="eyebrow" style={{ marginBottom: 12 }}>
                En los documentos · {datos.bloques.length}
              </div>
              <div className="pila" style={{ gap: 8 }}>
                {datos.bloques.map((b) => (
                  <Link
                    key={b.bloqueId}
                    href={`/sesiones/${b.sesionId}`}
                    className="tarjeta resultado"
                    style={{ borderLeftColor: b.materiaColor }}
                  >
                    <div className="fila entre" style={{ marginBottom: 6, gap: 8 }}>
                      <span className="mini silencio">
                        {b.materiaClave} · sesión {b.numero} · {fechaCorta(b.fecha)}
                      </span>
                      <span className={`sello ${b.documentoTipo === 'NOTAS' ? 'al-dia' : ''}`}>
                        <Icono nombre={b.documentoTipo === 'NOTAS' ? 'nota' : 'guia'} tamano={12} />
                        {b.documentoTipo === 'NOTAS' ? 'mis notas' : 'guía'}
                      </span>
                    </div>
                    <Resaltado texto={b.extracto} termino={datos.termino} />
                    <div className="mini silencio" style={{ marginTop: 4 }}>{b.tema}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {datos.evaluaciones.length > 0 && (
            <section style={{ marginBottom: 32 }}>
              <div className="eyebrow" style={{ marginBottom: 12 }}>Evaluaciones</div>
              <div className="tarjeta" style={{ padding: 0 }}>
                <table className="datos">
                  <tbody>
                    {datos.evaluaciones.map((e) => (
                      <tr key={e.id}>
                        <td style={{ width: 110 }}>
                          <span className="fila" style={{ gap: 6 }}>
                            <span className="punto-materia" style={{ background: e.materia.color }} />
                            <span className="mini">{e.materia.clave}</span>
                          </span>
                        </td>
                        <td>{e.titulo}</td>
                        <td className="mini silencio" style={{ width: 90 }}>
                          {ETIQUETA_EVAL[e.tipo] ?? e.tipo}
                        </td>
                        <td className="mini dato" style={{ width: 92 }}>{fechaCorta(e.fecha)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {datos.tareas.length > 0 && (
            <section>
              <div className="eyebrow" style={{ marginBottom: 12 }}>Tareas propias</div>
              <div className="tarjeta" style={{ padding: 0 }}>
                <table className="datos">
                  <tbody>
                    {datos.tareas.map((t) => (
                      <tr key={t.id}>
                        <td style={{ width: 110 }}>
                          <span className="fila" style={{ gap: 6 }}>
                            <span
                              className="punto-materia"
                              style={{ background: t.sesion.materia.color }}
                            />
                            <span className="mini">{t.sesion.materia.clave}</span>
                          </span>
                        </td>
                        <td>
                          <Link href={`/sesiones/${t.sesion.id}`}>{t.texto}</Link>
                        </td>
                        <td className="mini silencio" style={{ width: 100 }}>
                          {t.estado.toLowerCase().replace('_', ' ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}

/** Marca la primera palabra del término dentro del extracto, sin importar tildes. */
function Resaltado({ texto, termino }: { texto: string; termino: string }) {
  const limpiar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const palabra = termino.trim().split(/\s+/)[0];
  if (!palabra) return <span>{texto}</span>;

  const i = limpiar(texto).indexOf(limpiar(palabra));
  if (i === -1) return <span>{texto}</span>;

  return (
    <span>
      {texto.slice(0, i)}
      <mark>{texto.slice(i, i + palabra.length)}</mark>
      {texto.slice(i + palabra.length)}
    </span>
  );
}
