'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Icono } from './Icono';

interface MateriaNav {
  id: string;
  codigo: string;
  clave: string;
  nombre: string;
  color: string;
  aula?: string | null;
  esLaboratorio: boolean;
  _count?: { sesiones: number };
}

type IconoNombre =
  | 'panel'
  | 'buscar'
  | 'calendario'
  | 'horario'
  | 'tareas'
  | 'evaluaciones'
  | 'estadisticas'
  | 'sync'
  | 'alerta'
  | 'guia';

type ItemNav = {
  href: string;
  etiqueta: string;
  icono: IconoNombre;
  destacado?: boolean;
};

const GRUPOS: { titulo: string; items: ItemNav[] }[] = [
  {
    titulo: 'Hoy',
    items: [
      { href: '/', etiqueta: 'Panel', icono: 'panel' },
      { href: '/examenes', etiqueta: 'Exámenes', icono: 'evaluaciones', destacado: true },
      { href: '/entregas', etiqueta: 'Entregas', icono: 'tareas' },
    ],
  },
  {
    titulo: 'Estudiar',
    items: [
      { href: '/libros', etiqueta: 'Biblioteca', icono: 'guia' },
      { href: '/notas-pendientes', etiqueta: 'Notas pendientes', icono: 'alerta' },
      { href: '/tareas', etiqueta: 'Tareas propias', icono: 'tareas' },
      { href: '/buscar', etiqueta: 'Buscar', icono: 'buscar' },
    ],
  },
  {
    titulo: 'Agenda',
    items: [
      { href: '/calendario', etiqueta: 'Calendario', icono: 'calendario' },
      { href: '/horario', etiqueta: 'Horario', icono: 'horario' },
      { href: '/estadisticas', etiqueta: 'Estadísticas', icono: 'estadisticas' },
      { href: '/sync', etiqueta: 'Sincronización', icono: 'sync' },
    ],
  },
];

function salonDe(m: MateriaNav) {
  if (m.aula?.trim()) return m.aula.trim();
  return m.clave.replace(/^([A-Z]+)(\d)/, '$1 $2');
}

export function BarraLateral({
  materias,
  pendientes,
  notasPendientes = 0,
  examenesCerca = 0,
  entregasCerca = 0,
}: {
  materias: MateriaNav[];
  pendientes: number;
  notasPendientes?: number;
  examenesCerca?: number;
  entregasCerca?: number;
}) {
  const ruta = usePathname();
  const router = useRouter();
  const cajaBusqueda = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        cajaBusqueda.current?.focus();
        cajaBusqueda.current?.select();
      }
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, []);

  const activo = (href: string) => (href === '/' ? ruta === '/' : ruta.startsWith(href));

  const badge = (href: string) => {
    if (href === '/sync' && pendientes > 0) return { n: pendientes, alerta: false };
    if (href === '/notas-pendientes' && notasPendientes > 0)
      return { n: notasPendientes, alerta: true };
    if (href === '/examenes' && examenesCerca > 0) return { n: examenesCerca, alerta: true };
    if (href === '/entregas' && entregasCerca > 0) return { n: entregasCerca, alerta: true };
    return null;
  };

  return (
    <div className="barra-contenido">
      <Link href="/" className="barra-marca">
        <div className="marca">Universidad</div>
        <div className="marca-sub">Otoño 2026</div>
      </Link>

      <label className="barra-buscar-wrap">
        <span className="sr-only">Buscar</span>
        <input
          ref={cajaBusqueda}
          className="busqueda-barra"
          type="search"
          placeholder="Buscar…  ⌘K"
          onKeyDown={(e) => {
            const v = (e.target as HTMLInputElement).value.trim();
            if (e.key === 'Enter' && v.length >= 2) {
              router.push(`/buscar?q=${encodeURIComponent(v)}`);
            }
          }}
        />
      </label>

      {GRUPOS.map((g) => (
        <div key={g.titulo} className="barra-grupo">
          <div className="grupo">{g.titulo}</div>
          <nav>
            {g.items.map((s) => {
              const b = badge(s.href);
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  className={`${activo(s.href) ? 'activo' : ''}${s.destacado ? ' nav-destacado' : ''}`}
                  aria-current={activo(s.href) ? 'page' : undefined}
                >
                  <span className="fila" style={{ gap: 10, minWidth: 0 }}>
                    <Icono nombre={s.icono} tamano={16} className="icono-nav" />
                    <span className="etiqueta-nav">{s.etiqueta}</span>
                  </span>
                  {b && (
                    <span className={`conteo pendiente${b.alerta ? ' alerta' : ''}`}>{b.n}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}

      <div className="barra-grupo">
        <div className="grupo">Materias</div>
        <nav className="nav-materias">
          {materias.map((m) => (
            <Link
              key={m.id}
              href={`/materias/${m.codigo}`}
              className={ruta === `/materias/${m.codigo}` ? 'activo' : ''}
              title={`${m.nombre} · Salón ${salonDe(m)}`}
              aria-current={ruta === `/materias/${m.codigo}` ? 'page' : undefined}
            >
              <span className="fila" style={{ gap: 10, minWidth: 0 }}>
                <span className="punto-materia" style={{ background: m.color }} />
                <span className="etiqueta-nav columna-nav">
                  <span>
                    {m.esLaboratorio
                      ? `Lab · ${m.nombre.replace(/^Laboratorio de\s+/i, '')}`
                      : m.nombre}
                  </span>
                  <span className="salon-nav">Salón {salonDe(m)}</span>
                </span>
              </span>
            </Link>
          ))}
          {materias.length === 0 && (
            <span className="conteo" style={{ padding: '9px 16px' }}>
              La API no responde
            </span>
          )}
        </nav>
      </div>
    </div>
  );
}
