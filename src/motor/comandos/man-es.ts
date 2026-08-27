// Paginas de manual en espanol, escritas para este simulador. Texto original,
// cada una documenta solo lo que el comando realmente soporta aca.
export const MANUALES: Record<string, string> = {
  ls: `NOMBRE
    ls - listar el contenido de un directorio

SINOPSIS
    ls [-l] [-a] [ruta...]

DESCRIPCIÓN
    Muestra las entradas de la ruta indicada. Sin argumentos usa el
    directorio actual. Con varias rutas imprime una sección por cada una.

OPCIONES
    -l    formato largo: permisos, dueño, grupo y tamaño.
    -a    incluye las entradas ocultas (empiezan con '.').

EJEMPLOS
    ls -la ~/documentos
    ls -l archivo.txt`,

  cd: `NOMBRE
    cd - cambiar el directorio actual

SINOPSIS
    cd [ruta]

DESCRIPCIÓN
    Cambia el directorio de trabajo a la ruta indicada. Sin argumentos
    va al directorio personal del usuario.

EJEMPLOS
    cd documentos
    cd ..
    cd`,

  pwd: `NOMBRE
    pwd - mostrar el directorio actual

SINOPSIS
    pwd

DESCRIPCIÓN
    Imprime la ruta absoluta del directorio de trabajo actual.

EJEMPLOS
    pwd`,

  mkdir: `NOMBRE
    mkdir - crear directorios

SINOPSIS
    mkdir [-p] directorio...

DESCRIPCIÓN
    Crea cada directorio indicado. Falla si ya existe una entrada con
    ese nombre o si el directorio padre no existe.

OPCIONES
    -p    crea los directorios intermedios que falten sin quejarse si
          el destino final ya existe.

EJEMPLOS
    mkdir practica
    mkdir -p proyecto/src/lib`,

  rmdir: `NOMBRE
    rmdir - borrar directorios vacíos

SINOPSIS
    rmdir directorio...

DESCRIPCIÓN
    Borra cada directorio indicado. Falla si no existe, si no es un
    directorio o si no está vacío.

EJEMPLOS
    rmdir respaldo`,

  mv: `NOMBRE
    mv - mover o renombrar archivos y directorios

SINOPSIS
    mv origen... destino

DESCRIPCIÓN
    Mueve cada origen al destino. Si destino es un directorio existente,
    los orígenes se ubican dentro con su mismo nombre; si no, se
    requiere un único origen y se lo renombra.

EJEMPLOS
    mv borrador.txt informe.txt
    mv tarea1.txt tarea2.txt documentos/`,

  cp: `NOMBRE
    cp - copiar archivos y directorios

SINOPSIS
    cp [-r] origen... destino

DESCRIPCIÓN
    Copia cada origen al destino, igual que mv pero sin borrar el
    original. Copiar un directorio requiere -r.

OPCIONES
    -r, -R   copia el directorio y su contenido de forma recursiva.

EJEMPLOS
    cp apuntes.txt respaldo/
    cp -r proyecto proyecto-copia`,

  rm: `NOMBRE
    rm - borrar archivos y directorios

SINOPSIS
    rm [-r] [-f] ruta...

DESCRIPCIÓN
    Borra cada ruta indicada. Un directorio requiere -r.

OPCIONES
    -r, -R   borra directorios de forma recursiva.
    -f       no informa error si la ruta no existe.

EJEMPLOS
    rm tarea2.txt
    rm -rf respaldo`,

  cat: `NOMBRE
    cat - mostrar el contenido de archivos

SINOPSIS
    cat [archivo...]

DESCRIPCIÓN
    Imprime el contenido de cada archivo, uno tras otro. Sin argumentos
    imprime la entrada estándar (útil en una tubería).

EJEMPLOS
    cat bienvenida.txt
    cat tarea1.txt tarea2.txt`,

  more: `NOMBRE
    more - mostrar el contenido de un archivo

SINOPSIS
    more [archivo...]

DESCRIPCIÓN
    En este simulador se comporta igual que cat: la pantalla ya permite
    desplazarse, así que no hay paginado real.

EJEMPLOS
    more apuntes.txt`,

  head: `NOMBRE
    head - mostrar las primeras líneas de un archivo

SINOPSIS
    head [-n numero] [archivo...]

DESCRIPCIÓN
    Imprime las primeras líneas de cada archivo (10 por defecto). Sin
    archivos, opera sobre la entrada estándar.

OPCIONES
    -n numero    cantidad de líneas a mostrar.

EJEMPLOS
    head -n 3 apuntes.txt`,

  tail: `NOMBRE
    tail - mostrar las últimas líneas de un archivo

SINOPSIS
    tail [-n numero] [archivo...]

DESCRIPCIÓN
    Imprime las últimas líneas de cada archivo (10 por defecto). Sin
    archivos, opera sobre la entrada estándar.

OPCIONES
    -n numero    cantidad de líneas a mostrar.

EJEMPLOS
    tail -n 5 /var/log/sistema.log`,

  find: `NOMBRE
    find - buscar archivos por nombre

SINOPSIS
    find [ruta] [-name patron]

DESCRIPCIÓN
    Recorre la ruta indicada (por defecto el directorio actual) e
    imprime todas las entradas. Con -name filtra por el nombre final,
    admitiendo los comodines * y ?.

OPCIONES
    -name patron    solo lista entradas cuyo nombre matchea el patrón.

EJEMPLOS
    find .
    find proyecto -name "*.c"`,

  chmod: `NOMBRE
    chmod - cambiar los permisos de un archivo

SINOPSIS
    chmod modo archivo...

DESCRIPCIÓN
    Cambia el modo de cada archivo. El modo se escribe en notación
    octal de tres dígitos (dueño, grupo, otros); no se admite la
    notación simbólica (u+x, g-w, etc).

EJEMPLOS
    chmod 754 saludo.sh
    chmod 600 diario.txt`,

  grep: `NOMBRE
    grep - buscar líneas que coincidan con un patrón

SINOPSIS
    grep [-i] [-n] [-c] [-v] patron [archivo...]

DESCRIPCIÓN
    Imprime las líneas que coinciden con el patrón. Sin archivos opera
    sobre la entrada estándar. Con más de un archivo, antepone el
    nombre del archivo a cada línea. El patrón se interpreta como
    expresión regular; si no es una regex válida, se busca como texto
    literal.

OPCIONES
    -i    ignora mayúsculas y minúsculas.
    -n    antepone el número de línea.
    -c    solo muestra la cantidad de coincidencias.
    -v    invierte: muestra las líneas que NO coinciden.

EJEMPLOS
    grep -in error /var/log/sistema.log
    cat apuntes.txt | grep Tema`,

  wc: `NOMBRE
    wc - contar líneas, palabras y bytes

SINOPSIS
    wc [-l] [-w] [-c] [archivo...]

DESCRIPCIÓN
    Cuenta líneas, palabras y bytes de cada archivo. Sin flags muestra
    las tres columnas. Sin archivos opera sobre la entrada estándar.
    Con más de un archivo agrega una fila de totales.

OPCIONES
    -l    solo cuenta líneas.
    -w    solo cuenta palabras.
    -c    solo cuenta bytes.

EJEMPLOS
    wc -l apuntes.txt
    cat apuntes.txt | wc -w`,

  sort: `NOMBRE
    sort - ordenar líneas de texto

SINOPSIS
    sort [-r] [-n] [archivo...]

DESCRIPCIÓN
    Ordena las líneas alfabéticamente. Sin archivos opera sobre la
    entrada estándar; con varios archivos concatena su contenido antes
    de ordenar.

OPCIONES
    -r    orden descendente.
    -n    orden numérico en vez de alfabético.

EJEMPLOS
    sort planilla.csv
    cat planilla.csv | sort -rn`,

  ps: `NOMBRE
    ps - listar procesos

SINOPSIS
    ps [-e | -ef | aux]

DESCRIPCIÓN
    Sin flags, lista solo los procesos del usuario actual que tienen
    una terminal asociada. Con -e, -ef o aux lista todos los procesos
    del sistema. Solo se muestran los procesos vivos.

EJEMPLOS
    ps
    ps -ef`,

  kill: `NOMBRE
    kill - terminar un proceso

SINOPSIS
    kill [-9] pid

DESCRIPCIÓN
    Marca el proceso indicado como terminado. Falla si el pid no
    corresponde a un proceso vivo, o si el proceso pertenece a root.

OPCIONES
    -9    señal de terminación forzosa (en este simulador no cambia
          el resultado, solo se acepta por compatibilidad).

EJEMPLOS
    kill 1204
    kill -9 1337`,

  du: `NOMBRE
    du - mostrar el espacio usado por archivos y directorios

SINOPSIS
    du [-h] [-s] [ruta...]

DESCRIPCIÓN
    Suma recursivamente el tamaño del contenido de cada ruta. Sin -s
    imprime una línea por cada subdirectorio además del total.

OPCIONES
    -h    muestra los tamaños en formato legible (K, M).
    -s    solo el total de cada ruta, sin desglosar subdirectorios.

EJEMPLOS
    du -sh proyecto
    du documentos`,

  df: `NOMBRE
    df - mostrar el espacio en los sistemas de archivos

SINOPSIS
    df [-h]

DESCRIPCIÓN
    Muestra una tabla fija con los sistemas de archivos montados de
    este laboratorio simulado.

OPCIONES
    -h    muestra los tamaños en formato legible (G, M) en vez de
          bloques de 1K.

EJEMPLOS
    df -h`,

  lp: `NOMBRE
    lp - enviar un archivo a la cola de impresión

SINOPSIS
    lp archivo

DESCRIPCIÓN
    Encola el archivo indicado para imprimir y devuelve el
    identificador del pedido generado.

EJEMPLOS
    lp apuntes.txt`,

  lpstat: `NOMBRE
    lpstat - ver el estado de la cola de impresión

SINOPSIS
    lpstat

DESCRIPCIÓN
    Lista los trabajos pendientes en la cola de impresión.

EJEMPLOS
    lpstat`,

  cancel: `NOMBRE
    cancel - cancelar un trabajo de impresión

SINOPSIS
    cancel id

DESCRIPCIÓN
    Saca de la cola de impresión el trabajo con el id indicado (el
    que devolvió lp o el que lista lpstat).

EJEMPLOS
    cancel laser-42`,

  man: `NOMBRE
    man - mostrar la página de manual de un comando

SINOPSIS
    man comando

DESCRIPCIÓN
    Imprime la página de manual del comando indicado, si existe.

EJEMPLOS
    man grep`,

  echo: `NOMBRE
    echo - mostrar un texto

SINOPSIS
    echo [-n] [texto...]

DESCRIPCIÓN
    Imprime los argumentos separados por un espacio, seguido de un
    salto de línea.

OPCIONES
    -n    no agrega el salto de línea final.

EJEMPLOS
    echo hola mundo
    echo -n "sin salto"`,

  whoami: `NOMBRE
    whoami - mostrar el usuario actual

SINOPSIS
    whoami

DESCRIPCIÓN
    Imprime el nombre del usuario con el que está iniciada la sesión.

EJEMPLOS
    whoami`,

  id: `NOMBRE
    id - mostrar la identidad del usuario

SINOPSIS
    id

DESCRIPCIÓN
    Imprime el uid, el gid principal y la lista de grupos del usuario
    actual, leyendo /etc/passwd y /etc/group.

EJEMPLOS
    id`,

  groups: `NOMBRE
    groups - mostrar los grupos de un usuario

SINOPSIS
    groups [usuario]

DESCRIPCIÓN
    Sin argumentos, muestra los grupos del usuario actual. Con un
    usuario, busca sus grupos en /etc/group.

EJEMPLOS
    groups
    groups valeria`,

  touch: `NOMBRE
    touch - crear archivos vacíos

SINOPSIS
    touch archivo...

DESCRIPCIÓN
    Crea cada archivo indicado si no existe todavía, vacío. Si el
    archivo ya existe, no lo modifica.

EJEMPLOS
    touch notas.txt`,

  file: `NOMBRE
    file - identificar el tipo de un archivo

SINOPSIS
    file ruta...

DESCRIPCIÓN
    Indica si cada ruta es un directorio, datos binarios, un guion de
    shell ejecutable o texto plano, según su contenido.

EJEMPLOS
    file diagrama.png
    file practica/saludo.sh`,
};
