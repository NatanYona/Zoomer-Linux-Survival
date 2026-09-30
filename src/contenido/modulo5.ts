// Modulo 5: scripts y tareas programadas.
//
// Los validadores de este modulo no miran el historial: miran e.corridas,
// el registro de cada script que se ejecuto (ruta, argumentos, entrada y
// salida). Asi el alumno puede escribir el script como quiera, con nano o
// con echo, y lo que se evalua es que el script haga lo que pide la consigna.
import type { Leccion, Modulo } from './esquema';
import { ejecuto } from './esquema';
import type { Corrida, Estado } from '../motor/tipos';
import { buscarRuta } from '../motor/vfs';
import { analizarCrontab } from '../motor/cron';

export const MODULO5: Modulo = {
  numero: 5,
  titulo: 'Scripts y automatización',
  introduccion:
    'Hasta acá escribiste cada comando a mano. En este módulo los guardás en un archivo y los convertís en un programa: un script. Vas a usar variables, recibir datos, tomar decisiones con if, repetir con for, ordenar el código en funciones y, al final, dejar una tarea programada para que el sistema la ejecute solo.',
  cierre:
    'Ya sabés escribir un script con nano, darle permiso de ejecución y correrlo; guardar datos en variables, recibirlos como argumentos o por tubería con read; decidir con if, repetir con for y ordenar el código en funciones. Y con crontab tus scripts corren solos, aunque no haya nadie frente a la terminal. Eso es lo que hace un administrador de sistemas todos los días.',
};

const HOME = '/home/alumno';

/** Contenido de un archivo, o '' si no existe. */
function leer(e: Estado, ruta: string): string {
  const n = buscarRuta(ruta, e);
  return n && n.tipo === 'arch' ? n.contenido : '';
}

/** Ejecuciones de un script que terminaron sin error. */
function corridasOk(e: Estado, ruta: string, modo?: Corrida['modo']): Corrida[] {
  return (e.corridas ?? []).filter((c) => c.ruta === ruta && c.codigo === 0 && (!modo || c.modo === modo));
}

const SHEBANG = /^#!\s*\/(usr\/)?bin\/(env\s+)?(ba)?sh\b/;

