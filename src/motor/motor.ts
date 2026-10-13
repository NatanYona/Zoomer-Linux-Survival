// Punto de entrada del interprete. La logica de bash vive en shell.ts:
// variables, tuberias, redirecciones, if/for/while, funciones y scripts.
import type { EditorPedido, Estado } from './tipos';
import { semilla } from './semilla';
import { correrLinea } from './shell';

export function nuevoEstado(): Estado {
  return semilla();
}

/** El mundo con el que arranca una leccion: el limpio, mas su preparacion si tiene. */
export function mundoPara(preparacion: string[] = []): Estado {
  const e = semilla();
  for (const linea of preparacion) {
    const r = correrLinea(linea, e);
    // Una preparacion que falla deja la leccion rota: mejor enterarse en las pruebas.
    if (r.error) throw new Error(`preparacion: ${linea} -> ${r.error}`);
  }
  if (e.entorno) e.entorno.ultimo = 0;
  return e;
}

export function ejecutar(linea: string, e: Estado): { salida: string; error?: string; editor?: EditorPedido } {
  // los validadores de las lecciones dependen de que la linea cruda quede
  // en el historial ANTES de ejecutarla (aunque falle o este vacia).
  e.historial.push(linea);
  if (!linea.trim()) return { salida: '' };
  const r = correrLinea(linea, e);
  return { salida: r.salida, error: r.error, editor: r.editor };
}
