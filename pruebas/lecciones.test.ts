// La red de seguridad de todo el proyecto: corre la solucion oficial de cada
// leccion contra el motor y exige que su validador de true. Si un agente
// escribio una consigna imposible, un validador mal apuntado o uso un comando
// que nadie implemento, falla aca y no en el aula.
import { describe, it, expect } from 'vitest';
import { ejecutar, nuevoEstado } from '../src/motor/motor';
import { LECCIONES, MODULOS, QUIZZES, leccionesDe } from '../src/contenido';

const ESPERADAS: Record<number, number> = { 1: 7, 2: 8, 3: 9, 4: 7 };

describe('estructura del curso', () => {
  it('tiene los 4 modulos', () => {
    expect(MODULOS.map((m) => m.numero)).toEqual([1, 2, 3, 4]);
  });

  it('tiene la cantidad de lecciones de cada modulo', () => {
    for (const [mod, n] of Object.entries(ESPERADAS)) {
      expect(leccionesDe(Number(mod)).length, 'modulo ' + mod).toBe(n);
    }
  });

  it('no repite ids de leccion', () => {
    const ids = LECCIONES.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ninguna leccion queda con campos vacios', () => {
    for (const l of LECCIONES) {
      for (const campo of ['titulo', 'concepto', 'consigna', 'comandoNuevo', 'pista'] as const) {
        expect(l[campo].trim(), l.id + '.' + campo).not.toBe('');
      }
      expect(l.solucion.length, l.id + '.solucion').toBeGreaterThan(0);
    }
  });

  it('tiene 4 quizzes con 6 preguntas y respuesta correcta en rango', () => {
    expect(QUIZZES.length).toBe(4);
    for (const q of QUIZZES) {
      expect(q.preguntas.length, 'quiz ' + q.modulo).toBe(6);
      for (const p of q.preguntas) {
        expect(p.opciones.length).toBe(4);
        expect(p.correcta).toBeGreaterThanOrEqual(0);
        expect(p.correcta).toBeLessThan(p.opciones.length);
      }
    }
  });
});

describe('cada leccion es resoluble', () => {
  for (const l of LECCIONES) {
    it(l.id + ' - ' + l.titulo, () => {
      const e = nuevoEstado();
      const fallos: string[] = [];
      for (const cmd of l.solucion) {
        const r = ejecutar(cmd, e);
        if (r.error) fallos.push(cmd + '  ->  ' + r.error);
      }
      expect(fallos, 'la solucion oficial tira errores').toEqual([]);
      expect(l.validar(e), 'el validador no acepta su propia solucion').toBe(true);
    });
  }
});

describe('los validadores no se satisfacen solos', () => {
  for (const l of LECCIONES) {
    it(l.id + ' arranca sin cumplir', () => {
      expect(l.validar(nuevoEstado()), 'la leccion nace ya cumplida').toBe(false);
    });
  }
});
