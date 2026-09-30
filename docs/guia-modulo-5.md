# Guía del Módulo 5: Scripts y automatización

Resolución paso a paso de las 9 lecciones del módulo 5 de **Zoomer Linux Survival**, pensada para quien da la clase.

Cada lección trae qué se practica, los pasos para resolverla, lo que muestra la terminal y los errores que más aparecen. Todas las salidas de esta guía se sacaron del simulador, así que son exactamente las que va a ver el alumno.

## Índice

- [Cómo funciona el módulo](#cómo-funciona-el-módulo)
- [Lección 1: Ejecutar un script](#lección-1-ejecutar-un-script)
- [Lección 2: Tu primer script](#lección-2-tu-primer-script)
- [Lección 3: Variables](#lección-3-variables)
- [Lección 4: Argumentos](#lección-4-argumentos)
- [Lección 5: Leer datos con read](#lección-5-leer-datos-con-read)
- [Lección 6: Decidir con if](#lección-6-decidir-con-if)
- [Lección 7: Repetir con for](#lección-7-repetir-con-for)
- [Lección 8: Funciones](#lección-8-funciones)
- [Lección 9: Programar tareas con crontab](#lección-9-programar-tareas-con-crontab)
- [Errores comunes](#errores-comunes)
- [Diferencias con una terminal real](#diferencias-con-una-terminal-real)

---

## Cómo funciona el módulo

**El editor.** Los scripts se escriben con `nano archivo.sh`, que abre un editor encima de la terminal:

| Tecla | Qué hace |
|---|---|
| `Ctrl+O` | Guarda |
| `Ctrl+X` | Sale. Si hay cambios sin guardar, pregunta: `S` guarda y sale, `N` sale sin guardar |
| `Tab` | Inserta dos espacios de sangría |

En el celular, esos atajos también aparecen como botones abajo del editor.

**Cómo se valida.** La lección se da por cumplida cuando el script **hace** lo que pide la consigna: el simulador registra cada ejecución (argumentos, entrada y salida) y revisa eso. Da igual si el alumno escribió el script con nano o de otra forma, pero no se puede aprobar imprimiendo el resultado a mano.

**Cada lección arranca de cero.** Al cambiar de lección, los archivos vuelven a su estado inicial. Un script escrito en la lección 3 no existe en la 4.

---

## Lección 1: Ejecutar un script

> Entrá a `~/practica` y ejecutá `saludo.sh` como programa, con `./saludo.sh`. La primera vez va a fallar: leé el error y arreglalo.

**Qué se practica:** ejecutar un archivo con `./` y el permiso de ejecución.

### Pasos

1. Entrar a la carpeta y probar:

```console
~$ cd practica
~/practica$ ./saludo.sh
bash: ./saludo.sh: Permiso denegado
```

2. El archivo existe pero no tiene la **x** de ejecución. Se la damos con `chmod` (lo vieron en el módulo 2):

```console
~/practica$ chmod 755 saludo.sh
~/practica$ ./saludo.sh
hola desde el script
```

`755` significa: el dueño lee, escribe y ejecuta (7); el grupo y los demás leen y ejecutan (5).

### Para comentar en clase

- El error es a propósito: el alumno tiene que leerlo y conectarlo con `chmod`.
- `bash saludo.sh` también corre el script sin permiso de ejecución, pero **no cumple la lección**, que pide ejecutarlo como programa.
- Si escriben `saludo.sh` sin `./`, la terminal responde "orden no encontrada" y sugiere agregar el `./`.

---

## Lección 2: Tu primer script

> Creá con `nano` el archivo `~/hola.sh`. Que empiece con el shebang `#!/bin/bash` y que muestre un saludo con `echo`. Después dale permiso de ejecución y corrélo.

**Qué se practica:** usar nano, el shebang y el ciclo completo de crear, dar permiso y ejecutar.

### Pasos

1. Abrir el editor:

```console
~$ nano hola.sh
```

2. Escribir el script:

```bash
#!/bin/bash
echo "Hola, mundo"
```

3. `Ctrl+O` para guardar (abajo aparece `[ 2 líneas escritas ]`) y `Ctrl+X` para volver a la terminal.

4. Un archivo nuevo nace sin permiso de ejecución, así que se repite lo de la lección 1:

```console
~$ ./hola.sh
bash: ./hola.sh: Permiso denegado
~$ chmod 755 hola.sh
~$ ./hola.sh
Hola, mundo
```

### Para comentar en clase

- La primera línea, `#!/bin/bash`, se llama **shebang**: le dice al sistema qué programa lee el archivo. Sin ella, la lección no se cumple.
- Si salen de nano sin guardar, el archivo no existe. Es un buen momento para mostrar la pregunta de nano al salir con cambios pendientes.

---

## Lección 3: Variables

> Creá `~/fecha.sh` que guarde la salida del comando `date` en una variable llamada `hoy` y después muestre `Hoy es ` seguido de esa variable. Corrélo.

**Qué se practica:** asignar variables, leerlas con `$` y guardar la salida de un comando con `$( )`.

### Pasos

1. `nano fecha.sh` y escribir:

```bash
#!/bin/bash
hoy=$(date)
echo "Hoy es $hoy"
```

2. Guardar, salir, dar permiso y ejecutar:

```console
~$ chmod 755 fecha.sh
~$ ./fecha.sh
Hoy es jue 27 ago 2026 09:32:10 -03
```

### Para comentar en clase

- **Sin espacios alrededor del `=`.** Con `hoy = $(date)` bash cree que `hoy` es un comando. El simulador lo detecta y lo explica:

```console
~$ nombre = Ana
bash: nombre: orden no encontrada
(¿querías guardar una variable? Va todo junto, sin espacios: nombre=valor)
```

- **Comillas dobles vs. simples:** `"Hoy es $hoy"` reemplaza la variable; `'Hoy es $hoy'` imprime el texto literal, con el signo pesos incluido.
- La fecha del simulador es fija (jueves 27 de agosto de 2026), así todos ven la misma salida.

---

## Lección 4: Argumentos

> Creá `~/saludar.sh` que salude al nombre que le pasen como argumento: `./saludar.sh Ana` tiene que mostrar `Hola, Ana`. Probalo con tu nombre.

**Qué se practica:** recibir datos al ejecutar el script con `$1`, `$2`, `$#` y `$0`.

### Pasos

1. `nano saludar.sh`:

```bash
#!/bin/bash
echo "Hola, $1"
```

2. Permiso y prueba:

```console
~$ chmod 755 saludar.sh
~$ ./saludar.sh Ana
Hola, Ana
```

### Para comentar en clase

- Sin argumento, `$1` queda vacío y el script imprime solo `Hola, `. Es un buen disparador para mostrar `$#` y un `if` que avise cómo se usa (lo ven en la lección 6).
- Escribir `echo "Hola, Ana"` fijo **no cumple**: el validador exige que el script use `$1` y que salude al nombre que efectivamente se le pasó.

---

## Lección 5: Leer datos con read

> Creá `~/recibir.sh` que lea un nombre con `read` y muestre `Bienvenido, ` seguido del nombre. Probalo mandándole un nombre por tubería: `echo Ana | ./recibir.sh`.

**Qué se practica:** `read` y cómo pasarle datos por tubería.

### Pasos

1. `nano recibir.sh`:

```bash
#!/bin/bash
read nombre
echo "Bienvenido, $nombre"
```

2. Permiso y prueba **con tubería**:

```console
~$ chmod 755 recibir.sh
~$ echo Ana | ./recibir.sh
Bienvenido, Ana
```

### Para comentar en clase

- En una terminal real, `./recibir.sh` solo se queda esperando que el usuario escriba. **El simulador no puede esperar**, así que avisa y explica cómo pasarle el dato:

```console
~$ ./recibir.sh
Bienvenido,
read: esta terminal no puede quedarse esperando lo que tipeás.
      Pasale el dato por tubería, por ejemplo: echo Ana | ./script.sh
```

- La tubería no es un parche: así se automatizan en la vida real los scripts que hacen preguntas.
- Con `read nombre apellido`, la primera palabra va a `nombre` y el resto a `apellido`.

---

## Lección 6: Decidir con if

> Creá `~/revisar.sh` que reciba una ruta como argumento y muestre `existe` si es un archivo, o `no existe` si no. Probalo dos veces: con `bienvenida.txt` y con un archivo que no exista.

**Qué se practica:** la estructura `if / then / else / fi` y la condición `-f`.

### Pasos

1. `nano revisar.sh`:

```bash
#!/bin/bash
if [ -f "$1" ]; then
  echo "existe"
else
  echo "no existe"
fi
```

2. Permiso y las **dos** pruebas:

```console
~$ chmod 755 revisar.sh
~$ ./revisar.sh bienvenida.txt
existe
~$ ./revisar.sh fantasma.txt
no existe
```

### Para comentar en clase

- **Los espacios dentro de los corchetes son obligatorios.** `[` es un comando y `]` su último argumento. El simulador marca el error:

```console
~$ [$x -eq 1 ]
bash: [1: orden no encontrada
(después de [ va un espacio, y antes de ] también. Por ejemplo: [ $x -eq 1 ])
```

- Las variables van entre comillas (`"$1"`) para que el `if` no se rompa si vienen vacías.
- La lección exige probar los dos casos: un script que siempre dice "existe" no cumple.
- Comparar un texto con `-ge` o `-eq` da error, porque esos operadores son para números:

```console
~$ [ veinte -ge 18 ]
bash: [: veinte: se esperaba una expresión entera (un número)
```

---

## Lección 7: Repetir con for

> Creá `~/listar.sh` que recorra con `for` todos los archivos `.txt` de `~/documentos` y muestre cada uno precedido de `Archivo: `.

**Qué se practica:** el bucle `for` y los comodines.

### Pasos

1. `nano listar.sh`:

```bash
#!/bin/bash
for f in ~/documentos/*.txt; do
  echo "Archivo: $f"
done
```

2. Permiso y ejecución:

```console
~$ chmod 755 listar.sh
~$ ./listar.sh
Archivo: /home/alumno/documentos/apuntes.txt
Archivo: /home/alumno/documentos/borrador.txt
Archivo: /home/alumno/documentos/tarea1.txt
Archivo: /home/alumno/documentos/tarea2.txt
```

### Para comentar en clase

- `*.txt` deja afuera `planilla.csv`. Si recorren `~/documentos/*` (todo), la lección no se cumple.
- Resolverlo con `ls ~/documentos` tampoco cumple: el objetivo es practicar el `for`.
- En la terminal también se puede escribir en una sola línea, separando con punto y coma:

```console
~$ for i in 1 2 3; do echo "vuelta $i"; done
```

---

## Lección 8: Funciones

> Creá `~/funciones.sh` con una función `saludar` que muestre `Hola, ` y el nombre que recibe. Llamala dos veces en el mismo script: con `Ana` y con `Leo`.

**Qué se practica:** definir una función, pasarle argumentos y llamarla.

### Pasos

1. `nano funciones.sh`:

```bash
#!/bin/bash
saludar() {
  echo "Hola, $1"
}

saludar Ana
saludar Leo
```

2. Permiso y ejecución:

```console
~$ chmod 755 funciones.sh
~$ ./funciones.sh
Hola, Ana
Hola, Leo
```

### Para comentar en clase

- Adentro de la función, `$1` es el argumento **de la función**, no el del script.
- La función tiene que estar definida **antes** de llamarla: bash lee de arriba hacia abajo.
- También vale la forma `function saludar { ... }`.
- Para "devolver" un valor, la función lo imprime con `echo` y se captura con `$( )`: `total=$(sumar 2 3)`. `return` solo devuelve un código de 0 a 255.

---

## Lección 9: Programar tareas con crontab

> Programá que `/home/alumno/practica/limpiar.sh` se ejecute todos los domingos a las 3:30 de la mañana. Usá `crontab -e` y después revisá con `crontab -l` que haya quedado instalado.

**Qué se practica:** el formato de crontab y los comandos `crontab -e` y `crontab -l`.

### Pasos

1. Abrir el crontab (se abre nano con una plantilla comentada):

```console
~$ crontab -e
```

2. Agregar al final esta línea:

```
30 3 * * 0 /home/alumno/practica/limpiar.sh
```

| Campo | Valor | Por qué |
|---|---|---|
| Minuto | `30` | a las 3**:30** |
| Hora | `3` | a las **3**:30, formato 24 h |
| Día del mes | `*` | cualquiera |
| Mes | `*` | cualquiera |
| Día de la semana | `0` | domingo (el `7` también vale) |
| Comando | `/home/alumno/practica/limpiar.sh` | ruta **absoluta** |

3. `Ctrl+O` guarda e instala (abajo aparece `crontab: instalando el nuevo crontab`). `Ctrl+X` vuelve a la terminal.

4. Verificar:

```console
~$ crontab -l
# Tareas programadas de alumno. Una por línea, con este formato:
# ...
30 3 * * 0 /home/alumno/practica/limpiar.sh
```

### Para comentar en clase

- **El error más común es invertir minuto y hora** (`3 30 ...`). Una hora 30 no existe, y crontab la rechaza al guardar con un mensaje que dice qué campo está mal.
- **Ruta absoluta:** cron no arranca en la carpeta del usuario, así que `practica/limpiar.sh` no cumple la lección.
- Sin revisar con `crontab -l`, la lección no se da por cumplida: el objetivo es que se acostumbren a verificar.
- `crontab -r` borra **todas** las tareas sin preguntar. Conviene advertirlo.
- En el simulador cron no ejecuta nada de verdad; lo que se evalúa es que la línea esté bien escrita e instalada.

---

## Errores comunes

| Síntoma | Causa | Solución |
|---|---|---|
| `Permiso denegado` | El archivo no tiene permiso de ejecución | `chmod 755 script.sh` |
| `orden no encontrada` al correr un `.sh` | Falta el `./` adelante | `./script.sh` |
| `nombre: orden no encontrada` | Espacios alrededor del `=` | `nombre="Ana"`, todo junto |
| `[1: orden no encontrada` o `falta el «]»` | Faltan espacios dentro de los corchetes | `[ "$x" -eq 1 ]` |
| `se esperaba una expresión entera` | Se comparó texto con `-eq`, `-ge`, etc. | Usar `=` para texto, o pasar un número |
| `se esperaba «fi»` / `«done»` | Falta cerrar el `if` o el `for` | Agregar `fi` o `done` al final |
| `línea N: ...` | Error adentro del script | El número dice en qué línea buscar |
| El script corre pero la lección no se cumple | Se probó un solo caso, se usó una ruta relativa o se escribió el resultado a mano | Releer la consigna |
| `corté la ejecución: demasiados pasos` | Bucle infinito (la condición del `while` nunca cambia) | Actualizar la variable adentro del bucle |

---

## Diferencias con una terminal real

El simulador implementa lo que usa el módulo y avisa cuando algo no está soportado. Conviene aclararlo en clase para que nadie se frustre:

- **`read` solo lee por tubería.** `echo Ana | ./script.sh` funciona; esperar lo que se tipea, no.
- **En la terminal todo va en una línea.** Para un `if` o un `for` directo en la terminal se separa con punto y coma. En los scripts (nano) se escribe normal, en varias líneas.
- **La fecha es fija:** `date` siempre devuelve jueves 27 de agosto de 2026.
- **No hay:** subshells `( )`, `(( ))`, heredocs `<<`, `case` ni arrays. Para cuentas se usa `x=$((x + 1))`.
- **`chmod` solo acepta números** (`chmod 755`), no la forma `chmod +x`.
- **cron no ejecuta las tareas:** valida y guarda la línea, pero no la corre a la hora indicada.
