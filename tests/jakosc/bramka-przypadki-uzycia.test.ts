/* Bramka przypadków użycia przed TestFlight i App Review (KO-065; P-837 wariant (a), P-838 wyjątek 1171; sesja BX2, 2026-11-15).
 * Słowa właściciela (15.11 ok. 18:05 i 18:12 UTC): osobna bramka, której nie da się pominąć; testy nieautomatyzowalne wykonane po buildzie
 * w TestFlight albo pominięte z obowiązkowym uzasadnieniem. Trzy kontrole skryptu scripts/jakosc/bramka-przypadki-uzycia.mjs:
 *   1. zielony zestaw PU na tym SHA (każda część e2e iPhone'a success, nie skipped),
 *   2. katalog spójny z kodem (ekrany bez trasy w tabeli katalogu; każdy PU klasy B ma istniejący test),
 *   3. protokół testu fizycznego poprzedniego wysłanego buildu (klasa F; wyjątek tylko 1171).
 * Przed App Review: protokół F dokładnie tego buildu, bez wyjątków (polecenie `recenzja <build>`). */
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from './jakosc-ios-pomoc';

const root = join(__dirname, '..', '..');
const MODUL = join(root, 'scripts/jakosc/bramka-przypadki-uzycia.mjs');
const LISTA = join(root, 'scripts/wydanie/test-fizyczny.mjs');
// Jest nie ładuje .mjs: funkcja w osobnym procesie (import() z CommonJS), wynik albo błąd jako JSON (wzór: tests/wydanie/potok-testflight.test.ts).
function wywolaj(modul: string, fn: string, ...args: unknown[]): unknown {
  // argumenty przez stdin: cały katalog (> 128 KB) nie mieści się w jednym argumencie procesu (E2BIG)
  const kod = `import(process.argv[2]).then((m) => { try { console.log(JSON.stringify({ w: m[process.argv[3]](...JSON.parse(require('fs').readFileSync(0, 'utf8'))) })); } catch (e) { console.log(JSON.stringify({ blad: e.message })); } });`;
  const wynik = JSON.parse(execFileSync(process.execPath, ['--input-type=commonjs', '-e', kod, 'test', modul, fn], { encoding: 'utf8', input: JSON.stringify(args), maxBuffer: 1 << 24 })) as { w?: unknown; blad?: string };
  if (wynik.blad !== undefined) throw new Error(wynik.blad);
  return wynik.w;
}
const b = (fn: string, ...a: unknown[]) => wywolaj(MODUL, fn, ...a);

describe('kontrola 1: zielony zestaw przypadków użycia na tym SHA (każda część iPhone’a success)', () => {
  const czesci = 4;
  const zadania = (nadpis: Record<string, string> = {}) => [
    ...[1, 2, 3, 4].map((n) => ({ name: `e2e (część ${n}, iphone)`, conclusion: 'success' })),
    { name: 'e2e (część 1, ipad)', conclusion: 'failure' }, { name: 'eksperymenty-wzoru', conclusion: 'failure' },
  ].map((z) => ({ ...z, conclusion: nadpis[z.name] ?? z.conclusion }));
  test('wszystkie 4 części iPhone’a success → brak błędów (iPad i eksperymenty informacyjne nie liczą się)', () => {
    expect(b('ocenZestawu', zadania(), czesci)).toEqual([]);
  });
  test('część pominięta (skipped) to nie zielona — dziś ocenBramke w testflight.mjs przyjmuje skipped', () => {
    expect(b('ocenZestawu', zadania({ 'e2e (część 3, iphone)': 'skipped' }), czesci)).toEqual(['e2e (część 3, iphone): skipped']);
  });
  test('brak zadania części (np. macierz zmniejszona) → błąd z nazwą', () => {
    expect(b('ocenZestawu', zadania().filter((z) => z.name !== 'e2e (część 4, iphone)'), czesci)).toEqual(['e2e (część 4, iphone): brak zadania']);
  });
  test('liczba części z e2e/czesci.json (nie stała w skrypcie)', () => {
    expect(b('ocenZestawu', zadania(), 5)).toEqual(['e2e (część 5, iphone): brak zadania']);
  });
});

describe('kontrola 2: katalog spójny z kodem', () => {
  test('na bieżącym repo bez wymogu testów B: brak błędów (to samo, co pilnuje przypadki-uzycia.test.ts, plus ekrany bez trasy)', () => {
    expect(b('kontrolaKatalogu', root, { wymagajTestowB: false })).toEqual([]);
  });
  test('P-837 (a): każdy PU klasy B „do zaprogramowania” czerwieni bramkę — błąd z ID przypadku', () => {
    const katalog = readFileSync(join(root, 'docs/jakosc/przypadki-uzycia.md'), 'utf8');
    const doZaprogramowania = [...katalog.matchAll(/^\| (PU-\d{3}) \|.*\| B \| do zaprogramowania: /gm)].map((m) => m[1]);
    const bledy = b('kontrolaKatalogu', root, { wymagajTestowB: true }) as string[];
    expect(bledy.filter((x) => /klasa B bez testu/.test(x)).map((x) => x.slice(0, 6))).toEqual(doZaprogramowania);
  });
  test('każdy komponent src/ekrany/*.tsx osiągalny importami z trasy app/ (poza _layout) albo w tabeli „Ekrany bez własnej trasy” z istniejącym PU', () => {
    expect(b('ekranyBezTrasy', root)).toEqual([]);
  });
});

