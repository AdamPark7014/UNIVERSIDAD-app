import Link from 'next/link';
import { obtenerSeguro, API } from '@/lib/api';
import { fechaCorta, diaDeSemana, ETIQUETA_EVAL, DIAS } from '@/lib/formato';
import { SinApi } from '@/components/SinApi';
import { SelloNotas } from '@/components/FilaSesion';

export const dynamic = 'force-dynamic';

export default async function Pagina({ params }: { params: { codigo: string } }) {
  const m = await obtenerSeguro<any>(`/materias/${params.codigo}`);
  if (!m) return <SinApi />;

  const conNotas = m.sesiones.filter((s: any) =>
    s.documentos.some((d: any) => d.tipo === 'NOTAS' && d.palabrasContenido > 0),
  ).length;

  return (
    <>
      <header className="cabecera-pagina">
        <div className="eyebrow">
          {m.clave}
          {m.claveOficial ? ` · ${m.claveOficial}` : ''}
        </div>
        <h1 className="fila" style={{ gap: 12 }}>
          <span className="punto-materia" style={{ background: m.color, width: 12, height: 12 }} />
          {m.nombre}
        </h1>
        <p className="sub">
          {m.profesor ?? 'Profesor por confirmar'}
          {m.aula ? ` · ${m.aula}` : ''} ·{' '}
          {m.horarios
            .map((h: any) => `${DIAS[h.diaSemana]} ${h.horaInicio}-${h.horaFin}`)
            .join(' y ')}
        </p>
      </header>

      <div className="tarjeta hueso fila entre" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <strong>Compilar para estudiar</strong>
          <div className="mini silencio">
            Junta todo el material en un solo .docx, con horario, criterios y fechas al inicio.
          </div>
        </div>
        <div className="fila" style={{ gap: 6 }}>
          <a className="boton chico" href={`${API}/api/exportar/materia/${m.codigo}?tipo=GUIA`}>
            Guías
          </a>
          <a
            className="boton chico secundario"
            href={`${API}/api/exportar/materia/${m.codigo}?tipo=NOTAS`}
          >
            Mis notas
          </a>
          <a
            className="boton chico secundario"
            href={`${API}/api/exportar/materia/${m.codigo}?tipo=AMBOS`}
          >
            Todo
          </a>
        </div>
      </div>

      <section className="rejilla c4" style={{ marginBottom: 32 }}>
        <div className="tarjeta metrica">
          <div className="valor">{m.sesiones.length}</div>
          <div className="etiqueta">Sesiones</div>
        </div>
        <div className="tarjeta metrica">
          <div className="valor">{conNotas}</div>
          <div className="etiqueta">Con notas escritas</div>
        </div>
        <div className="tarjeta metrica">
          <div className="valor">{m.evaluaciones.length}</div>
          <div className="etiqueta">Evaluaciones</div>
        </div>
        <div className="tarjeta metrica">
          <div className="valor">{m.libros.length}</div>
          <div className="etiqueta">Libros</div>
        </div>
      </section>

      <div className="rejilla c2" style={{ alignItems: 'start', marginBottom: 32 }}>
        <section className="tarjeta hueso">
          <div className="eyebrow" style={{ marginBottom: 12 }}>Criterios de evaluación</div>
          <table className="datos">
            <tbody>
              {m.criterios.map((c: any) => (
                <tr key={c.id}>
                  <td>
                    {c.concepto}
                    {c.notas && (
                      <div className="mini silencio">{c.notas}</div>
                    )}
                  </td>
                  <td className="dato" style={{ textAlign: 'right', width: 60 }}>
                    {Number(c.porcentaje) > 0 ? `${Number(c.porcentaje)}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="tarjeta">
          <div className="eyebrow" style={{ marginBottom: 12 }}>Evaluaciones</div>
          {m.evaluaciones.length === 0 && <p className="silencio mini">Sin fechas cargadas.</p>}
          <table className="datos">
            <tbody>
              {m.evaluaciones.map((e: any) => (
                <tr key={e.id}>
                  <td className="dato mini" style={{ width: 92 }}>{fechaCorta(e.fecha)}</td>
                  <td>
                    {e.titulo}
                    <div className="mini silencio">{ETIQUETA_EVAL[e.tipo] ?? e.tipo}</div>
                  </td>
                  <td className="dato mini" style={{ textAlign: 'right', width: 50 }}>
                    {e.peso ? `${Number(e.peso)}%` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {m.libros.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Bibliografía</div>
          <div className="tarjeta" style={{ padding: 0 }}>
            <table className="datos">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Autor</th>
                  <th style={{ width: 130 }} />
                </tr>
              </thead>
              <tbody>
                {m.libros.map((l: any) => (
                  <tr key={l.id}>
                    <td>{l.titulo}</td>
                    <td className="silencio mini">
                      {l.autor ?? '—'}
                      {l.editorial ? ` · ${l.editorial}` : ''}
                    </td>
                    <td>
                      {l.esPrincipal && <span className="insignia">principal</span>}{' '}
                      {l.soloReferencia && <span className="insignia gris">referencia</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          Sesiones · {m.sesiones.length}
        </div>
        <div className="tarjeta" style={{ padding: 0 }}>
          <table className="datos">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th style={{ width: 150 }}>Fecha</th>
                <th>Tema</th>
                <th style={{ width: 110 }}>Notas</th>
                <th style={{ width: 60 }}>Tareas</th>
              </tr>
            </thead>
            <tbody>
              {m.sesiones.map((s: any) => {
                return (
                  <tr key={s.id}>
                    <td className="dato silencio">{s.numero}</td>
                    <td className="dato mini">
                      {fechaCorta(s.fecha)}
                      <div className="silencio">{diaDeSemana(s.fecha)}</div>
                    </td>
                    <td>
                      <Link href={`/sesiones/${s.id}`}>{s.tema}</Link>
                    </td>
                    <td>
                      <SelloNotas sesion={s} />
                    </td>
                    <td className="dato silencio">{s._count.tareas || ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
