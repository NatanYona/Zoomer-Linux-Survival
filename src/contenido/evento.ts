// Evento del dia: Operacion Atajo.
//
// Un taller suelto sobre lo que el scripting te ahorra: alias, el PATH,
// comandos propios en ~/bin y tareas que se hacen solas (misiones 1 a 6), y
// despues scripts que deciden: if, codigos de salida, && y ||, while read
// (misiones 7 a 11). Va como modulo 6 para reusar toda la maquinaria de
// lecciones; la UI lo anuncia con un pop-up de noticias.
//
// Las misiones 1 a 6 arrancan del mundo limpio y las consignas avisan que
// hay que rearmar ~/bin. De la 7 en adelante cada una trae `preparacion`:
// arranca con ~/bin, el PATH y el respaldar de la mision anterior.
import type { Leccion, Modulo } from './esquema';
import { cwdStr, ejecuto } from './esquema';
import type { Estado } from '../motor/tipos';
import { buscarRuta, escribir } from '../motor/vfs';
import { mundoPara } from '../motor/motor';
import { correrLinea } from '../motor/shell';
import { analizarCrontab } from '../motor/cron';

export const EVENTO: Modulo = {
  numero: 6,
  titulo: 'Evento: Operación Atajo',
  corto: 'Evento del día',
  introduccion:
    'El administrador del laboratorio se fue de vacaciones y dejó todo hecho a mano. Hoy aprendés a no repetir nunca más el mismo comando: alias, el PATH, tus propios comandos, tareas que corren solas y scripts que deciden qué hacer.',
  cierre:
    'Ya tenés atajos que sobreviven a la terminal, sabés dónde busca bash los comandos, convertiste un script en un comando más del sistema y lo dejaste corriendo solo con cron. Y tus scripts ya no son una lista de órdenes: revisan antes de actuar, se quejan si los usás mal, avisan si algo falló y procesan archivos línea por línea. Eso es automatizar: escribirlo una vez y no volver a tipearlo.',
  evento: {
    titular: 'Operación Atajo',
    bajada:
      'El sysadmin se fue de vacaciones y dejó todo hecho a mano. Once misiones para automatizarlo: alias, PATH, comandos propios, tareas que se hacen solas y scripts que toman decisiones.',
    // La semana del taller. Para reabrirlo otra semana, alcanza con mover estas fechas.
    desde: '2026-10-12',
    hasta: '2026-10-18',
  },
};

const HOME = '/home/alumno';
const BIN = HOME + '/bin';

function leer(e: Estado, ruta: string): string {
  const n = buscarRuta(ruta, e);
  return n && n.tipo === 'arch' ? n.contenido : '';
}

/** Alguna linea que matchea `luego` se tipeo despues de la primera que matchea `antes`. */
function despues(e: Estado, antes: RegExp, luego: RegExp): boolean {
  const i = e.historial.findIndex((h) => antes.test(h));
  return i >= 0 && e.historial.slice(i + 1).some((h) => luego.test(h));
}

/** Corridas sin error de scripts que viven en ~/bin y se llamaron por su nombre, sin ruta. */
function comandosPropios(e: Estado) {
  return (e.corridas ?? []).filter((c) => {
    if (!c.ruta.startsWith(BIN + '/') || c.codigo !== 0) return false;
    const nombre = c.ruta.slice(BIN.length + 1);
    return e.historial.some((h) => h.trim().split(/\s+/)[0] === nombre);
  });
}

/** Corridas de ~/bin/<nombre> que se llamaron por su nombre, sin ruta (terminen como terminen). */
function porNombre(e: Estado, nombre: string) {
  return (e.corridas ?? []).filter(
    (c) => c.ruta === BIN + '/' + nombre && e.historial.some((h) => h.trim().split(/\s+/)[0] === nombre)
  );
}

