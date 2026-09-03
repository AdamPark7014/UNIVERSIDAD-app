import Link from 'next/link';
import { obtenerSeguro, API } from '@/lib/api';
import { fechaCorta, ETIQUETA_ESTADO_TAREA } from '@/lib/formato';
import { SinApi } from '@/components/SinApi';

export const dynamic = 'force-dynamic';

export default async function Pagina({
  searchParams,
}: {
  searchParams: { estado?: string; materia?: string };
}) {
  const qs = new URLSearchParams();
  if (searchParams.estado) qs.set('estado', searchParams.estado);
  if (searchParams.materia) qs.set('materia', searchParams.materia);

  const tareas = await obtenerSeguro<any[]>(`/tareas?${qs.toString()}`);
  if (!tareas) return <SinApi />;
  const resumen = (await obtenerSeguro<Record<string, number>>('/tareas/resumen')) ?? {};

  const filtros = [
    ['', 'Todas'],
    ['ABIERTA', 'Abiertas'],
    ['EN_PROGRESO', 'En progreso'],
    ['HECHA', 'Hechas'],
    ['DESCARTADA', 'Descartadas'],
  ];

  return (
    <>
      <header className="cabecera-pagina">
        <div className="eyebrow">Lo que se me ocurre en clase</div>
        <h1>Tareas propias</h1>
        <p className="sub">
          Se extraen solas del bloque TAREA PROPIA de cada documento de notas al importar.
        </p>
      </header>

      <div className="fila" style={{ gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {filtros.map(([valor, etq]) => {
          const activo = (searchParams.estado ?? '') === valor;
          const href = valor ? `/tareas?estado=${valor}` : '/tareas';
          return (
            <Link key={etq} href={href} className={`boton chico${activo ? '' : ' secundario'}`}>
              {etq}
              {valor && resumen[valor] !== undefined && (
                <span style={{ opacity: 0.7 }}>· {resumen[valor]}</span>
              )}
            </Link>
          );
        })}
        <a
          className="boton chico secundario"
          style={{ marginLeft: 'auto' }}
          href={`${API}/api/exportar/tareas`}
        >
          Exportar pendientes
        </a>
      </div>

      {tareas.length === 0 ? (
        <div className="vacio">No hay tareas con este filtro.</div>
      ) : (
        <div className="tarjeta" style={{ padding: 0 }}>
          <table className="datos">
            <thead>
              <tr>
                <th style={{ width: 150 }}>Materia</th>
                <th>Idea</th>
                <th style={{ width: 110 }}>De la clase</th>
                <th style={{ width: 110 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {tareas.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span className="fila">
                      <span
                        className="punto-materia"
                        style={{ background: t.sesion.materia.color }}
                      />
                      <span className="mini">{t.sesion.materia.clave}</span>
                    </span>
                  </td>
                  <td>
                    <div
                      style={{
                        textDecoration: t.estado === 'HECHA' ? 'line-through' : 'none',
                        opacity: t.estado === 'DESCARTADA' ? 0.55 : 1,
                      }}
                    >
                      {t.texto}
                    </div>
                    {t.resultado && (
                      <div className="mini silencio" style={{ marginTop: 4 }}>
                        {t.resultado}
                      </div>
                    )}
                  </td>
                  <td className="mini dato">
                    <Link href={`/sesiones/${t.sesion.id}`}>{fechaCorta(t.sesion.fecha)}</Link>
                  </td>
                  <td>
                    <span
                      className={`insignia${
                        t.estado === 'HECHA' ? '' : t.estado === 'DESCARTADA' ? ' gris' : ' aviso'
                      }`}
                    >
                      {ETIQUETA_ESTADO_TAREA[t.estado]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
