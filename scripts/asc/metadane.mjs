// Wgranie metadanych sklepu z repozytorium do App Store Connect przez API (P-316 (4); wzór: scripts/asc/metadane.mjs w Treningu, 2e4b0f8).
// Źródło (jedno źródło prawdy, format EAS Metadata `apple.info.<lokalizacja ASC>` z `sprawdz-wydanie.mjs metadane`): wszystkie pliki
// docs/wydanie/metadane/*.store.json (en.store.json, nazwy.store.json oraz pliki języków z roli 09), scalane po kodzie lokalizacji ASC; pole `title`
// w dwóch plikach musi być identyczne. Pola: title→Name, subtitle, privacyPolicyUrl (appInfoLocalizations); description, keywords (tablica→„a,b,c”),
// promoText→promotionalText, supportUrl, marketingUrl, releaseNotes→whatsNew (pomijane przy pierwszej wersji) (appStoreVersionLocalizations).
// Tryby:
//   node scripts/asc/metadane.mjs --podglad   → tylko odczyt (GET): co jest w ASC, co w repo, lista zmian; nic nie zapisuje (domyślnie)
//   node scripts/asc/metadane.mjs --zapis     → tworzy brakujące lokalizacje (POST) i aktualizuje różniące się (PATCH)
//   --tylko <kody ASC, np. en-US>             → zapis tylko wskazanych lokalizacji (zasada: pierwszy zapis na jednym elemencie, sprawdzenie w usłudze, potem całość)
// Zasady: NIGDY nie usuwa (klient dopuszcza tylko GET, POST, PATCH; podgląd dodatkowo tylko GET); zapis tylko do edytowalnej wersji aplikacji;
// walidacja przed zapisem (limity, adresy) — jeden błąd walidacji = brak jakiegokolwiek zapisu; lokalizacji spoza repo nie rusza.
// Repozytorium jest publiczne: w logu tylko kody lokalizacji, nazwy pól i liczby, nigdy identyfikatory klucza, tokeny ani treść odpowiedzi API.
// Dane logowania: ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_PATH (plik .p8).
//
// Limity Apple (odczyt 22.10.2026: App Store Connect Help → „Platform version information”):
//   Description „Limited to 4000 characters”; Keywords „up to 100 bytes of content” (każde słowo „greater than two characters”);
//   Promotional Text „can't be longer than 170 characters”; What's New „Limited to 4000 characters”, „isn't available for the first version of the app”;
//   Name i Subtitle: 30 znaków (strona „App information”; potwierdzone w tests/store-metadata.test.ts, odczyt 21.10.2026).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeClient, makeJwt, BUNDLE_ID } from './iap-localizations.mjs';

export const LIMITY = { name: 30, subtitle: 30, keywords: 100 /* bajtów */, description: 4000, promotionalText: 170, whatsNew: 4000 };
export const INFO_FIELDS = ['name', 'subtitle', 'privacyPolicyUrl'];
/** Pola, których brak nie jest błędem (marketingUrl nie jest wymagany; whatsNew nie istnieje w pierwszej wersji). */
const OPTIONAL = new Set(['marketingUrl', 'whatsNew']);
export const VERSION_FIELDS = ['description', 'keywords', 'promotionalText', 'supportUrl', 'marketingUrl'];
/** Stany wersji / informacji o aplikacji, w których metadane można edytować (nie: w sprzedaży, w recenzji, zastąpiona). */
export const EDITABLE_STATES = new Set(['PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED', 'INVALID_BINARY']);
/** Kody lokalizacji w plikach `*.store.json` są kodami App Store Connect; jawnie (test pilnuje). null = ASC nie obsługuje: Trening L-003 — słoweński odrzucony przez API
 *  przy zakupach 14.10.2026 (UNSUPPORTED_LOCALE_CODE); dla opisów sklepu niesprawdzone, więc do pierwszego podglądu `sl` jest pomijany jak w Treningu. */
