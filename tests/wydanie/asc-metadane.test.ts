/*
 * Workflowy App Store Connect przeniesione z Treningu (rola 10, 2026-11-01; P-315, P-316 (4); wzór: tests/asc-metadane.test.ts, asc-zrzuty.test.ts,
 * iap-localizations.test.ts, asc-kontrola.test.ts tamtego repo, 2e4b0f8). Skrypty ESM (scripts/asc/*.mjs) działają w procesie potomnym na atrapie serwera API
 * (fetch podstawiony) — nic nie łączy się z Apple. Dane: docs/wydanie/metadane/*.store.json, produkty.store.json, adresy.json, asc-kontrola.json.
 */
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { execFileSync } from 'child_process';
import { YAML } from '../jakosc/maestro-runner'; // dist CommonJS (wejście „browser” pakietu yaml to ESM)

const root = join(__dirname, '../..');
const read = (f: string) => readFileSync(join(root, f), 'utf8');
const json = (f: string) => JSON.parse(read(f)) as Record<string, any>; // dane z repo
const MET = 'docs/wydanie/metadane';

/** Kody lokalizacji App Store Connect (lista Apple „App Store localizations”, jak w Treningu; odczyt Treningu 14.10.2026 + warianty angielskie). */
const ASC_KNOWN = ['ar-SA', 'ca', 'zh-Hans', 'zh-Hant', 'hr', 'cs', 'da', 'nl-NL', 'fi', 'fr-FR', 'fr-CA', 'de-DE', 'el', 'he', 'hi', 'hu', 'id', 'it', 'ja', 'ko', 'ms', 'no', 'pl', 'pt-BR', 'pt-PT', 'ro', 'ru', 'sk', 'sl', 'es-MX', 'es-ES', 'sv', 'th', 'tr', 'uk', 'vi', 'en-US', 'en-GB', 'en-AU', 'en-CA'];
/** Jawne mapowanie (zmiana pliku nie przechodzi niezauważona). sl = null jak w Treningu (L-003). */
const EXPECTED_MAP: Record<string, string | null> = {
  pl: 'pl', 'en-US': 'en-US', 'en-GB': 'en-GB', 'en-AU': 'en-AU', 'en-CA': 'en-CA', cs: 'cs', sk: 'sk', hu: 'hu', ro: 'ro', hr: 'hr', sl: null, uk: 'uk',
  'es-ES': 'es-ES', 'es-MX': 'es-MX', 'pt-PT': 'pt-PT', 'pt-BR': 'pt-BR', 'de-DE': 'de-DE', 'fr-FR': 'fr-FR', it: 'it', 'nl-NL': 'nl-NL', sv: 'sv', da: 'da',
  no: 'no', fi: 'fi', tr: 'tr', el: 'el', id: 'id', ms: 'ms', vi: 'vi', ru: 'ru', ja: 'ja', ko: 'ko', 'zh-Hant': 'zh-Hant',
};
const APP_LANGS_35 = ['pl', 'en', 'cs', 'sk', 'hu', 'ro', 'bg', 'hr', 'sl', 'sr', 'lt', 'lv', 'et', 'uk', 'es', 'es-419', 'pt', 'pt-BR', 'de', 'fr', 'it', 'nl', 'sv', 'da', 'nb', 'fi', 'tr', 'el', 'id', 'ms', 'vi', 'ru', 'ja', 'ko', 'zh-Hant'];