describe('kontrola 3: protokół testu fizycznego (klasa F) poprzedniego wysłanego buildu', () => {
  const wymagane = ['PU-001', 'PU-006'];
  const ok = '| PU | Wynik |\n|---|---|\n| PU-001 | zrobione: tak |\n| PU-006 | pominięte: zegarek w serwisie |\n';
  test('poprzedni build = najwyższy N z tagów v*-b<N> (porządek liczbowy, nie tekstowy); brak tagów → null', () => {
    expect(b('poprzedniBuild', ['v1.0.0-b999', 'v1.0.0-b1171', 'v1.0.0-b1161', 'inny'])).toBe(1171);
    expect(b('poprzedniBuild', [])).toBeNull();
  });
  test('protokół kompletny: zrobione albo pominięte z uzasadnieniem → brak błędów', () => {
    expect(b('kontrolaProtokolu', { build: 1181, wymagane, tekst: ok, wyjatki: {} })).toEqual([]);
  });
  test('brak pliku protokołu → błąd ze ścieżką', () => {
    expect(b('kontrolaProtokolu', { build: 1181, wymagane, tekst: null, wyjatki: {} })).toEqual(['brak docs/jakosc/test-fizyczny/1181.md']);
  });
  test('„pominięte:” bez uzasadnienia, brak PU i zły format wyniku → błędy z ID', () => {
    const t = '| PU | Wynik |\n|---|---|\n| PU-001 | pominięte: |\n| PU-002 | tak |\n';
    expect(b('kontrolaProtokolu', { build: 1181, wymagane: ['PU-001', 'PU-002', 'PU-006'], tekst: t, wyjatki: {} })).toEqual([
      'PU-001: „pominięte:” bez uzasadnienia', 'PU-002: wynik „tak” nie jest „zrobione: …” ani „pominięte: …”', 'PU-006: brak w protokole']);
  });
  test('wyjątek P-838 zwalnia tylko build 1171; inny build bez pliku nadal czerwony', () => {
    const wyjatki = { 1171: { decyzja: 'P-838', data: '2026-11-15', powod: 'build wysłany przed powstaniem bramki' } };
    expect(b('kontrolaProtokolu', { build: 1171, wymagane, tekst: null, wyjatki })).toEqual([]);
    expect(b('kontrolaProtokolu', { build: 1181, wymagane, tekst: null, wyjatki })).toEqual(['brak docs/jakosc/test-fizyczny/1181.md']);
  });
  test('plik wyjątków ma najwyżej jeden wpis: 1171 z decyzją P-838, datą i powodem (lista nie rośnie)', () => {
    const plik = JSON.parse(readFileSync(join(root, 'docs/jakosc/test-fizyczny/wyjatki.json'), 'utf8'));
    expect(b('kontrolaWyjatkow', plik)).toEqual([]);
    expect(b('kontrolaWyjatkow', { ...plik, 1181: { decyzja: 'P-899', data: '2026-11-20', powod: 'x' } })).toEqual(['wyjątek dla 1181: dozwolony tylko 1171 (P-838)']);
    expect(b('kontrolaWyjatkow', { 1171: { decyzja: 'P-838', data: '2026-11-15', powod: '' } })).toEqual(['wyjątek 1171: brak powodu']);
  });
  test('wymagane ID = klasa F katalogu', () => {
    const katalog = readFileSync(join(root, 'docs/jakosc/przypadki-uzycia.md'), 'utf8');
    expect(b('wymaganeF', katalog)).toEqual([...katalog.matchAll(/^\| (PU-\d{3}) \|.*\| F \| F: /gm)].map((m) => m[1]));
  });
});

