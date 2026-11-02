// P-357 (wariant A, P-320): lista „oczekujące na falę przekładu” przy bramce i18n — wzór Treningu (scripts/check-i18n.mjs:79-81, pismo-wyjatki.json).
// Lista nie może się zestarzeć: klucz z listy już przetłumaczony = błąd; brak przekładu spoza listy = błąd; w buildzie wydania lista musi być pusta.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const KORZEN = join(__dirname, '..', '..');
const skrypt = join(KORZEN, 'scripts', 'sprawdz-i18n.mjs');
const uruchom = (args: string[], cwd: string) => {
  const r = spawnSync(process.execPath, [skrypt, ...args], { cwd, encoding: 'utf8' });
  return { kod: r.status, wyjscie: r.stdout + r.stderr };
};
const projekt = (slowniki: Record<string, unknown>, oczekujace: unknown) => {
  const d = mkdtempSync(join(tmpdir(), 'i18n-ocz-'));
  mkdirSync(join(d, 'locales'));
  for (const [j, s] of Object.entries(slowniki)) writeFileSync(join(d, 'locales', `${j}.json`), JSON.stringify(s));
  writeFileSync(join(d, 'oczekujace.json'), JSON.stringify(oczekujace));
  // DEC-11 a (M1-audytor-generalny-008): --wydanie wymaga mapy treści krytycznej i stanu kontroli; tu puste (bez kluczy krytycznych).
  writeFileSync(join(d, 'krytyczne.json'), JSON.stringify({ krytyczne_id: [], klucze: {} }));
  writeFileSync(join(d, 'przeglad.json'), JSON.stringify({ jezyki: {} }));
  return d;
};
const lista = (klucze: string[]) => ({ powod: 'test', odwolania: ['P-320', 'P-357'], klucze });
const EN = { a: { b: 'Hello', c: 'Bye {{x}}' } };
const PL_BEZ_C = { a: { b: 'Cześć' } };
const ARGS = ['locales', '--zrodlo', 'en', '--oczekujace', 'oczekujace.json'];
const WYDANIE = [...ARGS, '--krytyczne', 'krytyczne.json', '--przeglad', 'przeglad.json', '--wydanie'];

describe('lista oczekujących na falę przekładu (sprawdz-i18n.mjs --oczekujace)', () => {
  it('brak przekładu spoza listy: błąd, kod 1', () => {
    const r = uruchom(ARGS, projekt({ en: EN, pl: PL_BEZ_C }, lista([])));
    expect(r.wyjscie).toMatch(/BŁĄD pl a\.c: brak tłumaczenia/);
    expect(r.kod).toBe(1);
  });
  it('brak przekładu klucza z listy: uwaga, nie błąd, kod 0', () => {
    const r = uruchom(ARGS, projekt({ en: EN, pl: PL_BEZ_C }, lista(['a.c'])));
    expect(r.wyjscie).toMatch(/UWAGA pl a\.c: brak tłumaczenia/);
    expect(r.wyjscie).not.toMatch(/BŁĄD/);
    expect(r.kod).toBe(0);
  });
  it('klucz z listy już przetłumaczony: błąd (lista się zestarzała), kod 1', () => {
    const r = uruchom(ARGS, projekt({ en: EN, pl: { a: { b: 'Cześć', c: 'Pa {{x}}' } } }, lista(['a.c'])));
    expect(r.wyjscie).toMatch(/BŁĄD pl a\.c: .*już przetłumaczony/);
    expect(r.kod).toBe(1);
  });
  it('klucz z listy, którego nie ma w źródle: błąd, kod 1', () => {
    const r = uruchom(ARGS, projekt({ en: EN, pl: { a: { b: 'Cześć', c: 'Pa {{x}}' } } }, lista(['a.nie_ma'])));
    expect(r.wyjscie).toMatch(/BŁĄD oczekujace: klucza a\.nie_ma nie ma w źródle/);
    expect(r.kod).toBe(1);
  });
  it('zmienne {{…}} w przekładzie różne od źródła: błąd także dla klucza z listy (stary przekład nie zostaje)', () => {
    const r = uruchom(ARGS, projekt({ en: EN, pl: { a: { b: 'Cześć', c: 'Pa {{y}}' } } }, lista(['a.c'])));
    expect(r.wyjscie).toMatch(/BŁĄD pl a\.c: parametry \[\{\{y\}\}\] ≠ źródło \[\{\{x\}\}\]/);
    expect(r.kod).toBe(1);
  });
  it('--wydanie: niepusta lista = błąd (fala przekładu przed wydaniem), kod 1', () => {
    const r = uruchom(WYDANIE, projekt({ en: EN, pl: PL_BEZ_C }, lista(['a.c'])));
    expect(r.wyjscie).toMatch(/BŁĄD wydanie: oczekujace\.json niepusta \(1 kluczy\)/);
    expect(r.kod).toBe(1);
  });
  it('--wydanie: pusta lista i komplet przekładów = kod 0', () => {
    const r = uruchom(WYDANIE, projekt({ en: EN, pl: { a: { b: 'Cześć', c: 'Pa {{x}}' } } }, lista([])));
    expect(r.kod).toBe(0);
  });
});

