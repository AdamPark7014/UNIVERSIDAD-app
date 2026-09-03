import Link from 'next/link';

export default function NoEncontrado() {
  return (
    <>
      <header className="cabecera-pagina">
        <div className="eyebrow">404</div>
        <h1>Esa pantalla no existe</h1>
      </header>
      <div className="vacio">
        <p style={{ marginTop: 0 }}>Puede que el enlace esté viejo o la sesión ya no exista.</p>
        <Link href="/" className="boton">Volver al panel</Link>
      </div>
    </>
  );
}
