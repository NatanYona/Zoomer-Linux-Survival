// Interprete de un subconjunto de bash, escrito para el modulo de scripts.
//
// Reemplaza al viejo parser de una sola linea. Lo que soporta:
//  - comillas simples (literales), dobles (expanden) y barra invertida
//  - variables: x=1, $x, ${x}, ${#x}, ${x:-def}, $1..$9, $#, $@, $*, $?, $0
//  - sustitucion $(cmd) y `cmd`, aritmetica $((expr)), llaves {1..5} y {a,b}
//  - tuberias |, listas ; && ||, negacion !, redirecciones > >> < 2> 2>&1 &> >&2
//  - if/elif/else/fi, for/in/do/done, while/until, { ...; }, funciones
//  - builtins: test/[ ], [[ ]], read, exit, return, local, break, continue,
//    true, false, :, export, unset, bash/sh, source/., printf
//  - ejecutar scripts (./x.sh, ~/x.sh, bash x.sh) respetando los permisos
//
// Lo que NO soporta a proposito: subshells ( ), (( )), heredocs <<, case,
// arrays, jobs en segundo plano. Si una leccion lo necesita, se agrega aca.
import type { Corrida, Estado, EditorPedido } from './tipos';
import { buscar, buscarRuta, esDir, escribir, expandir, puede, resolver, rutaStr, HOME } from './vfs';
import { REGISTRO } from './comandos';

// ---------------------------------------------------------------- tipos

type Op =
  | '|' | '||' | '&&' | ';' | '\n' | '!'
  | '>' | '>>' | '<' | '2>' | '2>>' | '2>&1' | '&>' | '>&2' | '()';

interface Token {
  tipo: 'palabra' | 'op';
  valor: string;
  linea: number;
}

interface Redir {
  op: '>' | '>>' | '<' | '2>' | '2>>' | '2>&1' | '&>' | '>&2';
  destino: string; // palabra cruda (se expande al ejecutar)
}

type Nodo =
  | { k: 'simple'; asig: [string, string][]; palabras: string[]; redirs: Redir[]; linea: number }
  | { k: 'tuberia'; cmds: Nodo[]; neg: boolean }
  | { k: 'yo'; primero: Nodo; resto: ['&&' | '||', Nodo][] }
  | { k: 'lista'; items: Nodo[] }
  | { k: 'if'; ramas: [Nodo, Nodo][]; otro?: Nodo; redirs: Redir[] }
  | { k: 'for'; variable: string; palabras: string[] | null; cuerpo: Nodo; redirs: Redir[] }
  | { k: 'while'; cond: Nodo; cuerpo: Nodo; hasta: boolean; redirs: Redir[] }
  | { k: 'grupo'; cuerpo: Nodo; redirs: Redir[] }
  | { k: 'funcion'; nombre: string; cuerpo: Nodo };

export class ErrorSintaxis extends Error {
  constructor(msg: string, public linea: number, public incompleto = false) {
    super(msg);
  }
}

// ---------------------------------------------------------------- lexer

/** Recorre una sustitucion $( ... ) o $(( ... )) respetando comillas y anidamiento. Devuelve el indice despues del cierre. */
function saltarParentesis(src: string, i: number, linea: number): number {
  // i apunta al primer '(' despues del '$'
  let prof = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "'") {
      const fin = src.indexOf("'", i + 1);
      if (fin < 0) break;
      i = fin + 1;
      continue;
    }
    if (c === '"') {
      i = saltarComillaDoble(src, i, linea);
      continue;
    }
    if (c === '\\') {
      i += 2;
      continue;
    }
    if (c === '(') prof++;
    if (c === ')') {
      prof--;
      if (prof === 0) return i + 1;
    }
    i++;
  }
  throw new ErrorSintaxis('falta cerrar el paréntesis de $(...)', linea, true);
}

function saltarComillaDoble(src: string, i: number, linea: number): number {
  // i apunta a la comilla de apertura
  i++;
  while (i < src.length) {
    const c = src[i];
    if (c === '\\') {
      i += 2;
      continue;
    }
    if (c === '"') return i + 1;
    if (c === '$' && src[i + 1] === '(') {
      i = saltarParentesis(src, i + 1, linea);
      continue;
    }
    if (c === '`') {
      const fin = src.indexOf('`', i + 1);
      if (fin < 0) break;
      i = fin + 1;
      continue;
    }
    i++;
  }
  throw new ErrorSintaxis('falta cerrar las comillas dobles (")', linea, true);
}

export function tokenizar(src: string): Token[] {
  const toks: Token[] = [];
  let linea = 1;
  let i = 0;
  let pal = '';
  let hay = false;

  const empujar = () => {
    if (hay) toks.push({ tipo: 'palabra', valor: pal, linea });
    pal = '';
    hay = false;
  };
  const op = (v: Op) => toks.push({ tipo: 'op', valor: v, linea });

  while (i < src.length) {
    const c = src[i];
    const sig = src[i + 1];

    if (c === ' ' || c === '\t' || c === '\r') {
      empujar();
      i++;
      continue;
    }
    if (c === '\n') {
      empujar();
      op('\n');
      linea++;
      i++;
      continue;
    }
    if (c === '#' && !hay) {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    if (c === '\\') {
      if (sig === '\n') {
        // continuacion de linea
        i += 2;
        linea++;
        continue;
      }
      pal += c + (sig ?? '');
      hay = true;
      i += 2;
      continue;
    }
    if (c === "'") {
      const fin = src.indexOf("'", i + 1);
      if (fin < 0) throw new ErrorSintaxis("falta cerrar las comillas simples (')", linea, true);
      const trozo = src.slice(i, fin + 1);
      linea += (trozo.match(/\n/g) ?? []).length;
      pal += trozo;
      hay = true;
      i = fin + 1;
      continue;
    }
    if (c === '"') {
      const fin = saltarComillaDoble(src, i, linea);
      const trozo = src.slice(i, fin);
      linea += (trozo.match(/\n/g) ?? []).length;
      pal += trozo;
      hay = true;
      i = fin;
      continue;
    }
    if (c === '`') {
      const fin = src.indexOf('`', i + 1);
      if (fin < 0) throw new ErrorSintaxis('falta cerrar la comilla invertida (`)', linea, true);
      pal += src.slice(i, fin + 1);
      hay = true;
      i = fin + 1;
      continue;
    }
    if (c === '$' && sig === '(') {
      const fin = saltarParentesis(src, i + 1, linea);
      pal += src.slice(i, fin);
      hay = true;
      i = fin;
      continue;
    }
    if (c === '$' && sig === '{') {
      const fin = src.indexOf('}', i);
      if (fin < 0) throw new ErrorSintaxis('falta cerrar la llave de ${...}', linea, true);
      pal += src.slice(i, fin + 1);
      hay = true;
      i = fin + 1;
      continue;
    }
    if (c === '|') {
      empujar();
      if (sig === '|') { op('||'); i += 2; } else { op('|'); i++; }
      continue;
    }
    if (c === '&') {
      empujar();
      if (sig === '&') { op('&&'); i += 2; }
      else if (sig === '>') { op('&>'); i += 2; }
      else { op(';'); i++; } // sin procesos en segundo plano: se comporta como ;
      continue;
    }
    if (c === ';') {
      empujar();
      op(';');
      i++;
      continue;
    }
    if (c === '>') {
      if (pal === '2' && hay) {
        pal = '';
        hay = false;
        if (sig === '>') { op('2>>'); i += 2; }
        else if (sig === '&' && src[i + 2] === '1') { op('2>&1'); i += 3; }
        else { op('2>'); i++; }
        continue;
      }
      empujar();
      if (sig === '>') { op('>>'); i += 2; }
      else if (sig === '&' && src[i + 2] === '2') { op('>&2'); i += 3; }
      else { op('>'); i++; }
      continue;
    }
    if (c === '<') {
      empujar();
      if (sig === '<') throw new ErrorSintaxis('este simulador no soporta << (heredoc)', linea);
      op('<');
      i++;
      continue;
    }
    if (c === '(') {
      if (sig === ')') {
        empujar();
        op('()');
        i += 2;
        continue;
      }
      // "f ( )" con espacio
      const resto = src.slice(i + 1).match(/^\s*\)/);
      if (resto) {
        empujar();
        op('()');
        i += 1 + resto[0].length;
        continue;
      }
      throw new ErrorSintaxis('este simulador no soporta subshells ( ... ) ni (( ... )); para cuentas usá x=$((x + 1))', linea);
    }
    if (c === ')') throw new ErrorSintaxis('error de sintaxis cerca de «)»', linea);

    pal += c;
    hay = true;
    i++;
  }
  empujar();
  return toks;
}

