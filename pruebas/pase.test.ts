import { describe, it, expect, beforeEach } from 'vitest';
import { ejecutar, nuevoEstado } from '../src/motor/motor';
import { escribirPerfil, leerPerfil, EQUIPADO_DE_FABRICA } from '../src/motor/perfil';
import { desbloqueadosPor } from '../src/contenido/xp';
import { COSMETICOS, RANGOS } from '../src/contenido/pase';

const correr = (linea: string) => ejecutar(linea, nuevoEstado());

const ponerXp = (xp: number) =>
  escribirPerfil({ xp, desbloqueados: desbloqueadosPor(xp), equipado: { ...EQUIPADO_DE_FABRICA } });

/** Todo marco ASCII se rompe si una sola linea mide distinto que las demas. */
const anchos = (texto: string) => [...new Set(texto.split('\n').filter(Boolean).map((l) => [...l].length))];

beforeEach(() => ponerXp(0));

describe('marco ASCII', () => {
  it('el panel tiene todas las lineas del mismo ancho', () => {
    expect(anchos(correr('pase').salida)).toHaveLength(1);
  });

  it('el catalogo tambien, con todo desbloqueado', () => {
    ponerXp(99999);
    expect(anchos(correr('pase cosmeticos').salida)).toHaveLength(1);
  });

  it('no se rompe con el XP mas grande posible', () => {
    ponerXp(999999);
    expect(anchos(correr('pase').salida)).toHaveLength(1);
  });

  it('en todos los rangos mantiene la alineacion', () => {
    for (const r of RANGOS) {
      ponerXp(r.puntos);
      expect(anchos(correr('pase').salida), 'rango ' + r.nombre).toHaveLength(1);
      expect(anchos(correr('pase cosmeticos').salida), 'catalogo en ' + r.nombre).toHaveLength(1);
    }
  });
});

describe('contenido del panel', () => {
  it('muestra el rango y el XP', () => {
    ponerXp(1200);
    const s = correr('pase').salida;
    expect(s).toContain('OPERADOR');
    expect(s).toContain('1.200 XP');
  });

  it('dice cuanto falta para el proximo rango', () => {
    ponerXp(1200);
    expect(correr('pase').salida).toContain('TÉCNICO');
  });

  it('en el rango maximo no promete un siguiente', () => {
    ponerXp(RANGOS[RANGOS.length - 1].puntos);
    const s = correr('pase').salida;
    expect(s).toContain('final del escalafon');
  });
});

describe('equipar', () => {
  it('equipa algo desbloqueado', () => {
    ponerXp(500);
    const r = correr('pase equipar tema-fosforo');
    expect(r.error).toBeUndefined();
    expect(leerPerfil().equipado.tema).toBe('tema-fosforo');
  });

  it('rechaza lo bloqueado y dice cuanto falta', () => {
    ponerXp(0);
    const r = correr('pase equipar tema-matriz');
    expect(r.error).toContain('bloqueado');
    expect(r.error).toContain('root');
    expect(leerPerfil().equipado.tema).toBe('tema-ambar');
  });

  it('rechaza un id inexistente', () => {
    expect(correr('pase equipar tema-inventado').error).toContain('no existe');
  });

  it('quitar vuelve al de fabrica', () => {
    ponerXp(500);
    correr('pase equipar tema-fosforo');
    correr('pase quitar tema');
    expect(leerPerfil().equipado.tema).toBe(EQUIPADO_DE_FABRICA.tema);
  });

  it('avisa si el subcomando no existe', () => {
    expect(correr('pase volar').error).toContain('no entiendo');
  });
});

describe('catalogo', () => {
  it('marca lo bloqueado con su requisito de XP', () => {
    ponerXp(0);
    const s = correr('pase cosmeticos').salida;
    expect(s).toContain('tema-matriz');
    expect(s).toContain('5.400 XP');
  });

  it('lista todos los cosmeticos del catalogo', () => {
    ponerXp(99999);
    const s = correr('pase cosmeticos').salida;
    for (const c of COSMETICOS) expect(s, 'falta ' + c.id).toContain(c.id);
  });
});
