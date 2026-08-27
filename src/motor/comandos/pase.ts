// El comando `pase`: la unica puerta al pase de laboratorio.
// Vive en la terminal a proposito. Para ver tu progreso tenes que usar la
// herramienta que estas aprendiendo.
import type { Ctx, Registro, Resultado } from '../tipos';
import { ok, falla } from '../tipos';
import { desequipar, equipar, leerPerfil } from '../perfil';
import { COSMETICOS, RANGOS } from '../../contenido/pase';
import type { Cosmetico, TipoCosmetico } from '../../contenido/pase';
import { progresoRango } from '../../contenido/xp';

const ANCHO = 58;
const TIPOS: TipoCosmetico[] = ['tema', 'prompt', 'efecto', 'cursor'];

const num = (n: number): string => n.toLocaleString('es-AR');
const buscarCosmetico = (id: string): Cosmetico | undefined => COSMETICOS.find((c) => c.id === id);

/** Recorta o rellena a un ancho exacto: sin esto el marco de la caja se desalinea. */
function exacto(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s.padEnd(n);
}

/** Linea interna de la caja, con un espacio de aire a cada lado. */
const fila = (s = ''): string => '│ ' + exacto(s, ANCHO - 4) + ' │';

/** Texto pegado a la izquierda y a la derecha en la misma fila. */
function filaDoble(izq: string, der: string): string {
  const hueco = ANCHO - 4 - izq.length - der.length;
  return hueco < 1 ? fila(izq + ' ' + der) : '│ ' + izq + ' '.repeat(hueco) + der + ' │';
}

function caja(titulo: string, cuerpo: string[]): string {
  // '┌─ ' (3) + titulo + ' ' (1) + relleno + '┐' (1) tiene que dar ANCHO exacto.
  const tapa = '┌─ ' + titulo + ' ' + '─'.repeat(Math.max(0, ANCHO - 5 - titulo.length)) + '┐';
  const piso = '└' + '─'.repeat(ANCHO - 2) + '┘';
  return [tapa, ...cuerpo, piso].join('\n') + '\n';
}

function barra(fraccion: number, ancho: number): string {
  const llenos = Math.round(fraccion * ancho);
  return '█'.repeat(llenos) + '░'.repeat(ancho - llenos);
}

function panel(): Resultado {
  const p = leerPerfil();
  const pr = progresoRango(p.xp);
  const cuerpo: string[] = [fila()];

  cuerpo.push(filaDoble(pr.rango.nombre.toUpperCase(), num(p.xp) + ' XP'));
  cuerpo.push(fila(barra(pr.fraccion, 38) + '  ' + Math.round(pr.fraccion * 100) + '%'));
  cuerpo.push(
    fila(
      pr.siguiente
        ? num(pr.faltan) + ' XP para ' + pr.siguiente.nombre.toUpperCase()
        : 'Llegaste al final del escalafon.'
    )
  );
  cuerpo.push(fila(), fila('EQUIPADO'));

  for (const t of TIPOS) {
    const id = p.equipado[t];
    const c = id ? buscarCosmetico(id) : undefined;
    cuerpo.push(fila('  ' + t.padEnd(8) + (c ? c.nombre : '—')));
  }

  cuerpo.push(fila(), fila('  pase cosmeticos      ver todo el catalogo'));
  cuerpo.push(fila('  pase equipar <id>    aplicar uno'));
  cuerpo.push(fila('  pase quitar <tipo>   volver al de fabrica'));
  cuerpo.push(fila());

  return ok(caja('PASE DE LABORATORIO', cuerpo));
}

function catalogo(): Resultado {
  const p = leerPerfil();
  const abiertos = new Set(p.desbloqueados);
  const cuerpo: string[] = [fila()];

  // Cuanto XP hace falta para cada cosmetico, segun el rango que lo entrega.
  const requisito = new Map<string, number>();
  for (const r of RANGOS) for (const id of r.desbloquea) requisito.set(id, r.puntos);

  for (const t of TIPOS) {
    const suyos = COSMETICOS.filter((c) => c.tipo === t);
    if (!suyos.length) continue;
    cuerpo.push(fila(t.toUpperCase()));
    for (const c of suyos) {
      const puesto = p.equipado[c.tipo] === c.id;
      const marca = puesto ? '►' : abiertos.has(c.id) ? '·' : ' ';
      const estado = abiertos.has(c.id) ? (puesto ? 'en uso' : '') : num(requisito.get(c.id) ?? 0) + ' XP';
      cuerpo.push(filaDoble('  ' + marca + ' ' + c.id.padEnd(20) + c.nombre, estado));
    }
    cuerpo.push(fila());
  }

  return ok(caja('CATALOGO', cuerpo));
}

function aplicar(id: string): Resultado {
  const c = buscarCosmetico(id);
  if (!c) return falla('pase: no existe el cosmetico «' + id + '». Probá: pase cosmeticos');
  if (!equipar(c.id, c.tipo)) {
    const r = RANGOS.find((x) => x.desbloquea.includes(c.id));
    return falla(
      'pase: «' + c.id + '» todavia esta bloqueado' + (r ? '. Se abre en ' + r.nombre + ', a los ' + num(r.puntos) + ' XP' : '')
    );
  }
  return ok('Equipado: ' + c.nombre + '\n' + c.descripcion + '\n');
}

function quitar(tipo: string): Resultado {
  if (!TIPOS.includes(tipo as TipoCosmetico)) {
    return falla('pase: tipo invalido «' + tipo + '». Son: ' + TIPOS.join(', '));
  }
  desequipar(tipo as TipoCosmetico);
  return ok('Listo, ' + tipo + ' vuelve al de fabrica.\n');
}

/** Banner de bienvenida del cosmetico `efecto-banner`. */
export const BANNER = [
  '  ┌─┐┌─┐  ┌─┐   ┬  ┌─┐┬ ┌┐ ',
  '  └─┐│ │───┐│   │  ├─┤├─┤├┴┐',
  '  └─┘└─┘  └─┘   ┴─┘┴ ┴└─┘└─┘',
  '  sistemas operativos II · terminal de laboratorio',
].join('\n');

/** Cartel de subida de rango, para escupir en la terminal. */
export function bannerRango(nombre: string, lema: string): string {
  const cuerpo = [
    fila(),
    fila('RANGO ALCANZADO'),
    fila(),
    fila('  ' + nombre.toUpperCase()),
    fila(),
    ...lema
      .match(/.{1,50}(\s|$)/g)
      ?.map((t) => fila('  ' + t.trim()))
      .slice(0, 3) ?? [],
    fila(),
  ];
  return caja('PASE DE LABORATORIO', cuerpo);
}

const pase = (ctx: Ctx): Resultado => {
  const [sub, arg] = ctx.args;
  if (!sub) return panel();
  if (sub === 'cosmeticos') return catalogo();
  if (sub === 'equipar') return arg ? aplicar(arg) : falla('pase: falta el id. Uso: pase equipar <id>');
  if (sub === 'quitar') return arg ? quitar(arg) : falla('pase: falta el tipo. Uso: pase quitar <tipo>');
  return falla('pase: no entiendo «' + sub + '». Son: cosmeticos, equipar, quitar');
};

export const registroPase: Registro = { pase };