export const LOCALE_MAP = {
  pl: 'pl', 'en-US': 'en-US', 'en-GB': 'en-GB', 'en-AU': 'en-AU', 'en-CA': 'en-CA', cs: 'cs', sk: 'sk', hu: 'hu', ro: 'ro', hr: 'hr', sl: null, uk: 'uk',
  'es-ES': 'es-ES', 'es-MX': 'es-MX', 'pt-PT': 'pt-PT', 'pt-BR': 'pt-BR', 'de-DE': 'de-DE', 'fr-FR': 'fr-FR', it: 'it', 'nl-NL': 'nl-NL', sv: 'sv', da: 'da',
  no: 'no', fi: 'fi', tr: 'tr', el: 'el', id: 'id', ms: 'ms', vi: 'vi', ru: 'ru', ja: 'ja', ko: 'ko', 'zh-Hant': 'zh-Hant',
};

const len = s => [...(s ?? '')].length;
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Wykrywanie nazw innych marek (lista tests/forbidden-names.json; te same reguły co tests/forbidden-names.ts). */
export function makeBrandFinder(cfg) {
  const re = (n, f) => new RegExp(`(?<![\\p{L}\\p{N}_])${esc(n)}(?:a|u|ie|iem|owi|y|ów|em|ach)?(?![\\p{L}\\p{N}_])`, f);
  const ms = [...(cfg?.names ?? []).map(n => [n, re(n, 'u')]), ...(cfg?.namesAnyCase ?? []).map(n => [n, re(n, 'iu')])];
  return s => ms.filter(([, r]) => r.test(s)).map(([n]) => n);
}

/** Scala pliki `*.store.json` (już wczytane: { nazwaPliku: obiekt }) do { lokalizacja: pola EAS }. Sprzeczne wartości tego samego pola = błąd. */
export function mergeStoreFiles(files) {
  const out = {}; const errs = [];
  for (const [file, json] of Object.entries(files)) {
    for (const [loc, fields] of Object.entries(json?.apple?.info ?? {})) {
      out[loc] ??= {};
      for (const [k, v] of Object.entries(fields)) {
        if (k in out[loc] && JSON.stringify(out[loc][k]) !== JSON.stringify(v)) errs.push(`${loc}.${k}: sprzeczne wartości w plikach (ostatni: ${file})`);
        else out[loc][k] = v;
      }
    }
  }
  return { merged: out, errs };
}

/** Wymagane wartości każdej lokalizacji: { info: {...}, version: {...} } (pola EAS → pola API). */
export function buildWanted({ merged }) {
  const out = {};
  for (const [loc, m] of Object.entries(merged)) {
    const kw = Array.isArray(m.keywords) ? m.keywords.join(',') : m.keywords;
    out[loc] = {
      info: { name: m.title, subtitle: m.subtitle, privacyPolicyUrl: m.privacyPolicyUrl },
      version: { description: m.description, keywords: kw, promotionalText: m.promoText, supportUrl: m.supportUrl, marketingUrl: m.marketingUrl,
        ...(m.releaseNotes !== undefined ? { whatsNew: m.releaseNotes } : {}) },
    };
  }
  return out;
}

