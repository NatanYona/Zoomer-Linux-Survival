// Punto de entrada del interprete. La logica de bash vive en shell.ts:
// variables, tuberias, redirecciones, if/for/while, funciones y scripts.
import type { EditorPedido, Estado } from './tipos';
import { semilla } from './semilla';
import { correrLinea } from './shell';

export function nuevoEstado(): Estado {
  return semilla();
}

export function ejecutar(linea: string, e: Estado): { salida: string; error?: string; editor?: EditorPedido } {
  // los validadores de las lecciones dependen de que la linea cruda quede
  // en el historial ANTES de ejecutarla (aunque falle o este vacia).
  e.historial.push(linea);
  if (!linea.trim()) return { salida: '' };
  const r = correrLinea(linea, e);
  return { salida: r.salida, error: r.error, editor: r.editor };
}
