// Tokenizador y separador en etapas de una linea de shell.
// Soporta: comillas simples/dobles (agrupan y se remueven), pipe `|`,
// y redireccion de salida `>` / `>>` al final de una etapa.
// ponytail: no soporta &&, ||, ;, redireccion de entrada (<) ni 2>/2>&1.
// agregar cuando una leccion lo necesite.

export interface Etapa {
  cmd: string;
  args: string[];
  redir?: { archivo: string; anexar: boolean };
}

/** Separa la linea en tokens, removiendo comillas y aislando `|`, `>`, `>>`. */
function tokenizar(linea: string): string[] {
  const tokens: string[] = [];
  let actual = '';
  let tieneToken = false; // distingue token vacio (por '' o "") de "nada que empujar"
  let i = 0;
  const push = () => {
    if (tieneToken) {
      tokens.push(actual);
      actual = '';
      tieneToken = false;
    }
  };
  while (i < linea.length) {
    const c = linea[i];
    if (c === ' ' || c === '\t') {
      push();
      i++;
      continue;
    }
    if (c === "'" || c === '"') {
      const q = c;
      i++;
      while (i < linea.length && linea[i] !== q) {
        actual += linea[i];
        i++;
      }
      i++; // saltea la comilla de cierre (si no hay, llegamos al final igual)
      tieneToken = true;
      continue;
    }
    if (c === '|') {
      push();
      tokens.push('|');
      i++;
      continue;
    }
    if (c === '>') {
      push();
      if (linea[i + 1] === '>') {
        tokens.push('>>');
        i += 2;
      } else {
        tokens.push('>');
        i++;
      }
      continue;
    }
    actual += c;
    tieneToken = true;
    i++;
  }
  push();
  return tokens;
}

/** Arma una etapa a partir de sus tokens, extrayendo la redireccion si hay. */
function armarEtapa(tokens: string[]): Etapa | null {
  const idx = tokens.findIndex((t) => t === '>' || t === '>>');
  let redir: Etapa['redir'];
  let resto = tokens;
  if (idx >= 0) {
    redir = { archivo: tokens[idx + 1] ?? '', anexar: tokens[idx] === '>>' };
    resto = [...tokens.slice(0, idx), ...tokens.slice(idx + 2)];
  }
  if (!resto.length) return null; // etapa vacia (p.ej. pipe duplicado o al final)
  const [cmd, ...args] = resto;
  return { cmd, args, redir };
}

export function parsear(linea: string): Etapa[] {
  if (!linea.trim()) return [];
  const tokens = tokenizar(linea);
  const etapasTokens: string[][] = [[]];
  for (const t of tokens) {
    if (t === '|') etapasTokens.push([]);
    else etapasTokens[etapasTokens.length - 1].push(t);
  }
  // ponytail: una etapa vacia (ej. "ls ||cat" o "ls |") se descarta en
  // silencio en vez de dar error de sintaxis. mejorar si una leccion lo pide.
  const etapas: Etapa[] = [];
  for (const ts of etapasTokens) {
    const e = armarEtapa(ts);
    if (e) etapas.push(e);
  }
  return etapas;
}
