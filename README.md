# Zoomer Linux Survival

Curso interactivo de Linux en español, para la cátedra de **Sistemas Operativos II**.

31 lecciones repartidas en 4 módulos, con una terminal simulada que corre en el
navegador y valida sola contra el sistema de archivos. Sin instalar nada, sin
máquina virtual, sin cuenta.

---

## Qué tiene

| | |
|---|---|
| Módulos | 4 |
| Lecciones | 31 |
| Preguntas de cuestionario | 24 |
| Comandos implementados | 37 |
| Páginas de manual en español | 30 |
| Pruebas automatizadas | 136 |

Un intérprete de comandos propio: resolución de rutas, comodines, tuberías,
redirección, permisos octales, tabla de procesos y cola de impresión. El
autocompletado con Tab funciona como en bash, incluido el listado de candidatos
cuando hay ambigüedad.

## Cómo se usa

```bash
npm install
npm run dev
```

Para generar el entregable —un único archivo HTML con todo adentro, que se sube
a cualquier hosting estático o se abre con doble clic:

```bash
npm run build
```

Antes de tocar cualquier lección:

```bash
npm test
```

## La red de seguridad

La suite es la parte que sostiene el proyecto. Por cada lección corre su
**solución oficial** contra el motor y exige tres cosas:

1. Que la solución no produzca ningún error — esto caza cualquier consigna que
   use un comando inexistente.
2. Que el validador acepte esa solución.
3. Que el validador **no** dé verdadero en el estado inicial, o sea que la
   lección no nazca ya cumplida.

Si editás una consigna y la rompés, `npm test` te lo dice antes que un alumno.

Hay pruebas equivalentes para el cálculo de XP —incluida una que verifica que
todo cosmético sea alcanzable— y para la alineación del arte ASCII del pase.

## Estructura

```
src/
  motor/          intérprete: filesystem virtual, parser, comandos
    comandos/     los 37 comandos, agrupados por tema
  contenido/      lecciones, cuestionarios, definiciones del pase
  ui/             componentes React y store
  estilos/        sistema de diseño en variables CSS
pruebas/          la suite
landing/          página de presentación, autónoma
```

## El pase

Cada lección suma XP, y más si se resuelve sin abrir la pista. Los puntos
desbloquean cosméticos para la terminal: temas, prompts, cursores y efectos.
Todo cosmético — ninguna lección, pista ni comando queda detrás de puntos.

Se consulta **solo desde la terminal**, escribiendo `pase`. Es deliberado: para
ver tu progreso tenés que usar la herramienta que estás aprendiendo.

El progreso vive en `localStorage`. Es por navegador y cualquier alumno lo edita
en dos minutos con las herramientas de desarrollo. **Como motivación funciona;
como nota no sirve.**

## Sobre el origen

El recorrido temático sigue el orden clásico con el que se enseña la línea de
comandos, el mismo que usa Linux Survival. Los comandos, su secuencia y el tipo
de ejercicio no son propiedad de nadie.

**Todo el texto es original**: lecciones, consignas, pistas, cuestionarios,
páginas de manual y textos de la landing fueron escritos para este proyecto. No
hay traducción ni adaptación de material ajeno.

Los avisos sonoros se sintetizan con Web Audio en tiempo real. No hay archivos
de audio ni atribuciones de terceros.

## Licencia

Doble, según la clase de obra:

- **Código** — AGPL-3.0-or-later
- **Contenido pedagógico** — CC BY-NC-SA 4.0

Podés usarlo para dar clase citando la fuente. No podés venderlo. Ver
[LICENSE](LICENSE) para el detalle.