/**
 * Corre el script del alumno en un mundo aparte, con otros datos, y devuelve
 * lo que imprimio. Asi el validador comprueba que el script decide de verdad
 * y no que imprime lo que el alumno ya sabia que tenia que salir.
 */
function probar(e: Estado, ruta: string, preparar: (otro: Estado) => void): string {
  const otro = mundoPara();
  correrLinea('mkdir -p ' + ruta.slice(0, ruta.lastIndexOf('/')), otro);
  escribir(ruta, leer(e, ruta), otro);
  preparar(otro);
  const r = correrLinea('bash ' + ruta, otro);
  return r.salida + (r.error ?? '');
}

/** La linea de la salida que nombra a alguien. */
const lineaDe = (salida: string, nombre: string): string => salida.split('\n').find((l) => l.includes(nombre)) ?? '';
const aprobo = (linea: string): boolean => /aprob/i.test(linea) && !/(des|no\s*)aprob/i.test(linea);

// ---- Lo que arrastran las misiones 7 a 11: el respaldar en cada version.
// Van con \n escritos (no saltos reales) porque se instalan con echo -e.

const RESPALDAR_V1 =
  '#!/bin/bash\\nn=0\\nfor f in ~/documentos/*.txt; do\\n  cp $f ~/respaldo/\\n  n=$((n+1))\\ndone\\necho "Respaldo listo: $n archivos"';

const RESPALDAR_V2 =
  '#!/bin/bash\\ndestino=$HOME/respaldo\\nif [ ! -d $destino ]; then\\n  echo "Creando $destino"\\n  mkdir $destino\\nfi\\nn=0\\nfor f in $HOME/documentos/*.txt; do\\n  cp $f $destino/\\n  n=$((n+1))\\ndone\\necho "Respaldo listo: $n archivos"';

const RESPALDAR_V3 =
  '#!/bin/bash\\nif [ $# -eq 0 ]; then\\n  echo "Uso: respaldar carpeta" >&2\\n  exit 1\\nfi\\ndestino=$HOME/respaldo\\nif [ ! -d $destino ]; then\\n  mkdir $destino\\nfi\\nn=0\\nfor f in $1/*.txt; do\\n  cp $f $destino/\\n  n=$((n+1))\\ndone\\necho "Respaldo listo: $n archivos"';

/** ~/bin en el PATH y respaldar instalado, con la version que corresponda. */
const conBin = (respaldar: string): string[] => [
  'mkdir ~/bin',
  `echo -e '${respaldar}' > ~/bin/respaldar`,
  'chmod +x ~/bin/respaldar',
  'export PATH="$PATH:$HOME/bin"',
];

