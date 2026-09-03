'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { enviar, urlArchivo } from '@/lib/api';
import {
  AYUDA_SINTAXIS,
  Bloque,
  bloquesATexto,
  contarContenido,
  separarCabecera,
  textoABloques,
} from '@/lib/texto';
import { HojaDocumento } from './HojaDocumento';
import { EditorBloques } from './EditorBloques';
import { EditorWord } from './EditorWord';
import { Icono } from './Icono';
import { SelloOrigen } from './SelloOrigen';

interface Doc {
  id: string;
  tipo: 'GUIA' | 'NOTAS';
  archivo: string;
  palabras: number;
  palabrasContenido: number;
  pendienteDeEscribir: boolean;
  origen?: string;
  bloques: { orden: number; tipo: string; texto: string }[];
}

type Vista = 'dividido' | 'notas' | 'guia';

export function PanelDocumentos({
  guia,
  notas,
  sesionId,
}: {
  guia: Doc | null;
  notas: Doc | null;
  sesionId: string;
}) {
  // Si hay guía y notas, lo natural es leer una mientras se escribe la otra.
  const [vista, setVista] = useState<Vista>(guia && notas ? 'dividido' : notas ? 'notas' : 'guia');

  const bloquesGuia: Bloque[] = useMemo(
    () => guia?.bloques.map((b) => ({ tipo: b.tipo, texto: b.texto })) ?? [],
    [guia],
  );

  if (!guia && !notas) {
    return (
      <div className="vacio">
        Esta sesión no tiene documentos en la base. Importa desde{' '}
        <a href="/sync">Sincronización</a>.
      </div>
    );
  }

  if (!notas && guia) {
    return (
      <section>
        <PanelSoloLectura doc={guia} bloques={bloquesGuia} />
        <CrearNotas sesionId={sesionId} />
      </section>
    );
  }

  return (
    <section>
      <div className="fila entre barra-vistas">
        <div className="grupo-botones">
          {guia && notas && (
            <button
              className={vista === 'dividido' ? 'activo' : ''}
              onClick={() => setVista('dividido')}
            >
              Guía + notas
            </button>
          )}
          {notas && (
            <button className={vista === 'notas' ? 'activo' : ''} onClick={() => setVista('notas')}>
              Solo mis notas
            </button>
          )}
          {guia && (
            <button className={vista === 'guia' ? 'activo' : ''} onClick={() => setVista('guia')}>
              Solo la guía
            </button>
          )}
        </div>
      </div>

      {vista === 'guia' && guia && <PanelSoloLectura doc={guia} bloques={bloquesGuia} />}

      {vista === 'notas' && notas && <EditorNotas doc={notas} />}

      {vista === 'dividido' && guia && notas && (
        <div className="dividido">
          <div className="panel-lectura">
            <div className="cabecera-panel">
              <Icono nombre="guia" tamano={15} />
              <span>Guía del maestro</span>
              <a className="mini" href={urlArchivo(guia.id)}>.docx</a>
            </div>
            <div className="cuerpo-panel">
              <HojaDocumento bloques={bloquesGuia} compacta />
            </div>
          </div>
          <div className="panel-escritura">
            <EditorNotas doc={notas} compacto />
          </div>
        </div>
      )}
    </section>
  );
}

function PanelSoloLectura({ doc, bloques }: { doc: Doc; bloques: Bloque[] }) {
  return (
    <>
      <div className="fila entre" style={{ marginBottom: 12 }}>
        <span className="dato mini silencio">{doc.archivo}</span>
        <a className="boton secundario chico" href={urlArchivo(doc.id)}>
          <Icono nombre="descargar" tamano={14} /> Abrir .docx
        </a>
      </div>
      <HojaDocumento bloques={bloques} />
    </>
  );
}

// ---------------------------------------------------------------- editor

