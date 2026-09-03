'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <header className="cabecera-pagina">
        <div className="eyebrow">Algo se rompió</div>
        <h1>No se pudo mostrar esta pantalla</h1>
      </header>
      <div className="tarjeta hueso">
        <p style={{ marginTop: 0 }}>
          El error fue: <code className="dato">{error.message}</code>
        </p>
        <p className="mini silencio">
          Lo más común es que la API se haya caído. Revísala en{' '}
          <a href="http://localhost:4180/api/salud" target="_blank" rel="noreferrer">
            /api/salud
          </a>
          .
        </p>
        <button className="boton" onClick={reset}>
          Reintentar
        </button>
      </div>
    </>
  );
}