const MOD_METADANE = JSON.stringify(join(root, 'scripts/asc/metadane.mjs'));
const MOD_IAP = JSON.stringify(join(root, 'scripts/asc/iap-localizations.mjs'));
const DRIVER = `
import * as M from ${MOD_METADANE};
import { makeClient } from ${MOD_IAP};
const sc = JSON.parse(process.argv[1]);
const files = M.loadStoreFiles(${JSON.stringify(join(root, MET))});
const { merged, errs } = M.mergeStoreFiles(files);
if (sc.only) for (const l of Object.keys(merged)) if (!sc.only.includes(l)) delete merged[l];
if (sc.mutate) for (const [loc, field, v] of sc.mutate) merged[loc][field] = v;
const data = { merged, errs };
const store = { info: new Map((sc.infoLocs ?? []).map((l, i) => [l.locale, { id: 'il' + i, attributes: { ...l } }])), ver: new Map((sc.verLocs ?? []).map((l, i) => [l.locale, { id: 'vl' + i, attributes: { ...l } }])) };
const calls = []; let n = 0;
const resp = (status, body) => ({ ok: status < 400, status, json: async () => body });
const fakeFetch = async (url, init = {}) => {
  const m = init.method || 'GET'; const p = new URL(url).pathname; calls.push(m + ' ' + p);
  if (m === 'GET') {
    if (p === '/v1/apps') return resp(200, { data: [{ id: '777', attributes: {} }] });
    if (p === '/v1/apps/777/appStoreVersions') return resp(200, { data: (sc.versions ?? []).map((s, i) => ({ id: 'V' + i, attributes: { appStoreState: s } })) });
    if (p === '/v1/apps/777/appInfos') return resp(200, { data: [{ id: 'AI1', attributes: { appStoreState: 'PREPARE_FOR_SUBMISSION' } }] });
    if (p === '/v1/appInfos/AI1/appInfoLocalizations') return resp(200, { data: [...store.info.values()].map(r => ({ id: r.id, attributes: r.attributes })) });
    if (/^\\/v1\\/appStoreVersions\\/V\\d\\/appStoreVersionLocalizations$/.test(p)) return resp(200, { data: [...store.ver.values()].map(r => ({ id: r.id, attributes: r.attributes })) });
    return resp(404, { errors: [] });
  }
  const body = JSON.parse(init.body);
  if (sc.failOn && calls.filter(c => c.startsWith(m)).length === sc.failOn) return resp(409, { errors: [{ code: 'ENTITY_ERROR', title: 'bad', detail: 'SECRET-DETAIL' }] });
  const target = body.data.type === 'appInfoLocalizations' ? store.info : store.ver;
  if (m === 'POST') { target.set(body.data.attributes.locale, { id: 'new' + (++n), attributes: { ...body.data.attributes } }); return resp(201, { data: { id: 'new' + n } }); }
  if (m === 'PATCH') { for (const r of target.values()) if (r.id === body.data.id) Object.assign(r.attributes, body.data.attributes); return resp(200, { data: {} }); }
  return resp(405, {});
};
const out = {}; const logs = [];
if (sc.mode === 'unit') {
  out.map = M.LOCALE_MAP; out.limity = M.LIMITY; out.errs = M.mergeStoreFiles(files).errs;
  const wanted = M.buildWanted(data);
  const ok = M.validate({ wanted: Object.fromEntries(['en-US', 'en-GB', 'en-AU', 'en-CA'].map(l => [l, wanted[l]])) });
  out.errsEn = ok;
  const w = wanted['en-US'];
  out.errsBad = M.validate({ wanted: { pl: { info: { name: 'x'.repeat(31), subtitle: 'ok', privacyPolicyUrl: 'http://x' }, version: { description: 'd'.repeat(4001), keywords: 'ą'.repeat(51), promotionalText: 'p'.repeat(171), supportUrl: 'https://a.b' } }, xx: w } });
  out.kw = w.version.keywords;
  out.confl = M.mergeStoreFiles({ 'a.store.json': { apple: { info: { 'en-US': { title: 'A' } } } }, 'b.store.json': { apple: { info: { 'en-US': { title: 'B' } } } } }).errs;
  let t = false; try { await makeClient({ fetchFn: fakeFetch, token: 't' }).call('DELETE', '/v1/appInfoLocalizations/x'); } catch (e) { t = true; } out.deleteThrows = t;
} else {
  const base = makeClient({ fetchFn: fakeFetch, token: 't' });
  const log = l => logs.push(l);
  const r1 = await M.run({ client: base, data, zapis: sc.zapis, tylko: sc.tylko ?? [], log }); out.code1 = r1.code; out.calls1 = [...calls]; out.logs1 = logs.join('\\n');
  if (sc.twice) { calls.length = 0; logs.length = 0; const r2 = await M.run({ client: base, data, zapis: true, tylko: sc.tylko ?? [], log }); out.code2 = r2.code; out.calls2 = [...calls]; out.logs2 = logs.join('\\n'); }
  out.store = { info: Object.fromEntries([...store.info].map(([k, v]) => [k, v.attributes])), ver: Object.fromEntries([...store.ver].map(([k, v]) => [k, v.attributes])) };
}
process.stdout.write(JSON.stringify(out));
`;
type Sc = { mode?: string; zapis?: boolean; twice?: boolean; tylko?: string[]; only?: string[]; versions?: string[]; infoLocs?: Record<string, string>[]; verLocs?: Record<string, string>[]; failOn?: number; mutate?: [string, string, unknown][] };
const drive = (sc: Sc) => JSON.parse(execFileSync('node', ['--input-type=module', '-e', DRIVER, JSON.stringify(sc)], { encoding: 'utf8', maxBuffer: 50e6 })) as Record<string, any>;
const writes = (calls: string[]) => calls.filter((c) => !c.startsWith('GET'));

