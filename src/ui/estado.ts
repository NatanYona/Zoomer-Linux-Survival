// Store de la app. Lo escribe el orquestador: el agente de UI solo consume este hook.
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { Estado } from '../motor/tipos';
import { ejecutar, nuevoEstado } from '../motor/motor';
import { completar } from '../motor/completar';
import { REGISTRO } from '../motor/comandos';
import { LECCIONES, MODULOS, QUIZ_POR_MODULO } from '../contenido';
import type { Leccion } from '../contenido/esquema';
import { calcularXp, desbloqueadosPor, progresoRango, rangoDe, xpDeLeccion } from '../contenido/xp';
import { escribirPerfil, leerPerfil, suscribirPerfil } from '../motor/perfil';
import { COSMETICOS } from '../contenido/pase';
import { HUEVOS, token } from '../contenido/huevos';
import { BANNER, bannerRango } from '../motor/comandos/pase';
import { sonarMision, sonarRango } from './sonido';

const FF = String.fromCharCode(12); // el 'clear' del simulador
const COMANDOS = Object.keys(REGISTRO).sort();
const CLAVE = 'linux-survival-es:v1';

export interface Linea {
  tipo: 'entrada' | 'salida' | 'error' | 'logro';
  texto: string;
}

interface Guardado {
  completadas: string[];
  quizzes: Record<string, number>;
  ultima: number;
  /** Lecciones en las que el alumno abrio la pista. Sirve para el bonus de puntos. */
  pistas: string[];
  /** Huevos de pascua encontrados. */
  hallazgos: string[];
}

const VACIO: Guardado = { completadas: [], quizzes: {}, ultima: 0, pistas: [], hallazgos: [] };

function cargar(): Guardado {
  try {
    const c = localStorage.getItem(CLAVE);
    // El spread sobre VACIO cubre los guardados viejos que no tienen los campos nuevos.
    if (c) return { ...VACIO, ...JSON.parse(c) };
  } catch {
    /* modo privado, cookies bloqueadas: seguimos sin persistencia */
  }
  return VACIO;
}

/** Lo que dispara el aviso de mision cumplida. */
export interface Logro {
  id: string;
  titulo: string;
  /** XP que sumo esta leccion. */
  xp: number;
  /** XP total previo, para animar la barra desde el valor viejo. */
  xpPrevio: number;
  /** Nombre del rango nuevo si esto hizo subir de nivel. */
  subioA: string | null;
  /** De donde vino el XP. Cambia el encabezado del aviso. */
  clase: 'leccion' | 'hallazgo';
}

