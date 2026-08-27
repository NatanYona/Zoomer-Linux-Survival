// CONTRATO COMPARTIDO: el mundo inicial. Las lecciones SOLO pueden referirse
// a rutas que existan aca. Si necesitas un archivo nuevo, pediselo al orquestador.
import type { Estado, NodoDir, Nodo } from './tipos';

const d = (hijos: Record<string, Nodo>, modo = 0o755, duenio = 'alumno', grupo = 'alumnos'): NodoDir =>
  ({ tipo: 'dir', modo, duenio, grupo, hijos });

const f = (contenido: string, modo = 0o644, duenio = 'alumno', grupo = 'alumnos'): Nodo =>
  ({ tipo: 'arch', modo, duenio, grupo, contenido });

const LOG = [
  'INFO  arranque del sistema completado',
  'INFO  montando /dev/sda1 en /',
  'ERROR no se pudo abrir /dev/sdb1: dispositivo ocupado',
  'INFO  servicio de red iniciado',
  'WARN  temperatura del cpu en 71C',
  'ERROR fallo de autenticacion para el usuario invitado',
  'INFO  sesion iniciada: alumno',
  'ERROR timeout al contactar el servidor de impresion',
  'INFO  respaldo nocturno finalizado',
  'WARN  espacio en disco por debajo del 20%',
].join('\n') + '\n';

export function semilla(): Estado {
  return {
    usuario: 'alumno',
    grupos: ['alumnos', 'so2'],
    cwd: ['home', 'alumno'],
    historial: [],
    procesos: [
      { pid: 1, usuario: 'root', tty: '?', tiempo: '00:00:04', comando: '/sbin/init', vivo: true },
      { pid: 412, usuario: 'root', tty: '?', tiempo: '00:00:01', comando: '/usr/sbin/cupsd', vivo: true },
      { pid: 908, usuario: 'alumno', tty: 'pts/0', tiempo: '00:00:00', comando: '-bash', vivo: true },
      { pid: 1204, usuario: 'alumno', tty: 'pts/0', tiempo: '00:03:17', comando: 'calcular --intensivo', vivo: true },
      { pid: 1337, usuario: 'alumno', tty: 'pts/0', tiempo: '00:00:02', comando: 'ps', vivo: true },
    ],
    colaImpresion: [],
    fs: d({
      bin: d({ ls: f('', 0o755, 'root', 'root'), cat: f('', 0o755, 'root', 'root'), bash: f('', 0o755, 'root', 'root') }, 0o755, 'root', 'root'),
      etc: d({
        hostname: f('so2-lab\n', 0o644, 'root', 'root'),
        passwd: f('root:x:0:0:root:/root:/bin/bash\nalumno:x:1000:1000:Alumno SO II:/home/alumno:/bin/bash\nvaleria:x:1001:1001:Valeria Ortiz:/home/valeria:/bin/bash\n', 0o644, 'root', 'root'),
        group: f('root:x:0:\nalumnos:x:1000:alumno,valeria\nso2:x:1001:alumno\n', 0o644, 'root', 'root'),
      }, 0o755, 'root', 'root'),
      home: d({
        alumno: d({
          'bienvenida.txt': f('Bienvenido al laboratorio de Sistemas Operativos II.\nEste es tu directorio personal.\n'),
          '.perfil': f('export EDITOR=nano'),
          documentos: d({
            'apuntes.txt': f('Tema 1: el interprete de comandos\nTema 2: el sistema de archivos\nTema 3: procesos\n'),
            'borrador.txt': f('Version preliminar del informe de laboratorio.\nFalta completar la seccion de conclusiones.\n'),
            'tarea1.txt': f('Ejercicio 1 resuelto.\n'),
            'tarea2.txt': f('Ejercicio 2 pendiente.\n'),
            'planilla.csv': f('legajo,nombre,nota\n1042,Ortiz,8\n1109,Suarez,6\n1233,Medina,9\n'),
          }),
          descargas: d({
            'diagrama.png': f('[binario]\n'),
            'manual.pdf': f('[binario]\n'),
            'captura.png': f('[binario]\n'),
          }),
          practica: d({
            'saludo.sh': f('#!/bin/bash\necho "hola desde el script"\n', 0o644),
          }),
          proyecto: d({
            src: d({ 'main.c': f('int main(void){return 0;}\n'), 'util.c': f('/* utilidades */\n') }),
            docs: d({ 'leeme.txt': f('Proyecto de la materia.\n') }),
          }),
          respaldo: d({}),
        }),
        valeria: d({
          'compartido.txt': f('Archivo de Valeria, legible por el grupo alumnos.\n', 0o644, 'valeria', 'alumnos'),
          privado: d({ 'diario.txt': f('secreto\n', 0o600, 'valeria', 'alumnos') }, 0o700, 'valeria', 'alumnos'),
        }, 0o755, 'valeria', 'alumnos'),
      }, 0o755, 'root', 'root'),
      tmp: d({}, 0o777, 'root', 'root'),
      usr: d({ bin: d({}, 0o755, 'root', 'root'), share: d({}, 0o755, 'root', 'root') }, 0o755, 'root', 'root'),
      var: d({
        log: d({ 'sistema.log': f(LOG, 0o644, 'root', 'root') }, 0o755, 'root', 'root'),
        spool: d({}, 0o755, 'root', 'root'),
      }, 0o755, 'root', 'root'),
    }, 0o755, 'root', 'root'),
  };
}
