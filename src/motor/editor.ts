// Guardar lo que el alumno escribio en el editor (nano o crontab -e).
// Vive en el motor y no en la UI para poder probarlo sin navegador.
import type { EditorPedido, Estado } from './tipos';
import { escribir } from './vfs';
import { problemaEscritura } from './shell';
import { analizarCrontab } from './cron';

export interface Guardado {
  ok: boolean;
  /** Para la barra de estado del editor, estilo nano: [ 3 líneas escritas ] */
  mensaje: string;
}

const lineas = (t: string) => (t === '' ? 0 : t.replace(/\n$/, '').split('\n').length);

export function guardarEditor(pedido: EditorPedido, contenido: string, e: Estado): Guardado {
  // nano deja siempre un salto de linea al final del archivo
  const texto = contenido === '' || contenido.endsWith('\n') ? contenido : contenido + '\n';

  if (pedido.destino === 'crontab') {
    const { errores } = analizarCrontab(texto);
    if (errores.length) return { ok: false, mensaje: 'crontab: ' + errores[0] };
    e.crontab = texto;
    return { ok: true, mensaje: 'crontab: instalando el nuevo crontab' };
  }

  const problema = problemaEscritura(pedido.ruta, e);
  if (problema) return { ok: false, mensaje: `Error al escribir ${pedido.ruta}: ${problema}` };
  escribir(pedido.ruta, texto, e);
  const n = lineas(texto);
  return { ok: true, mensaje: `[ ${n} ${n === 1 ? 'línea escrita' : 'líneas escritas'} ]` };
}
