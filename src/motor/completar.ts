// Completado tipo bash: primer token = nombre de comando, resto = rutas del vfs.
import type { Estado } from './tipos';
import { resolver, buscar, esDir, listar } from './vfs';

export interface Sugerencia {
  /** La linea completa ya con el prefijo comun aplicado. Si no hay nada que completar, la linea original. */
  linea: string;
  /** Candidatos a mostrar cuando hay ambiguedad. Vacio si hubo completado unico o ningun match. */
  candidatos: string[];
}

function prefijoComunMasLargo(xs: string[]): string {
  if (xs.length === 0) return '';
  let comun = xs[0];
  for (const x of xs.slice(1)) {
    let i = 0;
    while (i < comun.length && i < x.length && comun[i] === x[i]) i++;
    comun = comun.slice(0, i);
    if (!comun) break;
  }
  return comun;
}

export function completar(linea: string, e: Estado, comandos: string[]): Sugerencia {
  // Cursor siempre al final. Si termina en espacio, el fragmento a completar es vacio.
  const terminaEnEspacio = linea.length > 0 && linea.endsWith(' ');
  let prefijo: string;
  let fragmento: string;
  if (linea === '' || terminaEnEspacio) {
    prefijo = linea;
    fragmento = '';
  } else {
    const fin = /\S*$/.exec(linea)![0];
    fragmento = fin;
    prefijo = linea.slice(0, linea.length - fragmento.length);
  }

  const esPrimerToken = prefijo.trim() === '';

  if (esPrimerToken) {
    const candidatos = comandos.filter((c) => c.startsWith(fragmento)).sort();
    if (candidatos.length === 0) return { linea, candidatos: [] };
    if (candidatos.length === 1) return { linea: prefijo + candidatos[0] + ' ', candidatos: [] };
    return { linea: prefijo + prefijoComunMasLargo(candidatos), candidatos };
  }

  // Completado de rutas: separar por la ultima '/' en parte-directorio y parte-nombre.
  const barra = fragmento.lastIndexOf('/');
  const parteDir = barra >= 0 ? fragmento.slice(0, barra + 1) : '';
  const parteNombre = barra >= 0 ? fragmento.slice(barra + 1) : fragmento;

  const dirNode = buscar(resolver(parteDir, e), e);
  if (!esDir(dirNode)) return { linea, candidatos: [] };

  const ocultos = parteNombre.startsWith('.');
  const entradas = listar(dirNode, ocultos).filter((n) => n.startsWith(parteNombre));

  if (entradas.length === 0) return { linea, candidatos: [] };

  if (entradas.length === 1) {
    const nombre = entradas[0];
    const sufijo = esDir(dirNode.hijos[nombre]) ? '/' : ' ';
    return { linea: prefijo + parteDir + nombre + sufijo, candidatos: [] };
  }

  return { linea: prefijo + parteDir + prefijoComunMasLargo(entradas), candidatos: entradas };
}