const en = json(`${MET}/en.store.json`).apple.info as Record<string, Record<string, any>>;
const nazwy = json(`${MET}/nazwy.store.json`).apple.info as Record<string, { title: string }>;
const PRZED_ZRODLEM = ['en-US', 'en-GB', 'en-AU', 'en-CA'];

describe('dane i mapowanie lokalizacji (pliki *.store.json → App Store Connect)', () => {
  test('nazwy w 33 lokalizacjach ASC; mapowanie jawne; kody z listy Apple, bez powtórzeń; sl pomijany (Trening L-003)', () => {
    const u = drive({ mode: 'unit' });
    expect(Object.keys(nazwy).sort()).toEqual(Object.keys(EXPECTED_MAP).sort());
    expect(u.map).toEqual(EXPECTED_MAP);
    const kody = Object.values(u.map).filter(Boolean) as string[];
    expect(new Set(kody).size).toBe(kody.length); expect(kody).toHaveLength(32);
    for (const c of kody) expect(ASC_KNOWN).toContain(c);
    expect(u.map.sl).toBeNull();
  });
  test('pliki metadanych nie są sprzeczne; scalenie sprzecznego pola jest wykrywane', () => {
    const u = drive({ mode: 'unit' });
    expect(u.errs).toEqual([]);
    expect(u.confl).toEqual(['en-US.title: sprzeczne wartości w plikach (ostatni: b.store.json)']);
  });
  test('en (szkic, P-320): en-US, en-GB, en-AU, en-CA kompletne; en-AU = en-GB, en-CA = en-US (jak Trening); przechodzą walidację limitów', () => {
    for (const l of PRZED_ZRODLEM) for (const k of ['title', 'subtitle', 'description', 'keywords', 'promoText', 'supportUrl', 'privacyPolicyUrl']) expect(en[l][k]).toBeTruthy();
    expect(en['en-AU']).toEqual(en['en-GB']); expect(en['en-CA']).toEqual(en['en-US']);
    expect(drive({ mode: 'unit' }).errsEn).toEqual([]);
  });
  test('en: crafting days (P-302), bez „days you knit”; knit & crochet w podtytule (P-304 B); bez obietnic zegarka i iCloud (P-300)', () => {
    const d = en['en-US'].description as string;
    expect(d).toContain('crafting days'); expect(d).not.toMatch(/days you knit|knitting days|project days/i);
    expect(en['en-US'].promoText).toContain('crafting days');
    expect(en['en-US'].subtitle).toBe('Knit & crochet, no account');
    expect(d).toMatch(/knitting and crochet/);
    expect(JSON.stringify(en)).not.toMatch(/Apple Watch|\bwatch(OS)?\b|Lock Screen|iCloud|\btrial\b|\$|USD/i);
  });
  test('adresy: pochodne od docs/wydanie/adres-strony.json; w en.store.json te same', () => {
    const a = json('docs/wydanie/adres-strony.json'); const ad = json(`${MET}/adresy.json`);
    expect(ad.privacyPolicyUrl).toBe(a.baza + a.polityka); expect(ad.supportUrl).toBe(a.baza + a.wsparcie);
    for (const l of PRZED_ZRODLEM) { expect(en[l].privacyPolicyUrl).toBe(ad.privacyPolicyUrl); expect(en[l].supportUrl).toBe(ad.supportUrl); }
  });
});

