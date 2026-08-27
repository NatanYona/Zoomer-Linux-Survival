// Registro central de comandos disponibles para el motor.
// archivos.ts y sistema.ts los escriben otros agentes en paralelo: hasta que
// aterricen, el typecheck de este archivo falla. Es esperado, no lo stubees.
import type { Registro } from '../tipos';
import { registroArchivos } from './archivos';
import { registroSistema } from './sistema';
import { registroPase } from './pase';

export const REGISTRO: Registro = { ...registroArchivos, ...registroSistema, ...registroPase };
