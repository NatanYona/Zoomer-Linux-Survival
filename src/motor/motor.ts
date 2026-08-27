// Dispatcher del interprete: parsea una linea, ejecuta cada etapa de la
// tuberia pasando la salida de una a la entrada de la siguiente, y aplica
// la redireccion de salida (`>`/`>>`) si la etapa la tiene.
import type { Estado } from './tipos';
import { expandir, escribir, buscarRuta } from './vfs';
import { semilla } from './semilla';
import { parsear } from './parser';
import { REGISTRO } from './comandos';

export function nuevoEstado(): Estado {
  return semilla();
}

function leerArchivo(ruta: string, e: Estado): string {
  const n = buscarRuta(ruta, e);
  return n && n.tipo === 'arch' ? n.contenido : '';
}

export function ejecutar(linea: string, e: Estado): { salida: string; error?: string } {
  // los validadores de las lecciones dependen de que la linea cruda quede
  // en el historial ANTES de ejecutarla (aunque falle o este vacia).
  e.historial.push(linea);

  const etapas = parsear(linea);
  let entrada = '';
  const errores: string[] = [];

  for (const etapa of etapas) {
    const args = etapa.args.flatMap((a) => expandir(a, e));
    const comando = REGISTRO[etapa.cmd];
    if (!comando) {
      errores.push(`bash: ${etapa.cmd}: orden no encontrada`);
      entrada = '';
      continue;
    }
    const resultado = comando({ estado: e, args, entrada });
    if (resultado.error) errores.push(resultado.error);

    if (etapa.redir) {
      const previo = etapa.redir.anexar ? leerArchivo(etapa.redir.archivo, e) : '';
      escribir(etapa.redir.archivo, previo + resultado.salida, e);
      entrada = ''; // la salida redirigida no se muestra ni sigue la tuberia
    } else {
      entrada = resultado.salida;
    }
  }

  return { salida: entrada, error: errores.length ? errores.join('\n') : undefined };
}
