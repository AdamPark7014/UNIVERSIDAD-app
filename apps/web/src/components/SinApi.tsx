import { API } from '@/lib/api';

export function SinApi() {
  return (
    <>
      <header className="cabecera-pagina">
        <div className="eyebrow">Sin conexión</div>
        <h1>La API no responde</h1>
      </header>
      <div className="tarjeta hueso">
        <p style={{ marginTop: 0 }}>
          No se pudo hablar con <code className="dato">{API}/api</code>. Revisa que estén
          arriba la base y la API:
        </p>
        <pre
          style={{
            background: 'var(--tinta)',
            color: 'var(--papel)',
            padding: 16,
            borderRadius: 8,
            overflowX: 'auto',
            fontSize: 13,
          }}
        >
{`cd C:\\dev\\apps\\UNIVERSIDAD-app
pnpm up            # levanta Postgres en Docker
pnpm prisma:migrate
pnpm db:seed
pnpm dev:api`}
        </pre>
        <p className="mini silencio" style={{ marginBottom: 0 }}>
          Si la base ya está cargada, basta con <code className="dato">pnpm dev:api</code>.
        </p>
      </div>
    </>
  );
}