describe('walidacja (limity Apple, odczyt dokumentacji Treningu 22.10.2026; sprawdź w dniu wysyłki)', () => {
  test('limity: nazwa 30, podtytuł 30, słowa kluczowe 100 B, opis 4000, tekst promocyjny 170, nowości 4000', () => {
    expect(drive({ mode: 'unit' }).limity).toEqual({ name: 30, subtitle: 30, keywords: 100, description: 4000, promotionalText: 170, whatsNew: 4000 });
  });
  test('przekroczenia limitów, adres bez https i nieznany kod są wykrywane (słowa kluczowe w bajtach); marketingUrl opcjonalny', () => {
    const e = drive({ mode: 'unit' }).errsBad as { lang: string; field: string; problem: string }[];
    expect(e.map((x) => `${x.lang}/${x.field}`).sort()).toEqual(['pl/description', 'pl/keywords', 'pl/name', 'pl/privacyPolicyUrl', 'pl/promotionalText', 'xx/*']);
    expect(e.find((x) => x.field === 'keywords')!.problem).toBe('102 B > 100 B');
  });
  test('słowa kluczowe: tablica z pliku → jeden ciąg po przecinku, w bajtach ≤ 100', () => {
    const kw = drive({ mode: 'unit' }).kw as string;
    expect(kw).toBe((en['en-US'].keywords as string[]).join(',')); expect(Buffer.byteLength(kw)).toBeLessThanOrEqual(100);
  });
  test('podtytuł ponad limit blokuje zapis — kod 1, zero zapisów', () => {
    const r = drive({ zapis: true, only: PRZED_ZRODLEM, versions: ['PREPARE_FOR_SUBMISSION'], mutate: [['en-US', 'subtitle', 'x'.repeat(31)]] });
    expect(r.code1).toBe(1); expect(writes(r.calls1)).toEqual([]); expect(r.logs1).toContain('en-US / subtitle: 31 znaków > 30');
  });
  test('pełny zapis przed uzupełnieniem 33 lokalizacji (09) jest zablokowany: pola „puste”, zero zapisów — zapis tylko z --tylko', () => {
    const r = drive({ zapis: true, versions: ['PREPARE_FOR_SUBMISSION'] });
    expect(r.code1).toBe(1); expect(writes(r.calls1)).toEqual([]); expect(r.logs1).toContain('de-DE / description: puste');
  });
});