/** Walidacja przed zapisem: lista { lang, field, problem } (bez treści pól — tylko kod, nazwa pola i liczby). */
export function validate({ wanted, mapping = LOCALE_MAP, findBrands = () => [] }) {
  const errs = [];
  for (const [lang, w] of Object.entries(wanted)) {
    if (!(lang in mapping)) { errs.push({ lang, field: '*', problem: 'brak mapowania kodu lokalizacji na kod App Store Connect' }); continue; }
    if (mapping[lang] === null) continue; // ASC nie obsługuje — wiersz „pomiń” w planie, bez walidacji pól
    for (const [f, v] of Object.entries({ ...w.info, ...w.version })) {
      if ((v === undefined || v === null) && OPTIONAL.has(f)) continue;
      if (v === undefined || v === null || String(v).trim() === '') { errs.push({ lang, field: f, problem: 'puste' }); continue; }
      if (f === 'keywords') { if (Buffer.byteLength(v, 'utf8') > LIMITY.keywords) errs.push({ lang, field: f, problem: `${Buffer.byteLength(v, 'utf8')} B > ${LIMITY.keywords} B` }); }
      else if (LIMITY[f] && len(v) > LIMITY[f]) errs.push({ lang, field: f, problem: `${len(v)} znaków > ${LIMITY[f]}` });
      if (/Url$/.test(f) && !/^https:\/\/\S+$/.test(v)) errs.push({ lang, field: f, problem: 'adres musi zaczynać się od https://' });
      if (findBrands(String(v)).length) errs.push({ lang, field: f, problem: 'nazwa innej marki' });
    }
  }
  return errs;
}

/** Plan dla jednego typu obiektu. existing: Map(kodASC → { id, attrs }). Nic nie usuwa; lokalizacje spoza repo zwraca w `extra`. */
export function planLocalizations({ wanted, part, fields, mapping = LOCALE_MAP, existing }) {
  const rows = []; const used = new Set();
  for (const [lang, w] of Object.entries(wanted)) {
    const locale = mapping[lang];
    if (!locale) { rows.push({ lang, locale: null, action: 'pomiń', fields: {}, reason: 'ASC nie obsługuje tej lokalizacji' }); continue; }
    used.add(locale);
    const want = Object.fromEntries(fields.filter(f => w[part][f] !== undefined).map(f => [f, w[part][f]]));
    const have = existing.get(locale);
    if (!have) { rows.push({ lang, locale, action: 'utwórz', fields: Object.fromEntries(Object.keys(want).map(f => [f, 'nowa'])), create: want }); continue; }
    const st = {}; const patch = {};
    for (const [f, v] of Object.entries(want)) {
      const cur = have.attrs?.[f];
      if ((cur ?? '') === v) st[f] = 'bez zmian'; else { st[f] = cur ? 'zmiana' : 'nowa'; patch[f] = v; }
    }
    rows.push({ lang, locale, action: Object.keys(patch).length ? 'zaktualizuj' : 'bez zmian', fields: st, id: have.id, patch });
  }
  return { rows, extra: [...existing.keys()].filter(l => !used.has(l)) };
}

const toMap = rows => new Map(rows.map(r => [r.attributes.locale, { id: r.id, attrs: r.attributes }]));
/** Klient tylko do odczytu (tryb podglądu): każda metoda poza GET kończy się błędem. */
export const readOnlyClient = c => ({ ...c, call: (m, p, b) => { if (m !== 'GET') throw new Error(`Podgląd jest tylko do odczytu (${m})`); return c.call(m, p, b); } });
const stateOf = r => r.attributes?.appStoreState ?? r.attributes?.appVersionState ?? '';

/** Znajduje aplikację, edytowalną wersję i edytowalną informację o aplikacji oraz ich lokalizacje (tylko GET). */
export async function discover(client) {
  const apps = await client.list('/v1/apps?filter[bundleId]=' + BUNDLE_ID);
  if (apps.length !== 1) throw new Error(`aplikacja ${BUNDLE_ID}: znaleziono ${apps.length}`);
  const appId = apps[0].id;
  const versions = await client.list(`/v1/apps/${appId}/appStoreVersions?filter[platform]=IOS`);
  const version = versions.find(v => EDITABLE_STATES.has(stateOf(v))) ?? null;
  const infos = await client.list(`/v1/apps/${appId}/appInfos`);
  const info = infos.find(i => EDITABLE_STATES.has(stateOf(i))) ?? null;
  return {
    version, info, isFirst: versions.length <= 1, versionStates: versions.map(stateOf),
    infoLocs: info ? toMap(await client.list(`/v1/appInfos/${info.id}/appInfoLocalizations`)) : new Map(),
    verLocs: version ? toMap(await client.list(`/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations`)) : new Map(),
  };
}

