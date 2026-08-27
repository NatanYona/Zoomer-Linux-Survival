// Avisos sonoros sintetizados con Web Audio. Nada de archivos: no hay assets
// que empaquetar, ni peso en el entregable, ni creditos de terceros que
// arrastrar. Un aviso de moneda son dos ondas cuadradas con envolvente.
//
// Apagados de fabrica: veinte maquinas sonando a destiempo en un aula es
// exactamente el motivo por el que un profesor manda a silenciar todo.

const CLAVE_ON = 'linux-survival-es:sonido';
const CLAVE_VOL = 'linux-survival-es:volumen';
const VOLUMEN_POR_DEFECTO = 0.6;

const acotar = (v: number): number => Math.min(1, Math.max(0, v));

function leerGuardado<T>(clave: string, convertir: (s: string) => T, porDefecto: T): T {
  try {
    const v = localStorage.getItem(clave);
    return v === null ? porDefecto : convertir(v);
  } catch {
    return porDefecto;
  }
}

function guardar(clave: string, valor: string): void {
  try {
    localStorage.setItem(clave, valor);
  } catch {
    /* sin persistencia: la preferencia dura lo que dure la sesion */
  }
}

let activo = leerGuardado(CLAVE_ON, (s) => s === 'si', false);
let volumen = leerGuardado(CLAVE_VOL, (s) => acotar(parseFloat(s)), VOLUMEN_POR_DEFECTO);

const oyentes = new Set<() => void>();
const avisar = (): void => {
  for (const f of oyentes) f();
};

export const sonidoActivo = (): boolean => activo;
export const volumenActual = (): number => volumen;

export function alternarSonido(): boolean {
  activo = !activo;
  guardar(CLAVE_ON, activo ? 'si' : 'no');
  avisar();
  return activo;
}

export function fijarVolumen(v: number): void {
  volumen = acotar(v);
  guardar(CLAVE_VOL, String(volumen));
  avisar();
}

export function suscribirSonido(f: () => void): () => void {
  oyentes.add(f);
  return () => {
    oyentes.delete(f);
  };
}

// --- sintesis ---------------------------------------------------------------

let ctx: AudioContext | null = null;

/** Un solo AudioContext reusado: crear uno por sonido los agota rapido. */
function contexto(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    // Los navegadores lo arrancan suspendido hasta que hay un gesto del usuario.
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

interface Nota {
  /** Hz al empezar. */
  hz: number;
  /** Hz al terminar, si querés un barrido. */
  hasta?: number;
  /** Segundos desde el arranque del aviso. */
  desde: number;
  dur: number;
  forma?: OscillatorType;
  /** Peso relativo dentro del aviso. */
  gan?: number;
}

function tocar(notas: Nota[], nivel: number): void {
  const a = contexto();
  if (!a) return;
  const t0 = a.currentTime + 0.01;

  for (const n of notas) {
    const osc = a.createOscillator();
    const gan = a.createGain();
    const inicio = t0 + n.desde;
    const fin = inicio + n.dur;
    const pico = acotar(volumen * nivel * (n.gan ?? 1)) * 0.28;

    osc.type = n.forma ?? 'square';
    osc.frequency.setValueAtTime(n.hz, inicio);
    if (n.hasta) osc.frequency.exponentialRampToValueAtTime(n.hasta, fin);

    // Ataque muy corto y caida exponencial: sin esto se escucha un chasquido.
    gan.gain.setValueAtTime(0.0001, inicio);
    gan.gain.exponentialRampToValueAtTime(Math.max(pico, 0.0002), inicio + 0.012);
    gan.gain.exponentialRampToValueAtTime(0.0001, fin);

    osc.connect(gan).connect(a.destination);
    osc.start(inicio);
    osc.stop(fin + 0.02);
  }
}

/** Moneda: dos notas ascendentes, cortas y secas. */
export function sonarMision(): void {
  if (!activo || volumen === 0) return;
  tocar(
    [
      { hz: 988, desde: 0, dur: 0.07 },
      { hz: 1319, desde: 0.07, dur: 0.22 },
    ],
    0.7
  );
}

/** Subida de rango: arpegio mayor de cuatro notas con una quinta que corona. */
export function sonarRango(): void {
  if (!activo || volumen === 0) return;
  tocar(
    [
      { hz: 523, desde: 0, dur: 0.12 },
      { hz: 659, desde: 0.1, dur: 0.12 },
      { hz: 784, desde: 0.2, dur: 0.12 },
      { hz: 1047, desde: 0.3, dur: 0.42, gan: 1.15 },
      { hz: 1568, desde: 0.34, dur: 0.38, forma: 'triangle', gan: 0.55 },
    ],
    1
  );
}
