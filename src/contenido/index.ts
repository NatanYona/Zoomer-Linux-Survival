import type { Leccion, Modulo, Quiz } from './esquema';
import { MODULO1, LECCIONES_M1 } from './modulo1';
import { MODULO2, LECCIONES_M2 } from './modulo2';
import { MODULO3, LECCIONES_M3 } from './modulo3';
import { MODULO4, LECCIONES_M4 } from './modulo4';
import { QUIZZES } from './quizzes';

export const MODULOS: Modulo[] = [MODULO1, MODULO2, MODULO3, MODULO4];
export const LECCIONES: Leccion[] = [...LECCIONES_M1, ...LECCIONES_M2, ...LECCIONES_M3, ...LECCIONES_M4];
export const QUIZ_POR_MODULO = (n: number): Quiz | undefined => QUIZZES.find((q) => q.modulo === n);
export const leccionesDe = (n: number): Leccion[] => LECCIONES.filter((l) => l.modulo === n);
export { QUIZZES };
export type { Leccion, Modulo, Quiz };
