export default function Cargando() {
  return (
    <div className="page-loading" aria-busy="true" aria-label="Cargando">
      <div className="cabecera-pagina">
        <div className="esqueleto" style={{ width: 140, height: 12, marginBottom: 14 }} />
        <div className="esqueleto" style={{ width: 'min(360px, 90%)', height: 34, marginBottom: 8 }} />
        <div className="esqueleto" style={{ width: 'min(480px, 100%)', height: 14 }} />
      </div>
      <div className="rejilla c4" style={{ marginBottom: 24 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="esqueleto tarjeta"
            style={{ height: 96, opacity: 1 - i * 0.1, padding: 0 }}
          />
        ))}
      </div>
      <div className="esqueleto" style={{ height: 180, borderRadius: 12 }} />
    </div>
  );
}
