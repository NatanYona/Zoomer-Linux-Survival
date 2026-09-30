// CONTRATO COMPARTIDO. No modificar sin avisar al orquestador.

export interface NodoDir {
  tipo: 'dir';
  modo: number;              // octal, p.ej. 0o755
  duenio: string;
  grupo: string;
  hijos: Record<string, Nodo>;
}

export interface NodoArch {
  tipo: 'arch';
  modo: number;
  duenio: string;
  grupo: string;
  contenido: string;
}

export type Nodo = NodoDir | NodoArch;

export interface Proceso {
  pid: number;
  usuario: string;
  tty: string;
  tiempo: string;            // 'HH:MM:SS'
  comando: string;
  vivo: boolean;
}

export interface Trabajo {
  id: string;                // 'laser-42'
  archivo: string;
  duenio: string;
  bytes: number;
}

/** Una ejecucion de un script. Los validadores del modulo 5 miran esto. */
export interface Corrida {
  ruta: string;              // absoluta: '/home/alumno/hola.sh'
  modo: 'directo' | 'bash';  // ./hola.sh o bash hola.sh
  args: string[];
  entrada: string;           // lo que le llego por tuberia
  salida: string;
  error: string;
  codigo: number;
}

/** Variables y funciones de la terminal: sobreviven de una linea a la otra. */
export interface Entorno {
  vars: Record<string, string>;
  funciones: Record<string, unknown>;
  ultimo?: number;           // $?
}

/** Lo que devuelve `nano` o `crontab -e`: la UI abre el editor con esto. */
export interface EditorPedido {
  destino: 'archivo' | 'crontab';
  ruta: string;              // absoluta; para crontab, un nombre de fantasia
  contenido: string;
  nuevo: boolean;
}

export interface Estado {
  fs: NodoDir;
  cwd: string[];             // segmentos desde la raiz; [] === '/'
  usuario: string;
  grupos: string[];
  procesos: Proceso[];
  colaImpresion: Trabajo[];
  historial: string[];       // lineas completas tal como las tipeo el alumno
  entorno?: Entorno;
  corridas?: Corrida[];
  /** crontab instalado del alumno; undefined = no tiene */
  crontab?: string;
}

export interface Ctx {
  estado: Estado;            // mutable: los comandos modifican el estado in situ
  args: string[];            // argv SIN el nombre del comando, ya expandido el glob
  entrada: string;           // stdin (viene de una tuberia); '' si no hay
}

export interface Resultado {
  salida: string;            // stdout
  error?: string;            // stderr
  codigo: number;            // 0 = ok
  /** Solo nano y crontab -e: pide abrir el editor. */
  editor?: EditorPedido;
}

export type Comando = (ctx: Ctx) => Resultado;
export type Registro = Record<string, Comando>;

export const ok = (salida = ''): Resultado => ({ salida, codigo: 0 });
export const falla = (error: string, codigo = 1): Resultado => ({ salida: '', error, codigo });
