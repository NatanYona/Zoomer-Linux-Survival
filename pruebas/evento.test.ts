// Lo que el evento Operacion Atajo le sumo al motor: alias, PATH, type, which y chmod +x.
import { describe, it, expect } from 'vitest';
import { ejecutar, nuevoEstado } from '../src/motor/motor';

const correr = (...lineas: string[]) => {
  const e = nuevoEstado();
  return { e, rs: lineas.map((l) => ejecutar(l, e)) };
};
const ultimo = (...lineas: string[]) => correr(...lineas).rs.at(-1)!;

describe('alias', () => {
  it('reemplaza el nombre y pasa los argumentos al final', () => {
    expect(ultimo("alias saluda='echo hola'", 'saluda mundo').salida).toBe('hola mundo\n');
  });

  it('un alias que se llama igual que el comando no se expande en bucle', () => {
    expect(ultimo("alias echo='echo [x]'", 'echo hola').salida).toBe('[x] hola\n');
  });

  it('acepta && y lo corre en la terminal', () => {
    const { e } = correr("alias docs='cd ~/documentos && pwd'", 'docs');
    expect('/' + e.cwd.join('/')).toBe('/home/alumno/documentos');
  });

  it('lista, muestra uno y se borra con unalias', () => {
    expect(ultimo("alias ll='ls -la'", 'alias').salida).toBe("alias ll='ls -la'\n");
    expect(ultimo("alias ll='ls -la'", 'unalias ll', 'll').error).toMatch(/orden no encontrada/);
  });

  it('no se expande adentro de un script', () => {
    const r = ultimo("alias hola='echo alias'", "echo -e '#!/bin/bash\\nhola' > s.sh", 'bash s.sh');
    expect(r.error).toMatch(/hola: orden no encontrada/);
  });

  it('con espacios alrededor del = explica como va', () => {
    expect(ultimo('alias ll = ls -la').error).toBe("bash: alias: alrededor del = no van espacios. Va todo junto: alias ll='ls -la'");
  });

  it('se carga desde un archivo con source', () => {
    const r = ultimo(`echo "alias x='echo desde archivo'" >> ~/.bash_aliases`, 'source ~/.bash_aliases', 'x');
    expect(r.salida).toBe('desde archivo\n');
  });
});

describe('PATH', () => {
  const armar = ['mkdir ~/bin', "echo -e '#!/bin/bash\\necho soy $0' > ~/bin/yo"];

  it('sin la carpeta en el PATH no lo encuentra', () => {
    expect(ultimo(...armar, 'chmod +x ~/bin/yo', 'yo').error).toMatch(/orden no encontrada/);
  });

  it('con la carpeta en el PATH lo corre por su nombre, desde cualquier lado', () => {
    const r = ultimo(...armar, 'chmod +x ~/bin/yo', 'export PATH="$PATH:$HOME/bin"', 'cd /tmp', 'yo');
    expect(r.salida).toBe('soy /home/alumno/bin/yo\n');
  });

  it('acepta el ~ en el PATH', () => {
    expect(ultimo(...armar, 'chmod +x ~/bin/yo', 'PATH=$PATH:~/bin', 'yo').salida).toMatch(/soy/);
  });

  it('sin permiso de ejecucion avisa cual es el problema', () => {
    expect(ultimo(...armar, 'export PATH="$PATH:$HOME/bin"', 'yo').error).toMatch(/falta el permiso de ejecución/);
  });

  it('pisar el PATH deja sin comandos del sistema, pero cd y export siguen', () => {
    const { rs } = correr('PATH=/nada', 'ls', 'cd /tmp', 'export PATH=/usr/bin:/bin', 'ls');
    expect(rs[1].error).toMatch(/ls: orden no encontrada/);
    expect(rs[2].error).toBeUndefined();
    expect(rs[4].error).toBeUndefined();
  });

  it('un archivo en la carpeta actual sugiere ./', () => {
    expect(ultimo('cd ~/practica', 'limpiar.sh').error).toMatch(/Escribí \.\/limpiar\.sh/);
  });
});

describe('type y which', () => {
  it('type distingue alias, interna, programa y desconocido', () => {
    const { rs } = correr("alias ll='ls -la'", 'type ll', 'type cd', 'type grep', 'type nada');
    expect(rs[1].salida).toMatch(/ll es un alias de «ls -la»/);
    expect(rs[2].salida).toMatch(/cd es una orden interna/);
    expect(rs[3].salida).toBe('grep es /usr/bin/grep\n');
    expect(rs[4].error).toMatch(/no se encontró/);
  });

  it('which muestra la ruta y no conoce cd', () => {
    const { rs } = correr('which ls', 'which cd');
    expect(rs[0].salida).toBe('/usr/bin/ls\n');
    expect(rs[1].salida).toBe('');
  });
});

