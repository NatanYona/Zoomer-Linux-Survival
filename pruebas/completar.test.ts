import { describe, it, expect } from 'vitest';
import { completar } from '../src/motor/completar';
import { semilla } from '../src/motor/semilla';

const COMANDOS = ['ls', 'll', 'cat', 'cd', 'pwd'];

describe('completar', () => {
  it('completado unico de comando', () => {
    const r = completar('ca', semilla(), COMANDOS);
    expect(r.linea).toBe('cat ');
    expect(r.candidatos).toEqual([]);
  });

  it('ambiguedad de comando con prefijo comun', () => {
    const r = completar('l', semilla(), COMANDOS);
    expect(r.linea).toBe('l');
    expect(r.candidatos).toEqual(['ll', 'ls']);
  });

  it('completado unico de archivo', () => {
    const r = completar('cat documentos/planil', semilla(), COMANDOS);
    expect(r.linea).toBe('cat documentos/planilla.csv ');
    expect(r.candidatos).toEqual([]);
  });

  it('directorio unico agrega barra', () => {
    const r = completar('cd docum', semilla(), COMANDOS);
    expect(r.linea).toBe('cd documentos/');
    expect(r.candidatos).toEqual([]);
  });

  it('ambiguedad de archivos en ~/documentos (prefijo comun tarea)', () => {
    const r = completar('cat documentos/tarea', semilla(), COMANDOS);
    expect(r.linea).toBe('cat documentos/tarea');
    expect(r.candidatos).toEqual(['tarea1.txt', 'tarea2.txt']);
  });

  it('fragmento con parte-directorio (documentos/ap)', () => {
    const r = completar('cat documentos/ap', semilla(), COMANDOS);
    expect(r.linea).toBe('cat documentos/apuntes.txt ');
    expect(r.candidatos).toEqual([]);
  });

  it('ocultos excluidos salvo que el fragmento arranque con punto', () => {
    // ~/alumno tiene dos ocultos: .bashrc (un huevo de pascua) y .perfil.
    // Con '.' son ambiguos, asi que lista candidatos y no completa nada.
    const conPunto = completar('cat .', semilla(), COMANDOS);
    expect(conPunto.candidatos).toContain('.perfil');
    expect(conPunto.candidatos.length).toBeGreaterThan(1);
    expect(conPunto.candidatos.every((c) => c.startsWith('.'))).toBe(true);

    const vacio = completar('cat ', semilla(), COMANDOS);
    expect(vacio.candidatos).not.toContain('.perfil');
  });

  it('ruta inexistente deja la linea sin cambios', () => {
    const r = completar('cat inexistente/algo', semilla(), COMANDOS);
    expect(r.linea).toBe('cat inexistente/algo');
    expect(r.candidatos).toEqual([]);
  });

  it('linea terminada en espacio completa el token siguiente vacio', () => {
    const r = completar('cd ', semilla(), COMANDOS);
    // cwd de la semilla es /home/alumno: bienvenida.txt, descargas, documentos, practica, proyecto, respaldo
    expect(r.candidatos.sort()).toEqual(
      ['bienvenida.txt', 'descargas', 'documentos', 'practica', 'proyecto', 'respaldo'].sort(),
    );
  });

  it('linea vacia', () => {
    const r = completar('', semilla(), COMANDOS);
    expect(r.candidatos.sort()).toEqual([...COMANDOS].sort());
  });

  it('preserva espacios internos al reconstruir', () => {
    const r = completar('cat   documentos/ap', semilla(), COMANDOS);
    expect(r.linea).toBe('cat   documentos/apuntes.txt ');
  });

  it('ningun candidato deja la linea sin cambios', () => {
    const r = completar('cat documentos/zzz', semilla(), COMANDOS);
    expect(r.linea).toBe('cat documentos/zzz');
    expect(r.candidatos).toEqual([]);
  });
});
