// Registro central de comandos disponibles para el motor.
// Los builtins de bash (read, test, exit, bash...) no estan aca: viven en
// shell.ts porque necesitan tocar variables y la entrada estandar.
import type { Registro } from '../tipos';
import { registroArchivos } from './archivos';
import { registroSistema } from './sistema';
import { registroPase } from './pase';
import { registroScripts } from './scripts';

export const REGISTRO: Registro = { ...registroArchivos, ...registroSistema, ...registroPase, ...registroScripts };
