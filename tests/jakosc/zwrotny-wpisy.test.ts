// Porównanie przekładu zwrotnego z kluczem źródłowym i wpis kontroli (a) (P-498): scripts/i18n/zwrotny-porownaj.mjs (kontrole maszynowe + zestawienie do czytania)
// oraz scripts/i18n/zwrotny-wpisz.mjs (wpis `a` do przeglad-krytyczne.json; tylko dla przekładu zgodnego ze skrótem bieżącego tekstu). Bez sieci, na katalogu tymczasowym.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = join(__dirname, '../..');
const POROWNAJ = join(ROOT, 'scripts/i18n/zwrotny-porownaj.mjs');
const WPISZ = join(ROOT, 'scripts/i18n/zwrotny-wpisz.mjs');
const skrot = (v: string | Record<string, string>) => createHash('sha256').update(typeof v === 'string' ? v : Object.keys(v).sort().map((k) => `${k}=${v[k]}`).join('\n')).digest('hex').slice(0, 12);

const EN = { a: { b: 'Block your swatch, 4 in = 10.16 cm {{n}}.', n_one: '{{count}} stitch', n_other: '{{count}} stitches' } };
const DE = { a: { b: 'Spannprobe blocken, 4 in = 10,16 cm {{n}}.', n_one: '{{count}} Masche', n_other: '{{count}} Maschen' } };
const DE_N = { one: DE.a.n_one, other: DE.a.n_other };
const MAPA = { krytyczne_id: ['PRB-002'], klucze: { 'a.b': { twierdzenia: ['PRB-002'], sha_en: 'x' }, 'a.n': { twierdzenia: ['PRB-002'], sha_en: 'y' } } };

const projekt = (raport: unknown, de: unknown = DE) => {
  const d = mkdtempSync(join(tmpdir(), 'zwr-wpisy-'));
  mkdirSync(join(d, 'sl')); mkdirSync(join(d, 'rap'));
  writeFileSync(join(d, 'sl/en.json'), JSON.stringify(EN)); writeFileSync(join(d, 'sl/de.json'), JSON.stringify(de));
  writeFileSync(join(d, 'krytyczne.json'), JSON.stringify(MAPA)); writeFileSync(join(d, 'przeglad.json'), JSON.stringify({ opis: 'x', jezyki: {} }));
  writeFileSync(join(d, 'rap/de.json'), JSON.stringify(raport));
  return d;
};
const RAPORT = (pl: unknown = { b: 'Zblokuj próbkę, 4 cale = 10,16 cm {{n}}.', n: { one: '{{count}} oczko', other: '{{count}} oczek' } }, sha = { b: skrot(DE.a.b), n: skrot(DE_N) }) => {
  const p = pl as { b: string | null; n: Record<string, string> | null };
  return { jezyk: 'de', pozycji: 2, blad: null, odrzucone: [], przeklady: [
    { klucz: 'a.b', tekst_jezyka: DE.a.b, sha: sha.b, pl: p.b }, { klucz: 'a.n', tekst_jezyka: DE_N, sha: sha.n, pl: p.n }] };
};
const uruchom = (skrypt: string, d: string, extra: string[] = []) => {
  const r = spawnSync(process.execPath, [skrypt, join(d, 'rap'), '--slowniki', join(d, 'sl'), '--krytyczne', join(d, 'krytyczne.json'), '--przeglad', join(d, 'przeglad.json'), ...extra], { encoding: 'utf8', cwd: ROOT });
  return { kod: r.status, wyjscie: r.stdout + r.stderr };
};
const stan = (d: string) => JSON.parse(readFileSync(join(d, 'przeglad.json'), 'utf8'));

describe('zwrotny-porownaj: zestawienie i kontrole maszynowe', () => {
  it('pokazuje en klucza i przekład zwrotny języka; zgodne parametry i liczby bez flag', () => {
    const r = uruchom(POROWNAJ, projekt(RAPORT()));
    expect(r.kod).toBe(0); expect(r.wyjscie).toContain('a.b'); expect(r.wyjscie).toContain('Block your swatch'); expect(r.wyjscie).toContain('Zblokuj próbkę');
    expect(r.wyjscie).not.toMatch(/FLAGA/);
  });
  it('flaga PARAMETRY, gdy przekład zwrotny zmienia {{parametr}}; flaga LICZBY, gdy zmienia liczbę (10,16 ≡ 10.16)', () => {
    const r = uruchom(POROWNAJ, projekt(RAPORT({ b: 'Zblokuj próbkę, 4 cale = 10,5 cm {{x}}.', n: { one: '{{count}} oczko', other: '{{count}} oczek' } })));
    expect(r.wyjscie).toMatch(/FLAGA de a\.b: PARAMETRY/); expect(r.wyjscie).toMatch(/FLAGA de a\.b: LICZBY/); expect(r.wyjscie).not.toMatch(/FLAGA de a\.n/);
  });
  it('flaga PARAMETRY-JEZYKA, gdy sam tekst języka ma inne parametry niż en; flaga BRAK, gdy pozycja bez przekładu; flaga SHA, gdy tekst zmieniony po przebiegu', () => {
    const zle = { a: { ...DE.a, b: 'Spannprobe blocken, 4 in = 10,16 cm.' } };
    const r1 = uruchom(POROWNAJ, projekt(RAPORT(undefined, { b: skrot(zle.a.b), n: skrot(DE_N) }), zle));
    expect(r1.wyjscie).toMatch(/FLAGA de a\.b: PARAMETRY-JEZYKA/);
    const r2 = uruchom(POROWNAJ, projekt(RAPORT({ b: null, n: { one: 'a', other: 'b' } })));
    expect(r2.wyjscie).toMatch(/FLAGA de a\.b: BRAK/);
    const r3 = uruchom(POROWNAJ, projekt(RAPORT(), { a: { ...DE.a, b: DE.a.b + ' ' } }));
    expect(r3.wyjscie).toMatch(/FLAGA de a\.b: SHA/);
  });
});

