import Link from 'next/link';
import { obtenerSeguro } from '@/lib/api';
import { SinApi } from '@/components/SinApi';

export const dynamic = 'force-dynamic';

export default async function Pagina() {
  const avance = await obtenerSeguro<any[]>('/dashboard/avance');
  if (!avance) return <SinApi />;
  const panel = await obtenerSeguro<any>('/dashboard');
  const salud = await obtenerSeguro<any>('/salud');

  const totales = avance.reduce(
    (a, m) => ({
      total: a.total + m.total,
      conNotas: a.conNotas + m.conNotas,
      cursadas: a.cursadas + m.cursadas,
    }),
    { total: 0, conNotas: 0, cursadas: 0 },
  );
  const global = totales.total ? Math.round((totales.conNotas / totales.total) * 100) : 0;

  const ordenado = [...avance].sort((a, b) => b.porcentaje - a.porcentaje);
  const flojas = ordenado.filter((m) => m.total > 0 && m.porcentaje < 50);

  return (
    <>
      <header className="cabecera-pagina">
        <div className="eyebrow">Dónde vas al corriente y dónde no</div>
        <h1>Estadísticas</h1>
      </header>

      <section className="rejilla c4" style={{ marginBottom: 32 }}>
        <div className="tarjeta metrica">
          <div className="valor">{global}%</div>
          <div className="etiqueta">Sesiones con notas</div>
        </div>
        <div className="tarjeta metrica">
          <div className="valor">{totales.conNotas}</div>
          <div className="etiqueta">De {totales.total} sesiones</div>
        </div>
        <div className="tarjeta metrica">
          <div className="valor">{salud?.conteos?.bloques ?? '—'}</div>
          <div className="etiqueta">Bloques indexados</div>
        </div>
        <div className="tarjeta metrica">
          <div className="valor">{panel?.totales?.tareasAbiertas ?? 0}</div>
          <div className="etiqueta">Tareas propias abiertas</div>
        </div>
      </section>

      {flojas.length > 0 && (
        <div className="tarjeta hueso" style={{ marginBottom: 32 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Lo que va más atrasado</div>
          <p style={{ marginTop: 0, marginBottom: 12 }}>
            {flojas.length === 1 ? 'Una materia tiene' : `${flojas.length} materias tienen`}{' '}
            menos de la mitad de sus sesiones con notas escritas.
          </p>
          <div className="fila" style={{ gap: 8, flexWrap: 'wrap' }}>
            {flojas.map((m) => (
              <Link key={m.codigo} href={`/materias/${m.codigo}`} className="boton chico secundario">
                <span className="punto-materia" style={{ background: m.color }} />
                {m.clave} · {m.porcentaje}%
              </Link>
            ))}
          </div>
        </div>
      )}

      <section>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Avance por materia</div>
        <div className="tarjeta" style={{ padding: 0 }}>
          <table className="datos">
            <thead>
              <tr>
                <th style={{ width: 220 }}>Materia</th>
                <th>Avance de notas</th>
                <th style={{ width: 110 }}>Con notas</th>
                <th style={{ width: 100 }}>Cursadas</th>
                <th style={{ width: 70 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {ordenado.map((m) => (
                <tr key={m.codigo}>
                  <td>
                    <Link href={`/materias/${m.codigo}`} className="fila">
                      <span className="punto-materia" style={{ background: m.color }} />
                      <span style={{ color: 'var(--tinta)' }}>{m.nombre}</span>
                    </Link>
                  </td>
                  <td>
                    <div className="fila" style={{ gap: 10 }}>
                      <div className="avance" style={{ flex: 1, minWidth: 100 }}>
                        <span
                          style={{ width: `${m.porcentaje}%`, background: m.color }}
                        />
                      </div>
                      <span className="dato mini" style={{ width: 38, textAlign: 'right' }}>
                        {m.porcentaje}%
                      </span>
                    </div>
                  </td>
                  <td className="dato">{m.conNotas}</td>
                  <td className="dato silencio">{m.cursadas}</td>
                  <td className="dato silencio">{m.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {salud && (
        <section style={{ marginTop: 32 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Estado del sistema</div>
          <div className={`tarjeta${salud.estado === 'ok' ? '' : ' hueso'}`}>
            <div className="fila entre" style={{ marginBottom: 12 }}>
              <span className="fila">
                <span className={`insignia${salud.estado === 'ok' ? '' : ' aviso'}`}>
                  {salud.estado}
                </span>
                <span className="mini silencio">
                  Vigilante de disco {salud.vigilanteActivo ? 'activo' : 'apagado'}
                </span>
              </span>
              <span className="mini dato silencio">
                {salud.conteos.materias} materias · {salud.conteos.sesiones} sesiones ·{' '}
                {salud.conteos.documentos} documentos
              </span>
            </div>
            <code className="dato mini silencio">{salud.carpetaDocumentos.ruta}</code>
            {salud.problemas.length > 0 && (
              <ul style={{ marginBottom: 0, marginTop: 12, paddingLeft: 20 }}>
                {salud.problemas.map((p: string) => (
                  <li key={p} className="mini">{p}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </>
  );
}
