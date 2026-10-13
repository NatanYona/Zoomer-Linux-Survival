import type { Leccion, Modulo, Quiz } from './esquema';
import { MODULO1, LECCIONES_M1 } from './modulo1';
import { MODULO2, LECCIONES_M2 } from './modulo2';
import { MODULO3, LECCIONES_M3 } from './modulo3';
import { MODULO4, LECCIONES_M4 } from './modulo4';
import { MODULO5, LECCIONES_M5 } from './modulo5';
import { EVENTO, LECCIONES_EVENTO } from './evento';
import { QUIZZES } from './quizzes';

export const MODULOS: Modulo[] = [MODULO1, MODULO2, MODULO3, MODULO4, MODULO5, EVENTO];
export const LECCIONES: Leccion[] = [...LECCIONES_M1, ...LECCIONES_M2, ...LECCIONES_M3, ...LECCIONES_M4, ...LECCIONES_M5, ...LECCIONES_EVENTO];

/** Fecha local 'AAAA-MM-DD' (toISOString daria la de UTC: de noche en Argentina ya es mañana). */
const fechaLocal = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Un modulo comun se ve siempre; un evento, solo entre sus fechas. */
export const visible = (m: Modulo, hoy = new Date()): boolean =>
  !m.evento || (m.evento.desde <= fechaLocal(hoy) && fechaLocal(hoy) <= m.evento.hasta);

/**
 * Lo que la UI muestra. MODULOS y LECCIONES siguen teniendo todo: el XP se
 * calcula con ellos, asi lo ganado en un evento no se pierde cuando termina.
 */
export const MODULOS_VISIBLES = MODULOS.filter((m) => visible(m));
export const LECCIONES_VISIBLES = LECCIONES.filter((l) => MODULOS_VISIBLES.some((m) => m.numero === l.modulo));
export const QUIZ_POR_MODULO = (n: number): Quiz | undefined => QUIZZES.find((q) => q.modulo === n);
export const leccionesDe = (n: number): Leccion[] => LECCIONES.filter((l) => l.modulo === n);
export { QUIZZES };
export type { Leccion, Modulo, Quiz };
