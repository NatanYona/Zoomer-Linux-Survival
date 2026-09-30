// Pruebas del interprete de scripts (shell.ts). Las salidas esperadas de la
// primera parte se sacaron corriendo exactamente los mismos comandos en bash
// real: si el simulador se aparta de bash, falla aca.
import { describe, it, expect } from 'vitest';
import { ejecutar, nuevoEstado } from '../src/motor/motor';
import { buscarRuta } from '../src/motor/vfs';
import { guardarEditor } from '../src/motor/editor';
import { analizarCrontab } from '../src/motor/cron';
import type { Estado } from '../src/motor/tipos';

const correr = (linea: string, e: Estado = nuevoEstado()) => ejecutar(linea, e);
const salida = (linea: string) => {
  const r = correr(linea);
  expect(r.error, linea).toBeUndefined();
  return r.salida;
};
const contenido = (ruta: string, e: Estado) => {
  const n = buscarRuta(ruta, e);
  return n?.tipo === 'arch' ? n.contenido : null;
};
/** Crea un archivo con el texto dado y permisos 755, sin pasar por nano. */
const crear = (e: Estado, ruta: string, texto: string, modo = '755') => {
  guardarEditor({ destino: 'archivo', ruta, contenido: '', nuevo: true }, texto, e);
  ejecutar(`chmod ${modo} ${ruta}`, e);
};

describe('igual que bash', () => {
  const CASOS: [string, string][] = [
    ['x=5; echo $x', '5\n'],
    [`x="hola mundo"; echo "$x"; echo '$x'`, 'hola mundo\n$x\n'],
    ['echo $((3 + 4 * 2)); echo $(( (3+4)*2 )); echo $((10 / 3)) $((10 % 3)) $((2**10))', '11\n14\n3 1 1024\n'],
    ['n=3; n=$((n - 1)); echo $n', '2\n'],
    ['for i in 1 2 3; do echo vuelta $i; done', 'vuelta 1\nvuelta 2\nvuelta 3\n'],
    ['for i in {1..5}; do echo -n "$i "; done; echo', '1 2 3 4 5 \n'],
    ['echo {x,y,z}.txt', 'x.txt y.txt z.txt\n'],
    ['n=3; while [ $n -gt 0 ]; do echo $n; n=$((n-1)); done; echo fin', '3\n2\n1\nfin\n'],
    [
      'edad=15; if [ "$edad" -ge 18 ]; then echo m; elif [ "$edad" -ge 13 ]; then echo adolescente; else echo nene; fi',
      'adolescente\n',
    ],
    ['[ -z "" ] && echo vacio; [ -n "a" ] && echo lleno; [ a = b ] || echo distintos', 'vacio\nlleno\ndistintos\n'],
    ['saludar() { local nombre="$1"; echo "Hola, $nombre"; }; saludar Ana; saludar Leo', 'Hola, Ana\nHola, Leo\n'],
    ['sumar() { echo $(( $1 + $2 )); }; total=$(sumar 8 4); echo "8 + 4 = $total"', '8 + 4 = 12\n'],
    ['echo hola | { read nombre; echo "Bienvenido, $nombre"; }', 'Bienvenido, hola\n'],
    [`echo 'Ana Maria Lopez' | { read a b; echo "[$a] [$b]"; }`, '[Ana] [Maria Lopez]\n'],
    ['x="a   b    c"; echo $x; echo "$x"', 'a b c\na   b    c\n'],
    ['v=""; for i in $v; do echo nunca; done; echo ok', 'ok\n'],
    ['echo -e "L1\\nL2\\tT"', 'L1\nL2\tT\n'],
    [`printf '%s tiene %d años\\n' Ana 20`, 'Ana tiene 20 años\n'],
    ['false; echo $?; true; echo $?', '1\n0\n'],
    ['x=hola; echo ${#x} ${x} ${y:-defecto}', '4 hola defecto\n'],
    [
      'for i in 1 2 3 4 5; do if [ $i -eq 3 ]; then continue; fi; if [ $i -eq 5 ]; then break; fi; echo $i; done',
      '1\n2\n4\n',
    ],
    ['f() { return 3; }; f; echo $?', '3\n'],
    ['! false && echo negado', 'negado\n'],
    ['c=0; for i in {1..10}; do c=$((c + i)); done; echo $c', '55\n'],
    ['echo "$(echo anidado $(echo adentro))"', 'anidado adentro\n'],
    ['[[ "abc123" =~ ^[a-z]+[0-9]+$ ]] && echo coincide', 'coincide\n'],
    [`echo 'a' "b" c\\ d`, 'a b c d\n'],
    ['i=0; until [ $i -ge 3 ]; do echo u$i; i=$((i+1)); done', 'u0\nu1\nu2\n'],
    ['t() { for x in "$@"; do echo "<$x>"; done; echo $#; }; t a b c', '<a>\n<b>\n<c>\n3\n'],
    ['echo $((5 > 3)) $((2 == 3)) $(( 7 - -2 ))', '1 0 9\n'],
  ];
  for (const [cmd, esperado] of CASOS) {
    it(cmd, () => expect(salida(cmd)).toBe(esperado));
  }
});