// ---------------------------------------------------------------- parser

const ES_ASIG = /^[A-Za-z_][A-Za-z0-9_]*=/;
const OPS_REDIR = new Set(['>', '>>', '<', '2>', '2>>', '2>&1', '&>', '>&2']);

class Parser {
  i = 0;
  constructor(private t: Token[]) {}

  ver(): Token | undefined {
    return this.t[this.i];
  }
  lineaActual(): number {
    return (this.t[this.i] ?? this.t[this.t.length - 1])?.linea ?? 1;
  }
  esPalabra(v: string): boolean {
    const t = this.ver();
    return !!t && t.tipo === 'palabra' && t.valor === v;
  }
  esOp(v: string): boolean {
    const t = this.ver();
    return !!t && t.tipo === 'op' && t.valor === v;
  }
  saltarSeparadores() {
    while (this.esOp('\n') || this.esOp(';')) this.i++;
  }
  saltarSaltos() {
    while (this.esOp('\n')) this.i++;
  }
  esperar(v: string) {
    this.saltarSeparadores();
    if (!this.esPalabra(v)) {
      const t = this.ver();
      if (!t) throw new ErrorSintaxis(`se esperaba «${v}» y el texto terminó`, this.lineaActual(), true);
      throw new ErrorSintaxis(`se esperaba «${v}» cerca de «${t.valor === '\n' ? 'salto de línea' : t.valor}»`, t.linea);
    }
    this.i++;
  }

  programa(): Nodo {
    const n = this.lista([]);
    this.saltarSeparadores();
    const t = this.ver();
    if (t) throw new ErrorSintaxis(`error de sintaxis cerca de «${t.valor}»`, t.linea);
    return n;
  }

  /** Lista de comandos hasta una palabra de cierre (then, fi, done...). */
  lista(cierres: string[]): Nodo {
    const items: Nodo[] = [];
    for (;;) {
      this.saltarSeparadores();
      const t = this.ver();
      if (!t) break;
      if (t.tipo === 'palabra' && cierres.includes(t.valor)) break;
      if (t.tipo === 'op' && t.valor !== '!') {
        throw new ErrorSintaxis(`error de sintaxis cerca de «${t.valor}»`, t.linea);
      }
      if (t.tipo === 'palabra' && ['then', 'elif', 'else', 'fi', 'do', 'done', '}'].includes(t.valor)) {
        throw new ErrorSintaxis(`error de sintaxis cerca de «${t.valor}» inesperado`, t.linea);
      }
      items.push(this.yo());
    }
    return { k: 'lista', items };
  }

  yo(): Nodo {
    const primero = this.tuberia();
    const resto: ['&&' | '||', Nodo][] = [];
    while (this.esOp('&&') || this.esOp('||')) {
      const op = this.ver()!.valor as '&&' | '||';
      this.i++;
      this.saltarSaltos();
      if (!this.ver()) throw new ErrorSintaxis(`falta un comando después de «${op}»`, this.lineaActual(), true);
      resto.push([op, this.tuberia()]);
    }
    return resto.length ? { k: 'yo', primero, resto } : primero;
  }

  tuberia(): Nodo {
    let neg = false;
    if (this.esPalabra('!') || this.esOp('!')) {
      neg = true;
      this.i++;
    }
    const cmds = [this.comando()];
    while (this.esOp('|')) {
      this.i++;
      this.saltarSaltos();
      if (!this.ver()) throw new ErrorSintaxis('falta un comando después de «|»', this.lineaActual(), true);
      cmds.push(this.comando());
    }
    return cmds.length === 1 && !neg ? cmds[0] : { k: 'tuberia', cmds, neg };
  }

  redirsFinales(): Redir[] {
    const r: Redir[] = [];
    while (this.ver()?.tipo === 'op' && OPS_REDIR.has(this.ver()!.valor)) r.push(this.redir());
    return r;
  }

  redir(): Redir {
    const op = this.ver()!.valor as Redir['op'];
    this.i++;
    if (op === '2>&1' || op === '>&2') return { op, destino: '' };
    const t = this.ver();
    if (!t || t.tipo !== 'palabra') {
      throw new ErrorSintaxis(`falta el nombre del archivo después de «${op}»`, this.lineaActual(), !t);
    }
    this.i++;
    return { op, destino: t.valor };
  }

  comando(): Nodo {
    const t = this.ver();
    if (!t) throw new ErrorSintaxis('falta un comando', this.lineaActual(), true);
    if (t.tipo === 'palabra') {
      switch (t.valor) {
        case 'if': return this.si();
        case 'for': return this.para();
        case 'while': return this.mientras(false);
        case 'until': return this.mientras(true);
        case '{': {
          this.i++;
          const cuerpo = this.lista(['}']);
          this.esperar('}');
          return { k: 'grupo', cuerpo, redirs: this.redirsFinales() };
        }
        case 'function': {
          this.i++;
          const nombre = this.ver();
          if (!nombre || nombre.tipo !== 'palabra') throw new ErrorSintaxis('falta el nombre de la función', this.lineaActual(), true);
          this.i++;
          if (this.esOp('()')) this.i++;
          return this.cuerpoFuncion(nombre.valor);
        }
      }
      // nombre() { ... }
      const sig = this.t[this.i + 1];
      if (sig && sig.tipo === 'op' && sig.valor === '()') {
        this.i += 2;
        return this.cuerpoFuncion(t.valor);
      }
    }
    return this.simple();
  }

