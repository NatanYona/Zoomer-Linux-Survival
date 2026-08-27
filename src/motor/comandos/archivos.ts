// Comandos de archivos y directorios: pwd, ls, cd, mkdir, rmdir, mv, cp, rm,
// touch, cat, more, less, head, tail, find, chmod, file.
import type { Comando, Nodo, NodoDir, Registro } from '../tipos';
import { ok, falla } from '../tipos';
import { HOME, rutaStr, resolver, buscar, buscarRuta, esDir, padre, listar, clonar, modoStr, escribir, borrar } from '../vfs';

// ponytail: no se verifican permisos (r/w/x) en ningun comando de este archivo;
// el vfs expone puede() para eso, agregarlo si una leccion necesita simular "Permiso denegado".

// ---------- pwd ----------
export const pwd: Comando = (ctx) => ok(rutaStr(ctx.estado.cwd) + '\n');

// ---------- ls ----------
function tamanoDe(n: Nodo): number {
  return n.tipo === 'dir' ? 4096 : n.contenido.length;
}

function filaLarga(nombre: string, n: Nodo): [string, string, string, string, string] {
  return [modoStr(n), n.duenio, n.grupo, String(tamanoDe(n)), nombre];
}

function formatearLargas(filas: [string, string, string, string, string][]): string {
  const anchoDuenio = Math.max(0, ...filas.map((f) => f[1].length));
  const anchoGrupo = Math.max(0, ...filas.map((f) => f[2].length));
  const anchoTam = Math.max(0, ...filas.map((f) => f[3].length));
  return filas
    .map(([modo, duenio, grupo, tam, nombre]) => `${modo} ${duenio.padEnd(anchoDuenio)} ${grupo.padEnd(anchoGrupo)} ${tam.padStart(anchoTam)} ${nombre}`)
    .join('\n');
}

export const ls: Comando = (ctx) => {
  const banderas = ctx.args.filter((a) => a.startsWith('-')).join('');
  const objetivos = ctx.args.filter((a) => !a.startsWith('-'));
  const rutas = objetivos.length ? objetivos : ['.'];
  const larga = banderas.includes('l');
  const ocultos = banderas.includes('a');

  const secciones: string[] = [];
  const errores: string[] = [];
  for (const ruta of rutas) {
    const n = buscarRuta(ruta, ctx.estado);
    if (!n) {
      errores.push(`ls: no se puede acceder a «${ruta}»: No existe el archivo o el directorio`);
      continue;
    }
    if (!esDir(n)) {
      secciones.push(larga ? formatearLargas([filaLarga(ruta, n)]) : ruta);
      continue;
    }
    const nombres = listar(n, ocultos);
    const cuerpo = larga ? formatearLargas(nombres.map((nom) => filaLarga(nom, n.hijos[nom]))) : nombres.join('  ');
    secciones.push((rutas.length > 1 ? `${ruta}:\n` : '') + cuerpo);
  }
  const salida = secciones.join('\n\n') + (secciones.length ? '\n' : '');
  return errores.length ? { salida, error: errores.join('\n'), codigo: 1 } : ok(salida);
};

// ---------- cd ----------
export const cd: Comando = (ctx) => {
  const arg = ctx.args[0];
  const ruta = arg ?? HOME;
  const segs = resolver(ruta, ctx.estado);
  const n = buscar(segs, ctx.estado);
  if (!n) return falla(`cd: ${arg ?? ruta}: No existe el archivo o el directorio`);
  if (!esDir(n)) return falla(`cd: ${arg ?? ruta}: No es un directorio`);
  ctx.estado.cwd = segs;
  return ok();
};

