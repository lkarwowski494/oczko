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

// P-406 wariant (a) (M1-audytor-generalny-018): klucz źródła zmieniony na formy liczby mnogiej, przełożony od razu tylko w części języków
// (mapa `przetlumaczone_czesciowo: { baza: [języki] }`); reszta języków trzyma do fali przekładu stary zwykły klucz (t() bierze go jako zastępstwo).
describe('przetlumaczone_czesciowo: klucz z formami przełożony w części języków (P-406 a)', () => {
  const ENF = { a: { b: 'Hello', n_one: 'row', n_other: 'rows' } };
  const PLF = { b: 'Cześć', n_one: 'rząd', n_few: 'rzędy', n_many: 'rzędów', n_other: 'rzędu' };
  const czesciowo = (klucze: string[], mapa: Record<string, string[]>) => ({ ...lista(klucze), przetlumaczone_czesciowo: mapa });

  it('1+2: język z mapy sprawdzany normalnie bez „już przetłumaczony”; język spoza mapy ze starym zwykłym kluczem = uwaga; brak klucza = uwaga; kod 0', () => {
    const r = uruchom(ARGS, projekt({ en: ENF, pl: { a: PLF }, de: { a: { b: 'Hallo', n: 'Reihen' } }, fr: { a: { b: 'Salut' } } }, czesciowo(['a.n'], { 'a.n': ['pl'] })));
    expect(r.wyjscie).not.toMatch(/BŁĄD/);
    expect(r.wyjscie).toMatch(/UWAGA de a\.n: stara forma bez liczby mnogiej, czeka na falę przekładu/);
    expect(r.wyjscie).toMatch(/UWAGA fr a\.n: brak tłumaczenia/);
    expect(r.wyjscie).not.toMatch(/pl a\.n/);
    expect(r.kod).toBe(0);
  });
  it('1: język z mapy bez klucza = błąd (mapa się zestarzała), kod 1', () => {
    const r = uruchom(ARGS, projekt({ en: ENF, pl: { a: { b: 'Cześć' } } }, czesciowo(['a.n'], { 'a.n': ['pl'] })));
    expect(r.wyjscie).toMatch(/BŁĄD pl a\.n: brak tłumaczenia.*przetlumaczone_czesciowo/);
    expect(r.kod).toBe(1);
  });
  it('1: język z mapy sprawdzany normalnie — brak formy CLDR = błąd, bez błędu „już przetłumaczony”', () => {
    const bezFew = Object.fromEntries(Object.entries(PLF).filter(([k]) => k !== 'n_few'));
    const r = uruchom(ARGS, projekt({ en: ENF, pl: { a: bezFew } }, czesciowo(['a.n'], { 'a.n': ['pl'] })));
    expect(r.wyjscie).toMatch(/BŁĄD pl a\.n: brak formy _few/);
    expect(r.wyjscie).not.toMatch(/już przetłumaczony/);
    expect(r.kod).toBe(1);
  });
  it('1: język z mapy ze starym zwykłym kluczem = błąd (formy tylko w źródle), nie uwaga', () => {
    const r = uruchom(ARGS, projekt({ en: ENF, pl: { a: { b: 'Cześć', n: 'rzędów' } } }, czesciowo(['a.n'], { 'a.n': ['pl'] })));
    expect(r.wyjscie).toMatch(/BŁĄD pl a\.n: formy liczby mnogiej tylko w źródle/);
    expect(r.wyjscie).not.toMatch(/UWAGA pl a\.n/);
    expect(r.kod).toBe(1);
  });
  it('3: język spoza mapy z pełnymi formami = błąd „już przetłumaczony” ze wskazaniem mapy, kod 1', () => {
    const r = uruchom(ARGS, projekt({ en: ENF, pl: { a: PLF }, de: { a: { b: 'Hallo', n_one: 'Reihe', n_other: 'Reihen' } } }, czesciowo(['a.n'], { 'a.n': ['pl'] })));
    expect(r.wyjscie).toMatch(/BŁĄD de a\.n: klucz z oczekujace\.json już przetłumaczony — dopisz język do przetlumaczone_czesciowo albo usuń klucz z listy/);
    expect(r.wyjscie).not.toMatch(/BŁĄD pl/);
    expect(r.kod).toBe(1);
  });
  it('4: wpis mapy dla klucza spoza listy klucze = błąd; dla klucza spoza źródła = błąd; język bez słownika = błąd', () => {
    const r = uruchom(ARGS, projekt({ en: ENF, pl: { a: PLF } }, czesciowo([], { 'a.n': ['pl'], 'a.nie_ma': ['pl'], 'a.b': ['xx'] })));
    expect(r.wyjscie).toMatch(/BŁĄD oczekujace: przetlumaczone_czesciowo a\.n — klucza nie ma na liście klucze/);
    expect(r.wyjscie).toMatch(/BŁĄD oczekujace: przetlumaczone_czesciowo a\.nie_ma — klucza nie ma w źródle/);
    expect(r.wyjscie).toMatch(/BŁĄD oczekujace: przetlumaczone_czesciowo a\.b — język xx bez słownika/);
    expect(r.kod).toBe(1);
  });
  it('5: --wydanie z mapą nadal pada przy niepustej liście klucze, kod 1', () => {
    const r = uruchom(WYDANIE, projekt({ en: ENF, pl: { a: PLF } }, czesciowo(['a.n'], { 'a.n': ['pl'] })));
    expect(r.wyjscie).toMatch(/BŁĄD wydanie: oczekujace\.json niepusta \(1 kluczy\)/);
    expect(r.kod).toBe(1);
  });
});

