import Link from 'next/link';
import { API } from '@/lib/api';
import { Icono } from './Icono';

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
}

const ETIQ_TIPO: Record<string, string> = {
  PARCIAL: 'Parcial',
  FINAL: 'Final',
  QUIZ: 'Quiz',
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
        {lista.map((g) => (
          <a
            key={`${g.materiaCodigo}-${g.archivo}`}
            className="tarjeta-guia-examen"
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
        ))}
      </div>
    </section>
  );
}
