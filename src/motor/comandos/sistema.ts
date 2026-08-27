// Comandos de sistema: usuario/grupos, procesos, disco, texto, impresion,
// historial y ayuda.
import type { Comando, Estado, Nodo, NodoDir, Registro } from '../tipos';
import { ok, falla } from '../tipos';
import { buscar, buscarRuta, esDir, resolver } from '../vfs';
import { MANUALES } from './man-es';

// ---------- echo ----------
export const echo: Comando = (ctx) => {
  const sinN = ctx.args.filter((a) => a !== '-n');
  const conSalto = sinN.length === ctx.args.length;
  return ok(sinN.join(' ') + (conSalto ? '\n' : ''));
};

// ---------- whoami ----------
export const whoami: Comando = (ctx) => ok(ctx.estado.usuario + '\n');

// ---------- helpers de /etc/passwd y /etc/group ----------
function leerPasswd(e: Estado): Map<string, { uid: string; gid: string }> {
  const n = buscarRuta('/etc/passwd', e);
  const mapa = new Map<string, { uid: string; gid: string }>();
  if (n && n.tipo === 'arch') {
    for (const linea of n.contenido.split('\n')) {
      const campos = linea.split(':');
      if (campos.length >= 4) mapa.set(campos[0], { uid: campos[2], gid: campos[3] });
    }
  }
  return mapa;
}

function leerGrupos(e: Estado): Map<string, { gid: string; miembros: string[] }> {
  const n = buscarRuta('/etc/group', e);
  const mapa = new Map<string, { gid: string; miembros: string[] }>();
  if (n && n.tipo === 'arch') {
    for (const linea of n.contenido.split('\n')) {
      const campos = linea.split(':');
      if (campos.length >= 3) mapa.set(campos[0], { gid: campos[2], miembros: campos[3] ? campos[3].split(',') : [] });
    }
  }
  return mapa;
}

// ---------- id ----------
export const id: Comando = (ctx) => {
  const passwd = leerPasswd(ctx.estado);
  const grupos = leerGrupos(ctx.estado);
  const u = ctx.estado.usuario;
  const datos = passwd.get(u);
  const uid = datos?.uid ?? '1000';
  const gidPrimario = datos?.gid ?? '1000';
  let nombrePrimario = ctx.estado.grupos[0] ?? u;
  for (const [nombre, info] of grupos) {
    if (info.gid === gidPrimario) { nombrePrimario = nombre; break; }
  }
  const listaGrupos = ctx.estado.grupos.map((g) => `${grupos.get(g)?.gid ?? '?'}(${g})`).join(',');
  return ok(`uid=${uid}(${u}) gid=${gidPrimario}(${nombrePrimario}) grupos=${listaGrupos}\n`);
};

// ---------- groups ----------
export const groups: Comando = (ctx) => {
  if (!ctx.args.length) return ok(ctx.estado.grupos.join(' ') + '\n');
  const usuario = ctx.args[0];
  const grupos = leerGrupos(ctx.estado);
  const pertenece = [...grupos.entries()].filter(([, info]) => info.miembros.includes(usuario)).map(([nombre]) => nombre);
  if (!pertenece.length) return falla(`groups: ${usuario}: no existe el usuario`);
  return ok(`${usuario} : ${pertenece.join(' ')}\n`);
};

// ---------- who ----------
// ponytail: sesion fija e inventada, no hay soporte multiusuario real todavia.
export const who: Comando = () => ok('alumno   pts/0        2026-08-27 08:14 (10.0.2.15)\n');

// ---------- date ----------
// ponytail: fecha fija a proposito (simulador, no reloj real) para que ningun test dependa del dia de hoy.
export const date: Comando = () => ok('jue 27 ago 2026 09:32:10 -03\n');

// ---------- ps ----------
const ENCABEZADO_PS = 'PID'.padStart(5) + ' ' + 'TTY'.padEnd(8) + ' ' + 'TIME'.padStart(8) + ' CMD';

export const ps: Comando = (ctx) => {
  const todos = ctx.args.some((a) => a === '-e' || a === '-ef' || a === 'aux');
  const filas = ctx.estado.procesos.filter(
    (p) => p.vivo && (todos || (p.usuario === ctx.estado.usuario && p.tty !== '?'))
  );
  const lineas = filas.map(
    (p) => String(p.pid).padStart(5) + ' ' + p.tty.padEnd(8) + ' ' + p.tiempo.padStart(8) + ' ' + p.comando
  );
  return ok([ENCABEZADO_PS, ...lineas].join('\n') + '\n');
};

