// Pase de temporada: cosmeticos y rangos que se desbloquean por puntos.
// No afecta la logica del curso, solo la pinta de la terminal del alumno.

export type TipoCosmetico = 'tema' | 'prompt' | 'efecto' | 'cursor';

export interface Cosmetico {
  id: string;
  tipo: TipoCosmetico;
  nombre: string;
  /** Una linea, en tono jugueton pero no bobo. */
  descripcion: string;
  /** Solo para tipo 'tema': overrides de las variables CSS de la terminal. */
  vars?: Record<string, string>;
  /** Solo para tipo 'prompt': plantilla con los marcadores {usuario} {host} {ruta} {simbolo} */
  plantilla?: string;
}

export interface Rango {
  nivel: number;
  /** Puntos necesarios para alcanzarlo. El primero es 0. */
  puntos: number;
  nombre: string;
  /** Una linea que se muestra al alcanzarlo. */
  lema: string;
  /** ids de Cosmetico que se desbloquean al llegar. */
  desbloquea: string[];
}

export const PUNTOS = {
  leccion: 100,
  sinPista: 50,
  quizAcierto: 25,
  moduloCompleto: 200,
} as const;

export const COSMETICOS: Cosmetico[] = [
  // ---- Temas ----
  {
    id: 'tema-ambar',
    tipo: 'tema',
    nombre: 'Ámbar de fábrica',
    descripcion: 'La terminal tal como vino de fábrica. Clásica, confiable, sin vueltas.',
    vars: {
      '--term-fondo': '#0a0e11',
      '--term-borde': '#1f272c',
      '--term-texto': '#c6d3cb',
      '--term-tenue': '#6f8078',
      '--term-prompt': '#5fd08a',
      '--term-acento': '#e39b2e',
      '--term-error': '#de6b6b',
    },
  },
  {
    id: 'tema-fosforo',
    tipo: 'tema',
    nombre: 'Fósforo',
    descripcion: 'Verde de monitor viejo. El que usaba tu profesor cuando el mouse era un lujo.',
    vars: {
      '--term-fondo': '#051005',
      '--term-borde': '#123512',
      '--term-texto': '#39ff14',
      '--term-tenue': '#1f7a1f',
      '--term-prompt': '#7fff6a',
      '--term-acento': '#b6ff33',
      '--term-error': '#ff6161',
    },
  },
  {
    id: 'tema-papel',
    tipo: 'tema',
    nombre: 'Papel',
    descripcion: 'Fondo hueso, texto tinta. Para cuando la terminal oscura te empieza a cansar la vista.',
    vars: {
      '--term-fondo': '#f2ede1',
      '--term-borde': '#d8cfb8',
      '--term-texto': '#2b2620',
      '--term-tenue': '#8a8170',
      '--term-prompt': '#6b4a12',
      '--term-acento': '#8a5a0f',
      '--term-error': '#a3312b',
    },
  },
  {
    id: 'tema-solarizado',
    tipo: 'tema',
    nombre: 'Solarizado',
    descripcion: 'La paleta favorita de medio internet. Azulada, tenue, elegante sin esforzarse.',
    vars: {
      '--term-fondo': '#002b36',
      '--term-borde': '#073642',
      '--term-texto': '#839496',
      '--term-tenue': '#586e75',
      '--term-prompt': '#268bd2',
      '--term-acento': '#2aa198',
      '--term-error': '#dc322f',
    },
  },
  {
    id: 'tema-1977',
    tipo: 'tema',
    nombre: '1977',
    descripcion: 'Ámbar saturado sobre marrón quemado. La terminal que vio nacer a Unix.',
    vars: {
      '--term-fondo': '#1a0f05',
      '--term-borde': '#3a2410',
      '--term-texto': '#ffb000',
      '--term-tenue': '#8a5a10',
      '--term-prompt': '#ffcc33',
      '--term-acento': '#ff9500',
      '--term-error': '#ff4d4d',
    },
  },
  {
    id: 'tema-matriz',
    tipo: 'tema',
    nombre: 'Matriz',
    descripcion: 'Verde puro sobre negro absoluto. Ya no hay vuelta atrás.',
    vars: {
      '--term-fondo': '#000000',
      '--term-borde': '#003b00',
      '--term-texto': '#00ff41',
      '--term-tenue': '#008f28',
      '--term-prompt': '#66ff99',
      '--term-acento': '#00ff41',
      '--term-error': '#ff3333',
    },
  },

  // ---- Prompts ----
  {
    id: 'prompt-simple',
    tipo: 'prompt',
    nombre: 'Simple',
    descripcion: 'Solo la ruta y el símbolo. Lo mínimo indispensable para saber dónde estás.',
    plantilla: '{ruta}{simbolo}',
  },
  {
    id: 'prompt-completo',
    tipo: 'prompt',
    nombre: 'Completo',
    descripcion: 'Usuario, host y ruta, como en cualquier servidor de verdad. Prolijo y con toda la info.',
    plantilla: '{usuario}@{host}:{ruta}{simbolo}',
  },
  {
    id: 'prompt-flecha',
    tipo: 'prompt',
    nombre: 'Flecha',
    descripcion: 'Minimalista, con una flechita que te apunta directo a donde estás parado.',
    plantilla: '➜ {ruta} {simbolo}',
  },
  {
    id: 'prompt-root',
    tipo: 'prompt',
    nombre: 'Root',
    descripcion: 'El prompt completo, pero con el símbolo que solo ve quien manda.',
    plantilla: '{usuario}@{host}:{ruta}{simbolo}',
  },

  // ---- Efectos ----
  {
    id: 'efecto-crt',
    tipo: 'efecto',
    nombre: 'CRT',
    descripcion: 'Scanlines de monitor de tubo. Tu terminal, con veinte años más de historia encima.',
  },
  {
    id: 'efecto-typewriter',
    tipo: 'efecto',
    nombre: 'Máquina de escribir',
    descripcion: 'La salida aparece letra por letra, como si alguien la estuviera tipeando en vivo.',
  },
  {
    id: 'efecto-banner',
    tipo: 'efecto',
    nombre: 'Banner de bienvenida',
    descripcion: 'Un arte ASCII te recibe cada vez que abrís la terminal. Para entrar con estilo.',
  },

  // ---- Cursores ----
  {
    id: 'cursor-barra',
    tipo: 'cursor',
    nombre: 'Barra',
    descripcion: 'El cursor de siempre. Parpadea, no molesta, hace su trabajo.',
  },
  {
    id: 'cursor-bloque',
    tipo: 'cursor',
    nombre: 'Bloque',
    descripcion: 'Un bloque sólido y prepotente. Ocupa el lugar del carácter como si fuera propio.',
  },
  {
    id: 'cursor-guion',
    tipo: 'cursor',
    nombre: 'Guión bajo',
    descripcion: 'Discreto, apenas un trazo debajo del texto. Para los que no necesitan llamar la atención.',
  },
];