  cuerpoFuncion(nombre: string): Nodo {
    if (!/^[A-Za-z_][\w-]*$/.test(nombre)) throw new ErrorSintaxis(`«${nombre}» no es un nombre de función válido`, this.lineaActual());
    this.saltarSaltos();
    if (!this.esPalabra('{')) {
      throw new ErrorSintaxis(`se esperaba «{» para abrir el cuerpo de ${nombre}()`, this.lineaActual(), !this.ver());
    }
    const cuerpo = this.comando();
    return { k: 'funcion', nombre, cuerpo };
  }

  si(): Nodo {
    this.i++; // if
    const ramas: [Nodo, Nodo][] = [];
    const cond = this.lista(['then']);
    this.esperar('then');
    ramas.push([cond, this.lista(['elif', 'else', 'fi'])]);
    let otro: Nodo | undefined;
    for (;;) {
      this.saltarSeparadores();
      if (this.esPalabra('elif')) {
        this.i++;
        const c = this.lista(['then']);
        this.esperar('then');
        ramas.push([c, this.lista(['elif', 'else', 'fi'])]);
        continue;
      }
      if (this.esPalabra('else')) {
        this.i++;
        otro = this.lista(['fi']);
      }
      break;
    }
    this.esperar('fi');
    return { k: 'if', ramas, otro, redirs: this.redirsFinales() };
  }

  para(): Nodo {
    this.i++; // for
    const v = this.ver();
    if (!v || v.tipo !== 'palabra') throw new ErrorSintaxis('falta el nombre de la variable después de «for»', this.lineaActual(), !v);
    if (!/^[A-Za-z_]\w*$/.test(v.valor)) throw new ErrorSintaxis(`«${v.valor}» no es un nombre de variable válido`, v.linea);
    this.i++;
    let palabras: string[] | null = null;
    this.saltarSaltos();
    if (this.esPalabra('in')) {
      this.i++;
      palabras = [];
      while (this.ver()?.tipo === 'palabra') {
        palabras.push(this.ver()!.valor);
        this.i++;
      }
    }
    this.esperar('do');
    const cuerpo = this.lista(['done']);
    this.esperar('done');
    return { k: 'for', variable: v.valor, palabras, cuerpo, redirs: this.redirsFinales() };
  }

  mientras(hasta: boolean): Nodo {
    this.i++;
    const cond = this.lista(['do']);
    this.esperar('do');
    const cuerpo = this.lista(['done']);
    this.esperar('done');
    return { k: 'while', cond, cuerpo, hasta, redirs: this.redirsFinales() };
  }

  simple(): Nodo {
    const linea = this.lineaActual();
    const asig: [string, string][] = [];
    const palabras: string[] = [];
    const redirs: Redir[] = [];
    for (;;) {
      const t = this.ver();
      if (!t) break;
      if (t.tipo === 'op') {
        if (OPS_REDIR.has(t.valor)) {
          redirs.push(this.redir());
          continue;
        }
        if (t.valor === '()') throw new ErrorSintaxis('error de sintaxis cerca de «()»', t.linea);
        break;
      }
      if (!palabras.length && ES_ASIG.test(t.valor)) {
        const eq = t.valor.indexOf('=');
        asig.push([t.valor.slice(0, eq), t.valor.slice(eq + 1)]);
        this.i++;
        continue;
      }
      palabras.push(t.valor);
      this.i++;
    }
    if (!palabras.length && !asig.length && !redirs.length) {
      const t = this.ver();
      throw new ErrorSintaxis(`error de sintaxis cerca de «${t ? t.valor : 'fin de línea'}»`, linea, !t);
    }
    return { k: 'simple', asig, palabras, redirs, linea };
  }
}

export function analizar(src: string): Nodo {
  return new Parser(tokenizar(src)).programa();
}

// ---------------------------------------------------------------- ejecucion

class Salida { constructor(public codigo: number) {} }
class Retorno { constructor(public codigo: number) {} }
class Corte { constructor(public tipo: 'break' | 'continue', public niveles: number) {} }
class Abortar { constructor(public mensaje: string) {} }

interface Sumidero {
  o: string;
  e: string;
  /** 2>&1: lo que va a stderr termina en stdout */
  unir?: boolean;
}
const escribirErr = (s: Sumidero, txt: string) => {
  if (s.unir) s.o += txt;
  else s.e += txt;
};

interface Entrada {
  texto: string;
  /** false cuando stdin es "el teclado": read no tiene de donde leer. */
  tuberia: boolean;
}

interface Global {
  pasos: number;
  editor?: EditorPedido;
}

interface Sesion {
  e: Estado;
  global: Global;
  /** alcances de variables: [0] es global, el resto son locales de funciones */
  alcances: Record<string, string>[];
  funciones: Record<string, Nodo>;
  params: string[];
  cero: string;
  ultimo: number;
  /** nombre del script en ejecucion, para los mensajes de error */
  script?: string;
  profundidad: number;
  enFuncion: number;
  enBucle: number;
  /** linea del script que se esta ejecutando */
  linea: number;
}

const MAX_PASOS = 5000;
const MAX_PROFUNDIDAD = 60;

function leerVar(s: Sesion, nombre: string): string | undefined {
  for (let i = s.alcances.length - 1; i >= 0; i--) {
    if (nombre in s.alcances[i]) return s.alcances[i][nombre];
  }
  switch (nombre) {
    case 'HOME': return HOME;
    case 'USER':
    case 'LOGNAME': return s.e.usuario;
    case 'PWD': return rutaStr(s.e.cwd);
    case 'SHELL': return '/bin/bash';
    case 'HOSTNAME': return 'so2-lab';
    case 'PATH': return '/usr/local/bin:/usr/bin:/bin';
    case 'RANDOM': return String(Math.floor(Math.random() * 32768));
  }
  return undefined;
}

function fijarVar(s: Sesion, nombre: string, valor: string) {
  for (let i = s.alcances.length - 1; i >= 1; i--) {
    if (nombre in s.alcances[i]) {
      s.alcances[i][nombre] = valor;
      return;
    }
  }
  s.alcances[0][nombre] = valor;
}

function parametro(s: Sesion, nombre: string): string {
  if (/^\d$/.test(nombre)) return nombre === '0' ? s.cero : s.params[Number(nombre) - 1] ?? '';
  switch (nombre) {
    case '#': return String(s.params.length);
    case '@':
    case '*': return s.params.join(' ');
    case '?': return String(s.ultimo);
    case '$': return '908';
  }
  return leerVar(s, nombre) ?? '';
}

// ---------- aritmetica

