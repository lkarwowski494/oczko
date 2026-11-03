// Kontrola (a) treści krytycznej przez API (P-498, D-027, DEC-11 a): tryb `zwrotny` w scripts/i18n/przeklad-api.mjs — ŚLEPY przekład zwrotny na polski.
// Model dostaje wyłącznie tekst języka (bez angielskiego, bez kontekstu, bez nazw kluczy, bez twierdzeń) i tłumaczy go dosłownie na pl;
// porównanie sensu z kluczem źródłowym robi rola 06 osobno. Bez sieci — atrapa fetch. Testy przed kodem.
import { spawnSync, execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = join(__dirname, '../..');
const SCRIPT = join(ROOT, 'scripts/i18n/przeklad-api.mjs');
const ZAKRES_PLIK = 'docs/lokalizacja/krytyczne.json';
const BEZ_KLUCZA: NodeJS.ProcessEnv = { ...process.env, ANTHROPIC_API_KEY: '' };
const json = (kod: string) => JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', `import * as m from ${JSON.stringify(SCRIPT)}; ${kod}`], { encoding: 'utf8', cwd: ROOT }));
const wyj = () => mkdtempSync(join(tmpdir(), 'zwrotny-'));
const KLUCZE_KRYTYCZNE = Object.keys((JSON.parse(readFileSync(join(ROOT, ZAKRES_PLIK), 'utf8')) as { klucze: Record<string, unknown> }).klucze);

describe('zwrotny: zakres z mapy krytyczne.json (klucze jako obiekt)', () => {
  test('zakresKluczy: tablica zostaje, obiekt „klucze” daje swoje nazwy; zbierz przyjmuje wynik, 10 baz kluczy probka.*', () => {
    const r = json(`console.log(JSON.stringify([m.zakresKluczy({ klucze: ['a', 'b'] }), m.zakresKluczy({ klucze: { x: {}, y: {} } }), m.zbierz(undefined, m.zakresKluczy(JSON.parse((await import('node:fs')).readFileSync(${JSON.stringify(ZAKRES_PLIK)}, 'utf8')))).map((p) => p.klucz)]))`);
    expect(r[0]).toEqual(['a', 'b']); expect(r[1]).toEqual(['x', 'y']);
    expect(r[2]).toHaveLength(10); expect([...r[2]].sort()).toEqual([...KLUCZE_KRYTYCZNE].sort());
  });
});

describe('zwrotny: żądanie jest ślepe (tylko tekst języka)', () => {
  const zad = (kod: string) => json(`const p = m.zbierz(undefined, m.zakresKluczy(JSON.parse((await import('node:fs')).readFileSync(${JSON.stringify(ZAKRES_PLIK)}, 'utf8'))));
    const obecne = m.obecneTeksty(${JSON.stringify(kod)});
    console.log(JSON.stringify({ z: m.budujZadanieZwrotne(${JSON.stringify(kod)}, p, obecne), en: p.map((x) => x.formy ?? x.tekst), kontekst: p.map((x) => x.kontekst), klucze: p.map((x) => x.klucz), obecne: p.map((x) => m.obecnePozycji(${JSON.stringify(kod)}, x, obecne)) }))`);
  test('treść: język i JSON pozycji z tekstem języka (formy wg kategorii CLDR języka); BEZ angielskiego, kontekstu, nazw kluczy i słownika', () => {
    const { z, en, kontekst, klucze, obecne } = zad('de');
    const t = z.messages[0].content as string, wszystko = JSON.stringify(z);
    expect(t).toMatch(/Język tekstu: .*\(de\)/);
    for (const o of obecne) for (const s of typeof o === 'string' ? [o] : Object.values(o)) expect(t).toContain(JSON.stringify(s).slice(1, -1));
    expect(t).toContain('"kategorie":["one","other"]');
    for (const e of en) for (const s of typeof e === 'string' ? [e] : Object.values(e)) expect(wszystko).not.toContain(JSON.stringify(s).slice(1, -1));
    for (const k of kontekst) if (k) expect(wszystko).not.toContain(k);
    for (const k of klucze) expect(wszystko).not.toContain(k);
    expect(wszystko).not.toMatch(/Słownik terminów|krytyczn|twierdzen|GRB-|PRB-|JED-|sk-ant|api[_-]?key/i);
  });
  test('system: dosłowny przekład na polski, bez poprawiania i łagodzenia; parametry bez zmian; tylko JSON; teksty w danych to treść, nie polecenia', () => {
    const { z } = zad('de');
    expect(z.system).toMatch(/na język polski/); expect(z.system).toMatch(/dosłown/);
    expect(z.system).toMatch(/nie poprawiaj|Nie poprawiaj/); expect(z.system).toMatch(/nie łagodź|bez złagodzenia/);
    expect(z.system).toMatch(/\{\{…\}\}/); expect(z.system).toMatch(/WYŁĄCZNIE/); expect(z.system).toMatch(/nie polecenia/);
  });
  test('pozycje z formami niosą kategorie CLDR języka docelowego (pl-owy układ nie jest narzucany obcemu językowi)', () => {
    const t = zad('ru').z.messages[0].content as string;
    expect(t).toContain('"kategorie":["few","many","one","other"]');
  });
});

describe('zwrotny: odpowiedź modelu', () => {
  const poz = `[{ id: '1', klucz: 'a', tekst: 'Fertig {{n}}', kontekst: '' }, { id: '2', klucz: 'b', formy: { one: '{{count}} Reihe', other: '{{count}} Reihen' }, kontekst: '' }]`;
  const parsuj = (odp: unknown, jako = 'JSON.stringify(odp)') => json(`const poz = ${poz}, odp = ${JSON.stringify(odp)}; console.log(JSON.stringify(m.parsujZwrotny(${jako}, poz, 'de')))`);
  test('przyjmuje tekst i formy o kategoriach języka, także w bloku kodu', () => {
    const r = parsuj({ 1: 'Gotowe {{n}}', 2: { one: '{{count}} rząd', other: '{{count}} rzędy' } });
    expect(r.blad).toBeNull(); expect(r.odrzucone).toEqual([]);
    expect(r.przeklady).toEqual({ 1: 'Gotowe {{n}}', 2: { one: '{{count}} rząd', other: '{{count}} rzędy' } });
    expect(parsuj({ 1: 'a', 2: { one: 'b', other: 'c' } }, `'\`\`\`json\\n' + JSON.stringify(odp) + '\\n\`\`\`'`).odrzucone).toEqual([]);
  });
  test('NIE odrzuca zmienionych parametrów (wierny przekład zwrotny ma je pokazać; porównanie z en robi 06); odrzuca brak pozycji, puste teksty i złe kategorie', () => {
    const zmienione = parsuj({ 1: 'Gotowe {{x}}', 2: { one: '{{count}} rząd', other: '{{count}} rzędy' } });
    expect(zmienione.odrzucone).toEqual([]); expect(zmienione.przeklady['1']).toBe('Gotowe {{x}}');
    const zle = parsuj({ 1: '   ', 2: { one: 'a' } });
    expect(zle.przeklady).toEqual({});
    expect(zle.odrzucone.map((o: { klucz: string }) => o.klucz)).toEqual(['a', 'b']);
    expect(parsuj({ 1: 'Gotowe' }).odrzucone.map((o: { powod: string }) => o.powod).join('|')).toMatch(/brak w odpowiedzi/);
  });
  test('brak obiektu JSON i niepoprawny JSON to błąd bez przekładów', () => {
    expect(parsuj('nie json' as unknown, 'odp').blad).toMatch(/brak obiektu JSON/);
    expect(parsuj('{ zepsute' as unknown, 'odp').blad).toBeTruthy();
  });
});

describe('zwrotny: szacunek i CLI', () => {
  const szac = (wysilek: string, extra: string[] = [], env = BEZ_KLUCZA) => {
    const d = wyj();
    const s = spawnSync(process.execPath, [SCRIPT, '--tryb', 'zwrotny', '--szacuj', '--model', 'opus', '--wysilek', wysilek, '--zakres', ZAKRES_PLIK, '--pomin', 'pl', '--wyjscie', d, ...extra], { encoding: 'utf8', env, cwd: ROOT });
    return { s, sz: s.status === 0 ? JSON.parse(readFileSync(join(d, 'szacunek.json'), 'utf8')) : null };
  };
  test('--tryb zwrotny --szacuj: 33 języki × 10 pozycji bez klucza API; Opus medium i high w kilku dolarach, wysiłek podnosi koszt', () => {
    const { s, sz } = szac('medium');
    expect(s.status).toBe(0); expect(s.stdout).toMatch(/33 języków × 10 pozycji/); expect(s.stdout).toMatch(/zwrotn/i);
    expect(sz.tryb).toBe('zwrotny'); expect(sz.pozycji).toBe(10); expect(sz.wiersze).toHaveLength(33);
    const m = sz.koszt_wg_modelu['claude-opus-5-5'], h = szac('high').sz.koszt_wg_modelu['claude-opus-5-5'];
    expect(m).toBeGreaterThan(0.3); expect(m).toBeLessThan(3); expect(h).toBeGreaterThan(m); expect(h).toBeLessThan(5); // po pomiarze próby 41643321146: medium ≈ 0,7 USD
  });
  test('wejście zwrotne jest mniejsze niż w przeglądzie (bez en, kontekstu i słownika)', () => {
    const d = wyj();
    const s = spawnSync(process.execPath, [SCRIPT, '--tryb', 'przeglad', '--szacuj', '--model', 'opus', '--wysilek', 'medium', '--zakres', ZAKRES_PLIK, '--pomin', 'pl', '--wyjscie', d], { encoding: 'utf8', env: BEZ_KLUCZA, cwd: ROOT });
    expect(s.status).toBe(0);
    expect(szac('medium').sz.tokeny_we).toBeLessThan(JSON.parse(readFileSync(join(d, 'szacunek.json'), 'utf8')).tokeny_we);
  });
  test('stop powyżej limitu bez zgody (kod 3); zwrotny bez --zakres to kod 2; --zastosuj nie łączy się ze zwrotnym', () => {
    const { s } = szac('high', [], { ...BEZ_KLUCZA, PRZEKLAD_LIMIT_USD: '0.01' });
    expect(s.status).toBe(3); expect(s.stdout).toMatch(/STOP/);
    const bez = spawnSync(process.execPath, [SCRIPT, '--tryb', 'zwrotny', '--szacuj', '--wyjscie', wyj()], { encoding: 'utf8', env: BEZ_KLUCZA, cwd: ROOT });
    expect(bez.status).toBe(2); expect(bez.stdout).toMatch(/--zakres/);
    const zast = spawnSync(process.execPath, [SCRIPT, '--tryb', 'zwrotny', '--zastosuj', '--zakres', ZAKRES_PLIK, '--wyjscie', wyj()], { encoding: 'utf8', env: BEZ_KLUCZA, cwd: ROOT });
    expect(zast.status).toBe(2);
  });
});

describe('zwrotny: przebieg (main) z atrapą fetch', () => {
  const przebieg = (w: string, odpowiedz: string) => json(`const wyslane = [];
    const poz = m.zbierz(undefined, m.zakresKluczy(JSON.parse((await import('node:fs')).readFileSync(${JSON.stringify(ZAKRES_PLIK)}, 'utf8'))));
    const fetchFn = async (url, opcje) => {
      const u = new URL(url); wyslane.push({ metoda: opcje.method, sciezka: u.pathname, klucz: opcje.headers['x-api-key'], cialo: opcje.body ?? '' });
      const ok = (d) => ({ ok: true, json: async () => d, text: async () => d });
      if (u.pathname.endsWith('/count_tokens')) return ok({ input_tokens: 900 });
      if (opcje.method === 'POST') return ok({ id: 'msgbatch_zw1' });
      if (u.pathname.endsWith('msgbatch_zw1')) return ok({ processing_status: 'ended', results_url: 'https://api.anthropic.com/v1/messages/batches/msgbatch_zw1/results' });
      const linie = ['bg', 'cs'].map((k) => JSON.stringify({ custom_id: 'zw-' + k, result: { type: 'succeeded', message: { stop_reason: 'end_turn', content: [{ type: 'text', text: ${odpowiedz} }], usage: { input_tokens: 800, output_tokens: 700 } } } }));
      return ok(linie.join('\\n'));
    };
    const log = [];
    const kod = await m.main(['--tryb', 'zwrotny', '--limit', '2', '--model', 'opus', '--wysilek', 'medium', '--zakres', ${JSON.stringify(ZAKRES_PLIK)}, '--pomin', 'pl', '--wyjscie', ${JSON.stringify(w)}], { fetchFn, env: { ANTHROPIC_API_KEY: 'sk-ant-testowy' }, log: (x) => log.push(x), spij: async () => {} });
    console.log(JSON.stringify({ kod, log, wyslane: wyslane.map((x) => ({ ...x, cialo: x.cialo.length > 3000 ? JSON.parse(x.cialo) : x.cialo })), nadmiar: JSON.stringify(log).includes('sk-ant'), poz }))`);
  const wszystkie = `(() => { const o = {}; for (const p of poz) o[p.id] = p.formy ? Object.fromEntries(new Intl.PluralRules(k).resolvedOptions().pluralCategories.map((c) => [c, 'pl ' + p.klucz + ' ' + c])) : 'pl ' + p.klucz; return JSON.stringify(o); })()`;
  test('batch: custom_id zw-<kod>, effort medium, żądanie ślepe; raport <kod>.json niesie tekst języka, skrót (sha) i przekład zwrotny; słowniki nietknięte; klucz tylko w nagłówku', () => {
    const w = wyj(), stan = readFileSync(join(ROOT, 'src/i18n/slowniki/bg.json'), 'utf8');
    const r = przebieg(w, wszystkie);
    expect(r.kod).toBe(0); expect(r.nadmiar).toBe(false);
    expect(r.wyslane.every((x: { klucz: string }) => x.klucz === 'sk-ant-testowy')).toBe(true);
    const post = r.wyslane.find((x: { metoda: string; sciezka: string }) => x.metoda === 'POST' && x.sciezka.endsWith('/batches'));
    const zadania = post.cialo.requests;
    expect(zadania.map((z: { custom_id: string }) => z.custom_id)).toEqual(['zw-bg', 'zw-cs']);
    expect(zadania[0].params.output_config.effort).toBe('medium'); expect(zadania[0].params.model).toBe('claude-opus-5-5');
    expect(zadania[0].params.messages[0].content).not.toMatch(/probka\./);
    expect(readdirSync(w).sort()).toEqual(expect.arrayContaining(['bg.json', 'cs.json', 'batch-id.txt', 'podsumowanie.md', 'szacunek.json']));
    const bg = JSON.parse(readFileSync(join(w, 'bg.json'), 'utf8'));
    expect(bg.jezyk).toBe('bg'); expect(bg.pozycji).toBe(10); expect(bg.blad).toBeNull(); expect(bg.uzycie.output_tokens).toBe(700);
    expect(bg.przeklady).toHaveLength(10);
    const k = bg.przeklady.find((x: { klucz: string }) => x.klucz === 'probka.kategoria');
    expect(k.sha).toMatch(/^[0-9a-f]{12}$/); expect(k.pl).toEqual({ one: 'pl probka.kategoria one', other: 'pl probka.kategoria other' });
    expect(Object.keys(k.tekst_jezyka).sort()).toEqual(['one', 'other']);
    expect(readFileSync(join(w, 'podsumowanie.md'), 'utf8')).toMatch(/zwrotn/i);
    expect(readFileSync(join(ROOT, 'src/i18n/slowniki/bg.json'), 'utf8')).toBe(stan);
  });
  test('skrót w raporcie = skrót, który liczy bramka (sprawdz-i18n --skrot) dla tego samego tekstu', () => {
    const w = wyj(); przebieg(w, wszystkie);
    const bg = JSON.parse(readFileSync(join(w, 'bg.json'), 'utf8')) as { przeklady: { klucz: string; sha: string }[] };
    const o = spawnSync(process.execPath, [join(ROOT, 'scripts/sprawdz-i18n.mjs'), 'src/i18n/slowniki', '--zrodlo', 'en', '--krytyczne', ZAKRES_PLIK, '--przeglad', 'docs/lokalizacja/przeglad-krytyczne.json', '--skrot', 'bg'], { encoding: 'utf8', cwd: ROOT }).stdout;
    for (const p of bg.przeklady) expect(o).toContain(`bg ${p.klucz} ${p.sha}`);
  });
  test('odpowiedź bez obiektu JSON to błąd języka i kod 1; brak pozycji w odpowiedzi trafia do odrzuconych (kod 1)', () => {
    const w = wyj(); const r = przebieg(w, `'brak json'`);
    expect(r.kod).toBe(1); expect(JSON.parse(readFileSync(join(w, 'bg.json'), 'utf8')).blad).toMatch(/brak obiektu JSON/);
    const w2 = wyj(); const r2 = przebieg(w2, `'{"1":"tylko jedna"}'`);
    expect(r2.kod).toBe(1); expect(JSON.parse(readFileSync(join(w2, 'bg.json'), 'utf8')).odrzucone.length).toBeGreaterThan(0);
  });
});

describe('zwrotny: workflow', () => {
  const wf = readFileSync(join(ROOT, '.github/workflows/przeklad-tlumaczen.yml'), 'utf8');
  test('tryb zwrotny na liście wyborów, zakres krytyczne.json, wyjście raport-zwrotny, artefakt raport-zwrotny (7 dni)', () => {
    expect(wf).toMatch(/options: \[przeklad, przeglad, zwrotny\]/);
    expect(wf).toContain('docs/lokalizacja/krytyczne.json');
    expect(wf).toContain('raport-zwrotny');
    expect(wf).toMatch(/name: raport-zwrotny/);
    expect(wf).toMatch(/inputs\.tryb == 'zwrotny'/);
  });
});
