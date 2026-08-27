// Modulo 4: arboles completos, espacio en disco, procesos y tuberias.
import type { Leccion, Modulo } from './esquema';
import { ejecuto } from './esquema';
import { buscarRuta, esDir } from '../motor/vfs';

export const MODULO4: Modulo = {
  numero: 4,
  titulo: 'Procesos, disco y tuberías',
  introduccion:
    'En este modulo trabajas con arboles completos de archivos, no con archivos sueltos: copiarlos, borrarlos, y entender cuanto espacio ocupan de verdad. Tambien abris la tapa del sistema para ver que procesos estan corriendo, aprendes a terminarlos cuando hace falta, y descubris la idea que sostiene a todo Unix: comandos chicos que se encadenan entre si.',
  cierre:
    'Ya sabes mover arboles enteros con `-r`, medir el espacio con `du` y `df`, leer la tabla de procesos con `ps` y terminarlos con `kill`, y lo mas importante: encadenar comandos con `|` para resolver en una sola linea lo que ningun comando resuelve solo. Con esto cerras la caja de herramientas basica de cualquier terminal Linux.',
};

export const LECCIONES_M4: Leccion[] = [
  {
    id: 'm4-l1',
    modulo: 4,
    titulo: 'Copiar un árbol completo',
    concepto: `\`cp\` sin mas copia un archivo, pero un directorio tiene adentro otros archivos y hasta otros directorios: copiarlo entero requiere que \`cp\` baje nivel por nivel y repita la operacion en cada uno. Para eso existe la bandera \`-r\` (recursivo): le dice a \`cp\` que no se quede en la superficie, sino que entre a cada subdirectorio y copie todo lo que encuentre.

Sin \`-r\`, \`cp\` se niega a tocar un directorio y te lo dice con un error. Con \`-r\`, el destino termina siendo una replica completa del origen: mismos archivos, mismas carpetas, mismo contenido, pero totalmente independiente del original.`,
    consigna: 'Copiá el directorio completo `~/proyecto` (con `src/` y `docs/` adentro) a tu directorio `~/respaldo`.',
    comandoNuevo: 'cp -r origen destino   # copia un directorio completo, con todo lo que tiene adentro',
    pista: '`cp` solo no alcanza para un directorio: necesitás agregarle una bandera que le diga que baje a cada subdirectorio.',
    solucion: ['cp -r ~/proyecto ~/respaldo'],
    validar: (e) => {
      const origenIntacto = !!buscarRuta('/home/alumno/proyecto/src/main.c', e);
      const src = buscarRuta('/home/alumno/respaldo/proyecto/src', e);
      const docs = buscarRuta('/home/alumno/respaldo/proyecto/docs', e);
      return (
        origenIntacto &&
        esDir(src) &&
        esDir(docs) &&
        !!buscarRuta('/home/alumno/respaldo/proyecto/src/main.c', e) &&
        !!buscarRuta('/home/alumno/respaldo/proyecto/docs/leeme.txt', e)
      );
    },
  },
  {
    id: 'm4-l2',
    modulo: 4,
    titulo: 'Cuánto espacio queda',
    concepto: `\`du\` (disk usage) te dice cuanto espacio ocupa un archivo o un directorio puntual: suma el peso de cada archivo que hay adentro, capa por capa, hasta un total. \`df\` (disk free) mira para el otro lado: te dice cuanto espacio libre y ocupado tiene el disco completo donde esta montado el sistema de archivos.

Son dos preguntas distintas que se confunden facil: "cuanto pesa esta carpeta" no es lo mismo que "cuanto lugar me queda en el disco". Podes tener una carpeta liviana y un disco casi lleno igual, porque el disco tiene mil cosas mas aparte de esa carpeta.`,
    consigna: 'Fijate cuánto espacio ocupa tu directorio `~/proyecto` con `du`, y después cuánto espacio libre queda en todo el disco con `df`.',
    comandoNuevo: 'du ruta   # cuanto ocupa un archivo o directorio\ndf         # cuanto espacio libre y ocupado tiene el disco',
    pista: 'Son dos comandos separados: uno recibe una ruta como argumento, el otro no necesita ninguno.',
    solucion: ['du ~/proyecto', 'df'],
    validar: (e) => ejecuto(e, /^du\s+\S*proyecto\b/) && ejecuto(e, /^df\b/),
  },
  {
    id: 'm4-l3',
    modulo: 4,
    titulo: 'Borrar un árbol completo',
    concepto: `Asi como \`cp -r\` copia un arbol completo, \`rm -r\` lo borra completo: entra a cada subdirectorio y elimina todo lo que encuentra, sin pedir confirmacion archivo por archivo. Es la herramienta que faltaba cuando \`rmdir\` se negaba a borrar un directorio con contenido: aca es donde pedis esa decision grande de forma explicita.

Y hay que tomarla en serio: no existe una papelera de la que rescatar lo borrado, ni un "deshacer". Cuando \`rm -r\` termina, el arbol entero desaparecio del sistema de archivos para siempre. Si te equivocaste de carpeta, no hay vuelta atras.`,
    consigna: 'Borrá por completo el directorio `~/proyecto`, con todo lo que tiene adentro, en un solo comando.',
    comandoNuevo: 'rm -r directorio   # borra un directorio completo. No hay papelera: es definitivo',
    pista: 'Es el mismo `rm` que ya conocés, con la misma bandera recursiva que usaste en `cp -r`.',
    solucion: ['rm -r ~/proyecto'],
    validar: (e) => !buscarRuta('/home/alumno/proyecto', e),
  },
  {
    id: 'm4-l4',
    modulo: 4,
    titulo: 'Ver qué está corriendo',
    concepto: `\`ps\` te muestra la tabla de procesos: que esta corriendo en este momento, con que PID (identificador unico), que usuario lo lanzo, cuanto tiempo de CPU lleva consumido y cual es el comando exacto que lo inicio. Es la forma de ver lo que pasa "atras" de la terminal, incluso procesos que no tienen ninguna ventana ni salida visible.

El PID es la llave que vas a necesitar para casi cualquier otra operacion sobre un proceso: pausarlo, investigarlo, terminarlo. Acostumbrate a leerlo de la columna correspondiente antes de actuar sobre un proceso.`,
    consigna: 'Ejecutá `ps` y fijate cuál es el PID del proceso `calcular --intensivo`, que lleva rato consumiendo CPU.',
    comandoNuevo: 'ps   # lista los procesos en ejecucion: PID, usuario, tiempo de CPU y comando',
    pista: '`ps` no necesita ningún argumento; buscá en la salida la fila cuyo comando dice `calcular --intensivo` y mirá su columna PID.',
    solucion: ['ps'],
    validar: (e) => ejecuto(e, /^ps\b/),
  },
  {
    id: 'm4-l5',
    modulo: 4,
    titulo: 'Conectar comandos entre sí',
    concepto: `La **tubería** (\`|\`) toma la salida de un comando y se la entrega al siguiente como entrada, sin pasar por el disco ni por la pantalla.

Esta es la idea central de Unix: comandos chicos que hacen una sola cosa bien, encadenados para resolver algo que ninguno resuelve solo.`,
    consigna: 'Averiguá cuántas líneas del archivo `/var/log/sistema.log` contienen la palabra `ERROR`. No las cuentes a ojo: encadená `grep` con `wc -l`.',
    comandoNuevo: 'comando1 | comando2   # la salida de uno es la entrada del otro',
    pista: 'Probá primero `grep ERROR /var/log/sistema.log` solo, para ver qué devuelve. Después agregale ` | wc -l` al final.',
    solucion: ['grep ERROR /var/log/sistema.log | wc -l'],
    validar: (e) => ejecuto(e, /grep\s+ERROR\s+\S*sistema\.log\s*\|\s*wc\s+-l/),
  },
  {
    id: 'm4-l6',
    modulo: 4,
    titulo: 'Buscar patrones en un archivo',
    concepto: `\`grep\` busca un patron de texto dentro de un archivo y te muestra solo las lineas donde aparece, descartando el resto. La sintaxis basica es \`grep patron archivo\`: nada de recorrer un archivo de miles de lineas a ojo buscando una palabra.

Por defecto \`grep\` distingue mayusculas de minusculas, asi que buscar \`WARN\` no es lo mismo que buscar \`warn\`. Esa precision es justamente lo que lo hace util sobre un archivo como un log del sistema, donde las categorias (INFO, WARN, ERROR) siempre se escriben igual.`,
    consigna: 'Mostrá, usando `grep`, únicamente las líneas de `/var/log/sistema.log` que son advertencias (`WARN`).',
    comandoNuevo: 'grep patron archivo   # muestra solo las lineas del archivo que contienen el patron',
    pista: 'El patrón que buscás esta vez no es `ERROR`, es la otra categoría del log: `WARN`.',
    solucion: ['grep WARN /var/log/sistema.log'],
    validar: (e) => ejecuto(e, /^grep\s+WARN\s+\S*sistema\.log/),
  },
  {
    id: 'm4-l7',
    modulo: 4,
    titulo: 'Terminar un proceso',
    concepto: `\`kill\` manda una senial de terminacion a un proceso, identificado por su PID, no por su nombre. Por defecto esa senial le pide al proceso que cierre de forma prolija, y el proceso deja de existir en la tabla que te muestra \`ps\`.

Pero no podes matar cualquier cosa: un usuario comun solo puede terminar sus propios procesos. Si intentas \`kill\` sobre un proceso que le pertenece a \`root\` (como el demonio de impresion, PID 412) el sistema te contesta "Operacion no permitida". Es una proteccion: si cualquiera pudiera terminar los procesos de cualquiera, el sistema no seria confiable.`,
    consigna: 'Terminá el proceso `calcular --intensivo` (PID 1204), que sigue consumiendo CPU en segundo plano.',
    comandoNuevo: 'kill PID   # termina el proceso con ese PID',
    pista: '`kill` necesita el PID como argumento, no el nombre del comando. Ya lo viste con `ps` en la lección anterior.',
    solucion: ['kill 1204'],
    validar: (e) => e.procesos.find((p) => p.pid === 1204)?.vivo === false,
  },
];
