import Link from 'next/link';
import { obtenerSeguro } from '@/lib/api';
import { DIAS } from '@/lib/formato';
import { SinApi } from '@/components/SinApi';

export const dynamic = 'force-dynamic';

export default async function Pagina() {
  const rejilla = await obtenerSeguro<Record<string, any[]>>('/calendario/horario');
  if (!rejilla) return <SinApi />;

  const dias = [0, 1, 2, 3, 4];
  const maximo = Math.max(...dias.map((d) => rejilla[d]?.length ?? 0), 0);

  return (
    <>
      <header className="cabecera-pagina">
        <div className="eyebrow">Semana tipo</div>
        <h1>Horario</h1>
        <p className="sub">
          {dias.reduce((n, d) => n + (rejilla[d]?.length ?? 0), 0)} clases por semana
        </p>
      </header>

      <div className="tarjeta" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="datos" style={{ minWidth: 900 }}>
          <thead>
            <tr>
              {dias.map((d) => (
                <th key={d} style={{ width: '20%' }}>
                  {DIAS[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maximo }).map((_, fila) => (
              <tr key={fila}>
                {dias.map((d) => {
                  const c = rejilla[d]?.[fila];
                  if (!c) return <td key={d} />;
                  return (
                    <td key={d} style={{ borderLeft: `3px solid ${c.color}` }}>
                      <Link href={`/materias/${c.codigo}`} style={{ color: 'var(--tinta)' }}>
                        <strong className="mini">{c.nombre}</strong>
                      </Link>
                      <div className="mini dato silencio" style={{ marginTop: 2 }}>
                        {c.horaInicio}–{c.horaFin}
                      </div>
                      <div className="mini silencio">{c.aula ?? c.clave}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
