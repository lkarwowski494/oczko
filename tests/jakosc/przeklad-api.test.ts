// Skrypt przekładu przez API (scripts/i18n/przeklad-api.mjs, P-144): bez sieci — atrapa fetch. Skrypt to moduł ESM, więc wywołanie przez `node --input-type=module`.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = join(__dirname, '../..');
const SCRIPT = join(ROOT, 'scripts/i18n/przeklad-api.mjs');
const BEZ_KLUCZA: NodeJS.ProcessEnv = { ...process.env, ANTHROPIC_API_KEY: '' };
const uruchom = (kod: string, env: Record<string, string> = {}) =>
  spawnSync(process.execPath, ['--input-type=module', '-e', `import * as m from ${JSON.stringify(SCRIPT)}; ${kod}`], { encoding: 'utf8', env: { ...BEZ_KLUCZA, ...env } });
const json = (kod: string) => JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', `import * as m from ${JSON.stringify(SCRIPT)}; ${kod}`], { encoding: 'utf8' }));

describe('przeklad-api: dane wejściowe', () => {
  test('pozycje: formy liczby mnogiej scalone w jedną pozycję z kontekstem; wszystkie klucze en pokryte', () => {
    const r = json(`const p = m.zbierz(); const en = m.splaszcz(JSON.parse((await import('node:fs')).readFileSync('src/i18n/slowniki/en.json','utf8')));
      const klucze = p.flatMap((x) => x.formy ? Object.keys(x.formy).map((c) => x.klucz + '_' + c) : [x.klucz]);
      console.log(JSON.stringify({ n: p.length, pokryte: klucze.sort().join() === Object.keys(en).sort().join(), cofnij: p.find((x) => x.klucz === 'licznik.cofnij'), bezKontekstu: p.filter((x) => !x.kontekst).length }))`);
    expect(r.pokryte).toBe(true);
    expect(Object.keys(r.cofnij.formy).sort()).toEqual(['one', 'other']);
    expect(r.cofnij.kontekst).toMatch(/Przycisk/);
    expect(r.n).toBeGreaterThan(600);
  });
  test('języki = 34 z słownika terminów bez en; kategorie CLDR języka (pl: one few many other; ja: other)', () => {
    const r = json(`console.log(JSON.stringify({ j: m.jezyki(), pl: m.kategorie('pl'), ja: m.kategorie('ja') }))`);
    expect(r.j).toHaveLength(34); expect(r.j).not.toContain('en'); expect(r.j).toContain('pt-BR');
    expect(r.pl).toEqual(['few', 'many', 'one', 'other']); expect(r.ja).toEqual(['other']);
  });
  test('żądanie: wycinek słownika dla języka, kategorie liczby mnogiej, bez klucza API', () => {
    const z = json(`const p = m.zbierz().filter((x) => x.klucz === 'licznik.cofnij' || x.klucz === 'licznik.jednostka'); console.log(JSON.stringify(m.budujZadanie('pl', p, JSON.parse((await import('node:fs')).readFileSync('docs/lokalizacja/slownik-terminow.json','utf8')))))`);
    const t = z.messages[0].content as string;
    expect(t).toMatch(/Język docelowy: .*\(pl\)/); expect(t).toContain('"kategorie":["few","many","one","other"]'); expect(t).toContain('Słownik terminów:');
    expect(JSON.stringify(z)).not.toMatch(/sk-ant|api[_-]?key/i);
  });
});

