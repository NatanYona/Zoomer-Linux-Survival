import { useEffect, useRef } from 'react';
import type { Logro } from './estado';
import type { ProgresoRango } from '../contenido/xp';

interface Props {
  logro: Logro | null;
  progreso: ProgresoRango;
  onCerrar: () => void;
  onSiguiente: () => void;
  etiquetaSiguiente: string;
}

/** Una subida de rango merece quedarse mas tiempo en pantalla que un +100. */
const DURACION = 6000;
const DURACION_RANGO = 9000;

export function Aviso({ logro, progreso, onCerrar, onSiguiente, etiquetaSiguiente }: Props) {
  const caja = useRef<HTMLDivElement>(null);
  const subida = !!logro?.subioA;

  // popover="manual" nos deja controlarlo: no se cierra solo cuando el alumno
  // hace clic en la terminal para seguir tipeando.
  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    if (logro) {
      if (!el.matches(':popover-open')) el.showPopover?.();
      const t = setTimeout(onCerrar, subida ? DURACION_RANGO : DURACION);
      return () => clearTimeout(t);
    }
    if (el.matches(':popover-open')) el.hidePopover?.();
  }, [logro, subida, onCerrar]);

  const pct = Math.round(progreso.fraccion * 100);

  return (
    <div
      ref={caja}
      className="aviso"
      data-rango={subida ? 'si' : 'no'}
      popover="manual"
      role="status"
      aria-live="polite"
    >
      <button className="aviso__cerrar" onClick={onCerrar} aria-label="Cerrar el aviso">
        ×
      </button>

      <p className="aviso__titulo">
        <span>
          {subida ? 'Subiste de rango' : logro?.clase === 'hallazgo' ? 'Hallazgo' : 'Misión cumplida'}
        </span>
        {logro && <span className="aviso__xp">+{logro.xp}&nbsp;XP</span>}
      </p>

      <p className="aviso__leccion">{subida ? logro?.subioA : logro?.titulo}</p>

      <div className="aviso__barra" role="presentation">
        <i style={{ inlineSize: pct + '%' }} />
      </div>

      <p className="aviso__pie">
        <span>{progreso.rango.nombre}</span>
        {progreso.siguiente ? (
          <span>
            {progreso.faltan} XP para {progreso.siguiente.nombre}
          </span>
        ) : (
          <span>rango máximo</span>
        )}
      </p>

      <button
        className="btn btn--principal aviso__siguiente"
        onClick={() => {
          onCerrar();
          onSiguiente();
        }}
      >
        {etiquetaSiguiente}
      </button>
    </div>
  );
}
