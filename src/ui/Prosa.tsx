import type { ReactNode } from 'react';

// Markdown acotado: `codigo`, **negrita**, parrafos y listas con '- '.
// ponytail: sin libreria de markdown; si algun dia hacen falta enlaces o
// encabezados dentro de una leccion, ahi si conviene traer una.

function trozos(texto: string, clave: string): ReactNode[] {
  const salida: ReactNode[] = [];
  texto.split('`').forEach((parte, i) => {
    if (i % 2 === 1) {
      salida.push(<code key={clave + '-c' + i}>{parte}</code>);
      return;
    }
    parte.split('**').forEach((p, j) => {
      if (!p) return;
      salida.push(
        j % 2 === 1 ? <strong key={clave + '-n' + i + '-' + j}>{p}</strong> : <span key={clave + '-t' + i + '-' + j}>{p}</span>
      );
    });
  });
  return salida;
}

interface Props {
  texto: string;
  /** Para usar dentro de un boton o un encabezado, donde no se puede anidar <p>. */
  inline?: boolean;
}

export function Prosa({ texto, inline }: Props) {
  if (inline) return <span className="prosa-inline">{trozos(texto, 'i')}</span>;

  const bloques = texto.trim().split('\n\n');
  return (
    <div className="prosa">
      {bloques.map((b, i) => {
        const lineas = b.split('\n');
        if (lineas.every((l) => l.startsWith('- '))) {
          return (
            <ul key={i}>
              {lineas.map((l, j) => (
                <li key={j}>{trozos(l.slice(2), i + '-' + j)}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{trozos(lineas.join(' '), String(i))}</p>;
      })}
    </div>
  );
}

/** Bloque de comandos con el comentario despues del # en gris. */
export function BloqueCmd({ texto }: { texto: string }) {
  return (
    <div className="bloque-cmd">
      <pre>
        {texto.split('\n').map((l, i) => {
          const h = l.indexOf('#');
          return (
            <div key={i}>
              {h >= 0 ? (
                <>
                  {l.slice(0, h)}
                  <span className="comentario">{l.slice(h)}</span>
                </>
              ) : (
                l || ' '
              )}
            </div>
          );
        })}
      </pre>
    </div>
  );
}