describe('przeklad-api: odpowiedź modelu', () => {
  const poz = `[{ id: '1', klucz: 'a', tekst: 'Done {{n}}', kontekst: '' }, { id: '2', klucz: 'b', formy: { one: '{{count}} row', other: '{{count}} rows' }, kontekst: '' }]`;
  test('przyjmuje poprawne tłumaczenia (także w bloku kodu), odrzuca zmienione parametry i złe kategorie', () => {
    const r = json(`const poz = ${poz};
      const dobra = m.parsuj('\`\`\`json\\n' + JSON.stringify({ 1: 'Gotowe {{n}}', 2: { one: '{{count}} rząd', few: '{{count}} rzędy', many: '{{count}} rzędów', other: '{{count}} rzędu' } }) + '\\n\`\`\`', poz, 'pl');
      const zla = m.parsuj(JSON.stringify({ 1: 'Gotowe {{x}}', 2: { one: 'rząd', other: 'rzędy' } }), poz, 'pl');
      console.log(JSON.stringify({ dobra, zla }))`);
    expect(Object.keys(r.dobra.tlumaczenia)).toEqual(['1', '2']); expect(r.dobra.odrzucone).toEqual([]);
    expect(r.zla.odrzucone.map((x: { klucz: string }) => x.klucz)).toEqual(['a', 'b']);
  });
  test('forma liczby mnogiej bez parametru wspólnego dla wszystkich form źródła jest odrzucona; brak JSON = błąd', () => {
    const r = json(`const poz = ${poz}; console.log(JSON.stringify({ a: m.parsuj(JSON.stringify({ 2: { one: 'rząd', few: 'x {{count}}', many: 'x {{count}}', other: 'x {{count}}' } }), poz, 'pl').odrzucone, b: m.parsuj('nie json', poz, 'pl').blad }))`);
    expect(r.a.map((x: { klucz: string }) => x.klucz)).toContain('b'); expect(r.b).toMatch(/brak obiektu JSON/);
  });
  test('słownik z przekładu: klucze z przyrostkami, rozpłaszczenie odwraca splaszcz', () => {
    const r = json(`const poz = ${poz}; const w = m.doSlownika(poz, { 1: 'G {{n}}', 2: { one: 'a', other: 'b' } }); console.log(JSON.stringify({ w, o: m.rozplaszcz({ 'x.y_one': 'a', 'x.y_other': 'b', z: 'c' }) }))`);
    expect(r.w).toEqual({ a: 'G {{n}}', b_one: 'a', b_other: 'b' }); expect(r.o).toEqual({ x: { y_one: 'a', y_other: 'b' }, z: 'c' });
  });
});