const TARGETS = {
  info: { fields: INFO_FIELDS, type: 'appInfoLocalizations', path: '/v1/appInfoLocalizations', rel: id => ({ appInfo: { data: { type: 'appInfos', id } } }) },
  version: { fields: VERSION_FIELDS, type: 'appStoreVersionLocalizations', path: '/v1/appStoreVersionLocalizations', rel: id => ({ appStoreVersion: { data: { type: 'appStoreVersions', id } } }) },
};

/** Tabela Markdown: lokalizacja × pole. */
export function renderTable(rows, fields) {
  const head = `| Lokalizacja | ASC | Działanie | ${fields.join(' | ')} |\n|---|---|---|${fields.map(() => '---').join('|')}|`;
  const body = rows.map(r => `| ${r.lang} | ${r.locale ?? '—'} | ${r.action}${r.error ? ' (błąd)' : ''} | ${fields.map(f => r.fields[f] ?? '—').join(' | ')} |`);
  return [head, ...body].join('\n');
}

/** Główny przebieg. Zwraca { code, rows }. Kod 1: błąd walidacji, brak aplikacji, błąd zapisu; w trybie zapisu także brak edytowalnej wersji. */
export async function run({ client, data, zapis = false, tylko = [], log = console.log, findBrands = () => [] }) {
  let wanted = buildWanted(data);
  if (data.errs?.length) { log('### Pliki metadanych: BŁĘDY\n'); for (const e of data.errs) log(`- ${e}`); log(''); }
  if (tylko.length) {
    const brak = tylko.filter(l => !(l in wanted));
    if (brak.length) { log(`BŁĄD: brak w repo lokalizacji: ${brak.join(', ')}`); return { code: 1, rows: {} }; }
    wanted = Object.fromEntries(Object.entries(wanted).filter(([l]) => tylko.includes(l)));
    log(`Zakres: tylko ${tylko.join(', ')}.\n`);
  }
  log(`## Metadane sklepu → App Store Connect: tryb ${zapis ? 'ZAPIS' : 'PODGLĄD (tylko odczyt)'}\n`);
  const verr = validate({ wanted, findBrands });
  const bad = new Map(verr.map(e => [`${e.lang}/${e.field}`, e.problem]));
  if (verr.length) { log('### Walidacja: BŁĘDY (zapis zablokowany)\n'); for (const e of verr) log(`- ${e.lang} / ${e.field}: ${e.problem}`); log(''); }
  else log(`Walidacja: ${Object.keys(wanted).length} lokalizacji w repo, limity, adresy i nazwy marek w porządku.\n`);
  const c = zapis ? client : readOnlyClient(client);
  let d;
  try { d = await discover(c); } catch (e) { log(`BŁĄD: ${e.message}`); return { code: 1, rows: {} }; }
  let code = verr.length || data.errs?.length ? 1 : 0;
  if (!d.version) {
    log('### Brak edytowalnej wersji aplikacji w App Store Connect\n');
    log(`Stany istniejących wersji: ${d.versionStates.join(', ') || 'brak wersji'}. Krok dla właściciela: w App Store Connect → Oczko → „+” przy iOS App → utwórz wersję 1.0 (stan Prepare for Submission), potem uruchom workflow ponownie.\n`);
  }
  if (zapis && (verr.length || data.errs?.length || !d.version)) { log('Zapis wstrzymany — nic nie zapisano.'); return { code: 1, rows: {} }; }
  const all = {};
  for (const part of ['info', 'version']) {
    const T = TARGETS[part]; const parent = part === 'info' ? d.info : d.version;
    const fields = part === 'version' && !d.isFirst && Object.values(wanted).some(w => w.version.whatsNew !== undefined) ? [...T.fields, 'whatsNew'] : T.fields;
    const label = part === 'info' ? 'Informacje o aplikacji (appInfoLocalizations)' : 'Wersja (appStoreVersionLocalizations)';
    if (!parent) { log(`### ${label}: brak edytowalnego obiektu — pominięto\n`); continue; }
    const { rows, extra } = planLocalizations({ wanted, part, fields, existing: part === 'info' ? d.infoLocs : d.verLocs });
    for (const r of rows) for (const f of fields) if (bad.has(`${r.lang}/${f}`)) r.fields[f] = 'błąd';
    if (zapis) for (const r of rows) {
      if (r.action !== 'utwórz' && r.action !== 'zaktualizuj') continue;
      try {
        if (r.action === 'utwórz') await c.call('POST', T.path, { data: { type: T.type, attributes: { locale: r.locale, ...r.create }, relationships: T.rel(parent.id) } });
        else await c.call('PATCH', `${T.path}/${r.id}`, { data: { type: T.type, id: r.id, attributes: r.patch } });
        r.written = true;
      } catch (e) { r.error = e.message; code = 1; for (const f of fields) if (r.fields[f] !== undefined) r.fields[f] = 'błąd'; log(`BŁĄD ${r.locale}: ${e.message}`); }
    }
    const n = a => rows.filter(r => r.action === a).length;
    log(`### ${label}\n`);
    log(renderTable(rows, fields));
    log(`\nutwórz ${n('utwórz')}, zaktualizuj ${n('zaktualizuj')}, bez zmian ${n('bez zmian')}, pominięte ${n('pomiń')}${zapis ? ', zapisano ' + rows.filter(r => r.written).length : ''}`);
    if (extra.length) log(`Lokalizacje w ASC spoza repozytorium (nietykane): ${extra.join(', ')}`);
    log('');
    all[part] = rows;
  }
  if (!zapis && code === 0) log('Podgląd zakończony — nic nie zapisano. Zapis: uruchom ponownie z trybem „zapis” i zatwierdź środowisko release.');
  return { code, rows: all };
}

