// M1-audytor-generalny-008 / 09-lokalizacja-003 (DEC-11 a, 2026-11-02): bramka treści krytycznej w językach.
// 06 oznacza klucze krytyczne ID twierdzeń (docs/lokalizacja/krytyczne.json), 09 prowadzi stan kontroli (a) na język
// (docs/lokalizacja/przeglad-krytyczne.json), `sprawdz-i18n --wydanie` traktuje brak (a) jako błąd (kod 1).
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const KORZEN = join(__dirname, '..', '..');
const skrypt = join(KORZEN, 'scripts', 'sprawdz-i18n.mjs');
const uruchom = (args: string[], cwd: string) => {
  const r = spawnSync(process.execPath, [skrypt, ...args], { cwd, encoding: 'utf8' });
  return { kod: r.status, wyjscie: r.stdout + r.stderr };
};
// Skrót tekstu klucza: sha256 (12 znaków) z tekstu albo z linii „kategoria=tekst” posortowanych po kategorii (formy liczby mnogiej).
const skrot = (v: string | Record<string, string>) =>
  createHash('sha256').update(typeof v === 'string' ? v : Object.keys(v).sort().map((k) => `${k}=${v[k]}`).join('\n')).digest('hex').slice(0, 12);

const EN = { a: { b: 'Block your swatch first.', n_one: '{{count}} stitch', n_other: '{{count}} stitches', inny: 'Hello' } };
const PL = { a: { b: 'Najpierw zblokuj próbkę.', n_one: '{{count}} oczko', n_few: '{{count}} oczka', n_many: '{{count}} oczek', n_other: '{{count}} oczka', inny: 'Cześć' } };
// Formy liczby mnogiej klucza a.n po kategoriach CLDR (tak skrót liczy skrypt: „kategoria=tekst”).
const PL_N = { one: PL.a.n_one, few: PL.a.n_few, many: PL.a.n_many, other: PL.a.n_other };
const EN_N = { one: EN.a.n_one, other: EN.a.n_other };
const MAPA = { krytyczne_id: ['PRB-002', 'GRB-Z1'], klucze: { 'a.b': { twierdzenia: ['PRB-002'], sha_en: skrot(EN.a.b) }, 'a.n': { twierdzenia: ['GRB-Z1'], sha_en: skrot(EN_N) } } };
const wpisA = (sha: string, wynik = 'zgodny') => ({ a: { kto: 'sesja 09, świeży kontekst', data: '2026-11-03', metoda: 'przeklad-zwrotny-pl', wynik, sha } });
const PRZEGLAD_PL = { jezyki: { pl: { 'a.b': wpisA(skrot(PL.a.b)), 'a.n': wpisA(skrot(PL_N)) } } };

const projekt = (mapa: unknown, przeglad: unknown, slowniki: Record<string, unknown> = { en: EN, pl: PL }) => {
  const d = mkdtempSync(join(tmpdir(), 'i18n-kryt-'));
  mkdirSync(join(d, 'locales'));
  for (const [j, s] of Object.entries(slowniki)) writeFileSync(join(d, 'locales', `${j}.json`), JSON.stringify(s));
  writeFileSync(join(d, 'krytyczne.json'), JSON.stringify(mapa));
  writeFileSync(join(d, 'przeglad.json'), JSON.stringify(przeglad));
  writeFileSync(join(d, 'package.json'), '{}');
  return d;
};
const ARGS = ['locales', '--zrodlo', 'en', '--krytyczne', 'krytyczne.json', '--przeglad', 'przeglad.json'];

