/*
 * P-517 (koordynator, 2026-11-03): lokalizacja grupy subskrypcji ustawia `customAppName` = pełna nazwa aplikacji z docs/wydanie/metadane/nazwy.store.json
 * (apple.info[<ascLocale>].title) — inaczej „Use App Name” bierze nazwę z języka podstawowego (pl) i en-US pokazuje „Oczko: Licznik rzędów”.
 * Jedno źródło prawdy (bez kopii nazw w produkty.store.json); „bez zmian” porównuje też customAppName; brak nazwy dla lokalizacji = błąd planu.
 * Bez sieci: atrapa fetch w procesie potomnym (skrypt ESM).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '../..');
const MOD = JSON.stringify(join(root, 'scripts/asc/iap-localizations.mjs'));
const json = (f: string) => JSON.parse(readFileSync(join(root, f), 'utf8'));
const nazwy = json('docs/wydanie/metadane/nazwy.store.json').apple.info as Record<string, { title: string }>;
const dane = json('docs/wydanie/metadane/produkty.store.json');
const node = (kod: string, arg = '') => JSON.parse(execFileSync('node', ['--input-type=module', '-e', kod, arg], { encoding: 'utf8' }));

describe('plan lokalizacji grupy: customAppName z nazwy.store.json', () => {
  const tr = { en: { ascLocale: 'en-US', group: { name: 'Oczko Pro' } }, de: { ascLocale: 'de-DE', group: { name: 'Oczko Pro' } }, xx: { ascLocale: 'xx-XX', group: { name: 'Oczko Pro' } } };
  const kod = `import * as I from ${MOD};
    const ex = new Map([['en-US', { id: '1', name: 'Oczko Pro', customAppName: null }], ['de-DE', { id: '2', name: 'Oczko Pro', customAppName: 'Masche: Reihenzähler' }]]);
    const appNames = { 'en-US': 'Oczko: Row Counter', 'de-DE': 'Masche: Reihenzähler' };
    const p = I.planObject({ key: 'group', translations: JSON.parse(process.argv[1]), existing: ex, hasDescription: false, appNames });
    process.stdout.write(JSON.stringify(p.items.map(i => ({ lang: i.lang, action: i.action, want: i.want ?? null, reason: i.reason ?? '' }))));`;
  const w = node(kod, JSON.stringify(tr)) as { lang: string; action: string; want: any; reason: string }[];
  test('en-US z pustym customAppName → zaktualizuj na „Oczko: Row Counter”', () => {
    expect(w[0]).toMatchObject({ lang: 'en', action: 'zaktualizuj', want: { name: 'Oczko Pro', customAppName: 'Oczko: Row Counter' } });
  });
  test('de-DE z tą samą nazwą i customAppName → pomiń (bez zmian)', () => {
    expect(w[1]).toMatchObject({ lang: 'de', action: 'pomiń', reason: 'bez zmian' });
  });
  test('lokalizacja bez nazwy w nazwy.store.json → błąd planu', () => {
    expect(w[2].action).toBe('błąd'); expect(w[2].reason).toMatch(/nazwy\.store\.json/);
  });
});

describe('zapis (atrapa API): POST i PATCH lokalizacji grupy niosą customAppName; brak nazwy → kod 1', () => {
  const kod = `import * as I from ${MOD};
    const { data, appNames } = JSON.parse(process.argv[1]); const calls = [];
    const r = (b) => ({ ok: true, status: 200, json: async () => b });
    const fetchFn = async (url, init = {}) => { const u = new URL(url), p = u.pathname, m = init.method || 'GET'; calls.push({ m, p, body: init.body ? JSON.parse(init.body) : null });
      if (p === '/v1/apps') return r({ data: [{ id: 'A1' }] });
      if (p === '/v1/apps/A1/subscriptionGroups') return r({ data: [{ id: 'G1', attributes: { referenceName: 'Oczko Pro' } }] });
      if (p === '/v1/subscriptionGroups/G1/subscriptionGroupLocalizations') return r({ data: [{ id: 'L1', attributes: { locale: 'en-US', name: 'Oczko Pro', customAppName: null } }] });
      if (p === '/v1/subscriptionGroups/G1/subscriptions') return r({ data: [] });
      if (p === '/v1/apps/A1/inAppPurchasesV2') return r({ data: [] });
      return r({ data: { id: 'N' } }); };
    const logs = []; const w = await I.run({ client: I.makeClient({ fetchFn, token: 't' }), data, apply: true, log: (x) => logs.push(String(x)), appNames });
    process.stdout.write(JSON.stringify({ code: w.code, zapisy: calls.filter(c => c.m !== 'GET').map(c => ({ m: c.m, p: c.p, a: c.body.data.attributes })), logs }));`;
  const data = { tlumaczenia: { en: { ascLocale: 'en-US', group: { name: 'Oczko Pro' } }, de: { ascLocale: 'de-DE', group: { name: 'Oczko Pro' } } } };
  test('en-US: PATCH z customAppName; de-DE: POST z locale, name i customAppName', () => {
    const w = node(kod, JSON.stringify({ data, appNames: { 'en-US': 'Oczko: Row Counter', 'de-DE': 'Masche: Reihenzähler' } }));
    expect(w.zapisy).toEqual([
      { m: 'PATCH', p: '/v1/subscriptionGroupLocalizations/L1', a: { name: 'Oczko Pro', customAppName: 'Oczko: Row Counter' } },
      { m: 'POST', p: '/v1/subscriptionGroupLocalizations', a: { locale: 'de-DE', name: 'Oczko Pro', customAppName: 'Masche: Reihenzähler' } },
    ]);
  });
  test('brak nazwy dla de-DE → nic nie zapisuje dla de-DE, kod 1', () => {
    const w = node(kod, JSON.stringify({ data, appNames: { 'en-US': 'Oczko: Row Counter' } }));
    expect(w.code).toBe(1); expect(w.zapisy.map((z: any) => z.a.locale ?? 'en-US')).toEqual(['en-US']);
    expect(w.logs.join('\n')).toMatch(/de → de-DE: błąd/);
  });
});

describe('dane: każda lokalizacja ASC produktów ma pełną nazwę w nazwy.store.json (≤ 30 znaków)', () => {
  test('ascLocale z produkty.store.json ⊆ nazwy.store.json; nazwa ≤ 30 (limit Name; Apple nie podaje limitu customAppName)', () => {
    for (const t of Object.values(dane.tlumaczenia) as { ascLocale: string | null }[]) {
      if (!t.ascLocale) continue;
      expect([t.ascLocale, typeof nazwy[t.ascLocale]?.title]).toEqual([t.ascLocale, 'string']);
      expect([...nazwy[t.ascLocale].title].length).toBeLessThanOrEqual(30);
    }
  });
  test('główny przebieg skryptu czyta nazwy z nazwy.store.json (jedno źródło), produkty.store.json nie zawiera customAppName', () => {
    expect(readFileSync(join(root, 'scripts/asc/iap-localizations.mjs'), 'utf8')).toMatch(/nazwy\.store\.json/);
    expect(JSON.stringify(dane.tlumaczenia)).not.toMatch(/customAppName/); // w danych nie ma kopii nazw (wzmianka w _opis dopuszczalna)
  });
});
