/*
 * Lokalizacje produktów zakupu we wszystkich językach aplikacji (P-515, rola 09): `tlumaczenia` w docs/wydanie/metadane/produkty.store.json.
 * Nazwa ≤ 30, opis ≤ 45 znaków (limity Apple z pliku), komplet 35 języków, ascLocale jak metadane sklepu (P-501/P-504), pl wg P-515, zaakceptowane przez właściciela 2026-11-03 (pole `czeka` zdjęte).
 * Przekład przez API (Batch, jak P-474/P-504): moduł scripts/i18n/przeklad-produkty.mjs, tryb `produkty` w przeklad-tlumaczen.yml. Testy PRZED kodem i danymi; bez sieci (atrapa fetch).
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JEZYKI } from '../../src/i18n/jezyki';

const ROOT = join(__dirname, '../..');
const MOD = join(ROOT, 'scripts/i18n/przeklad-produkty.mjs');
const PLIK = 'docs/wydanie/metadane/produkty.store.json';
const read = (f: string) => readFileSync(join(ROOT, f), 'utf8');
const dane = JSON.parse(read(PLIK)) as Record<string, any>;
const T = dane.tlumaczenia as Record<string, any>;
const PRODUKTY = ['monthly', 'yearly', 'lifetime'] as const;
const len = (s: string) => [...s].length;

/** Kod języka aplikacji → lokalizacja ASC (nazwy.store.json, LOCALE_MAP w scripts/asc/metadane.mjs, JEZYK_APP w przeklad-metadane.mjs). */
const ASC: Record<string, string | null> = {
  en: 'en-US', pl: 'pl', cs: 'cs', sk: 'sk', hr: 'hr', uk: 'uk', ru: 'ru', hu: 'hu', ro: 'ro', de: 'de-DE', fr: 'fr-FR', it: 'it', es: 'es-ES', 'es-419': 'es-MX',
  pt: 'pt-PT', 'pt-BR': 'pt-BR', nl: 'nl-NL', sv: 'sv', da: 'da', nb: 'no', fi: 'fi', tr: 'tr', el: 'el', id: 'id', ms: 'ms', vi: 'vi', ja: 'ja', ko: 'ko', 'zh-Hant': 'zh-Hant',
  sl: null, bg: null, et: null, lt: null, lv: null, sr: null,
};

function run(kod: string, env: NodeJS.ProcessEnv = {}) {
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', `import * as m from ${JSON.stringify(MOD)}; ${kod}`], { encoding: 'utf8', env: { ...process.env, ANTHROPIC_API_KEY: '', ...env }, maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`proces: ${r.status}\n${r.stderr}\n${r.stdout.slice(-500)}`);
  return JSON.parse(r.stdout.trim().split('\n').at(-1)!);
}

