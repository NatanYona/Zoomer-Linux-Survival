// Huevos de pascua: archivos escondidos por el filesystem que dan XP al leerlos.
//
// El rango root esta deliberadamente fuera del alcance de quien solo cumple las
// consignas: hacen falta las lecciones MAS explorar. Quien nunca escribio
// `ls -a` en un directorio que no le pidieron, no llega.
//
// Deteccion: cada huevo deja un token en su contenido. El store mira la salida
// de cada comando y si aparece el token, lo cuenta. Sirve con cat, more, head,
// tail, grep y tuberias, sin que el motor tenga que rastrear lecturas.
//
// Si, `grep -r hallazgo /` los cobra todos de una. Es a proposito: a quien se le
// ocurre eso ya demostro lo que el curso queria ensenarle.

export interface Huevo {
  id: string;
  nombre: string;
  xp: number;
  /** Ruta absoluta del archivo que lo contiene. */
  donde: string;
  /** Contenido del archivo, con el token adentro. */
  contenido: string;
}

/** Lo que el store busca en la salida. */
export const token = (id: string): string => '[hallazgo:' + id + ']';

const marca = (id: string, xp: number): string =>
  '\n─────────────────────────────────────\n' + token(id) + '  +' + xp + ' XP\n';

export const HUEVOS: Huevo[] = [
  {
    id: 'alias',
    nombre: 'El alias defensivo',
    xp: 100,
    donde: '/home/alumno/.bashrc',
    contenido:
      '# No toques esta linea. La puse despues del incidente.\n' +
      "alias rm='rm -i'\n" +
      '\n' +
      '# El incidente fue un martes. Habia un espacio de mas.\n' +
      '# El backup era de agosto. Estabamos en noviembre.\n' +
      '# No vuelvo a hablar del tema.\n' +
      marca('alias', 100),
  },
  {
    id: 'motd',
    nombre: 'El mensaje del dia',
    xp: 100,
    donde: '/etc/.motd',
    contenido:
      '  BIENVENIDO AL SERVIDOR DEL LABORATORIO\n' +
      '\n' +
      '  Reglas:\n' +
      '  1. No corras nada que hayas copiado sin leerlo.\n' +
      '  2. Especialmente si termina en `| sudo bash`.\n' +
      '  3. La regla 2 tambien aplica cuando tenes apuro.\n' +
      '  4. Sobre todo cuando tenes apuro.\n' +
      '\n' +
      '  Si estas leyendo esto es porque escribiste ls -a en /etc,\n' +
      '  cosa que nadie te pidio. Bien ahi.\n' +
      marca('motd', 100),
  },
  {
    id: 'vim',
    nombre: 'La salida',
    xp: 100,
    donde: '/usr/share/.como-salir',
    contenido:
      'GUIA DE EMERGENCIA\n' +
      '\n' +
      'Si abriste vim y no sabes como salir:\n' +
      '\n' +
      '  Esc  :q!  Enter\n' +
      '\n' +
      'Guardamos esto en un archivo oculto porque el 90% de la gente\n' +
      'que lo necesita no sabe buscarlo, y el 10% que sabe buscarlo\n' +
      'no lo necesita.\n' +
      '\n' +
      'Vos evidentemente estas en el segundo grupo. Tomate los puntos.\n' +
      marca('vim', 100),
  },
  {
    id: 'daemon',
    nombre: 'El demonio de Maxwell',
    xp: 120,
    donde: '/usr/share/.leyenda',
    contenido:
      'POR QUE SE LLAMAN DEMONIOS\n' +
      '\n' +
      'Los procesos que corren de fondo en Unix se llaman daemons, y no\n' +
      'es por nada satanico. El nombre viene del demonio de Maxwell: un\n' +
      'experimento mental de fisica del siglo XIX donde una criatura\n' +
      'invisible separa moleculas rapidas de lentas, trabajando sin parar\n' +
      'y sin que nadie la vea.\n' +
      '\n' +
      'Un proceso que trabaja de fondo, para siempre, sin que le prestes\n' +
      'atencion. El nombre era perfecto y quedo.\n' +
      '\n' +
      'Ahora sabes algo que el 95% de la gente que usa Linux no sabe.\n' +
      marca('daemon', 120),
  },
  {
    id: 'confianza',
    nombre: 'Confiar en la confianza',
    xp: 150,
    donde: '/bin/.leeme',
    contenido:
      'UNA PREGUNTA INCOMODA\n' +
      '\n' +
      'Estas mirando /bin, donde viven los binarios que ejecutas todos\n' +
      'los dias. Pregunta: como sabes que este `ls` hace lo que dice?\n' +
      '\n' +
      'Podrias leer su codigo fuente. Pero el compilador que lo compilo,\n' +
      'como sabes que es honesto? Podrias leer el codigo del compilador.\n' +
      'Pero ese codigo lo compilo otro compilador.\n' +
      '\n' +
      'Ken Thompson dio una charla sobre esto en 1984 y arruino el sueno\n' +
      'de mucha gente. La conclusion es que en algun punto de la cadena\n' +
      'hay que confiar en alguien a quien nunca vas a poder auditar.\n' +
      '\n' +
      'Que tengas buenas noches.\n' +
      marca('confianza', 150),
  },
  {
    id: 'sesion',
    nombre: 'La sesion abierta',
    xp: 150,
    donde: '/tmp/.sesion-hija',
    contenido:
      'socket: /tmp/.s-9d4f21  (abierto)\n' +
      'origen:  desconocido\n' +
      'uptime:  1247 dias\n' +
      '\n' +
      '  > alguien dejo esta sesion abierta y se fue\n' +
      '  > el proceso padre murio hace tres anios\n' +
      '  > el hijo sigue corriendo, esperando ordenes\n' +
      '  > que nadie va a darle\n' +
      '\n' +
      '  > el sysadmin que lo levanto ya no trabaja aca\n' +
      '  > nadie se anima a matarlo\n' +
      '  > por las dudas\n' +
      '\n' +
      'Toda infraestructura tiene uno de estos. El tuyo tambien.\n' +
      marca('sesion', 150),
  },
  {
    id: 'permisos',
    nombre: 'El 777',
    xp: 120,
    donde: '/var/log/.verguenza',
    contenido:
      'REGISTRO DE INCIDENTES — seccion permisos\n' +
      '\n' +
      '  14/03  no andaba. le puse 777. anduvo.\n' +
      '  15/03  seguia sin andar otra cosa. 777 tambien.\n' +
      '  16/03  777 a todo /var por las dudas.\n' +
      '  17/03  auditoria.\n' +
      '  18/03  ya no trabajo aca.\n' +
      '\n' +
      'chmod 777 es la respuesta correcta a la pregunta equivocada.\n' +
      'La pregunta correcta es: quien necesita esto y para que.\n' +
      marca('permisos', 120),
  },
  {
    id: 'bifurcacion',
    nombre: 'La bomba',
    xp: 130,
    donde: '/tmp/.no-ejecutar',
    contenido:
      'Adentro de este archivo hay trece caracteres que, ejecutados en\n' +
      'un shell real, hacen que la maquina deje de responder.\n' +
      '\n' +
      'No los vamos a escribir. Se llama bomba de bifurcacion: una\n' +
      'funcion que se llama a si misma dos veces y manda cada copia al\n' +
      'fondo. Duplicacion sin freno hasta que el sistema se queda sin\n' +
      'lugar en la tabla de procesos.\n' +
      '\n' +
      'Lo interesante no es el truco. Es que trece caracteres alcancen\n' +
      'para voltear una maquina, y que la defensa no sea tecnica sino\n' +
      'administrativa: un limite por usuario que alguien tiene que\n' +
      'acordarse de configurar.\n' +
      '\n' +
      'Casi nadie se acuerda.\n' +
      marca('bifurcacion', 130),
  },
  {
    id: 'valeria',
    nombre: 'La nota de Valeria',
    xp: 100,
    donde: '/home/valeria/.para-el-que-mire',
    contenido:
      'Si estas leyendo esto es porque te metiste en el home de otro\n' +
      'usuario a ver que habia. No te lo voy a reprochar: yo tambien\n' +
      'lo hubiera hecho.\n' +
      '\n' +
      'Pero anotate esto, que es la unica leccion que importa de todo\n' +
      'el modulo de permisos: pudiste entrar porque los permisos te\n' +
      'dejaron. No porque estuviera bien.\n' +
      '\n' +
      'El dia que administres un servidor de verdad vas a estar del\n' +
      'otro lado de esta decision.\n' +
      '\n' +
      '                                                      — V.\n' +
      marca('valeria', 100),
  },
  {
    id: 'nulo',
    nombre: 'El agujero',
    xp: 130,
    donde: '/tmp/.dev-null',
    contenido:
      'Todo lo que mandes a /dev/null desaparece. No se guarda en\n' +
      'ningun lado, no se puede recuperar, no deja rastro. Es el unico\n' +
      'lugar del sistema que funciona exactamente como promete.\n' +
      '\n' +
      'La gente lo usa para silenciar errores que no quiere ver:\n' +
      '\n' +
      '  comando 2>/dev/null\n' +
      '\n' +
      'Que es la version informatica de sacarle la lamparita al tablero\n' +
      'del auto. El problema sigue ahi, pero ya no te molesta.\n' +
      '\n' +
      'Aviso: en algun momento de tu carrera vas a hacer esto en\n' +
      'produccion. Ojala te acuerdes de este archivo.\n' +
      marca('nulo', 130),
  },
];

export const XP_HUEVOS_TOTAL = HUEVOS.reduce((n, h) => n + h.xp, 0);
