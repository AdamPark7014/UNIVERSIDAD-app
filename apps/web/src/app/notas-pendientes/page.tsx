import Link from 'next/link';
import { obtenerSeguro } from '@/lib/api';
import { fechaLarga, cuandoTexto } from '@/lib/formato';
import { SinApi } from '@/components/SinApi';
import { Icono } from '@/components/Icono';
import { GenerarNotasPendientes } from '@/components/GenerarNotasPendientes';

export const dynamic = 'force-dynamic';

export default async function Pagina({
  searchParams,
}: {
  searchParams: { umbral?: string; materia?: string };
}) {
  const qs = new URLSearchParams();
  if (searchParams.umbral) qs.set('umbral', searchParams.umbral);
  if (searchParams.materia) qs.set('materia', searchParams.materia);

  const d = await obtenerSeguro<any>(`/alertas/notas?${qs}`);
  if (!d) return <SinApi />;

  const umbrales = [30, 50, 80, 120];

  return (
    <>
      <header className="cabecera-pagina">
        <div className="eyebrow">Umbral: {d.umbral} palabras</div>
        <h1>Notas pendientes</h1>
        <p className="sub">
          Clases que ya se dieron y cuyas notas no llegan al umbral. Las de días futuros
          no cuentan: todavía no toca escribirlas.
        </p>
      </header>

      <section className="rejilla c4" style={{ marginBottom: 28 }}>
        <div className="tarjeta metrica">
          <div className="valor">{d.cursadas}</div>
          <div className="etiqueta">Clases ya dadas</div>
        </div>
        <div className={`tarjeta metrica${d.vacias ? ' hueso' : ''}`}>
          <div className="valor" style={d.vacias ? { color: 'var(--alerta)' } : undefined}>
            {d.vacias}
          </div>
          <div className="etiqueta">Sin una sola nota</div>
        </div>
        <div className={`tarjeta metrica${d.cortas ? ' hueso' : ''}`}>
          <div className="valor" style={d.cortas ? { color: 'var(--aviso)' } : undefined}>
            {d.cortas}
          </div>
          <div className="etiqueta">Menos de {d.umbral} palabras</div>
        </div>
        <div className="tarjeta metrica">
          <div className="valor">{d.porcentajeAlDia}%</div>
          <div className="etiqueta">Al día</div>
        </div>
      </section>

      <GenerarNotasPendientes
        total={d.sesiones.length}
        materia={searchParams.materia}
        umbral={d.umbral}
      />

      <div className="fila entre" style={{ marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div className="fila" style={{ gap: 6, flexWrap: 'wrap' }}>
          <span className="mini silencio" style={{ marginRight: 4 }}>Umbral:</span>
          {umbrales.map((u) => (
            <Link
              key={u}
              href={`/notas-pendientes?umbral=${u}${searchParams.materia ? `&materia=${searchParams.materia}` : ''}`}
              className={`boton chico${d.umbral === u ? '' : ' secundario'}`}
            >
              {u}
            </Link>
          ))}
        </div>

        {d.porMateria.length > 0 && (
          <div className="fila" style={{ gap: 6, flexWrap: 'wrap' }}>
            {searchParams.materia && (
              <Link href={`/notas-pendientes?umbral=${d.umbral}`} className="boton chico">
                Todas ×
              </Link>
            )}
            {d.porMateria.map((m: any) => (
              <Link
                key={m.codigo}
                href={`/notas-pendientes?umbral=${d.umbral}&materia=${m.codigo}`}
                className={`boton chico${searchParams.materia === m.codigo ? '' : ' secundario'}`}
                title={m.nombre}
              >
                <span className="punto-materia" style={{ background: m.color }} />
                {m.clave} · {m.total}
              </Link>
            ))}
          </div>
        )}
      </div>

      {d.sesiones.length === 0 ? (
        <div className="tarjeta" style={{ borderColor: 'var(--pino)' }}>
          <div className="fila" style={{ gap: 10 }}>
            <Icono nombre="check" tamano={22} />
            <div>
              <strong>Todo al día.</strong>
              <div className="mini silencio">
                Las {d.cursadas} clases que ya se dieron tienen al menos {d.umbral} palabras
                de apuntes.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="pila" style={{ gap: 8 }}>
          {d.sesiones.map((s: any) => (
            <Link
              key={s.id}
              href={`/sesiones/${s.id}`}
              className="tarjeta pendiente"
              style={{ borderLeftColor: s.materia.color }}
            >
              <div className="fila entre" style={{ gap: 12, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="fila" style={{ gap: 8, marginBottom: 4 }}>
                    <span className="punto-materia" style={{ background: s.materia.color }} />
                    <span className="mini silencio">
                      {s.materia.clave} · sesión {s.numero}
                    </span>
                    {s.evaluaciones?.length > 0 && (
                      <span className="sello deuda">ese día hubo entrega</span>
                    )}
                  </div>
                  <div style={{ fontWeight: 500 }}>{s.tema}</div>
                  <div className="mini silencio dato" style={{ marginTop: 3 }}>
                    {fechaLarga(s.fecha)} · {cuandoTexto(s.fecha)} · {s.horaInicio}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flex: 'none' }}>
                  <div
                    className="dato"
                    style={{
                      fontSize: 22,
                      color: s.estadoNotas === 'vacia' ? 'var(--alerta)' : 'var(--aviso)',
                    }}
                  >
                    {s.palabrasEscritas}
                  </div>
                  <div className="mini silencio">
                    {s.estadoNotas === 'vacia'
                      ? 'sin nada escrito'
                      : `faltan ${s.faltan} palabras`}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
