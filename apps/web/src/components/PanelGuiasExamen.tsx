import Link from 'next/link';
import { API } from '@/lib/api';
import { Icono } from './Icono';
import { cuandoTexto, fechaLarga } from '@/lib/formato';

export interface GuiaExamenItem {
  materiaCodigo: string;
  materiaClave: string;
  materiaNombre: string;
  materiaColor: string;
  archivo: string;
  titulo: string;
  tipo: string;
  tamanoBytes: number;
  url: string;
  fecha?: string | null;
  diasRestantes?: number | null;
  evaluacionTitulo?: string | null;
}

const ETIQ_TIPO: Record<string, string> = {
  PARCIAL: 'Parcial',
  FINAL: 'Final',
  QUIZ: 'Quiz',
  PRACTICA: 'Práctica',
  CLAVE: 'Clave',
  OTRO: 'Guía',
};

/** Lista de guías MEGA de examen (Docs/Guias-estudio). */
export function PanelGuiasExamen({
  guias,
  titulo = 'Guías de examen',
  mostrarMateria = true,
  limite,
}: {
  guias: GuiaExamenItem[];
  titulo?: string;
  mostrarMateria?: boolean;
  limite?: number;
}) {
  const lista = limite ? guias.slice(0, limite) : guias;
  if (!lista.length) {
    return (
      <section className="panel-guias-examen">
        {titulo ? <div className="eyebrow" style={{ marginBottom: 12 }}>{titulo}</div> : null}
        <div className="vacio">
          Aún no hay guías. Usa «Regenerar guías» o el panel de Automatización.
        </div>
      </section>
    );
  }

  return (
    <section className="panel-guias-examen">
      {titulo ? (
        <div className="fila entre" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div className="eyebrow">{titulo}</div>
          <Link href="/examenes#guias-examen" className="mini">
            Ver todas →
          </Link>
        </div>
      ) : null}
      <div className="rejilla-guias">
        {lista.map((g) => {
          const dias = g.diasRestantes;
          const urge = dias != null && dias >= 0 && dias <= 7;
          const pasada = dias != null && dias < 0;
          return (
            <a
              key={`${g.materiaCodigo}-${g.archivo}`}
              className={`tarjeta-guia-examen${urge ? ' guia-urgente' : ''}${pasada ? ' guia-pasada' : ''}`}
              href={`${API}${g.url}`}
              target="_blank"
              rel="noreferrer"
            >
              <span
                className="punto-materia"
                style={{ background: g.materiaColor, width: 10, height: 10 }}
              />
              <span className="tarjeta-guia-cuerpo">
                {mostrarMateria && (
                  <span className="mini silencio" style={{ display: 'block' }}>
                    {g.materiaNombre}
                  </span>
                )}
                <strong>{g.titulo}</strong>
                {g.fecha && (
                  <span
                    className={`dato guia-fecha${urge ? ' urgente' : ''}${pasada ? ' silencio' : ''}`}
                  >
                    {fechaLarga(g.fecha)}
                    <span className="silencio"> · </span>
                    {cuandoTexto(g.fecha)}
                  </span>
                )}
                <span className="fila" style={{ gap: 8, marginTop: 4 }}>
                  <span className="insignia">{ETIQ_TIPO[g.tipo] ?? g.tipo}</span>
                  {g.archivo.toLowerCase().endsWith('.pdf') && (
                    <span className="insignia examen">PDF · papel</span>
                  )}
                  <span className="dato mini silencio">
                    {Math.max(1, Math.round(g.tamanoBytes / 1024))} KB
                  </span>
                </span>
              </span>
              <Icono nombre="descargar" tamano={16} className="silencio" />
            </a>
          );
        })}
      </div>
    </section>
  );
}