export function useCurso() {
  const inicial = useMemo(cargar, []);
  const motor = useRef<Estado>(nuevoEstado());
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [indice, setIndice] = useState(Math.min(inicial.ultima, LECCIONES.length - 1));
  const [completadas, setCompletadas] = useState<Set<string>>(new Set(inicial.completadas));
  const [quizzes, setQuizzes] = useState<Record<string, number>>(inicial.quizzes);
  const [pistas, setPistas] = useState<Set<string>>(new Set(inicial.pistas));
  const [hallazgos, setHallazgos] = useState<Set<string>>(new Set(inicial.hallazgos));
  const [logro, setLogro] = useState<Logro | null>(null);

  const leccion: Leccion = LECCIONES[indice];
  const cumplida = completadas.has(leccion.id);

  const xp = useMemo(
    () => calcularXp({ completadas, pistas, quizzes, hallazgos }),
    [completadas, pistas, quizzes, hallazgos]
  );
  const progreso = useMemo(() => progresoRango(xp), [xp]);

  // El perfil vive fuera de React porque lo lee el comando `pase` desde el
  // motor. Acá lo mantenemos al día; lo equipado se suscribe al revés.
  const perfil = useSyncExternalStore(suscribirPerfil, leerPerfil);
  useEffect(() => {
    escribirPerfil({ xp, desbloqueados: desbloqueadosPor(xp), hallazgos: [...hallazgos] });
  }, [xp]);

  useEffect(() => {
    try {
      localStorage.setItem(
        CLAVE,
        JSON.stringify({
          completadas: [...completadas],
          quizzes,
          ultima: indice,
          pistas: [...pistas],
          hallazgos: [...hallazgos],
        })
      );
    } catch {
      /* sin persistencia, la sesion sigue andando igual */
    }
  }, [completadas, quizzes, indice, pistas, hallazgos]);

  const efecto = perfil.equipado.efecto;

  /** Cada leccion arranca de un mundo limpio: es lo que asume la suite de pruebas. */
  const reiniciar = useCallback(() => {
    motor.current = nuevoEstado();
    setLineas(efecto === 'efecto-banner' ? [{ tipo: 'salida', texto: BANNER }] : []);
    setLogro(null);
  }, [efecto]);

  useEffect(reiniciar, [indice, reiniciar]);


  /**
   * Arma el prompt segun el cosmetico equipado. Vive en el store y no en la
   * terminal porque lo necesitan los dos: la linea de entrada y el eco que
   * queda en el historial visible.
   */
  const idPrompt = perfil.equipado.prompt;
  const armarPrompt = useCallback(
    (cwd: string[]): string => {
      const ruta = ('/' + cwd.join('/')).replace('/home/alumno', '~');
      // El remate del curso: en Unix el '#' significa que sos root.
      const simbolo = rangoDe(xp).nombre === 'root' ? '#' : '$';
      const plantilla = COSMETICOS.find((c) => c.id === idPrompt)?.plantilla ?? '{ruta}{simbolo}';
      return plantilla
        .replace('{usuario}', 'alumno')
        .replace('{host}', 'so2-lab')
        .replace('{ruta}', ruta)
        .replace('{simbolo}', simbolo);
    },
    [idPrompt, xp]
  );

  const correr = useCallback(
    (linea: string) => {
      const texto = linea.trim();
      const prompt = armarPrompt(motor.current.cwd);
      setLineas((prev) => [...prev, { tipo: 'entrada', texto: prompt + ' ' + linea }]);
      if (!texto) return;

      const r = ejecutar(texto, motor.current);

      if (r.salida.includes(FF)) {
        setLineas([]);
      } else {
        const nuevas: Linea[] = [];
        if (r.salida) nuevas.push({ tipo: 'salida', texto: r.salida.replace(/\n$/, '') });
        if (r.error) nuevas.push({ tipo: 'error', texto: r.error });
        if (nuevas.length) setLineas((prev) => [...prev, ...nuevas]);
      }

      // Huevos de pascua: alcanza con que el token aparezca en la salida, asi
      // que funciona con cat, more, head, grep y tuberias por igual.
      const nuevos = HUEVOS.filter((h) => !hallazgos.has(h.id) && r.salida.includes(token(h.id)));
      let ganaHuevos = 0;

      if (nuevos.length) {
        ganaHuevos = nuevos.reduce((n, h) => n + h.xp, 0);
        setHallazgos((prev) => {
          const s = new Set(prev);
          for (const h of nuevos) s.add(h.id);
          return s;
        });
        setLineas((prev) => [
          ...prev,
          {
            tipo: 'logro',
            texto:
              nuevos.length === 1
                ? 'Hallazgo: ' + nuevos[0].nombre + '.  +' + ganaHuevos + ' XP'
                : nuevos.length + ' hallazgos de una.  +' + ganaHuevos + ' XP',
          },
        ]);
      }

      // El XP de los huevos ya cuenta para decidir si esta linea sube de rango.
      const base = xp + ganaHuevos;

      if (!completadas.has(leccion.id) && leccion.validar(motor.current)) {
        const gana = xpDeLeccion(pistas.has(leccion.id));
        const subio = rangoDe(base + gana).nivel > rangoDe(xp).nivel;
        const nuevoRango = rangoDe(base + gana);

        setCompletadas((prev) => new Set(prev).add(leccion.id));
        setLineas((prev) => [
          ...prev,
          { tipo: 'logro', texto: 'Misión cumplida.  +' + gana + ' XP' },
          // La subida de rango merece ocupar la terminal, no solo un toast.
          ...(subio
            ? [{ tipo: 'logro' as const, texto: '\n' + bannerRango(nuevoRango.nombre, nuevoRango.lema) }]
            : []),
        ]);
        setLogro({
          clase: 'leccion',
          id: leccion.id,
          titulo: leccion.titulo,
          xp: gana + ganaHuevos,
          xpPrevio: xp,
          subioA: subio ? nuevoRango.nombre : null,
        });

        if (subio) sonarRango();
        else sonarMision();
      } else if (nuevos.length) {
        // Solo hallazgo: el aviso le corresponde a el.
        const subio = rangoDe(base).nivel > rangoDe(xp).nivel;
        const nuevoRango = rangoDe(base);

        if (subio) {
          setLineas((prev) => [
            ...prev,
            { tipo: 'logro', texto: '\n' + bannerRango(nuevoRango.nombre, nuevoRango.lema) },
          ]);
        }
        setLogro({
          clase: 'hallazgo',
          id: nuevos[0].id,
          titulo: nuevos.length === 1 ? nuevos[0].nombre : nuevos.length + ' hallazgos de una',
          xp: ganaHuevos,
          xpPrevio: xp,
          subioA: subio ? nuevoRango.nombre : null,
        });

        if (subio) sonarRango();
        else sonarMision();
      }
    },
    [completadas, leccion, pistas, xp, hallazgos, armarPrompt]
  );
  /**
   * Completado con Tab. Devuelve la linea ya completada. Si hay ambiguedad,
   * imita a bash: repite la linea y lista los candidatos en la terminal.
   */
  const sugerir = useCallback((linea: string): string => {
    const s = completar(linea, motor.current, COMANDOS);
    if (s.candidatos.length > 1) {
      setLineas((prev) => [
        ...prev,
        { tipo: 'entrada', texto: armarPrompt(motor.current.cwd) + ' ' + linea },
        { tipo: 'salida', texto: s.candidatos.join('   ') },
      ]);
    }
    return s.linea;
  }, [armarPrompt]);

  // Estable a proposito: el aviso la usa como dependencia de su temporizador.
  // Si cambiara de identidad en cada render, cada tecla tipeada reiniciaria la
  // cuenta regresiva y el aviso no se cerraria nunca.
  const limpiarLogro = useCallback(() => setLogro(null), []);

  const registrarQuiz = useCallback((modulo: number, aciertos: number) => {
    setQuizzes((prev) => ({ ...prev, [modulo]: Math.max(prev[modulo] ?? 0, aciertos) }));
  }, []);

  const progresoModulo = useCallback(
    (n: number) => {
      const ls = LECCIONES.filter((l) => l.modulo === n);
      return { hechas: ls.filter((l) => completadas.has(l.id)).length, total: ls.length };
    },
    [completadas]
  );

  return {
    leccion,
    indice,
    lineas,
    cumplida,
    logro,
    pistas,
    xp,
    progreso,
    perfil,
    hallazgos,
    completadas,
    quizzes,
    total: LECCIONES.length,
    lecciones: LECCIONES,
    modulos: MODULOS,
    quizDe: QUIZ_POR_MODULO,
    cwd: motor.current.cwd,
    prompt: armarPrompt(motor.current.cwd),
    correr,
    sugerir,
    reiniciar,
    registrarQuiz,
    progresoModulo,
    marcarPista: (id: string) => setPistas((prev) => (prev.has(id) ? prev : new Set(prev).add(id))),
    limpiarLogro,
    ir: (i: number) => setIndice(Math.max(0, Math.min(i, LECCIONES.length - 1))),
  };
}
