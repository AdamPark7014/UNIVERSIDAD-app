'use client';

import { useEffect, useState } from 'react';
import { enviar, obtener } from '@/lib/api';

interface EstadoAuto {
  activo: boolean;
  intervaloMs: number;
  zona: string;
  plantillasDias: number;
  ciclos: number;
  corriendo: boolean;
  ultimo: {
    corridoEn: string;
    escritos: number;
    notasGeneradas: number;
    plantillasCreadas: number;
    guiasCercanas: number;
    errores: string[];
    detalle: string[];
  } | null;
}

/**
 * Centro de control del motor automático: ciclo post-clase, plantillas y guías.
 */
export function PanelAutomatizacion() {
  const [estado, setEstado] = useState<EstadoAuto | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const refrescar = async () => {
    try {
      setEstado(await obtener<EstadoAuto>('/automatizacion/estado'));
    } catch {
      setEstado(null);
    }
  };

  useEffect(() => {
    void refrescar();
    const t = setInterval(() => void refrescar(), 30_000);
    return () => clearInterval(t);
  }, []);

  const accion = async (etiqueta: string, ruta: string, cuerpo?: object) => {
    setBusy(etiqueta);
    setMsg(null);
    try {
      const r = await enviar<any>(ruta, { metodo: 'POST', cuerpo });
      if (ruta.includes('ciclo')) {
        setMsg(
          `Ciclo: ${r.escritos} escritos · ${r.notasGeneradas} notas · ${r.plantillasCreadas} plantillas · ${r.guiasCercanas} guías`,
        );
      } else if (ruta.includes('preparar')) {
        setMsg(`Plantillas: +${r.creadas} creadas (${r.omitidas} ya existían)`);
      } else if (ruta.includes('guias')) {
        setMsg(`Guías MEGA: ${r.generadas}/${r.total}`);
      } else if (ruta.includes('notas')) {
        setMsg(`Notas: ${r.generados} generadas de ${r.total}`);
      } else {
        setMsg('Listo');
      }
      await refrescar();
    } catch (e: any) {
      setMsg(e?.message ?? 'Error');
    } finally {
      setBusy(null);
    }
  };

  const ultimo = estado?.ultimo;

  return (
    <section className="panel-auto">
      <div className="fila entre" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="eyebrow">Automatización</div>
          <p className="sub" style={{ marginTop: 6, maxWidth: 520 }}>
            El motor escribe Word, genera notas al acabar la clase, prepara plantillas
            de las próximas {estado?.plantillasDias ?? 14} clases y refresca guías de
            examen cercanas.
          </p>
        </div>
        <span
          className={`chip-resumen${estado?.activo ? '' : ' alerta'}`}
          title={estado?.zona}
        >
          {estado?.activo ? 'Activo' : 'En pausa'}
          {estado ? ` · cada ${Math.round(estado.intervaloMs / 60000)} min` : ''}
        </span>
      </div>

      <div className="fila" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button
          type="button"
          className="boton"
          disabled={Boolean(busy) || estado?.corriendo}
          onClick={() => accion('ciclo', '/automatizacion/ciclo')}
        >
          {busy === 'ciclo' || estado?.corriendo ? 'Corriendo…' : 'Correr ciclo ahora'}
        </button>
        <button
          type="button"
          className="boton secundario"
          disabled={Boolean(busy)}
          onClick={() => accion('plantillas', '/automatizacion/preparar-plantillas')}
        >
          {busy === 'plantillas' ? 'Preparando…' : 'Preparar plantillas'}
        </button>
        <button
          type="button"
          className="boton secundario"
          disabled={Boolean(busy)}
          onClick={() =>
            accion('guias', '/automatizacion/generar-guias', { proximos: 21 })
          }
        >
          {busy === 'guias' ? 'Generando…' : 'Regenerar guías (21 días)'}
        </button>
        <button
          type="button"
          className="boton secundario"
          disabled={Boolean(busy)}
          onClick={() => accion('notas', '/automatizacion/generar-notas')}
        >
          {busy === 'notas' ? 'Generando…' : 'Rellenar notas pendientes'}
        </button>
      </div>

      {msg && <p className="mini" style={{ marginBottom: 8 }}>{msg}</p>}

      {ultimo && (
        <div className="tarjeta hueso mini-auto-log">
          <div className="dato mini silencio">
            Último ciclo · {new Date(ultimo.corridoEn).toLocaleString('es-MX')}
            {estado && estado.ciclos > 0 ? ` · ${estado.ciclos} ciclos` : ''}
          </div>
          <div className="fila" style={{ gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
            <span>Escritos {ultimo.escritos}</span>
            <span>Notas {ultimo.notasGeneradas}</span>
            <span>Plantillas {ultimo.plantillasCreadas}</span>
            <span>Guías {ultimo.guiasCercanas}</span>
          </div>
          {ultimo.errores.length > 0 && (
            <div className="mini" style={{ color: 'var(--alerta)', marginTop: 6 }}>
              {ultimo.errores.slice(0, 3).join(' · ')}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
