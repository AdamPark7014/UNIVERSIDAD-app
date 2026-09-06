'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { enviar } from '@/lib/api';

/** Botón para regenerar guías MEGA desde Exámenes. */
export function BotonRegenerarGuias({ proximos = 21 }: { proximos?: number }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="fila" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <button
        type="button"
        className="boton chico"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setMsg(null);
          try {
            const r = await enviar<{ generadas: number; total: number }>(
              '/automatizacion/generar-guias',
              { metodo: 'POST', cuerpo: { proximos } },
            );
            setMsg(`${r.generadas}/${r.total} guías listas`);
            router.refresh();
          } catch (e: any) {
            setMsg(e?.message ?? 'Error');
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? 'Generando…' : `Regenerar guías (≤${proximos}d)`}
      </button>
      {msg && <span className="mini silencio">{msg}</span>}
    </div>
  );
}
