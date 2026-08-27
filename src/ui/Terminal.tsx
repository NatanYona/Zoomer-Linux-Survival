import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import type { Linea } from './estado';

interface Props {
  lineas: Linea[];
  /** Ya armado por el store segun el cosmetico de prompt equipado. */
  prompt: string;
  onCorrer: (linea: string) => void;
  /** Devuelve la linea completada. Lista los candidatos por su cuenta si hay ambiguedad. */
  onCompletar: (linea: string) => string;
  /** Cosmetico `efecto-typewriter` equipado. */
  typewriter: boolean;
}

/**
 * Revela el texto de a poco, para el cosmetico `efecto-typewriter`.
 * Avanza por bloques y no letra por letra: una salida de `man ls` letra por
 * letra tardaria medio minuto y el alumno solo quiere leerla.
 */
function LineaTexto({ texto, animar }: { texto: string; animar: boolean }) {
  const [n, setN] = useState(animar ? 0 : texto.length);

  useEffect(() => {
    if (!animar || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(texto.length);
      return;
    }
    let i = 0;
    const paso = Math.max(1, Math.ceil(texto.length / 40)); // 40 cuadros como techo
    const t = setInterval(() => {
      i += paso;
      setN(Math.min(i, texto.length));
      if (i >= texto.length) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [texto, animar]);

  return <>{texto.slice(0, n)}</>;
}

const CLASE: Record<Linea['tipo'], string> = {
  entrada: 'l-entrada',
  salida: 'l-salida',
  error: 'l-error',
  logro: 'l-logro',
};

export function Terminal({ lineas, prompt, onCorrer, onCompletar, typewriter }: Props) {
  const [valor, setValor] = useState('');
  const [hist, setHist] = useState<string[]>([]);
  const [pos, setPos] = useState(-1);
  const scroll = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = scroll.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lineas]);


  function enviar() {
    onCorrer(valor);
    if (valor.trim()) setHist((h) => [...h, valor]);
    setValor('');
    setPos(-1);
  }

  // Enter se maneja aca y no por el submit implicito del form: con un solo
  // campo y sin boton, los navegadores lo implementan de forma despareja.
  // Flechas arriba/abajo recorren lo ya tipeado, como en una terminal de verdad.
  function tecla(ev: KeyboardEvent<HTMLInputElement>) {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      enviar();
    } else if (ev.key === 'Tab') {
      // Con el campo vacio dejamos pasar el Tab: es la unica via de escape por
      // teclado para salir de la terminal. Shift+Tab siempre navega.
      if (!valor || ev.shiftKey) return;
      ev.preventDefault();
      setValor(onCompletar(valor));
      setPos(-1);
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      if (!hist.length) return;
      const n = pos < 0 ? hist.length - 1 : Math.max(0, pos - 1);
      setPos(n);
      setValor(hist[n]);
    } else if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      if (pos < 0) return;
      const n = pos + 1;
      if (n >= hist.length) {
        setPos(-1);
        setValor('');
      } else {
        setPos(n);
        setValor(hist[n]);
      }
    }
  }

  return (
    <section className="term" aria-label="Terminal">
      <div className="term__barra">
        <span className="puntos" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>alumno@so2-lab</span>
      </div>

      {/* El prompt va DENTRO del historial, como ultima linea: en una terminal
          real el cursor baja con cada comando en vez de quedarse fijo abajo. */}
      <div className="term__scroll" ref={scroll} onClick={() => campo.current?.focus()}>
        {lineas.map((l, i) => (
          <pre key={i} className={CLASE[l.tipo]}>
            {/* Solo la ultima linea se anima: reanimar el historial entero en
                cada comando seria insoportable. */}
            <LineaTexto
              texto={l.texto}
              animar={typewriter && l.tipo === 'salida' && i === lineas.length - 1}
            />
          </pre>
        ))}

        <form
          className="term__linea"
          onSubmit={(ev: FormEvent) => {
            ev.preventDefault();
            enviar();
          }}
        >
          <span className="p">{prompt}</span>
          <input
            ref={campo}
            value={valor}
            onChange={(ev) => setValor(ev.target.value)}
            onKeyDown={tecla}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            autoFocus
            aria-label="Escribí un comando"
          />
        </form>
      </div>

      <p className="term__ayuda">
        <code>help</code> comandos · <code>man &lt;cmd&gt;</code> manual · <code>pase</code> tu progreso
      </p>
    </section>
  );
}
