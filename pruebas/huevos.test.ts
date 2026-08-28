import { describe, it, expect } from 'vitest';
import { ejecutar, nuevoEstado } from '../src/motor/motor';
import { buscarRuta } from '../src/motor/vfs';
import { HUEVOS, token } from '../src/contenido/huevos';

describe('los huevos existen de verdad', () => {
  // `plantar` no crea directorios: si un huevo apunta a una ruta que no existe
  // en la semilla, desaparece en silencio. Esto lo caza.
  for (const h of HUEVOS) {
    it(h.id + ' esta en ' + h.donde, () => {
      const n = buscarRuta(h.donde, nuevoEstado());
      expect(n, 'no se planto: el directorio padre no existe en la semilla').not.toBeNull();
      expect(n?.tipo).toBe('arch');
    });
  }

  it('todos estan ocultos', () => {
    for (const h of HUEVOS) {
      const nombre = h.donde.split('/').pop() ?? '';
      expect(nombre.startsWith('.'), h.id + ' no empieza con punto: ' + nombre).toBe(true);
    }
  });
});

describe('se pueden leer', () => {
  for (const h of HUEVOS) {
    it('cat ' + h.donde, () => {
      const r = ejecutar('cat ' + h.donde, nuevoEstado());
      expect(r.error, 'cat fallo').toBeUndefined();
      expect(r.salida, 'la salida no trae el token').toContain(token(h.id));
    });
  }
});

describe('el token sobrevive a las herramientas del curso', () => {
  const h = HUEVOS[0];

  it('con more', () => {
    expect(ejecutar('more ' + h.donde, nuevoEstado()).salida).toContain(token(h.id));
  });

  it('encadenado con grep', () => {
    const r = ejecutar('cat ' + h.donde + ' | grep hallazgo', nuevoEstado());
    expect(r.salida).toContain(token(h.id));
  });

  it('con tail, que es donde vive la marca', () => {
    expect(ejecutar('tail -n 3 ' + h.donde, nuevoEstado()).salida).toContain(token(h.id));
  });
});

describe('no se cobran solos', () => {
  it('ningun token aparece sin ir a buscarlo', () => {
    const e = nuevoEstado();
    const inocentes = ['ls', 'ls -a', 'pwd', 'ls -l /', 'cat bienvenida.txt'];
    for (const cmd of inocentes) {
      const r = ejecutar(cmd, e);
      for (const h of HUEVOS) {
        expect(r.salida.includes(token(h.id)), cmd + ' regala ' + h.id).toBe(false);
      }
    }
  });
});