// ---------- kill ----------
export const kill: Comando = (ctx) => {
  const args = ctx.args.filter((a) => a !== '-9');
  const pidStr = args[0];
  const pid = Number(pidStr);
  const proc = ctx.estado.procesos.find((p) => p.pid === pid);
  if (!proc || !proc.vivo) return falla(`kill: (${pidStr}): No existe el proceso`);
  if (proc.usuario === 'root') return falla(`kill: (${pidStr}): Operación no permitida`);
  proc.vivo = false;
  return ok();
};

// ---------- du ----------
function bytesDe(n: Nodo): number {
  return n.tipo === 'arch' ? n.contenido.length : Object.values(n.hijos).reduce((acc, h) => acc + bytesDe(h), 0);
}

function formatoH(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  return `${(bytes / 1024 / 1024).toFixed(1)}M`;
}

function lineasDu(n: NodoDir, ruta: string, h: boolean, salida: string[]): number {
  let total = 0;
  for (const nombre of Object.keys(n.hijos).sort()) {
    const hijo = n.hijos[nombre];
    const rutaHijo = ruta === '/' ? '/' + nombre : ruta + '/' + nombre;
    total += esDir(hijo) ? lineasDu(hijo, rutaHijo, h, salida) : hijo.contenido.length;
  }
  salida.push(`${h ? formatoH(total) : total}\t${ruta}`);
  return total;
}

export const du: Comando = (ctx) => {
  const h = ctx.args.includes('-h');
  const s = ctx.args.includes('-s');
  const rutas = ctx.args.filter((a) => !a.startsWith('-'));
  const objetivos = rutas.length ? rutas : ['.'];
  const salida: string[] = [];
  const errores: string[] = [];
  for (const ruta of objetivos) {
    const segs = resolver(ruta, ctx.estado);
    const n = buscar(segs, ctx.estado);
    if (!n) { errores.push(`du: no se puede acceder a «${ruta}»: No existe el archivo o el directorio`); continue; }
    if (!esDir(n)) {
      const bytes = n.contenido.length;
      salida.push(`${h ? formatoH(bytes) : bytes}\t${ruta}`);
    } else if (s) {
      const bytes = bytesDe(n);
      salida.push(`${h ? formatoH(bytes) : bytes}\t${ruta}`);
    } else {
      lineasDu(n, ruta, h, salida);
    }
  }
  const texto = salida.join('\n') + (salida.length ? '\n' : '');
  return errores.length ? { salida: texto, error: errores.join('\n'), codigo: 1 } : ok(texto);
};

// ---------- df ----------
// ponytail: tabla fija e inventada, no refleja el uso real del vfs.
function tablaDf(filas: string[][]): string {
  const anchos = filas[0].map((_, i) => Math.max(...filas.map((f) => f[i].length)));
  return filas.map((f) => f.map((c, i) => (i === anchos.length - 1 ? c : c.padEnd(anchos[i]))).join(' ')).join('\n');
}

export const df: Comando = (ctx) => {
  const h = ctx.args.includes('-h');
  const encabezado = h
    ? ['Filesystem', 'Size', 'Used', 'Avail', 'Use%', 'Montado en']
    : ['Filesystem', '1K-blocks', 'Usado', 'Disponible', 'Uso%', 'Montado en'];
  const filas = h
    ? [
        ['/dev/sda1', '20G', '8.2G', '11G', '43%', '/'],
        ['tmpfs', '2.0G', '1.2M', '2.0G', '1%', '/tmp'],
      ]
    : [
        ['/dev/sda1', '20971520', '8598323', '11534336', '43%', '/'],
        ['tmpfs', '2097152', '1228', '2095924', '1%', '/tmp'],
      ];
  return ok(tablaDf([encabezado, ...filas]) + '\n');
};

// ---------- grep ----------
function compilarPatron(patron: string, ci: boolean): RegExp {
  try {
    return new RegExp(patron, ci ? 'i' : '');
  } catch {
    return new RegExp(patron.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), ci ? 'i' : '');
  }
}

