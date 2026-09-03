import type { Bloque } from '@/lib/texto';

/** Render de los bloques con el aspecto del .docx: Arial, hoja blanca. */
export function HojaDocumento({
  bloques,
  compacta = false,
}: {
  bloques: Bloque[];
  compacta?: boolean;
}) {
  const partes: React.ReactNode[] = [];
  let lista: string[] = [];

  const cerrarLista = (clave: string) => {
    if (lista.length) {
      partes.push(
        <ul className="docx-lista" key={clave}>
          {lista.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>,
      );
      lista = [];
    }
  };

  bloques.forEach((b, i) => {
    if (b.tipo === 'VINETA') {
      lista.push(b.texto);
      return;
    }
    cerrarLista(`ul-${i}`);

    switch (b.tipo) {
      case 'TITULO':
        partes.push(<h1 className="docx-titulo" key={i}>{b.texto}</h1>);
        break;
      case 'SUBTITULO':
        partes.push(<p className="docx-subtitulo" key={i}>{b.texto}</p>);
        break;
      case 'TEMA':
        partes.push(<p className="docx-tema" key={i}>{b.texto}</p>);
        break;
      case 'ENCABEZADO':
      case 'TAREA_PROPIA_TITULO':
        partes.push(<h2 className="docx-encabezado" key={i}>{b.texto}</h2>);
        break;
      case 'NUMERADA':
        partes.push(<p className="docx-numerada" key={i}>{b.texto}</p>);
        break;
      case 'SEPARADOR':
        partes.push(<hr className="docx-separador" key={i} />);
        break;
      case 'ESPACIO':
        // En pantalla las veinte líneas vacías de la plantilla no aportan nada.
        if (!compacta) partes.push(<p className="docx-espacio" key={i}>&nbsp;</p>);
        break;
      default:
        partes.push(<p className="docx-parrafo" key={i}>{b.texto}</p>);
    }
  });
  cerrarLista('ul-final');

  return <div className={`hoja${compacta ? ' compacta' : ''}`}>{partes}</div>;
}
