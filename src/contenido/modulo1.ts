// Modulo 1: moverse por el sistema de archivos.
import type { Leccion, Modulo } from './esquema';
import { cwdStr, ejecuto } from './esquema';
import { buscar } from '../motor/vfs';

export const MODULO1: Modulo = {
  numero: 1,
  titulo: 'El sistema de archivos',
  introduccion:
    'En este modulo vas a aprender a moverte por el sistema de archivos de Linux: como esta organizado, como mirar que hay en cada lugar, y como crear, mover y renombrar directorios y archivos. Al terminar vas a poder orientarte en cualquier terminal sin perderte.',
  cierre:
    'Ya sabes lo basico para moverte con soltura: explorar el arbol, listar, ver contenido, crear directorios, mover y renombrar, cambiar de lugar y saber donde estas en todo momento. De aca en mas todo lo demas se construye sobre estos comandos.',
};

export const LECCIONES_M1: Leccion[] = [
  {
    id: 'm1-l1',
    modulo: 1,
    titulo: 'El árbol de directorios',
    concepto: `En Linux no existe algo como "C:\\" o discos sueltos: todo cuelga de un único punto de partida, la **raíz**, que se escribe \`/\`. A partir de ahí se ramifican los demás directorios (\`bin\`, \`etc\`, \`home\`...) formando un árbol único que contiene absolutamente todo lo que hay en el sistema, sin importar en qué disco físico esté guardado.

Una ruta que empieza con \`/\` es una **ruta absoluta**: describe un camino desde la raíz, sin ambigüedad, sin importar en qué directorio estés parado cuando la escribís. \`ls /\` te deja ver el primer nivel de ese árbol, el punto de partida de cualquier recorrido.`,
    consigna: 'Sin moverte de donde estás, mirá qué hay en la raíz de todo el sistema de archivos.',
    comandoNuevo: 'ls /   # lista el contenido de la raiz',
    pista: 'La raíz se escribe con una sola barra. Pensá cómo le pasarías esa barra como argumento a un comando que ya conocés.',
    solucion: ['ls /'],
    validar: (e) => ejecuto(e, /^\s*ls\s+\/\s*$/) && cwdStr(e) === '/home/alumno',
  },
  {
    id: 'm1-l2',
    modulo: 1,
    titulo: 'Ver lo que hay, incluso lo que no se ve',
    concepto: `La terminal siempre te ubica en algún directorio, el **directorio de trabajo actual**. Todo lo que escribas se interpreta desde ahí.

\`ls\` te muestra el contenido del directorio actual, pero por defecto esconde los archivos que empiezan con punto. Esos son archivos de configuración: existen, pero no te molestan a la vista.`,
    consigna: 'Listá el contenido de tu directorio personal incluyendo los archivos ocultos. Deberías encontrar al menos uno que no aparecía antes.',
    comandoNuevo: 'ls -a   # lista todo, incluidos los archivos ocultos',
    pista: 'Ya usaste `ls`. Agregale la opción y ejecutalo de nuevo desde el mismo lugar.',
    solucion: ['ls -a'],
    validar: (e) => ejecuto(e, /^\s*ls\s+(-\w*a\w*)/) && cwdStr(e) === '/home/alumno',
  },
  {
    id: 'm1-l3',
    modulo: 1,
    titulo: 'Mostrar el contenido de un archivo',
    concepto: `Un archivo no muestra su contenido solo porque \`ls\` lo liste: \`ls\` te dice que existe, nada más. Para leer lo que hay adentro hace falta pedirlo con otro comando.

\`more\` te muestra el archivo pantalla por pantalla, ideal cuando el contenido es largo y no querés que se te escape todo de una vez. \`cat\`, en cambio, tira todo el contenido junto sin pausas: para un archivo cortito como este, cualquiera de los dos te sirve igual.`,
    consigna: 'Mostrá el contenido de bienvenida.txt, el archivo que te recibió en tu directorio personal.',
    comandoNuevo: 'more bienvenida.txt   # muestra el archivo de a pantallas',
    pista: 'El comando va seguido, sin nada raro en el medio, del nombre del archivo que querés ver.',
    solucion: ['more bienvenida.txt'],
    validar: (e) => ejecuto(e, /^\s*more\s+bienvenida\.txt\s*$/) && cwdStr(e) === '/home/alumno',
  },
  {
    id: 'm1-l4',
    modulo: 1,
    titulo: 'Crear directorios',
    concepto: `Los directorios no aparecen solos: alguien los tiene que crear. \`mkdir\` arma uno nuevo, vacío, en el lugar que le indiques — es la forma más básica de empezar a ordenar tus propios archivos en vez de amontonarlos todos sueltos en un mismo lugar.

El directorio donde va a aparecer el nuevo tiene que existir de antemano: \`mkdir\` no inventa el camino completo, solo el último tramo que le pidas.`,
    consigna: 'Creá, dentro de tu directorio personal, un directorio nuevo llamado tareas para ir guardando los ejercicios resueltos.',
    comandoNuevo: 'mkdir tareas   # crea un directorio nuevo',
    pista: 'El nombre que le pongas al comando después de mkdir es el nombre que va a tener el directorio nuevo.',
    solucion: ['mkdir tareas'],
    validar: (e) => {
      const n = buscar(['home', 'alumno', 'tareas'], e);
      return !!n && n.tipo === 'dir';
    },
  },
  {
    id: 'm1-l5',
    modulo: 1,
    titulo: 'Mover y renombrar: dos caras de mv',
    concepto: `\`mv\` hace dos trabajos distintos según cómo lo uses, y ahí está la parte que más confunde al principio. Si el destino es un directorio que ya existe, el archivo entra ahí adentro conservando su nombre: eso es **mover**.

Si en cambio el destino es un nombre que no es un directorio existente, ese nombre pasa a ser el nombre final del archivo: eso es **renombrar**. En el fondo son la misma operación — cambiar dónde vive un archivo y cómo se llama — \`mv\` no distingue una de otra, solo mira qué le diste como destino.`,
    consigna: 'Mové documentos/tarea1.txt a tu directorio practica, manteniendo el nombre. Después, ya adentro de practica, renombralo a resuelta.txt.',
    comandoNuevo: 'mv origen destino/       # mueve el archivo adentro del directorio\nmv origen nuevo-nombre   # renombra (o mueve y renombra a la vez)',
    pista: 'Primero movelo adentro del directorio manteniendo el nombre. Después, ya ahí adentro, movelo de nuevo pero esta vez el destino que le des tiene que ser el nombre nuevo, no un directorio.',
    solucion: ['mv documentos/tarea1.txt practica/', 'mv practica/tarea1.txt practica/resuelta.txt'],
    validar: (e) => {
      const r = buscar(['home', 'alumno', 'practica', 'resuelta.txt'], e);
      return !!r && r.tipo === 'arch'
        && buscar(['home', 'alumno', 'practica', 'tarea1.txt'], e) === null
        && buscar(['home', 'alumno', 'documentos', 'tarea1.txt'], e) === null;
    },
  },
  {
    id: 'm1-l6',
    modulo: 1,
    titulo: 'Moverte por el árbol',
    concepto: `\`cd\` cambia tu directorio de trabajo actual. Le podés dar una ruta relativa (a partir de donde estás) o absoluta (desde la raíz), y hasta podés encadenar varios niveles en un solo \`cd\`, separando los nombres con \`/\`.

Dos atajos te van a ahorrar mucho tipeo: \`..\` es el directorio padre del que estás parado, y \`~\` es tu home, sin importar en qué lugar del árbol te encuentres cuando lo uses.`,
    consigna: 'Desde tu directorio personal, entrá a proyecto/src en un solo paso. Después subí un nivel con .. y, ya en proyecto, saltá directo a tu carpeta practica escribiendo ~/practica.',
    comandoNuevo: 'cd ruta   # cambia el directorio de trabajo actual\ncd ..     # sube al directorio padre\ncd ~      # va directo a tu home',
    pista: 'Podés escribir varios nombres de directorio separados por / en un solo cd. Para subir un nivel existe un atajo de dos puntos, y para ir directo a tu home existe otro de un solo caracter.',
    solucion: ['cd proyecto/src', 'cd ..', 'cd ~/practica'],
    validar: (e) => cwdStr(e) === '/home/alumno/practica',
  },
  {
    id: 'm1-l7',
    modulo: 1,
    titulo: 'Saber dónde estás parado',
    concepto: `Después de encadenar varios \`cd\` es fácil perder la cuenta de dónde terminaste, sobre todo si usaste rutas relativas. El prompt a veces te da una pista, pero no siempre muestra la ruta completa.

\`pwd\` no hace nada más que eso: te devuelve la ruta absoluta del directorio en el que estás parado en este momento, sin dudas ni abreviaturas.`,
    consigna: 'Metete en documentos y, sin asumir nada, confirmá con un comando cuál es la ruta completa en la que estás parado.',
    comandoNuevo: 'pwd   # imprime la ruta absoluta del directorio actual',
    pista: 'Es un comando de una sola palabra, sin argumentos ni opciones.',
    solucion: ['cd documentos', 'pwd'],
    validar: (e) => ejecuto(e, /^\s*pwd\s*$/) && cwdStr(e) === '/home/alumno/documentos',
  },
];
