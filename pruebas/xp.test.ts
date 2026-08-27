import { describe, it, expect } from 'vitest';
import {
  calcularXp,
  rangoDe,
  siguienteRango,
  progresoRango,
  desbloqueadosPor,
  xpMaximo,
  xpDeLeccion,
} from '../src/contenido/xp';
import { PUNTOS, RANGOS, COSMETICOS } from '../src/contenido/pase';
import { LECCIONES, QUIZZES } from '../src/contenido';

const vacio = { completadas: new Set<string>(), pistas: new Set<string>(), quizzes: {} };

describe('calculo de XP', () => {
  it('arranca en cero', () => {
    expect(calcularXp(vacio)).toBe(0);
  });

  it('una leccion sin pista suma el bonus', () => {
    const xp = calcularXp({ ...vacio, completadas: new Set(['m1-l1']) });
    expect(xp).toBe(PUNTOS.leccion + PUNTOS.sinPista);
  });

  it('una leccion con pista suma menos, pero suma', () => {
    const xp = calcularXp({
      completadas: new Set(['m1-l1']),
      pistas: new Set(['m1-l1']),
      quizzes: {},
    });
    expect(xp).toBe(PUNTOS.leccion);
    expect(xp).toBeGreaterThan(0);
  });

  it('el quiz suma por acierto', () => {
    expect(calcularXp({ ...vacio, quizzes: { 1: 4 } })).toBe(4 * PUNTOS.quizAcierto);
  });

  it('el bonus de modulo pide todas las lecciones y aprobar el quiz', () => {
    const delUno = LECCIONES.filter((l) => l.modulo === 1).map((l) => l.id);
    const total = QUIZZES.find((q) => q.modulo === 1)!.preguntas.length;

    const sinQuiz = calcularXp({ ...vacio, completadas: new Set(delUno) });
    const conQuiz = calcularXp({ ...vacio, completadas: new Set(delUno), quizzes: { 1: total } });

    expect(conQuiz - sinQuiz).toBe(total * PUNTOS.quizAcierto + PUNTOS.moduloCompleto);
  });
});

describe('rangos', () => {
  it('el primero arranca en cero', () => {
    expect(RANGOS[0].puntos).toBe(0);
    expect(rangoDe(0).nivel).toBe(1);
  });

  it('los umbrales son estrictamente crecientes', () => {
    for (let i = 1; i < RANGOS.length; i++) {
      expect(RANGOS[i].puntos, RANGOS[i].nombre).toBeGreaterThan(RANGOS[i - 1].puntos);
    }
  });

  it('cae en el rango correcto justo en el umbral y justo antes', () => {
    for (const r of RANGOS.slice(1)) {
      expect(rangoDe(r.puntos).nivel, 'en ' + r.puntos).toBe(r.nivel);
      expect(rangoDe(r.puntos - 1).nivel, 'en ' + (r.puntos - 1)).toBe(r.nivel - 1);
    }
  });

  it('el ultimo rango no tiene siguiente', () => {
    const ultimo = RANGOS[RANGOS.length - 1];
    expect(siguienteRango(ultimo.puntos)).toBeNull();
    expect(progresoRango(ultimo.puntos).fraccion).toBe(1);
  });

  it('la fraccion del tramo va de 0 a 1', () => {
    for (const r of RANGOS.slice(0, -1)) {
      const p = progresoRango(r.puntos);
      expect(p.fraccion).toBe(0);
      expect(p.faltan).toBe(p.siguiente!.puntos - r.puntos);
    }
  });
});

describe('el pase es alcanzable', () => {
  const techo = xpMaximo();

  it('el XP maximo alcanza para llegar a root', () => {
    const ultimo = RANGOS[RANGOS.length - 1];
    expect(techo, 'techo real ' + techo + ' vs root en ' + ultimo.puntos).toBeGreaterThanOrEqual(
      ultimo.puntos
    );
  });

  it('completar todo desbloquea todos los cosmeticos', () => {
    const abiertos = new Set(desbloqueadosPor(techo));
    for (const c of COSMETICOS) {
      expect(abiertos.has(c.id), 'quedo inalcanzable: ' + c.id).toBe(true);
    }
  });

  it('cada cosmetico lo entrega exactamente un rango', () => {
    const entregas = RANGOS.flatMap((r) => r.desbloquea);
    expect(new Set(entregas).size, 'hay cosmeticos repartidos dos veces').toBe(entregas.length);
  });

  it('cada id repartido existe en el catalogo', () => {
    const ids = new Set(COSMETICOS.map((c) => c.id));
    for (const r of RANGOS) {
      for (const id of r.desbloquea) {
        expect(ids.has(id), r.nombre + ' entrega un id que no existe: ' + id).toBe(true);
      }
    }
  });
});

describe('xpDeLeccion', () => {
  it('coincide con lo que suma el calculo completo', () => {
    expect(xpDeLeccion(false)).toBe(calcularXp({ ...vacio, completadas: new Set(['m1-l1']) }));
    expect(xpDeLeccion(true)).toBe(
      calcularXp({ completadas: new Set(['m1-l1']), pistas: new Set(['m1-l1']), quizzes: {} })
    );
  });
});
