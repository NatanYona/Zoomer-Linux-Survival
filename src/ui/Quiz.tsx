import { useState } from 'react';
import type { Modulo, Quiz as TipoQuiz } from '../contenido/esquema';
import { Prosa } from './Prosa';

interface Props {
  quiz: TipoQuiz;
  modulo: Modulo;
  mejor?: number;
  onTerminar: (aciertos: number) => void;
  onSalir: () => void;
}

const LETRAS = ['A', 'B', 'C', 'D'];

export function Quiz({ quiz, modulo, mejor, onTerminar, onSalir }: Props) {
  const [idx, setIdx] = useState(0);
  const [elegida, setElegida] = useState<number | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const [listo, setListo] = useState(false);

  const total = quiz.preguntas.length;
  const p = quiz.preguntas[idx];

  function elegir(i: number) {
    if (elegida !== null) return;
    setElegida(i);
    if (i === p.correcta) setAciertos((a) => a + 1);
  }

  function avanzar() {
    if (idx + 1 >= total) {
      setListo(true);
      onTerminar(aciertos);
    } else {
      setIdx(idx + 1);
      setElegida(null);
    }
  }

  function reintentar() {
    setIdx(0);
    setElegida(null);
    setAciertos(0);
    setListo(false);
  }

  if (listo) {
    const bien = aciertos >= Math.ceil(total * 0.7);
    return (
      <div className="quiz">
        <p className="eyebrow">Módulo {modulo.numero} · Resultado</p>
        <p className="puntaje" style={{ color: bien ? 'var(--exito)' : 'var(--acento)' }}>
          {aciertos}/{total}
        </p>
        <Prosa
          texto={
            bien
              ? modulo.cierre
              : 'Repasá las lecciones del módulo y volvé a intentarlo. El cuestionario no se aprueba de memoria: cada pregunta corresponde a algo que ya practicaste en la terminal.'
          }
        />
        <div className="acciones">
          <button className="btn btn--principal" onClick={onSalir}>
            Seguir
          </button>
          <button className="btn" onClick={reintentar}>
            Rehacer el cuestionario
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz">
      <p className="eyebrow">
        Módulo {modulo.numero} · Cuestionario · {idx + 1} de {total}
        {mejor !== undefined ? ' · mejor: ' + mejor + '/' + total : ''}
      </p>
      <h2 className="titulo">
        <Prosa texto={p.enunciado} inline />
      </h2>

      <div className="opciones">
        {p.opciones.map((o, i) => {
          const marca =
            elegida === null ? undefined : i === p.correcta ? 'bien' : i === elegida ? 'mal' : undefined;
          return (
            <button
              key={i}
              className="opcion"
              data-marca={marca}
              disabled={elegida !== null}
              onClick={() => elegir(i)}
            >
              <span className="letra">{LETRAS[i]}</span>
              <Prosa texto={o} inline />
            </button>
          );
        })}
      </div>

      {elegida !== null && (
        <>
          <div className="explicacion">
            <Prosa texto={p.explicacion} />
          </div>
          <div className="acciones">
            <button className="btn btn--principal" onClick={avanzar}>
              {idx + 1 >= total ? 'Ver resultado' : 'Siguiente pregunta'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
