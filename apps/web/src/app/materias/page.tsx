import Link from 'next/link';
import { obtenerSeguro } from '@/lib/api';
import { DIAS } from '@/lib/formato';
import { SinApi } from '@/components/SinApi';

export const dynamic = 'force-dynamic';

export default async function Pagina() {
  const materias = await obtenerSeguro<any[]>('/materias');
  if (!materias) return <SinApi />;
  const avance = (await obtenerSeguro<any[]>('/dashboard/avance')) ?? [];
  const porCodigo = new Map(avance.map((a) => [a.codigo, a]));

  return (
    <>
      <header className="cabecera-pagina">
        <div className="eyebrow">{materias.length} materias</div>
        <h1>Materias del semestre</h1>
      </header>

      <div className="rejilla c2">
        {materias.map((m) => {
          const a = porCodigo.get(m.codigo);
          return (
            <Link key={m.id} href={`/materias/${m.codigo}`} className="tarjeta">
              <div className="fila entre" style={{ marginBottom: 10 }}>
                <span className="fila">
                  <span className="punto-materia" style={{ background: m.color }} />
                  <span className="dato mini silencio">{m.clave}</span>
                </span>
                {m.esLaboratorio && <span className="insignia gris">laboratorio</span>}
              </div>

              <h3 style={{ color: 'var(--tinta)', marginBottom: 4 }}>{m.nombre}</h3>
              <p className="mini silencio" style={{ margin: '0 0 12px' }}>
                {m.profesor ?? 'Profesor por confirmar'}
              </p>

              <div className="mini dato silencio" style={{ marginBottom: 12 }}>
                {m.horarios
                  .map((h: any) => `${DIAS[h.diaSemana]} ${h.horaInicio}`)
                  .join(' · ')}
              </div>

              {a && (
                <>
                  <div className="avance">
                    <span style={{ width: `${a.porcentaje}%` }} />
                  </div>
                  <div className="fila entre mini silencio" style={{ marginTop: 6 }}>
                    <span className="dato">
                      {a.conNotas}/{a.total} sesiones con notas
                    </span>
                    <span className="dato">{a.porcentaje}%</span>
                  </div>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </>
  );
}
