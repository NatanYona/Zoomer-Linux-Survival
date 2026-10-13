import { useEffect, useRef } from 'react';
import type { Modulo } from '../contenido/esquema';

interface Props {
  modulo: Modulo;
  hechas: number;
  total: number;
  onParticipar: () => void;
}

const hoy = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

/**
 * El pop-up de noticias que anuncia el evento del dia al entrar. Se muestra
 * en cada carga mientras el evento no este terminado: quien dijo "ahora no"
 * se lo vuelve a cruzar la proxima vez, que es la idea de un evento.
 */
export function Noticia({ modulo, hechas, total, onParticipar }: Props) {
  const caja = useRef<HTMLDialogElement>(null);
  const terminado = hechas === total;

  // Solo al montar: si se mostrara cada vez que cambia `hechas`, reapareceria
  // despues de cada mision cumplida.
  useEffect(() => {
    if (!terminado) caja.current?.showModal?.();
  }, []);

  if (!modulo.evento) return null;

  return (
    <dialog ref={caja} className="noticia" aria-labelledby="noticia-titular">
      <p className="noticia__kicker">
        <span>Últimas noticias · so2-lab</span>
        <span>{hoy}</span>
      </p>
      <p className="noticia__sello">Evento del día</p>
      <h2 id="noticia-titular" className="noticia__titular">
        {modulo.evento.titular}
      </h2>
      <p className="noticia__bajada">{modulo.evento.bajada}</p>
      {hechas > 0 && (
        <p className="noticia__progreso">
          Vas {hechas} de {total} misiones.
        </p>
      )}
      <form method="dialog" className="noticia__acciones">
        <button className="btn btn--principal" value="si" onClick={onParticipar} autoFocus>
          {hechas > 0 ? 'Seguir con el evento' : 'Quiero participar'}
        </button>
        <button className="btn" value="no">
          Ahora no
        </button>
      </form>
    </dialog>
  );
}
