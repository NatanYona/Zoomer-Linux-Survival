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

export interface Estado {
  fs: NodoDir;
  cwd: string[];             // segmentos desde la raiz; [] === '/'
  usuario: string;
  grupos: string[];
  procesos: Proceso[];
  colaImpresion: Trabajo[];
  historial: string[];       // lineas completas tal como las tipeo el alumno
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
}

export type Comando = (ctx: Ctx) => Resultado;
export type Registro = Record<string, Comando>;

export const ok = (salida = ''): Resultado => ({ salida, codigo: 0 });
export const falla = (error: string, codigo = 1): Resultado => ({ salida: '', error, codigo });