// ---------- mkdir ----------
export const mkdir: Comando = (ctx) => {
  const p = ctx.args.includes('-p');
  const rutas = ctx.args.filter((a) => a !== '-p');
  const errores: string[] = [];
  for (const ruta of rutas) {
    const segs = resolver(ruta, ctx.estado);
    if (!segs.length) continue;
    if (p) {
      let n: NodoDir = ctx.estado.fs;
      let falloAca = false;
      for (const s of segs) {
        const h = n.hijos[s];
        if (!h) {
          const nuevo: NodoDir = { tipo: 'dir', modo: 0o755, duenio: ctx.estado.usuario, grupo: ctx.estado.grupos[0], hijos: {} };
          n.hijos[s] = nuevo;
          n = nuevo;
        } else if (esDir(h)) {
          n = h;
        } else {
          errores.push(`mkdir: no se puede crear el directorio «${ruta}»: El archivo ya existe`);
          falloAca = true;
          break;
        }
      }
      void falloAca;
    } else {
      if (buscar(segs, ctx.estado)) {
        errores.push(`mkdir: no se puede crear el directorio «${ruta}»: El archivo ya existe`);
        continue;
      }
      const pdir = padre(segs, ctx.estado);
      if (!pdir) {
        errores.push(`mkdir: no se puede crear el directorio «${ruta}»: No existe el archivo o el directorio`);
        continue;
      }
      pdir.hijos[segs[segs.length - 1]] = { tipo: 'dir', modo: 0o755, duenio: ctx.estado.usuario, grupo: ctx.estado.grupos[0], hijos: {} };
    }
  }
  return errores.length ? falla(errores.join('\n')) : ok();
};

// ---------- rmdir ----------
export const rmdir: Comando = (ctx) => {
  const errores: string[] = [];
  for (const ruta of ctx.args) {
    const segs = resolver(ruta, ctx.estado);
    const n = buscar(segs, ctx.estado);
    if (!n) {
      errores.push(`rmdir: fallo al borrar «${ruta}»: No existe el archivo o el directorio`);
      continue;
    }
    if (!esDir(n)) {
      errores.push(`rmdir: fallo al borrar «${ruta}»: No es un directorio`);
      continue;
    }
    if (Object.keys(n.hijos).length) {
      errores.push(`rmdir: fallo al borrar «${ruta}»: El directorio no está vacío`);
      continue;
    }
    borrar(segs, ctx.estado);
  }
  return errores.length ? falla(errores.join('\n')) : ok();
};

// ---------- mv ----------
// ponytail: no se detecta mover un directorio dentro de si mismo/un descendiente; caso raro para un lab de SO.
export const mv: Comando = (ctx) => {
  if (ctx.args.length < 2) return falla('mv: faltan operandos');
  const destino = ctx.args[ctx.args.length - 1];
  const origenes = ctx.args.slice(0, -1);
  const segsDestino = resolver(destino, ctx.estado);
  const destinoEsDir = esDir(buscar(segsDestino, ctx.estado));
  if (origenes.length > 1 && !destinoEsDir) {
    return falla(`mv: destino «${destino}» no es un directorio`);
  }
  const errores: string[] = [];
  for (const origen of origenes) {
    const segsOrigen = resolver(origen, ctx.estado);
    const nOrigen = buscar(segsOrigen, ctx.estado);
    if (!nOrigen) {
      errores.push(`mv: no se puede mover «${origen}»: No existe el archivo o el directorio`);
      continue;
    }
    const pOrigen = padre(segsOrigen, ctx.estado);
    const nombreOrigen = segsOrigen[segsOrigen.length - 1];
    const segsFinal = destinoEsDir ? [...segsDestino, nombreOrigen] : segsDestino;
    const pFinal = padre(segsFinal, ctx.estado);
    if (!pFinal) {
      errores.push(`mv: no se puede mover «${origen}» a «${destino}»: No existe el archivo o el directorio`);
      continue;
    }
    pFinal.hijos[segsFinal[segsFinal.length - 1]] = nOrigen;
    if (pOrigen) delete pOrigen.hijos[nombreOrigen];
  }
  return errores.length ? falla(errores.join('\n')) : ok();
};