describe('docs/lokalizacja/oczekujace.json w repo', () => {
  const plik = join(KORZEN, 'docs/lokalizacja/oczekujace.json');
  const wczytaj = () => JSON.parse(readFileSync(plik, 'utf8')) as { powod: string; odwolania: string[]; klucze: string[] };

  it('ma powód i odwołania do P-320 i P-357; klucze bez powtórzeń, posortowane', () => {
    const l = wczytaj();
    expect(l.powod.length).toBeGreaterThan(20);
    expect(l.odwolania).toEqual(expect.arrayContaining(['P-320', 'P-357']));
    expect(l.klucze.length).toBeGreaterThan(0);
    expect([...new Set(l.klucze)].sort()).toEqual(l.klucze);
  });
  it('lista = dokładnie różnica en ↔ słowniki: bramka i18n na repo kończy się kodem 0', () => {
    const r = spawnSync(process.execPath, [skrypt, 'src/i18n/slowniki', '--zrodlo', 'en', '--oczekujace', 'docs/lokalizacja/oczekujace.json'], { cwd: KORZEN, encoding: 'utf8' });
    expect(r.stdout.split('\n').filter((w) => w.startsWith('BŁĄD'))).toEqual([]);
    expect(r.status).toBe(0);
  });
  it('żaden słownik nie ma przekładu klucza z listy (stare przekłady z innymi zmiennymi usunięte)', () => {
    const l = wczytaj();
    const dir = join(KORZEN, 'src/i18n/slowniki');
    for (const f of readdirSync(dir).filter((n) => /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*\.json$/.test(n) && n !== 'en.json')) {
      const plaski: Record<string, unknown> = {};
      const splaszcz = (o: Record<string, unknown>, p = ''): void => { for (const [k, v] of Object.entries(o)) v && typeof v === 'object' ? splaszcz(v as Record<string, unknown>, `${p}${k}.`) : (plaski[p + k] = v); };
      splaszcz(JSON.parse(readFileSync(join(dir, f), 'utf8')));
      const bazy = new Set(Object.keys(plaski).map((k) => k.replace(/_(zero|one|two|few|many|other)$/, '')));
      expect(l.klucze.filter((k) => bazy.has(k))).toEqual([]);
    }
  });
  it('kontrola-ipa.sh woła bramkę i18n z --wydanie jako BŁĄD wydania', () => {
    const sh = readFileSync(join(KORZEN, 'scripts/wydanie/kontrola-ipa.sh'), 'utf8');
    expect(sh).toMatch(/node scripts\/sprawdz-i18n\.mjs src\/i18n\/slowniki --zrodlo en --oczekujace docs\/lokalizacja\/oczekujace\.json --krytyczne docs\/lokalizacja\/krytyczne\.json --przeglad docs\/lokalizacja\/przeglad-krytyczne\.json --wydanie \|\| bledy=\$\(\(bledy \+ 1\)\)/);
  });
  it('skrypty npm i18n, i18n:kod, i18n:pseudo przekazują --oczekujace', () => {
    const s = (JSON.parse(readFileSync(join(KORZEN, 'package.json'), 'utf8')) as { scripts: Record<string, string> }).scripts;
    for (const n of ['i18n', 'i18n:kod', 'i18n:pseudo']) expect(s[n]).toContain('--oczekujace docs/lokalizacja/oczekujace.json');
  });
});