describe('plan i zapis na atrapie API', () => {
  const infoOk = (l: string) => ({ locale: l, name: en[l].title, subtitle: en[l].subtitle, privacyPolicyUrl: en[l].privacyPolicyUrl });
  test('podgląd bez edytowalnej wersji: komunikat z krokiem dla właściciela, tylko GET, kod 0 (przy kompletnych danych)', () => {
    const r = drive({ only: PRZED_ZRODLEM, versions: ['READY_FOR_SALE'], infoLocs: [infoOk('en-US')] });
    expect(r.code1).toBe(0); expect(writes(r.calls1)).toEqual([]);
    expect(r.logs1).toContain('Brak edytowalnej wersji'); expect(r.logs1).toContain('utwórz wersję 1.0'); expect(r.logs1).toContain('Oczko');
  });
  test('zapis bez edytowalnej wersji: kod 1, zero zapisów', () => {
    const r = drive({ zapis: true, only: PRZED_ZRODLEM, versions: [] });
    expect(r.code1).toBe(1); expect(writes(r.calls1)).toEqual([]); expect(r.logs1).toContain('nic nie zapisano');
  });
  test('--tylko en-US: zapis jednej lokalizacji (POST info + wersja), nigdy DELETE, drugi przebieg bez zapisów; en-GB nietknięte', () => {
    const r = drive({ zapis: true, twice: true, tylko: ['en-US'], versions: ['PREPARE_FOR_SUBMISSION'] });
    expect(r.code1).toBe(0); expect(r.code2).toBe(0);
    expect(writes(r.calls1).sort()).toEqual(['POST /v1/appInfoLocalizations', 'POST /v1/appStoreVersionLocalizations']);
    expect(r.store.ver['en-US']).toMatchObject({ description: en['en-US'].description, keywords: (en['en-US'].keywords as string[]).join(','), promotionalText: en['en-US'].promoText, supportUrl: en['en-US'].supportUrl });
    expect(r.store.ver['en-US'].whatsNew).toBeUndefined(); /* pierwsza wersja: bez „Co nowego” */
    expect(r.store.info['en-US']).toMatchObject({ name: 'Oczko: Row Counter', subtitle: 'Knit & crochet, no account' });
    expect(r.store.info['en-GB']).toBeUndefined();
    expect(writes(r.calls2)).toEqual([]);
  });
  test('zapis aktualizuje tylko zmienione pola (PATCH) i nie rusza lokalizacji spoza repozytorium', () => {
    const r = drive({ zapis: true, tylko: ['en-US'], versions: ['PREPARE_FOR_SUBMISSION'], infoLocs: [{ ...infoOk('en-US'), name: 'Stara nazwa' }, { locale: 'ar-SA', name: 'x', subtitle: 'y' }], verLocs: [{ locale: 'ar-SA', description: 'x' }] });
    expect(writes(r.calls1).sort()).toEqual(['PATCH /v1/appInfoLocalizations/il0', 'POST /v1/appStoreVersionLocalizations']);
    expect(r.store.info['en-US'].name).toBe('Oczko: Row Counter');
    expect(r.store.info['ar-SA']).toEqual({ locale: 'ar-SA', name: 'x', subtitle: 'y' });
    expect(r.logs1).toContain('Lokalizacje w ASC spoza repozytorium (nietykane): ar-SA');
  });
  test('--tylko z nieznaną lokalizacją repo: kod 1; sl jest pomijany (ASC nie obsługuje)', () => {
    const r = drive({ tylko: ['xx'], versions: ['PREPARE_FOR_SUBMISSION'] });
    expect(r.code1).toBe(1); expect(r.logs1).toContain('brak w repo lokalizacji: xx');
  });
  test('błąd jednego zapisu: kod 1, w logu tylko status i kod (bez treści odpowiedzi)', () => {
    const r = drive({ zapis: true, only: PRZED_ZRODLEM, tylko: ['en-US', 'en-GB'], versions: ['PREPARE_FOR_SUBMISSION'], failOn: 2 });
    expect(r.code1).toBe(1); expect(r.logs1).toContain('409'); expect(r.logs1).not.toContain('SECRET-DETAIL');
  });
  test('klient nigdy nie usuwa; podgląd odrzuca POST i PATCH; log bez identyfikatorów klucza', () => {
    const script = read('scripts/asc/metadane.mjs');
    expect(drive({ mode: 'unit' }).deleteThrows).toBe(true);
    expect(script).toMatch(/Podgląd jest tylko do odczytu/); expect(script).not.toMatch(/'DELETE'|"DELETE"/);
    expect(script).not.toMatch(/console\.(log|error)\([^)]*(keyId|issuerId|token|keyPem)/);
    const r = drive({ zapis: true, only: PRZED_ZRODLEM, tylko: ['en-US'], versions: ['PREPARE_FOR_SUBMISSION'] });
    expect(r.logs1).not.toMatch(/Bearer|ASC_KEY|ISSUER|BEGIN PRIVATE|eyJ/);
  });
});

