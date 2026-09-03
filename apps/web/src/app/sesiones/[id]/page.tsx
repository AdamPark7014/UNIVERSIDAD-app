import Link from 'next/link';
import { obtenerSeguro } from '@/lib/api';
import { fechaLarga, cuandoTexto, ETIQUETA_EVAL } from '@/lib/formato';
import { SinApi } from '@/components/SinApi';
import { PanelDocumentos } from '@/components/PanelDocumentos';
import { ListaTareas } from '@/components/ListaTareas';

export const dynamic = 'force-dynamic';

export default async function Pagina({ params }: { params: { id: string } }) {
  const s = await obtenerSeguro<any>(`/sesiones/${params.id}`);
  if (!s) return <SinApi />;

  const guia = s.documentos.find((d: any) => d.tipo === 'GUIA');
  const notas = s.documentos.find((d: any) => d.tipo === 'NOTAS');

  return (
    <>
      <header className="cabecera-pagina">
        <div className="fila entre">
          <div className="eyebrow">
            <Link href={`/materias/${s.materia.codigo}`}>{s.materia.nombre}</Link>
            <span style={{ opacity: 0.5 }}>·</span>
            Sesión {s.numero} · Semana {s.semana}
          </div>
          <div className="fila">
            {s.anterior && (
              <Link href={`/sesiones/${s.anterior.id}`} className="boton secundario chico">
                ← Anterior
              </Link>
            )}
            {s.siguiente && (
              <Link href={`/sesiones/${s.siguiente.id}`} className="boton secundario chico">
                Siguiente →
              </Link>
            )}
          </div>
        </div>
        <h1 style={{ marginTop: 10 }}>{s.tema}</h1>
        <p className="sub dato">
          {fechaLarga(s.fecha)} · {s.horaInicio}–{s.horaFin} · {cuandoTexto(s.fecha)}
        </p>
      </header>

      {s.evaluaciones.length > 0 && (
        <div className="tarjeta hueso" style={{ marginBottom: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Este día</div>
          {s.evaluaciones.map((e: any) => (
            <div key={e.id} className="fila" style={{ gap: 8 }}>
              <span className="insignia">{ETIQUETA_EVAL[e.tipo] ?? e.tipo}</span>
              <strong>{e.titulo}</strong>
              {e.peso && <span className="mini silencio dato">{Number(e.peso)}%</span>}
            </div>
          ))}
        </div>
      )}

      <PanelDocumentos guia={guia ?? null} notas={notas ?? null} sesionId={s.id} />

      <section style={{ marginTop: 32 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Tareas propias de esta sesión</div>
        <ListaTareas sesionId={s.id} iniciales={s.tareas} />
      </section>
    </>
  );
}
