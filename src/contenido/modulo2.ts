// Modulo 2: rutas, copiar, borrar, permisos, comodines y grupos.
import type { Leccion, Modulo } from './esquema';
import { cwdStr, ejecuto } from './esquema';
import { buscarRuta, esDir } from '../motor/vfs';

export const MODULO2: Modulo = {
  numero: 2,
  titulo: 'Archivos, permisos y grupos',
  introduccion:
    'En este modulo dejas de mirar el sistema de archivos desde afuera y empezas a moverlo: copias, borras, y aprendes a leer y cambiar quien puede tocar que. Tambien vas a entender por que en Linux cada archivo tiene un dueno y un grupo, y que significa eso en la practica.',
  cierre:
    'Ya sabes moverte por rutas, copiar y borrar con confianza, y leer los permisos de cualquier archivo con solo mirar `ls -l`. Lo mas importante: entendes que un permiso mal puesto no es un detalle estetico, es la diferencia entre quien puede leer tu trabajo y quien no.',
};

export const LECCIONES_M2: Leccion[] = [
  {
    id: 'm2-l1',
    modulo: 2,
    titulo: 'Rutas absolutas y relativas',
    concepto: `Una ruta absoluta arranca desde la raiz \`/\` y no depende de donde estes parado: \`/home/alumno/documentos\` senala siempre el mismo lugar, la escribas desde donde la escribas. Una ruta relativa arranca desde tu directorio actual, asi que la misma palabra puede significar cosas distintas segun donde estes.

Ahi entran tres atajos que vas a usar todo el tiempo: \`.\` es "aca mismo", \`..\` es "un nivel para arriba", y \`~\` es tu directorio personal sin importar donde estes parado. Las relativas son mas cortas para moverte cerca; las absolutas no fallan nunca, aunque cambies de lugar.`,
    consigna:
      'Desde tu home, entra a `documentos` con una ruta relativa. Volve a tu home usando `..`, y desde ahi entra a `practica` usando `~`.',
    comandoNuevo: '.   # el directorio actual\n..  # el directorio padre\n~   # tu home (/home/alumno)',
    pista: 'Para volver a tu home no hace falta escribir la ruta completa: hay un atajo de un solo caracter.',
    solucion: ['cd documentos', 'cd ..', 'cd ~/practica'],
    validar: (e) => cwdStr(e) === '/home/alumno/practica',
  },
  {
    id: 'm2-l2',
    modulo: 2,
    titulo: 'Copiar archivos',
    concepto: `\`cp\` copia un archivo: el original queda intacto donde estaba, y aparece una segunda copia independiente en el destino. Si despues modificas una, la otra no se entera: son dos archivos separados que por ahora tienen el mismo contenido.

La sintaxis es \`cp origen destino\`. Si el destino es un directorio que existe, la copia entra ahi adentro con el mismo nombre del original; si le das un nombre nuevo, la copia se llama asi.`,
    consigna: 'Copia `~/documentos/tarea1.txt` a tu directorio `~/respaldo`, manteniendo el mismo nombre.',
    comandoNuevo: 'cp origen destino   # copia un archivo; el original queda intacto',
    pista: 'cp necesita dos argumentos: de donde sale el archivo y a donde va. Si el destino es un directorio, el archivo entra ahi con el mismo nombre.',
    solucion: ['cp ~/documentos/tarea1.txt ~/respaldo/'],
    validar: (e) =>
      !!buscarRuta('/home/alumno/respaldo/tarea1.txt', e) && !!buscarRuta('/home/alumno/documentos/tarea1.txt', e),
  },
  {
    id: 'm2-l3',
    modulo: 2,
    titulo: 'Borrar archivos',
    concepto: `\`rm\` borra un archivo. No lo mueve a ningun lado, no lo oculta, no lo marca para revisar despues: lo saca del sistema de archivos.

Esto es distinto a lo que estas acostumbrado si venis de Windows o Mac: ahi borrar manda el archivo a una papelera de la que todavia lo podes rescatar. En Linux no existe ese paso intermedio salvo que vos mismo armes algo parecido. Cuando \`rm\` termina, anda con la certeza de que no hay vuelta atras.`,
    consigna: 'Borra `~/descargas/captura.png` en forma permanente.',
    comandoNuevo: 'rm archivo   # borra un archivo. No hay papelera: es definitivo',
    pista: 'El comando es corto: tres letras, y el argumento es la ruta del archivo que queres hacer desaparecer.',
    solucion: ['rm ~/descargas/captura.png'],
    validar: (e) => !buscarRuta('/home/alumno/descargas/captura.png', e),
  },
  {
    id: 'm2-l4',
    modulo: 2,
    titulo: 'Borrar directorios',
    concepto: `\`rmdir\` borra un directorio, pero solo si esta completamente vacio. Si tiene aunque sea un archivo adentro, \`rmdir\` se niega y devuelve un error.

Esa exigencia no es una limitacion torpe: es una proteccion. Borrar un directorio con contenido significa borrar todo lo que hay adentro, y esa es una decision demasiado grande para que un comando la tome sin que se lo pidas de forma explicita. Si algun dia necesitas borrar un directorio lleno, vas a usar otra herramienta que te obligue a pedirlo a proposito.`,
    consigna: 'Borra el directorio vacio `~/respaldo` con `rmdir`.',
    comandoNuevo: 'rmdir directorio   # borra un directorio, solo si esta vacio',
    pista: 'rmdir necesita que el directorio este vacio; el que tenes que borrar ya lo esta.',
    solucion: ['rmdir ~/respaldo'],
    validar: (e) => !buscarRuta('/home/alumno/respaldo', e),
  },
  {
    id: 'm2-l5',
    modulo: 2,
    titulo: 'Seguridad de archivos',
    concepto: `Cuando corres \`ls -l\`, la primera columna de cada linea es un codigo de diez caracteres que describe los permisos. El primero dice si es un archivo (\`-\`) o un directorio (\`d\`); los otros nueve se leen de a tres: dueno, grupo, y el resto del mundo (otros).

Dentro de cada grupo de tres hay siempre el mismo orden: \`r\` (leer), \`w\` (escribir) y \`x\` (ejecutar, o entrar si es un directorio). Un guion en cualquiera de esas posiciones significa que ese permiso no esta. Por ahora solo estas leyendo: en la proxima leccion vas a aprender a cambiarlos.`,
    consigna:
      'Parado en `~/practica`, ejecuta `ls -l` y fijate en la primera columna que muestra los permisos de `saludo.sh`.',
    comandoNuevo: 'ls -l   # lista con detalle: permisos, dueno, grupo, tamano y nombre',
    pista: 'La primera columna de `ls -l` tiene diez caracteres: el primero indica el tipo, y los otros nueve se agrupan de a tres.',
    solucion: ['cd ~/practica', 'ls -l'],
    validar: (e) => ejecuto(e, /^ls\s+-l\b/),
  },
  {
    id: 'm2-l6',
    modulo: 2,
    titulo: 'Cambiar permisos',
    concepto: `Cada uno de los tres permisos vale un numero: leer vale 4, escribir vale 2, ejecutar vale 1. Sumas los que queres dar y te queda un digito del 0 al 7 para cada grupo: dueno, grupo y otros, en ese orden.

\`chmod 754 archivo\` arma el permiso digito por digito: 7 (4+2+1) le da todo al dueno, 5 (4+1) le da lectura y ejecucion al grupo, y 4 le da solo lectura a los demas. El simulador acepta unicamente esta forma numerica de tres digitos, asi que acostumbrate a pensar en sumas antes de escribir el comando.`,
    consigna:
      'Cambia los permisos de `~/practica/saludo.sh` para que el dueno pueda leer, escribir y ejecutar, el grupo pueda leer y ejecutar, y los demas solo puedan leer.',
    comandoNuevo: 'chmod NNN archivo   # NNN: tres digitos octales, dueno-grupo-otros (r=4 w=2 x=1)',
    pista: 'Cada grupo de permisos es un digito: suma 4 si hay lectura, 2 si hay escritura, 1 si hay ejecucion.',
    solucion: ['chmod 754 ~/practica/saludo.sh'],
    validar: (e) => (buscarRuta('/home/alumno/practica/saludo.sh', e)?.modo ?? 0) === 0o754,
  },
  {
    id: 'm2-l7',
    modulo: 2,
    titulo: 'Comodines',
    concepto: `\`*\` y \`?\` son comodines: patrones que la terminal expande antes de ejecutar el comando. \`*\` representa cualquier cantidad de caracteres (incluido ninguno), asi que \`*.txt\` matchea todos los nombres que terminen en \`.txt\`, sin importar cuanto midan. \`?\` representa exactamente un caracter, y sirve cuando conoces el largo del nombre pero no una letra puntual.

La ventaja es que un solo comando con comodin reemplaza a escribir el mismo comando muchas veces, uno por archivo. \`cp *.txt destino/\` copia todos los \`.txt\` de una, en vez de copiarlos de a uno.`,
    consigna:
      'Copia todos los archivos `.txt` de `~/documentos` a `~/respaldo` en un solo comando, usando un comodin. Despues borra todos los archivos de `~/descargas`, tambien con un comodin.',
    comandoNuevo: '*   # cualquier cantidad de caracteres\n?   # exactamente un caracter',
    pista: '`*.txt` matchea cualquier nombre que termine en .txt; `*` solo, matchea cualquier nombre.',
    solucion: ['cp ~/documentos/*.txt ~/respaldo/', 'rm ~/descargas/*'],
    validar: (e) => {
      const nombres = ['apuntes.txt', 'borrador.txt', 'tarea1.txt', 'tarea2.txt'];
      const copiados = nombres.every((n) => !!buscarRuta(`/home/alumno/respaldo/${n}`, e));
      const sinCsv = !buscarRuta('/home/alumno/respaldo/planilla.csv', e);
      const descargas = buscarRuta('/home/alumno/descargas', e);
      const descargasVacia = esDir(descargas) && Object.keys(descargas.hijos).length === 0;
      return copiados && sinCsv && descargasVacia;
    },
  },
  {
    id: 'm2-l8',
    modulo: 2,
    titulo: 'Grupos',
    concepto: `Todo usuario pertenece a uno o mas grupos, y eso importa porque el permiso de "grupo" en \`ls -l\` no se aplica al dueno ni a cualquiera: se aplica solo a quien este en el grupo dueno de ese archivo. \`groups\` lista los grupos a los que pertenecas; \`id\` muestra lo mismo pero con los numeros (UID y GID) ademas de los nombres.

Por ejemplo, \`/home/valeria/compartido.txt\` es de Valeria, pero su grupo es \`alumnos\`. Vos estas en \`alumnos\` (y tambien en \`so2\`), asi que aunque el archivo no sea tuyo, el permiso de grupo te aplica a vos igual que a ella.`,
    consigna:
      'Ejecuta `groups` para ver tus grupos y `id` para ver tus numeros. Despues lista `/home/valeria` con `ls -l` y fijate en que grupo esta `compartido.txt`.',
    comandoNuevo: 'groups   # lista los grupos del usuario actual\nid       # muestra usuario, UID, grupo primario y grupos secundarios',
    pista: '`id` te muestra el grupo primario y todos los secundarios con sus numeros; `groups` te los muestra solo por nombre.',
    solucion: ['groups', 'id', 'ls -l /home/valeria'],
    validar: (e) => ejecuto(e, /^groups\b/) && ejecuto(e, /^id\b/) && ejecuto(e, /^ls\s+-l\s+\/home\/valeria/),
  },
];
