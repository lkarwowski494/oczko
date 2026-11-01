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
  test('limit kosztu: Opus ponad 6 USD → kod 3 bez zgody (przed jakimkolwiek wysłaniem)', () => {
    const s = spawnSync(process.execPath, [SCRIPT, '--szacuj', '--model', 'opus', '--wyjscie', wyj()], { encoding: 'utf8', env: BEZ_KLUCZA });
    expect(s.status).toBe(3); expect(s.stdout).toMatch(/STOP/);
  });
  test('Sonnet na wszystkie 34 języki mieści się w 6 USD wg szacunku (wariant A, P-144)', () => {
    const r = json(`const poz = m.zbierz(), sl = JSON.parse((await import('node:fs')).readFileSync('docs/lokalizacja/slownik-terminow.json','utf8'));
      console.log(JSON.stringify(m.szacunek(m.jezyki().map((k) => m.wiersz(k, poz, sl)), 'claude-sonnet-5-5')))`);
    expect(r.jezykow).toBe(34); expect(r.koszt_usd).toBeLessThan(6);
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
