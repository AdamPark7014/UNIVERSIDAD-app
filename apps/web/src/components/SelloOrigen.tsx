'use client';

const ETIQUETAS: Record<string, { texto: string; clase: string; titulo: string }> = {
  GENERADO: {
    texto: 'Sistema',
    clase: 'origen-sistema',
    titulo: 'Estas notas las generó la plataforma a partir de la guía del maestro',
  },
  EDITADO: {
    texto: 'Tú (app)',
    clase: 'origen-usuario',
    titulo: 'Las editaste o guardaste desde la app',
  },
  IMPORTADO: {
    texto: 'Tú (Word)',
    clase: 'origen-word',
    titulo: 'Vienen del archivo Word en tu carpeta del semestre',
  },
};

/** Distingue notas del sistema vs las tuyas. */
export function SelloOrigen({ origen }: { origen?: string | null }) {
  if (!origen) return null;
  const e = ETIQUETAS[origen] ?? {
    texto: origen,
    clase: 'origen-otro',
    titulo: origen,
  };
  return (
    <span className={`sello origen ${e.clase}`} title={e.titulo}>
      {e.texto}
    </span>
  );
}
