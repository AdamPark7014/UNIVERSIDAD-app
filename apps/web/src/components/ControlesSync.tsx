'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { enviar } from '@/lib/api';

export function ControlesSync({ pendientes }: { pendientes: number }) {
  const router = useRouter();
  const [trabajando, setTrabajando] = useState<string | null>(null);
  const [salida, setSalida] = useState<string | null>(null);

  const correr = async (etiqueta: string, ruta: string) => {
    setTrabajando(etiqueta);
    setSalida(null);
    try {
      const r = await enviar<any>(ruta);
      setSalida(
        ruta.includes('escribir')
          ? `Escritos ${r.escritos} documentos.` +
              (r.errores?.length ? ` Errores: ${r.errores.length}` : '')
          : `Leídos ${r.leidos} · nuevos ${r.creados} · actualizados ${r.actualizados} · ` +
              `sin cambios ${r.sinCambios} · tareas nuevas ${r.tareasImportadas}` +
              (r.errores?.length ? ` · errores ${r.errores.length}` : ''),
      );
      router.refresh();
    } catch (e: any) {
      setSalida(`Error: ${e.message}`);
    } finally {
      setTrabajando(null);
    }
  };

  return (
    <div className="tarjeta">
      <div className="rejilla c2" style={{ alignItems: 'start' }}>
        <div>
          <h3 style={{ marginBottom: 6 }}>Importar del disco</h3>
          <p className="mini silencio" style={{ marginTop: 0 }}>
            Lee los .docx y actualiza la base. Solo reprocesa los archivos cuyo contenido
            cambió, así que es barato correrlo seguido.
          </p>
          <div className="fila" style={{ gap: 6 }}>
            <button
              className="boton"
              disabled={Boolean(trabajando)}
              onClick={() => correr('importar', '/sync/importar')}
            >
              {trabajando === 'importar' ? 'Importando…' : 'Importar cambios'}
            </button>
            <button
              className="boton secundario"
              disabled={Boolean(trabajando)}
              onClick={() => correr('forzar', '/sync/importar?forzar=1')}
            >
              {trabajando === 'forzar' ? 'Releyendo…' : 'Releer todo'}
            </button>
          </div>
        </div>

        <div>
          <h3 style={{ marginBottom: 6 }}>Escribir al disco</h3>
          <p className="mini silencio" style={{ marginTop: 0 }}>
            Vuelca a los .docx los documentos editados aquí. Deja un respaldo{' '}
            <code className="dato">.bak</code> junto a cada archivo.
          </p>
          <button
            className="boton"
            disabled={Boolean(trabajando) || pendientes === 0}
            onClick={() => correr('escribir', '/sync/escribir')}
          >
            {trabajando === 'escribir'
              ? 'Escribiendo…'
              : `Escribir ${pendientes} pendientes`}
          </button>
        </div>
      </div>

      {salida && (
        <p className="mini dato" style={{ marginBottom: 0, marginTop: 16 }}>
          {salida}
        </p>
      )}
    </div>
  );
}
