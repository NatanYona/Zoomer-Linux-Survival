// CONTRATO COMPARTIDO. No modificar sin avisar al orquestador.
import type { Estado } from '../motor/tipos';

/** El 6 es el evento del dia: va aparte de la cursada y no tiene cuestionario. */
export type NumeroModulo = 1 | 2 | 3 | 4 | 5 | 6;

export interface Leccion {
  /** 'm2-l5' */
  id: string;
  modulo: NumeroModulo;
  /** Titulo corto, en sentence case. Sin numeracion: la UI la agrega. */
  titulo: string;
  /** Bloque conceptual. Markdown acotado: parrafos, `codigo`, **negrita**, listas con '- '. */
  concepto: string;
  /** Lo que el alumno tiene que lograr. Imperativo, 1-3 oraciones. */
  consigna: string;
  /** Comandos que se introducen. Una linea por comando, formato 'cmd  # que hace'. */
  comandoNuevo: string;
  /** Se muestra solo si el alumno la pide. Debe desbloquear sin resolver del todo. */
  pista: string;
  /**
   * Comandos que se corren en silencio antes de empezar, sobre el mundo limpio.
   * No quedan en el historial. Sirve para arrancar con lo que se armo en la
   * leccion anterior (por ejemplo ~/bin y el PATH) sin pedir que se repita.
   */
  preparacion?: string[];
  /** Comandos que resuelven la leccion. Alimenta la suite de pruebas. */
  solucion: string[];
  /** true cuando la leccion esta cumplida. Se evalua tras CADA comando. */
  validar: (e: Estado) => boolean;
}

export interface Pregunta {
  enunciado: string;
  opciones: string[];
  /** indice en opciones */
  correcta: number;
  /** Se muestra despues de responder, acierte o no. */
  explicacion: string;
}

export interface Quiz {
  modulo: NumeroModulo;
  preguntas: Pregunta[];
}

export interface Modulo {
  numero: NumeroModulo;
  titulo: string;
  /** Una o dos palabras para la pestaña. Con el titulo entero, en 720p las pestañas se partian en cuatro lineas. */
  corto: string;
  /** 2-3 oraciones: que se lleva el alumno de este modulo. */
  introduccion: string;
  /** Se muestra al completar todas las lecciones y el quiz. */
  cierre: string;
  /** Solo el evento del dia: lo que dice el pop-up de noticias al entrar. */
  evento?: {
    titular: string;
    bajada: string;
    /** Fechas 'AAAA-MM-DD', las dos inclusive. Fuera de ese rango no se ve. */
    desde: string;
    hasta: string;
  };
}

/** Helper para validadores: la ruta absoluta actual del alumno. */
export const cwdStr = (e: Estado): string => '/' + e.cwd.join('/');

/** Helper para validadores: el alumno ejecuto una linea que matchea el patron. */
export const ejecuto = (e: Estado, patron: RegExp): boolean => e.historial.some((h) => patron.test(h));
