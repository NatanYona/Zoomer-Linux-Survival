// Calculo de XP y rangos.
//
// El XP se DERIVA del progreso, no se guarda aparte. Un contador acumulado se
// desincroniza en cuanto algo falla a mitad de camino; recalcularlo siempre
// desde la misma fuente de verdad no puede quedar torcido.
import { LECCIONES, QUIZZES } from './index';
import { PUNTOS, RANGOS } from './pase';
import type { Rango } from './pase';
import { HUEVOS } from './huevos';

export interface Progreso {
  completadas: Set<string>;
  /** Lecciones donde el alumno abrio la pista. */
  pistas: Set<string>;
  /** aciertos por modulo */
  quizzes: Record<string, number>;
  /** ids de huevos de pascua encontrados. */
  hallazgos: Set<string>;
}

/** Un quiz cuenta como aprobado desde el 70% de aciertos. */
export const aprobo = (modulo: number, quizzes: Record<string, number>): boolean => {
  const q = QUIZZES.find((x) => x.modulo === modulo);
  if (!q) return false;
  return (quizzes[modulo] ?? 0) >= Math.ceil(q.preguntas.length * 0.7);
};

export function calcularXp(p: Progreso): number {
  let xp = 0;

  for (const l of LECCIONES) {
    if (!p.completadas.has(l.id)) continue;
    xp += PUNTOS.leccion;
    if (!p.pistas.has(l.id)) xp += PUNTOS.sinPista;
  }

  for (const q of QUIZZES) xp += (p.quizzes[q.modulo] ?? 0) * PUNTOS.quizAcierto;

  for (const m of [1, 2, 3, 4]) {
    const suyas = LECCIONES.filter((l) => l.modulo === m);
    const todas = suyas.length > 0 && suyas.every((l) => p.completadas.has(l.id));
    if (todas && aprobo(m, p.quizzes)) xp += PUNTOS.moduloCompleto;
  }

  for (const h of HUEVOS) if (p.hallazgos.has(h.id)) xp += h.xp;

  return xp;
}

/** XP que suma completar esta leccion ahora mismo. Para mostrar en el aviso. */
export const xpDeLeccion = (usoPista: boolean): number =>
  PUNTOS.leccion + (usoPista ? 0 : PUNTOS.sinPista);

export const rangoDe = (xp: number): Rango =>
  [...RANGOS].reverse().find((r) => xp >= r.puntos) ?? RANGOS[0];

export const siguienteRango = (xp: number): Rango | null =>
  RANGOS.find((r) => r.puntos > xp) ?? null;

export interface ProgresoRango {
  rango: Rango;
  siguiente: Rango | null;
  faltan: number;
  /** 0 a 1 dentro del tramo actual. Vale 1 en el rango maximo. */
  fraccion: number;
}

export function progresoRango(xp: number): ProgresoRango {
  const rango = rangoDe(xp);
  const siguiente = siguienteRango(xp);
  if (!siguiente) return { rango, siguiente: null, faltan: 0, fraccion: 1 };
  const tramo = siguiente.puntos - rango.puntos;
  return {
    rango,
    siguiente,
    faltan: siguiente.puntos - xp,
    fraccion: tramo > 0 ? (xp - rango.puntos) / tramo : 1,
  };
}

/** Todos los cosmeticos que corresponden a este XP, acumulando rangos previos. */
export const desbloqueadosPor = (xp: number): string[] =>
  RANGOS.filter((r) => xp >= r.puntos).flatMap((r) => r.desbloquea);

/** XP maximo alcanzable, incluidos los huevos. */
export function xpMaximo(): number {
  const todas = new Set(LECCIONES.map((l) => l.id));
  const quizzes: Record<string, number> = {};
  for (const q of QUIZZES) quizzes[q.modulo] = q.preguntas.length;
  return calcularXp({
    completadas: todas,
    pistas: new Set(),
    quizzes,
    hallazgos: new Set(HUEVOS.map((h) => h.id)),
  });
}

/**
 * XP maximo SIN explorar: solo cumpliendo consignas y cuestionarios.
 * El rango mas alto tiene que quedar por encima de este numero, si no explorar
 * es decorativo.
 */
export function xpSinExplorar(): number {
  const todas = new Set(LECCIONES.map((l) => l.id));
  const quizzes: Record<string, number> = {};
  for (const q of QUIZZES) quizzes[q.modulo] = q.preguntas.length;
  return calcularXp({ completadas: todas, pistas: new Set(), quizzes, hallazgos: new Set() });
}