describe('workflowy asc-*.yml (statycznie)', () => {
  type Job = { environment?: string; steps?: { if?: string; run?: string }[]; 'runs-on'?: string };
  const wf = (f: string) => YAML.parse(read(`.github/workflows/${f}`)) as { on?: Record<string, any>; true?: Record<string, any>; jobs: Record<string, Job>; permissions?: Record<string, string> };
  const PLIKI = ['asc-metadane.yml', 'asc-iap-localizations.yml', 'asc-zrzuty.yml'];
  test.each(PLIKI)('%s: tylko ręcznie (workflow_dispatch), contents: read, ubuntu, bez sekretów poza środowiskiem release', (f) => {
    const w = wf(f); const on = w.on ?? w.true ?? {};
    expect(Object.keys(on)).toEqual(['workflow_dispatch']);
    expect(w.permissions?.contents).toBe('read');
    for (const j of Object.values(w.jobs)) { expect(j.environment).toBe('release'); expect(j['runs-on']).toBe('ubuntu-latest'); }
    expect(read(`.github/workflows/${f}`)).not.toMatch(/macos|EXPO_TOKEN|eas-cli|pull_request|schedule:/);
  });
  test('metadane: domyślnie podgląd; zapis tylko dla trybu zapis; wejście tylko; zero usuwania', () => {
    const t = read('.github/workflows/asc-metadane.yml');
    expect(t).toMatch(/options: \[podglad, zapis\]\n\s+default: podglad/);
    expect(t).toMatch(/if: \$\{\{ inputs\.tryb == 'zapis' \}\}/); expect(t).toContain('--zapis'); expect(t).toContain('--podglad'); expect(t).toContain('--tylko');
  });
  test('iap i zrzuty: domyślnie dry-run; apply tylko dla trybu apply; zrzuty z artefaktu przebiegu, iPad z katalogu ipad-13', () => {
    for (const f of ['asc-iap-localizations.yml', 'asc-zrzuty.yml']) {
      const t = read(`.github/workflows/${f}`);
      expect(t).toMatch(/options: \[dry-run, apply\]\n\s+default: dry-run/); expect(t).toMatch(/if: \$\{\{ inputs\.tryb == 'apply' \}\}/);
    }
    const z = read('.github/workflows/asc-zrzuty.yml');
    expect(z).toContain('run-id: ${{ inputs.zrzuty_z_przebiegu }}'); expect(z).toContain('sklep-ramki/ipad-13'); expect(z).toMatch(/actions: read/);
  });
  test('klucz .p8 tylko w RUNNER_TEMP, maskowany i usuwany zawsze; dane wejściowe przez env (nie wprost w run)', () => {
    for (const f of PLIKI) {
      const t = read(`.github/workflows/${f}`);
      expect(t).toContain('$RUNNER_TEMP/AuthKey.p8'); expect(t).toContain('::add-mask::$ASC_KEY_ID'); expect(t).toMatch(/if: always\(\)\n\s+run: rm -f "\$RUNNER_TEMP\/AuthKey.p8"/);
      expect(t).not.toMatch(/run: .*\$\{\{ inputs\./);
    }
  });
  test('kontrola ASC: workflow wielokrotnego użytku przypięty do pełnego SHA, tylko ręcznie, konfiguracja istnieje (wyjątek nazwany w wyjatki.json)', () => {
    const t = read('.github/workflows/asc-kontrola.yml');
    expect(t).toMatch(/uses: lkarwowski494\/apps4brew-narzedzia\/\.github\/workflows\/asc-kontrola\.yml@[0-9a-f]{40}\n/);
    expect(t).toContain('config: docs/wydanie/asc-kontrola.json');
    const wyj = json('scripts/jakosc/wyjatki.json').workflowy as { regula: string; plik: string; termin: string }[];
    expect(wyj.some((w) => w.plik === '.github/workflows/asc-kontrola.yml' && w.regula === 'SEKRET-BEZ-SRODOWISKA' && w.termin)).toBe(true);
  });
});

describe('produkty (lokalizacje zakupów) i konfiguracja kontroli ASC', () => {
  const p = json(`${MET}/produkty.store.json`); const k = json('docs/wydanie/asc-kontrola.json');
  const mon = read('docs/monetyzacja.md');
  test('identyfikatory, grupa i ceny zgodne z docs/monetyzacja.md („Produkty”); bez ofert wprowadzających', () => {
    for (const id of ['oczko.pro.monthly', 'oczko.pro.yearly', 'oczko.pro.lifetime']) { expect(mon).toContain(id); expect(k.produkty.map((x: any) => x.productId)).toContain(id); expect(read('scripts/asc/iap-localizations.mjs')).toContain(id); }
    expect(mon).toMatch(/grupa „Oczko Pro”/); expect(read('scripts/asc/iap-localizations.mjs')).toContain("SUBSCRIPTION_GROUP_NAME = 'Oczko Pro'");
    expect(k.ceny).toEqual({ monthly: { USA: 0.99 }, yearly: { USA: 6.99 }, lifetime: { USA: 14.99 } });
    for (const c of ['0,99 USD', '6,99 USD', '14,99 USD']) expect(mon).toContain(c);
    expect(k.oferta.brak).toBe(true); expect(k.aplikacja.bundleId).toBe('com.apps4brew.knitting');
    expect(json('app.json').expo.ios.bundleIdentifier).toBe(k.aplikacja.bundleId);
  });
  test('teksty en-US produktów: limity Apple (nazwa ≤ 30, opis ≤ 45 znaków, jak Trening), bez cen i bez nazw innych aplikacji', () => {
    const en = p.wpisaneRecznie['en-US'];
    for (const key of ['group', 'monthly', 'yearly', 'lifetime']) {
      expect([...en[key].name].length).toBeLessThanOrEqual(30);
      if (en[key].description) expect([...en[key].description].length).toBeLessThanOrEqual(45);
      expect(JSON.stringify(en[key])).not.toMatch(/\d[.,]\d\d|USD|\$/);
    }
    expect(Object.keys(p.tlumaczenia)).toEqual([]); /* przekład 09 po zamrożeniu en */
  });
  test('plan lokalizacji produktów: tworzy brakujące, nie rusza en-US, pomija języki bez ASC (atrapa, bez sieci)', () => {
    const kod = `import * as I from ${JSON.stringify(join(root, 'scripts/asc/iap-localizations.mjs'))};
      const tr = { cs: { ascLocale: 'cs', group: { name: 'Oczko Pro' }, monthly: { name: 'a', description: 'b' } }, sl: { ascLocale: null, group: { name: 'x' }, monthly: { name: 'x', description: 'y' } } };
      const owner = { 'en-US': { monthly: { name: 'Pro, monthly', description: 'd' } } };
      const existing = new Map([['en-US', { id: '1', name: 'Pro, monthly', description: 'd' }]]);
      const pl = I.planObject({ key: 'monthly', translations: tr, owner, existing, hasDescription: true });
      process.stdout.write(JSON.stringify({ items: pl.items.map(i => i.lang + ':' + i.action), owner: pl.ownerReport.map(o => o.status), owners: I.OWNER_LOCALES, bundle: I.BUNDLE_ID }));`;
    const w = JSON.parse(execFileSync('node', ['--input-type=module', '-e', kod], { encoding: 'utf8' }));
    expect(w).toEqual({ items: ['cs:utwórz', 'sl:pomiń'], owner: ['zgodne z plikiem'], owners: ['en-US'], bundle: 'com.apps4brew.knitting' });
  });
  test('asc-kontrola-oczekiwane.json jest aktualne (generator --check) i zawiera tylko lokalizacje ASC z kompletem pól', () => {
    execFileSync('node', [join(root, 'scripts/asc/kontrola-oczekiwane.mjs'), '--check']);
    const o = json('docs/wydanie/asc-kontrola-oczekiwane.json').lokalizacje as Record<string, { name: string; keywords: string }>;
    expect(Object.keys(o).sort()).toEqual([...PRZED_ZRODLEM].sort());
    expect(o['en-US'].keywords).toBe((en['en-US'].keywords as string[]).join(','));
  });
});

describe('zrzuty sklepu (scripts/asc/zrzuty.mjs)', () => {
  const kod = `import * as Z from ${JSON.stringify(join(root, 'scripts/asc/zrzuty.mjs'))};
    const png = (w, h, ct) => { const b = Buffer.alloc(40); Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]).copy(b); b.writeUInt32BE(w,16); b.writeUInt32BE(h,20); b[25]=ct; return b; };
    const ref = { imageSpecs: [{ specId: 'S69', alphaAllowed: false, dimensions: { minWidth: 1320, maxWidth: 1320, minHeight: 2868, maxHeight: 2868 } }, { specId: 'SPAD', alphaAllowed: false, dimensions: { minWidth: 2064, maxWidth: 2064, minHeight: 2752, maxHeight: 2752 } }],
      placementTypes: [{ placementTypeId: 'APP_SCREENSHOT', specMappings: [{ specs: ['S69'], placementGroupId: 'G-IPHONE' }, { specs: ['SPAD'], placementGroupId: 'G-IPAD' }] }] };
    const f = (n, w, h, alpha) => ({ name: n, path: '/x/' + n, size: 1, width: w, height: h, alpha });
    const shots = { iphone: new Map([['en', [f('01.png', 1320, 2868, false)]], ['sl', [f('01.png', 1320, 2868, false)]]]), ipad: new Map([['en', [f('01.png', 2064, 2752, false)]]]) };
    const p = await Z.plan({ shots, locs: new Map([['en-US', 'L1'], ['en-GB', 'L2'], ['en-AU', 'L3'], ['en-CA', 'L4']]), refData: ref, existing: async () => 0 });
    const bad = await Z.plan({ shots: { iphone: new Map([['en', [f('02.png', 1320, 2868, true), f('03.png', 1000, 1000, false)]]]) }, locs: new Map([['en-US','L1']]), refData: ref, existing: async () => 0 });
    process.stdout.write(JSON.stringify({ rows: p.rows.map(r => [r.source, r.lang, r.locale, r.group, r.action].join('|')), errors: p.errors, bad: bad.errors, langs: Z.parseLangs('en, pl'), badLang: Z.parseLangs('zz'), keys: Object.keys(Z.SHOT_LOCALES).sort(), ref: Z.loadShots({ iphone: '/nie-ma' }).problems }));`;
  const w = JSON.parse(execFileSync('node', ['--input-type=module', '-e', kod], { encoding: 'utf8' })) as Record<string, any>;
  test('iPhone 1320×2868 i iPad 2064×2752 trafiają do osobnych grup urządzeń w czterech lokalizacjach en; sl bez lokalizacji w sklepie', () => {
    expect(w.rows).toEqual(expect.arrayContaining(['iphone|en|en-US|G-IPHONE|wgraj', 'iphone|en|en-CA|G-IPHONE|wgraj', 'ipad|en|en-GB|G-IPAD|wgraj', 'iphone|sl|||pomiń']));
    expect(w.rows).toHaveLength(4 + 4 + 1) /* iPhone 4 + sl pominięty + iPad 4 */; expect(w.errors).toEqual([]);
  });
  test('alfa i nietypowy wymiar są błędami planu (Apple: obrazy bez alfa)', () => {
    expect(w.bad).toEqual(expect.arrayContaining([expect.stringContaining('kanał alfa'), expect.stringContaining('1000×1000')]));
  });
  test('35 języków aplikacji, jak w rejestrze 09; --jezyki walidowane; brak katalogu zgłoszony', () => {
    expect(w.keys).toEqual([...APP_LANGS_35].sort()); expect(w.langs).toEqual(['en', 'pl']); expect(w.badLang.error).toContain('zz'); expect(w.ref[0]).toContain('brak katalogu');
    const s = read('scripts/asc/zrzuty.mjs'); expect(s).not.toMatch(/'DELETE'|"DELETE"/); expect(s).toContain('const refOf = (r, f) => `oczko-1.0/');
  });
});

describe('notatka dla App Review', () => {
  test('≤ 4000 bajtów (App Store Connect Help „Platform version information”)', () => {
    expect(Buffer.byteLength(read(`${MET}/notatka-recenzja.txt`))).toBeLessThanOrEqual(4000);
  });
});
