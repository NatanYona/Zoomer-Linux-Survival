# Guía del evento: Operación Atajo

Resolución paso a paso de las 11 misiones y el cuestionario del evento del día de **Zoomer Linux Survival**, pensada para quien da el taller.

Cada misión trae qué se practica, los pasos para resolverla, lo que muestra la terminal y los errores que más aparecen. Todas las salidas se sacaron del simulador, así que son exactamente las que va a ver el alumno.

## Índice

- [Cómo funciona el evento](#cómo-funciona-el-evento)
- [Misión 1: Tu primer alias](#misión-1-tu-primer-alias)
- [Misión 2: Que el atajo no se pierda](#misión-2-que-el-atajo-no-se-pierda)
- [Misión 3: ¿Dónde viven los comandos?](#misión-3-dónde-viven-los-comandos)
- [Misión 4: Tu propio comando](#misión-4-tu-propio-comando)
- [Misión 5: Automatizá una tarea](#misión-5-automatizá-una-tarea)
- [Misión 6: Que se haga solo](#misión-6-que-se-haga-solo)
- [Misión 7: Que no explote](#misión-7-que-no-explote)
- [Misión 8: Modo de uso](#misión-8-modo-de-uso)
- [Misión 9: Semáforo del servidor](#misión-9-semáforo-del-servidor)
- [Misión 10: Si anda, avisá; si no, gritá](#misión-10-si-anda-avisá-si-no-gritá)
- [Misión 11: Jefe final: el reporte](#misión-11-jefe-final-el-reporte)
- [Cuestionario](#cuestionario)
- [Errores comunes](#errores-comunes)
- [Diferencias con una terminal real](#diferencias-con-una-terminal-real)

---

## Cómo funciona el evento

**Cuándo se ve.** El evento está activo del **lunes 12 al domingo 18 de octubre de 2026**. Durante esa semana, al entrar al curso aparece un pop-up de noticias que lo anuncia, y en la barra de módulos se suma la pestaña **Evento del día**. Fuera de esas fechas no aparece ni el pop-up ni la pestaña. El XP de las misiones que el alumno ya cumplió se mantiene igual.

**El hilo.** El sysadmin del laboratorio se fue de vacaciones y dejó todo hecho a mano. El evento tiene dos partes:

| Misiones | Tema | Tiempo aproximado |
|---|---|---|
| 1 a 6 | **Herramientas:** alias, PATH, comandos propios en `~/bin`, cron | 1 hora |
| 7 a 11 | **Scripts que deciden:** `if`, códigos de salida, `&&` y `\|\|`, `while read` | 1 hora |

Al final hay un cuestionario de 6 preguntas.

**Puntos.** Cada misión da los mismos puntos que una lección: 150 XP sin pista, 100 con pista. El cuestionario suma 25 por respuesta correcta, y completar todo con el cuestionario aprobado da 200 más. Para el pase, el XP del evento es un bonus, como los huevos de pascua: quien estuvo esa semana puede llegar a root por ese camino, y quien no, sigue pudiendo llegar explorando.

**Con qué arranca cada misión.**

- **Misiones 1 a 6:** arrancan de cero, con los archivos, los alias y el PATH en su estado inicial. En las misiones 5 y 6 hay que volver a crear `~/bin`, y en la 5 también volver a sumarla al PATH. Las consignas lo avisan, pero conviene repetirlo en voz alta.
- **Misiones 7 a 11:** arrancan con `~/bin` creada, en el PATH, y con el `respaldar` de la misión anterior instalado. Cada una mejora el script de la anterior.

**Requisito.** Desde la misión 5 se usan `for`, variables y `crontab` del módulo 5. Se pueden hacer sin haberlo terminado, pero cuesta más.

**Los scripts se prueban con otros datos.** En las misiones 9 y 11, el simulador corre el script del alumno contra otro log y otra lista de notas. Un script que imprime siempre lo mismo no pasa: tiene que decidir de verdad.

---

## Misión 1: Tu primer alias

> Creá un alias llamado `ll` que ejecute `ls -la`. Después usalo para ver todo lo que hay en tu carpeta personal, ocultos incluidos.

**Qué se practica:** crear un alias y usarlo.

### Pasos

```console
~$ alias ll='ls -la'
~$ ll
-rw-r--r-- alumno alumnos  214 .bashrc
-rw-r--r-- alumno alumnos   18 .perfil
-rw-r--r-- alumno alumnos   85 bienvenida.txt
drwxr-xr-x alumno alumnos 4096 descargas
drwxr-xr-x alumno alumnos 4096 documentos
drwxr-xr-x alumno alumnos 4096 practica
drwxr-xr-x alumno alumnos 4096 proyecto
drwxr-xr-x alumno alumnos 4096 respaldo
```

### Para comentar en clase

- **Sin espacios alrededor del `=`**, igual que con las variables. Si escriben `alias ll = ls -la`, el simulador responde:
  ```
  bash: alias: alrededor del = no van espacios. Va todo junto: alias ll='ls -la'
  ```
- **Las comillas simples hacen falta** porque el comando tiene un espacio. Sin ellas, `alias ll=ls -la` guarda solo `ls`, y bash toma `-la` como otro alias que no existe.
- `alias` solo, sin nada más, lista los que hay. `unalias ll` lo borra.
- Lo que se escribe después del alias se agrega al final: `ll documentos` corre `ls -la documentos`.
- La misión pide **usar** el alias después de crearlo: no alcanza con definirlo.

---

## Misión 2: Que el atajo no se pierda

> Guardá en `~/.bash_aliases` un alias llamado `docs` que haga `cd ~/documentos && ls`. Cargalo con `source` y usalo.

**Qué se practica:** guardar alias en un archivo, `>>` y `source`.

### Pasos

```console
~$ echo "alias docs='cd ~/documentos && ls'" >> ~/.bash_aliases
~$ source ~/.bash_aliases
~$ docs
apuntes.txt  borrador.txt  planilla.csv  tarea1.txt  tarea2.txt
~/documentos$
```

El prompt cambia a `~/documentos`: el `cd` del alias movió la terminal.

También se puede escribir el archivo con `nano ~/.bash_aliases` y poner adentro `alias docs='cd ~/documentos && ls'`.

### Para comentar en clase

- **Las comillas:** dobles por fuera (las de `echo`) y simples por dentro (las del alias). Si usan simples en los dos lados, la primera simple de adentro cierra la de afuera: el `&&` queda suelto, bash lo toma como parte de la línea y `echo` imprime en pantalla `alias docs=cd /home/alumno/documentos`. El `>> ~/.bash_aliases` queda pegado al `ls`, así que al archivo va el listado de la carpeta y no el alias. Si alguien dice "lo guardé y no anda", que haga `cat ~/.bash_aliases`.
- **`>>` y no `>`.** Con un solo `>` se pisa todo el archivo, y con él los alias que ya tenían guardados.
- **Por qué `.bash_aliases` y no `.bashrc`:** en Ubuntu, el `.bashrc` ya trae unas líneas que cargan `~/.bash_aliases` si existe. Tener los alias aparte es más prolijo, y si se rompe uno, no se rompe toda la configuración.
- **`source` corre el archivo en la terminal actual.** Si lo corrieran con `bash ~/.bash_aliases`, los alias se crearían en otro proceso que termina enseguida, y en la terminal no quedaría nada.
- La misión se cumple cuando el alias está en el archivo, se cargó con `source` y, al usarlo, la terminal quedó en `~/documentos`.

---

## Misión 3: ¿Dónde viven los comandos?

> Mostrá qué carpetas tiene tu PATH. Después preguntale a `which` dónde está `ls` y a `type` qué es `cd`.

**Qué se practica:** la variable `PATH`, `which` y `type`.

### Pasos

```console
~$ echo $PATH
/usr/local/bin:/usr/bin:/bin
~$ which ls
/usr/bin/ls
~$ type cd
cd es una orden interna del shell
```

### Para comentar en clase

- **El PATH se recorre en orden** y gana la primera carpeta donde aparece el comando. Por eso importa si una carpeta se agrega al principio o al final.
- **`cd` no está en ningún archivo:** vive adentro de bash. Que lo prueben con `which cd`, que no muestra nada. Tiene que ser así: un programa aparte no puede cambiarle la carpeta a la terminal que lo llamó.
- **`type` sabe más que `which`.** `which` solo busca en el PATH. `type` también reconoce alias y funciones. Para verlo: `alias ll='ls -la'`, después `type ll` (`ll es un alias de «ls -la»`) y `which ll` (no muestra nada).
- **Por qué hace falta `./script.sh`:** la carpeta actual no está en el PATH. Si escriben el nombre a secas, el simulador lo explica:
  ```
  bash: limpiar.sh: orden no encontrada
  (está en la carpeta actual, pero bash solo busca comandos en las carpetas del PATH. Escribí ./limpiar.sh)
  ```
  Y es a propósito: si la carpeta actual estuviera en el PATH, alguien podría dejar en `/tmp` un programa trucho llamado `ls` y esperar a que otro entre a mirar. Es un buen momento para hablar de seguridad.

---

## Misión 4: Tu propio comando

> Creá la carpeta `~/bin` y adentro un script llamado `saludar` (sin `.sh`) que muestre un saludo. Dale permiso de ejecución, sumá `~/bin` al PATH y ejecutalo por su nombre, por ejemplo desde `/tmp`.

**Qué se practica:** `~/bin`, `chmod +x` y `export PATH`.

### Pasos

1. Crear la carpeta:

```console
~$ mkdir ~/bin
```

2. Escribir el script con `nano ~/bin/saludar`:

```bash
#!/bin/bash
echo "Hola, soy un comando nuevo"
```

`Ctrl+O` guarda, `Ctrl+X` sale.

3. Darle permiso de ejecución, sumar la carpeta al PATH y probarlo desde otro lado:

```console
~$ chmod +x ~/bin/saludar
~$ export PATH="$PATH:$HOME/bin"
~$ cd /tmp
/tmp$ saludar
Hola, soy un comando nuevo
```

### Para comentar en clase

- **El `$PATH` del principio es clave.** `export PATH="$PATH:$HOME/bin"` agrega `~/bin` al final y conserva todo lo que había. Si alguien escribe `PATH=$HOME/bin` a secas, se queda sin comandos:
  ```console
  ~$ PATH=$HOME/bin
  ~$ ls
  bash: ls: orden no encontrada
  ```
  Se arregla con `export PATH=/usr/bin:/bin` o con **Reiniciar la terminal**. Vale la pena dejar que les pase: no se olvidan más.
- **Si falta el permiso de ejecución**, el simulador dice cuál es el problema:
  ```
  bash: saludar: orden no encontrada
  (/home/alumno/bin/saludar existe pero le falta el permiso de ejecución: chmod 755 /home/alumno/bin/saludar)
  ```
- **`chmod +x`** suma la x para dueño, grupo y otros sin tocar los demás permisos. `chmod 755` también sirve.
- **Sin `.sh`:** los comandos del sistema no llevan extensión (`ls` no se llama `ls.sh`). Si le ponen `.sh`, funciona igual, pero lo tienen que llamar `saludar.sh`.
- **El PATH no sobrevive:** al cerrar la terminal se pierde. En una máquina real, el `export` se agrega al final de `~/.bashrc`. Y Ubuntu ya trae ese chiche: si `~/bin` existe al iniciar sesión, la suma sola.
- La misión se cumple cuando un script de `~/bin` corre sin errores, muestra algo y se llamó **por su nombre**, sin ruta.

---

## Misión 5: Automatizá una tarea

> Creá el comando `respaldar` en `~/bin`: que copie cada `.txt` de `~/documentos` a `~/respaldo` y al final diga cuántos copió. Ejecutalo por su nombre. La terminal arrancó limpia: volvé a crear `~/bin` y a sumarlo al PATH.

**Qué se practica:** un script útil de verdad, con `for`, un contador y un mensaje final.

### Pasos

1. Rearmar `~/bin`:

```console
~$ mkdir ~/bin
```

2. Escribir el script con `nano ~/bin/respaldar`:

```bash
#!/bin/bash
n=0
for f in ~/documentos/*.txt; do
  cp $f ~/respaldo/
  n=$((n+1))
done
echo "Respaldo listo: $n archivos"
```

3. Permiso, PATH y a correrlo:

```console
~$ chmod +x ~/bin/respaldar
~$ export PATH="$PATH:$HOME/bin"
~$ respaldar
Respaldo listo: 4 archivos
```

4. Para verificar:

```console
~$ ls ~/respaldo
apuntes.txt  borrador.txt  tarea1.txt  tarea2.txt
```

### Para comentar en clase

- **`planilla.csv` no se copia:** `*.txt` solo toma lo que termina en `.txt`. Es un buen momento para repasar los comodines.
- **`n=$((n+1))`** hace la cuenta. Si escriben `n=n+1`, la variable guarda el texto `n+1` y el mensaje final queda raro.
- **El mensaje final importa.** Un comando que no dice nada no deja saber si anduvo. La misión exige que la salida tenga el número.
- **Variante corta:** `cp ~/documentos/*.txt ~/respaldo/` hace la copia en una línea, pero no cuenta. Si alguien la usa con un `echo` fijo ("4 archivos"), la misión pasa igual: conviene preguntarle qué pasaría si mañana hubiera 5.
- La misión se cumple cuando `respaldar` se llamó por su nombre, terminó sin errores, mostró un número y los cuatro `.txt` están en `~/respaldo`.

---

## Misión 6: Que se haga solo

> Programá `respaldar` para que corra de lunes a viernes a las 18:00. Instalá la tarea con `crontab` y revisá con `crontab -l` que haya quedado.

**Qué se practica:** crontab con un rango de días, y por qué cron necesita rutas absolutas.

### Pasos

1. `crontab -e` y agregar al final:

```
0 18 * * 1-5 /home/alumno/bin/respaldar
```

| Campo | Valor | Por qué |
|---|---|---|
| Minuto | `0` | en punto |
| Hora | `18` | 18:00, formato 24 h |
| Día del mes | `*` | cualquiera |
| Mes | `*` | cualquiera |
| Día de la semana | `1-5` | de lunes (1) a viernes (5) |
| Comando | `/home/alumno/bin/respaldar` | ruta **absoluta** |

2. `Ctrl+O` guarda e instala, `Ctrl+X` sale.

3. Verificar:

```console
~$ crontab -l
0 18 * * 1-5 /home/alumno/bin/respaldar
```

(Si usaron `crontab -e`, arriba aparecen también los comentarios de la plantilla.)

Otra forma, sin editor:

```console
~$ echo '0 18 * * 1-5 /home/alumno/bin/respaldar' > ~/tareas.txt
~$ crontab ~/tareas.txt
~$ crontab -l
0 18 * * 1-5 /home/alumno/bin/respaldar
```

### Para comentar en clase

- **La trampa del evento:** con `respaldar` a secas, crontab instala la línea sin quejarse, pero la misión no se cumple. Cron no lee el `.bashrc` ni los alias, y arranca con un PATH mínimo (`/usr/bin:/bin`), sin `~/bin`. En una máquina real, la tarea fallaría **en silencio** todos los días, y uno se entera el día que necesita el respaldo.
- `$HOME/bin/respaldar` también se acepta: cron define `HOME` aunque no tenga tu PATH.
- `1-5` es un rango. `1,3,5` sería lunes, miércoles y viernes. `*/2` en la hora sería cada dos horas.
- **Hace falta revisar con `crontab -l`**, igual que en el módulo 5: si no, la misión no se da por cumplida.
- En el simulador, cron no ejecuta nada de verdad: lo que se evalúa es que la línea esté bien escrita e instalada. En esta misión no hace falta que `respaldar` exista.

---

## Misión 7: Que no explote

> Corré `respaldar` y mirá cómo falla sin `~/respaldo`. Después mejoralo con `nano ~/bin/respaldar`: si la carpeta no existe, que la cree y avise. Volvé a correrlo hasta que termine sin errores.

**Qué se practica:** `if` con `-d` y `!`: revisar antes de actuar.

**Con qué arranca:** `~/bin` en el PATH, el `respaldar` de la misión 5 y la carpeta `~/respaldo` borrada.

### Pasos

1. Ver el problema:

```console
~$ respaldar
Respaldo listo: 4 archivos
cp: no se puede crear «/home/alumno/respaldo/»: No existe el directorio
cp: no se puede crear «/home/alumno/respaldo/»: No existe el directorio
cp: no se puede crear «/home/alumno/respaldo/»: No existe el directorio
cp: no se puede crear «/home/alumno/respaldo/»: No existe el directorio
```

Dice "Respaldo listo: 4 archivos", pero no copió nada. Vale la pena señalarlo: el script miente.

2. Con `nano ~/bin/respaldar`, dejarlo así:

```bash
#!/bin/bash
destino=$HOME/respaldo
if [ ! -d $destino ]; then
  echo "Creando $destino"
  mkdir $destino
fi
n=0
for f in $HOME/documentos/*.txt; do
  cp $f $destino/
  n=$((n+1))
done
echo "Respaldo listo: $n archivos"
```

3. Probarlo:

```console
~$ respaldar
Creando /home/alumno/respaldo
Respaldo listo: 4 archivos
~$ ls ~/respaldo
apuntes.txt  borrador.txt  tarea1.txt  tarea2.txt
```

Si lo corren otra vez, ya no dice "Creando": la carpeta existe.

### Para comentar en clase

- **Los espacios dentro de `[ ]` son obligatorios.** `[! -d $destino]` da `orden no encontrada`: `[` es un comando, y lo que va adentro son sus argumentos.
- **Hacer `mkdir ~/respaldo` a mano no alcanza:** la misión pide que el script tenga el `if` con `-d`.
- `-f` pregunta por archivos y `-d` por carpetas.
- La variable `destino` evita escribir la ruta tres veces. Si mañana cambia, se toca en un solo lugar.

---

## Misión 8: Modo de uso

> Hacé que `respaldar` reciba la carpeta como argumento (en el `for`, `$1` en vez de `$HOME/documentos`). Si no recibe ninguno, que muestre `Uso: respaldar carpeta` y salga con `exit 1`. Probalo con y sin carpeta, y mirá el código de salida con `echo $?`.

**Qué se practica:** `$#`, `exit 1`, `>&2` y `$?`.

**Con qué arranca:** el `respaldar` de la misión 7.

### Pasos

1. Agregar el chequeo arriba de todo y usar `$1` en el `for`:

```bash
#!/bin/bash
if [ $# -eq 0 ]; then
  echo "Uso: respaldar carpeta" >&2
  exit 1
fi
destino=$HOME/respaldo
if [ ! -d $destino ]; then
  mkdir $destino
fi
n=0
for f in $1/*.txt; do
  cp $f $destino/
  n=$((n+1))
done
echo "Respaldo listo: $n archivos"
```

2. Probar las dos formas:

```console
~$ respaldar
Uso: respaldar carpeta
~$ echo $?
1
~$ respaldar ~/documentos
Respaldo listo: 4 archivos
~$ echo $?
0
```

El "Uso" aparece en rojo porque salió por la salida de errores.

### Para comentar en clase

- **El código de salida es lo que leen los demás programas.** Si sacan el `exit 1`, el script igual muestra el mensaje, pero `echo $?` da `0`: para el sistema salió todo bien. Sin el `exit 1` la misión no pasa.
- **`$?` se pisa enseguida:** muestra el código del **último** comando. Si hacen `respaldar`, después `ls` y recién ahí `echo $?`, ven el código del `ls`.
- **Desafío para los que terminan rápido:** `respaldar ~/nada` (una carpeta que no existe) dice "Respaldo listo: 1 archivos", tira un error de `cp` y sale con `0`. ¿Cómo lo arreglarían? Con otro `if [ ! -d $1 ]` que avise y haga `exit 1`.

---

## Misión 9: Semáforo del servidor

> Creá el comando `revisar-log` en `~/bin`. Que cuente las líneas con `ERROR` de `/var/log/sistema.log` y responda como un semáforo: más de 3 es una alerta, de 1 a 3 pide atención y 0 dice que está todo en orden. Ejecutalo por su nombre.

**Qué se practica:** `if / elif / else`, comparar números, `$(... | wc -l)`.

### Pasos

1. `nano ~/bin/revisar-log`:

```bash
#!/bin/bash
errores=$(grep ERROR /var/log/sistema.log | wc -l)
if [ $errores -gt 3 ]; then
  echo "ALERTA: $errores errores en el log"
elif [ $errores -gt 0 ]; then
  echo "Atención: $errores errores en el log"
else
  echo "Todo en orden"
fi
```

2. Permiso y a correrlo:

```console
~$ chmod +x ~/bin/revisar-log
~$ revisar-log
Atención: 3 errores en el log
```

Para ver de dónde sale el 3:

```console
~$ grep ERROR /var/log/sistema.log
ERROR no se pudo abrir /dev/sdb1: dispositivo ocupado
ERROR fallo de autenticacion para el usuario invitado
ERROR timeout al contactar el servidor de impresion
```

### Para comentar en clase

- **Cómo se valida:** el simulador corre el script tres veces, con logs de 0, 2 y 5 errores, y exige tres respuestas distintas. Un script que imprime "Atención" de memoria no pasa.
- **El orden importa.** Si ponen primero `-gt 0` y después `-gt 3`, con 5 errores entra en el primero y nunca llega a la alerta. Bash entra solo en la primera condición que se cumple.
- **`>` no compara números:** `[ $errores > 3 ]` es una redirección y crea un archivo llamado `3`. Para números van `-gt`, `-lt`, `-eq` y compañía.
- **Sin el `else`**, el script no dice nada cuando el log está limpio. Un comando mudo no deja saber si anduvo, y además la misión pide el `else`.

---

## Misión 10: Si anda, avisá; si no, gritá

> Corré `respaldar ~/documentos` encadenado para que diga `Respaldo OK` si anda y `Respaldo FALLÓ` si no. Después provocá la falla llamándolo sin carpeta, mandando el error a `~/errores.log` con `2>>`, y mirá con `cat` que haya quedado guardado.

**Qué se practica:** `&&`, `||` y `2>>`.

**Con qué arranca:** el `respaldar` de la misión 8, con el `exit 1`.

### Pasos

```console
~$ respaldar ~/documentos && echo "Respaldo OK" || echo "Respaldo FALLÓ"
Respaldo listo: 4 archivos
Respaldo OK
~$ respaldar 2>> ~/errores.log || echo "Respaldo FALLÓ"
Respaldo FALLÓ
~$ cat ~/errores.log
Uso: respaldar carpeta
```

En la segunda línea, el "Uso" no aparece en pantalla: se fue al archivo.

### Para comentar en clase

- **Comparar con y sin redirección:** `respaldar && echo "Respaldo OK" || echo "Respaldo FALLÓ"` muestra "Respaldo FALLÓ" **y** el "Uso" en rojo. Con `2>>`, el error queda guardado y la pantalla queda limpia.
- **`2>>` y no `2>`:** con uno solo, cada falla borra la anterior. Un registro de errores sirve justamente porque acumula.
- **La conexión con cron:** la línea completa de la misión 6 sería `0 18 * * 1-5 /home/alumno/bin/respaldar /home/alumno/documentos 2>> /home/alumno/errores.log`. Así, si falla a las 18 sin nadie mirando, queda escrito.
- `a && b || c` no es exactamente un if/else: si `a` anda pero `b` falla, también corre `c`. Con un `echo` como `b` no pasa nunca, pero es bueno saberlo.

---

## Misión 11: Jefe final: el reporte

> Creá el comando `reporte` en `~/bin`. Que lea `~/notas.txt` y, por cada alumno, muestre si aprobó (nota 7 o más) o si va a recuperatorio. Al final, que diga cuántos aprobaron. Ejecutalo por su nombre.

**Qué se practica:** `while read` sobre un archivo, con un `if` y un contador adentro.

**Con qué arranca:** `~/bin` en el PATH y el archivo `~/notas.txt`:

```console
~$ cat ~/notas.txt
Ortiz 8
Suarez 6
Medina 9
Paz 4
Rios 7
```

### Pasos

1. `nano ~/bin/reporte`:

```bash
#!/bin/bash
aprobados=0
while read nombre nota; do
  if [ $nota -ge 7 ]; then
    echo "$nombre: aprobado"
    aprobados=$((aprobados+1))
  else
    echo "$nombre: recupera"
  fi
done < ~/notas.txt
echo "Aprobaron $aprobados"
```

2. Permiso y a correrlo:

```console
~$ chmod +x ~/bin/reporte
~$ reporte
Ortiz: aprobado
Suarez: recupera
Medina: aprobado
Paz: recupera
Rios: aprobado
Aprobaron 3
```

### Para comentar en clase

- **Cómo se valida:** el simulador corre el script con otra lista (`Ana 10`, `Leo 3`, `Sol 7`) y revisa que Ana y Sol aprueben, que Leo no, y que diga 2. Un reporte que imprime los nombres de memoria no pasa.
- **El 7 es la trampa.** Con `-gt 7` en vez de `-ge 7`, Rios (y Sol en la prueba) quedan afuera. Es el error más común de toda la misión.
- **Con `[ $nota > 7 ]`**, el script no compara nada: crea un archivo llamado `7` y la condición da verdadera siempre. Que lo prueben y miren `ls ~`.
- **El `< ~/notas.txt` va después del `done`**, no al lado del `while`: es la entrada del bucle entero.
- `read nombre nota` reparte por espacios. Si una línea fuera `Ana María 9`, `nombre` sería `Ana` y `nota` sería `María 9`. Con nombres de una palabra no pasa, pero sirve para explicar cómo funciona `read`.

---

## Cuestionario

Seis preguntas, una por idea central del evento. Se aprueba con 5 de 6.

| # | Pregunta | Respuesta |
|---|---|---|
| 1 | Creaste `alias ll='ls -la'`, cerrás la terminal, abrís otra y escribís `ll`. ¿Qué pasa? | `orden no encontrada`: el alias vivía en la terminal que cerraste |
| 2 | Un script ejecutable está en `~/bin/saludar`, pero `saludar` da "orden no encontrada". ¿Qué falta? | Que `~/bin` esté en el PATH: `export PATH="$PATH:$HOME/bin"` |
| 3 | En el crontab pusiste `0 18 * * 1-5 respaldar` y nunca corre. ¿Por qué? | Cron no tiene tu PATH: el comando va con ruta absoluta |
| 4 | `respaldar && echo "OK" \|\| echo "FALLÓ"`, con un script que muestra "Uso" pero no tiene `exit 1`. ¿Qué se imprime? | `OK`: sin `exit 1`, el script termina con código 0 |
| 5 | `errores` vale 2. ¿Qué imprime el semáforo `-gt 3` / `-gt 0` / `else`? | `amarillo`: entra solo en la primera condición que se cumple |
| 6 | ¿Qué hace `while read nombre nota; do ... done < notas.txt`? | Recorre el archivo línea por línea y reparte cada línea entre las variables |

La pregunta 4 es la que más se equivoca, y es la idea más importante de la segunda parte: el mensaje es para las personas y el código de salida es para los programas.

---

## Errores comunes

| Lo que pasa | Por qué | Cómo se arregla |
|---|---|---|
| `alias: alrededor del = no van espacios` | `alias ll = ls` | Todo junto: `alias ll='ls -la'` |
| El alias corre solo `ls`, sin `-la` | Faltan las comillas: `alias ll=ls -la` | `alias ll='ls -la'` |
| `docs: orden no encontrada` después de guardarlo | Falta cargarlo | `source ~/.bash_aliases` |
| Se borraron alias viejos de `.bash_aliases` | Usaron `>` en vez de `>>` | Volver a agregarlos con `>>` |
| `orden no encontrada` + "le falta el permiso de ejecución" | El script no tiene x | `chmod +x ~/bin/nombre` |
| `orden no encontrada` sin pista | `~/bin` no está en el PATH (la misión arrancó limpia) | `export PATH="$PATH:$HOME/bin"` |
| `ls: orden no encontrada` | Pisaron el PATH: `PATH=$HOME/bin` | `export PATH=/usr/bin:/bin` o Reiniciar la terminal |
| `Respaldo listo: 1 archivos` + `cp: no se puede acceder a «.../*.txt»` | La ruta del `for` está mal: si el `*.txt` no encuentra nada, bash deja el patrón tal cual y el `for` da una vuelta con eso | `for f in ~/documentos/*.txt` |
| La tarea de cron se instala pero la misión no se cumple | Comando sin ruta absoluta | `/home/alumno/bin/respaldar` |
| `[!: orden no encontrada` | Faltan los espacios: `[! -d $x]` | `[ ! -d $x ]` |
| "Respaldo listo: 4 archivos" pero `~/respaldo` está vacía | El script no revisa antes de copiar | Un `if [ ! -d ... ]` antes del `for` (misión 7) |
| `echo $?` da 0 aunque el script se quejó | Falta el `exit 1` | `exit 1` después del mensaje de uso |
| Aparece un archivo llamado `3` o `7` | Compararon números con `>` | `-gt`, `-ge`, `-lt`, `-le`, `-eq` |
| El semáforo nunca dice "ALERTA" | Condiciones en el orden equivocado | Primero la más exigente (`-gt 3`), después `-gt 0` |
| A Rios (nota 7) le dice "recupera" | Usaron `-gt 7` | `-ge 7` |
| `errores.log` tiene solo el último error | Usaron `2>` en vez de `2>>` | `2>>` agrega al final |

---

## Diferencias con una terminal real

- **Los comandos del sistema** se presentan como si vivieran en `/usr/bin` (`which ls` → `/usr/bin/ls`). En Ubuntu real, algunos están en `/bin` o en las dos carpetas.
- **Órdenes internas:** el simulador reconoce como internas `cd`, `echo`, `pwd`, `kill`, `history`, `help`, `alias`, `export`, `source` y las de scripts. Bash tiene más, pero esas son las que aparecen en el curso.
- **`~` dentro del PATH:** con `PATH=$PATH:~/bin`, bash reemplaza el `~` por la ruta completa en el momento. El simulador lo guarda tal cual y lo resuelve al buscar. Funciona igual, pero `echo $PATH` muestra el `~`.
- **`.bash_aliases` no se carga solo:** en Ubuntu el `.bashrc` lo lee al abrir cada terminal. En el simulador cada misión arranca limpia, así que siempre hace falta el `source`.
- **Cron no ejecuta nada:** se valida el formato de la línea y que esté instalada, no que la tarea corra a las 18.
- **Los alias no se expanden dentro de scripts**, igual que en bash real (salvo que se active a mano con `shopt`, algo que el simulador no tiene).
- **Orden de los mensajes:** cuando un comando imprime salida normal y errores, el simulador muestra primero toda la salida normal y después los errores. En una terminal real pueden salir mezclados, en el orden en que ocurrieron. Se nota en la misión 7: el "Respaldo listo" aparece arriba de los errores de `cp`.
- **`[ $x > 7 ]` crea el archivo `7`**, igual que en bash real. No es un error del simulador: es el comportamiento de verdad, y por eso conviene mostrarlo.