describe('dane: komplet języków i limity (P-515)', () => {
  test('tlumaczenia = 35 języków aplikacji (src/i18n/jezyki.ts), en i pl na początku', () => {
    expect(Object.keys(T).sort()).toEqual([...JEZYKI].sort());
    expect(Object.keys(T).slice(0, 2)).toEqual(['en', 'pl']);
  });
  test('ascLocale jak metadane sklepu: 29 lokalizacji ASC + en-US; sl, bg, et, lt, lv, sr = null; bez powtórzeń', () => {
    for (const j of JEZYKI) expect([j, T[j]?.ascLocale]).toEqual([j, ASC[j]]);
    const asc = Object.values(T).map((t: any) => t.ascLocale).filter(Boolean);
    expect(new Set(asc).size).toBe(asc.length);
    const nazwy = Object.keys(JSON.parse(read('docs/wydanie/metadane/nazwy.store.json')).apple.info);
    for (const a of asc) expect(nazwy).toContain(a);
  });
  test('każdy język: grupa „Oczko Pro” (jak oferty.tytul w aplikacji), nazwa ≤ 30 i opis ≤ 45 znaków, niepuste, różne między produktami', () => {
    expect(dane.limity).toEqual({ nazwa: 30, opis: 45 });
    for (const j of JEZYKI) {
      const t = T[j];
      expect([j, t.group?.name]).toEqual([j, 'Oczko Pro']);
      for (const p of PRODUKTY) {
        const n = String(t[p]?.name ?? ''), o = String(t[p]?.description ?? '');
        expect([j, p, n.trim().length > 0, o.trim().length > 0]).toEqual([j, p, true, true]);
        expect([j, p, 'nazwa', len(n) <= dane.limity.nazwa]).toEqual([j, p, 'nazwa', true]);
        expect([j, p, 'opis', len(o) <= dane.limity.opis]).toEqual([j, p, 'opis', true]);
        expect([j, p, n.includes('Oczko Pro')]).toEqual([j, p, true]);
        expect([j, p, /\d|[$€£¥₺₴₽]|https?:|iCloud|Apple Watch/.test(n + o)]).toEqual([j, p, false]);
        expect([j, p, n === n.trim() && o === o.trim()]).toEqual([j, p, true]);
      }
      expect([j, new Set(PRODUKTY.map((p) => t[p].name)).size, new Set(PRODUKTY.map((p) => t[p].description)).size]).toEqual([j, 3, 3]);
    }
  });
  test('en bez zmian (źródło); pl wg P-515, zaakceptowane przez właściciela — żaden język nie czeka (pole `czeka` zdjęte, akceptacja w _opis)', () => {
    expect(T.en.monthly).toEqual({ name: 'Oczko Pro, monthly', description: 'No limit on crafting days, billed monthly' });
    expect(T.en.yearly).toEqual({ name: 'Oczko Pro, yearly', description: 'No limit on crafting days, billed yearly' });
    expect(T.en.lifetime).toEqual({ name: 'Oczko Pro, lifetime', description: 'No limit on crafting days, one purchase' });
    expect(T.pl).toEqual({ ascLocale: 'pl', group: { name: 'Oczko Pro' },
      monthly: { name: 'Oczko Pro, miesięcznie', description: 'Bez limitu dni robótkowych, płatne co miesiąc' },
      yearly: { name: 'Oczko Pro, rocznie', description: 'Bez limitu dni robótkowych, płatne co rok' },
      lifetime: { name: 'Oczko Pro, na zawsze', description: 'Bez limitu dni robótkowych, jedna płatność' } });
    for (const j of JEZYKI) expect([j, T[j].czeka, T[j].czekaPowod]).toEqual([j, undefined, undefined]);
    expect(dane._opis).toMatch(/P-515[^.]*zaakceptowane przez właściciela 2026-11-03/);
  });
});

