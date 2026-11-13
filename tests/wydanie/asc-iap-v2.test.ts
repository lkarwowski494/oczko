/*
 * KO-056 (decyzja właściciela 2026-11-13: „To zróbmy tą migrację teraz”): skrypt scripts/asc/iap-localizations.mjs przechodzi z wycofanych zasobów v1
 * (lokalizacje przypięte do produktu) na model wersji (lokalizacja należy do InAppPurchaseVersion / SubscriptionVersion / SubscriptionGroupVersion).
 * Testy PRZED kodem (zasada wspólna 11): czerwone na 2ed5215a, bo skrypt woła wycofane ścieżki. Źródło kształtu: dokumentacja Apple, odczyt 2026-11-13
 * (migrating-in-app-purchase-metadata-to-v2, working-with-*-versions; adresy w docs/wydanie/asc-v2/inwentarz.md). Atrapa (tests/wydanie/asc-iap-v2-atrapa.mjs)
 * odzwierciedla odczytaną dokumentację, nie prawdziwy serwer; nic nie łączy się z Apple. Zachowanie bez zmian: dry-run/apply, nigdy nie usuwa, idempotencja.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = join(__dirname, '../..');
const DRIVER = join(__dirname, 'asc-iap-v2-driver.mjs');
const KONTROLA = join(root, 'scripts/asc/kontrola-wycofane.mjs');

type Lok = Record<string, string>;
type Wersja = { id: string; n: number; state: string; lok: Lok[] };
type Zapis = { m: string; p: string; a: Record<string, any> | null; rel: any };
type Krok = { code: number; counts: Record<string, number>; problems: string[]; zapisy: Zapis[]; log: string[] };
type Wynik = { kroki: Krok[]; stan: Record<string, { rodzaj: string; id: string; wersje: Wersja[] }>; calls: string[]; nieznane: string[] };

const DATA = {
  tlumaczenia: {
    en: { ascLocale: 'en-US', group: { name: 'Oczko Pro' }, monthly: { name: 'Oczko Pro, monthly', description: 'Monthly desc' }, yearly: { name: 'Oczko Pro, yearly', description: 'Yearly desc' }, lifetime: { name: 'Oczko Pro, lifetime', description: 'Lifetime desc' } },
    de: { ascLocale: 'de-DE', group: { name: 'Oczko Pro' }, monthly: { name: 'Oczko Pro, monatlich', description: 'Monatlich' }, yearly: { name: 'Oczko Pro, jährlich', description: 'Jährlich' }, lifetime: { name: 'Oczko Pro, einmalig', description: 'Einmalig' } },
  },
};
const APP_NAMES = { 'en-US': 'Oczko: Row Counter', 'de-DE': 'Masche: Reihenzähler' };
/** Lokalizacje zgodne z DATA dla produktu `klucz` (zamiast „bez zmian”). */
const ZGODNE = (klucz: string): Lok[] => Object.values(DATA.tlumaczenia).map((t: any) => {
  const w = t[klucz]; return klucz === 'group' ? { locale: t.ascLocale, name: w.name, customAppName: APP_NAMES[t.ascLocale as 'en-US'] } : { locale: t.ascLocale, name: w.name, description: w.description };
});
const STARE = (klucz: string): Lok[] => ZGODNE(klucz).map((l) => ({ ...l, name: `${l.name} (stare)` }));
const OBCA: Lok = { locale: 'fr-FR', name: 'Obca lokalizacja' };

type Stan = Record<string, Wersja[]>;
const obiekty = (w: Stan) => ({
  group: { rodzaj: 'group', id: 'G1', productId: null, wersje: w.group ?? [] },
  monthly: { rodzaj: 'sub', id: 'S1', productId: 'oczko.pro.monthly', wersje: w.monthly ?? [] },
  yearly: { rodzaj: 'sub', id: 'S2', productId: 'oczko.pro.yearly', wersje: w.yearly ?? [] },
  lifetime: { rodzaj: 'iap', id: 'I1', productId: 'oczko.pro.lifetime', wersje: w.lifetime ?? [] },
});
const wersja = (id: string, n: number, state: string, lok: Lok[]): Wersja => ({ id, n, state, lok: lok.map((l, i) => ({ id: `${id}-L${i}`, ...l })) });
const KLUCZE = ['group', 'monthly', 'yearly', 'lifetime'];
/** Stan: każdy produkt ma jedną zatwierdzoną wersję (v1) z lokalizacjami z `fabryka`. */
const zatwierdzone = (fabryka: (k: string) => Lok[], state = 'APPROVED'): Stan => Object.fromEntries(KLUCZE.map((k) => [k, [wersja(`${k}-V1`, 1, state, fabryka(k))]]));