describe('la terminal recuerda entre lineas', () => {
  it('variables y funciones sobreviven', () => {
    const e = nuevoEstado();
    ejecutar('nombre=Ana', e);
    ejecutar('hola() { echo "hola $1"; }', e);
    expect(ejecutar('hola $nombre', e).salida).toBe('hola Ana\n');
  });
  it('$? es el codigo del comando anterior', () => {
    const e = nuevoEstado();
    ejecutar('ls /nada', e);
    expect(ejecutar('echo $?', e).salida).toBe('1\n');
  });
});

describe('ejecutar scripts', () => {
  it('sin permiso de ejecucion: Permiso denegado', () => {
    const r = correr('./practica/saludo.sh');
    expect(r.error).toBe('bash: ./practica/saludo.sh: Permiso denegado');
  });
  it('con chmod corre y queda registrado', () => {
    const e = nuevoEstado();
    ejecutar('chmod 755 practica/saludo.sh', e);
    ejecutar('cd practica', e);
    const r = ejecutar('./saludo.sh', e);
    expect(r.salida).toBe('hola desde el script\n');
    expect(e.corridas?.[0]).toMatchObject({ ruta: '/home/alumno/practica/saludo.sh', modo: 'directo', codigo: 0 });
  });
  it('bash archivo no necesita permiso de ejecucion', () => {
    const e = nuevoEstado();
    expect(ejecutar('bash practica/saludo.sh', e).salida).toBe('hola desde el script\n');
    expect(e.corridas?.[0].modo).toBe('bash');
  });
  it('sin ./ avisa como correrlo', () => {
    const e = nuevoEstado();
    ejecutar('cd practica', e);
    expect(ejecutar('saludo.sh', e).error).toContain('./saludo.sh');
  });
  it('recibe argumentos', () => {
    const e = nuevoEstado();
    crear(e, '/home/alumno/s.sh', '#!/bin/bash\necho "Hola, $1 ($# args, soy $0)"\n');
    expect(ejecutar('./s.sh Ana Leo', e).salida).toBe('Hola, Ana (2 args, soy ./s.sh)\n');
  });
  it('read toma el dato de la tuberia', () => {
    const e = nuevoEstado();
    crear(e, '/home/alumno/n.sh', '#!/bin/bash\nread -p "Nombre: " nombre\necho "Bienvenido, $nombre"\n');
    expect(ejecutar('echo Ana | ./n.sh', e).salida).toBe('Bienvenido, Ana\n');
    expect(e.corridas?.[0].entrada).toBe('Ana\n');
  });
  it('read sin tuberia explica como pasarle el dato', () => {
    const e = nuevoEstado();
    crear(e, '/home/alumno/n.sh', '#!/bin/bash\nread nombre\necho "[$nombre]"\n');
    const r = ejecutar('./n.sh', e);
    expect(r.salida).toBe('[]\n');
    expect(r.error).toContain('echo Ana | ./script.sh');
  });
  it('las variables del script no se filtran a la terminal', () => {
    const e = nuevoEstado();
    crear(e, '/home/alumno/v.sh', '#!/bin/bash\nsecreto=42\ncd /tmp\n');
    ejecutar('./v.sh', e);
    expect(ejecutar('echo "[$secreto]"', e).salida).toBe('[]\n');
    expect(ejecutar('pwd', e).salida).toBe('/home/alumno\n');
  });
  it('exit corta el script con su codigo', () => {
    const e = nuevoEstado();
    crear(e, '/home/alumno/x.sh', '#!/bin/bash\necho antes\nexit 3\necho despues\n');
    expect(ejecutar('./x.sh; echo $?', e).salida).toBe('antes\n3\n');
  });
  it('los errores dicen el script y la linea', () => {
    const e = nuevoEstado();
    crear(e, '/home/alumno/m.sh', '#!/bin/bash\necho uno\nvolar\n');
    expect(ejecutar('./m.sh', e).error).toBe('./m.sh: línea 3: volar: orden no encontrada');
  });
  it('un error de sintaxis tambien marca la linea', () => {
    const e = nuevoEstado();
    crear(e, '/home/alumno/m.sh', '#!/bin/bash\nif [ 1 -eq 1 ]; then\n  echo si\n');
    expect(ejecutar('./m.sh', e).error).toMatch(/^\.\/m\.sh: línea \d+: se esperaba «fi»/);
  });
  it('un bucle infinito se corta en vez de colgar la pagina', () => {
    const e = nuevoEstado();
    crear(e, '/home/alumno/loop.sh', '#!/bin/bash\nn=1\nwhile [ $n -gt 0 ]; do\n  echo x > /dev/null\ndone\n');
    expect(ejecutar('./loop.sh', e).error).toContain('bucle');
  });
  it('shebang de otro lenguaje: interprete erroneo', () => {
    const e = nuevoEstado();
    crear(e, '/home/alumno/p.py', '#!/usr/bin/python3\nprint(1)\n');
    expect(ejecutar('./p.py', e).error).toContain('intérprete erróneo');
  });
});

