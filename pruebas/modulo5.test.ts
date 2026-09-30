// Los validadores del modulo 5 miran lo que el script HACE, no como se escribio.
// Estas pruebas cubren el otro lado: que no se puedan cumplir con atajos
// (imprimir el resultado a mano, saltearse el for, cron con la hora al reves).
import { describe, it, expect } from 'vitest';
import { ejecutar, nuevoEstado } from '../src/motor/motor';
import { guardarEditor } from '../src/motor/editor';
import { LECCIONES } from '../src/contenido';
import type { Estado } from '../src/motor/tipos';

const leccion = (id: string) => LECCIONES.find((l) => l.id === id)!;

/** Escribe el archivo como lo haria el alumno desde nano (^O). */
const nano = (e: Estado, ruta: string, texto: string) =>
  guardarEditor({ destino: 'archivo', ruta, contenido: '', nuevo: true }, texto, e);

const mundo = (...cmds: string[]) => {
  const e = nuevoEstado();
  for (const c of cmds) ejecutar(c, e);
  return e;
};

describe('m5-l1 ejecutar un script', () => {
  it('con bash no cuenta: la leccion es darle permiso y correrlo como programa', () => {
    expect(leccion('m5-l1').validar(mundo('bash practica/saludo.sh'))).toBe(false);
  });
  it('sin chmod el intento falla y no cuenta', () => {
    expect(leccion('m5-l1').validar(mundo('cd practica', './saludo.sh'))).toBe(false);
  });
});

describe('m5-l2 primer script', () => {
  it('escrito con nano y corrido, cumple', () => {
    const e = nuevoEstado();
    nano(e, '/home/alumno/hola.sh', '#!/bin/bash\necho "Hola, mundo"');
    ejecutar('chmod 755 hola.sh', e);
    ejecutar('./hola.sh', e);
    expect(leccion('m5-l2').validar(e)).toBe(true);
  });
  it('sin shebang no cumple', () => {
    const e = nuevoEstado();
    nano(e, '/home/alumno/hola.sh', 'echo "Hola, mundo"');
    ejecutar('chmod 755 hola.sh', e);
    ejecutar('./hola.sh', e);
    expect(leccion('m5-l2').validar(e)).toBe(false);
  });
});

describe('m5-l3 variables', () => {
  it('escribir la fecha a mano no cumple', () => {
    const e = nuevoEstado();
    nano(e, '/home/alumno/fecha.sh', '#!/bin/bash\necho "Hoy es jue 27 ago 2026"');
    ejecutar('bash fecha.sh', e);
    expect(leccion('m5-l3').validar(e)).toBe(false);
  });
});

describe('m5-l4 argumentos', () => {
  it('saludar a Ana escrito a mano no cumple', () => {
    const e = nuevoEstado();
    nano(e, '/home/alumno/saludar.sh', '#!/bin/bash\necho "Hola, Ana"');
    ejecutar('bash saludar.sh Ana', e);
    expect(leccion('m5-l4').validar(e)).toBe(false);
  });
  it('con $1 y cualquier nombre cumple', () => {
    const e = nuevoEstado();
    nano(e, '/home/alumno/saludar.sh', '#!/bin/bash\necho "Hola, $1"');
    ejecutar('bash saludar.sh Natan', e);
    expect(leccion('m5-l4').validar(e)).toBe(true);
  });
});

describe('m5-l5 read', () => {
  it('sin tuberia no cumple', () => {
    const e = nuevoEstado();
    nano(e, '/home/alumno/recibir.sh', '#!/bin/bash\nread nombre\necho "Bienvenido, $nombre"');
    ejecutar('bash recibir.sh', e);
    expect(leccion('m5-l5').validar(e)).toBe(false);
  });
});

describe('m5-l6 if', () => {
  it('un script que siempre dice existe no cumple', () => {
    const e = nuevoEstado();
    nano(e, '/home/alumno/revisar.sh', '#!/bin/bash\nif true; then echo existe; fi');
    ejecutar('bash revisar.sh bienvenida.txt', e);
    ejecutar('bash revisar.sh fantasma.txt', e);
    expect(leccion('m5-l6').validar(e)).toBe(false);
  });
  it('probarlo una sola vez no alcanza', () => {
    const e = nuevoEstado();
    nano(e, '/home/alumno/revisar.sh', '#!/bin/bash\nif [ -f "$1" ]; then echo existe; else echo "no existe"; fi');
    ejecutar('bash revisar.sh bienvenida.txt', e);
    expect(leccion('m5-l6').validar(e)).toBe(false);
  });
});

describe('m5-l7 for', () => {
  it('con ls en vez de for no cumple', () => {
    const e = nuevoEstado();
    nano(e, '/home/alumno/listar.sh', '#!/bin/bash\nls ~/documentos');
    ejecutar('bash listar.sh', e);
    expect(leccion('m5-l7').validar(e)).toBe(false);
  });
  it('recorrer todos los archivos, csv incluido, no cumple', () => {
    const e = nuevoEstado();
    nano(e, '/home/alumno/listar.sh', '#!/bin/bash\nfor f in ~/documentos/*; do echo "Archivo: $f"; done');
    ejecutar('bash listar.sh', e);
    expect(leccion('m5-l7').validar(e)).toBe(false);
  });
});

describe('m5-l8 funciones', () => {
  it('dos echo sueltos no cumplen', () => {
    const e = nuevoEstado();
    nano(e, '/home/alumno/funciones.sh', '#!/bin/bash\necho "Hola, Ana"\necho "Hola, Leo"');
    ejecutar('bash funciones.sh', e);
    expect(leccion('m5-l8').validar(e)).toBe(false);
  });
  it('con la palabra function tambien cumple', () => {
    const e = nuevoEstado();
    nano(e, '/home/alumno/funciones.sh', '#!/bin/bash\nfunction saludar {\n  echo "Hola, $1"\n}\nsaludar Ana\nsaludar Leo');
    ejecutar('bash funciones.sh', e);
    expect(leccion('m5-l8').validar(e)).toBe(true);
  });
});

describe('m5-l9 crontab', () => {
  const instalar = (linea: string, ...extra: string[]) => {
    const e = nuevoEstado();
    guardarEditor({ destino: 'crontab', ruta: '/tmp/crontab.alumno', contenido: '', nuevo: true }, linea, e);
    for (const c of extra) ejecutar(c, e);
    return e;
  };
  const RUTA = '/home/alumno/practica/limpiar.sh';

  it('desde crontab -e y revisado con -l cumple', () => {
    expect(leccion('m5-l9').validar(instalar(`30 3 * * 0 ${RUTA}`, 'crontab -l'))).toBe(true);
  });
  it('sin revisar con crontab -l no cumple', () => {
    expect(leccion('m5-l9').validar(instalar(`30 3 * * 0 ${RUTA}`))).toBe(false);
  });
  it('minuto y hora al reves no cumple', () => {
    expect(leccion('m5-l9').validar(instalar(`3 30 * * 0 ${RUTA}`, 'crontab -l'))).toBe(false);
  });
  it('ruta relativa no cumple', () => {
    expect(leccion('m5-l9').validar(instalar('30 3 * * 0 practica/limpiar.sh', 'crontab -l'))).toBe(false);
  });
  it('el domingo tambien puede ser 7', () => {
    expect(leccion('m5-l9').validar(instalar(`30 3 * * 7 ${RUTA}`, 'crontab -l'))).toBe(true);
  });
});