function uruchom(sc: { stan: Stan; kroki: { apply?: boolean }[]; dziedziczy?: boolean; data?: any; appNames?: Record<string, string> }): Wynik {
  const wejscie = { obiekty: obiekty(sc.stan), dziedziczy: sc.dziedziczy ?? false, data: sc.data ?? DATA, appNames: sc.appNames ?? APP_NAMES, kroki: sc.kroki };
  return JSON.parse(execFileSync('node', [DRIVER, JSON.stringify(wejscie)], { encoding: 'utf8', maxBuffer: 1 << 26 }));
}
const WYCOFANE = /^(GET|POST|PATCH) (\/v1\/(subscriptionGroupLocalizations|subscriptionLocalizations|inAppPurchaseLocalizations|inAppPurchaseImages|subscriptionImages|inAppPurchaseSubmissions|subscriptionSubmissions|subscriptionGroupSubmissions)(\/|$)|\/v1\/subscriptionGroups\/[^/]+\/subscriptionGroupLocalizations|\/v1\/subscriptions\/[^/]+\/subscriptionLocalizations|\/v2\/inAppPurchases\/[^/]+\/inAppPurchaseLocalizations)/;
const zapisyDo = (k: Krok, re: RegExp) => k.zapisy.filter((z) => re.test(`${z.m} ${z.p}`));

describe('skrypt nie woła wycofanych endpointów v1 (inwentarz.md)', () => {
  test.each([['dry-run', false], ['apply', true]])('%s na stanie ze starymi tekstami: brak wywołań wycofanych i brak ścieżek spoza modelu v2', (_n, apply) => {
    const w = uruchom({ stan: zatwierdzone(STARE), kroki: [{ apply }] });
    expect(w.calls.filter((c) => WYCOFANE.test(c))).toEqual([]);
    expect(w.nieznane).toEqual([]);
  });
});

describe('dry-run: niczego nie zapisuje, plan wskazuje nową wersję', () => {
  const w = uruchom({ stan: zatwierdzone(STARE), kroki: [{ apply: false }] });
  const k = w.kroki[0];
  test('zero żądań innych niż GET, stan bez zmian', () => {
    expect(k.zapisy).toEqual([]);
    expect(Object.values(w.stan).every((o) => o.wersje.length === 1)).toBe(true);
  });
  test('log mówi, że zapis wymaga nowej wersji (4 obiekty), kod 0', () => {
    expect(k.code).toBe(0);
    expect(k.log.filter((l) => /nowa wersja/i.test(l))).toHaveLength(4);
  });
});

