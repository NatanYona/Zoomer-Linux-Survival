// Lectura y validacion de lineas de crontab. Lo usan el comando `crontab`,
// el editor al guardar y los validadores del modulo 5.

export interface Tarea {
  /** minuto hora dia-del-mes mes dia-de-semana, o ['@reboot'] */
  campos: string[];
  comando: string;
  linea: number;
}

const CAMPOS: { nombre: string; min: number; max: number }[] = [
  { nombre: 'minuto', min: 0, max: 59 },
  { nombre: 'hora', min: 0, max: 23 },
  { nombre: 'día del mes', min: 1, max: 31 },
  { nombre: 'mes', min: 1, max: 12 },
  { nombre: 'día de la semana', min: 0, max: 7 },
];

const ESPECIALES = new Set(['@reboot', '@yearly', '@annually', '@monthly', '@weekly', '@daily', '@midnight', '@hourly']);

/** '*', '*\/15', '5', '1-5', '1-5/2' y listas separadas por coma. */
function campoValido(v: string, min: number, max: number): boolean {
  return v.split(',').every((parte) => {
    const m = parte.match(/^(\*|(\d+)(?:-(\d+))?)(?:\/(\d+))?$/);
    if (!m) return false;
    const a = m[2] !== undefined ? Number(m[2]) : null;
    const b = m[3] !== undefined ? Number(m[3]) : null;
    const paso = m[4] !== undefined ? Number(m[4]) : null;
    if (a !== null && (a < min || a > max)) return false;
    if (b !== null && (b < min || b > max || (a !== null && b < a))) return false;
    if (paso !== null && paso < 1) return false;
    return true;
  });
}

export interface Analisis {
  tareas: Tarea[];
  errores: string[];
}

export function analizarCrontab(texto: string): Analisis {
  const tareas: Tarea[] = [];
  const errores: string[] = [];
  texto.split('\n').forEach((cruda, k) => {
    const linea = k + 1;
    const l = cruda.trim();
    if (!l || l.startsWith('#')) return;
    if (/^[A-Za-z_]\w*\s*=/.test(l)) return; // variables tipo MAILTO=""
    const partes = l.split(/\s+/);
    if (partes[0].startsWith('@')) {
      if (!ESPECIALES.has(partes[0])) {
        errores.push(`línea ${linea}: «${partes[0]}» no es un horario especial válido (probá @reboot o @daily)`);
        return;
      }
      if (partes.length < 2) {
        errores.push(`línea ${linea}: falta el comando después de ${partes[0]}`);
        return;
      }
      tareas.push({ campos: [partes[0]], comando: partes.slice(1).join(' '), linea });
      return;
    }
    if (partes.length < 6) {
      errores.push(
        `línea ${linea}: faltan campos. Van 5 de tiempo (minuto hora día mes día-de-semana) y después el comando`
      );
      return;
    }
    const campos = partes.slice(0, 5);
    for (let i = 0; i < 5; i++) {
      const { nombre, min, max } = CAMPOS[i];
      if (!campoValido(campos[i], min, max)) {
        errores.push(`línea ${linea}: el campo ${nombre} no acepta «${campos[i]}» (va de ${min} a ${max}, o *)`);
        return;
      }
    }
    tareas.push({ campos, comando: partes.slice(5).join(' '), linea });
  });
  return { tareas, errores };
}

export const PLANTILLA_CRONTAB = [
  '# Tareas programadas de alumno. Una por línea, con este formato:',
  '#',
  '# minuto  hora  día-del-mes  mes  día-de-semana  comando',
  '#',
  '# Ejemplo: todos los días a las 22:00',
  '# 0 22 * * * /home/alumno/backup.sh',
  '',
].join('\n');
