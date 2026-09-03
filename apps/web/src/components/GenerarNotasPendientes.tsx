'use client';

import { useState } from 'react';
import { enviar } from '@/lib/api';
import { Icono } from './Icono';

export function GenerarNotasPendientes({
  total,
  materia,
  umbral,
}: {
  total: number;
  materia?: string;
  umbral: number;
}) {
  const [trabajando, setTrabajando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  async function generar(escribirDisco: boolean) {
    setTrabajando(true);
    setResultado(null);
    try {
      const r = await enviar<{
        generados: number;
        omitidos: number;
        errores: string[];
      }>('/notas/generar-pendientes', {
        metodo: 'POST',
        cuerpo: {
          materia: materia || undefined,
          escribirDisco,
          limite: 500,
        },
      });
      setResultado(
        `Listo: ${r.generados} apuntes generados, ${r.omitidos} omitidos` +
          (r.errores.length ? ` · ${r.errores.length} errores` : '') +
          (escribirDisco ? ' · guardados en Word' : ''),
      );
      if (r.generados > 0) {
        window.location.reload();
      }
    } catch (e: any) {
      setResultado(`Error: ${e.message}`);
    } finally {
      setTrabajando(false);
    }
  }

  if (total === 0) return null;

  return (
    <div className="tarjeta aviso-suave" style={{ marginBottom: 24 }}>
      <div className="fila" style={{ gap: 10, marginBottom: 10 }}>
        <Icono nombre="nota" tamano={18} />
        <strong>
          {total} sesiones sin apuntes suficientes (&lt; {umbral} palabras)
        </strong>
      </div>
      <p className="mini silencio" style={{ marginBottom: 12 }}>
        Genera apuntes desde la guía del maestro: resumen, temario, conceptos y explicación
        para estudiar. Puedes guardarlos solo en la app o directamente en tus .docx.
      </p>
      <div className="fila acciones-guardado">
        <button className="boton chico" disabled={trabajando} onClick={() => generar(true)}>
          {trabajando ? 'Generando…' : 'Generar y guardar en Word'}
        </button>
        <button
          className="boton secundario chico"
          disabled={trabajando}
          onClick={() => generar(false)}
        >
          Solo en la app
        </button>
      </div>
      {resultado && (
        <p className="mini silencio" style={{ marginTop: 10 }} role="status">
          {resultado}
        </p>
      )}
    </div>
  );
}
