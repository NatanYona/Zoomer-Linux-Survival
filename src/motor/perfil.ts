// Perfil del alumno: XP, cosmeticos desbloqueados y lo que tiene equipado.
//
// Vive aca y no dentro de `Estado` a proposito: `Estado` se reinicia en cada
// leccion (lo asume la suite de pruebas), y el progreso del pase tiene que
// sobrevivir a eso. El comando `pase` lo lee desde el motor y la UI se suscribe
// con useSyncExternalStore, que es API nativa de React: sin libreria de estado.
import type { TipoCosmetico } from '../contenido/pase';

export interface Perfil {
  xp: number;
  desbloqueados: string[];
  equipado: Record<TipoCosmetico, string>;
}

export const EQUIPADO_DE_FABRICA: Record<TipoCosmetico, string> = {
  tema: 'tema-ambar',
  prompt: 'prompt-simple',
  efecto: '',
  cursor: 'cursor-barra',
};

let actual: Perfil = {
  xp: 0,
  desbloqueados: [],
  equipado: { ...EQUIPADO_DE_FABRICA },
};

const oyentes = new Set<() => void>();

/** getSnapshot para useSyncExternalStore: la referencia solo cambia al escribir. */
export const leerPerfil = (): Perfil => actual;

export function escribirPerfil(cambios: Partial<Perfil>): void {
  actual = { ...actual, ...cambios };
  for (const f of oyentes) f();
}

export function suscribirPerfil(f: () => void): () => void {
  oyentes.add(f);
  return () => {
    oyentes.delete(f);
  };
}

/** Equipa un cosmetico. Devuelve false si no esta desbloqueado. */
export function equipar(id: string, tipo: TipoCosmetico): boolean {
  if (!actual.desbloqueados.includes(id)) return false;
  escribirPerfil({ equipado: { ...actual.equipado, [tipo]: id } });
  return true;
}

export function desequipar(tipo: TipoCosmetico): void {
  escribirPerfil({ equipado: { ...actual.equipado, [tipo]: EQUIPADO_DE_FABRICA[tipo] } });
}