export const LECCIONES_EVENTO: Leccion[] = [
  {
    id: 'ev-l1',
    modulo: 6,
    titulo: 'Tu primer alias',
    concepto: `Hay comandos que escribís cien veces por día. Un **alias** es un apodo: le ponés un nombre corto a un comando largo y bash hace el reemplazo por vos.

Se crea con \`alias nombre='comando'\`. Igual que con las variables, alrededor del \`=\` **no van espacios**. Las comillas simples hacen falta porque el comando tiene espacios adentro: sin ellas, bash cortaría en el primero.

\`alias\` solo, sin nada más, lista todos los que tenés. Y si el apodo no te gusta, \`unalias nombre\` lo borra.`,
    consigna:
      'Creá un alias llamado `ll` que ejecute `ls -la`. Después usalo para ver todo lo que hay en tu carpeta personal, ocultos incluidos.',
    comandoNuevo:
      "alias ll='ls -la'   # crea el atajo ll\nalias               # lista los alias definidos\nunalias ll          # lo borra",
    pista: "Primero `alias ll='ls -la'` (sin espacios alrededor del `=`) y después escribí `ll` solo, como si fuera un comando más.",
    solucion: ["alias ll='ls -la'", 'll'],
    validar: (e) =>
      /\bls\b/.test(e.entorno?.alias?.ll ?? '') && despues(e, /^\s*alias\s+ll=/, /^\s*ll(\s|$)/),
  },
  {
    id: 'ev-l2',
    modulo: 6,
    titulo: 'Que el atajo no se pierda',
    concepto: `Los alias viven en la memoria de la terminal: la cerrás y desaparecen. Para que estén siempre, se guardan en un archivo que bash lee al arrancar. En Ubuntu ese archivo es \`~/.bash_aliases\`: el \`~/.bashrc\` lo carga solo cada vez que abrís una terminal.

Para agregarle una línea sin borrar lo que ya tenga se usa \`>>\`. Con un solo \`>\` lo pisarías entero.

Y para no tener que cerrar y abrir la terminal, \`source archivo\` lo lee y lo ejecuta **en la terminal actual**. Es lo que hace bash al arrancar, pero a mano.`,
    consigna:
      "Guardá en `~/.bash_aliases` un alias llamado `docs` que haga `cd ~/documentos && ls`. Cargalo con `source` y usalo.",
    comandoNuevo:
      "echo \"alias x='...'\" >> ~/.bash_aliases   # agrega una línea al final\nsource ~/.bash_aliases                     # lo carga en esta terminal",
    pista:
      "Ojo con las comillas: las dobles van por fuera y las simples por dentro. `echo \"alias docs='cd ~/documentos && ls'\" >> ~/.bash_aliases`, después `source ~/.bash_aliases` y por último `docs`.",
    solucion: [
      `echo "alias docs='cd ~/documentos && ls'" >> ~/.bash_aliases`,
      'source ~/.bash_aliases',
      'docs',
    ],
    validar: (e) =>
      /(^|\n)\s*alias\s+docs=/.test(leer(e, HOME + '/.bash_aliases')) &&
      e.entorno?.alias?.docs !== undefined &&
      despues(e, /^\s*(source|\.)\s+\S*bash_aliases/, /^\s*docs(\s|$)/) &&
      cwdStr(e) === HOME + '/documentos',
  },
  {
    id: 'ev-l3',
    modulo: 6,
    titulo: '¿Dónde viven los comandos?',
    concepto: `Cuando escribís \`ls\`, bash no sabe de memoria dónde está. Lo busca en una lista de carpetas guardada en la variable **PATH**, separadas por \`:\`, en orden: la primera donde aparece, gana.

\`which ls\` te dice en qué carpeta lo encontró. \`type\` va más allá: también te dice si un nombre es un alias, una función o una **orden interna**, algo que vive adentro de bash y no en un archivo, como \`cd\`.

Por eso para correr un script de la carpeta actual hace falta el \`./\`: la carpeta actual **no** está en el PATH. Y es a propósito. Si estuviera, cualquiera podría dejar en \`/tmp\` un programa trucho llamado \`ls\` y esperar a que entres a mirar.`,
    consigna: 'Mostrá qué carpetas tiene tu PATH. Después preguntale a `which` dónde está `ls` y a `type` qué es `cd`.',
    comandoNuevo:
      'echo $PATH   # las carpetas donde bash busca comandos\nwhich ls     # en cuál de ellas está ls\ntype cd      # qué es: alias, función, interna o programa',
    pista: 'Son tres comandos sueltos: `echo $PATH`, `which ls` y `type cd`. Fijate que `cd` no está en ninguna carpeta.',
    solucion: ['echo $PATH', 'which ls', 'type cd'],
    validar: (e) =>
      ejecuto(e, /^\s*echo\s+.*\$\{?PATH\b/) && ejecuto(e, /^\s*which\s+ls\b/) && ejecuto(e, /^\s*type\s+cd\b/),
  },
  {
    id: 'ev-l4',
    modulo: 6,
    titulo: 'Tu propio comando',
    concepto: `Si un script con permiso de ejecución vive en una carpeta del PATH, deja de ser "un script" y pasa a ser **un comando más**: lo llamás por su nombre, desde cualquier carpeta, sin \`./\` ni ruta.

La costumbre es tener tus comandos en \`~/bin\`, y sin \`.sh\` al final: \`ls\` tampoco se llama \`ls.sh\`. El permiso se puede dar con \`chmod +x\`, que suma la x sin tocar el resto.

Para sumar la carpeta al PATH: \`export PATH="$PATH:$HOME/bin"\`. El \`$PATH\` del principio conserva lo que ya había. Si escribís \`PATH=$HOME/bin\` a secas, lo pisás y te quedás sin \`ls\`, sin \`cat\`, sin nada.`,
    consigna:
      'Creá la carpeta `~/bin` y adentro un script llamado `saludar` (sin `.sh`) que muestre un saludo. Dale permiso de ejecución, sumá `~/bin` al PATH y ejecutalo por su nombre, por ejemplo desde `/tmp`.',
    comandoNuevo:
      'mkdir ~/bin                      # la carpeta para tus comandos\nchmod +x archivo                 # le suma permiso de ejecución\nexport PATH="$PATH:$HOME/bin"    # agrega ~/bin al final del PATH',
    pista:
      'Armá el script con `nano ~/bin/saludar` (`#!/bin/bash` y un `echo`). Después `chmod +x ~/bin/saludar`, `export PATH="$PATH:$HOME/bin"`, `cd /tmp` y escribí `saludar` solo.',
    solucion: [
      'mkdir ~/bin',
      `echo -e '#!/bin/bash\\necho "Hola, soy un comando nuevo"' > ~/bin/saludar`,
      'chmod +x ~/bin/saludar',
      'export PATH="$PATH:$HOME/bin"',
      'cd /tmp',
      'saludar',
    ],
    validar: (e) => comandosPropios(e).some((c) => c.salida.trim() !== ''),
  },
  {
    id: 'ev-l5',
    modulo: 6,
    titulo: 'Automatizá una tarea',
    concepto: `Ahora algo útil de verdad: un **respaldo**. Copiar los archivos importantes a otra carpeta es de esas tareas que nadie hace porque da fiaca. Un comando que lo haga solo sí se usa.

El script junta lo del módulo 5: una variable para contar, un \`for\` que recorre los archivos y un \`echo\` final que avisa qué hizo. Un buen comando siempre te dice algo al terminar: si no, no sabés si anduvo.

\`$((n+1))\` hace la cuenta y \`*.txt\` se expande a todos los archivos que terminan en .txt.`,
    consigna:
      'Creá el comando `respaldar` en `~/bin`: que copie cada `.txt` de `~/documentos` a `~/respaldo` y al final diga cuántos copió. Ejecutalo por su nombre. La terminal arrancó limpia: volvé a crear `~/bin` y a sumarlo al PATH.',
    comandoNuevo:
      'for f in ~/documentos/*.txt; do ...; done   # recorre los .txt\nn=$((n+1))                                  # suma uno al contador',
    pista:
      'El script puede ser: `#!/bin/bash`, `n=0`, `for f in ~/documentos/*.txt; do cp $f ~/respaldo/; n=$((n+1)); done` y `echo "Respaldo listo: $n archivos"`. Acordate de `chmod +x` y del `export PATH`.',
    solucion: [
      'mkdir ~/bin',
      `echo -e '#!/bin/bash\\nn=0\\nfor f in ~/documentos/*.txt; do\\n  cp $f ~/respaldo/\\n  n=$((n+1))\\ndone\\necho "Respaldo listo: $n archivos"' > ~/bin/respaldar`,
      'chmod +x ~/bin/respaldar',
      'export PATH="$PATH:$HOME/bin"',
      'respaldar',
    ],
    validar: (e) =>
      comandosPropios(e).some((c) => c.ruta === BIN + '/respaldar' && /\d/.test(c.salida)) &&
      ['apuntes.txt', 'borrador.txt', 'tarea1.txt', 'tarea2.txt'].every((f) => leer(e, HOME + '/respaldo/' + f) !== ''),
  },
  {
    id: 'ev-l6',
    modulo: 6,
    titulo: 'Que se haga solo',
    concepto: `El último paso de automatizar es no tener que acordarte. Con **cron** (lo viste en el módulo 5) el respaldo corre solo, todos los días, aunque no haya nadie.

La trampa: cron no abre una terminal como la tuya. No lee tu \`.bashrc\` ni tus alias, y arranca con un PATH mínimo, sin \`~/bin\`. Si en el crontab ponés \`respaldar\` a secas, cron no lo encuentra y falla **en silencio**: te enterás el día que necesitás el respaldo.

Por eso en el crontab los comandos van siempre con **ruta absoluta**. En el campo día de la semana, \`1-5\` es de lunes a viernes.`,
    consigna:
      'Programá `respaldar` para que corra de lunes a viernes a las 18:00. Instalá la tarea con `crontab` y revisá con `crontab -l` que haya quedado.',
    comandoNuevo:
      'crontab -e                                # edita tus tareas\n0 18 * * 1-5 /home/alumno/bin/respaldar   # lunes a viernes, 18:00\ncrontab -l                                # muestra lo instalado',
    pista:
      'Minuto `0`, hora `18`, día y mes en `*`, y `1-5` para lunes a viernes. El comando con ruta completa: `0 18 * * 1-5 /home/alumno/bin/respaldar`.',
    solucion: [`echo '0 18 * * 1-5 /home/alumno/bin/respaldar' > ~/tareas.txt`, 'crontab ~/tareas.txt', 'crontab -l'],
    validar: (e) => {
      if (e.crontab === undefined || !ejecuto(e, /^crontab\s+-l\b/)) return false;
      return analizarCrontab(e.crontab).tareas.some(
        (t) =>
          t.campos.join(' ') === '0 18 * * 1-5' &&
          (t.comando === BIN + '/respaldar' || t.comando === '$HOME/bin/respaldar')
      );
    },
  },
  {
    id: 'ev-l7',
    modulo: 6,
    titulo: 'Que no explote',
    concepto: `Alguien borró la carpeta \`~/respaldo\`. Tu \`respaldar\` no se entera: intenta copiar igual y cada \`cp\` falla. Un buen script **revisa antes de actuar**.

Para eso está \`if\`. Con \`[ -d ruta ]\` preguntás si existe un directorio y con \`[ -f ruta ]\`, si existe un archivo. El \`!\` da vuelta la pregunta: \`[ ! -d ruta ]\` es "si **no** existe".

Los espacios después de \`[\` y antes de \`]\` son obligatorios: \`[\` es un comando y lo que va adentro son sus argumentos.

Desde esta misión arrancás con \`~/bin\` en el PATH y el \`respaldar\` de la misión 5 ya instalado.`,
    consigna:
      'Corré `respaldar` y mirá cómo falla sin `~/respaldo`. Después mejoralo con `nano ~/bin/respaldar`: si la carpeta no existe, que la cree y avise. Volvé a correrlo hasta que termine sin errores.',
    comandoNuevo:
      'if [ ! -d carpeta ]; then ...; fi   # si la carpeta NO existe\n[ -d ruta ]                          # ¿existe el directorio?\n[ -f ruta ]                          # ¿existe el archivo?',
    pista:
      'Arriba del `for` agregá `destino=$HOME/respaldo`, después `if [ ! -d $destino ]; then`, adentro `echo "Creando $destino"` y `mkdir $destino`, y cerrá con `fi`. En el `cp`, usá `$destino/` como destino.',
    preparacion: [...conBin(RESPALDAR_V1), 'rmdir ~/respaldo'],
    solucion: [`echo -e '${RESPALDAR_V2}' > ~/bin/respaldar`, 'respaldar'],
    validar: (e) => {
      const guion = leer(e, BIN + '/respaldar');
      return (
        /\bif\b/.test(guion) &&
        /-d\b/.test(guion) &&
        porNombre(e, 'respaldar').some((c) => c.codigo === 0 && c.error === '') &&
        ['apuntes.txt', 'tarea1.txt'].every((f) => leer(e, HOME + '/respaldo/' + f) !== '')
      );
    },
  },
  {
    id: 'ev-l8',
    modulo: 6,
    titulo: 'Modo de uso',
    concepto: `Todo comando termina con un **código de salida**: \`0\` si salió bien, cualquier otro número si algo falló. Lo ves con \`echo $?\` justo después. Los otros programas (y cron, y \`&&\`) se guían por ese número, no por lo que imprimís.

Ahora \`respaldar\` va a recibir la carpeta a respaldar como argumento: \`respaldar ~/documentos\`. ¿Y si alguien lo llama sin nada? Lo correcto es explicar cómo se usa y terminar con error.

\`$#\` es la cantidad de argumentos, así que \`[ $# -eq 0 ]\` pregunta "¿no me pasaron nada?". Con \`>&2\` el mensaje va a la salida de errores, que es donde van las quejas. Y \`exit 1\` corta el script ahí, con código 1.`,
    consigna:
      'Hacé que `respaldar` reciba la carpeta como argumento (en el `for`, `$1` en vez de `$HOME/documentos`). Si no recibe ninguno, que muestre `Uso: respaldar carpeta` y salga con `exit 1`. Probalo con y sin carpeta, y mirá el código de salida con `echo $?`.',
    comandoNuevo:
      '$#          # cantidad de argumentos\nexit 1      # termina el script con error\necho $?     # código de salida del último comando\n>&2         # manda el mensaje a la salida de errores',
    pista:
      'Al principio, después del shebang: `if [ $# -eq 0 ]; then`, `echo "Uso: respaldar carpeta" >&2`, `exit 1`, `fi`. En el `for`, cambiá `$HOME/documentos/*.txt` por `$1/*.txt`. Después probá `respaldar`, `echo $?`, `respaldar ~/documentos` y otra vez `echo $?`.',
    preparacion: conBin(RESPALDAR_V2),
    solucion: [
      `echo -e '${RESPALDAR_V3}' > ~/bin/respaldar`,
      'respaldar 2> /dev/null',
      'echo $?',
      'respaldar ~/documentos',
      'echo $?',
    ],
    validar: (e) => {
      const corridas = porNombre(e, 'respaldar');
      return (
        corridas.some((c) => c.args.length === 0 && c.codigo !== 0 && /uso/i.test(c.salida + c.error)) &&
        corridas.some((c) => c.args.length > 0 && c.codigo === 0) &&
        ejecuto(e, /^\s*echo\s+.*\$\?/)
      );
    },
  },
  {
    id: 'ev-l9',
    modulo: 6,
    titulo: 'Semáforo del servidor',
    concepto: `Un \`if\` decide entre dos caminos. Cuando hay más, se encadenan con **elif** ("si no, si...") y se cierra con **else** ("en cualquier otro caso"). Bash revisa las condiciones en orden y entra **solo en la primera** que se cumple.

Para comparar números: \`-eq\` igual, \`-ne\` distinto, \`-gt\` mayor, \`-ge\` mayor o igual, \`-lt\` menor, \`-le\` menor o igual. Con \`<\` y \`>\` no: esos son redirecciones.

Y para guardar una cuenta en una variable: \`errores=$(grep ERROR archivo | wc -l)\`. El \`grep\` deja solo las líneas con ERROR y \`wc -l\` las cuenta.`,
    consigna:
      'Creá el comando `revisar-log` en `~/bin`. Que cuente las líneas con `ERROR` de `/var/log/sistema.log` y responda como un semáforo: más de 3 es una alerta, de 1 a 3 pide atención y 0 dice que está todo en orden. Ejecutalo por su nombre.',
    comandoNuevo:
      'if ...; then ...; elif ...; then ...; else ...; fi   # varios caminos\n[ $n -gt 3 ]                                     # ¿n es mayor que 3?\nn=$(grep ERROR archivo | wc -l)                  # cuenta las líneas con ERROR',
    pista:
      'Después del shebang: `errores=$(grep ERROR /var/log/sistema.log | wc -l)`. Después `if [ $errores -gt 3 ]; then` con un echo de alerta, `elif [ $errores -gt 0 ]; then` con uno de atención, `else` con "todo en orden", y `fi`. No te olvides del `chmod +x`.',
    preparacion: conBin(RESPALDAR_V3),
    solucion: [
      `echo -e '#!/bin/bash\\nerrores=$(grep ERROR /var/log/sistema.log | wc -l)\\nif [ $errores -gt 3 ]; then\\n  echo "ALERTA: $errores errores en el log"\\nelif [ $errores -gt 0 ]; then\\n  echo "Atención: $errores errores en el log"\\nelse\\n  echo "Todo en orden"\\nfi' > ~/bin/revisar-log`,
      'chmod +x ~/bin/revisar-log',
      'revisar-log',
    ],
    validar: (e) => {
      const ruta = BIN + '/revisar-log';
      const guion = leer(e, ruta);
      if (!/\belif\b/.test(guion) || !/\belse\b/.test(guion)) return false;
      if (!porNombre(e, 'revisar-log').some((c) => c.codigo === 0 && c.salida.trim() !== '')) return false;
      // El mismo script contra logs con 0, 2 y 5 errores: tienen que salir tres respuestas distintas.
      const conErrores = (n: number) =>
        probar(e, ruta, (otro) => {
          const log = buscarRuta('/var/log/sistema.log', otro);
          if (log && log.tipo === 'arch') log.contenido = 'INFO  arranque\n' + 'ERROR algo fallo\n'.repeat(n);
        }).trim();
      const salidas = [0, 2, 5].map(conErrores);
      return salidas.every((x) => x !== '') && new Set(salidas).size === 3;
    },
  },
  {
    id: 'ev-l10',
    modulo: 6,
    titulo: 'Si anda, avisá; si no, gritá',
    concepto: `El código de salida sirve para encadenar comandos sin escribir un \`if\`:

- \`a && b\`: corre \`b\` **solo si** \`a\` salió bien.
- \`a || b\`: corre \`b\` **solo si** \`a\` falló.
- \`a && b || c\`: si \`a\` anda, \`b\`; si no, \`c\`.

Por eso importaba el \`exit 1\` de antes: sin él, \`respaldar\` "saldría bien" aunque no hubiera hecho nada.

Y los errores se pueden guardar. \`2>\` manda la salida de errores a un archivo, y \`2>>\` la agrega al final sin borrar lo que había. Así queda un registro de cada vez que algo falló, que es lo primero que se mira cuando una tarea de cron anda mal.`,
    consigna:
      'Corré `respaldar ~/documentos` encadenado para que diga `Respaldo OK` si anda y `Respaldo FALLÓ` si no. Después provocá la falla llamándolo sin carpeta, mandando el error a `~/errores.log` con `2>>`, y mirá con `cat` que haya quedado guardado.',
    comandoNuevo:
      'a && b               # b solo si a anduvo\na || b               # b solo si a falló\ncomando 2>> archivo  # agrega los errores al final del archivo',
    pista:
      'Primero: `respaldar ~/documentos && echo "Respaldo OK" || echo "Respaldo FALLÓ"`. Después: `respaldar 2>> ~/errores.log || echo "Respaldo FALLÓ"`. Por último: `cat ~/errores.log`.',
    preparacion: conBin(RESPALDAR_V3),
    solucion: [
      'respaldar ~/documentos && echo "Respaldo OK" || echo "Respaldo FALLÓ"',
      'respaldar 2>> ~/errores.log || echo "Respaldo FALLÓ"',
      'cat ~/errores.log',
    ],
    validar: (e) =>
      ejecuto(e, /^\s*respaldar\b.*&&.*\|\|/) &&
      porNombre(e, 'respaldar').some((c) => c.codigo !== 0) &&
      /uso/i.test(leer(e, HOME + '/errores.log')) &&
      despues(e, /2>>\s*\S*errores\.log/, /^\s*(cat|more|less|tail|head)\s+\S*errores\.log/),
  },
  {
    id: 'ev-l11',
    modulo: 6,
    titulo: 'Jefe final: el reporte',
    concepto: `Última misión, y junta todo. El profe te dejó \`~/notas.txt\`: una línea por alumno, con el nombre y la nota separados por un espacio. Quiere saber quién aprobó.

Para recorrer un archivo **línea por línea** se usa \`while read\`: \`while read nombre nota; do ...; done < ~/notas.txt\`. El \`<\` del final le da el archivo al \`while\`. En cada vuelta, \`read\` lee una línea y la reparte entre las variables: la primera palabra va a \`nombre\` y el resto a \`nota\`. Cuando no quedan líneas, el bucle termina.

Adentro va un \`if\` como los de antes, y un contador como el de \`respaldar\`.`,
    consigna:
      'Creá el comando `reporte` en `~/bin`. Que lea `~/notas.txt` y, por cada alumno, muestre si aprobó (nota 7 o más) o si va a recuperatorio. Al final, que diga cuántos aprobaron. Ejecutalo por su nombre.',
    comandoNuevo:
      'while read a b; do ...; done < archivo   # recorre el archivo línea por línea\n[ $nota -ge 7 ]                          # ¿la nota es 7 o más?',
    pista:
      '`aprobados=0`, después `while read nombre nota; do`. Adentro: `if [ $nota -ge 7 ]; then` con `echo "$nombre: aprobado"` y `aprobados=$((aprobados+1))`, `else` con `echo "$nombre: recupera"`, `fi`. Cerrá con `done < ~/notas.txt` y al final `echo "Aprobaron $aprobados"`.',
    preparacion: [...conBin(RESPALDAR_V3), "echo -e 'Ortiz 8\\nSuarez 6\\nMedina 9\\nPaz 4\\nRios 7' > ~/notas.txt"],
    solucion: [
      `echo -e '#!/bin/bash\\naprobados=0\\nwhile read nombre nota; do\\n  if [ $nota -ge 7 ]; then\\n    echo "$nombre: aprobado"\\n    aprobados=$((aprobados+1))\\n  else\\n    echo "$nombre: recupera"\\n  fi\\ndone < ~/notas.txt\\necho "Aprobaron $aprobados"' > ~/bin/reporte`,
      'chmod +x ~/bin/reporte',
      'reporte',
    ],
    validar: (e) => {
      const ruta = BIN + '/reporte';
      if (!/\bwhile\b[\s\S]*\bread\b/.test(leer(e, ruta))) return false;
      if (!porNombre(e, 'reporte').some((c) => c.codigo === 0 && c.error === '')) return false;
      // Otra lista, con un 7 justo en el borde: el script tiene que leer el archivo, no repetir la salida de memoria.
      const salida = probar(e, ruta, (otro) => escribir(HOME + '/notas.txt', 'Ana 10\nLeo 3\nSol 7\n', otro));
      return (
        aprobo(lineaDe(salida, 'Ana')) &&
        aprobo(lineaDe(salida, 'Sol')) &&
        lineaDe(salida, 'Leo') !== '' &&
        !aprobo(lineaDe(salida, 'Leo')) &&
        /\b2\b/.test(salida)
      );
    },
  },
];