describe('moduł przekładu (scripts/i18n/przeklad-produkty.mjs)', () => {
  test('języki do przekładu: 33 (bez en i pl); mapowanie ASC = tabela testu', () => {
    const r = run(`console.log(JSON.stringify({ j: m.JEZYKI_PRZEKLADU, a: m.ASC_LOCALE, w: m.JEZYKI_WSZYSTKIE }))`);
    expect(r.j).toHaveLength(33); expect(r.j).not.toContain('en'); expect(r.j).not.toContain('pl');
    expect([...r.w].sort()).toEqual([...JEZYKI].sort()); expect(r.a).toEqual(ASC);
  });
  test('żądanie (de): źródło en, polska wersja pomocniczo, słownik aplikacji („Handarbeitstage”, „Monatlich”), limity; grupy nie tłumaczy', () => {
    const r = run(`const z = m.budujZadanie('de', m.wczytajKontekst()); console.log(JSON.stringify({ s: z.system, u: z.messages[0].content }))`);
    expect(r.u).toContain('No limit on crafting days, billed monthly'); expect(r.u).toContain('Bez limitu dni robótkowych');
    expect(r.u).toMatch(/Handarbeitstage/); expect(r.u).toMatch(/30/); expect(r.u).toMatch(/45/);
    expect(r.s).toMatch(/Oczko Pro/); expect(r.u).not.toMatch(/"group"/);
  });
  test('parsuj: przyjmuje poprawne, odrzuca za długie, bez „Oczko Pro”, z liczbą, brakujące i jednakowe', () => {
    const ok = { monthly: { name: 'Oczko Pro, monatlich', description: 'Ohne Limit für Handarbeitstage, monatlich' }, yearly: { name: 'Oczko Pro, jährlich', description: 'Ohne Limit, jährlich' }, lifetime: { name: 'Oczko Pro, dauerhaft', description: 'Ohne Limit, einmaliger Kauf' } };
    const zle = { monthly: { name: 'Oczko Pro, monatlich mit sehr langem Namen', description: 'x'.repeat(46) }, yearly: { name: 'Pro, jährlich', description: 'Ohne Limit, 12 Monate' }, lifetime: { name: 'Pro, jährlich', description: 'Ohne Limit, jährlich' } };
    const r = run(`console.log(JSON.stringify({ ok: m.parsuj(${JSON.stringify(JSON.stringify(ok))}, 'de'), zle: m.parsuj(${JSON.stringify(JSON.stringify(zle))}, 'de'), puste: m.parsuj('bez json', 'de') }))`);
    expect(r.ok.blad).toBeNull(); expect(r.ok.odrzucone).toEqual([]); expect(r.ok.propozycja.group).toEqual({ name: 'Oczko Pro' });
    expect(r.ok.propozycja.monthly.name).toBe('Oczko Pro, monatlich');
    const pola = r.zle.odrzucone.map((x: any) => x.pole).sort();
    expect(pola).toEqual(expect.arrayContaining(['monthly.name', 'monthly.description', 'yearly.name', 'yearly.description', 'lifetime.name']));
    expect(r.zle.propozycja).toBeNull(); expect(r.puste.blad).toMatch(/JSON/);
  });
  test('szacunek bez klucza: kod 0, nic płatnego, 33 języki (limit 2 → 2), koszt > 0', () => {
    const wyj = mkdtempSync(join(tmpdir(), 'pd-'));
    const r = run(`const logs = []; const kod = await m.main(['--szacuj', '--wyjscie', ${JSON.stringify(wyj)}], { env: {}, log: (x) => logs.push(String(x)) });
      const k2 = await m.main(['--szacuj', '--limit', '2', '--wyjscie', ${JSON.stringify(wyj + '/2')}], { env: {}, log: () => {} }); console.log(JSON.stringify({ kod, k2, logs }))`);
    expect(r.kod).toBe(0); expect(r.k2).toBe(0); expect(r.logs.join('\n')).toMatch(/33 języków/);
    const s = JSON.parse(readFileSync(join(wyj, 'szacunek.json'), 'utf8')); expect(s.jezykow).toBe(33); expect(s.koszt_usd).toBeGreaterThan(0);
    expect(JSON.parse(readFileSync(join(wyj, '2', 'szacunek.json'), 'utf8')).jezykow).toBe(2);
  });
  test('pełny przebieg na atrapie: jeden batch, Opus high, wynik <kod>.json; przyjęcie zapisuje do kopii produkty.store.json (en i pl bez zmian, kolejność en, pl, reszta)', () => {
    const wyj = mkdtempSync(join(tmpdir(), 'pd-')), kopia = mkdtempSync(join(tmpdir(), 'pd-repo-'));
    mkdirSync(join(kopia, 'docs/wydanie/metadane'), { recursive: true }); cpSync(join(ROOT, PLIK), join(kopia, PLIK));
    const r = run(`const zadane = []; const calls = [];
      const odp = (k) => { const j = k.replace(/[0-9]/g, 'x'); return JSON.stringify({ monthly: { name: 'Oczko Pro, m-' + j, description: 'Opis m ' + j }, yearly: { name: 'Oczko Pro, y-' + j, description: 'Opis y ' + j }, lifetime: { name: 'Oczko Pro, l-' + j, description: 'Opis l ' + j } }); };
      const rr = (b) => ({ ok: true, status: 200, json: async () => b, text: async () => (typeof b === 'string' ? b : JSON.stringify(b)) });
      const fakeFetch = async (url, init = {}) => { const p = new URL(url).pathname, met = init.method || 'GET'; calls.push(met + ' ' + p);
        if (p.endsWith('/count_tokens')) return rr({ input_tokens: 900 });
        if (p.endsWith('/messages/batches') && met === 'POST') { zadane.push(...JSON.parse(init.body).requests); return rr({ id: 'msgbatch_P1' }); }
        if (p.endsWith('/msgbatch_P1')) return rr({ processing_status: 'ended', results_url: 'https://wyniki.test/w', request_counts: {} });
        if (p === '/w') return rr(zadane.map((q) => JSON.stringify({ custom_id: q.custom_id, result: { type: 'succeeded', message: { stop_reason: 'end_turn', content: [{ type: 'text', text: odp(q.custom_id.replace(/^pd-/, '')) }], usage: { input_tokens: 900, output_tokens: 700 } } } })).join('\\n'));
        return { ok: false, status: 404, json: async () => ({}), text: async () => '' }; };
      const logs = []; const kod = await m.main(['--wyjscie', ${JSON.stringify(wyj)}], { fetchFn: fakeFetch, env: { ANTHROPIC_API_KEY: 'sk-ant-test-123' }, log: (x) => logs.push(String(x)), spij: async () => {} });
      const kp = m.przyjmij(['--raport', ${JSON.stringify(wyj)}, '--korzen', ${JSON.stringify(kopia)}], { log: (x) => logs.push(String(x)) });
      console.log(JSON.stringify({ kod, kp, logs, n: zadane.length, model: zadane[0].params.model, effort: zadane[0].params.output_config?.effort, posty: calls.filter((c) => c.startsWith('POST /v1/messages/batches')).length }))`);
    expect(r.kod).toBe(0); expect(r.n).toBe(33); expect(r.posty).toBe(1); expect(r.model).toBe('claude-opus-5-5'); expect(r.effort).toBe('high');
    expect(r.logs.join('\n')).not.toMatch(/sk-ant-test/);
    expect(r.kp).toBe(0);
    const po = JSON.parse(readFileSync(join(kopia, PLIK), 'utf8'));
    expect(Object.keys(po.tlumaczenia).slice(0, 2)).toEqual(['en', 'pl']); expect(Object.keys(po.tlumaczenia)).toHaveLength(JEZYKI.length);
    expect(po.tlumaczenia.en).toEqual(T.en); expect(po.tlumaczenia.pl).toEqual(T.pl);
    expect(po.tlumaczenia.de).toEqual({ ascLocale: 'de-DE', group: { name: 'Oczko Pro' }, monthly: { name: 'Oczko Pro, m-de', description: 'Opis m de' }, yearly: { name: 'Oczko Pro, y-de', description: 'Opis y de' }, lifetime: { name: 'Oczko Pro, l-de', description: 'Opis l de' } });
    expect(po.tlumaczenia.sr.ascLocale).toBeNull(); expect(po.tlumaczenia.nb.ascLocale).toBe('no');
    const { tlumaczenia: _a, ...resztaPo } = po; const { tlumaczenia: _b, ...resztaPrzed } = dane; expect(resztaPo).toEqual(resztaPrzed);
  });
  test('przyjęcie odrzuca raport z błędem (kod 1) i nie zmienia pliku', () => {
    const wyj = mkdtempSync(join(tmpdir(), 'pd-')), kopia = mkdtempSync(join(tmpdir(), 'pd-repo-'));
    mkdirSync(join(kopia, 'docs/wydanie/metadane'), { recursive: true }); cpSync(join(ROOT, PLIK), join(kopia, PLIK));
    writeFileSync(join(wyj, 'de.json'), JSON.stringify({ jezyk: 'de', blad: 'odpowiedź ucięta', propozycja: null, odrzucone: [] }));
    const r = run(`console.log(JSON.stringify({ k: m.przyjmij(['--raport', ${JSON.stringify(wyj)}, '--korzen', ${JSON.stringify(kopia)}, 'de'], { log: () => {} }) }))`);
    expect(r.k).toBe(1); expect(readFileSync(join(kopia, PLIK), 'utf8')).toBe(read(PLIK));
  });
});

describe('workflow przeklad-tlumaczen.yml: tryb produkty (P-515) w istniejącym pliku (P-472)', () => {
  const wf = read('.github/workflows/przeklad-tlumaczen.yml');
  test('tryb produkty → scripts/i18n/przeklad-produkty.mjs, artefakt raport-produkty 7 dni; klucz API nadal w jednym kroku', () => {
    expect(wf).toMatch(/options: \[przeklad, przeglad, zwrotny, metadane, produkty\]/);
    expect((wf.match(/SKRYPT=scripts\/i18n\/przeklad-produkty\.mjs; ZAKRES=-; WYJ=raport-produkty/g) ?? []).length).toBe(2);
    expect(wf).toMatch(/if: always\(\) && inputs\.tryb == 'produkty'[\s\S]*?name: raport-produkty[\s\S]*?retention-days: 7/);
    expect((wf.match(/secrets\.ANTHROPIC_API_KEY/g) ?? []).length).toBe(1);
  });
});
