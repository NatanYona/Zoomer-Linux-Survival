import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  alternarSonido,
  fijarVolumen,
  sonarMision,
  sonidoActivo,
  suscribirSonido,
  volumenActual,
} from './sonido';
import { useCurso } from './estado';
import { Terminal } from './Terminal';
import { Quiz } from './Quiz';
import type { CSSProperties } from 'react';
import { Prosa, BloqueCmd } from './Prosa';
import { Aviso } from './Aviso';
import { COSMETICOS } from '../contenido/pase';
import type { TipoCosmetico } from '../contenido/pase';

type Tema = 'claro' | 'oscuro' | 'sistema';
const CLAVE_TEMA = 'linux-survival-es:tema';

function leerTema(): Tema {
  try {
    const t = localStorage.getItem(CLAVE_TEMA);
    if (t === 'claro' || t === 'oscuro') return t;
  } catch {
    /* sin persistencia: seguimos con el tema del sistema */
  }
  return 'sistema';
}

export function App() {
  const c = useCurso();
  const [tema, setTema] = useState<Tema>(leerTema);
  const [enQuiz, setEnQuiz] = useState<number | null>(null);
  const sonido = useSyncExternalStore(suscribirSonido, sonidoActivo);
  const volumen = useSyncExternalStore(suscribirSonido, volumenActual);

  useEffect(() => {
    const raiz = document.documentElement;
    if (tema === 'sistema') raiz.removeAttribute('data-theme');
    else raiz.setAttribute('data-theme', tema === 'oscuro' ? 'dark' : 'light');
    try {
      if (tema === 'sistema') localStorage.removeItem(CLAVE_TEMA);
      else localStorage.setItem(CLAVE_TEMA, tema);
    } catch {
      /* sin persistencia */
    }
  }, [tema]);

  const l = c.leccion;
  const moduloActivo = enQuiz ?? l.modulo;
  const delModulo = c.lecciones.filter((x) => x.modulo === moduloActivo);
  const primeraDelModulo = c.lecciones.findIndex((x) => x.modulo === moduloActivo);
  const nroEnModulo = delModulo.findIndex((x) => x.id === l.id) + 1;
  const modulo = c.modulos[moduloActivo - 1];
  const quiz = c.quizDe(moduloActivo);
  const ultimaDelModulo = nroEnModulo === delModulo.length;

  function irAModulo(n: number) {
    setEnQuiz(null);
    c.ir(c.lecciones.findIndex((x) => x.modulo === n));
  }

  // Lo que el alumno equipo desde `pase`. El tema son variables CSS: pisarlas
  // en el contenedor alcanza para repintar la terminal entera.
  const puesto = (tipo: TipoCosmetico) => COSMETICOS.find((x) => x.id === c.perfil.equipado[tipo]);

  return (
    <div
      className="app"
      style={puesto('tema')?.vars as CSSProperties}
      data-cursor={c.perfil.equipado.cursor}
      data-efecto={c.perfil.equipado.efecto}
    >
      <header className="rail">
        <div className="marca">
          <b>Terminal de Laboratorio</b>
          <span>Sistemas Operativos II</span>
        </div>

        <nav className="modulos" role="tablist" aria-label="Módulos">
          {c.modulos.map((m) => {
            const p = c.progresoModulo(m.numero);
            const completo = p.hechas === p.total;
            return (
              <button
                key={m.numero}
                className="tab"
                role="tab"
                aria-selected={m.numero === moduloActivo}
                data-completo={completo ? 'si' : 'no'}
                onClick={() => irAModulo(m.numero)}
              >
                <b>
                  {m.numero}. {m.titulo}
                </b>
                <span>
                  {p.hechas}/{p.total}
                  {completo ? ' ✓' : ''}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="ajustes">
          <button
            className="tema"
            onClick={() => setTema(tema === 'oscuro' ? 'claro' : tema === 'claro' ? 'sistema' : 'oscuro')}
            title="Cambiar el tema"
          >
            tema: {tema}
          </button>
          <button
            className="tema"
            aria-pressed={sonido}
            // Al prenderlo suena una vez: sin eso no hay forma de saber si anduvo.
            onClick={() => {
              if (alternarSonido()) sonarMision();
            }}
            title="Avisos sonoros al completar una lección"
          >
            sonido: {sonido ? 'sí' : 'no'}
          </button>
          <input
            className="volumen"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volumen}
            disabled={!sonido}
            aria-label={'Volumen: ' + Math.round(volumen * 100) + '%'}
            title={'Volumen: ' + Math.round(volumen * 100) + '%'}
            onChange={(ev) => fijarVolumen(Number(ev.target.value))}
            // La muestra va al soltar, no en cada paso: si no, arrastrar el
            // control dispara treinta sonidos encimados.
            onPointerUp={() => sonarMision()}
            onKeyUp={() => sonarMision()}
          />
        </div>
      </header>

      <div className="cuerpo">
        <main className="panel">
          <div className="pasos">
            {delModulo.map((x, i) => (
              <button
                key={x.id}
                className="paso"
                data-estado={c.completadas.has(x.id) ? 'hecho' : x.id === l.id && enQuiz === null ? 'actual' : 'pendiente'}
                title={x.titulo}
                onClick={() => {
                  setEnQuiz(null);
                  c.ir(primeraDelModulo + i);
                }}
              >
                {i + 1}
              </button>
            ))}
            {quiz && (
              <button
                className="paso"
                data-quiz="si"
                data-estado={enQuiz !== null ? 'actual' : c.quizzes[moduloActivo] ? 'hecho' : 'pendiente'}
                title="Cuestionario del módulo"
                onClick={() => setEnQuiz(moduloActivo)}
              >
                ?
              </button>
            )}
          </div>

          {enQuiz !== null && quiz ? (
            <Quiz
              quiz={quiz}
              modulo={modulo}
              mejor={c.quizzes[moduloActivo]}
              onTerminar={(a) => c.registrarQuiz(moduloActivo, a)}
              onSalir={() => {
                setEnQuiz(null);
                if (moduloActivo < 4) irAModulo(moduloActivo + 1);
              }}
            />
          ) : (
            <>
              <p className="eyebrow">
                Módulo {l.modulo} · Lección {nroEnModulo} de {delModulo.length}
              </p>
              <h1 className="titulo">{l.titulo}</h1>

              <Prosa texto={l.concepto} />

              <section className="consigna">
                <h3>Consigna</h3>
                <Prosa texto={l.consigna} />
              </section>

              <BloqueCmd texto={l.comandoNuevo} />

              <details
                className="pista"
                onToggle={(ev) => {
                  if (ev.currentTarget.open) c.marcarPista(l.id);
                }}
              >
                <summary>Ver pista</summary>
                <Prosa texto={l.pista} />
              </details>

              <div className="acciones">
                <button className="btn" onClick={() => c.ir(c.indice - 1)} disabled={c.indice === 0}>
                  Anterior
                </button>
                <button
                  className="btn"
                  onClick={() => c.ir(c.indice + 1)}
                  disabled={c.indice >= c.total - 1}
                >
                  Siguiente
                </button>
                <button className="btn" onClick={c.reiniciar} title="Vuelve a dejar los archivos como estaban">
                  Reiniciar la terminal
                </button>
              </div>
            </>
          )}
        </main>

        <Terminal
          lineas={c.lineas}
          prompt={c.prompt}
          onCorrer={c.correr}
          onCompletar={c.sugerir}
          typewriter={c.perfil.equipado.efecto === 'efecto-typewriter'}
        />
      </div>

      <Aviso
        logro={c.logro}
        progreso={c.progreso}
        onCerrar={c.limpiarLogro}
        etiquetaSiguiente={ultimaDelModulo && quiz ? 'Ir al cuestionario' : 'Siguiente lección'}
        onSiguiente={() => (ultimaDelModulo && quiz ? setEnQuiz(l.modulo) : c.ir(c.indice + 1))}
      />
    </div>
  );
}
