// CONTRATO COMPARTIDO. No modificar sin avisar al orquestador.
import type { Quiz } from './esquema';

export const QUIZZES: Quiz[] = [
  {
    modulo: 1,
    preguntas: [
      {
        enunciado: '¿Qué contiene tipicamente el directorio /etc en un sistema Linux?',
        opciones: [
          'Los archivos de configuracion del sistema, como /etc/hostname',
          'Los archivos personales de cada usuario, como sus documentos',
          'Los programas ejecutables que arrancan el sistema',
          'Los procesos que estan corriendo en este momento',
        ],
        correcta: 0,
        explicacion:
          '/etc guarda la configuracion del sistema completo, no de un usuario en particular. Ahi conviven cosas como el nombre del equipo (hostname) o la lista de usuarios (passwd).',
      },
      {
        enunciado: '¿Qué diferencia hay entre ls y ls -a?',
        opciones: [
          'ls -a lista los archivos en orden alfabetico y ls los lista en el orden en que fueron creados',
          'ls -a muestra el tamaño en bytes de cada archivo y ls no',
          'ls -a muestra tambien los archivos y directorios ocultos, los que arrancan con un punto',
          'ls -a solo puede usarse en el directorio personal, ls en cualquier lado',
        ],
        correcta: 2,
        explicacion:
          'En Linux un archivo se considera oculto si su nombre arranca con un punto, como .perfil en tu directorio personal. ls solo, sin la opcion, los deja afuera del listado.',
      },
      {
        enunciado:
          'Estás en /home/alumno y querés ver el contenido del directorio documentos sin moverte de donde estás. ¿Qué comando usarías?',
        opciones: ['cd documentos', 'ls documentos', 'pwd documentos', 'more documentos'],
        correcta: 1,
        explicacion:
          'ls acepta una ruta como argumento y lista lo que hay ahi sin necesidad de moverte. cd te hubiera cambiado de directorio, que no era lo que se pedia.',
      },
      {
        enunciado:
          'Tenés el archivo tarea1.txt en documentos y querés cambiarle el nombre a tarea1_final.txt. ¿Qué comando hace eso?',
        opciones: [
          'cp tarea1.txt tarea1_final.txt',
          'ls tarea1.txt tarea1_final.txt',
          'mkdir tarea1_final.txt',
          'mv tarea1.txt tarea1_final.txt',
        ],
        correcta: 3,
        explicacion:
          'mv mueve o renombra segun el caso: si el destino queda en el mismo directorio pero con otro nombre, el resultado es un renombre. cp hubiera dejado los dos archivos, duplicando el contenido en vez de renombrarlo.',
      },
      {
        enunciado:
          'Querés leer /var/log/sistema.log, que tiene varias lineas, de a una pantalla por vez en lugar de que se desborde todo junto en la terminal. ¿Qué comando usarías?',
        opciones: [
          'more /var/log/sistema.log',
          'cat /var/log/sistema.log',
          'mkdir /var/log/sistema.log',
          'mv /var/log/sistema.log',
        ],
        correcta: 0,
        explicacion:
          'more muestra el contenido pantalla por pantalla, esperando que vos avances. cat en cambio tira todo el archivo de una sola vez, comodo para uno corto pero incomodo para un log largo.',
      },
      {
        enunciado: 'Te perdiste en la terminal y no sabés en que directorio estás parado. ¿Qué comando te lo muestra?',
        opciones: ['cd', 'ls -a', 'pwd', 'mkdir .'],
        correcta: 2,
        explicacion:
          'pwd (print working directory) imprime la ruta absoluta del directorio en el que estás parado. cd sin argumentos te manda a tu directorio personal, no te informa donde estabas antes.',
      },
    ],
  },
  {
    modulo: 2,
    preguntas: [
      {
        enunciado: '¿Qué diferencia hay entre una ruta absoluta y una ruta relativa?',
        opciones: [
          'Una ruta relativa siempre arranca con / y la absoluta no',
          'No hay diferencia real, ambas apuntan siempre al mismo lugar',
          'Una ruta absoluta arranca desde la raiz / y una relativa se interpreta desde el directorio en el que estás parado',
          'Una ruta absoluta solo sirve dentro del directorio personal',
        ],
        correcta: 2,
        explicacion:
          'Por ejemplo /home/alumno/documentos siempre apunta al mismo lugar sin importar donde estés parado, mientras que documentos solo funciona si ya estás dentro de /home/alumno.',
      },
      {
        enunciado:
          'Estás parado en /home/alumno y querés dejar una copia de documentos/planilla.csv dentro de respaldo, sin borrar el original. ¿Qué comando usás?',
        opciones: [
          'cp documentos/planilla.csv respaldo/',
          'mv documentos/planilla.csv respaldo/',
          'rm documentos/planilla.csv respaldo/',
          'cp respaldo/ documentos/planilla.csv',
        ],
        correcta: 0,
        explicacion:
          'cp copia y deja el archivo original intacto en el lugar de origen. mv en cambio lo hubiera movido, dejando documentos sin el archivo.',
      },
      {
        enunciado: 'Ya resolviste tarea2.txt y querés borrarlo del todo. ¿Qué comando usás?',
        opciones: [
          'rmdir documentos/tarea2.txt',
          'mv documentos/tarea2.txt',
          'cp documentos/tarea2.txt',
          'rm documentos/tarea2.txt',
        ],
        correcta: 3,
        explicacion:
          'rm borra archivos. rmdir esta pensado solo para directorios vacios: si lo apuntas a un archivo, va a fallar.',
      },
      {
        enunciado:
          'El archivo /home/valeria/compartido.txt pertenece a Valeria, tiene permisos -rw-r--r-- y su grupo es alumnos. Vos sos alumno y tambien pertenecés al grupo alumnos. ¿Podés leer ese archivo?',
        opciones: [
          'No, porque no sos el dueño del archivo',
          'Si, porque los permisos de grupo incluyen lectura y vos pertenecés al grupo alumnos',
          'No, porque los permisos de "otros" son los unicos que aplican a vos',
          'Si, pero solo si tambien sos dueño del directorio /home/valeria',
        ],
        correcta: 1,
        explicacion:
          'ls -l muestra tres bloques de permisos: dueño, grupo y otros. Como no sos el dueño pero si formas parte del grupo alumnos (se puede chequear en /etc/group), se te aplica el segundo bloque, r--, que alcanza para leer.',
      },
      {
        enunciado:
          'practica/saludo.sh tiene permisos 644 y querés que ademas el dueño lo pueda ejecutar, sin tocar los permisos de grupo ni de otros. ¿Qué comando corresponde?',
        opciones: [
          'chmod 466 practica/saludo.sh',
          'chmod +x practica/saludo.sh /todos',
          'chmod 744 practica/saludo.sh',
          'chmod 644 practica/saludo.sh --ejecutar',
        ],
        correcta: 2,
        explicacion:
          '644 es rw-r--r--; para sumarle ejecucion solo al dueño, el primer digito pasa de 6 (rw-) a 7 (rwx), quedando 744 = rwxr--r--. Los otros dos digitos, grupo y otros, se mantienen igual.',
      },
      {
        enunciado:
          'Dentro de documentos tenés apuntes.txt, borrador.txt, tarea1.txt, tarea2.txt y planilla.csv. ¿Qué comando lista unicamente los archivos que terminan en .txt?',
        opciones: ['ls ?.txt', 'ls .txt*', 'ls txt.*', 'ls *.txt'],
        correcta: 3,
        explicacion:
          'El comodin * reemplaza cualquier cantidad de caracteres, incluido cero, asi que *.txt matchea cualquier nombre que termine en esa extension. ? en cambio reemplaza exactamente un caracter, por lo que ?.txt solo matchearia nombres de una sola letra como a.txt.',
      },
    ],
  },
  {
    modulo: 3,
    preguntas: [
      {
        enunciado: '¿Qué representa el simbolo ~ cuando lo usás en una ruta?',
        opciones: [
          'La raiz del sistema de archivos',
          'Tu directorio personal, por ejemplo /home/alumno',
          'El directorio en el que estabas antes del ultimo cd',
          'El directorio /tmp, pensado para archivos temporales',
        ],
        correcta: 1,
        explicacion:
          '~ es un atajo que el interprete de comandos expande automaticamente a la ruta de tu directorio personal, para no tener que escribirla entera cada vez.',
      },
      {
        enunciado:
          'Nunca usaste el comando lp y no te acordás que opciones acepta. ¿Qué comando consultás para ver su documentación?',
        opciones: ['lp --ayuda', 'find lp', 'man lp', 'whoami lp'],
        correcta: 2,
        explicacion:
          'man abre el manual del comando indicado, con su sintaxis completa y todas sus opciones. Es el primer lugar donde mirar cuando no te acordás como se usa algo.',
      },
      {
        enunciado:
          'Querés saber no solo tu nombre de usuario sino tambien a qué grupos pertenecés. ¿Qué comando te da esa informacion completa?',
        opciones: ['whoami', 'who', 'pwd', 'id'],
        correcta: 3,
        explicacion:
          'whoami solo imprime tu nombre de usuario. id en cambio muestra tu UID, tu GID y la lista completa de grupos a los que pertenecés. who, por su parte, lista qué usuarios tienen una sesion abierta en el sistema, no tiene que ver con vos en particular.',
      },
      {
        enunciado:
          'Estás en /home/alumno y no te acordás en qué subdirectorio dejaste tarea1.txt. ¿Qué comando te sirve para encontrarlo sin recorrer las carpetas a mano?',
        opciones: ['find . -name tarea1.txt', 'cat tarea1.txt', 'man tarea1.txt', 'who tarea1.txt'],
        correcta: 0,
        explicacion:
          'find recorre recursivamente el arbol de directorios a partir del punto de inicio que le des (aca el actual, con .) y devuelve las rutas de lo que matchea el nombre buscado. cat asume que ya sabés la ruta exacta, no busca nada.',
      },
      {
        enunciado:
          'Querés agregar la linea "Ejercicio 3 resuelto." al final de documentos/tarea1.txt sin borrar lo que ya tiene. ¿Qué usás?',
        opciones: [
          "echo 'Ejercicio 3 resuelto.' > documentos/tarea1.txt",
          "echo 'Ejercicio 3 resuelto.' >> documentos/tarea1.txt",
          'cat documentos/tarea1.txt > Ejercicio 3 resuelto',
          "find 'Ejercicio 3 resuelto.' documentos/tarea1.txt",
        ],
        correcta: 1,
        explicacion:
          '> trunca el archivo y lo deja solo con la salida nueva, perdiendo lo anterior. >> en cambio agrega al final, conservando el contenido previo.',
      },
      {
        enunciado:
          'Mandaste descargas/manual.pdf a imprimir con lp y te diste cuenta que era el archivo equivocado. ¿Qué hacés para sacarlo de la cola de impresión antes de que salga?',
        opciones: [
          'lpstat descargas/manual.pdf',
          'rm descargas/manual.pdf',
          'cancel, indicando el numero de trabajo que te dio lp o que ves con lpstat',
          'lp -r descargas/manual.pdf',
        ],
        correcta: 2,
        explicacion:
          'lp encola el trabajo y devuelve (o lpstat muestra) un identificador de trabajo; cancel con ese id lo saca de la cola. Borrar el archivo original no afecta la copia que ya está encolada para imprimirse.',
      },
    ],
  },
  {
    modulo: 4,
    preguntas: [
      {
        enunciado:
          'Querés duplicar la carpeta proyecto, con todo lo que tiene adentro (src, docs y sus archivos), en un directorio nuevo llamado proyecto_copia. ¿Qué comando corresponde?',
        opciones: [
          'cp proyecto proyecto_copia',
          'cp -r proyecto proyecto_copia',
          'mv -r proyecto proyecto_copia',
          'mkdir -r proyecto proyecto_copia',
        ],
        correcta: 1,
        explicacion:
          'cp sin opciones se niega a copiar directorios. -r (recursivo) le dice que baje por todos los subdirectorios y copie cada archivo que encuentre, preservando la estructura.',
      },
      {
        enunciado: 'Querés saber cuánto espacio ocupa la carpeta documentos en tu directorio personal. ¿Qué comando usás?',
        opciones: ['df documentos', 'ps documentos', 'du documentos', 'kill documentos'],
        correcta: 2,
        explicacion:
          'du (disk usage) mide cuánto ocupa un archivo o directorio puntual. df (disk free) en cambio informa el espacio libre y usado de todo el sistema de archivos montado, no de una carpeta en particular.',
      },
      {
        enunciado:
          'Ya no te sirve proyecto_copia y tiene archivos adentro. rmdir proyecto_copia te tira error. ¿Qué comando lo borra igual, con todo su contenido?',
        opciones: ['rm -r proyecto_copia', 'rm proyecto_copia', 'du -r proyecto_copia', 'cp -r proyecto_copia'],
        correcta: 0,
        explicacion:
          'rm sin -r no borra directorios. Con -r baja recursivamente y borra primero el contenido y despues el directorio vacio. Es una operacion irreversible, conviene fijarse bien el nombre antes de correrla.',
      },
      {
        enunciado:
          'Notás que la maquina está lenta y sospechás que el proceso calcular --intensivo sigue corriendo de fondo. ¿Qué comando te muestra su PID para poder actuar sobre él?',
        opciones: ['find calcular', 'du calcular', 'man calcular', 'ps'],
        correcta: 3,
        explicacion:
          'ps lista los procesos en ejecución con su PID, asi que ahi podés ubicar el número que le corresponde a calcular --intensivo antes de, por ejemplo, matarlo con kill.',
      },
      {
        enunciado:
          'Querés filtrar la salida de ps para ver solo la linea del proceso calcular, sin tener que leer toda la lista a mano. ¿Qué comando arma eso?',
        opciones: ['ps > grep calcular', 'grep ps calcular', 'ps | grep calcular', 'ps grep calcular'],
        correcta: 2,
        explicacion:
          'la tuberia | conecta la salida de un comando con la entrada del siguiente. Aca la salida completa de ps se pasa como entrada a grep, que se queda solo con las lineas que contienen "calcular". > redirige a un archivo, no encadena comandos entre si.',
      },
      {
        enunciado:
          'Ya identificaste que el proceso calcular --intensivo tiene PID 1204 y querés terminarlo. ¿Qué comando usás?',
        opciones: ['kill 1204', 'rm 1204', 'ps -k 1204', 'cancel 1204'],
        correcta: 0,
        explicacion:
          'kill le manda una señal de terminación al proceso con ese PID. cancel se usa para trabajos de impresión, no para procesos; rm borra archivos, no mata procesos.',
      },
    ],
  },
];
