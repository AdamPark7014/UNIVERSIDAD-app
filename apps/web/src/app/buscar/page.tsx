import { Suspense } from 'react';
import { Buscador } from '@/components/Buscador';

export const dynamic = 'force-dynamic';

export default function Pagina({ searchParams }: { searchParams: { q?: string } }) {
  return (
    <>
      <header className="cabecera-pagina">
        <div className="eyebrow">Todo el semestre</div>
        <h1>Buscar</h1>
        <p className="sub">
          Busca por tema en los 496 documentos, o escribe una fecha —«10 de septiembre»,
          «miércoles», «hoy»— para ver qué clases tocan ese día.
        </p>
      </header>
      {/* useSearchParams exige Suspense en el App Router. */}
      <Suspense fallback={<div className="esqueleto" style={{ height: 56 }} />}>
        <Buscador inicial={searchParams.q ?? ''} />
      </Suspense>
    </>
  );
}