/** Wczytuje wszystkie `*.store.json` z katalogu metadanych (bez `produkty.store.json` — to osobny skrypt). */
export function loadStoreFiles(dir) {
  const files = {};
  for (const f of readdirSync(dir).filter(n => n.endsWith('.store.json') && n !== 'produkty.store.json').sort()) files[f] = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  return files;
}

async function main() {
  const args = process.argv.slice(2); const zapis = args.includes('--zapis');
  if (zapis && args.includes('--podglad')) { console.error('Podaj tylko jeden tryb.'); process.exit(2); }
  const i = args.indexOf('--tylko'); const tylko = i >= 0 ? String(args[i + 1] ?? '').split(',').map(x => x.trim()).filter(Boolean) : [];
  if (i >= 0 && (!tylko.length || tylko.some(x => !(x in LOCALE_MAP) || !LOCALE_MAP[x]))) { console.error('--tylko: podaj kody lokalizacji obsługiwanych przez ASC, np. en-US,en-GB.'); process.exit(2); }
  const { ASC_KEY_ID: keyId, ASC_ISSUER_ID: issuerId, ASC_KEY_PATH: keyPath } = process.env;
  if (!keyId || !issuerId || !keyPath) { console.error('Brak ASC_KEY_ID, ASC_ISSUER_ID lub ASC_KEY_PATH.'); process.exit(2); }
  const { merged, errs } = mergeStoreFiles(loadStoreFiles(fileURLToPath(new URL('../../docs/wydanie/metadane/', import.meta.url))));
  const token = makeJwt({ keyId, issuerId, keyPem: readFileSync(keyPath, 'utf8') });
  const { code } = await run({ client: makeClient({ token }), data: { merged, errs }, zapis, tylko });
  process.exit(code);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main().catch(e => { console.error(`Błąd: ${String(e.message).slice(0, 200)}`); process.exit(1); });
