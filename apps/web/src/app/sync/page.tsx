import { obtenerSeguro } from '@/lib/api';
import { SinApi } from '@/components/SinApi';
import { ControlesSync } from '@/components/ControlesSync';

export const dynamic = 'force-dynamic';

export default async function Pagina() {
  const estado = await obtenerSeguro<any>('/sync/estado');
  if (!estado) return <SinApi />;
  const historial = (await obtenerSeguro<any[]>('/sync/historial?limite=15')) ?? [];

  return (
    <>
      <header className="cabecera-pagina">
        <div className="eyebrow">Disco ↔ base de datos</div>
        <h1>Sincronización</h1>
        <p className="sub">
          Los .docx viven en OneDrive y son la fuente de la verdad. La base guarda su
          contenido descompuesto en bloques para poder editarlo aquí.
        </p>
      </header>

      <div className="tarjeta hueso" style={{ marginBottom: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Carpeta de documentos</div>
        <code className="dato">{estado.raizDocumentos}</code>
      </div>

      <section className="rejilla c4" style={{ marginBottom: 24 }}>
        <div className="tarjeta metrica">
          <div className="valor">{estado.sesiones}</div>
          <div className="etiqueta">Sesiones</div>
        </div>
        <div className="tarjeta metrica">
          <div className="valor">{estado.documentos}</div>
          <div className="etiqueta">Documentos</div>
        </div>
        <div className="tarjeta metrica">
          <div className="valor">{estado.pendientesDeEscribir}</div>
          <div className="etiqueta">Sin escribir al .docx</div>
        </div>
        <div className="tarjeta metrica">
          <div className="valor">{estado.ultimo?.leidos ?? 0}</div>
          <div className="etiqueta">Leídos la última vez</div>
        </div>
      </section>

      <ControlesSync pendientes={estado.pendientesDeEscribir} />

      <section style={{ marginTop: 32 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Bitácora</div>
        <div className="tarjeta" style={{ padding: 0 }}>
          <table className="datos">
            <thead>
              <tr>
                <th>Cuándo</th>
                <th>Dirección</th>
                <th>Leídos</th>
                <th>Nuevos</th>
                <th>Actualizados</th>
                <th>Escritos</th>
                <th>Errores</th>
              </tr>
            </thead>
            <tbody>
              {historial.length === 0 && (
                <tr>
                  <td colSpan={7} className="silencio">
                    Todavía no se ha corrido ninguna sincronización.
                  </td>
                </tr>
              )}
              {historial.map((e) => (
                <tr key={e.id}>
                  <td className="dato mini">
                    {new Date(e.iniciadoEn).toLocaleString('es-MX')}
                  </td>
                  <td className="mini">{e.direccion}</td>
                  <td className="dato">{e.leidos}</td>
                  <td className="dato">{e.creados}</td>
                  <td className="dato">{e.actualizados}</td>
                  <td className="dato">{e.escritos}</td>
                  <td className="dato">
                    {e.errores > 0 ? (
                      <span className="insignia alerta">{e.errores}</span>
                    ) : (
                      '0'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