describe('apply: istnieje wersja robocza (PREPARE_FOR_SUBMISSION) — zapis do niej, bez tworzenia kolejnej', () => {
  const stan: Stan = Object.fromEntries(KLUCZE.map((k) => [k, [wersja(`${k}-V1`, 1, 'APPROVED', ZGODNE(k)), wersja(`${k}-V2`, 2, 'PREPARE_FOR_SUBMISSION', k === 'group' ? [{ ...ZGODNE(k)[0], customAppName: '' }] : [STARE(k)[0]])]]));
  const w = uruchom({ stan, kroki: [{ apply: true }] });
  const k = w.kroki[0];
  test('nie tworzy wersji; PATCH istniejącej i POST brakującej lokalizacji idą na ścieżki v2 z relacją `version` = wersja robocza', () => {
    expect(zapisyDo(k, /^POST \/v1\/[A-Za-z]+Versions$/)).toEqual([]);
    const posty = zapisyDo(k, /^POST \/v2\//);
    expect(posty).toHaveLength(4); // de-DE w każdym z 4 obiektów
    expect(posty.map((z) => z.rel.version.data.id).sort()).toEqual(KLUCZE.map((x) => `${x}-V2`).sort());
    expect(zapisyDo(k, /^PATCH \/v2\//)).toHaveLength(4); // en-US w każdym z 4 obiektów
    expect(w.kroki[0].code).toBe(0);
  });
  test('grupa: POST/PATCH niosą customAppName (P-517), subskrypcje i IAP: name i description', () => {
    const g = k.zapisy.filter((z) => /subscriptionGroupLocalizations/.test(z.p));
    expect(g.map((z) => [z.m, z.a])).toEqual(expect.arrayContaining([
      ['PATCH', { name: 'Oczko Pro', customAppName: 'Oczko: Row Counter' }],
      ['POST', { locale: 'de-DE', name: 'Oczko Pro', customAppName: 'Masche: Reihenzähler' }],
    ]));
    const l = k.zapisy.find((z) => z.m === 'POST' && /inAppPurchaseLocalizations/.test(z.p))!;
    expect(l.a).toEqual({ locale: 'de-DE', name: 'Oczko Pro, einmalig', description: 'Einmalig' });
  });
  test('po przebiegu wersja robocza ma komplet zgodny z danymi', () => {
    for (const [klucz, o] of Object.entries(w.stan)) {
      const robocza = o.wersje.find((x) => x.state === 'PREPARE_FOR_SUBMISSION')!;
      expect(robocza.lok.map((l) => ({ ...l, id: undefined })).sort((a, b) => a.locale.localeCompare(b.locale))).toEqual(ZGODNE(klucz).map((l) => ({ ...l, id: undefined })).sort((a, b) => a.locale.localeCompare(b.locale)));
    }
  });
});

describe('apply: brak wersji roboczej, zatwierdzona wersja ma inne teksty — skrypt tworzy wersję (POST …Versions) i zapisuje do niej', () => {
  test.each([['nowa wersja pusta (Apple nie dziedziczy)', false], ['nowa wersja dziedziczy lokalizacje poprzedniej', true]])('%s', (_n, dziedziczy) => {
    const stan = zatwierdzone((k) => [...STARE(k), OBCA]);
    const w = uruchom({ stan, dziedziczy, kroki: [{ apply: true }] });
    const k = w.kroki[0];
    expect(k.code).toBe(0);
    // po jednej nowej wersji na obiekt, z właściwą relacją rodzica
    const wersje = zapisyDo(k, /^POST \/v1\/[A-Za-z]+Versions$/);
    expect(wersje.map((z) => z.p).sort()).toEqual(['/v1/inAppPurchaseVersions', '/v1/subscriptionGroupVersions', '/v1/subscriptionVersions', '/v1/subscriptionVersions']);
    expect(wersje.find((z) => z.p === '/v1/subscriptionGroupVersions')!.rel).toEqual({ subscriptionGroup: { data: { type: 'subscriptionGroups', id: 'G1' } } });
    expect(wersje.find((z) => z.p === '/v1/inAppPurchaseVersions')!.rel).toEqual({ inAppPurchase: { data: { type: 'inAppPurchases', id: 'I1' } } });
    expect(zapisyDo(k, WYCOFANE)).toEqual([]);
    for (const [klucz, o] of Object.entries(w.stan)) {
      const stara = o.wersje.find((x) => x.n === 1)!; const nowa = o.wersje.find((x) => x.state === 'PREPARE_FOR_SUBMISSION')!;
      expect(stara.lok).toHaveLength(3); // wersja zatwierdzona nietknięta
      expect(stara.lok.map((l) => l.name).filter((n) => /stare/.test(n))).toHaveLength(2);
      const mapa = Object.fromEntries(nowa.lok.map((l) => [l.locale, l]));
      for (const z of ZGODNE(klucz)) expect(mapa[z.locale]).toMatchObject({ ...z });
      expect(mapa['fr-FR']).toMatchObject({ name: 'Obca lokalizacja' }); // obca lokalizacja nie ginie w nowej wersji (nigdy nie usuwa)
      expect(nowa.lok).toHaveLength(3);
    }
    if (dziedziczy) { expect(zapisyDo(k, /^POST \/v2\//)).toHaveLength(0); expect(zapisyDo(k, /^PATCH \/v2\//)).toHaveLength(8); } // wszystko odziedziczone (en-US, de-DE, obca): 2 PATCH × 4 obiekty
    else expect(zapisyDo(k, /^POST \/v2\//)).toHaveLength(12); // komplet 2 języków + obca × 4 obiekty
  });
});

describe('idempotencja: drugi apply = 0 zmian (także bez nowej wersji)', () => {
  test.each([['Apple nie dziedziczy', false], ['Apple dziedziczy', true]])('%s', (_n, dziedziczy) => {
    const w = uruchom({ stan: zatwierdzone(STARE), dziedziczy, kroki: [{ apply: true }, { apply: true }, { apply: false }] });
    expect(w.kroki[0].zapisy.length).toBeGreaterThan(0);
    for (const k of w.kroki.slice(1)) { expect(k.zapisy).toEqual([]); expect(k.code).toBe(0); expect(k.counts['utwórz']).toBe(0); expect(k.counts['zaktualizuj']).toBe(0); }
    expect(Object.values(w.stan).every((o) => o.wersje.length === 2)).toBe(true);
  });
  test('zatwierdzona wersja już zgodna z danymi i brak roboczej: ani wersji, ani lokalizacji (0 żądań zapisu)', () => {
    const w = uruchom({ stan: zatwierdzone(ZGODNE), kroki: [{ apply: true }] });
    expect(w.kroki[0].zapisy).toEqual([]); expect(w.kroki[0].code).toBe(0);
    expect(Object.values(w.stan).every((o) => o.wersje.length === 1)).toBe(true);
  });
});

describe('wersja w recenzji z innymi tekstami: nie tworzy kolejnej wersji, zgłasza problem (kod 1), niczego nie zapisuje', () => {
  const w = uruchom({ stan: zatwierdzone(STARE, 'WAITING_FOR_REVIEW'), kroki: [{ apply: true }] });
  test('kod 1, zero zapisów, problem wymienia stan', () => {
    expect(w.kroki[0].code).toBe(1); expect(w.kroki[0].zapisy).toEqual([]);
    expect(w.kroki[0].problems.join('\n')).toMatch(/WAITING_FOR_REVIEW/);
  });
});

describe('brak produktu albo wersji: zachowanie jak dotąd (problem, kod 1) lub utworzenie pierwszej wersji', () => {
  test('produkt bez żadnej wersji → apply tworzy wersję i zapisuje komplet', () => {
    const w = uruchom({ stan: { group: [], monthly: [], yearly: [], lifetime: [] }, kroki: [{ apply: true }] });
    expect(w.kroki[0].code).toBe(0);
    expect(Object.values(w.stan).every((o) => o.wersje.length === 1 && o.wersje[0].lok.length === 2)).toBe(true);
  });
});

describe('klient: tylko GET/POST/PATCH i brak wycofanych ścieżek', () => {
  const kod = (m: string, p: string) => JSON.parse(execFileSync('node', ['--input-type=module', '-e', `import * as I from ${JSON.stringify(join(root, 'scripts/asc/iap-localizations.mjs'))};
    const c = I.makeClient({ fetchFn: async () => ({ ok: true, status: 200, json: async () => ({ data: [] }) }), token: 't' });
    try { await c.call(process.argv[1], process.argv[2], {}); process.stdout.write(JSON.stringify({ ok: true })); } catch (e) { process.stdout.write(JSON.stringify({ ok: false, msg: e.message })); }`, m, p], { encoding: 'utf8' }));
  test('DELETE odrzucony', () => expect(kod('DELETE', '/v2/inAppPurchaseLocalizations/X')).toMatchObject({ ok: false, msg: expect.stringMatching(/nigdy nie usuwa/) }));
  test.each([
    ['POST', '/v1/inAppPurchaseLocalizations'], ['PATCH', '/v1/subscriptionLocalizations/ABC123456'], ['POST', '/v1/subscriptionGroupLocalizations'],
    ['GET', '/v1/subscriptionGroups/G1/subscriptionGroupLocalizations'], ['GET', '/v2/inAppPurchases/I1/inAppPurchaseLocalizations'], ['POST', '/v1/subscriptionSubmissions'],
  ])('%s %s → odmowa (wycofany endpoint)', (m, p) => expect(kod(m, p)).toMatchObject({ ok: false, msg: expect.stringMatching(/wycofan/i) }));
  test.each([['POST', '/v2/inAppPurchaseLocalizations'], ['GET', '/v1/subscriptionVersions/V1/localizations'], ['POST', '/v1/subscriptionGroupVersions']])('%s %s → dozwolone', (m, p) => expect(kod(m, p).ok).toBe(true));
});

describe('kontrola repo (npm run jakosc:kontrole): wycofane endpointy nie wracają do scripts/asc i workflowów asc-*', () => {
  const uruchomKontrole = (katalog: string) => { try { return { kod: 0, out: execFileSync('node', [KONTROLA, '--katalog', katalog], { encoding: 'utf8' }) }; } catch (e: any) { return { kod: e.status as number, out: String(e.stdout) }; } };
  test('repo: 0 naruszeń', () => expect(uruchomKontrole(root)).toMatchObject({ kod: 0 }));
  test('plik-pułapka ze ścieżką v1 w scripts/asc → kod 1 z nazwą pliku', () => {
    const k = mkdtempSync(join(tmpdir(), 'asc-wycofane-')); mkdirSync(join(k, 'scripts/asc'), { recursive: true }); mkdirSync(join(k, '.github/workflows'), { recursive: true });
    writeFileSync(join(k, 'scripts/asc/zly.mjs'), "await c.call('POST', '/v1/subscriptionLocalizations', {});\n");
    writeFileSync(join(k, '.github/workflows/asc-zly.yml'), 'run: curl -X POST https://api.appstoreconnect.apple.com/v1/inAppPurchaseSubmissions\n');
    const w = uruchomKontrole(k); expect(w.kod).toBe(1);
    expect(w.out).toMatch(/scripts\/asc\/zly\.mjs:1/); expect(w.out).toMatch(/asc-zly\.yml:1/);
  });
  test('plik z nazwą v2 i komentarzem o wycofanym zasobie nie jest naruszeniem; kontrola nie pomija żadnego pliku skryptów (lista niepusta)', () => {
    const k = mkdtempSync(join(tmpdir(), 'asc-wycofane-')); mkdirSync(join(k, 'scripts/asc'), { recursive: true });
    writeFileSync(join(k, 'scripts/asc/dobry.mjs'), "await c.call('POST', '/v2/subscriptionLocalizations', {});\nawait c.call('POST', '/v1/subscriptionVersions', {});\n");
    expect(uruchomKontrole(k).kod).toBe(0);
    expect(readdirSync(join(root, 'scripts/asc')).filter((f) => f.endsWith('.mjs')).length).toBeGreaterThan(3);
  });
});

describe('nagłówek skryptu i workflowu: źródło Apple z adresem i datą odczytu', () => {
  test.each(['scripts/asc/iap-localizations.mjs', '.github/workflows/asc-iap-localizations.yml'])('%s', (f) => {
    const t = readFileSync(join(root, f), 'utf8').split('\n').slice(0, 30).join('\n');
    expect(t).toMatch(/migrating-in-app-purchase-metadata-to-v2/); expect(t).toMatch(/2026-11-13/); expect(t).toMatch(/KO-056/);
  });
});

/*
 * Poprawki znalezisk recenzji BH (sesja BI, 2026-11-13; docs/wydanie/bh-2026-11-13/recenzja-bg.md). Testy najpierw czerwone na 347614dc.
 */

// 10-wydanie-001: nowa wersja bez dziedziczenia nie może zgubić lokalizacji, których skrypt nie zapisuje (język `czeka`, błąd planu) — zasada „nigdy nie usuwa”.
describe('10-wydanie-001: lokalizacje starej wersji, których plan nie zapisuje (czeka, błąd planu), przechodzą do nowej wersji', () => {
  // `pl` czeka na tłumaczenie (P-422), `ja` nie ma nazwy aplikacji w APP_NAMES (błąd planu tylko dla grupy).
  const DATA_CZEKA = { tlumaczenia: { ...DATA.tlumaczenia,
    pl: { ascLocale: 'pl', czeka: 'tłumaczenie', group: { name: 'Oczko Pro' }, monthly: { name: 'pl m', description: 'pl m d' }, yearly: { name: 'pl y', description: 'pl y d' }, lifetime: { name: 'pl l', description: 'pl l d' } },
    ja: { ascLocale: 'ja', group: { name: 'Oczko Pro' }, monthly: { name: 'ja m', description: 'ja m d' }, yearly: { name: 'ja y', description: 'ja y d' }, lifetime: { name: 'ja l', description: 'ja l d' } } } };
  const PL = (k: string): Lok => ({ locale: 'pl', name: `pl stary ${k}`, ...(k === 'group' ? { customAppName: 'Oczko pl' } : { description: `pl opis ${k}` }) });
  const JA = (k: string): Lok => ({ locale: 'ja', name: `ja stary ${k}`, ...(k === 'group' ? { customAppName: 'Oczko ja' } : { description: `ja opis ${k}` }) });
  const stan = () => zatwierdzone((k) => [...STARE(k), PL(k), ...(k === 'group' ? [JA(k)] : [])]);
  test.each([['Apple nie dziedziczy', false], ['Apple dziedziczy', true]])('apply, %s: `pl` (czeka) zachowane z tekstem starej wersji; `ja` (błąd planu) zachowane w grupie', (_n, dziedziczy) => {
    const w = uruchom({ stan: stan(), dziedziczy, data: DATA_CZEKA, kroki: [{ apply: true }] });
    for (const [klucz, o] of Object.entries(w.stan)) {
      const nowa = o.wersje.find((x) => x.state === 'PREPARE_FOR_SUBMISSION')!; const stara = o.wersje.find((x) => x.n === 1)!;
      const mapa = Object.fromEntries(nowa.lok.map((l) => [l.locale, l]));
      expect(mapa['pl']).toMatchObject({ ...PL(klucz) });
      if (klucz === 'group') expect(mapa['ja']).toMatchObject({ ...JA(klucz) });
      expect(stara.lok.map((l) => l.locale).sort()).toEqual(['de-DE', 'en-US', 'pl', ...(klucz === 'group' ? ['ja'] : [])].sort()); // wersja zatwierdzona nietknięta
    }
    expect(w.kroki[0].problems.join('\n')).not.toMatch(/przenie/i);
  });
  test('dry-run: plan wymienia lokalizacje do przeniesienia (pl; w grupie także ja) i nie zapisuje niczego', () => {
    const w = uruchom({ stan: stan(), data: DATA_CZEKA, kroki: [{ apply: false }] });
    const k = w.kroki[0];
    expect(k.zapisy).toEqual([]);
    const przen = k.log.filter((l) => /przenie/i.test(l));
    expect(przen).toHaveLength(4); // po jednej linii na obiekt
    expect(przen.filter((l) => /\bpl\b/.test(l))).toHaveLength(4);
    expect(przen.filter((l) => /\bja\b/.test(l))).toHaveLength(1);
  });
  test('przeniesienie niemożliwe (lokalizacja starej wersji bez `name`): nie tworzy nowej wersji, kod 1 i opis w problemach — apply i dry-run', () => {
    const zepsuta: Lok = { locale: 'pl' }; // brak `name` — POST lokalizacji v2 wymaga name
    for (const apply of [true, false]) {
      const w = uruchom({ stan: zatwierdzone((k) => [...STARE(k), zepsuta]), data: DATA_CZEKA, kroki: [{ apply }] });
      const k = w.kroki[0];
      expect(k.code).toBe(1);
      expect(zapisyDo(k, /^POST \/v1\/[A-Za-z]+Versions$/)).toEqual([]);
      expect(k.zapisy).toEqual([]);
      expect(k.problems.join('\n')).toMatch(/nie można przenieść/i);
      expect(Object.values(w.stan).every((o) => o.wersje.length === 1)).toBe(true);
    }
  });
});