describe('chmod simbolico', () => {
  const modo = (...l: string[]) => ultimo(...l, 'ls -l ~/practica/saludo.sh').salida.slice(0, 10);

  it('+x suma ejecucion para todos', () => expect(modo('chmod +x ~/practica/saludo.sh')).toBe('-rwxr-xr-x'));
  it('u+x solo al dueño', () => expect(modo('chmod u+x ~/practica/saludo.sh')).toBe('-rwxr--r--'));
  it('go-r le quita lectura a grupo y otros', () => expect(modo('chmod go-r ~/practica/saludo.sh')).toBe('-rw-------'));
  it('a=r deja solo lectura', () => expect(modo('chmod a=r ~/practica/saludo.sh')).toBe('-r--r--r--'));
});

describe('el evento solo se ve en su semana', async () => {
  const { MODULOS, visible } = await import('../src/contenido');
  const evento = MODULOS.find((m) => m.evento)!;
  const dia = (a: number, m: number, d: number, h = 12) => new Date(a, m - 1, d, h);

  it('se ve del lunes al domingo, los dos inclusive', () => {
    expect(visible(evento, dia(2026, 10, 12, 0))).toBe(true);
    expect(visible(evento, dia(2026, 10, 18, 23))).toBe(true);
  });

  it('no se ve ni antes ni despues', () => {
    expect(visible(evento, dia(2026, 10, 11, 23))).toBe(false);
    expect(visible(evento, dia(2026, 10, 19, 0))).toBe(false);
  });

  it('los modulos comunes se ven siempre', () => {
    expect(MODULOS.filter((m) => !m.evento).every((m) => visible(m, dia(2030, 1, 1)))).toBe(true);
  });
});

describe('las misiones nuevas no se aprueban imprimiendo el resultado a mano', async () => {
  const { mundoPara } = await import('../src/motor/motor');
  const { LECCIONES } = await import('../src/contenido');
  const mision = (id: string) => LECCIONES.find((l) => l.id === id)!;
  const jugar = (id: string, lineas: string[]) => {
    const l = mision(id);
    const e = mundoPara(l.preparacion);
    for (const x of lineas) ejecutar(x, e);
    return l.validar(e);
  };

  it('ev-l9: un semaforo que siempre dice lo mismo no pasa', () => {
    const trucho = `echo -e '#!/bin/bash\nif true; then\n  echo "Atención: 3 errores"\nelif false; then\n  echo x\nelse\n  echo y\nfi' > ~/bin/revisar-log`;
    expect(jugar('ev-l9', [trucho, 'chmod +x ~/bin/revisar-log', 'revisar-log'])).toBe(false);
  });

  it('ev-l11: un reporte que no lee el archivo no pasa', () => {
    const trucho = `echo -e '#!/bin/bash\nwhile read x; do :; done < ~/notas.txt\necho "Ortiz: aprobado"\necho "Paz: recupera"\necho "Aprobaron 3"' > ~/bin/reporte`;
    expect(jugar('ev-l11', [trucho, 'chmod +x ~/bin/reporte', 'reporte'])).toBe(false);
  });

  it('ev-l11: con > 7 en vez de -ge 7, el 7 queda afuera y no pasa', () => {
    const casi = `echo -e '#!/bin/bash\na=0\nwhile read nombre nota; do\n  if [ $nota -gt 7 ]; then\n    echo "$nombre: aprobado"\n    a=$((a+1))\n  else\n    echo "$nombre: recupera"\n  fi\ndone < ~/notas.txt\necho "Aprobaron $a"' > ~/bin/reporte`;
    expect(jugar('ev-l11', [casi, 'chmod +x ~/bin/reporte', 'reporte'])).toBe(false);
  });

  it('ev-l8: sin exit 1 el script "sale bien" aunque se queje, y no pasa', () => {
    const sinExit = `echo -e '#!/bin/bash\nif [ $# -eq 0 ]; then\n  echo "Uso: respaldar carpeta"\nfi' > ~/bin/respaldar`;
    expect(jugar('ev-l8', [sinExit, 'respaldar', 'echo $?', 'respaldar ~/documentos', 'echo $?'])).toBe(false);
  });

  it('ev-l7: el respaldar viejo, sin if, no pasa', () => {
    expect(jugar('ev-l7', ['mkdir ~/respaldo', 'respaldar'])).toBe(false);
  });
});

describe('cp con barra final', () => {
  it('a una carpeta que no existe falla en vez de crear un archivo', () => {
    const { e, rs } = correr('rmdir ~/respaldo', 'cp ~/documentos/tarea1.txt ~/respaldo/');
    expect(rs[1].error).toMatch(/No existe el directorio/);
    expect(e.fs.hijos.home.tipo === 'dir' && 'respaldo' in (e.fs.hijos.home as any).hijos.alumno.hijos).toBe(false);
  });
});