function aritmetica(expr: string, s: Sesion): number {
  const src = expr.replace(/\$\{?([A-Za-z_]\w*|\d|#|\?)\}?/g, (_, n) => parametro(s, n) || '0');
  const toks = src.match(/\d+|[A-Za-z_]\w*|\*\*|<=|>=|==|!=|&&|\|\||[-+*/%()<>!]/g) ?? [];
  const limpio = src.replace(/\d+|[A-Za-z_]\w*|\*\*|<=|>=|==|!=|&&|\|\||[-+*/%()<>!]|\s/g, '');
  if (limpio) throw new Abortar(`${expr.trim()}: error de sintaxis en la expresión (el error está en «${limpio[0]}»)`);
  let i = 0;
  const ver = () => toks[i];
  const tomar = () => toks[i++];
  const PREC: Record<string, number> = { '||': 1, '&&': 2, '==': 3, '!=': 3, '<': 4, '>': 4, '<=': 4, '>=': 4, '+': 5, '-': 5, '*': 6, '/': 6, '%': 6, '**': 7 };
  const primario = (): number => {
    const t = tomar();
    if (t === undefined) throw new Abortar(`${expr.trim()}: falta un operando`);
    if (t === '(') {
      const v = binario(1);
      if (tomar() !== ')') throw new Abortar(`${expr.trim()}: falta cerrar un paréntesis`);
      return v;
    }
    if (t === '-') return -primario();
    if (t === '+') return primario();
    if (t === '!') return primario() ? 0 : 1;
    if (/^\d+$/.test(t)) return parseInt(t, 10);
    if (/^[A-Za-z_]/.test(t)) {
      const v = leerVar(s, t) ?? '0';
      return /^-?\d+$/.test(v.trim()) ? parseInt(v, 10) : 0;
    }
    throw new Abortar(`${expr.trim()}: error de sintaxis en la expresión (el error está en «${t}»)`);
  };
  const binario = (min: number): number => {
    let izq = primario();
    for (;;) {
      const op = ver();
      const p = op !== undefined ? PREC[op] : undefined;
      if (p === undefined || p < min) break;
      tomar();
      // ** asocia a la derecha; el resto, a la izquierda
      const der = binario(op === '**' ? p : p + 1);
      switch (op) {
        case '+': izq = izq + der; break;
        case '-': izq = izq - der; break;
        case '*': izq = izq * der; break;
        case '/':
        case '%':
          if (der === 0) throw new Abortar(`${expr.trim()}: división por 0`);
          izq = op === '/' ? Math.trunc(izq / der) : izq % der;
          break;
        case '**': izq = izq ** der; break;
        case '<': izq = +(izq < der); break;
        case '>': izq = +(izq > der); break;
        case '<=': izq = +(izq <= der); break;
        case '>=': izq = +(izq >= der); break;
        case '==': izq = +(izq === der); break;
        case '!=': izq = +(izq !== der); break;
        case '&&': izq = +(!!izq && !!der); break;
        case '||': izq = +(!!izq || !!der); break;
      }
    }
    return izq;
  };
  if (!toks.length) return 0;
  const v = binario(1);
  if (i < toks.length) throw new Abortar(`${expr.trim()}: error de sintaxis en la expresión (el error está en «${toks[i]}»)`);
  return v;
}

// ---------- expansion de palabras

interface Trozo {
  texto: string;
  citado: boolean; // venia entre comillas: no se divide ni se expande el comodin
  /** "$@": cada parametro es una palabra aparte, aunque este entre comillas */
  campos?: string[];
}

/** Busca el cierre de un $( ... ) empezando en el '(' */
function cierreParen(src: string, i: number): number {
  try {
    return saltarParentesis(src, i, 0);
  } catch {
    return src.length;
  }
}

function expandirDolar(src: string, i: number, s: Sesion, sum: Sumidero): [string, number] {
  // src[i] === '$'
  const c = src[i + 1];
  if (c === '(' && src[i + 2] === '(') {
    // $(( expr ))
    const fin = cierreParen(src, i + 1);
    const interior = src.slice(i + 3, fin - 2);
    return [String(aritmetica(interior, s)), fin];
  }
  if (c === '(') {
    const fin = cierreParen(src, i + 1);
    return [sustituir(src.slice(i + 2, fin - 1), s, sum), fin];
  }
  if (c === '{') {
    const fin = src.indexOf('}', i);
    const dentro = src.slice(i + 2, fin);
    if (dentro.startsWith('#') && dentro.length > 1) return [String(parametro(s, dentro.slice(1)).length), fin + 1];
    const def = dentro.match(/^([A-Za-z_]\w*|\d)(:?-)(.*)$/);
    if (def) {
      const v = parametro(s, def[1]);
      return [v === '' ? expandirTexto(def[3], s, sum) : v, fin + 1];
    }
    return [parametro(s, dentro), fin + 1];
  }
  const m = src.slice(i + 1).match(/^([A-Za-z_]\w*|\d|[#@*?$])/);
  if (m) return [parametro(s, m[1]), i + 1 + m[1].length];
  return ['$', i + 1];
}

/** Expande el contenido de comillas dobles (o un texto por defecto). */
function expandirTexto(src: string, s: Sesion, sum: Sumidero): string {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '\\' && i + 1 < src.length && '$`"\\\n'.includes(src[i + 1])) {
      out += src[i + 1];
      i += 2;
      continue;
    }
    if (c === '$') {
      const [v, fin] = expandirDolar(src, i, s, sum);
      out += v;
      i = fin;
      continue;
    }
    if (c === '`') {
      const fin = src.indexOf('`', i + 1);
      out += sustituir(src.slice(i + 1, fin < 0 ? src.length : fin), s, sum);
      i = fin < 0 ? src.length : fin + 1;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

/** Corre un comando y devuelve su salida sin los saltos finales: $(cmd). */
function sustituir(src: string, s: Sesion, sum: Sumidero): string {
  const sub: Sumidero = { o: '', e: '' };
  let arbol: Nodo;
  try {
    arbol = analizar(src);
  } catch (err) {
    if (err instanceof ErrorSintaxis) throw new Abortar(`error de sintaxis en $(${src}): ${err.message}`);
    throw err;
  }
  try {
    s.ultimo = correrNodo(arbol, s, sub, { texto: '', tuberia: false });
  } catch (err) {
    if (err instanceof Salida) s.ultimo = err.codigo;
    else throw err;
  }
  escribirErr(sum, sub.e);
  return sub.o.replace(/\n+$/, '');
}

/** Llaves: {1..5}, {a..e}, {x,y,z}. Solo fuera de comillas, sobre la palabra cruda. */
function expandirLlaves(pal: string): string[] {
  if (/['"$\\`]/.test(pal)) return [pal];
  const m = pal.match(/^(.*?)\{([^{}]*)\}(.*)$/);
  if (!m) return [pal];
  const [, pre, dentro, post] = m;
  let items: string[] | null = null;
  const rango = dentro.match(/^(-?\d+)\.\.(-?\d+)$/) ?? dentro.match(/^([a-zA-Z])\.\.([a-zA-Z])$/);
  if (rango) {
    const num = /\d/.test(rango[1]);
    const a = num ? parseInt(rango[1], 10) : rango[1].charCodeAt(0);
    const b = num ? parseInt(rango[2], 10) : rango[2].charCodeAt(0);
    items = [];
    const paso = a <= b ? 1 : -1;
    for (let x = a; paso > 0 ? x <= b : x >= b; x += paso) {
      items.push(num ? String(x) : String.fromCharCode(x));
      if (items.length > 1000) break;
    }
  } else if (dentro.includes(',')) {
    items = dentro.split(',');
  }
  if (!items) return [pal];
  return items.flatMap((x) => expandirLlaves(pre + x + post));
}

/** Expansion completa: llaves, tilde, variables, sustitucion, division y comodines. */
function expandirPalabra(cruda: string, s: Sesion, sum: Sumidero, dividir = true): string[] {
  const resultado: string[] = [];
  for (const pal of expandirLlaves(cruda)) {
    const trozos: Trozo[] = [];
    let i = 0;
    let lit = '';
    const cortarLit = () => {
      if (lit) trozos.push({ texto: lit, citado: false });
      lit = '';
    };
    // tilde al principio
    if (pal === '~' || pal.startsWith('~/')) {
      trozos.push({ texto: HOME, citado: true });
      i = 1;
    }
    let comodin = false;
    while (i < pal.length) {
      const c = pal[i];
      if (c === '\\') {
        cortarLit();
        trozos.push({ texto: pal[i + 1] ?? '', citado: true });
        i += 2;
        continue;
      }
      if (c === "'") {
        cortarLit();
        const fin = pal.indexOf("'", i + 1);
        trozos.push({ texto: pal.slice(i + 1, fin), citado: true });
        i = fin + 1;
        continue;
      }
      if (c === '"' && /^"\$(@|\{@\})"/.test(pal.slice(i))) {
        cortarLit();
        trozos.push({ texto: '', citado: true, campos: [...s.params] });
        i += pal[i + 2] === '{' ? 6 : 4;
        continue;
      }
      if (c === '"') {
        cortarLit();
        let fin = i + 1;
        try {
          fin = saltarComillaDoble(pal, i, 0);
        } catch {
          fin = pal.length;
        }
        trozos.push({ texto: expandirTexto(pal.slice(i + 1, fin - 1), s, sum), citado: true });
        i = fin;
        continue;
      }
      if (c === '$' || c === '`') {
        cortarLit();
        let v: string;
        let fin: number;
        if (c === '`') {
          const f = pal.indexOf('`', i + 1);
          fin = f < 0 ? pal.length : f + 1;
          v = sustituir(pal.slice(i + 1, fin - 1), s, sum);
        } else {
          [v, fin] = expandirDolar(pal, i, s, sum);
        }
        // sin comillas, el resultado de una expansion se divide en palabras
        trozos.push({ texto: v, citado: !dividir });
        if (/[*?]/.test(v)) comodin = true;
        i = fin;
        continue;
      }
      if (c === '*' || c === '?') comodin = true;
      lit += c;
      i++;
    }
    cortarLit();

    // division en campos: solo los trozos no citados que vienen de expansiones
    const campos: string[] = [];
    let actual = '';
    let hay = false;
    for (const t of trozos) {
      if (t.campos) {
        t.campos.forEach((c, k) => {
          if (k > 0) {
            campos.push(actual);
            actual = '';
          }
          actual += c;
          hay = true;
        });
        continue;
      }
      if (t.citado || !dividir) {
        actual += t.texto;
        hay = true;
        continue;
      }
      const partes = t.texto.split(/[ \t\n]+/);
      partes.forEach((p, k) => {
        if (k > 0) {
          if (hay || actual) campos.push(actual);
          actual = '';
          hay = false;
        }
        if (p) {
          actual += p;
          hay = true;
        }
      });
    }
    if (hay || actual) campos.push(actual);

    for (const campo of campos) {
      if (comodin && dividir && /[*?]/.test(campo)) resultado.push(...expandir(campo, s.e));
      else resultado.push(campo);
    }
  }
  return resultado;
}

/** Para asignaciones y destinos de redireccion: sin division ni comodines. */
function expandirUna(cruda: string, s: Sesion, sum: Sumidero): string {
  return expandirPalabra(cruda, s, sum, false).join(' ');
}

// ---------- test / [ ]

function evaluarTest(args: string[], s: Sesion, nombre: string): number {
  const err = (m: string) => {
    throw new Abortar(`${nombre}: ${m}`);
  };
  const entero = (x: string): number => {
    if (!/^\s*-?\d+\s*$/.test(x)) err(`${x || '""'}: se esperaba una expresión entera (un número)`);
    return parseInt(x, 10);
  };
  const archivo = (op: string, ruta: string): boolean => {
    const n = buscarRuta(ruta, s.e);
    switch (op) {
      case '-e': return !!n;
      case '-f': return !!n && n.tipo === 'arch';
      case '-d': return esDir(n);
      case '-s': return !!n && n.tipo === 'arch' && n.contenido.length > 0;
      case '-r': return !!n && puede(n, 'r', s.e);
      case '-w': return !!n && puede(n, 'w', s.e);
      case '-x': return !!n && puede(n, 'x', s.e);
    }
    return false;
  };
  const uno = (a: string[]): boolean => {
    if (a.length === 0) return false;
    if (a[0] === '!') return !uno(a.slice(1));
    if (a.length === 1) return a[0] !== '';
    if (a.length === 2) {
      const [op, x] = a;
      if (op === '-z') return x === '';
      if (op === '-n') return x !== '';
      if (/^-[efdsrwx]$/.test(op)) return archivo(op, x);
      err(`${op}: se esperaba un operador unario (como -f, -d, -z)`);
    }
    if (a.length === 3) {
      const [x, op, y] = a;
      switch (op) {
        case '=':
        case '==': return x === y;
        case '!=': return x !== y;
        case '-eq': return entero(x) === entero(y);
        case '-ne': return entero(x) !== entero(y);
        case '-lt': return entero(x) < entero(y);
        case '-le': return entero(x) <= entero(y);
        case '-gt': return entero(x) > entero(y);
        case '-ge': return entero(x) >= entero(y);
        case '=~':
          if (nombre !== '[[') err('=~ solo funciona dentro de [[ ]]');
          try {
            return new RegExp(y).test(x);
          } catch {
            return err(`${y}: expresión regular inválida`);
          }
      }
      err(`${op}: se esperaba un operador binario (como -eq, =, -lt)`);
    }
    // -a / -o y && || (en [[ ]])
    for (const sep of ['-o', '||']) {
      const k = a.indexOf(sep);
      if (k > 0) return uno(a.slice(0, k)) || uno(a.slice(k + 1));
    }
    for (const sep of ['-a', '&&']) {
      const k = a.indexOf(sep);
      if (k > 0) return uno(a.slice(0, k)) && uno(a.slice(k + 1));
    }
    return err('demasiados argumentos (¿te faltan comillas alrededor de una variable?)');
  };
  return uno(args) ? 0 : 1;
}

// ---------- builtins

type Builtin = (args: string[], s: Sesion, sum: Sumidero, ent: Entrada) => number;

const BUILTINS: Record<string, Builtin> = {
  ':': () => 0,
  true: () => 0,
  false: () => 1,

  test: (a, s) => evaluarTest(a, s, 'test'),
  '[': (a, s) => {
    if (a[a.length - 1] !== ']') throw new Abortar('[: falta el «]» del final (y va separado con un espacio)');
    return evaluarTest(a.slice(0, -1), s, '[');
  },
  '[[': (a, s) => {
    if (a[a.length - 1] !== ']]') throw new Abortar('[[: falta el «]]» del final');
    return evaluarTest(a.slice(0, -1), s, '[[');
  },

  read: (a, s, sum, ent) => {
    const nombres = a.filter((x, k) => !x.startsWith('-') && a[k - 1] !== '-p');
    if (!ent.tuberia) {
      escribirErr(
        sum,
        'read: esta terminal no puede quedarse esperando lo que tipeás.\n' +
          '      Pasale el dato por tubería, por ejemplo: echo Ana | ./script.sh\n'
      );
      for (const n of nombres.length ? nombres : ['REPLY']) fijarVar(s, n, '');
      return 1;
    }
    if (!ent.texto) {
      for (const n of nombres.length ? nombres : ['REPLY']) fijarVar(s, n, '');
      return 1;
    }
    const salto = ent.texto.indexOf('\n');
    const linea = salto < 0 ? ent.texto : ent.texto.slice(0, salto);
    ent.texto = salto < 0 ? '' : ent.texto.slice(salto + 1);
    const vars = nombres.length ? nombres : ['REPLY'];
    const campos = linea.trim().split(/[ \t]+/);
    vars.forEach((n, k) => {
      const v = k === vars.length - 1 ? campos.slice(k).join(' ') : campos[k] ?? '';
      fijarVar(s, n, v);
    });
    return 0;
  },

  exit: (a, s) => {
    throw new Salida(a[0] !== undefined ? parseInt(a[0], 10) || 0 : s.ultimo);
  },
  return: (a, s) => {
    if (!s.enFuncion) throw new Abortar('return: solo se puede usar dentro de una función o de un script con source');
    throw new Retorno(a[0] !== undefined ? parseInt(a[0], 10) || 0 : s.ultimo);
  },
  break: (a, s) => {
    if (!s.enBucle) throw new Abortar('break: solo tiene sentido dentro de un for o un while');
    throw new Corte('break', Math.max(1, parseInt(a[0] ?? '1', 10) || 1));
  },
  continue: (a, s) => {
    if (!s.enBucle) throw new Abortar('continue: solo tiene sentido dentro de un for o un while');
    throw new Corte('continue', Math.max(1, parseInt(a[0] ?? '1', 10) || 1));
  },

  local: (a, s) => {
    if (!s.enFuncion) throw new Abortar('local: solo se puede usar dentro de una función');
    const alc = s.alcances[s.alcances.length - 1];
    for (const x of a) {
      const eq = x.indexOf('=');
      if (eq > 0) alc[x.slice(0, eq)] = x.slice(eq + 1);
      else alc[x] = '';
    }
    return 0;
  },
  export: (a, s) => {
    for (const x of a) {
      const eq = x.indexOf('=');
      if (eq > 0) fijarVar(s, x.slice(0, eq), x.slice(eq + 1));
    }
    return 0;
  },
  unset: (a, s) => {
    for (const x of a) {
      for (const alc of s.alcances) delete alc[x];
      delete s.funciones[x];
    }
    return 0;
  },

  printf: (a, _s, sum) => {
    if (!a.length) throw new Abortar('printf: uso: printf formato [argumentos]');
    const [fmt, ...resto] = a;
    let k = 0;
    const escapes = (t: string) => t.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\\\/g, '\\');
    let out = '';
    do {
      out += escapes(fmt).replace(/%([sd%])/g, (_, f) => {
        if (f === '%') return '%';
        const v = resto[k++] ?? '';
        return f === 'd' ? String(parseInt(v, 10) || 0) : v;
      });
    } while (k < resto.length && /%[sd]/.test(fmt));
    sum.o += out;
    return 0;
  },

  bash: (a, s, sum, ent) => {
    const args = a.filter((x) => x !== '-x' && x !== '-e');
    if (!args.length) {
      escribirErr(sum, 'bash: ya estás adentro de bash. Para correr un script: bash archivo.sh\n');
      return 0;
    }
    if (args[0] === '-c') {
      const sub = nuevaSesion(s.e, s.global, args.slice(2), args[2] ?? 'bash');
      return correrFuente(args[1] ?? '', sub, sum, ent, 'bash -c');
    }
    return correrScript(args[0], args.slice(1), s, sum, ent, 'bash');
  },
  source: (a, s, sum, ent) => {
    if (!a.length) throw new Abortar('source: falta el nombre del archivo');
    const n = buscarRuta(a[0], s.e);
    if (!n) throw new Abortar(`source: ${a[0]}: No existe el archivo o el directorio`);
    if (n.tipo !== 'arch') throw new Abortar(`source: ${a[0]}: es un directorio`);
    if (!puede(n, 'r', s.e)) throw new Abortar(`source: ${a[0]}: Permiso denegado`);
    const previos = s.params;
    if (a.length > 1) s.params = a.slice(1);
    s.enFuncion++;
    try {
      return correrFuente(n.contenido, s, sum, ent, a[0]);
    } catch (err) {
      if (err instanceof Retorno) return err.codigo;
      throw err;
    } finally {
      s.enFuncion--;
      s.params = previos;
    }
  },
};
BUILTINS.sh = BUILTINS.bash;
BUILTINS['.'] = BUILTINS.source;

/** Nombres que el autocompletado tiene que conocer ademas del registro. */
export const NOMBRES_BUILTINS = ['bash', 'sh', 'read', 'test', 'exit', 'source', 'printf', 'export', 'unset', 'local', 'return', 'true', 'false'];

// ---------- scripts

function nuevaSesion(e: Estado, global: Global, params: string[], cero: string): Sesion {
  return { e, global, alcances: [{}], funciones: {}, params, cero, ultimo: 0, profundidad: 0, enFuncion: 0, enBucle: 0, linea: 0 };
}

function correrFuente(src: string, s: Sesion, sum: Sumidero, ent: Entrada, nombre: string): number {
  let arbol: Nodo;
  try {
    arbol = analizar(src);
  } catch (err) {
    if (err instanceof ErrorSintaxis) {
      escribirErr(sum, `${nombre}: línea ${err.linea}: ${err.message}\n`);
      return 2;
    }
    throw err;
  }
  const previo = s.script;
  s.script = nombre;
  try {
    return correrNodo(arbol, s, sum, ent);
  } finally {
    s.script = previo;
  }
}

const INTERPRETES = /^#!\s*(\/bin\/(ba)?sh|\/usr\/bin\/(ba)?sh|\/usr\/bin\/env\s+(ba)?sh)\s*$/;

function correrScript(ruta: string, args: string[], s: Sesion, sum: Sumidero, ent: Entrada, modo: 'directo' | 'bash'): number {
  const quien = 'bash';
  const segs = resolver(ruta, s.e);
  const n = buscar(segs, s.e);
  if (!n) {
    escribirErr(sum, `${quien}: ${ruta}: No existe el archivo o el directorio\n`);
    return 127;
  }
  if (n.tipo === 'dir') {
    escribirErr(sum, `${quien}: ${ruta}: Es un directorio\n`);
    return 126;
  }
  if (modo === 'directo' && !puede(n, 'x', s.e)) {
    escribirErr(sum, `${quien}: ${ruta}: Permiso denegado\n`);
    return 126;
  }
  if (!puede(n, 'r', s.e)) {
    escribirErr(sum, `${quien}: ${ruta}: Permiso denegado\n`);
    return 126;
  }
  // programas "de verdad" del sistema: /bin/ls, /bin/cat
  if (n.contenido === '' && modo === 'directo') {
    const nombre = segs[segs.length - 1];
    const cmd = REGISTRO[nombre];
    if (cmd && /^(bin|usr)$/.test(segs[0] ?? '')) {
      const r = cmd({ estado: s.e, args, entrada: ent.texto });
      sum.o += r.salida;
      if (r.error) escribirErr(sum, r.error + '\n');
      return r.codigo;
    }
  }
  if (n.contenido.startsWith('[binario]')) {
    escribirErr(sum, `${quien}: ${ruta}: no se puede ejecutar: es un archivo binario\n`);
    return 126;
  }
  const primera = n.contenido.split('\n')[0];
  if (modo === 'directo' && primera.startsWith('#!') && !INTERPRETES.test(primera)) {
    const interp = primera.slice(2).trim().split(/\s+/)[0];
    escribirErr(sum, `${quien}: ${ruta}: ${interp}: intérprete erróneo: No existe el archivo o el directorio\n`);
    return 126;
  }
  if (s.profundidad >= MAX_PROFUNDIDAD) throw new Abortar('demasiados scripts anidados: ¿un script se llama a sí mismo?');

  const sub = nuevaSesion(s.e, s.global, args, ruta);
  sub.profundidad = s.profundidad + 1;
  const propia: Sumidero = { o: '', e: '' };
  const entradaInicial = ent.texto;
  const cwd = [...s.e.cwd];
  let codigo: number;
  try {
    codigo = correrFuente(n.contenido, sub, propia, ent, ruta);
  } catch (err) {
    if (err instanceof Salida) codigo = err.codigo;
    else if (err instanceof Abortar) {
      propia.e += `${ruta}: línea ${sub.linea}: ${err.mensaje}\n`;
      codigo = 1;
    } else throw err;
  } finally {
    // el script corre en otro proceso: su cd no mueve a la terminal
    s.e.cwd = cwd;
  }

  const corrida: Corrida = {
    ruta: rutaStr(segs),
    modo,
    args,
    entrada: entradaInicial,
    salida: propia.o,
    error: propia.e,
    codigo,
  };
  (s.e.corridas ??= []).push(corrida);

  sum.o += propia.o;
  escribirErr(sum, propia.e);
  return codigo;
}

// ---------- redirecciones

function conRedirs(redirs: Redir[], s: Sesion, sum: Sumidero, ent: Entrada, correr: (sum: Sumidero, ent: Entrada) => number): number {
  if (!redirs.length) return correr(sum, ent);
  const local: Sumidero = { o: '', e: '' };
  let entrada = ent;
  let destinoO: { ruta: string; anexar: boolean } | null = null;
  let destinoE: { ruta: string; anexar: boolean } | null = null;
  let oAErr = false;

  for (const r of redirs) {
    const ruta = r.destino ? expandirUna(r.destino, s, sum) : '';
    switch (r.op) {
      case '>': destinoO = { ruta, anexar: false }; break;
      case '>>': destinoO = { ruta, anexar: true }; break;
      case '2>': destinoE = { ruta, anexar: false }; break;
      case '2>>': destinoE = { ruta, anexar: true }; break;
      case '&>': destinoO = { ruta, anexar: false }; local.unir = true; break;
      case '2>&1': local.unir = true; break;
      case '>&2': oAErr = true; break;
      case '<': {
        const n = buscarRuta(ruta, s.e);
        if (!n) {
          escribirErr(sum, `bash: ${ruta}: No existe el archivo o el directorio\n`);
          return 1;
        }
        if (n.tipo !== 'arch') {
          escribirErr(sum, `bash: ${ruta}: Es un directorio\n`);
          return 1;
        }
        if (!puede(n, 'r', s.e)) {
          escribirErr(sum, `bash: ${ruta}: Permiso denegado\n`);
          return 1;
        }
        entrada = { texto: n.contenido, tuberia: true };
        break;
      }
    }
  }

  // Revisar los destinos antes de correr, como bash: si no se puede escribir, el comando no corre.
  for (const d of [destinoO, destinoE]) {
    if (!d || d.ruta === '/dev/null') continue;
    const problema = problemaEscritura(d.ruta, s.e);
    if (problema) {
      escribirErr(sum, `bash: ${d.ruta}: ${problema}\n`);
      return 1;
    }
    if (!d.anexar) escribir(d.ruta, '', s.e); // > trunca apenas se abre
  }

  const codigo = correr(local, entrada);

  const volcar = (d: { ruta: string; anexar: boolean }, txt: string) => {
    if (d.ruta === '/dev/null') return;
    const n = buscarRuta(d.ruta, s.e);
    const previo = n && n.tipo === 'arch' ? n.contenido : '';
    escribir(d.ruta, previo + txt, s.e);
  };

  if (oAErr) {
    escribirErr(sum, local.o);
    local.o = '';
  }
  if (destinoO) volcar(destinoO, local.o);
  else sum.o += local.o;
  if (destinoE) volcar(destinoE, local.e);
  else escribirErr(sum, local.e);
  return codigo;
}

export function problemaEscritura(ruta: string, e: Estado): string | null {
  const segs = resolver(ruta, e);
  if (!segs.length) return 'Es un directorio';
  const existente = buscar(segs, e);
  if (existente) {
    if (existente.tipo === 'dir') return 'Es un directorio';
    return puede(existente, 'w', e) ? null : 'Permiso denegado';
  }
  const dir = buscar(segs.slice(0, -1), e);
  if (!esDir(dir)) return 'No existe el archivo o el directorio';
  return puede(dir, 'w', e) ? null : 'Permiso denegado';
}

// ---------- nodos

function paso(s: Sesion) {
  s.global.pasos++;
  if (s.global.pasos > MAX_PASOS) {
    throw new Abortar('corté la ejecución: demasiados pasos. ¿Hay un bucle que nunca termina? (revisá la condición del while)');
  }
}

function correrNodo(n: Nodo, s: Sesion, sum: Sumidero, ent: Entrada): number {
  switch (n.k) {
    case 'lista': {
      let c = 0;
      for (const it of n.items) c = s.ultimo = correrNodo(it, s, sum, ent);
      return c;
    }
    case 'yo': {
      let c = (s.ultimo = correrNodo(n.primero, s, sum, ent));
      for (const [op, nodo] of n.resto) {
        if ((op === '&&' && c === 0) || (op === '||' && c !== 0)) c = s.ultimo = correrNodo(nodo, s, sum, ent);
      }
      return c;
    }
    case 'tuberia': {
      let entrada = ent;
      let c = 0;
      n.cmds.forEach((cmd, k) => {
        const ultimo = k === n.cmds.length - 1;
        const etapa: Sumidero = { o: '', e: '' };
        c = correrNodo(cmd, s, etapa, entrada);
        escribirErr(sum, etapa.e);
        if (ultimo) sum.o += etapa.o;
        else entrada = { texto: etapa.o, tuberia: true };
      });
      return n.neg ? (c === 0 ? 1 : 0) : c;
    }
    case 'if':
      return conRedirs(n.redirs, s, sum, ent, (sm, en) => {
        for (const [cond, cuerpo] of n.ramas) {
          if (correrNodo(cond, s, sm, en) === 0) return correrNodo(cuerpo, s, sm, en);
        }
        return n.otro ? correrNodo(n.otro, s, sm, en) : 0;
      });
    case 'for':
      return conRedirs(n.redirs, s, sum, ent, (sm, en) => {
        const items = n.palabras === null ? [...s.params] : n.palabras.flatMap((p) => expandirPalabra(p, s, sm));
        let c = 0;
        s.enBucle++;
        try {
          for (const it of items) {
            paso(s);
            fijarVar(s, n.variable, it);
            try {
              c = correrNodo(n.cuerpo, s, sm, en);
            } catch (err) {
              if (!(err instanceof Corte)) throw err;
              if (err.niveles > 1) throw new Corte(err.tipo, err.niveles - 1);
              if (err.tipo === 'break') break;
            }
          }
        } finally {
          s.enBucle--;
        }
        return c;
      });
    case 'while':
      return conRedirs(n.redirs, s, sum, ent, (sm, en) => {
        let c = 0;
        s.enBucle++;
        try {
          for (;;) {
            paso(s);
            const cond = correrNodo(n.cond, s, sm, en);
            if (n.hasta ? cond === 0 : cond !== 0) break;
            try {
              c = correrNodo(n.cuerpo, s, sm, en);
            } catch (err) {
              if (!(err instanceof Corte)) throw err;
              if (err.niveles > 1) throw new Corte(err.tipo, err.niveles - 1);
              if (err.tipo === 'break') break;
            }
          }
        } finally {
          s.enBucle--;
        }
        return c;
      });
    case 'grupo':
      return conRedirs(n.redirs, s, sum, ent, (sm, en) => correrNodo(n.cuerpo, s, sm, en));
    case 'funcion':
      s.funciones[n.nombre] = n.cuerpo;
      return 0;
    case 'simple':
      return correrSimple(n, s, sum, ent);
  }
}

function llamarFuncion(nombre: string, args: string[], s: Sesion, sum: Sumidero, ent: Entrada): number {
  if (s.profundidad >= MAX_PROFUNDIDAD) throw new Abortar(`${nombre}: demasiada recursión (¿la función se llama a sí misma sin parar?)`);
  const previos = s.params;
  s.params = args;
  s.alcances.push({});
  s.enFuncion++;
  s.profundidad++;
  try {
    return correrNodo(s.funciones[nombre], s, sum, ent);
  } catch (err) {
    if (err instanceof Retorno) return err.codigo;
    throw err;
  } finally {
    s.params = previos;
    s.alcances.pop();
    s.enFuncion--;
    s.profundidad--;
  }
}

function correrSimple(n: Nodo & { k: 'simple' }, s: Sesion, sum: Sumidero, ent: Entrada): number {
  paso(s);
  s.linea = n.linea;
  const argv = n.palabras.flatMap((p) => expandirPalabra(p, s, sum));

  if (!argv.length) {
    for (const [nombre, valor] of n.asig) fijarVar(s, nombre, expandirUna(valor, s, sum));
    // redirecciones sueltas ("> archivo") crean o truncan el archivo
    return conRedirs(n.redirs, s, sum, ent, () => 0);
  }
  // prefijos tipo "X=1 comando": el simulador los aplica y listo
  for (const [nombre, valor] of n.asig) fijarVar(s, nombre, expandirUna(valor, s, sum));

  const [cmd, ...args] = argv;
  return conRedirs(n.redirs, s, sum, ent, (sm, en) => {
    if (s.funciones[cmd]) return llamarFuncion(cmd, args, s, sm, en);
    const b = BUILTINS[cmd];
    if (b) return b(args, s, sm, en);
    if (cmd.includes('/')) return correrScript(cmd, args, s, sm, en, 'directo');
    const comando = REGISTRO[cmd];
    if (!comando) {
      const donde = s.script ? `${s.script}: línea ${n.linea}` : 'bash';
      let msg = `${donde}: ${cmd}: orden no encontrada`;
      if (args[0] === '=' || args[0]?.startsWith('=')) {
        msg += `\n(¿querías guardar una variable? Va todo junto, sin espacios: ${cmd}=valor)`;
      } else if (cmd.startsWith('[') && cmd !== '[') {
        msg += '\n(después de [ va un espacio, y antes de ] también. Por ejemplo: [ $x -eq 1 ])';
      } else if (/\.sh$/.test(cmd)) {
        const existe = buscarRuta(cmd, s.e);
        if (existe) msg += `\n(para ejecutar un archivo de la carpeta actual escribí ./${cmd})`;
      }
      escribirErr(sm, msg + '\n');
      return 127;
    }
    const r = comando({ estado: s.e, args, entrada: en.texto });
    sm.o += r.salida;
    if (r.error) escribirErr(sm, r.error + '\n');
    if (r.editor) {
      if (s.script) {
        escribirErr(sm, `${cmd}: no se puede abrir el editor desde adentro de un script\n`);
        return 1;
      }
      s.global.editor = r.editor;
    }
    return r.codigo;
  });
}

// ---------------------------------------------------------------- punto de entrada

export interface ResultadoShell {
  salida: string;
  error?: string;
  editor?: EditorPedido;
  codigo: number;
}

/** Ejecuta una linea tipeada en la terminal. Las variables y funciones sobreviven entre lineas. */
export function correrLinea(linea: string, e: Estado): ResultadoShell {
  e.entorno ??= { vars: {}, funciones: {} };
  const global: Global = { pasos: 0 };
  const s = nuevaSesion(e, global, [], 'bash');
  s.alcances = [e.entorno.vars];
  s.funciones = e.entorno.funciones as Record<string, Nodo>;
  s.ultimo = e.entorno.ultimo ?? 0;

  const sum: Sumidero = { o: '', e: '' };
  let codigo = 0;
  try {
    const arbol = analizar(linea);
    codigo = correrNodo(arbol, s, sum, { texto: '', tuberia: false });
  } catch (err) {
    if (err instanceof ErrorSintaxis) {
      let msg = `bash: ${err.message}`;
      if (err.incompleto && /^\s*(if|for|while|until)\b|\{\s*$|\(\)\s*$/.test(linea)) {
        msg += '\n(en esta terminal todo va en una línea, separado con punto y coma. Por ejemplo: for i in 1 2 3; do echo $i; done)';
      }
      escribirErr(sum, msg + '\n');
      codigo = 2;
    } else if (err instanceof Salida) {
      codigo = err.codigo;
    } else if (err instanceof Abortar) {
      escribirErr(sum, `bash: ${err.mensaje}\n`);
      codigo = 1;
    } else if (err instanceof Retorno || err instanceof Corte) {
      codigo = 1;
    } else {
      throw err;
    }
  }
  e.entorno.ultimo = codigo;
  const error = sum.e.replace(/\n+$/, '');
  return { salida: sum.o, error: error || undefined, editor: global.editor, codigo };
}