function EditorNotas({ doc, compacto = false }: { doc: Doc; compacto?: boolean }) {
  const iniciales: Bloque[] = useMemo(
    () => doc.bloques.map((b) => ({ tipo: b.tipo, texto: b.texto })),
    [doc],
  );
  const { cabecera } = useMemo(() => separarCabecera(iniciales), [iniciales]);

  const [modo, setModo] = useState<'word' | 'escribir' | 'bloques' | 'vista'>('word');
  const [texto, setTexto] = useState(() => bloquesATexto(separarCabecera(iniciales).cuerpo));
  const [bloquesCuerpo, setBloquesCuerpo] = useState<Bloque[]>(
    () => separarCabecera(iniciales).cuerpo,
  );
  const [sucio, setSucio] = useState(false);
  const [estado, setEstado] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [ayuda, setAyuda] = useState(false);

  // El texto plano y los bloques son dos vistas de lo mismo: al cambiar de modo
  // se convierte, para que nunca se editen las dos por separado.
  const cambiarModo = (nuevo: 'word' | 'escribir' | 'bloques' | 'vista') => {
    if ((modo === 'escribir' || modo === 'word') && nuevo !== 'escribir' && nuevo !== 'word') {
      setBloquesCuerpo(textoABloques(texto));
    }
    if (modo === 'bloques' && nuevo === 'escribir' || modo === 'bloques' && nuevo === 'word') {
      setTexto(bloquesATexto(bloquesCuerpo));
    }
    setModo(nuevo);
  };

  const cuerpoActual = () =>
    modo === 'escribir' || modo === 'word' ? textoABloques(texto) : bloquesCuerpo;
  const palabras = useMemo(
    () => contarContenido(cuerpoActual()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [texto, bloquesCuerpo, modo],
  );

  const recargar = async () => {
    if (sucio && !confirm('Hay cambios sin guardar. ¿Descartar y recargar desde Word?')) return;
    setTrabajando(true);
    setEstado(null);
    try {
      await enviar(`/documentos/${doc.id}/recargar`, { metodo: 'POST' });
      window.location.reload();
    } catch (e: any) {
      setEstado(`Error: ${e.message}`);
    } finally {
      setTrabajando(false);
    }
  };

  const vaciar = async () => {
    if (!confirm('¿Vaciar el contenido y dejar la plantilla en blanco? Se guardará en Word.')) return;
    setTrabajando(true);
    try {
      await enviar(`/documentos/${doc.id}/vaciar`, { metodo: 'POST' });
      window.location.reload();
    } catch (e: any) {
      setEstado(`Error: ${e.message}`);
    } finally {
      setTrabajando(false);
    }
  };

  const eliminar = async () => {
    if (
      !confirm(
        '¿Eliminar este documento de notas? Se borra el .docx y el registro. Puedes crear uno nuevo después.',
      )
    ) {
      return;
    }
    setTrabajando(true);
    try {
      await enviar(`/documentos/${doc.id}`, { metodo: 'DELETE' });
      window.location.reload();
    } catch (e: any) {
      setEstado(`Error: ${e.message}`);
    } finally {
      setTrabajando(false);
    }
  };

  const guardar = useCallback(
    async (escribirDisco: boolean) => {
      setTrabajando(true);
      setEstado(null);
      try {
        const bloques = [...cabecera, ...cuerpoActual()];
        await enviar(`/documentos/${doc.id}/bloques`, { metodo: 'PUT', cuerpo: { bloques } });
        if (escribirDisco) {
          await enviar(`/documentos/${doc.id}/guardar`);
          setEstado('Listo: guardado en Word (.docx)');
        } else {
          setEstado('Guardado en la app — falta escribir al .docx');
        }
        setSucio(false);
      } catch (e: any) {
        setEstado(`Error: ${e.message}`);
      } finally {
        setTrabajando(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [doc.id, texto, bloquesCuerpo, modo, cabecera],
  );

  // Ctrl+S guarda y escribe, como en Word.
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (sucio) void guardar(true);
      }
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [sucio, guardar]);

  return (
    <div className="editor-notas">
      <div className="cabecera-panel">
        <Icono nombre="nota" tamano={15} />
        <span>Mis notas</span>
        <SelloOrigen origen={doc.origen} />
        <span className="dato mini silencio">{palabras} palabras</span>
        {sucio && <span className="sello deuda">sin guardar</span>}
        {!sucio && doc.pendienteDeEscribir && (
          <span className="sello deuda">falta el .docx</span>
        )}
        <span style={{ flex: 1 }} />
        <div className="grupo-botones chico">
          <button
            className={modo === 'word' ? 'activo' : ''}
            onClick={() => cambiarModo('word')}
          >
            Word
          </button>
          <button
            className={modo === 'escribir' ? 'activo' : ''}
            onClick={() => cambiarModo('escribir')}
          >
            Texto
          </button>
          <button
            className={modo === 'vista' ? 'activo' : ''}
            onClick={() => cambiarModo('vista')}
          >
            Vista
          </button>
          <button
            className={modo === 'bloques' ? 'activo' : ''}
            onClick={() => cambiarModo('bloques')}
          >
            Bloques
          </button>
        </div>
      </div>

      <div className="cuerpo-panel">
        {modo === 'word' && (
          <EditorWord
            value={texto}
            compacta={compacto}
            placeholder="Escribe tus apuntes como en Word…"
            onChange={(t) => {
              setTexto(t);
              setSucio(true);
            }}
          />
        )}

        {modo === 'escribir' && (
          <>
            <textarea
              className="area-notas"
              value={texto}
              autoFocus={!compacto}
              placeholder={
                'Escribe aquí lo de la clase.\n\n' +
                '# Un encabezado\n- una viñeta\n---  (línea separadora)'
              }
              onChange={(e) => {
                setTexto(e.target.value);
                setSucio(true);
              }}
            />
            <button className="enlace-ayuda" onClick={() => setAyuda(!ayuda)}>
              {ayuda ? 'Ocultar' : '¿Cómo doy formato?'}
            </button>
            {ayuda && (
              <ul className="ayuda-sintaxis">
                {AYUDA_SINTAXIS.map(([sintaxis, que]) => (
                  <li key={sintaxis}>
                    <code className="dato">{sintaxis}</code>
                    <span className="silencio">{que}</span>
                  </li>
                ))}
                <li>
                  <code className="dato">Ctrl+S</code>
                  <span className="silencio">guarda y escribe al .docx</span>
                </li>
              </ul>
            )}
          </>
        )}

        {modo === 'vista' && <HojaDocumento bloques={[...cabecera, ...bloquesCuerpo]} compacta />}

        {modo === 'bloques' && (
          <EditorBloques
            bloques={bloquesCuerpo}
            alCambiar={(b) => {
              setBloquesCuerpo(b);
              setSucio(true);
            }}
          />
        )}
      </div>

      <div className="pie-panel">
        <div className="aviso-guardado">
          <strong>Editor embebido</strong>
          <p>
            Edita aquí con aspecto de Word. <span className="dato">Guardar en Word</span> escribe
            el .docx en tu carpeta del semestre. Ctrl+S guarda directo al archivo.
          </p>
        </div>
        <div className="fila acciones-guardado">
          <button
            className="boton chico"
            disabled={trabajando || !sucio}
            onClick={() => guardar(true)}
          >
            {trabajando ? 'Guardando…' : 'Guardar en Word (.docx)'}
          </button>
          <button
            className="boton secundario chico"
            disabled={trabajando || !sucio}
            onClick={() => guardar(false)}
          >
            Solo en la app
          </button>
          <button className="boton secundario chico" disabled={trabajando} onClick={recargar}>
            Recargar desde Word
          </button>
          <button className="boton secundario chico" disabled={trabajando} onClick={vaciar}>
            Vaciar
          </button>
          <button className="boton secundario chico" disabled={trabajando} onClick={eliminar}>
            Eliminar doc
          </button>
          <a className="boton secundario chico" href={urlArchivo(doc.id)}>
            Abrir .docx
          </a>
        </div>
        {estado && (
          <p className="mini silencio estado-guardado" role="status">
            {estado}
          </p>
        )}
      </div>
    </div>
  );
}

function CrearNotas({ sesionId }: { sesionId: string }) {
  const [trabajando, setTrabajando] = useState(false);

  return (
    <div className="tarjeta aviso-suave" style={{ marginTop: 16 }}>
      <p className="mini" style={{ marginBottom: 10 }}>
        No hay documento de notas para esta sesión. Crea uno nuevo en blanco en tu carpeta del
        semestre.
      </p>
      <button
        className="boton chico"
        disabled={trabajando}
        onClick={async () => {
          setTrabajando(true);
          try {
            await enviar(`/notas/crear/${sesionId}`, { metodo: 'POST' });
            window.location.reload();
          } finally {
            setTrabajando(false);
          }
        }}
      >
        {trabajando ? 'Creando…' : 'Crear documento de notas'}
      </button>
    </div>
  );
}