export const grep: Comando = (ctx) => {
  const banderas = ctx.args.filter((a) => a.startsWith('-') && a !== '-').join('');
  const resto = ctx.args.filter((a) => !(a.startsWith('-') && a !== '-'));
  const [patron, ...archivos] = resto;
  if (!patron) return falla('grep: falta el patron de busqueda');
  const ci = banderas.includes('i');
  const numerar = banderas.includes('n');
  const contar = banderas.includes('c');
  const invertir = banderas.includes('v');
  const re = compilarPatron(patron, ci);

  const fuentes: { nombre: string | null; lineas: string[] }[] = [];
  const errores: string[] = [];
  if (archivos.length) {
    for (const ruta of archivos) {
      const n = buscarRuta(ruta, ctx.estado);
      if (!n) { errores.push(`grep: ${ruta}: No existe el archivo o el directorio`); continue; }
      if (esDir(n)) { errores.push(`grep: ${ruta}: Es un directorio`); continue; }
      fuentes.push({ nombre: archivos.length > 1 ? ruta : null, lineas: n.contenido.split('\n') });
    }
  } else {
    fuentes.push({ nombre: null, lineas: ctx.entrada.split('\n') });
  }

  const salidaLineas: string[] = [];
  for (const fuente of fuentes) {
    let lineas = fuente.lineas;
    if (lineas[lineas.length - 1] === '') lineas = lineas.slice(0, -1);
    let cuenta = 0;
    const prefijoArch = fuente.nombre ? `${fuente.nombre}:` : '';
    const coincidencias: string[] = [];
    lineas.forEach((linea, i) => {
      if (re.test(linea) !== invertir) {
        cuenta++;
        coincidencias.push(prefijoArch + (numerar ? `${i + 1}:` : '') + linea);
      }
    });
    salidaLineas.push(...(contar ? [`${prefijoArch}${cuenta}`] : coincidencias));
  }
  const texto = salidaLineas.join('\n') + (salidaLineas.length ? '\n' : '');
  return errores.length ? { salida: texto, error: errores.join('\n'), codigo: 1 } : ok(texto);
};

// ---------- sort ----------
export const sort: Comando = (ctx) => {
  const invertir = ctx.args.includes('-r');
  const numerico = ctx.args.includes('-n');
  const archivos = ctx.args.filter((a) => !a.startsWith('-'));
  const errores: string[] = [];
  let texto: string;
  if (archivos.length) {
    const partes: string[] = [];
    for (const ruta of archivos) {
      const n = buscarRuta(ruta, ctx.estado);
      if (!n) { errores.push(`sort: no se puede leer «${ruta}»: No existe el archivo o el directorio`); continue; }
      if (esDir(n)) { errores.push(`sort: no se puede leer «${ruta}»: Es un directorio`); continue; }
      partes.push(n.contenido);
    }
    texto = partes.join('');
  } else {
    texto = ctx.entrada;
  }
  const lineas = texto.split('\n');
  if (lineas[lineas.length - 1] === '') lineas.pop();
  lineas.sort((a, b) => (numerico ? Number(a) - Number(b) : a.localeCompare(b)));
  if (invertir) lineas.reverse();
  const salida = lineas.length ? lineas.join('\n') + '\n' : '';
  return errores.length ? { salida, error: errores.join('\n'), codigo: 1 } : ok(salida);
};

// ---------- wc ----------
function contarTexto(texto: string): { lineas: number; palabras: number; bytes: number } {
  const lineas = (texto.match(/\n/g) || []).length;
  const palabras = texto.trim() === '' ? 0 : texto.trim().split(/\s+/).length;
  return { lineas, palabras, bytes: texto.length };
}

export const wc: Comando = (ctx) => {
  const mostrarL = ctx.args.includes('-l');
  const mostrarW = ctx.args.includes('-w');
  const mostrarC = ctx.args.includes('-c');
  const todas = !mostrarL && !mostrarW && !mostrarC;
  const archivos = ctx.args.filter((a) => !a.startsWith('-'));

  const fila = (c: { lineas: number; palabras: number; bytes: number }, nombre?: string): string => {
    const campos: string[] = [];
    if (todas || mostrarL) campos.push(String(c.lineas).padStart(7));
    if (todas || mostrarW) campos.push(String(c.palabras).padStart(7));
    if (todas || mostrarC) campos.push(String(c.bytes).padStart(7));
    return campos.join('') + (nombre ? ` ${nombre}` : '');
  };

  if (!archivos.length) return ok(fila(contarTexto(ctx.entrada)) + '\n');

  const errores: string[] = [];
  const filas: string[] = [];
  let totLineas = 0, totPalabras = 0, totBytes = 0;
  for (const ruta of archivos) {
    const n = buscarRuta(ruta, ctx.estado);
    if (!n) { errores.push(`wc: ${ruta}: No existe el archivo o el directorio`); continue; }
    if (esDir(n)) { errores.push(`wc: ${ruta}: Es un directorio`); continue; }
    const c = contarTexto(n.contenido);
    totLineas += c.lineas; totPalabras += c.palabras; totBytes += c.bytes;
    filas.push(fila(c, ruta));
  }
  if (archivos.length > 1) filas.push(fila({ lineas: totLineas, palabras: totPalabras, bytes: totBytes }, 'total'));
  const salida = filas.length ? filas.join('\n') + '\n' : '';
  return errores.length ? { salida, error: errores.join('\n'), codigo: 1 } : ok(salida);
};