describe('lista fizyczna: „Pomiń” z obowiązkowym uzasadnieniem, wynik w formacie protokołu', () => {
  const kroki = [{ pu: 'PU-001' }, { pu: 'PU-006' }, { pu: 'PU-009' }];
  const l = (fn: string, ...a: unknown[]) => wywolaj(LISTA, fn, ...a) as string;
  test('komplet: tekst wyniku to tabela protokołu, którą kontrola 3 przyjmuje bez przepisywania', () => {
    const t = l('protokolWyniku', kroki, { 'PU-001': { w: 'tak' }, 'PU-006': { w: 'nie', u: 'brak ikony' }, 'PU-009': { w: 'pomin', u: 'brak iPada' } }, '1181', '2026-11-16');
    expect(t).toBe('Test fizyczny Oczka · build 1181 · 2026-11-16\n| PU | Wynik |\n|---|---|\n| PU-001 | zrobione: tak |\n| PU-006 | zrobione: NIE — brak ikony |\n| PU-009 | pominięte: brak iPada |');
    expect(b('kontrolaProtokolu', { build: 1181, wymagane: ['PU-001', 'PU-006', 'PU-009'], tekst: t, wyjatki: {} })).toEqual([]);
  });
  test('„Pomiń” bez uwagi i brak odpowiedzi: pierwszy wiersz NIEPEŁNY z ID, a wiersze tabeli są czerwone dla kontroli 3', () => {
    const t = l('protokolWyniku', kroki, { 'PU-001': { w: 'tak' }, 'PU-006': { w: 'pomin', u: '  ' } }, '1181', '2026-11-16');
    expect(t.split('\n')[0]).toBe('NIEPEŁNY WYNIK — „Pomiń” bez uzasadnienia: PU-006; bez odpowiedzi: PU-009');
    expect(b('kontrolaProtokolu', { build: 1181, wymagane: ['PU-001', 'PU-006', 'PU-009'], tekst: t, wyjatki: {} })).toEqual([
      'PU-006: „pominięte:” bez uzasadnienia', 'PU-009: wynik „brak odpowiedzi” nie jest „zrobione: …” ani „pominięte: …”']);
  });
  test('strona wstawia tę samą funkcję (jedno źródło formatu) i oznacza uwagę przy „Pomiń” jako obowiązkową', () => {
    const html = readFileSync(join(root, 'docs/wydanie/test-fizyczny.html'), 'utf8');
    expect(html).toContain('function protokolWyniku(');
    expect(html).toContain('Uzasadnienie pominięcia (obowiązkowe)');
  });
});

describe('bramki nie da się wyłączyć (testflight.yml)', () => {
  const tekst = readFileSync(join(root, '.github/workflows/testflight.yml'), 'utf8');
  const w = parse(tekst) as unknown as { jobs: Record<string, Record<string, unknown> & { steps?: { run?: string; if?: string; env?: Record<string, string> }[] }> };
  const zadanie = w.jobs['bramka-przypadki'];
  const blok = (() => { const i = tekst.indexOf('\n  bramka-przypadki:'); const j = tekst.indexOf('\n  build:', i); return tekst.slice(i, j); })();
  test('zadanie istnieje na Linuksie, po bramce E2E, bez continue-on-error i bez if — na zadaniu i na krokach', () => {
    expect(zadanie).toBeDefined();
    expect(zadanie['runs-on']).toBe('ubuntu-latest');
    expect(zadanie.needs).toBe('bramka');
    expect(zadanie['continue-on-error']).toBeUndefined();
    expect(zadanie.if).toBeUndefined();
    expect((zadanie?.steps ?? []).filter((s) => s.if !== undefined)).toEqual([]);
    expect(blok).not.toMatch(/continue-on-error|\bif:/);
  });
  test('build wymaga obu bramek; tag (wysyłka) idzie po build', () => {
    expect(w.jobs.build.needs).toEqual(['bramka', 'bramka-przypadki']);
    expect(w.jobs.tag.needs).toBe('build');
  });
  test('skrypt biegnie poleceniem „bramka” z tagami wydań; bez_wysylki nie występuje, pomin_bramke_e2e tylko jako POMIN dla kontroli 1', () => {
    const kroki = (zadanie?.steps ?? []).map((s) => s.run ?? '').join('\n');
    expect(kroki).toMatch(/node scripts\/jakosc\/bramka-przypadki-uzycia\.mjs bramka\b/);
    expect(blok).toMatch(/fetch-depth: 0/);
    expect(blok).not.toMatch(/bez_wysylki/);
    expect(blok.match(/pomin_bramke_e2e/g)).toHaveLength(1);
    expect(blok).toMatch(/POMIN: \$\{\{ inputs\.pomin_bramke_e2e \}\}/);
  });
  test('POMIN=true pomija tylko kontrolę 1: kontrole 2 i 3 biegną i bramka jest czerwona przy B bez testu (P-837)', () => {
    const r = spawnSync(process.execPath, [MODUL, 'bramka'], { cwd: root, encoding: 'utf8', env: { ...process.env, POMIN: 'true', GH_TOKEN: '', PRZEBIEG: '' } });
    const out = r.stdout + r.stderr;
    expect(out).toMatch(/Kontrola 1: pominięta/);
    expect(out).toMatch(/Kontrola 2:/);
    expect(out).toMatch(/Kontrola 3:/);
    expect(r.status).toBe(1);
  });
});