describe('przeklad-api: przebieg (main) z atrapą fetch', () => {
  const wyj = () => mkdtempSync(join(tmpdir(), 'przeklad-'));
  test('bez klucza: zwykły przebieg to kod 2, --szacuj działa (kod 0) i nie pisze nic poza raportem', () => {
    const w = wyj();
    expect(spawnSync(process.execPath, [SCRIPT, '--wyjscie', w], { encoding: 'utf8', env: BEZ_KLUCZA }).status).toBe(2);
    const s = spawnSync(process.execPath, [SCRIPT, '--szacuj', '--wyjscie', w], { encoding: 'utf8', env: BEZ_KLUCZA });
    expect(s.status).toBe(0); expect(s.stdout).toMatch(/34 języków/); expect(existsSync(join(w, 'szacunek.json'))).toBe(true);
  });
  test('limit kosztu: Opus ponad limit (obniżony do 1 USD zmienną testową) → kod 3 bez zgody (przed jakimkolwiek wysłaniem)', () => {
    const s = spawnSync(process.execPath, [SCRIPT, '--szacuj', '--model', 'opus', '--wyjscie', wyj()], { encoding: 'utf8', env: { ...BEZ_KLUCZA, PRZEKLAD_LIMIT_USD: '1' } });
    expect(s.status).toBe(3); expect(s.stdout).toMatch(/STOP/);
  });
  test('Sonnet na wszystkie 34 języki mieści się w pułapie 30 USD wg szacunku (P-481; myślenie z próby 2026-11-03, było 6 USD wg P-144)', () => {
    const r = json(`const poz = m.zbierz(), sl = JSON.parse((await import('node:fs')).readFileSync('docs/lokalizacja/slownik-terminow.json','utf8'));
      console.log(JSON.stringify(m.szacunek(m.jezyki().map((k) => m.wiersz(k, poz, sl)), 'claude-sonnet-5-5')))`);
    expect(r.jezykow).toBe(34); expect(r.koszt_usd).toBeLessThan(30);
  });
  test('przebieg z atrapą API (2 języki): batch → pliki propozycji, klucz tylko w nagłówku, słowniki nietknięte', () => {
    const w = wyj(), slowniki = readdirSync(join(ROOT, 'src/i18n/slowniki')).sort();
    const r = json(`const wyslane = [];
      const poz = m.zbierz();
      const fetchFn = async (url, opcje) => {
        const u = new URL(url); wyslane.push({ metoda: opcje.method, sciezka: u.pathname, klucz: opcje.headers['x-api-key'], cialo: opcje.body ?? '' });
        const ok = (d) => ({ ok: true, json: async () => d, text: async () => d });
        if (u.pathname.endsWith('/count_tokens')) return ok({ input_tokens: 1000 });
        if (opcje.method === 'POST') return ok({ id: 'msgbatch_test1' });
        if (u.pathname.endsWith('msgbatch_test1')) return ok({ processing_status: 'ended', results_url: 'https://api.anthropic.com/v1/messages/batches/msgbatch_test1/results' });
        const linie = ['pl', 'bg'].map((k) => { const t = {}; for (const p of poz) t[p.id] = p.formy ? Object.fromEntries(m.kategorie(k).map((c) => [c, Object.values(p.formy)[0]])) : p.tekst; return JSON.stringify({ custom_id: 'pr-' + k, result: { type: 'succeeded', message: { stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(t) }], usage: { input_tokens: 900, output_tokens: 800 } } } }); });
        return ok(linie.join('\\n'));
      };
      const log = []; const kod = await m.main(['--limit', '2', '--wyjscie', ${JSON.stringify(w)}], { fetchFn, env: { ANTHROPIC_API_KEY: 'sk-ant-testowy' }, log: (x) => log.push(x), spij: async () => {} });
      console.log(JSON.stringify({ kod, log, wyslane: wyslane.map((x) => ({ ...x, cialo: x.cialo.length })), nadmiar: JSON.stringify(log).includes('sk-ant') }))`);
    expect(r.kod).toBe(0); /* atrapa zwraca poprawne kategorie i parametry źródła */
    expect(r.nadmiar).toBe(false);
    expect(r.wyslane.every((x: { klucz: string }) => x.klucz === 'sk-ant-testowy')).toBe(true);
    expect(r.wyslane.filter((x: { metoda: string; sciezka: string }) => x.metoda === 'POST' && x.sciezka.endsWith('/batches'))).toHaveLength(1);
    const pliki = readdirSync(w).sort();
    expect(pliki).toEqual(expect.arrayContaining(['pl.json', 'bg.json', 'batch-id.txt', 'podsumowanie.md', 'szacunek.json']));
    expect(JSON.parse(readFileSync(join(w, 'bg.json'), 'utf8')).przyjete).toBeGreaterThan(500);
    expect(readdirSync(join(ROOT, 'src/i18n/slowniki')).sort()).toEqual(slowniki);
  });
});

