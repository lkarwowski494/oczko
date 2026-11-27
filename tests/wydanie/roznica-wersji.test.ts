// KO-203, P-1040: skrypt scripts/wydanie/roznica-wersji.mjs uznaje za zgodną tylko różnicę w polach wersji (+ test wersji i docs/wydanie/);
// każda inna zmiana kodu albo konfiguracji daje kod 1. Test na tymczasowym repozytorium git (bez sieci).
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const SKRYPT = join(__dirname, '..', '..', 'scripts', 'wydanie', 'roznica-wersji.mjs');
const git = (k: string, ...a: string[]) => {
  const w = spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...a], { cwd: k, encoding: 'utf8' });
  if (w.status !== 0) throw new Error(`git ${a.join(' ')}: ${w.stderr}`);
};
const zapisz = (k: string, p: string, tresc: string) => { mkdirSync(dirname(join(k, p)), { recursive: true }); writeFileSync(join(k, p), tresc); };
const json = (o: unknown) => JSON.stringify(o, null, 2) + '\n';
const pliki = (v: string) => ({
  'app.json': json({ expo: { name: 'Oczko', version: v, ios: { buildNumber: '1' } } }),
  'package.json': json({ name: 'oczko', version: v, dependencies: { a: '1.0.0' } }),
  'package-lock.json': json({ name: 'oczko', version: v, packages: { '': { name: 'oczko', version: v, dependencies: { a: '1.0.0' } }, 'node_modules/a': { version: '1.0.0' } } }),
  'tests/jakosc/wersja-wydania.test.ts': `// ${v}\n`,
  'src/kod.ts': 'export const x = 1;\n',
});

function przygotuj(zmiana: (k: string) => void): { status: number | null; wyjscie: string } {
  const k = mkdtempSync(join(tmpdir(), 'oczko-roznica-'));
  git(k, 'init', '-q');
  for (const [p, t] of Object.entries(pliki('1.0.0'))) zapisz(k, p, t);
  git(k, 'add', '-A');
  git(k, 'commit', '-q', '-m', 'baza');
  for (const [p, t] of Object.entries(pliki('1.0.1'))) zapisz(k, p, t);
  zmiana(k);
  git(k, 'add', '-A');
  git(k, 'commit', '-q', '-m', 'wersja');
  const w = spawnSync('node', [SKRYPT, '--baza', 'HEAD~1'], { cwd: k, encoding: 'utf8' });
  return { status: w.status, wyjscie: w.stdout + w.stderr };
}

describe('roznica-wersji.mjs (WY1, KO-203)', () => {
  test('same pola wersji + dokument wydania → kod 0', () => {
    const w = przygotuj((k) => { zapisz(k, 'docs/wydanie/1-0-1-roznica.md', 'x\n'); zapisz(k, 'docs/jakosc/test-fizyczny/1221.md', 'p\n'); });
    expect(w.wyjscie).toMatch(/OK — różnica/);
    expect(w.status).toBe(0);
  });
  test('zmiana pliku źródłowego → kod 1', () => {
    const w = przygotuj((k) => zapisz(k, 'src/kod.ts', 'export const x = 2;\n'));
    expect(w.status).toBe(1);
    expect(w.wyjscie).toMatch(/src\/kod\.ts: zmiana poza polami wersji/);
  });
  test('zmiana zależności w package.json → kod 1', () => {
    const w = przygotuj((k) => zapisz(k, 'package.json', json({ name: 'oczko', version: '1.0.1', dependencies: { a: '1.0.1' } })));
    expect(w.status).toBe(1);
    expect(w.wyjscie).toMatch(/package\.json: różnica wykracza poza pola wersji/);
  });
  test('zmiana buildNumber w app.json → kod 1', () => {
    const w = przygotuj((k) => zapisz(k, 'app.json', json({ expo: { name: 'Oczko', version: '1.0.1', ios: { buildNumber: '2' } } })));
    expect(w.status).toBe(1);
    expect(w.wyjscie).toMatch(/app\.json: różnica wykracza poza pola wersji/);
  });
  test('wersja inna niż docelowa w jednym z plików → kod 1', () => {
    const w = przygotuj((k) => zapisz(k, 'package.json', json({ name: 'oczko', version: '1.0.2', dependencies: { a: '1.0.0' } })));
    expect(w.status).toBe(1);
    expect(w.wyjscie).toMatch(/package\.json: version = "1\.0\.2", oczekiwano "1\.0\.1"/);
  });
});
