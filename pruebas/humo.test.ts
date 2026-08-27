// Prueba de humo del interprete: verifica que los comandos de los dos agentes
// funcionen juntos. Barata y suficiente; la cobertura fina la da lecciones.test.ts.
import { describe, it, expect } from 'vitest';
import { ejecutar, nuevoEstado } from '../src/motor/motor';
import { buscarRuta } from '../src/motor/vfs';

const correr = (...cmds: string[]) => {
  const e = nuevoEstado();
  let ult: { salida: string; error?: string } = { salida: '' };
  for (const c of cmds) ult = ejecutar(c, e);
  return { e, ...ult };
};

describe('navegacion', () => {
  it('pwd arranca en el home', () => expect(correr('pwd').salida.trim()).toBe('/home/alumno'));
  it('cd relativo y .. vuelven', () => {
    const { e } = correr('cd documentos', 'cd ..');
    expect(e.cwd.join('/')).toBe('home/alumno');
  });
  it('cd a algo inexistente da error', () => expect(correr('cd nada').error).toContain('No existe'));
  it('ls -a muestra los ocultos', () => expect(correr('ls -a').salida).toContain('.perfil'));
  it('ls -l trae permisos y dueno', () => {
    const s = correr('ls -l').salida;
    expect(s).toMatch(/drwx|[-]rw-/);
    expect(s).toContain('alumno');
  });
});

describe('archivos', () => {
  it('cp deja el original', () => {
    const { e } = correr('cp documentos/tarea1.txt practica/copia.txt');
    expect(buscarRuta('/home/alumno/practica/copia.txt', e)).toBeTruthy();
    expect(buscarRuta('/home/alumno/documentos/tarea1.txt', e)).toBeTruthy();
  });
  it('mv renombra y no deja el original', () => {
    const { e } = correr('cd documentos', 'mv borrador.txt informe.txt');
    expect(buscarRuta('/home/alumno/documentos/informe.txt', e)).toBeTruthy();
    expect(buscarRuta('/home/alumno/documentos/borrador.txt', e)).toBeNull();
  });
  it('rm sin -r no borra directorios', () => expect(correr('rm documentos').error).toContain('directorio'));
  it('cp -r clona el arbol entero', () => {
    const { e } = correr('cp -r proyecto respaldo/proyecto');
    expect(buscarRuta('/home/alumno/respaldo/proyecto/src/main.c', e)).toBeTruthy();
  });
  it('el comodin expande', () => {
    const s = correr('ls documentos/*.txt').salida;
    expect(s).toContain('apuntes.txt');
    expect(s).not.toContain('planilla.csv');
  });
  it('chmod octal cambia el modo', () => {
    const { e } = correr('chmod 754 practica/saludo.sh');
    expect(buscarRuta('/home/alumno/practica/saludo.sh', e)?.modo).toBe(0o754);
  });
});

describe('redireccion y tuberias', () => {
  it('> crea y >> agrega', () => {
    const { e } = correr('ls documentos > respaldo/i.txt', 'ls descargas >> respaldo/i.txt');
    const n = buscarRuta('/home/alumno/respaldo/i.txt', e);
    expect(n?.tipo === 'arch' && n.contenido).toContain('apuntes.txt');
    expect(n?.tipo === 'arch' && n.contenido).toContain('manual.pdf');
  });
  it('grep encadenado con wc -l cuenta', () => {
    expect(correr('grep ERROR /var/log/sistema.log | wc -l').salida.trim()).toBe('3');
  });
});

describe('procesos e impresion', () => {
  it('ps lista el proceso pesado', () => expect(correr('ps').salida).toContain('calcular'));
  it('kill lo marca muerto y desaparece de ps', () => {
    const { e } = correr('kill 1204');
    expect(e.procesos.find((p) => p.pid === 1204)?.vivo).toBe(false);
    expect(ejecutar('ps', e).salida).not.toContain('calcular');
  });
  it('kill contra root se rechaza', () => expect(correr('kill 1').error).toContain('no permitida'));
  it('lp encola, lpstat lista, cancel saca', () => {
    const e = nuevoEstado();
    const r = ejecutar('lp documentos/apuntes.txt', e);
    expect(r.salida).toContain('laser-42');
    expect(ejecutar('lpstat', e).salida).toContain('laser-42');
    ejecutar('cancel laser-42', e);
    expect(e.colaImpresion.length).toBe(0);
  });
});

describe('ayuda', () => {
  it('man devuelve una pagina', () => expect(correr('man ls').salida).toContain('NOMBRE'));
  it('man de algo inexistente avisa', () => expect(correr('man volar').salida + correr('man volar').error).toContain('No hay'));
  it('comando inexistente da el error de bash', () => expect(correr('volar').error).toContain('orden no encontrada'));
});
