import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { EditorPedido } from '../motor/tipos';
import type { Guardado } from '../motor/editor';

interface Props {
  pedido: EditorPedido;
  /** Escribe el archivo (o instala el crontab). Devuelve el mensaje para la barra de estado. */
  onGuardar: (texto: string) => Guardado;
  onSalir: () => void;
}

/**
 * Un nano de juguete: lo justo para escribir un script de diez lineas.
 * Mismos atajos que el de verdad (^O guardar, ^X salir) y la misma pregunta
 * al salir con cambios sin guardar, para que el alumno llegue a la terminal
 * real sabiendo que tocar. Los atajos tambien son botones: en el celular no
 * hay tecla Ctrl.
 */
export function Editor({ pedido, onGuardar, onSalir }: Props) {
  const [texto, setTexto] = useState(pedido.contenido);
  const [guardado, setGuardado] = useState(pedido.contenido);
  const [estado, setEstado] = useState<{ texto: string; error?: boolean } | null>(
    pedido.nuevo && pedido.destino === 'archivo' ? { texto: '[ Archivo nuevo ]' } : null
  );
  const [preguntando, setPreguntando] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const botonSi = useRef<HTMLButtonElement>(null);

  const modificado = texto !== guardado;
  const nombre = pedido.destino === 'crontab' ? 'crontab (tus tareas programadas)' : pedido.ruta.replace('/home/alumno', '~');

  useEffect(() => {
    area.current?.focus();
  }, []);
  useEffect(() => {
    if (preguntando) botonSi.current?.focus();
    else area.current?.focus();
  }, [preguntando]);

  function guardar(): boolean {
    const g = onGuardar(texto);
    setEstado({ texto: g.mensaje, error: !g.ok });
    if (g.ok) setGuardado(texto);
    return g.ok;
  }

  function salir() {
    if (modificado) {
      setPreguntando(true);
      setEstado(null);
      return;
    }
    onSalir();
  }

  function responder(guardarAntes: boolean | null) {
    if (guardarAntes === null) {
      setPreguntando(false);
      setEstado({ texto: '[ Cancelado ]' });
      return;
    }
    if (guardarAntes && !guardar()) {
      setPreguntando(false);
      return;
    }
    onSalir();
  }

  function tecla(ev: KeyboardEvent<HTMLTextAreaElement>) {
    const k = ev.key.toLowerCase();
    if (ev.ctrlKey && (k === 'o' || k === 's')) {
      ev.preventDefault();
      guardar();
      return;
    }
    if (ev.ctrlKey && k === 'x') {
      ev.preventDefault();
      salir();
      return;
    }
    // Tab mete sangria, como en nano. Shift+Tab sigue sacando el foco.
    if (ev.key === 'Tab' && !ev.shiftKey) {
      ev.preventDefault();
      const el = ev.currentTarget;
      const { selectionStart: a, selectionEnd: b } = el;
      const nuevo = texto.slice(0, a) + '  ' + texto.slice(b);
      setTexto(nuevo);
      requestAnimationFrame(() => el.setSelectionRange(a + 2, a + 2));
    }
  }

  function teclaPregunta(ev: KeyboardEvent<HTMLDivElement>) {
    const k = ev.key.toLowerCase();
    if (k === 's' || k === 'y') { ev.preventDefault(); responder(true); }
    else if (k === 'n') { ev.preventDefault(); responder(false); }
    else if (k === 'escape' || (ev.ctrlKey && k === 'c')) { ev.preventDefault(); responder(null); }
  }

  const lineas = texto.split('\n').length;

  return (
    <div className="nano">
      <div className="nano__titulo">
        <span>nano</span>
        <b>{nombre}</b>
        <span>{modificado ? 'Modificado' : ''}</span>
      </div>

      <div className="nano__cuerpo">
        <div className="nano__numeros" aria-hidden="true">
          {Array.from({ length: lineas }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <textarea
          ref={area}
          value={texto}
          onChange={(ev) => setTexto(ev.target.value)}
          onKeyDown={tecla}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          wrap="off"
          rows={Math.max(lineas, 1)}
          aria-label={'Editando ' + nombre + '. Control O guarda, Control X sale.'}
          readOnly={preguntando}
        />
      </div>

      {preguntando ? (
        <div className="nano__pregunta" role="alertdialog" aria-label="Cambios sin guardar" onKeyDown={teclaPregunta}>
          <span>¿Guardar los cambios antes de salir?</span>
          <div>
            <button ref={botonSi} type="button" onClick={() => responder(true)}><kbd>S</kbd> Sí</button>
            <button type="button" onClick={() => responder(false)}><kbd>N</kbd> No</button>
            <button type="button" onClick={() => responder(null)}><kbd>^C</kbd> Cancelar</button>
          </div>
        </div>
      ) : (
        <p className="nano__estado" data-error={estado?.error ? 'si' : 'no'} aria-live="polite">
          {estado ? estado.texto : ' '}
        </p>
      )}

      <div className="nano__atajos">
        <button type="button" onClick={guardar} disabled={preguntando}>
          <kbd>^O</kbd> Guardar
        </button>
        <button type="button" onClick={salir} disabled={preguntando}>
          <kbd>^X</kbd> Salir
        </button>
        <span className="nano__nota">^ es la tecla Ctrl</span>
      </div>
    </div>
  );
}
