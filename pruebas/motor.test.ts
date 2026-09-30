// Pruebas del motor y el parser. Usamos comandos falsos inyectados via
// vi.mock para no depender de comandos/archivos.ts ni comandos/sistema.ts
// (los escriben otros agentes en paralelo y todavia no existen).
import { describe, it, expect, vi } from 'vitest';
import type { Ctx, Resultado } from '../src/motor/tipos';
import { ok } from '../src/motor/tipos';

vi.mock('../src/motor/comandos', () => {
  const echo = (ctx: Ctx): Resultado => ok(ctx.args.join(' ') + '\n');
  const mayus = (ctx: Ctx): Resultado => ok(ctx.entrada.toUpperCase());
  return { REGISTRO: { echo, mayus } };
});

import { tokenizar } from '../src/motor/shell';
import { ejecutar, nuevoEstado } from '../src/motor/motor';
import { buscarRuta } from '../src/motor/vfs';

describe('tokenizar', () => {
  const palabras = (linea: string) => tokenizar(linea).map((t) => t.valor);

  it('las comillas agrupan una palabra (y quedan para la expansion)', () => {
    expect(palabras(`echo "hola mundo" 'foo bar' baz`)).toEqual(['echo', '"hola mundo"', "'foo bar'", 'baz']);
  });

  it('aisla el pipe y las redirecciones', () => {
    expect(palabras('echo hola | mayus')).toEqual(['echo', 'hola', '|', 'mayus']);
    expect(palabras('echo hola > salida.txt')).toEqual(['echo', 'hola', '>', 'salida.txt']);
    expect(palabras('echo hola >> salida.txt')).toEqual(['echo', 'hola', '>>', 'salida.txt']);
    expect(palabras('ls nada 2>&1')).toEqual(['ls', 'nada', '2>&1']);
  });

  it('linea vacia o solo espacios no da tokens', () => {
    expect(tokenizar('')).toEqual([]);
    expect(tokenizar('    ')).toEqual([]);
  });

  it('las comillas se sacan al ejecutar', () => {
    const r = ejecutar(`echo "hola mundo" 'foo bar' baz`, nuevoEstado());
    expect(r.salida).toBe('hola mundo foo bar baz\n');
  });
});

describe('ejecutar', () => {
  it('encadena la salida de una etapa a la entrada de la siguiente', () => {
    const e = nuevoEstado();
    const r = ejecutar('echo hola | mayus', e);
    expect(r.salida).toBe('HOLA\n');
    expect(r.error).toBeUndefined();
  });

  it('> crea el archivo y >> anexa, sin mostrar la salida', () => {
    const e = nuevoEstado();
    const r1 = ejecutar('echo hola > /tmp/salida.txt', e);
    expect(r1.salida).toBe('');
    let n = buscarRuta('/tmp/salida.txt', e);
    expect(n?.tipo === 'arch' ? n.contenido : null).toBe('hola\n');

    const r2 = ejecutar('echo chau >> /tmp/salida.txt', e);
    expect(r2.salida).toBe('');
    n = buscarRuta('/tmp/salida.txt', e);
    expect(n?.tipo === 'arch' ? n.contenido : null).toBe('hola\nchau\n');
  });

  it('da el error correcto cuando el comando no existe', () => {
    const e = nuevoEstado();
    const r = ejecutar('zzz', e);
    expect(r.error).toBe('bash: zzz: orden no encontrada');
  });

  it('deja la linea cruda en el historial antes de ejecutar', () => {
    const e = nuevoEstado();
    ejecutar('echo hola', e);
    expect(e.historial[e.historial.length - 1]).toBe('echo hola');

    ejecutar('zzz', e); // tambien debe historiarse aunque falle
    expect(e.historial[e.historial.length - 1]).toBe('zzz');
  });
});