describe('sprawdz-i18n.mjs: treść krytyczna (DEC-11 a)', () => {
  it('--wydanie: klucz krytyczny bez wpisu (a) w języku = błąd z nazwą języka i klucza, kod 1', () => {
    const r = uruchom([...ARGS, '--wydanie'], projekt(MAPA, { jezyki: {} }));
    expect(r.wyjscie).toMatch(/BŁĄD pl: kontrola \(a\) treści krytycznej — brak wpisu dla a\.b, a\.n/);
    expect(r.kod).toBe(1);
  });
  it('--wydanie: wpisy (a) zgodne ze skrótem tekstu = kod 0', () => {
    const r = uruchom([...ARGS, '--wydanie'], projekt(MAPA, PRZEGLAD_PL));
    expect(r.wyjscie).toMatch(/błędy: 0/);
    expect(r.kod).toBe(0);
  });
  it('--wydanie: wpis tylko dla części kluczy = błąd dla brakującego, kod 1', () => {
    const r = uruchom([...ARGS, '--wydanie'], projekt(MAPA, { jezyki: { pl: { 'a.b': wpisA(skrot(PL.a.b)) } } }));
    expect(r.wyjscie).toMatch(/BŁĄD pl: kontrola \(a\) treści krytycznej — brak wpisu dla a\.n/);
    expect(r.wyjscie).not.toMatch(/brak wpisu dla a\.b/);
    expect(r.kod).toBe(1);
  });
  it('--wydanie: tekst zmieniony po kontroli (skrót się nie zgadza) = wpis nieaktualny, kod 1', () => {
    const zmieniony = { a: { ...PL.a, b: 'Najpierw zblokuj swoją próbkę.' } };
    const r = uruchom([...ARGS, '--wydanie'], projekt(MAPA, PRZEGLAD_PL, { en: EN, pl: zmieniony }));
    expect(r.wyjscie).toMatch(/BŁĄD pl: kontrola \(a\) treści krytycznej — wpis nieaktualny \(tekst zmieniony po kontroli\) dla a\.b/);
    expect(r.kod).toBe(1);
  });
  it('--wydanie: wynik kontroli „rozbieżny” nie jest kontrolą (a), kod 1', () => {
    const r = uruchom([...ARGS, '--wydanie'], projekt(MAPA, { jezyki: { pl: { 'a.b': wpisA(skrot(PL.a.b), 'rozbieżny'), 'a.n': wpisA(skrot(PL_N)) } } }));
    expect(r.wyjscie).toMatch(/BŁĄD pl: kontrola \(a\) treści krytycznej — wynik niezgodny dla a\.b/);
    expect(r.kod).toBe(1);
  });
  it('P-498: pl może mieć kontrolę (a) metodą akceptacja-wlasciciela-pl (P-473) = kod 0; ta sama metoda w innym języku = błąd, kod 1', () => {
    const wpisPl = (sha: string) => ({ a: { kto: 'właściciel (P-473) + porównanie 06', data: '2026-11-03', metoda: 'akceptacja-wlasciciela-pl', wynik: 'zgodny', sha } });
    const pl = { jezyki: { pl: { 'a.b': wpisPl(skrot(PL.a.b)), 'a.n': wpisPl(skrot(PL_N)) } } };
    const ok = uruchom([...ARGS, '--wydanie'], projekt(MAPA, pl));
    expect(ok.wyjscie).toMatch(/błędy: 0/); expect(ok.kod).toBe(0);
    const DE = { a: { b: 'Zuerst blocken.', n_one: '{{count}} Masche', n_other: '{{count}} Maschen', inny: 'Hallo' } };
    const de = { a: { b: wpisPl(skrot(DE.a.b)), n: wpisPl(skrot({ one: DE.a.n_one, other: DE.a.n_other })) } };
    const zle = uruchom([...ARGS, '--wydanie'], projekt(MAPA, { jezyki: { pl: pl.jezyki.pl, de: { 'a.b': de.a.b, 'a.n': de.a.n } } }, { en: EN, pl: PL, de: DE }));
    expect(zle.wyjscie).toMatch(/BŁĄD przeglad: de a\.b — metoda „akceptacja-wlasciciela-pl” tylko dla pl/);
    expect(zle.kod).toBe(1);
  });
  it('wpis (a) z metodą spoza listy (np. „na-slowo”) = błąd, kod 1', () => {
    const w = { a: { kto: 'x', data: '2026-11-03', metoda: 'na-slowo', wynik: 'zgodny', sha: skrot(PL.a.b) } };
    const r = uruchom(ARGS, projekt(MAPA, { jezyki: { pl: { 'a.b': w } } }));
    expect(r.wyjscie).toMatch(/BŁĄD przeglad: pl a\.b — metoda „na-slowo” spoza przeklad-zwrotny-pl, akceptacja-wlasciciela-pl/);
    expect(r.kod).toBe(1);
  });
  it('--wydanie: źródło (en) nie wymaga kontroli (a), a każdy inny język tak', () => {
    const r = uruchom([...ARGS, '--wydanie'], projekt(MAPA, PRZEGLAD_PL, { en: EN, pl: PL, de: { a: { b: 'Zuerst blocken.', n_one: '{{count}} Masche', n_other: '{{count}} Maschen', inny: 'Hallo' } } }));
    expect(r.wyjscie).toMatch(/BŁĄD de: kontrola \(a\)/);
    expect(r.wyjscie).not.toMatch(/BŁĄD en: kontrola/);
    expect(r.wyjscie).not.toMatch(/BŁĄD pl: kontrola/);
    expect(r.kod).toBe(1);
  });
  it('--wydanie: nakładka regionalna bez własnego klucza dziedziczy tekst języka bazowego (bez dodatkowego wpisu)', () => {
    const r = uruchom([...ARGS, '--wydanie'], projekt(MAPA, PRZEGLAD_PL, { en: EN, pl: PL, 'pl-PL': { a: { inny: 'Cześć!' } } }));
    expect(r.wyjscie).not.toMatch(/pl-PL: kontrola/);
    expect(r.kod).toBe(0);
  });
  it('tryb zwykły (bez --wydanie): brak wpisów (a) to uwaga z liczbą, nie błąd, kod 0', () => {
    const r = uruchom(ARGS, projekt(MAPA, { jezyki: {} }));
    expect(r.wyjscie).toMatch(/UWAGA kontrola \(a\) treści krytycznej: 2 z 2 par język × klucz bez ważnego wpisu/);
    expect(r.kod).toBe(0);
  });
  it('mapa wskazuje klucz, którego nie ma w źródle = błąd konfiguracji mapy, kod 1 także poza --wydanie', () => {
    const r = uruchom(ARGS, projekt({ ...MAPA, klucze: { ...MAPA.klucze, 'a.nieistnieje': { twierdzenia: ['PRB-002'], sha_en: 'abc' } } }, { jezyki: {} }));
    expect(r.wyjscie).toMatch(/BŁĄD krytyczne: klucza a\.nieistnieje nie ma w źródle/);
    expect(r.kod).toBe(1);
  });
  it('klucz w mapie bez żadnego ID twierdzenia z listy krytycznych = błąd, kod 1', () => {
    const r = uruchom(ARGS, projekt({ ...MAPA, klucze: { 'a.b': { twierdzenia: ['DRT-001'], sha_en: skrot(EN.a.b) } } }, { jezyki: {} }));
    expect(r.wyjscie).toMatch(/BŁĄD krytyczne: a\.b nie ma twierdzenia z listy krytyczne_id/);
    expect(r.kod).toBe(1);
  });
  it('stan przeglądu dla klucza spoza mapy albo nieznanego języka = błąd, kod 1', () => {
    const r = uruchom(ARGS, projekt(MAPA, { jezyki: { pl: { 'a.inny': wpisA('x') }, xx: { 'a.b': wpisA('x') } } }));
    expect(r.wyjscie).toMatch(/BŁĄD przeglad: pl a\.inny — klucz spoza krytyczne\.json/);
    expect(r.wyjscie).toMatch(/BŁĄD przeglad: język xx — brak słownika/);
    expect(r.kod).toBe(1);
  });
  it('wpis (a) bez wymaganych pól (kto, data, metoda, wynik, sha) = błąd, kod 1', () => {
    const r = uruchom(ARGS, projekt(MAPA, { jezyki: { pl: { 'a.b': { a: { wynik: 'zgodny' } } } } }));
    expect(r.wyjscie).toMatch(/BŁĄD przeglad: pl a\.b — wpis a bez pól kto, data, metoda, sha/);
    expect(r.kod).toBe(1);
  });
  it('tekst źródłowy klucza krytycznego zmieniony bez odnowienia mapy: uwaga w trybie zwykłym, błąd w --wydanie', () => {
    const zmienione = { a: { ...EN.a, b: 'Block the swatch before you measure it.' } };
    const sl = { en: zmienione, pl: PL };
    const zwykly = uruchom(ARGS, projekt(MAPA, PRZEGLAD_PL, sl));
    expect(zwykly.wyjscie).toMatch(/UWAGA krytyczne: a\.b — tekst źródłowy zmieniony od oznaczenia przez 06/);
    expect(zwykly.kod).toBe(0);
    const wydanie = uruchom([...ARGS, '--wydanie'], projekt(MAPA, PRZEGLAD_PL, sl));
    expect(wydanie.wyjscie).toMatch(/BŁĄD krytyczne: a\.b — tekst źródłowy zmieniony od oznaczenia przez 06/);
    expect(wydanie.kod).toBe(1);
  });
  it('--wydanie bez --krytyczne = błąd konfiguracji (kod 2): bramki nie da się ominąć pominięciem flagi', () => {
    const r = uruchom(['locales', '--zrodlo', 'en', '--wydanie'], projekt(MAPA, PRZEGLAD_PL));
    expect(r.wyjscie).toMatch(/BŁĄD konfiguracji: --wydanie wymaga --krytyczne i --przeglad/);
    expect(r.kod).toBe(2);
  });
  it('--skrot <język> wypisuje skrót każdego klucza krytycznego (pomoc przy wpisie kontroli)', () => {
    const r = uruchom([...ARGS, '--skrot', 'pl'], projekt(MAPA, { jezyki: {} }));
    expect(r.wyjscie).toContain(`pl a.b ${skrot(PL.a.b)}`);
    expect(r.wyjscie).toContain(`pl a.n ${skrot(PL_N)}`);
  });
});