export const RANGOS: Rango[] = [
  {
    nivel: 1,
    puntos: 0,
    nombre: 'Novato',
    lema: 'Todos empezamos escribiendo ls sin saber muy bien qué esperar.',
    desbloquea: ['tema-ambar', 'prompt-simple', 'cursor-barra'],
  },
  {
    nivel: 2,
    puntos: 500,
    nombre: 'Becario',
    lema: 'Ya no le tenés miedo a la terminal. Le tenés respeto, que es distinto.',
    desbloquea: ['tema-fosforo', 'cursor-bloque'],
  },
  {
    nivel: 3,
    puntos: 1200,
    nombre: 'Operador',
    lema: 'Encadenás comandos sin pensarlos dos veces. Empieza a notarse.',
    desbloquea: ['prompt-completo', 'tema-papel'],
  },
  {
    nivel: 4,
    puntos: 2000,
    nombre: 'Técnico',
    lema: 'Cuando algo se rompe, ya sabés por dónde empezar a mirar.',
    desbloquea: ['efecto-crt', 'efecto-typewriter'],
  },
  {
    nivel: 5,
    puntos: 3000,
    nombre: 'Administrador',
    lema: 'El sistema es tuyo. Bueno, casi: todavía falta un rango.',
    desbloquea: ['tema-solarizado', 'prompt-flecha'],
  },
  {
    nivel: 6,
    puntos: 4200,
    nombre: 'Sysadmin',
    lema: 'Te llaman cuando algo se cae. Y sabés que vas a poder levantarlo.',
    desbloquea: ['tema-1977', 'efecto-banner', 'cursor-guion'],
  },
  {
    nivel: 7,
    puntos: 6200,
    nombre: 'root',
    lema: 'En Unix el # del prompt no es decoración: significa que el sistema es tuyo.',
    desbloquea: ['tema-matriz', 'prompt-root'],
  },
];
