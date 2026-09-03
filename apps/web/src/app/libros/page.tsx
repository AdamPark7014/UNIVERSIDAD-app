import { obtenerSeguro } from '@/lib/api';
import { SinApi } from '@/components/SinApi';
import { Biblioteca } from '@/components/Biblioteca';

export const dynamic = 'force-dynamic';

export default async function Pagina({
  searchParams,
}: {
  searchParams: { materia?: string; libro?: string };
}) {
  const [libros, materias] = await Promise.all([
    obtenerSeguro<any[]>('/libros'),
    obtenerSeguro<any[]>('/materias'),
  ]);
  if (!libros || !materias) return <SinApi />;

  const conPdf = libros.filter((l) => l.ruta).length;

  return (
    <>
      <header className="cabecera-pagina">
        <div className="eyebrow">
          {conPdf} PDF · {libros.length - conPdf} referencias
        </div>
        <h1>Biblioteca</h1>
        <p className="sub">
          Los PDF viven en <code className="dato">&lt;materia&gt;\Libros\</code> dentro de
          OneDrive. Aquí se leen sin salir de la app.
        </p>
      </header>

      <Biblioteca
        libros={libros}
        materias={materias}
        materiaInicial={searchParams.materia ?? null}
        libroInicial={searchParams.libro ?? null}
      />
    </>
  );
}
