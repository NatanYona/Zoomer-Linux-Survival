// Comandos del modulo de scripts: el editor y las tareas programadas.
// bash, read, test y compania no viven aca: son parte del interprete (shell.ts)
// porque necesitan tocar variables y la entrada estandar.
import type { Comando, Registro } from '../tipos';
import { ok, falla } from '../tipos';
import { buscar, buscarRuta, esDir, puede, resolver, rutaStr } from '../vfs';
import { analizarCrontab, PLANTILLA_CRONTAB } from '../cron';

// ---------- nano ----------
export const nano: Comando = (ctx) => {
  const ruta = ctx.args.find((a) => !a.startsWith('-'));
  if (!ruta) return falla('nano: decime qué archivo abrir, por ejemplo: nano hola.sh');
  const segs = resolver(ruta, ctx.estado);
  const n = buscar(segs, ctx.estado);
  if (esDir(n)) return falla(`nano: «${ruta}» es un directorio`);
  if (!n) {
    const dir = buscar(segs.slice(0, -1), ctx.estado);
    if (!esDir(dir)) return falla(`nano: no existe la carpeta de «${ruta}»`);
  } else if (!puede(n, 'r', ctx.estado)) {
    return falla(`nano: ${ruta}: Permiso denegado`);
  }
  return {
    salida: '',
    codigo: 0,
    editor: {
      destino: 'archivo',
      ruta: rutaStr(segs),
      contenido: n && n.tipo === 'arch' ? n.contenido : '',
      nuevo: !n,
    },
  };
};

// ---------- crontab ----------
const USO_CRONTAB = [
  'uso: crontab -l          muestra tus tareas programadas',
  '     crontab -e          las edita (abre nano)',
  '     crontab -r          borra TODAS tus tareas',
  '     crontab archivo     instala las tareas escritas en un archivo',
].join('\n');

export const crontab: Comando = (ctx) => {
  const e = ctx.estado;
  const [a] = ctx.args;
  if (!a) return falla(USO_CRONTAB);
  if (a === '-l') {
    if (e.crontab === undefined) return falla(`no hay crontab para ${e.usuario}`);
    return ok(e.crontab.endsWith('\n') || !e.crontab ? e.crontab : e.crontab + '\n');
  }
  if (a === '-r') {
    if (e.crontab === undefined) return falla(`no hay crontab para ${e.usuario}`);
    e.crontab = undefined;
    return ok();
  }
  if (a === '-e') {
    return {
      salida: '',
      codigo: 0,
      editor: {
        destino: 'crontab',
        ruta: '/tmp/crontab.' + e.usuario,
        contenido: e.crontab ?? PLANTILLA_CRONTAB,
        nuevo: e.crontab === undefined,
      },
    };
  }
  if (a.startsWith('-')) return falla(`crontab: opción inválida «${a}»\n${USO_CRONTAB}`);
  const n = buscarRuta(a, e);
  if (!n) return falla(`crontab: ${a}: No existe el archivo o el directorio`);
  if (n.tipo !== 'arch') return falla(`crontab: ${a}: es un directorio`);
  if (!puede(n, 'r', e)) return falla(`crontab: ${a}: Permiso denegado`);
  const { errores } = analizarCrontab(n.contenido);
  if (errores.length) {
    return falla(errores.map((x) => 'crontab: ' + x).join('\n') + '\ncrontab: hay errores en el archivo, no se instaló nada');
  }
  e.crontab = n.contenido;
  return ok();
};

export const registroScripts: Registro = { nano, crontab };
