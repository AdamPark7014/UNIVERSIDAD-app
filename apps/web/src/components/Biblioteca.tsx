'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { API, enviar } from '@/lib/api';
import { Icono } from './Icono';

interface Libro {
  id: string;
  titulo: string;
  autor: string | null;
  anio: number | null;
  editorial: string | null;
  isbn: string | null;
  url: string | null;
  notas: string | null;
  ruta: string | null;
  archivo: string | null;
  tamanoBytes: number | null;
  esPrincipal: boolean;
  soloReferencia: boolean;
  materia: { codigo: string; clave: string; nombre: string; color: string };
}

interface Materia {
  id: string;
  codigo: string;
  clave: string;
  nombre: string;
  color: string;
}

const mb = (n: number | null) => (n ? `${(n / 1048576).toFixed(1)} MB` : '');

function urlArchivo(id: string) {
  return `${API}/api/libros/${id}/archivo?v=${id}`;
}

/** Visor que comprueba Content-Type antes de meter el PDF en el iframe. */
function VisorPdf({ libro }: { libro: Libro }) {
  const [estado, setEstado] = useState<'cargando' | 'ok' | 'error'>('cargando');
  const [detalle, setDetalle] = useState<string | null>(null);
  const src = `${urlArchivo(libro.id)}#view=FitH`;

  useEffect(() => {
    let cancelado = false;
    setEstado('cargando');
    setDetalle(null);

    (async () => {
      try {
        const r = await fetch(urlArchivo(libro.id), { method: 'HEAD', cache: 'no-store' });
        if (cancelado) return;
        const tipo = (r.headers.get('content-type') || '').toLowerCase();
        if (!r.ok || !tipo.includes('pdf')) {
          // HEAD a veces no trae tipo; intenta un GET parcial.
          const g = await fetch(urlArchivo(libro.id), {
            headers: { Range: 'bytes=0-4' },
            cache: 'no-store',
          });
          if (cancelado) return;
          const buf = new Uint8Array(await g.arrayBuffer());
          const magia = String.fromCharCode(...buf.slice(0, 4));
          if (!g.ok || magia !== '%PDF') {
            let mensaje = `No se pudo abrir el PDF (${g.status}).`;
            try {
              const j = JSON.parse(new TextDecoder().decode(buf));
              if (j?.mensaje) mensaje = j.mensaje;
            } catch {
              /* no era JSON */
            }
            setDetalle(mensaje);
            setEstado('error');
            return;
          }
        }
        setEstado('ok');
      } catch (e: any) {
        if (!cancelado) {
          setDetalle(e?.message ?? 'Error de red');
          setEstado('error');
        }
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [libro.id]);

  return (
    <>
      <div className="cabecera-panel">
        <Icono nombre="guia" tamano={15} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {libro.titulo}
        </span>
        <span style={{ flex: 1 }} />
        <a className="mini" href={urlArchivo(libro.id)} target="_blank" rel="noreferrer">
          Pantalla completa
        </a>
      </div>
      {estado === 'cargando' && (
        <div className="vacio" style={{ margin: 0, height: '100%', display: 'grid', placeItems: 'center' }}>
          <p className="mini silencio">Cargando PDF…</p>
        </div>
      )}
      {estado === 'error' && (
        <div className="vacio" style={{ margin: 0, height: '100%', display: 'grid', placeItems: 'center', padding: 24 }}>
          <div style={{ maxWidth: 420, textAlign: 'center' }}>
            <Icono nombre="alerta" tamano={28} />
            <p style={{ marginTop: 10 }}>No se pudo embeber el archivo.</p>
            <p className="mini silencio">{detalle}</p>
            <p className="mini silencio" style={{ marginTop: 8 }}>
              Prueba «Pantalla completa» o vuelve a importar libros desde el disco.
            </p>
          </div>
        </div>
      )}
      {estado === 'ok' && (
        <iframe title={libro.titulo} src={src} />
      )}
    </>
  );
}

export function Biblioteca({
  libros: iniciales,
  materias,
  materiaInicial,
  libroInicial,
}: {
  libros: Libro[];
  materias: Materia[];
  materiaInicial: string | null;
  libroInicial: string | null;
}) {
  const router = useRouter();
  const [libros, setLibros] = useState(iniciales);
  const [materia, setMateria] = useState<string | null>(materiaInicial);
  const [abierto, setAbierto] = useState<string | null>(
    libroInicial ?? iniciales.find((l) => l.ruta)?.id ?? null,
  );
  const [formulario, setFormulario] = useState<'no' | 'archivo' | 'referencia'>('no');
  const [aviso, setAviso] = useState<string | null>(null);
  const [cargando, setCargando] = useState<string | null>(null);
  const entradas = useRef<Record<string, HTMLInputElement | null>>({});

  /**
   * Adjunta un PDF a un libro que estaba solo como referencia. Conserva el
   * título y el autor ya registrados: el archivo descargado casi siempre viene
   * con un nombre inservible.
   */
  const adjuntar = async (id: string, archivo: File) => {
    setCargando(id);
    setAviso(null);
    try {
      const datos = new FormData();
      datos.append('archivo', archivo);
      const r = await fetch(`${API}/api/libros/${id}/archivo`, { method: 'POST', body: datos });
      if (!r.ok) throw new Error(((await r.json().catch(() => null)) as any)?.mensaje ?? 'falló la carga');
      const actualizado: Libro = await r.json();
      setLibros((prev) => prev.map((l) => (l.id === id ? actualizado : l)));
      setAbierto(id); // se abre solo, que es lo que se espera al cargarlo
      setAviso(`Cargado: ${actualizado.titulo}`);
    } catch (e: any) {
      setAviso(`Error: ${e.message}`);
    } finally {
      setCargando(null);
    }
  };

  const visibles = useMemo(
    () => (materia ? libros.filter((l) => l.materia.codigo === materia) : libros),
    [libros, materia],
  );
  const activo = libros.find((l) => l.id === abierto) ?? null;

  const porMateria = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of libros) m.set(l.materia.codigo, (m.get(l.materia.codigo) ?? 0) + 1);
    return m;
  }, [libros]);

  const importar = async () => {
    setAviso('Buscando PDF nuevos…');
    try {
      const r = await enviar<any>('/libros/importar');
      setAviso(`${r.encontrados} en disco · ${r.nuevos} nuevos · ${r.huerfanos} sin archivo`);
      router.refresh();
    } catch (e: any) {
      setAviso(`Error: ${e.message}`);
    }
  };

  const eliminar = async (id: string) => {
    if (!confirm('Se quita de la lista. El PDF NO se borra del disco. ¿Seguir?')) return;
    setLibros((prev) => prev.filter((l) => l.id !== id));
    if (abierto === id) setAbierto(null);
    await enviar(`/libros/${id}`, { metodo: 'DELETE' }).catch(() => {});
  };

  const alAgregar = (l: Libro) => {
    setLibros((prev) => [l, ...prev]);
    setFormulario('no');
    if (l.ruta) setAbierto(l.id);
    setAviso(`Agregado: ${l.titulo}`);
  };

  return (
    <>
      <div className="fila entre" style={{ marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div className="fila" style={{ gap: 6, flexWrap: 'wrap' }}>
          <button
            className={`boton chico${materia === null ? '' : ' secundario'}`}
            onClick={() => setMateria(null)}
          >
            Todas · {libros.length}
          </button>
          {materias
            .filter((m) => porMateria.has(m.codigo))
            .map((m) => (
              <button
                key={m.codigo}
                className={`boton chico${materia === m.codigo ? '' : ' secundario'}`}
                onClick={() => setMateria(materia === m.codigo ? null : m.codigo)}
                title={m.nombre}
              >
                <span className="punto-materia" style={{ background: m.color }} />
                {m.clave} · {porMateria.get(m.codigo)}
              </button>
            ))}
        </div>

        <div className="fila" style={{ gap: 6 }}>
          <button className="boton secundario chico" onClick={importar}>
            <Icono nombre="sync" tamano={14} /> Buscar en disco
          </button>
          <button
            className="boton chico"
            onClick={() => setFormulario(formulario === 'archivo' ? 'no' : 'archivo')}
          >
            + Agregar libro
          </button>
        </div>
      </div>

      {aviso && (
        <p className="mini silencio dato" style={{ marginBottom: 14 }}>
          {aviso}
        </p>
      )}

      {formulario !== 'no' && (
        <FormularioAgregar
          materias={materias}
          materiaPreseleccionada={materia}
          modo={formulario}
          alCambiarModo={setFormulario}
          alAgregar={alAgregar}
          alCancelar={() => setFormulario('no')}
        />
      )}

      <div className="biblioteca">
        <div className="lista-libros">
          {visibles.length === 0 && (
            <div className="vacio">
              Sin libros en esta materia. Usa <strong>Agregar libro</strong>.
            </div>
          )}

          {visibles.map((l) => (
            <div
              key={l.id}
              className={`libro${abierto === l.id ? ' abierto' : ''}${l.ruta ? '' : ' sin-archivo'}`}
              style={{ borderLeftColor: l.materia.color }}
            >
              <button
                className="libro-cuerpo"
                onClick={() => l.ruta && setAbierto(l.id)}
                disabled={!l.ruta}
                title={l.ruta ? 'Abrir aquí' : 'Sin archivo en disco'}
              >
                <span className="fila entre" style={{ gap: 8 }}>
                  <span className="mini silencio">{l.materia.clave}</span>
                  {l.esPrincipal && <span className="sello al-dia">principal</span>}
                </span>
                <span className="libro-titulo">{l.titulo}</span>
                <span className="mini silencio">
                  {[l.autor, l.editorial, l.anio].filter(Boolean).join(' · ')}
                </span>
                <span className="fila mini silencio dato" style={{ gap: 8, marginTop: 3 }}>
                  {l.ruta ? (
                    <>
                      <Icono nombre="guia" tamano={12} /> PDF {mb(l.tamanoBytes)}
                    </>
                  ) : (
                    <>
                      sin PDF · búscalo y cárgalo con ↑
                      {l.isbn ? ` · ISBN ${l.isbn}` : ''}
                    </>
                  )}
                </span>
              </button>

              <div className="libro-acciones">
                {!l.ruta && (
                  <>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      hidden
                      ref={(el) => {
                        entradas.current[l.id] = el;
                      }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void adjuntar(l.id, f);
                        e.target.value = '';
                      }}
                    />
                    <button
                      onClick={() => entradas.current[l.id]?.click()}
                      title="Cargar el PDF de este libro"
                      disabled={cargando === l.id}
                    >
                      {cargando === l.id ? '…' : '↑'}
                    </button>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(
                        [l.titulo, l.autor, 'pdf'].filter(Boolean).join(' '),
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Buscarlo en la web"
                      className="mini"
                    >
                      <Icono nombre="buscar" tamano={14} />
                    </a>
                  </>
                )}
                {l.ruta && (
                  <a
                    href={`${API}/api/libros/${l.id}/archivo?descargar=1`}
                    title="Descargar"
                    className="mini"
                  >
                    <Icono nombre="descargar" tamano={14} />
                  </a>
                )}
                {l.url && (
                  <a href={l.url} target="_blank" rel="noreferrer" title="Abrir enlace" className="mini">
                    <Icono nombre="flecha" tamano={14} />
                  </a>
                )}
                <button onClick={() => eliminar(l.id)} title="Quitar de la lista">×</button>
              </div>
            </div>
          ))}
        </div>

        <div className="visor" key={activo?.id ?? 'sin-libro'}>
          {activo?.ruta ? (
            <VisorPdf libro={activo} />
          ) : (
            <div className="vacio" style={{ margin: 0, height: '100%', display: 'grid', placeItems: 'center' }}>
              <div>
                <Icono nombre="guia" tamano={28} />
                <p style={{ marginBottom: 0 }}>Elige un libro de la izquierda para leerlo aquí.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- formulario

function FormularioAgregar({
  materias,
  materiaPreseleccionada,
  modo,
  alCambiarModo,
  alAgregar,
  alCancelar,
}: {
  materias: Materia[];
  materiaPreseleccionada: string | null;
  modo: 'archivo' | 'referencia';
  alCambiarModo: (m: 'archivo' | 'referencia') => void;
  alAgregar: (l: Libro) => void;
  alCancelar: () => void;
}) {
  const inicial =
    materias.find((m) => m.codigo === materiaPreseleccionada)?.id ?? materias[0]?.id ?? '';
  const [materiaId, setMateriaId] = useState(inicial);
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [editorial, setEditorial] = useState('');
  const [anio, setAnio] = useState('');
  const [isbn, setIsbn] = useState('');
  const [url, setUrl] = useState('');
  const [principal, setPrincipal] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const archivo = useRef<HTMLInputElement>(null);

  const enviarArchivo = async () => {
    const f = archivo.current?.files?.[0];
    if (!f) return setError('Elige un PDF.');
    setTrabajando(true);
    setError(null);
    try {
      const datos = new FormData();
      datos.append('archivo', f);
      datos.append('materiaId', materiaId);
      if (titulo) datos.append('titulo', titulo);
      if (autor) datos.append('autor', autor);
      datos.append('esPrincipal', String(principal));

      const r = await fetch(`${API}/api/libros/subir`, { method: 'POST', body: datos });
      if (!r.ok) throw new Error(await r.text());
      alAgregar(await r.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setTrabajando(false);
    }
  };

  const enviarReferencia = async () => {
    if (!titulo.trim()) return setError('El título es obligatorio.');
    setTrabajando(true);
    setError(null);
    try {
      const l = await enviar<Libro>('/libros', {
        cuerpo: {
          materiaId,
          titulo,
          autor: autor || undefined,
          editorial: editorial || undefined,
          anio: anio ? Number(anio) : undefined,
          isbn: isbn || undefined,
          url: url || undefined,
          esPrincipal: principal,
        },
      });
      alAgregar(l);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setTrabajando(false);
    }
  };

  return (
    <div className="tarjeta hueso" style={{ marginBottom: 20 }}>
      <div className="fila entre" style={{ marginBottom: 14 }}>
        <div className="grupo-botones chico">
          <button className={modo === 'archivo' ? 'activo' : ''} onClick={() => alCambiarModo('archivo')}>
            Subir un PDF
          </button>
          <button
            className={modo === 'referencia' ? 'activo' : ''}
            onClick={() => alCambiarModo('referencia')}
          >
            Solo la referencia
          </button>
        </div>
        <button className="boton secundario chico" onClick={alCancelar}>Cancelar</button>
      </div>

      <div className="rejilla c2" style={{ gap: 12 }}>
        <label className="campo">
          <span>Materia</span>
          <select value={materiaId} onChange={(e) => setMateriaId(e.target.value)}>
            {materias.map((m) => (
              <option key={m.id} value={m.id}>
                {m.clave} — {m.nombre}
              </option>
            ))}
          </select>
        </label>

        {modo === 'archivo' ? (
          <label className="campo">
            <span>Archivo PDF</span>
            <input type="file" accept="application/pdf,.pdf" ref={archivo} />
          </label>
        ) : (
          <label className="campo">
            <span>Enlace (opcional)</span>
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          </label>
        )}

        <label className="campo">
          <span>Título{modo === 'archivo' && ' (si se deja vacío, se toma del archivo)'}</span>
          <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </label>

        <label className="campo">
          <span>Autor</span>
          <input type="text" value={autor} onChange={(e) => setAutor(e.target.value)} />
        </label>

        {modo === 'referencia' && (
          <>
            <label className="campo">
              <span>Editorial</span>
              <input type="text" value={editorial} onChange={(e) => setEditorial(e.target.value)} />
            </label>
            <div className="rejilla c2" style={{ gap: 12 }}>
              <label className="campo">
                <span>Año</span>
                <input type="number" value={anio} onChange={(e) => setAnio(e.target.value)} />
              </label>
              <label className="campo">
                <span>ISBN</span>
                <input type="text" value={isbn} onChange={(e) => setIsbn(e.target.value)} />
              </label>
            </div>
          </>
        )}
      </div>

      <label className="fila mini" style={{ gap: 8, marginTop: 14, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={principal}
          onChange={(e) => setPrincipal(e.target.checked)}
          style={{ width: 'auto' }}
        />
        Marcar como uno de los principales de la materia
      </label>

      {error && (
        <p className="mini" style={{ color: 'var(--alerta)', marginBottom: 0 }}>
          {error}
        </p>
      )}

      <div className="fila" style={{ gap: 8, marginTop: 14 }}>
        <button
          className="boton"
          disabled={trabajando}
          onClick={modo === 'archivo' ? enviarArchivo : enviarReferencia}
        >
          {trabajando ? 'Guardando…' : modo === 'archivo' ? 'Subir a la carpeta' : 'Agregar'}
        </button>
        {modo === 'archivo' && (
          <span className="mini silencio">
            Se copia a <code className="dato">&lt;materia&gt;\Libros\</code> en OneDrive.
          </span>
        )}
      </div>
    </div>
  );
}
