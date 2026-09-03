/**
 * Iconos de línea, dibujados a mano en SVG. Sin librería: son doce trazos y
 * así heredan el color y el grosor del texto sin pelear con nada.
 */
type Nombre =
  | 'panel'
  | 'buscar'
  | 'calendario'
  | 'horario'
  | 'tareas'
  | 'evaluaciones'
  | 'estadisticas'
  | 'sync'
  | 'nota'
  | 'guia'
  | 'reloj'
  | 'alerta'
  | 'check'
  | 'descargar'
  | 'flecha';

const TRAZOS: Record<Nombre, React.ReactNode> = {
  panel: (
    <>
      <rect x="3" y="3" width="7" height="8" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="3" y="15" width="7" height="6" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
    </>
  ),
  buscar: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  calendario: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  horario: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M9 9v12M15 9v12" />
    </>
  ),
  tareas: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4 6l1.2 1.2L7.5 4.8M4 12l1.2 1.2L7.5 10.8" />
      <circle cx="5.4" cy="18" r="1.4" />
    </>
  ),
  evaluaciones: (
    <>
      <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </>
  ),
  estadisticas: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  sync: (
    <>
      <path d="M20 11a8 8 0 0 0-14-5L3 9" />
      <path d="M4 13a8 8 0 0 0 14 5l3-3" />
      <path d="M3 4v5h5M21 20v-5h-5" />
    </>
  ),
  nota: (
    <>
      <path d="M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  guia: (
    <>
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v16H6.5A2.5 2.5 0 0 0 4 20.5z" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v4H6.5A2.5 2.5 0 0 1 4 20.5z" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  alerta: (
    <>
      <path d="M12 3.5 22 20H2z" />
      <path d="M12 10v4.5M12 17.4v.2" />
    </>
  ),
  check: <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />,
  descargar: (
    <>
      <path d="M12 3v12M7.5 10.5 12 15l4.5-4.5" />
      <path d="M4 19h16" />
    </>
  ),
  flecha: <path d="M5 12h14M13 6l6 6-6 6" />,
};

export function Icono({
  nombre,
  tamano = 17,
  className,
}: {
  nombre: Nombre;
  tamano?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flex: 'none' }}
    >
      {TRAZOS[nombre]}
    </svg>
  );
}
