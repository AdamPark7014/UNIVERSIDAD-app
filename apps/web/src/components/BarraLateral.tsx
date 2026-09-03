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
  esLaboratorio: boolean;
  _count?: { sesiones: number };
}

const SECCIONES = [
  { href: '/', etiqueta: 'Panel', icono: 'panel' },
  { href: '/buscar', etiqueta: 'Buscar', icono: 'buscar' },
  { href: '/calendario', etiqueta: 'Calendario', icono: 'calendario' },
  { href: '/horario', etiqueta: 'Horario', icono: 'horario' },
  { href: '/notas-pendientes', etiqueta: 'Notas pendientes', icono: 'alerta' },
  { href: '/libros', etiqueta: 'Biblioteca', icono: 'guia' },
  { href: '/tareas', etiqueta: 'Tareas propias', icono: 'tareas' },
  { href: '/evaluaciones', etiqueta: 'Evaluaciones', icono: 'evaluaciones' },
  { href: '/estadisticas', etiqueta: 'Estadísticas', icono: 'estadisticas' },
  { href: '/sync', etiqueta: 'Sincronización', icono: 'sync' },
] as const;

export function BarraLateral({
  materias,
  pendientes,
  notasPendientes = 0,
}: {
  materias: MateriaNav[];
  pendientes: number;
  notasPendientes?: number;
}) {
  const ruta = usePathname();
  const router = useRouter();
  const cajaBusqueda = useRef<HTMLInputElement>(null);

  // Ctrl+K enfoca la búsqueda desde cualquier pantalla.
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

  return (
    <div className="barra-contenido">
      <Link href="/" style={{ display: 'block', color: 'inherit' }}>
        <div className="marca">Universidad</div>
        <div className="marca-sub">Otoño 2026</div>
      </Link>

      <input
        ref={cajaBusqueda}
        className="busqueda-barra"
        type="text"
        placeholder="Buscar…  Ctrl+K"
        onKeyDown={(e) => {
          const v = (e.target as HTMLInputElement).value.trim();
          if (e.key === 'Enter' && v.length >= 2) {
            router.push(`/buscar?q=${encodeURIComponent(v)}`);
          }
        }}
      />

      <nav>
        {SECCIONES.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={activo(s.href) ? 'activo' : ''}
            aria-current={activo(s.href) ? 'page' : undefined}
          >
            <span className="fila" style={{ gap: 10, minWidth: 0 }}>
              <Icono nombre={s.icono} tamano={16} className="icono-nav" />
              <span className="etiqueta-nav">{s.etiqueta}</span>
            </span>
            {s.href === '/sync' && pendientes > 0 && (
              <span className="conteo pendiente">{pendientes}</span>
            )}
            {s.href === '/notas-pendientes' && notasPendientes > 0 && (
              <span className="conteo pendiente alerta">{notasPendientes}</span>
            )}
          </Link>
        ))}
      </nav>

      <div className="grupo">Materias</div>
      <nav>
        {materias.map((m) => (
          <Link
            key={m.id}
            href={`/materias/${m.codigo}`}
            className={ruta === `/materias/${m.codigo}` ? 'activo' : ''}
            title={m.nombre}
            aria-current={ruta === `/materias/${m.codigo}` ? 'page' : undefined}
          >
            <span className="fila" style={{ gap: 10, minWidth: 0 }}>
              <span className="punto-materia" style={{ background: m.color }} />
              <span className="etiqueta-nav">
                {m.esLaboratorio ? `Lab · ${m.clave}` : m.nombre}
              </span>
            </span>
            <span className="conteo">{m._count?.sesiones ?? ''}</span>
          </Link>
        ))}
        {materias.length === 0 && (
          <span className="conteo" style={{ padding: '9px 16px' }}>
            La API no responde
          </span>
        )}
      </nav>
    </div>
  );
}
