// Huevos de pascua: archivos escondidos por el filesystem que dan XP al leerlos.
//
// El rango root esta deliberadamente fuera del alcance de quien solo cumple las
// consignas: hacen falta las lecciones MAS explorar. Quien nunca escribio
// `ls -a` en un directorio que no le pidieron, no llega.
//
// TONO: no son mini-clases. Son casos REALES de la historia de la seguridad,
// contados como chusmerio entre dos curiosos. Nada de moraleja al final: el
// alumno y el que escribio esto son la misma clase de persona, la que abre
// todas las puertas para ver que hay. Algunos se encadenan y apuntan al
// siguiente, como en un CTF.
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
    nombre: 'El virus con telefono',
    xp: 100,
    donde: '/home/alumno/.bashrc',
    contenido:
      'Alguien dejó su nombre acá adentro.\n' +
      '\n' +
      'En 1986 dos hermanos de Lahore escribieron el primer virus para\n' +
      'PC. Adentro del código pusieron sus nombres reales, la dirección\n' +
      'del local y el teléfono. No fue un descuido: querían que los\n' +
      'llamaran.\n' +
      '\n' +
      'Y los llamaron. Durante años. Gente de medio mundo marcando un\n' +
      'número de Pakistán para putear a dos tipos que seguían atendiendo\n' +
      'el teléfono del negocio como si nada.\n' +
      '\n' +
      'La empresa todavía existe.\n' +
      '\n' +
      'Yo también dejé algo mío en este archivo. No te voy a decir qué.\n' +
      marca('alias', 100),
  },
  {
    id: 'motd',
    nombre: 'El accidente de Cornell',
    xp: 100,
    donde: '/etc/.motd',
    contenido:
      '¿Y vos qué hacés en /etc? Nadie te mandó.\n' +
      '\n' +
      'Ya que estás. En 1988 un estudiante escribió un programa para\n' +
      'medir cuán grande era internet. Contar máquinas, nada más.\n' +
      '\n' +
      'Se le escapó. Se reinfectaba a sí mismo una y otra vez hasta que\n' +
      'las computadoras no podían hacer otra cosa. Se comió cerca del\n' +
      '10% de la red en un día. En esa época eran unas seis mil\n' +
      'máquinas, o sea: prácticamente toda internet.\n' +
      '\n' +
      'Fue el primero condenado por algo así. Hoy es profesor en el MIT.\n' +
      '\n' +
      'Moraleja: ninguna. Seguí revolviendo.\n' +
      'Empezá por /bin, que ahí hay otra.\n' +
      marca('motd', 100),
  },
  {
    id: 'vim',
    nombre: 'Cicada',
    xp: 100,
    donde: '/usr/share/.como-salir',
    contenido:
      'Viniste a buscar cómo salir de vim.\n' +
      'Te vas a ir con otra cosa.\n' +
      '\n' +
      'En 2012 apareció en internet un acertijo firmado por alguien que\n' +
      'decía estar buscando gente muy inteligente. El que lo resolvía\n' +
      'encontraba otro. Después vinieron imágenes con datos escondidos\n' +
      'adentro, un libro que había que conseguir en papel, y coordenadas\n' +
      'de carteles pegados en postes de ciudades de todo el mundo.\n' +
      'Varsovia, Seúl, París, Sídney.\n' +
      '\n' +
      'Nunca se supo quién lo armaba ni para qué reclutaban. Un día\n' +
      'dejaron de publicar y no volvieron más.\n' +
      '\n' +
      'Este archivo tampoco te va a dar lo que viniste a buscar.\n' +
      '\n' +
      'Andá a mirar en /var/log. Hay algo con nombre de vergüenza.\n' +
      '\n' +
      '(Esc  :q!  Enter. Ahí tenés. Ahora andá.)\n' +
      marca('vim', 100),
  },
  {
    id: 'daemon',
    nombre: 'Creeper y Reaper',
    xp: 120,
    donde: '/usr/share/.leyenda',
    contenido:
      'Che, esto es de 1971. Antes que todo.\n' +
      '\n' +
      'Creeper fue el primer programa que se copiaba solo de una máquina\n' +
      'a otra. No rompía nada. Llegaba, mostraba un cartelito desafiando\n' +
      'a que lo atraparan, y seguía viaje.\n' +
      '\n' +
      'Alguien del mismo laboratorio se picó y escribió Reaper, cuyo\n' +
      'único laburo era perseguir a Creeper por la red y borrarlo.\n' +
      '\n' +
      'O sea: el primer virus y el primer antivirus fueron dos\n' +
      'compañeros de trabajo jodiéndose entre ellos.\n' +
      '\n' +
      'Toda la industria de la seguridad, miles de millones de dólares,\n' +
      'está construida arriba de una gastada entre colegas.\n' +
      marca('daemon', 120),
  },
  {
    id: 'confianza',
    nombre: 'Medio segundo',
    xp: 150,
    donde: '/bin/.leeme',
    contenido:
      'Llegaste a /bin. Bien.\n' +
      '\n' +
      'En 2024 casi entran a todos lados al mismo tiempo.\n' +
      '\n' +
      'Alguien apareció en un proyecto de compresión chiquito, de esos\n' +
      'que mantiene una sola persona y que usa media internet sin\n' +
      'saberlo. Se puso a colaborar. Durante tres años. Arregló bugs,\n' +
      'contestó mails, ayudó, se ganó la confianza, hasta que le dieron\n' +
      'permisos de mantenedor.\n' +
      '\n' +
      'Recién ahí metió la puerta trasera, escondida adentro de unos\n' +
      'archivos de prueba que nadie mira.\n' +
      '\n' +
      'Lo agarraron porque un ingeniero notó que sus conexiones SSH\n' +
      'tardaban medio segundo más de lo normal y le dio bronca.\n' +
      '\n' +
      'Medio segundo y un tipo insoportable. Eso nos salvó.\n' +
      '\n' +
      'Vos tardaste bastante más que eso en encontrar este archivo.\n' +
      marca('confianza', 150),
  },
  {
    id: 'sesion',
    nombre: 'Lecturas normales',
    xp: 150,
    donde: '/tmp/.sesion-hija',
    contenido:
      'socket: /tmp/.s-9d4f21     estado: ABIERTO\n' +
      'lecturas: NORMALES         alertas: NINGUNA\n' +
      '\n' +
      'Todo bien por acá. No hay nada raro. Podés seguir.\n' +
      '\n' +
      '.\n' +
      '.\n' +
      '.\n' +
      '\n' +
      'En 2010 encontraron un programa metido en los controladores de\n' +
      'una planta nuclear. Les cambiaba la velocidad a las\n' +
      'centrifugadoras hasta romperlas físicamente, de a poco, durante\n' +
      'meses.\n' +
      '\n' +
      'Lo bueno: mientras lo hacía, a los operadores les mostraba en\n' +
      'pantalla los valores de siempre. Todo normal. Todo en orden.\n' +
      '\n' +
      'Tardaron muchísimo en aceptar que la pantalla mentía.\n' +
      '\n' +
      'Yo también te estoy mostrando lecturas normales.\n' +
      marca('sesion', 150),
  },
  {
    id: 'permisos',
    nombre: 'Minecraft contra internet',
    xp: 120,
    donde: '/var/log/.verguenza',
    contenido:
      'Ay, no. Este no. Bueno, ya está.\n' +
      '\n' +
      'En 2016 unos pibes querían tirarle abajo los servidores de\n' +
      'Minecraft a la competencia. Se armaron una red con cámaras de\n' +
      'seguridad y routers hogareños a los que nadie les cambió nunca\n' +
      'la contraseña de fábrica.\n' +
      '\n' +
      'Les funcionó demasiado bien. Terminaron volteando el DNS de\n' +
      'medio Estados Unidos. Twitter, Netflix, Spotify, Reddit, todo\n' +
      'abajo, un viernes entero.\n' +
      '\n' +
      'Por unos servidores de Minecraft.\n' +
      '\n' +
      'Una cámara recién enchufada a internet tardaba minutos en ser\n' +
      'infectada. Minutos.\n' +
      '\n' +
      'Andá a cambiar la contraseña de tu router. Te espero.\n' +
      marca('permisos', 120),
  },
  {
    id: 'bifurcacion',
    nombre: '376 bytes',
    xp: 130,
    donde: '/tmp/.no-ejecutar',
    contenido:
      'El archivo se llama "no ejecutar" y lo abriste igual.\n' +
      'Sos exactamente el público que esperaba.\n' +
      '\n' +
      'En 2003 apareció algo de 376 bytes. Trescientos setenta y seis.\n' +
      'Entraba entero en un solo paquete de red. No escribía nada en\n' +
      'disco: vivía en memoria y listo.\n' +
      '\n' +
      'Se duplicaba cada ocho segundos y medio.\n' +
      '\n' +
      'En quince minutos había recorrido el planeta. Se cayeron cajeros\n' +
      'automáticos, se cayó un sistema de emergencias, se cayó el\n' +
      'monitoreo de una central nuclear.\n' +
      '\n' +
      '376 bytes. Menos de lo que ocupa este párrafo que estás leyendo.\n' +
      '\n' +
      'No, no te lo voy a escribir acá.\n' +
      marca('bifurcacion', 130),
  },
  {
    id: 'valeria',
    nombre: 'El adjunto',
    xp: 100,
    donde: '/home/valeria/.para-el-que-mire',
    contenido:
      'Te vi entrar al home de otra persona.\n' +
      '\n' +
      'Mirá, en mayo del 2000 llegó a millones de casillas un mail con\n' +
      'un archivo adjunto que prometía ser una carta de amor. Millones\n' +
      'de personas hicieron doble clic sin pensarlo un segundo.\n' +
      '\n' +
      'Se comió archivos, se reenvió solo a toda la libreta de\n' +
      'contactos, y en diez días había dado la vuelta al mundo.\n' +
      '\n' +
      'Lo escribió un estudiante de Manila. Cuando lo encontraron no lo\n' +
      'pudieron acusar de nada: en Filipinas todavía no existía ninguna\n' +
      'ley que dijera que eso estaba mal.\n' +
      '\n' +
      'Zafó porque nadie se había puesto a escribir la ley todavía.\n' +
      '\n' +
      'Vos también estás abriendo cosas que no son tuyas.\n' +
      'Por ahora también zafás.\n' +
      '\n' +
      '                                                          — V.\n' +
      marca('valeria', 100),
  },
  {
    id: 'nulo',
    nombre: 'Diez dolares',
    xp: 130,
    donde: '/tmp/.dev-null',
    contenido:
      'Ah, encontraste el agujero.\n' +
      '\n' +
      'Todo lo que mandes a /dev/null desaparece. Sin papelera, sin\n' +
      'registro, sin vuelta atrás.\n' +
      '\n' +
      'Hablando de vuelta atrás: en 2017 un ransomware encriptó\n' +
      'hospitales enteros en Inglaterra en cuestión de horas.\n' +
      'Operaciones suspendidas, ambulancias desviadas a otras ciudades.\n' +
      '\n' +
      'Lo frenó un pibe de 22 años que estaba leyendo el código por\n' +
      'curiosidad, vio que consultaba un dominio que no existía, y lo\n' +
      'registró por diez dólares nada más que para ver qué pasaba.\n' +
      '\n' +
      'Era el botón de apagado. Todavía se discute si el autor lo puso\n' +
      'a propósito o se le escapó.\n' +
      '\n' +
      'Diez dólares y curiosidad. Igual que vos, leyendo un archivo\n' +
      'oculto en /tmp un martes cualquiera.\n' +
      marca('nulo', 130),
  },
];

export const XP_HUEVOS_TOTAL = HUEVOS.reduce((n, h) => n + h.xp, 0);
