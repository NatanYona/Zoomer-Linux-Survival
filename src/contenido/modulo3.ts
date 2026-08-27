// Modulo 3: diagnostico, busqueda, redireccion y la cola de impresion.
import type { Leccion, Modulo } from './esquema';
import { cwdStr, ejecuto } from './esquema';
import { buscarRuta } from '../motor/vfs';

export const MODULO3: Modulo = {
  numero: 3,
  titulo: 'Diagnostico, busqueda e impresion',
  introduccion:
    'En este modulo dejas de limitarte a los comandos basicos y sumas herramientas para orientarte solo: leer el manual de cualquier comando, saber quien sos y quien mas esta en el sistema, y encontrar un archivo perdido sin recorrer carpeta por carpeta. Tambien aprendes a guardar la salida de un comando en un archivo en vez de solo mirarla en pantalla, y a manejar una cola de trabajos real con la impresora del laboratorio.',
  cierre:
    'Ya sabes consultar el manual de un comando que no conoces, identificar tu usuario y quien mas esta conectado, buscar un archivo en todo un arbol de directorios, concatenar y redirigir salidas, y manejar una cola de trabajos de principio a fin: encolar, consultar y cancelar. Ese ultimo modelo, el de la cola, lo vas a volver a encontrar en todo tipo de sistemas, mucho mas alla de esta impresora.',
};