// ---------- lp / lpstat / cancel ----------
// ponytail: el proximo numero de pedido se cuenta contando lineas de historial
// que arrancan con "lp"; no detecta "lp" en medio de una tuberia. Alcanza
// porque no hay un contador dedicado en Estado (contrato compartido).
function contarPedidosPrevios(e: Estado): number {
  return e.historial.filter((l) => /^\s*lp(\s|$)/.test(l)).length;
}

export const lp: Comando = (ctx) => {
  const ruta = ctx.args[0];
  if (!ruta) return falla('lp: falta el archivo a imprimir');
  const n = buscarRuta(ruta, ctx.estado);
  if (!n) return falla(`lp: no se puede acceder a «${ruta}»: No existe el archivo o el directorio`);
  if (esDir(n)) return falla(`lp: ${ruta}: Es un directorio`);
  const numero = 41 + contarPedidosPrevios(ctx.estado);
  const id = `laser-${numero}`;
  ctx.estado.colaImpresion.push({ id, archivo: ruta, duenio: ctx.estado.usuario, bytes: n.contenido.length });
  return ok(`pedido id es ${id} (1 archivo)\n`);
};

export const lpstat: Comando = (ctx) => {
  if (!ctx.estado.colaImpresion.length) return ok('lpstat: no hay entradas\n');
  const lineas = ctx.estado.colaImpresion.map((t) => `${t.id}   ${t.duenio}   ${t.bytes} bytes   ${t.archivo}`);
  return ok(lineas.join('\n') + '\n');
};

export const cancel: Comando = (ctx) => {
  const id = ctx.args[0];
  if (!id) return falla('cancel: falta el id del trabajo');
  const idx = ctx.estado.colaImpresion.findIndex((t) => t.id === id);
  if (idx < 0) return falla(`cancel: ${id}: no existe ese trabajo`);
  ctx.estado.colaImpresion.splice(idx, 1);
  return ok();
};

// ---------- history / clear ----------
export const history: Comando = (ctx) => {
  const lineas = ctx.estado.historial.map((l, i) => `${String(i + 1).padStart(5)}  ${l}`);
  return ok(lineas.length ? lineas.join('\n') + '\n' : '');
};

export const clear: Comando = () => ok(String.fromCharCode(12));

// ---------- man ----------
export const man: Comando = (ctx) => {
  const cmd = ctx.args[0];
  if (!cmd) return falla('¿Qué página de manual querés?');
  const pagina = MANUALES[cmd];
  if (!pagina) return falla(`No hay página de manual para ${cmd}`);
  return ok(pagina + '\n');
};

// ---------- help ----------
// ponytail: lista fija agrupada a mano en vez de derivarla del registro, para
// poder ordenar los comandos por tema en vez de alfabeticamente.
const AYUDA = [
  'Archivos y directorios:',
  '  ls cd pwd mkdir rmdir mv cp rm touch cat more head tail find chmod file',
  '',
  'Procesos e impresion:',
  '  ps kill lp lpstat cancel',
  '',
  'Texto y busqueda:',
  '  echo grep sort wc',
  '',
  'Usuario y sistema:',
  '  whoami id groups who date du df history clear man help',
].join('\n');

export const help: Comando = () => ok(AYUDA + '\n');

export const registroSistema: Registro = {
  echo,
  whoami,
  id,
  groups,
  who,
  date,
  ps,
  kill,
  du,
  df,
  grep,
  sort,
  wc,
  lp,
  lpstat,
  cancel,
  history,
  clear,
  man,
  help,
};