// ---------- cp ----------
export const cp: Comando = (ctx) => {
  const recursivo = ctx.args.includes('-r') || ctx.args.includes('-R');
  const rutas = ctx.args.filter((a) => a !== '-r' && a !== '-R');
  if (rutas.length < 2) return falla('cp: faltan operandos');
  const destino = rutas[rutas.length - 1];
  const origenes = rutas.slice(0, -1);
  const segsDestino = resolver(destino, ctx.estado);
  const destinoEsDir = esDir(buscar(segsDestino, ctx.estado));
  if (origenes.length > 1 && !destinoEsDir) {
    return falla(`cp: destino «${destino}» no es un directorio`);
  }
  const errores: string[] = [];
  for (const origen of origenes) {
    const segsOrigen = resolver(origen, ctx.estado);
    const nOrigen = buscar(segsOrigen, ctx.estado);
    if (!nOrigen) {
      errores.push(`cp: no se puede acceder a «${origen}»: No existe el archivo o el directorio`);
      continue;
    }
    if (esDir(nOrigen) && !recursivo) {
      errores.push(`cp: se omite el directorio «${origen}»`);
      continue;
    }
    const nombreOrigen = segsOrigen[segsOrigen.length - 1];
    const segsFinal = destinoEsDir ? [...segsDestino, nombreOrigen] : segsDestino;
    const pFinal = padre(segsFinal, ctx.estado);
    if (!pFinal) {
      errores.push(`cp: no se puede crear «${destino}»: No existe el archivo o el directorio`);
      continue;
    }
    pFinal.hijos[segsFinal[segsFinal.length - 1]] = clonar(nOrigen);
  }
  return errores.length ? falla(errores.join('\n')) : ok();
};

// ---------- rm ----------
export const rm: Comando = (ctx) => {
  const recursivo = ctx.args.includes('-r') || ctx.args.includes('-R');
  const forzar = ctx.args.includes('-f');
  const rutas = ctx.args.filter((a) => !a.startsWith('-'));
  const errores: string[] = [];
  for (const ruta of rutas) {
    const segs = resolver(ruta, ctx.estado);
    const n = buscar(segs, ctx.estado);
    if (!n) {
      if (!forzar) errores.push(`rm: no se puede borrar «${ruta}»: No existe el archivo o el directorio`);
      continue;
    }
    if (esDir(n) && !recursivo) {
      errores.push(`rm: no se puede borrar «${ruta}»: Es un directorio`);
      continue;
    }
    borrar(segs, ctx.estado);
  }
  return errores.length ? falla(errores.join('\n')) : ok();
};

// ---------- touch ----------
export const touch: Comando = (ctx) => {
  for (const ruta of ctx.args) {
    if (!buscarRuta(ruta, ctx.estado)) escribir(ruta, '', ctx.estado);
  }
  return ok();
};

// ---------- cat / more / less ----------
export const cat: Comando = (ctx) => {
  if (!ctx.args.length) return ok(ctx.entrada);
  const partes: string[] = [];
  const errores: string[] = [];
  for (const ruta of ctx.args) {
    const n = buscarRuta(ruta, ctx.estado);
    if (!n) {
      errores.push(`cat: ${ruta}: No existe el archivo o el directorio`);
      continue;
    }
    if (esDir(n)) {
      errores.push(`cat: ${ruta}: Es un directorio`);
      continue;
    }
    partes.push(n.contenido);
  }
  const salida = partes.join('');
  return errores.length ? { salida, error: errores.join('\n'), codigo: 1 } : ok(salida);
};

// more/less: la UI ya scrollea, se comportan igual que cat.
export const more: Comando = cat;
export const less: Comando = cat;

// ---------- head / tail ----------
function parseN(args: string[]): { n: number; resto: string[] } {
  let n = 10;
  const resto: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-n') {
      n = Number(args[++i]) || 10;
    } else if (/^-n\d+$/.test(args[i])) {
      n = Number(args[i].slice(2)) || 10;
    } else {
      resto.push(args[i]);
    }
  }
  return { n, resto };
}

// ponytail: solo cuenta positiva desde el inicio/final; "-n +5" (a partir de la linea 5) no soportado.
function primerasLineas(texto: string, n: number): string {
  const lineas = texto.split('\n');
  if (lineas[lineas.length - 1] === '') lineas.pop();
  return lineas.length ? lineas.slice(0, n).join('\n') + '\n' : '';
}

function ultimasLineas(texto: string, n: number): string {
  const lineas = texto.split('\n');
  if (lineas[lineas.length - 1] === '') lineas.pop();
  return lineas.length ? lineas.slice(-n).join('\n') + '\n' : '';
}

