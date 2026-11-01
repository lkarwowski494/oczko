/* 07-jakosc-003 (JAK-03): inwentarz kryteriów musi obejmować każdy scenariusz z BRD. `linie-kryteriow.mjs --check` pilnuje numerów linii,
 * a `kompletnosc-kryteriow.mjs` kompletności i pokrycia wpisów uzupełnienia (ID w teście, poziom BR albo poza zakresem). */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawnSync } from 'child_process';

const KORZEN = join(__dirname, '..', '..');
const NARZEDZIE = join(KORZEN, 'docs/jakosc/narzedzia/kompletnosc-kryteriow.mjs');
const uruchom = (korzen: string) => spawnSync('node', [NARZEDZIE, '--korzen', korzen], { encoding: 'utf8' });

function kopia(zmien: (u: { id: string; pokrycie: { typ: string; pliki?: string[] } }[]) => unknown): string {
  const d = mkdtempSync(join(tmpdir(), 'kompletnosc-'));
  cpSync(join(KORZEN, 'docs/brd'), join(d, 'docs/brd'), { recursive: true });
  mkdirSync(join(d, 'docs/jakosc/e0'), { recursive: true });
  cpSync(join(KORZEN, 'docs/jakosc/e0/kryteria.json'), join(d, 'docs/jakosc/e0/kryteria.json'));
  const u = JSON.parse(readFileSync(join(KORZEN, 'docs/jakosc/e0/kryteria-uzupelnienie.json'), 'utf8'));
  writeFileSync(join(d, 'docs/jakosc/e0/kryteria-uzupelnienie.json'), JSON.stringify(zmien(u)));
  return d;
}

describe('kompletność inwentarza kryteriów względem BRD (07-jakosc-003)', () => {
  test('repo: każdy scenariusz BRD ma wpis, a pokrycie wpisów uzupełnienia jest prawdziwe', () => {
    const r = uruchom(KORZEN);
    expect(r.stdout).toMatch(/scenariusze BRD: \d+, inwentarz: 220 \+ uzupełnienie: 86, błędów: 0/);
    expect(r.status).toBe(0);
  });
  test('scenariusz BRD bez wpisu → kod 1', () => {
    const r = uruchom(kopia((u) => u.slice(1)));
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('scenariusz BRD bez wpisu w inwentarzu');
  });
  test('wpis z plikiem testu, w którym nie ma ID → kod 1', () => {
    const d = kopia((u) => u.map((k, i) => (i === 0 ? { ...k, pokrycie: { typ: 'poziom-br', pliki: ['tests/nie-ma.test.ts'] } } : k)));
    const r = uruchom(d);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('brak pliku tests/nie-ma.test.ts');
    expect(existsSync(join(d, 'tests'))).toBe(false);
  });
});