describe('przeklad-api: fala 2026-11-03 (zakres = oczekujace.json, bez pl, P-474)', () => {
  const wyj = () => mkdtempSync(join(tmpdir(), 'przeklad-fala-'));
  const ZAKRES = ['--zakres', 'docs/lokalizacja/oczekujace.json', '--pomin', 'pl'];
  const oczekujace = JSON.parse(readFileSync(join(ROOT, 'docs/lokalizacja/oczekujace.json'), 'utf8')) as { klucze: string[] };
  test('zbierz z zakresem zwraca tylko wskazane bazy kluczy; nieznana baza to błąd (lista nie może się cicho zestarzeć)', () => {
    const r = json(`const p = m.zbierz(undefined, ['licznik.cofnij', 'wspolne.ladowanie']); let blad = null; try { m.zbierz(undefined, ['nie.ma.takiego']); } catch (e) { blad = e.message; } console.log(JSON.stringify({ k: p.map((x) => x.klucz), blad }))`);
    expect(r.k).toEqual(['licznik.cofnij', 'wspolne.ladowanie']);
    expect(r.blad).toMatch(/nie\.ma\.takiego/);
  });
  test('--szacuj z zakresem: 33 języki bez pl i en, tyle pozycji co klucze oczekujące, bez klucza API, w limicie 6 USD (Sonnet)', () => {
    const w = wyj();
    const s = spawnSync(process.execPath, [SCRIPT, '--szacuj', '--model', 'sonnet', ...ZAKRES, '--wyjscie', w], { encoding: 'utf8', env: BEZ_KLUCZA, cwd: ROOT });
    expect(s.status).toBe(0); expect(s.stdout).toMatch(/33 języków × \d+ pozycji/);
    const sz = JSON.parse(readFileSync(join(w, 'szacunek.json'), 'utf8'));
    expect(sz.pozycji).toBe(oczekujace.klucze.length);
    expect(sz.wiersze.map((x: { jezyk: string }) => x.jezyk)).not.toContain('pl'); expect(sz.wiersze).toHaveLength(33);
    expect(sz.koszt_usd).toBeLessThan(6);
  });
  test('stop powyżej limitu 6 USD bez zgody (kod 3) działa także z zakresem; nic nie jest wysyłane (brak klucza)', () => {
    const s = spawnSync(process.execPath, [SCRIPT, '--szacuj', '--model', 'sonnet', ...ZAKRES, '--wyjscie', wyj()], { encoding: 'utf8', env: { ...BEZ_KLUCZA, PRZEKLAD_LIMIT_USD: '0.01' }, cwd: ROOT });
    expect(s.status).toBe(3); expect(s.stdout).toMatch(/STOP/);
  });
  test('żądanie dla języka zawiera glosariusz jednostek tego języka (symbol i nazwa pełna)', () => {
    const t = json(`const sl = JSON.parse((await import('node:fs')).readFileSync('docs/lokalizacja/slownik-terminow.json','utf8')); const p = m.zbierz(undefined, ['jednostka.g_nazwa']); console.log(JSON.stringify(m.budujZadanie('de', p, sl).messages[0].content))`) as string;
    expect(t).toContain('Glosariusz jednostek'); expect(t).toContain('5 Gramm');
  });
  test('nałożenie fali: stare formy bazy zastąpione, chronione pary (język, baza) nietknięte, kolejność jak w en', () => {
    const r = json(`const mod = await import(${JSON.stringify(join(ROOT, 'scripts/i18n/przeklad-zastosuj-delta.mjs'))}); const k = new Map([['a.b', 0], ['c.d', 1], ['e.f', 2]]);
      const aktualny = { 'e.f': 'stare ef', 'c.d_one': 'stare', 'c.d_other': 'stare', 'a.b': 'stare ab', 'x.obcy': 'obcy' };
      const prop = { 'a.b': 'nowe ab', 'c.d_one': 'nowe1', 'c.d_few': 'nowe2', 'c.d_other': 'nowe3' };
      console.log(JSON.stringify({ zwykle: mod.nalozDelta(aktualny, prop, new Set(['a.b', 'c.d']), {}, 'cs', k), chronione: mod.nalozDelta(aktualny, prop, new Set(['a.b', 'c.d']), { 'c.d': ['cs'] }, 'cs', k) }))`);
    expect(Object.keys(r.zwykle.wynik)).toEqual(['a.b', 'c.d_one', 'c.d_few', 'c.d_other', 'e.f', 'x.obcy']);
    expect(r.zwykle.wynik['a.b']).toBe('nowe ab'); expect(r.zwykle.nowe).toBe(4);
    expect(r.chronione.wynik['c.d_one']).toBe('stare'); expect(r.chronione.wynik['c.d_few']).toBeUndefined(); expect(r.chronione.wynik['a.b']).toBe('nowe ab');
  });
});

