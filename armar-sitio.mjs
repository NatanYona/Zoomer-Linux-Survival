// Arma el sitio desplegable a partir del build de Vite.
//
// Vite solo construye la app, que sale en dist/index.html. Sin este paso la
// landing no llega al sitio y el visitante cae directo en la terminal.
//
// Resultado:
//   dist/index.html        la landing
//   dist/curso/index.html  la app, un unico archivo con todo adentro
import { copyFileSync, mkdirSync, renameSync, statSync } from 'node:fs';

const kb = (p) => Math.round(statSync(p).size / 102.4) / 10;

mkdirSync('dist/curso', { recursive: true });
renameSync('dist/index.html', 'dist/curso/index.html');
copyFileSync('landing/index.html', 'dist/index.html');

console.log('sitio armado:');
console.log('  /              landing   ' + kb('dist/index.html') + ' KB');
console.log('  /curso/        app       ' + kb('dist/curso/index.html') + ' KB');
