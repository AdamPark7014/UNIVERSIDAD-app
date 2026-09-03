'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function AppShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const ruta = usePathname();

  useEffect(() => {
    setMenuAbierto(false);
  }, [ruta]);

  useEffect(() => {
    if (!menuAbierto) return;
    document.body.style.overflow = 'hidden';
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuAbierto(false);
    };
    window.addEventListener('keydown', alTecla);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', alTecla);
    };
  }, [menuAbierto]);

  return (
    <>
      <a className="skip-link" href="#contenido-principal">Saltar al contenido</a>
      <div className="app">
        <button
          type="button"
          className={`sidebar-backdrop${menuAbierto ? ' open' : ''}`}
          aria-hidden={!menuAbierto}
          tabIndex={menuAbierto ? 0 : -1}
          onClick={() => setMenuAbierto(false)}
        />
        <aside className={`barra${menuAbierto ? ' open' : ''}`} aria-label="Navegación principal">
          <button
            type="button"
            className="barra-cerrar"
            aria-label="Cerrar menú"
            onClick={() => setMenuAbierto(false)}
          >
            ×
          </button>
          {sidebar}
        </aside>
        <div className="main-wrap">
          <header className="mobile-top">
            <button
              type="button"
              className="menu-btn"
              aria-label="Abrir menú"
              aria-expanded={menuAbierto}
              onClick={() => setMenuAbierto(true)}
            >
              <span aria-hidden>☰</span>
            </button>
            <span className="mobile-brand">Universidad · Otoño 2026</span>
          </header>
          <main id="contenido-principal" className="contenido">{children}</main>
        </div>
      </div>
    </>
  );
}