describe('przeklad-api: wysiłek, pułap 30 USD i szacunek myślenia (P-481)', () => {
  const wyj = () => mkdtempSync(join(tmpdir(), 'przeklad-wys-'));
  const ZAKRES = ['--zakres', 'docs/lokalizacja/oczekujace.json', '--pomin', 'pl'];
  test('pułap 30 USD (wyjątek od P-144 dla fali 1.0); zmienna PRZEKLAD_LIMIT_USD tylko obniża; MAX_TOKENS w limicie wyjścia modelu (128K)', () => {
    const r = json(`console.log(JSON.stringify({ l: m.LIMIT_KOSZTU_USD, wyzej: m.limitKosztu({ PRZEKLAD_LIMIT_USD: '50' }), nizej: m.limitKosztu({ PRZEKLAD_LIMIT_USD: '2' }), brak: m.limitKosztu({}), max: m.MAX_TOKENS }))`);
    expect(r.l).toBe(30); expect(r.wyzej).toBe(30); expect(r.nizej).toBe(2); expect(r.brak).toBe(30);
    expect(r.max).toBeGreaterThanOrEqual(64000); expect(r.max).toBeLessThanOrEqual(128000);
  });
  test('--wysilek: zła wartość to kod 2; szacunek rośnie z wysiłkiem (myślenie), high < 30 USD dla Opus na zakresie fali', () => {
    const z = spawnSync(process.execPath, [SCRIPT, '--szacuj', '--wysilek', 'ogromny', '--wyjscie', wyj()], { encoding: 'utf8', env: BEZ_KLUCZA, cwd: ROOT });
    expect(z.status).toBe(2);
    const koszt = (w: string) => {
      const d = wyj(); const s = spawnSync(process.execPath, [SCRIPT, '--szacuj', '--model', 'opus', '--wysilek', w, ...ZAKRES, '--wyjscie', d], { encoding: 'utf8', env: BEZ_KLUCZA, cwd: ROOT });
      expect(s.status).toBe(0); return JSON.parse(readFileSync(join(d, 'szacunek.json'), 'utf8')).koszt_usd as number;
    };
    const low = koszt('low'), med = koszt('medium'), high = koszt('high');
    expect(low).toBeLessThan(med); expect(med).toBeLessThan(high); expect(high).toBeLessThan(30);
  });
  test('żądanie batcha niesie output_config.effort tylko gdy podano --wysilek; klucz tylko w nagłówku', () => {
    const r = json(`const poz = m.zbierz(undefined, ['wspolne.ladowanie']); const cialaPost = [];
      const mk = () => async (url, opcje) => { const u = new URL(url); const ok = (d) => ({ ok: true, json: async () => d, text: async () => d });
        if (u.pathname.endsWith('/count_tokens')) return ok({ input_tokens: 100 });
        if (opcje.method === 'POST') { cialaPost.push(JSON.parse(opcje.body)); return ok({ id: 'msgbatch_t' }); }
        if (u.pathname.endsWith('msgbatch_t')) return ok({ processing_status: 'ended', results_url: 'https://api.anthropic.com/v1/messages/batches/msgbatch_t/results' });
        return ok(''); };
      const w1 = ${JSON.stringify(wyj())}, w2 = ${JSON.stringify(wyj())};
      await m.main(['--limit', '1', '--model', 'opus', '--wysilek', 'high', '--wyjscie', w1], { fetchFn: mk(), env: { ANTHROPIC_API_KEY: 'sk-ant-t' }, log: () => {}, spij: async () => {} });
      await m.main(['--limit', '1', '--model', 'opus', '--wyjscie', w2], { fetchFn: mk(), env: { ANTHROPIC_API_KEY: 'sk-ant-t' }, log: () => {}, spij: async () => {} });
      console.log(JSON.stringify(cialaPost.map((c) => ({ effort: c.requests[0].params.output_config?.effort ?? null, max: c.requests[0].params.max_tokens }))))`);
    expect(r[0].effort).toBe('high'); expect(r[1].effort).toBeNull(); expect(r[0].max).toBeGreaterThanOrEqual(64000);
  });
});