describe('przed App Review: protokół F dokładnie tego buildu (polecenie `recenzja`)', () => {
  test('wyjątek P-838 nie działa przy recenzji: 1171 bez protokołu → kod 1', () => {
    const r = spawnSync(process.execPath, [MODUL, 'recenzja', '1171'], { cwd: root, encoding: 'utf8' });
    expect({ kod: r.status, out: r.stdout + r.stderr }).toEqual({ kod: 1, out: expect.stringContaining('brak docs/jakosc/test-fizyczny/1171.md') });
  });
  test('lista do 1.0 wymaga polecenia przed „Submit for Review” (F1/F3)', () => {
    expect(readFileSync(join(root, 'docs/wydanie/lista-1-0.md'), 'utf8')).toMatch(/node scripts\/jakosc\/bramka-przypadki-uzycia\.mjs recenzja <build>/);
  });
});

// Recenzja niezależna kodu bramki (BX3, docs/jakosc/bx-recenzja.md, „Kod bramki”): P1-1…P1-5. Testy napisane przed poprawkami (czerwień: docs/jakosc/bx3-dowod-czerwony.txt).
describe('BX3 P1: bramka nie przyjmuje treści pozornej', () => {
  const tabela = (...w: string[]) => `| PU | Wynik |\n|---|---|\n${w.join('\n')}\n`;
  const kp = (tekst: string, wymagane = ['PU-001']) => b('kontrolaProtokolu', { build: 1181, wymagane, tekst, wyjatki: {} }) as string[];
  test.each([
    ['placeholder z szablonu', '| PU-001 | zrobione: <wynik> |'],
    ['pominięcie jednym znakiem', '| PU-001 | pominięte: x |'],
    ['pominięcie „n/a”', '| PU-001 | pominięte: n/a |'],
    ['pominięcie myślnikiem', '| PU-001 | pominięte: - |'],
    ['znak zerowej szerokości zamiast uzasadnienia', '| PU-001 | pominięte: \u200b |'],
  ])('P1-1: %s → czerwone', (_n, wiersz) => {
    expect(kp(tabela(wiersz)).length).toBeGreaterThan(0);
  });
  test('P1-1: wiersze w bloku kodu i w komentarzu HTML nie liczą się jako wyniki', () => {
    expect(kp('```\n| PU-001 | zrobione: tak |\n```\n')).toEqual(['PU-001: brak w protokole']);
    expect(kp('<!--\n| PU-001 | zrobione: tak |\n-->\n')).toEqual(['PU-001: brak w protokole']);
  });
  test('P1-1: ten sam PU dwa razy (ostatni wiersz wygrywał) → czerwone', () => {
    expect(kp(tabela('| PU-001 | pominięte: |', '| PU-001 | zrobione: tak |')).length).toBeGreaterThan(0);
  });
  test('P1-2: pusty zbiór klasy F (błąd parsowania katalogu) → czerwone, nie „0 PU klasy F” zielone', () => {
    expect(kp(tabela(), []).length).toBeGreaterThan(0);
  });
  test('P1-3: liczba części z e2e/czesci.json musi być całkowita ≥ 1; inaczej kontrola 1 czerwona', () => {
    for (const czesci of [0, null, undefined, 'x', 2.5]) expect((b('ocenZestawu', [], czesci) as string[]).length).toBeGreaterThan(0);
  });
});

describe('BX3 P1-5: testy workflow chronią także zadanie build i krok skryptu', () => {
  const tekst = readFileSync(join(root, '.github/workflows/testflight.yml'), 'utf8');
  const w = parse(tekst) as unknown as { jobs: Record<string, Record<string, unknown> & { steps?: { run?: string; if?: string; 'continue-on-error'?: unknown }[] }> };
  test('build i bramka nie mają if ani continue-on-error (obejście przez always() albo failure() zostawiłoby testy zielone)', () => {
    for (const z of ['build', 'bramka', 'bramka-przypadki']) {
      expect(w.jobs[z].if).toBeUndefined();
      expect(w.jobs[z]['continue-on-error']).toBeUndefined();
    }
    expect((w.jobs.build.steps ?? []).filter((s) => s['continue-on-error'] !== undefined && /xcodebuild|upload|testflight|altool/i.test(s.run ?? ''))).toEqual([]);
  });
  test('krok skryptu to dokładnie „node scripts/jakosc/bramka-przypadki-uzycia.mjs bramka” (bez „|| true”, „; true”, przekierowań)', () => {
    const kroki = (w.jobs['bramka-przypadki'].steps ?? []).filter((s) => /bramka-przypadki-uzycia/.test(s.run ?? ''));
    expect(kroki.map((s) => (s.run ?? '').trim())).toEqual(['node scripts/jakosc/bramka-przypadki-uzycia.mjs bramka']);
  });
});