describe('docs/lokalizacja/oczekujace.json w repo', () => {
  const plik = join(KORZEN, 'docs/lokalizacja/oczekujace.json');
  const wczytaj = () => JSON.parse(readFileSync(plik, 'utf8')) as { powod: string; odwolania: string[]; klucze: string[]; przetlumaczone_czesciowo?: Record<string, string[]> };

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
  // P-406 (a): wyjątki tylko dwa — język z mapy przetlumaczone_czesciowo ma przekład (formy) klucza; język spoza mapy może trzymać stary zwykły klucz,
  // gdy en ma już formy liczby mnogiej tej bazy (t() bierze go jako zastępstwo do fali przekładu). Form klucza z listy poza mapą być nie może.
  it('żaden słownik spoza mapy nie ma przekładu (form) klucza z listy; język z mapy ma formy (stare przekłady z innymi zmiennymi usunięte)', () => {
    const l = wczytaj();
    const mapa = l.przetlumaczone_czesciowo ?? {};
    const dir = join(KORZEN, 'src/i18n/slowniki');
    const FORMA = /_(zero|one|two|few|many|other)$/;
    const plaski = (f: string): Record<string, unknown> => {
      const w: Record<string, unknown> = {};
      const splaszcz = (o: Record<string, unknown>, p = ''): void => { for (const [k, v] of Object.entries(o)) v && typeof v === 'object' ? splaszcz(v as Record<string, unknown>, `${p}${k}.`) : (w[p + k] = v); };
      splaszcz(JSON.parse(readFileSync(join(dir, f), 'utf8')));
      return w;
    };
    const en = Object.keys(plaski('en.json'));
    const enFormy = new Set(en.filter((k) => FORMA.test(k)).map((k) => k.replace(FORMA, '')));
    for (const f of readdirSync(dir).filter((n) => /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*\.json$/.test(n) && n !== 'en.json')) {
      const j = f.slice(0, -5), klucze = Object.keys(plaski(f));
      const formy = new Set(klucze.filter((k) => FORMA.test(k)).map((k) => k.replace(FORMA, '')));
      const zwykle = new Set(klucze.filter((k) => !FORMA.test(k)));
      const wMapie = (k: string) => (mapa[k] ?? []).includes(j);
      expect([j, l.klucze.filter((k) => !wMapie(k) && (formy.has(k) || (zwykle.has(k) && !enFormy.has(k))))]).toEqual([j, []]);
      expect([j, l.klucze.filter((k) => wMapie(k) && !formy.has(k))]).toEqual([j, []]);
    }
  });
  // M1-audytor-generalny-129 (09-lokalizacja-513, trwała kontrola 504): każde P-NNN z listy (odwolania i powod) ma wiersz w docs/decyzje.md.
  it('każda decyzja P-NNN z odwolania i powod ma wiersz „| P-NNN |” w docs/decyzje.md', () => {
    const l = wczytaj();
    const rejestr = readFileSync(join(KORZEN, 'docs/decyzje.md'), 'utf8');
    const numery = [...new Set([...l.odwolania, ...(l.powod.match(/P-\d{3}/g) ?? [])])].sort();
    expect(numery.length).toBeGreaterThan(0);
    // Wyjątek nazwany (P-450): numery powyżej ostatniego wiersza rejestru na tej gałęzi to decyzje koordynatora
    // zapisane na gałęzi roboczej; rejestr dogoni je przy scaleniu, a wtedy każdy brak niżej znów jest błędem.
    const ostatni = Math.max(...[...rejestr.matchAll(/^\| P-(\d{3}) \|/gm)].map((m) => Number(m[1])));
    expect(ostatni).toBeGreaterThanOrEqual(445);
    expect(numery.filter((p) => Number(p.slice(2)) <= ostatni && !new RegExp(`^\\| ${p} \\|`, 'm').test(rejestr))).toEqual([]);
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