function comandoRecorte(nombre: string, recortar: (t: string, n: number) => string): Comando {
  return (ctx) => {
    const { n, resto } = parseN(ctx.args);
    if (!resto.length) return ok(recortar(ctx.entrada, n));
    const errores: string[] = [];
    const partes: string[] = [];
    for (const ruta of resto) {
      const nodo = buscarRuta(ruta, ctx.estado);
      if (!nodo) {
        errores.push(`${nombre}: no se puede abrir «${ruta}» para lectura: No existe el archivo o el directorio`);
        continue;
      }
      if (esDir(nodo)) {
        errores.push(`${nombre}: error al leer «${ruta}»: Es un directorio`);
        continue;
      }
      const encabezado = resto.length > 1 ? `==> ${ruta} <==\n` : '';
      partes.push(encabezado + recortar(nodo.contenido, n));
    }
    const salida = partes.join(resto.length > 1 ? '\n' : '');
    return errores.length ? { salida, error: errores.join('\n'), codigo: 1 } : ok(salida);
  };
}

export const head: Comando = comandoRecorte('head', primerasLineas);
export const tail: Comando = comandoRecorte('tail', ultimasLineas);

// ---------- find ----------
// ponytail: unico predicado soportado es -name; sin -type, -mtime, etc.
function patronARegExp(patron: string): RegExp {
  let cuerpo = '';
  for (const c of patron) {
    if (c === '*') cuerpo += '.*';
    else if (c === '?') cuerpo += '.';
    else cuerpo += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp('^' + cuerpo + '$');
}

function recorrer(n: NodoDir, ruta: string, salida: string[]): void {
  for (const nombre of Object.keys(n.hijos).sort()) {
    const hijo = n.hijos[nombre];
    const rutaHijo = ruta === '/' ? '/' + nombre : ruta + '/' + nombre;
    salida.push(rutaHijo);
    if (esDir(hijo)) recorrer(hijo, rutaHijo, salida);
  }
}

export const find: Comando = (ctx) => {
  const ruta = ctx.args[0] ?? '.';
  const idxName = ctx.args.indexOf('-name');
  const patron = idxName >= 0 ? ctx.args[idxName + 1] : undefined;
  const segs = resolver(ruta, ctx.estado);
  const n = buscar(segs, ctx.estado);
  if (!n) return falla(`find: «${ruta}»: No existe el archivo o el directorio`);
  const raizAbs = rutaStr(segs);
  const todas: string[] = [raizAbs];
  if (esDir(n)) recorrer(n, raizAbs, todas);
  const re = patron ? patronARegExp(patron) : null;
  const filtradas = re ? todas.filter((p) => re.test(p.split('/').pop() || '')) : todas;
  return ok(filtradas.length ? filtradas.join('\n') + '\n' : '');
};

// ---------- chmod ----------
export const chmod: Comando = (ctx) => {
  if (!ctx.args.length) return falla('chmod: falta un operando');
  const [modoArg, ...archivos] = ctx.args;
  if (!/^[0-7]{3}$/.test(modoArg)) {
    return falla(`chmod: modo invalido: «${modoArg}»: este simulador solo admite notacion octal de 3 digitos (ej: chmod 754 archivo.txt), no notacion simbolica como u+x`);
  }
  const modo = parseInt(modoArg, 8);
  const errores: string[] = [];
  for (const ruta of archivos) {
    const n = buscarRuta(ruta, ctx.estado);
    if (!n) {
      errores.push(`chmod: no se puede acceder a «${ruta}»: No existe el archivo o el directorio`);
      continue;
    }
    n.modo = modo;
  }
  return errores.length ? falla(errores.join('\n')) : ok();
};

// ---------- file ----------
export const file: Comando = (ctx) => {
  if (!ctx.args.length) return falla('file: falta un operando');
  const lineas = ctx.args.map((ruta) => {
    const n = buscarRuta(ruta, ctx.estado);
    if (!n) return `${ruta}: No existe el archivo o el directorio`;
    if (esDir(n)) return `${ruta}: directorio`;
    if (n.contenido.startsWith('[binario]')) return `${ruta}: datos`;
    if (n.contenido.startsWith('#!')) return `${ruta}: guion de shell ejecutable`;
    return `${ruta}: texto ASCII`;
  });
  return ok(lineas.join('\n') + '\n');
};

export const registroArchivos: Registro = {
  pwd,
  ls,
  cd,
  mkdir,
  rmdir,
  mv,
  cp,
  rm,
  touch,
  cat,
  more,
  less,
  head,
  tail,
  find,
  chmod,
  file,
};