describe('treść krytyczna: dane i okablowanie repozytorium', () => {
  const wczytaj = (p: string) => JSON.parse(readFileSync(join(KORZEN, p), 'utf8')) as Record<string, unknown>;
  it('docs/lokalizacja/krytyczne.json: 10 kluczy z probka.* (F-38), każdy z ID z listy krytycznych roli 06', () => {
    const mapa = wczytaj('docs/lokalizacja/krytyczne.json') as { krytyczne_id: string[]; klucze: Record<string, { twierdzenia: string[] }> };
    const klucze = Object.keys(mapa.klucze);
    expect(klucze.length).toBe(10);
    for (const k of klucze) expect(mapa.klucze[k].twierdzenia.some((id) => mapa.krytyczne_id.includes(id))).toBe(true);
    expect(mapa.krytyczne_id.length).toBe(28);
  });
  it('prawdziwe słowniki: mapa zgodna ze źródłem en (skrypt bez błędów mapy i bez uwagi o zmienionym źródle), stan przeglądu poprawny strukturalnie', () => {
    const r = uruchom(['src/i18n/slowniki', '--zrodlo', 'en', '--oczekujace', 'docs/lokalizacja/oczekujace.json', '--krytyczne', 'docs/lokalizacja/krytyczne.json', '--przeglad', 'docs/lokalizacja/przeglad-krytyczne.json'], KORZEN);
    expect(r.wyjscie).not.toMatch(/BŁĄD (krytyczne|przeglad)/);
    expect(r.wyjscie).not.toMatch(/UWAGA krytyczne: .* zmieniony/);
    expect(r.wyjscie).toMatch(/UWAGA kontrola \(a\) treści krytycznej: \d+ z \d+ par/);
  });
  it('skrypty npm i18n, i18n:kod, i18n:pseudo i kontrola-ipa.sh (TestFlight) przekazują --krytyczne i --przeglad; kontrola-ipa.sh z --wydanie', () => {
    const s = (wczytaj('package.json') as { scripts: Record<string, string> }).scripts;
    for (const n of ['i18n', 'i18n:kod', 'i18n:pseudo']) {
      expect(s[n]).toContain('--krytyczne docs/lokalizacja/krytyczne.json');
      expect(s[n]).toContain('--przeglad docs/lokalizacja/przeglad-krytyczne.json');
    }
    const sh = readFileSync(join(KORZEN, 'scripts/wydanie/kontrola-ipa.sh'), 'utf8');
    expect(sh).toMatch(/sprawdz-i18n\.mjs [^\n]*--krytyczne docs\/lokalizacja\/krytyczne\.json --przeglad docs\/lokalizacja\/przeglad-krytyczne\.json --wydanie \|\| bledy=\$\(\(bledy \+ 1\)\)/);
    const wf = readFileSync(join(KORZEN, '.github/workflows/testflight.yml'), 'utf8');
    expect(wf).toContain('scripts/wydanie/kontrola-ipa.sh');
  });
});