describe('zwrotny-wpisz: wpis kontroli (a)', () => {
  const ARG = ['--kto', 'rola 06: przekład zwrotny Opus 5.5 (run 1) + porównanie 06', '--data', '2026-11-03', '--rozbiezne', '[]'];
  it('wszystkie pozycje poza rozbieżnymi dostają wpis zgodny ze skrótem tekstu; po wpisie bramka --wydanie dla de nie ma błędu (a)', () => {
    const d = projekt(RAPORT()); const r = uruchom(WPISZ, d, ARG);
    expect(r.kod).toBe(0);
    const a = stan(d).jezyki.de['a.b'].a;
    expect(a).toEqual({ kto: ARG[1], data: '2026-11-03', metoda: 'przeklad-zwrotny-pl', wynik: 'zgodny', sha: skrot(DE.a.b) });
    expect(stan(d).jezyki.de['a.n'].a.sha).toBe(skrot(DE_N));
    const g = spawnSync(process.execPath, [join(ROOT, 'scripts/sprawdz-i18n.mjs'), join(d, 'sl'), '--zrodlo', 'en', '--krytyczne', join(d, 'krytyczne.json'), '--przeglad', join(d, 'przeglad.json'), '--wydanie'], { encoding: 'utf8', cwd: ROOT });
    expect(g.stdout).not.toMatch(/BŁĄD de: kontrola \(a\)/);
  });
  it('lista rozbieżnych: „język:klucz” dostaje wynik rozbieżny (bramka go odrzuci), reszta zgodny', () => {
    const d = projekt(RAPORT()); const r = uruchom(WPISZ, d, ['--kto', 'x', '--data', '2026-11-03', '--rozbiezne', '["de:a.n"]']);
    expect(r.kod).toBe(0); expect(stan(d).jezyki.de['a.n'].a.wynik).toBe('rozbieżny'); expect(stan(d).jezyki.de['a.b'].a.wynik).toBe('zgodny');
  });
  it('pozycja bez przekładu, ze zmienionym tekstem (sha) albo z błędem języka nie dostaje wpisu; kod 1 i komunikat', () => {
    const d = projekt(RAPORT({ b: null, n: { one: 'a', other: 'b' } }), { a: { ...DE.a, n_other: '{{count}} Maschen!' } });
    const r = uruchom(WPISZ, d, ARG);
    expect(r.kod).toBe(1); expect(r.wyjscie).toMatch(/de a\.b: pominięto — brak przekładu zwrotnego/); expect(r.wyjscie).toMatch(/de a\.n: pominięto — tekst zmieniony po przebiegu/);
    expect(stan(d).jezyki.de ?? {}).toEqual({});
  });
  it('wymaga --kto, --data (RRRR-MM-DD) i jawnego --rozbiezne (kod 2): wpis nie powstaje „z góry”; nie rusza istniejących wpisów innych języków', () => {
    const d = projekt(RAPORT());
    expect(uruchom(WPISZ, d, ['--kto', 'x', '--data', '2026-11-03']).kod).toBe(2);
    expect(uruchom(WPISZ, d, ['--kto', 'x', '--data', '3.11', '--rozbiezne', '[]']).kod).toBe(2);
    writeFileSync(join(d, 'przeglad.json'), JSON.stringify({ opis: 'x', jezyki: { pl: { 'a.b': { a: { kto: 'k', data: '2026-11-03', metoda: 'akceptacja-wlasciciela-pl', wynik: 'zgodny', sha: 's' } } } } }));
    expect(uruchom(WPISZ, d, ARG).kod).toBe(0);
    expect(stan(d).jezyki.pl['a.b'].a.sha).toBe('s'); expect(stan(d).opis).toBe('x');
  });
});
