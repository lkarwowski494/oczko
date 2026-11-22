// M1-245 (P-661, fix11): generator danych ekranu „Open source licenses” (scripts/jakosc/licencje-generuj.mjs → src/domena/licencje.generated.ts).
// Kryteria 3 (część kontrolna) i 4: kontrola `--check` (jakosc:kontrole) jest czerwona,
// gdy package-lock.json i lista się różnią, gdy brak pliku licencji kroju albo gdy krój z app.json nie ma wpisu; reguła zawijania akapitów. Dane modułu wygenerowanego: tests/domena/licencje-dane.test.ts.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const KORZEN = join(__dirname, '../..');
const GENERATOR = join(KORZEN, 'scripts/jakosc/licencje-generuj.mjs');
const normalizuj = (s: string) => s.replace(/\s+/g, ' ').trim();
const uruchom = (...args: string[]) => spawnSync(process.execPath, [GENERATOR, ...args], { encoding: 'utf8' });

describe('zawijanie akapitów treści licencji (różnica (2) wobec Treningu, kryterium 4)', () => {
  const zawin = (tekst: string): string => {
    const r = spawnSync(process.execPath, ['--input-type=module', '-e',
      `const { zawin } = await import(${JSON.stringify(GENERATOR)}); process.stdout.write(JSON.stringify(zawin(${JSON.stringify(tekst)})));`], { encoding: 'utf8' });
    return JSON.parse(r.stdout) as string;
  };
  test('pojedyncze złamanie → spacja; puste linie, wersaliki, punkty „1)” i dywizy bez zmian', () => {
    expect(zawin('a\nb\n\nPREAMBLE\nc\n1) d\n---')).toBe('a b\n\nPREAMBLE\nc\n1) d\n---');
  });
  test('tekst poza białymi znakami bez zmian: pełna licencja OFL po zawinięciu = plik po normalizacji', () => {
    const ofl = readFileSync(join(KORZEN, 'assets/fonts/breeserif-OFL.txt'), 'utf8');
    expect(normalizuj(zawin(ofl))).toBe(normalizuj(ofl));
  });
});

describe('kontrola --check (jakosc:kontrole)', () => {
  let tmp: string;
  const przygotuj = () => {
    tmp = mkdtempSync(join(tmpdir(), 'licencje-'));
    for (const p of ['package-lock.json', 'app.json', 'scripts/jakosc/licencje-natywne.json', 'scripts/jakosc/licencje-natywne', 'assets/fonts', 'src/domena/licencje.generated.ts']) {
      mkdirSync(join(tmp, p, '..'), { recursive: true });
      cpSync(join(KORZEN, p), join(tmp, p), { recursive: true });
    }
    symlinkSync(join(KORZEN, 'node_modules'), join(tmp, 'node_modules'));
  };
  afterEach(() => { if (tmp) rmSync(tmp, { recursive: true, force: true }); });

  test('repo: zgodne, kod 0', () => {
    const r = uruchom('--check');
    expect({ kod: r.status, wyj: r.stdout }).toEqual({ kod: 0, wyj: expect.stringContaining('licencje-generuj: OK') });
  });
  test('kopia repo bez zmian: kod 0 (kontrola nie jest czerwona sama z siebie)', () => {
    przygotuj();
    expect(uruchom('--check', '--katalog', tmp).status).toBe(0);
  });
  test('package-lock.json i lista się różnią (inna wersja pakietu) → kod 1', () => {
    przygotuj();
    const lock = JSON.parse(readFileSync(join(tmp, 'package-lock.json'), 'utf8')) as { packages: Record<string, { version?: string }> };
    lock.packages['node_modules/react'] = { ...lock.packages['node_modules/react'], version: '0.0.1' };
    writeFileSync(join(tmp, 'package-lock.json'), JSON.stringify(lock));
    const r = uruchom('--check', '--katalog', tmp);
    expect({ kod: r.status, wyj: r.stdout }).toEqual({ kod: 1, wyj: expect.stringContaining('nie zgadza się z package-lock.json') });
  });
  test('brak pliku licencji kroju → kod 1 z nazwą kroju', () => {
    przygotuj();
    rmSync(join(tmp, 'assets/fonts/breeserif-OFL.txt'));
    const r = uruchom('--check', '--katalog', tmp);
    expect({ kod: r.status, wyj: r.stdout }).toEqual({ kod: 1, wyj: expect.stringContaining('Bree Serif: brak pliku licencji kroju') });
  });
  test('krój dołączony wtyczką expo-font bez wpisu na liście → kod 1', () => {
    przygotuj();
    const app = readFileSync(join(tmp, 'app.json'), 'utf8').replace('./assets/fonts/BreeSerif.ttf', './assets/fonts/Inny.ttf');
    writeFileSync(join(tmp, 'app.json'), app);
    const r = uruchom('--check', '--katalog', tmp);
    expect({ kod: r.status, wyj: r.stdout }).toEqual({ kod: 1, wyj: expect.stringContaining('krój assets/fonts/Inny.ttf bez wpisu') });
  });
  test('wersja biblioteki natywnej różna od podspec React Native → kod 1', () => {
    przygotuj();
    const plik = join(tmp, 'scripts/jakosc/licencje-natywne.json');
    writeFileSync(plik, readFileSync(plik, 'utf8').replace('"version": "12.1.0"', '"version": "1.0.0"'));
    expect(existsSync(plik)).toBe(true);
    const r = uruchom('--check', '--katalog', tmp);
    expect({ kod: r.status, wyj: r.stdout }).toEqual({ kod: 1, wyj: expect.stringContaining('fmt: lista 1.0.0, podspec 12.1.0') });
  });
});