export const LECCIONES_M5: Leccion[] = [
  {
    id: 'm5-l1',
    modulo: 5,
    titulo: 'Ejecutar un script',
    concepto: `Un **script** es un archivo de texto con comandos adentro, uno por línea. Cuando lo ejecutás, bash los corre en orden, como si los tipearas vos. En el módulo 2 ya te cruzaste con uno: \`~/practica/saludo.sh\`.

Para ejecutar un archivo como programa se escribe su ruta: \`./saludo.sh\`. El \`./\` significa "el archivo que está acá". Sin él, bash lo busca entre los comandos del sistema y no lo encuentra.

Pero Linux no ejecuta cualquier archivo: tiene que tener el permiso de ejecución, la **x**. Si le falta, la respuesta es "Permiso denegado". Es la misma protección que viste con \`chmod\`: nada se convierte en programa sin que alguien lo decida.`,
    consigna:
      'Entrá a `~/practica` y ejecutá `saludo.sh` como programa, con `./saludo.sh`. La primera vez va a fallar: leé el error y arreglalo.',
    comandoNuevo:
      './archivo.sh           # ejecuta un script de la carpeta actual\nchmod 755 archivo.sh   # dueño: rwx, grupo y otros: r-x',
    pista:
      'El error dice "Permiso denegado": al archivo le falta la x. Con `chmod 755 saludo.sh` el dueño puede leer, escribir y ejecutar. Después volvé a probar con `./saludo.sh`.',
    solucion: ['cd ~/practica', 'chmod 755 saludo.sh', './saludo.sh'],
    validar: (e) => corridasOk(e, HOME + '/practica/saludo.sh', 'directo').length > 0,
  },
  {
    id: 'm5-l2',
    modulo: 5,
    titulo: 'Tu primer script',
    concepto: `Para escribir un script necesitás un editor. En la terminal el más amable es **nano**: \`nano hola.sh\` abre el archivo (si no existe, lo crea) y te deja escribir. Guardás con **Ctrl+O** y salís con **Ctrl+X**. Si salís con cambios sin guardar, nano te pregunta antes.

Todo script arranca con la misma línea, el **shebang**: \`#!/bin/bash\`. Le dice al sistema qué programa tiene que leer el archivo. Debajo van los comandos, uno por línea.

El archivo nuevo nace sin permiso de ejecución, así que antes de correrlo hace falta el \`chmod\` de la lección anterior.`,
    consigna:
      'Creá con `nano` el archivo `~/hola.sh`. Que empiece con el shebang `#!/bin/bash` y que muestre un saludo con `echo`. Después dale permiso de ejecución y corrélo.',
    comandoNuevo:
      'nano archivo.sh   # abre el editor: Ctrl+O guarda, Ctrl+X sale\n#!/bin/bash       # primera línea de todo script',
    pista:
      'Adentro de nano escribí dos líneas: `#!/bin/bash` y `echo "Hola, mundo"`. Guardá con Ctrl+O, salí con Ctrl+X, y después `chmod 755 hola.sh` y `./hola.sh`.',
    solucion: [`echo -e '#!/bin/bash\\necho "Hola, mundo"' > ~/hola.sh`, 'chmod 755 ~/hola.sh', '~/hola.sh'],
    validar: (e) =>
      SHEBANG.test(leer(e, HOME + '/hola.sh')) &&
      corridasOk(e, HOME + '/hola.sh', 'directo').some((c) => c.salida.trim() !== ''),
  },
  {
    id: 'm5-l3',
    modulo: 5,
    titulo: 'Variables',
    concepto: `Una **variable** guarda un valor para usarlo después. Se crea con \`nombre=valor\` y se lee con un \`$\` adelante: \`$nombre\`. Alrededor del \`=\` no van espacios. Con espacios, bash cree que \`nombre\` es un comando y falla.

Las comillas importan: entre comillas dobles, \`"Hola $nombre"\`, bash reemplaza la variable por su valor. Entre comillas simples, \`'Hola $nombre'\`, imprime todo tal cual, con el signo pesos incluido.

Y lo más útil: \`$(comando)\` se reemplaza por lo que ese comando imprime. Con \`hoy=$(date)\` guardás la fecha en una variable.`,
    consigna:
      'Creá `~/fecha.sh` que guarde la salida del comando `date` en una variable llamada `hoy` y después muestre `Hoy es ` seguido de esa variable. Corrélo.',
    comandoNuevo:
      'nombre="valor"   # guarda un valor (sin espacios alrededor del =)\n$nombre          # usa el valor guardado\nhoy=$(date)      # guarda lo que imprime un comando',
    pista:
      'Después del shebang van dos líneas: `hoy=$(date)` y `echo "Hoy es $hoy"`. Acordate del `chmod` antes de correrlo.',
    solucion: [
      `echo -e '#!/bin/bash\\nhoy=$(date)\\necho "Hoy es $hoy"' > ~/fecha.sh`,
      'chmod 755 ~/fecha.sh',
      '~/fecha.sh',
    ],
    validar: (e) =>
      /\bhoy=\$\(\s*date\b/.test(leer(e, HOME + '/fecha.sh')) &&
      corridasOk(e, HOME + '/fecha.sh').some((c) => c.salida.includes('Hoy es jue 27 ago 2026')),
  },
  {
    id: 'm5-l4',
    modulo: 5,
    titulo: 'Argumentos',
    concepto: `Un script puede recibir datos al ejecutarlo, igual que cualquier comando: en \`./saludar.sh Ana\`, "Ana" es un **argumento**. Adentro del script, el primero llega en \`$1\`, el segundo en \`$2\`, y así.

Hay dos variables especiales más: \`$#\` dice cuántos argumentos llegaron, y \`$0\` es el nombre del propio script. Con \`$#\` podés avisar cuando alguien lo usa mal: si vale 0, no le pasaron nada.`,
    consigna:
      'Creá `~/saludar.sh` que salude al nombre que le pasen como argumento: `./saludar.sh Ana` tiene que mostrar `Hola, Ana`. Probalo con tu nombre.',
    comandoNuevo:
      '$1, $2...   # el primer argumento, el segundo...\n$#          # cuántos argumentos recibió\n$0          # el nombre del script',
    pista:
      'Además del shebang, el script tiene una sola línea: `echo "Hola, $1"`. Lo que escribas después del nombre del script, al correrlo, llega en `$1`.',
    solucion: [`echo -e '#!/bin/bash\\necho "Hola, $1"' > ~/saludar.sh`, 'chmod 755 ~/saludar.sh', '~/saludar.sh Ana'],
    validar: (e) =>
      /\$\{?1\b/.test(leer(e, HOME + '/saludar.sh')) &&
      corridasOk(e, HOME + '/saludar.sh').some((c) => !!c.args[0] && c.salida.includes('Hola, ' + c.args[0])),
  },
  {
    id: 'm5-l5',
    modulo: 5,
    titulo: 'Leer datos con read',
    concepto: `\`read nombre\` lee una línea de la entrada y la guarda en la variable \`nombre\`. Con dos variables, \`read nombre apellido\`, la primera palabra va a la primera y el resto a la segunda.

En una terminal de verdad, \`read\` se queda esperando que escribas. Pero la entrada también puede venir de una **tubería**: \`echo Ana | ./script.sh\` le entrega "Ana" al \`read\` del script sin que nadie tipee nada. Así se automatizan los scripts que hacen preguntas, y así lo vas a usar en esta terminal.`,
    consigna:
      'Creá `~/recibir.sh` que lea un nombre con `read` y muestre `Bienvenido, ` seguido del nombre. Probalo mandándole un nombre por tubería: `echo Ana | ./recibir.sh`.',
    comandoNuevo:
      'read variable              # lee una línea de la entrada y la guarda\necho dato | ./script.sh    # le manda "dato" al read del script',
    pista:
      'Después del shebang: `read nombre` y `echo "Bienvenido, $nombre"`. Para probarlo, `echo Ana | ./recibir.sh`: la tubería le entrega "Ana" a read.',
    solucion: [
      `echo -e '#!/bin/bash\\nread nombre\\necho "Bienvenido, $nombre"' > ~/recibir.sh`,
      'chmod 755 ~/recibir.sh',
      'echo Ana | ~/recibir.sh',
    ],
    validar: (e) =>
      /\bread\b/.test(leer(e, HOME + '/recibir.sh')) &&
      corridasOk(e, HOME + '/recibir.sh').some((c) => {
        const dato = c.entrada.split('\n')[0].trim();
        return dato !== '' && c.salida.includes('Bienvenido, ' + dato);
      }),
  },
  {
    id: 'm5-l6',
    modulo: 5,
    titulo: 'Decidir con if',
    concepto: `\`if\` ejecuta un bloque solo si una condición se cumple. La forma es \`if [ condición ]; then\`, los comandos, un \`else\` opcional para el otro caso y \`fi\` (if al revés) para cerrar.

Los espacios dentro de los corchetes son obligatorios: \`[ -f "$1" ]\` funciona, \`[-f "$1"]\` no. Algunas condiciones que vas a usar mucho:

- \`-f archivo\`: el archivo existe
- \`-d carpeta\`: la carpeta existe
- \`"$a" = "$b"\`: dos textos son iguales
- \`$n -ge 18\`: comparación de números (también \`-eq\`, \`-lt\`, \`-gt\`...)

Poné las variables entre comillas: si vienen vacías, el if no se rompe.`,
    consigna:
      'Creá `~/revisar.sh` que reciba una ruta como argumento y muestre `existe` si es un archivo, o `no existe` si no. Probalo dos veces: con `bienvenida.txt` y con un archivo que no exista.',
    comandoNuevo:
      'if [ condición ]; then ... else ... fi   # decide qué hacer\n[ -f archivo ]                          # verdadero si el archivo existe',
    pista:
      'En nano, una instrucción por línea: `if [ -f "$1" ]; then`, `echo "existe"`, `else`, `echo "no existe"` y `fi`. Después corrélo con `./revisar.sh bienvenida.txt` y con `./revisar.sh fantasma.txt`.',
    solucion: [
      `echo -e '#!/bin/bash\\nif [ -f "$1" ]; then\\n  echo "existe"\\nelse\\n  echo "no existe"\\nfi' > ~/revisar.sh`,
      'chmod 755 ~/revisar.sh',
      '~/revisar.sh bienvenida.txt',
      '~/revisar.sh fantasma.txt',
    ],
    validar: (e) => {
      const src = leer(e, HOME + '/revisar.sh');
      if (!/\bif\b/.test(src) || !/\bfi\b/.test(src)) return false;
      const corridas = corridasOk(e, HOME + '/revisar.sh');
      const dijoExiste = corridas.some((c) => /\bexiste\b/.test(c.salida) && !/no existe/.test(c.salida));
      const dijoNoExiste = corridas.some((c) => /no existe/.test(c.salida));
      return dijoExiste && dijoNoExiste;
    },
  },
  {
    id: 'm5-l7',
    modulo: 5,
    titulo: 'Repetir con for',
    concepto: `\`for\` repite un bloque una vez por cada elemento de una lista. En cada vuelta, la variable toma el valor siguiente. Lo que se repite va entre \`do\` y \`done\`.

La lista puede ser palabras sueltas (\`for fruta in manzana pera\`), un rango (\`for i in {1..5}\`) o, lo más útil, un comodín: \`for f in ~/documentos/*.txt\` recorre cada archivo que termina en \`.txt\`. Así aplicás lo mismo a cien archivos con tres líneas.`,
    consigna:
      'Creá `~/listar.sh` que recorra con `for` todos los archivos `.txt` de `~/documentos` y muestre cada uno precedido de `Archivo: `.',
    comandoNuevo:
      'for x in lista; do ... done   # repite una vez por elemento\nfor i in {1..5}               # del 1 al 5\nfor f in *.txt                # cada archivo .txt de la carpeta',
    pista:
      'Tres líneas después del shebang: `for f in ~/documentos/*.txt; do`, después `echo "Archivo: $f"` y `done` para cerrar.',
    solucion: [
      `echo -e '#!/bin/bash\\nfor f in ~/documentos/*.txt; do\\n  echo "Archivo: $f"\\ndone' > ~/listar.sh`,
      'chmod 755 ~/listar.sh',
      '~/listar.sh',
    ],
    validar: (e) => {
      const src = leer(e, HOME + '/listar.sh');
      if (!/\bfor\b/.test(src) || !/\bdone\b/.test(src)) return false;
      return corridasOk(e, HOME + '/listar.sh').some(
        (c) =>
          ['apuntes.txt', 'borrador.txt', 'tarea1.txt', 'tarea2.txt'].every((a) => c.salida.includes(a)) &&
          (c.salida.match(/Archivo: /g) ?? []).length >= 4 &&
          !c.salida.includes('planilla.csv')
      );
    },
  },
  {
    id: 'm5-l8',
    modulo: 5,
    titulo: 'Funciones',
    concepto: `Una **función** es un bloque de código con nombre que podés llamar las veces que quieras. Se define con \`nombre() {\`, los comandos, y \`}\` para cerrar. Se llama escribiendo su nombre, como si fuera un comando más.

Recibe argumentos igual que un script: adentro, el primero es \`$1\`. Con \`local\` creás variables que solo existen dentro de la función. Y un detalle que confunde: bash lee de arriba hacia abajo, así que la función tiene que estar definida **antes** de la línea que la llama.`,
    consigna:
      'Creá `~/funciones.sh` con una función `saludar` que muestre `Hola, ` y el nombre que recibe. Llamala dos veces en el mismo script: con `Ana` y con `Leo`.',
    comandoNuevo:
      'nombre() { ... }    # define una función\nnombre Ana          # la llama; adentro, "Ana" es $1\nlocal x=1           # variable que solo vive dentro de la función',
    pista:
      'Primero la definición: `saludar() {`, después `echo "Hola, $1"` y `}` para cerrar. Debajo, las dos llamadas: `saludar Ana` y `saludar Leo`.',
    solucion: [
      `echo -e '#!/bin/bash\\nsaludar() {\\n  echo "Hola, $1"\\n}\\nsaludar Ana\\nsaludar Leo' > ~/funciones.sh`,
      'chmod 755 ~/funciones.sh',
      '~/funciones.sh',
    ],
    validar: (e) =>
      /(^|\n)\s*(function\s+saludar\b|saludar\s*\(\s*\))/.test(leer(e, HOME + '/funciones.sh')) &&
      corridasOk(e, HOME + '/funciones.sh').some((c) => c.salida.includes('Hola, Ana') && c.salida.includes('Hola, Leo')),
  },
  {
    id: 'm5-l9',
    modulo: 5,
    titulo: 'Programar tareas con crontab',
    concepto: `**cron** es un servicio que ejecuta comandos en horarios programados, aunque no haya nadie conectado. Cada usuario tiene su lista de tareas, el **crontab**: \`crontab -e\` la abre en nano y \`crontab -l\` la muestra.

Cada línea tiene cinco campos de tiempo y después el comando: minuto, hora, día del mes, mes y día de la semana (0 es domingo). Un \`*\` significa "cualquiera". Por ejemplo, \`0 22 * * * /home/alumno/backup.sh\` corre todos los días a las 22:00.

Dos detalles para que funcione: el comando va con **ruta absoluta**, porque cron no arranca en tu carpeta, y el script tiene que tener permiso de ejecución.`,
    consigna:
      'Programá que `/home/alumno/practica/limpiar.sh` se ejecute todos los domingos a las 3:30 de la mañana. Usá `crontab -e` y después revisá con `crontab -l` que haya quedado instalado.',
    comandoNuevo:
      'crontab -e                    # edita tus tareas (abre nano)\ncrontab -l                    # muestra las tareas instaladas\nmin hora día mes sem comando  # formato de cada línea',
    pista:
      'Primero va el minuto y después la hora: `30 3`. El día del mes y el mes quedan en `*`, y el domingo es `0`. La línea completa es `30 3 * * 0 /home/alumno/practica/limpiar.sh`.',
    solucion: [`echo '30 3 * * 0 /home/alumno/practica/limpiar.sh' > ~/tareas.txt`, 'crontab ~/tareas.txt', 'crontab -l'],
    validar: (e) => {
      if (e.crontab === undefined || !ejecuto(e, /^crontab\s+-l\b/)) return false;
      return analizarCrontab(e.crontab).tareas.some(
        (t) =>
          t.campos.length === 5 &&
          t.campos[0] === '30' &&
          t.campos[1] === '3' &&
          t.campos[2] === '*' &&
          t.campos[3] === '*' &&
          (t.campos[4] === '0' || t.campos[4] === '7') &&
          t.comando === HOME + '/practica/limpiar.sh'
      );
    },
  },
];