export const LECCIONES_M3: Leccion[] = [
  {
    id: 'm3-l1',
    modulo: 3,
    titulo: 'Tu directorio personal',
    concepto: `Cuando entras al sistema como \`alumno\`, arrancas parado en \`/home/alumno\`: ese es tu directorio personal, el lugar donde vive todo lo tuyo (documentos, descargas, configuracion) y donde tenes permiso de escribir sin pedirle nada a nadie. No es un lugar especial para el sistema operativo, es una carpeta mas dentro de \`/home\`, pero es la que te toca a vos.

El atajo \`~\` es una forma corta de escribir esa ruta completa: lo podes usar en cualquier comando, estes donde estes parado, y siempre apunta a \`/home/alumno\`. Y como el laboratorio tiene mas de un usuario, tambien existe \`/home/valeria\`: cada cuenta tiene su propio directorio dentro de \`/home\`, separado del resto.`,
    consigna:
      'Movete a `/tmp`, despues volve a tu directorio personal usando el atajo `~`, y por ultimo entra al directorio personal de Valeria con su ruta absoluta.',
    comandoNuevo: '~   # atajo a tu directorio personal, funciona sin importar donde estes parado',
    pista: 'El atajo `~` funciona desde cualquier lugar; y el home de otro usuario se llama igual que su nombre de usuario, dentro de `/home`.',
    solucion: ['cd /tmp', 'cd ~', 'cd /home/valeria'],
    validar: (e) => cwdStr(e) === '/home/valeria',
  },
  {
    id: 'm3-l2',
    modulo: 3,
    titulo: 'Leer una pagina de manual',
    concepto: `Cada comando de Linux trae su propio manual incorporado, y \`man\` es la forma de leerlo sin salir de la terminal ni buscar nada afuera. La pagina se organiza siempre con las mismas secciones: **NOMBRE** dice en una linea que hace el comando, **SINOPSIS** muestra la forma exacta de escribirlo, **DESCRIPCION** lo explica con mas detalle, y **OPCIONES** lista cada bandera con su significado.

Acostumbrate a mirar el manual antes de adivinar una opcion o buscarla en otro lado: esta ahi mismo, describe exactamente lo que tu version del comando hace, y es el mismo recurso al que vas a recurrir con cualquier comando nuevo que te cruces de aca en adelante.`,
    consigna:
      'Abri la pagina de manual de `ls` y fijate como estan organizadas las secciones NOMBRE, SINOPSIS, DESCRIPCION y OPCIONES.',
    comandoNuevo: 'man comando   # abre el manual de un comando: que hace, como se usa, que opciones acepta',
    pista: 'El comando toma un solo argumento: el nombre del comando que queres consultar.',
    solucion: ['man ls'],
    validar: (e) => ejecuto(e, /^man\s+ls\b/),
  },
  {
    id: 'm3-l3',
    modulo: 3,
    titulo: 'Quien sos en el sistema',
    concepto: `\`whoami\`, \`id\` y \`who\` suenan parecidos pero contestan preguntas distintas. \`whoami\` es el mas simple: imprime unicamente tu nombre de usuario, nada mas. \`id\` te da tu identidad completa: tu usuario, tu UID, tu grupo primario y la lista de grupos secundarios a los que pertenecs, todo con sus numeros.

\`who\`, en cambio, no habla de vos en particular: lista que usuarios tienen una sesion abierta en el sistema en este momento, sea la tuya o la de cualquier otro. Los tres sirven para orientarte, pero mientras \`whoami\` e \`id\` te hablan de tu propia cuenta, \`who\` te muestra una foto de todo el sistema.`,
    consigna: 'Ejecuta `whoami`, `id` y `who`, en ese orden, y compara que te dice cada uno.',
    comandoNuevo:
      'whoami   # tu nombre de usuario, nada mas\nid       # tu usuario, tu UID, tu grupo primario y tus grupos secundarios\nwho      # que usuarios tienen una sesion abierta en el sistema',
    pista: 'Son tres comandos distintos, sin argumentos; cada uno contesta una pregunta distinta sobre quien.',
    solucion: ['whoami', 'id', 'who'],
    validar: (e) => ejecuto(e, /^whoami\b/) && ejecuto(e, /^id\b/) && ejecuto(e, /^who\b/),
  },
  {
    id: 'm3-l4',
    modulo: 3,
    titulo: 'Buscar un archivo perdido',
    concepto: `\`ls\` te muestra el contenido de un directorio, pero solo ese nivel: si el archivo que buscas esta dos carpetas mas abajo, \`ls\` no te lo va a mostrar salvo que entres ahi vos mismo. \`find\` resuelve justamente eso: recorre un directorio y todos sus subdirectorios, cuantos niveles tenga, buscando algo que coincida con el patron que le pidas.

La sintaxis basica es \`find ruta -name patron\`: \`ruta\` es desde donde arranca a buscar, y \`patron\` es el nombre que tiene que matchear. Es la herramienta para cuando sabes el nombre de un archivo pero no te acordas en que carpeta lo dejaste, en vez de ir abriendo carpeta por carpeta a mano.`,
    consigna:
      'No te acordas en que subdirectorio de `~/proyecto` dejaste `util.c`. Buscalo con `find`, arrancando la busqueda en `~/proyecto`.',
    comandoNuevo: 'find ruta -name patron   # recorre ruta y sus subdirectorios buscando el nombre indicado',
    pista: '`find` necesita dos cosas: desde donde arrancar a buscar, y que nombre buscar despues de `-name`.',
    solucion: ['find ~/proyecto -name util.c'],
    validar: (e) => ejecuto(e, /^find\s+\S+\s+-name\s+util\.c\b/),
  },
  {
    id: 'm3-l5',
    modulo: 3,
    titulo: 'Por que cat se llama "cat"',
    concepto: `\`cat\` viene de "concatenate": concatenar, unir cosas en fila. Cuando le pasas un solo archivo, el resultado de concatenar ese unico archivo es el archivo entero, asi que parece que \`cat\` solo "muestra" el contenido, pero eso es apenas el caso mas simple de lo que hace en realidad.

La diferencia se nota cuando le pasas dos o mas archivos: \`cat\` no los muestra por separado, uno tras otro con un aviso en el medio, sino que pega el contenido del segundo justo donde termina el primero, como si fueran uno solo. Por eso el orden en que escribis los argumentos importa: cambia el orden y cambia el resultado.`,
    consigna:
      'Concatena `documentos/tarea1.txt` y `documentos/tarea2.txt` en una sola salida, pasandoselos a `cat` como dos argumentos en ese orden.',
    comandoNuevo: 'cat archivo1 archivo2   # concatena el contenido de todos los archivos, uno detras del otro',
    pista: '`cat` acepta mas de un archivo en la misma linea; los concatena en el orden en que se los diste.',
    solucion: ['cat documentos/tarea1.txt documentos/tarea2.txt'],
    validar: (e) => ejecuto(e, /^cat\s+documentos\/tarea1\.txt\s+documentos\/tarea2\.txt\b/),
  },
  {
    id: 'm3-l6',
    modulo: 3,
    titulo: 'Guardar la salida en vez de mirarla',
    concepto: `Hasta acá todo comando escribió su resultado en la pantalla. El operador \`>\` lo desvía a un archivo.

Ojo con la diferencia: \`>\` **pisa** el archivo destino sin preguntar, y \`>>\` **agrega** al final. Confundirlos es una de las formas más rápidas de perder trabajo en una terminal.`,
    consigna: 'Guardá el listado de `~/documentos` en un archivo llamado `~/respaldo/indice.txt`, y después agregale al final el listado de `~/descargas`.',
    comandoNuevo: 'comando > archivo    # pisa\ncomando >> archivo   # agrega al final',
    pista: 'Son dos comandos. El primero con `>`, el segundo con `>>` sobre el mismo archivo destino.',
    solucion: ['ls ~/documentos > ~/respaldo/indice.txt', 'ls ~/descargas >> ~/respaldo/indice.txt'],
    validar: (e) => {
      const n = buscarRuta('/home/alumno/respaldo/indice.txt', e);
      return !!n && n.tipo === 'arch' && n.contenido.includes('apuntes.txt') && n.contenido.includes('manual.pdf');
    },
  },
  {
    id: 'm3-l7',
    modulo: 3,
    titulo: 'Mandar algo a la impresora',
    concepto: `\`lp\` es el comando que manda un archivo a la impresora del laboratorio, pero no imprime al toque: lo que hace es encolar un trabajo. El archivo entra a una fila de espera (la cola de impresion) y desde ahi el sistema se encarga de sacarlo cuando le toca el turno.

Cada trabajo que entra a la cola recibe un identificador propio, con el formato \`laser-NN\`, que arranca en 42 y va subiendo de a uno. Ese id es lo que vas a necesitar despues para preguntar por ese trabajo puntual o para bajarlo de la cola, asi que no es un detalle menor: es la forma de referirte a ese trabajo en particular en medio de una fila que puede tener varios.`,
    consigna: 'Manda a imprimir `documentos/apuntes.txt` con `lp`.',
    comandoNuevo: 'lp archivo   # encola el archivo en la impresora del laboratorio; devuelve un id de trabajo (laser-NN)',
    pista: 'El comando es `lp` seguido, sin nada mas, de la ruta del archivo.',
    solucion: ['lp documentos/apuntes.txt'],
    validar: (e) =>
      e.colaImpresion.length === 1 &&
      e.colaImpresion[0].id.startsWith('laser-') &&
      e.colaImpresion[0].archivo.includes('apuntes.txt'),
  },
  {
    id: 'm3-l8',
    modulo: 3,
    titulo: 'Consultar la cola de impresion',
    concepto: `Encolar un trabajo con \`lp\` no te dice nada sobre lo que ya estaba esperando antes. \`lpstat\` es el comando que te muestra el estado completo de la cola: que trabajos hay pendientes en este momento, sin sacar ni modificar nada, solo mirar.

Es el paso natural entre encolar algo y decidir si hace falta actuar sobre eso: antes de cancelar un trabajo (lo que viene en la proxima leccion) primero necesitas saber que trabajos hay y cual es cual. Consultar antes de actuar es un habito que te va a servir para cualquier cola de trabajos, no solo para esta impresora.`,
    consigna:
      'Manda a imprimir `documentos/apuntes.txt` y `documentos/planilla.csv`, y despues consulta el estado de la cola con `lpstat`.',
    comandoNuevo: 'lpstat   # muestra los trabajos que estan esperando en la cola de impresion',
    pista: 'Primero encola los dos archivos con `lp`, uno por uno; `lpstat` va sin argumentos.',
    solucion: ['lp documentos/apuntes.txt', 'lp documentos/planilla.csv', 'lpstat'],
    validar: (e) => e.colaImpresion.length === 2 && ejecuto(e, /^lpstat\b/),
  },
  {
    id: 'm3-l9',
    modulo: 3,
    titulo: 'Cancelar un trabajo de impresion',
    concepto: `\`cancel\` saca un trabajo de la cola de impresion antes de que se llegue a imprimir, identificandolo por su id: el mismo que te devolvio \`lp\` al encolarlo, o el que ves si corres \`lpstat\`. Borrar el archivo original de tu carpeta no le hace nada a la copia que ya esta encolada, porque son dos cosas independientes una vez que el trabajo entro a la cola.

Con esta leccion cerras el modelo completo de una cola de trabajos: \`lp\` para encolar, \`lpstat\` para consultar que hay, y \`cancel\` para sacar algo antes de que se ejecute. Ese modelo se repite en un monton de sistemas mas alla de una impresora, asi que vale mas por la logica que por el papel que sale al final.`,
    consigna:
      'Manda a imprimir `documentos/borrador.txt` y, antes de que salga, sacalo de la cola con `cancel` usando el id que te devolvio `lp`.',
    comandoNuevo: 'cancel id   # saca de la cola el trabajo con ese id',
    pista: 'El primer trabajo que se encola en una cola vacia tiene el id `laser-42`.',
    solucion: ['lp documentos/borrador.txt', 'cancel laser-42'],
    validar: (e) => e.colaImpresion.length === 0 && ejecuto(e, /^cancel\s+laser-42\b/),
  },
];