describe('errores didacticos', () => {
  it('espacios alrededor del = sugieren la forma correcta', () => {
    expect(correr('nombre = Ana').error).toContain('nombre=valor');
  });
  it('corchete sin espacio', () => {
    expect(correr('x=1; [ $x -eq 1]').error).toContain('falta el «]»');
  });
  it('corchete pegado a la variable', () => {
    expect(correr('x=1; [$x -eq 1 ]').error).toContain('después de [ va un espacio');
  });
  it('texto donde va un numero', () => {
    expect(correr('[ veinte -ge 18 ]').error).toContain('se esperaba una expresión entera');
  });
  it('un if a medias en la terminal explica el ;', () => {
    expect(correr('if [ 1 -eq 1 ]').error).toContain('separado con punto y coma');
  });
});

describe('redirecciones', () => {
  it('2>&1 junta los errores con la salida', () => {
    const e = nuevoEstado();
    ejecutar('ls /nada > /tmp/log.txt 2>&1', e);
    expect(contenido('/tmp/log.txt', e)).toContain('No existe');
  });
  it('/dev/null descarta', () => {
    const r = correr('ls /nada 2> /dev/null');
    expect(r.error).toBeUndefined();
  });
  it('>&2 manda la salida a los errores', () => {
    const r = correr('echo problema >&2');
    expect(r.salida).toBe('');
    expect(r.error).toBe('problema');
  });
  it('no se puede escribir en una carpeta ajena', () => {
    expect(correr('echo x > /etc/nuevo.txt').error).toContain('Permiso denegado');
  });
  it('< lee un archivo como entrada', () => {
    expect(salida('wc -l < /var/log/sistema.log').trim()).toBe('10');
  });
});

describe('nano y crontab', () => {
  it('nano pide abrir el editor con el contenido', () => {
    const r = correr('nano practica/saludo.sh');
    expect(r.editor).toMatchObject({ destino: 'archivo', ruta: '/home/alumno/practica/saludo.sh', nuevo: false });
    expect(r.editor?.contenido).toContain('#!/bin/bash');
  });
  it('nano de un archivo nuevo', () => {
    expect(correr('nano hola.sh').editor).toMatchObject({ ruta: '/home/alumno/hola.sh', contenido: '', nuevo: true });
  });
  it('guardar desde el editor crea el archivo con salto final', () => {
    const e = nuevoEstado();
    const g = guardarEditor({ destino: 'archivo', ruta: '/home/alumno/a.sh', contenido: '', nuevo: true }, 'echo hi', e);
    expect(g.ok).toBe(true);
    expect(g.mensaje).toBe('[ 1 línea escrita ]');
    expect(contenido('/home/alumno/a.sh', e)).toBe('echo hi\n');
  });
  it('guardar en /etc no se puede', () => {
    const g = guardarEditor({ destino: 'archivo', ruta: '/etc/hostname', contenido: '', nuevo: false }, 'x', nuevoEstado());
    expect(g.ok).toBe(false);
    expect(g.mensaje).toContain('Permiso denegado');
  });
  it('crontab -l sin tareas', () => {
    expect(correr('crontab -l').error).toBe('no hay crontab para alumno');
  });
  it('crontab -e abre el editor con la plantilla', () => {
    expect(correr('crontab -e').editor?.destino).toBe('crontab');
  });
  it('crontab archivo instala y -l lo muestra', () => {
    const e = nuevoEstado();
    ejecutar(`echo '30 3 * * 0 /home/alumno/limpiar.sh' > t.txt`, e);
    expect(ejecutar('crontab t.txt', e).error).toBeUndefined();
    expect(ejecutar('crontab -l', e).salida).toBe('30 3 * * 0 /home/alumno/limpiar.sh\n');
    ejecutar('crontab -r', e);
    expect(e.crontab).toBeUndefined();
  });
  it('crontab rechaza una hora imposible', () => {
    const e = nuevoEstado();
    ejecutar(`echo '0 25 * * * /x.sh' > t.txt`, e);
    expect(ejecutar('crontab t.txt', e).error).toContain('hora');
    expect(e.crontab).toBeUndefined();
  });
  it('el analizador entiende rangos, pasos y listas', () => {
    const a = analizarCrontab('# comentario\n*/15 8-18 * * 1-5 /a.sh\n0 9,14 1 */2 0 /b.sh\n@reboot /c.sh\n');
    expect(a.errores).toEqual([]);
    expect(a.tareas.map((t) => t.comando)).toEqual(['/a.sh', '/b.sh', '/c.sh']);
  });
  it('faltan campos', () => {
    expect(analizarCrontab('30 3 * /x.sh').errores[0]).toContain('faltan campos');
  });
});
