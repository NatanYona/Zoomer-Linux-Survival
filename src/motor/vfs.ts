// CONTRATO COMPARTIDO. Helpers de filesystem que usan TODOS los comandos.
import type { Estado, Nodo, NodoDir } from './tipos';

export const HOME = '/home/alumno';
const BS = String.fromCharCode(92); // backslash, sin literales para no pelear con el escapado

export function rutaStr(segs: string[]): string {
  return '/' + segs.join('/');
}

/** Convierte una ruta escrita por el alumno en segmentos absolutos. */
export function resolver(ruta: string, e: Estado): string[] {
  let r = ruta;
  if (r === '~' || r.startsWith('~/')) r = HOME + r.slice(1);
  const segs = r.startsWith('/') ? [] : [...e.cwd];
  for (const s of r.split('/')) {
    if (!s || s === '.') continue;
    if (s === '..') { segs.pop(); continue; }
    segs.push(s);
  }
  return segs;
}

export function buscar(segs: string[], e: Estado): Nodo | null {
  let n: Nodo = e.fs;
  for (const s of segs) {
    if (n.tipo !== 'dir') return null;
    const h: Nodo | undefined = n.hijos[s];
    if (!h) return null;
    n = h;
  }
  return n;
}

export const buscarRuta = (ruta: string, e: Estado): Nodo | null => buscar(resolver(ruta, e), e);

export function esDir(n: Nodo | null | undefined): n is NodoDir {
  return !!n && n.tipo === 'dir';
}

/** Directorio contenedor de segs, o null si no existe. */
export function padre(segs: string[], e: Estado): NodoDir | null {
  const n = buscar(segs.slice(0, -1), e);
  return esDir(n) ? n : null;
}

export function listar(d: NodoDir, ocultos = false): string[] {
  return Object.keys(d.hijos).filter((k) => ocultos || !k.startsWith('.')).sort();
}

export function clonar(n: Nodo): Nodo {
  return n.tipo === 'arch'
    ? { ...n }
    : { ...n, hijos: Object.fromEntries(Object.entries(n.hijos).map(([k, v]) => [k, clonar(v)])) };
}

/** '-rwxr-xr--' */
export function modoStr(n: Nodo): string {
  const letras = ['x', 'w', 'r'];
  let s = n.tipo === 'dir' ? 'd' : '-';
  for (let g = 2; g >= 0; g--) {
    const dig = (n.modo >> (g * 3)) & 7;
    for (let b = 2; b >= 0; b--) s += (dig >> b) & 1 ? letras[b] : '-';
  }
  return s;
}

export function puede(n: Nodo, perm: 'r' | 'w' | 'x', e: Estado): boolean {
  const bit = { r: 4, w: 2, x: 1 }[perm];
  const g = n.duenio === e.usuario ? 2 : e.grupos.includes(n.grupo) ? 1 : 0;
  return (((n.modo >> (g * 3)) & 7) & bit) !== 0;
}

/** Expande * y ? contra el filesystem. Si no matchea nada devuelve el patron literal (como bash). */
// ponytail: glob solo en el ultimo segmento; 'a*/b*' no expande la parte del medio.
export function expandir(arg: string, e: Estado): string[] {
  if (!/[*?]/.test(arg)) return [arg];
  const barra = arg.lastIndexOf('/');
  const prefijo = barra >= 0 ? arg.slice(0, barra + 1) : '';
  const patron = arg.slice(barra + 1);
  const dir = buscar(resolver(prefijo || '.', e), e);
  if (!esDir(dir)) return [arg];
  const cuerpo = [...patron]
    .map((c) => (c === '*' ? '[^/]*' : c === '?' ? '[^/]' : /[a-zA-Z0-9_-]/.test(c) ? c : BS + c))
    .join('');
  const re = new RegExp('^' + cuerpo + '$');
  const hits = listar(dir, patron.startsWith('.')).filter((n) => re.test(n));
  return hits.length ? hits.map((h) => prefijo + h) : [arg];
}

export function escribir(ruta: string, contenido: string, e: Estado): boolean {
  const segs = resolver(ruta, e);
  const p = padre(segs, e);
  if (!p || !segs.length) return false;
  const nombre = segs[segs.length - 1];
  const existente = p.hijos[nombre];
  if (esDir(existente)) return false;
  p.hijos[nombre] = existente
    ? ({ ...existente, contenido } as Nodo)
    : { tipo: 'arch', modo: 0o644, duenio: e.usuario, grupo: e.grupos[0], contenido };
  return true;
}

export function borrar(segs: string[], e: Estado): boolean {
  const p = padre(segs, e);
  const nombre = segs[segs.length - 1];
  if (!p || !nombre || !p.hijos[nombre]) return false;
  delete p.hijos[nombre];
  return true;
}
