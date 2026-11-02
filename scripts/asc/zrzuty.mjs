// Wgranie zrzutów ekranu do App Store Connect przez API. Przeniesione z Treningu (P-315, P-316 (4); wzór: scripts/asc/zrzuty.mjs tamtego repo, 2e4b0f8;
// tam decyzja właściciela 25.10.2026, D2, i poprawki po przebiegach 41008000769 i 41023082786). Z artefaktu zrzutów sklepu (iPhone, iPad: katalogi jak niżej)
// i opcjonalnie zegarka do edytowalnej wersji aplikacji, dla wszystkich lokalizacji. Kontrola wymiarów i alfy (`file`) przed wgraniem: sklep.md §5.
//   node scripts/asc/zrzuty.mjs --iphone <katalog> [--ipad <katalog>] [--zegarek <katalog>] [--dry-run]   → plan bez zapisu (domyślnie)
//   node scripts/asc/zrzuty.mjs --iphone <katalog> [--ipad <katalog>] [--zegarek <katalog>] --apply       → wgrywa i układa zrzuty
//   dodatkowo `--jezyki cs,en` — tylko wskazane języki aplikacji (puste albo brak = wszystkie; przebieg dowodowy na jednym–dwóch językach)
// Układ katalogów: <katalog>/<język aplikacji>/NN-<ekran>.png (iPhone: jeden rozmiar, np. artefakt `sklep-zrzuty-ramki/6.9`) i <katalog>/<język>/<stan>.png (zegarek).
// Interfejs: App Asset Library (Apple oznaczył appScreenshotSets i appScreenshots jako przestarzałe; odczyt dokumentacji 25.10.2026 —
// developer.apple.com/documentation/appstoreconnectapi/app-asset-library): obraz wgrywany raz (rezerwacja → PUT → `uploaded: true`), potem placement
// (APP_SCREENSHOT) na lokalizacji wersji i kolejność jednym żądaniem. Grupę urządzeń (placementGroup) wybiera skrypt z danych referencyjnych API
// (`appAssetLibraryRefData`) na podstawie dokładnych wymiarów pliku — identyfikatory nie są wpisane w kodzie (Apple: „Don’t hard-code them”).
// Naprawa po przebiegu 41008000769 (30.10.2026, wgrano 0 z 64 zestawów); odczyt dokumentacji 30.10.2026 (developer.apple.com/documentation/appstoreconnectapi/):
//  - uploading-and-managing-image-assets: przetwarzanie jest asynchroniczne (UPLOAD_COMPLETE → PREPARE_FOR_SUBMISSION albo FAILED); lista biblioteki
//    `GET /v1/appAssetLibraries/{id}/images` (filtry m.in. referenceName, state; stronicowanie) — filtr po referenceName służy do znajdowania porzuconych rezerwacji;
//    binarium obrazu jest niezmienne po commicie.
//  - get-v1-appassetlibraries-_id_-images: parametry filter[referenceName], filter[state], filter[category], filter[id], filter[specId], limit.
//  - placing-assets-on-your-app-store-surfaces i understanding-the-app-asset-library: placement do lokalizacji wersji wystarcza — „Placements travel through App Review as part
//    of their parent surface”, stan placementu odzwierciedla stan wersji; „Add for Review” w interfejsie to stan obrazu biblioteki, nie osobny krok.
//  - 409 ENTITY_ERROR.ATTRIBUTE.INVALID.DUPLICATE: dokumentacja nie wskazuje atrybutu. Wniosek z logu 41008000769: języki cs, da, de-DE… wgrywały pliki o tych samych nazwach
//    (np. 01-….png) bez 409, a en-GB/en-AU/en-CA (ta sama referenceName `…/en/…` co en-US) dostały 409 — duplikatem jest więc referenceName, unikalna w bibliotece (nie fileName
//    i prawdopodobnie nie suma pliku). Dlatego obraz najpierw wyszukujemy po referenceName (cała lista biblioteki), a 409 DUPLICATE obsługujemy ponownym wyszukaniem.
// Zasady: NIGDY nie usuwa (klient: tylko GET, POST, PATCH; PUT tylko na adresy z rezerwacji); grupa, która ma już zrzuty, jest pomijana (zamiana zrzutów
// = ręcznie w App Store Connect); zapis tylko do edytowalnej wersji; w logu tylko kody lokalizacji, nazwy plików i liczby — nigdy adresy wgrywania,
// identyfikatory klucza, tokeny ani treść odpowiedzi API (repozytorium publiczne). Dane logowania: ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_PATH.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeClient, makeJwt, BUNDLE_ID } from './iap-localizations.mjs';
import { EDITABLE_STATES, LOCALE_MAP, readOnlyClient } from './metadane.mjs';

/** Token JWT (ważny 10 min) odnawiany po 8 minutach — przebieg trwa dłużej niż jeden token (401 po ok. 12 min w przebiegu 41008000769). */
export const TOKEN_MAX_AGE_MS = 8 * 60 * 1000;
/** Czekanie na przetworzenie obrazu po stronie Apple: do 30 min na obraz (część obrazów była „Processing” po ponad 10 min); odstęp rośnie od 5 s do 60 s. */
export const WAIT_MS = 30 * 60 * 1000;
export const POLL_START_MS = 5000;
export const POLL_MAX_MS = 60000;
export const PLACEMENT_TYPE = 'APP_SCREENSHOT';
export const ASSET_CATEGORY = 'APP_SCREENSHOTS_AND_PREVIEWS';
export const FEATURE_ID = 'APP_STORE_VERSIONS';
/** Limit Apple na grupę, gdy dane referencyjne go nie podają (strona „Discovering asset specifications”: 10 zrzutów na grupę). */
export const DEFAULT_MAX_PER_GROUP = 10;
/** Język aplikacji (katalog w artefakcie zrzutów) → kody lokalizacji repo/ASC (klucze LOCALE_MAP). Pusta lista = sklep nie ma tej lokalizacji (docs/wzrost.md, kolumna lokalizacji sklepu). */
export const SHOT_LOCALES = {
  pl: ['pl'], en: ['en-US', 'en-GB', 'en-AU', 'en-CA'], cs: ['cs'], sk: ['sk'], hu: ['hu'], ro: ['ro'], bg: [], hr: ['hr'], sl: [], sr: [], lt: [], lv: [], et: [],
  uk: ['uk'], es: ['es-ES'], 'es-419': ['es-MX'], pt: ['pt-PT'], 'pt-BR': ['pt-BR'], de: ['de-DE'], fr: ['fr-FR'], it: ['it'], nl: ['nl-NL'], sv: ['sv'], da: ['da'],
  nb: ['no'], fi: ['fi'], tr: ['tr'], el: ['el'], id: ['id'], ms: ['ms'], vi: ['vi'], ru: ['ru'], ja: ['ja'], ko: ['ko'], 'zh-Hant': ['zh-Hant'],
};

export function tokenProvider({ mint, now = Date.now, maxAgeMs = TOKEN_MAX_AGE_MS }) {
  let token = null; let at = 0;
  return () => { if (token === null || now() - at >= maxAgeMs) { token = mint(); at = now(); } return token; };
}

/** Wejście `jezyki`: lista kodów języków aplikacji rozdzielona przecinkami → tablica (puste = wszystkie) albo { error }. */
export function parseLangs(text) {
  const items = String(text ?? '').split(',').map(x => x.trim()).filter(Boolean);
  if (items.some(x => !/^[A-Za-z0-9-]{2,10}$/.test(x))) return { error: 'kody języków mogą zawierać tylko litery, cyfry i myślnik, rozdzielone przecinkami' };
  const bad = items.filter(x => !(x in SHOT_LOCALES));
  if (bad.length) return { error: `nieznany język aplikacji: ${bad.join(', ')} (brak w SHOT_LOCALES)` };
  return [...new Set(items)];
}

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
/** Wymiary i kanał alfa z nagłówka PNG (IHDR). Inny format → błąd (zrzuty z naszych workflowów są PNG). */
export function pngInfo(buf) {
  if (buf.length < 26 || !buf.subarray(0, 8).equals(PNG_SIG)) throw new Error('to nie jest plik PNG');
  const colorType = buf[25];
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), alpha: colorType === 4 || colorType === 6 };
}

/** Grupy urządzeń, do których pasuje plik o danych wymiarach: wymiary → specyfikacje obrazu (bez alfa) → grupy z `specMappings` typu APP_SCREENSHOT. */
export function groupsFor({ refData, width, height }) {
  const specs = (refData.imageSpecs ?? []).filter(s => s.alphaAllowed === false && s.dimensions && s.dimensions.minWidth <= width && width <= s.dimensions.maxWidth
    && s.dimensions.minHeight <= height && height <= s.dimensions.maxHeight && (s.compatiblePlacementTypes ?? [PLACEMENT_TYPE]).includes(PLACEMENT_TYPE)).map(s => s.specId);
  const type = (refData.placementTypes ?? []).find(t => t.placementTypeId === PLACEMENT_TYPE);
  const groups = (type?.specMappings ?? []).filter(m => (m.specs ?? []).some(id => specs.includes(id))).map(m => m.placementGroupId);
  return [...new Set(groups)];
}

/** Limit zrzutów na grupę z danych referencyjnych (feature APP_STORE_VERSIONS, polityka APP_SCREENSHOT); brak danych → 10. */
export function maxPerGroup(refData, group) {
  for (const f of refData.features ?? []) {
    if ((f.featureId ?? f.feature ?? f.id) !== FEATURE_ID) continue;
    for (const p of f.placementPolicies ?? []) {
      if ((p.placementTypeId ?? p.placementType) !== PLACEMENT_TYPE) continue;
      for (const g of p.groupLimits ?? []) if ((g.groupIds ?? []).includes(group) && Number.isInteger(g.maxCount)) return g.maxCount;
    }
  }
  return DEFAULT_MAX_PER_GROUP;
}

/** Wczytuje katalog <język>/*.png → Map(język → [{ name, path, size, width, height, alpha }]) posortowane po nazwie; błędy plików osobno. */
export function readShots(dir, fs = { readdirSync, readFileSync, statSync, existsSync }) {
  const out = new Map(); const problems = [];
  if (!dir || !fs.existsSync(dir)) return { shots: out, problems: dir ? [`brak katalogu ${dir}`] : [] };
  for (const lang of fs.readdirSync(dir).filter(n => !n.startsWith('.')).sort()) {
    const p = join(dir, lang); if (!fs.statSync(p).isDirectory()) continue;
    const list = [];
    for (const f of fs.readdirSync(p).filter(n => /\.png$/i.test(n)).sort()) {
      try { const buf = fs.readFileSync(join(p, f)); list.push({ name: f, path: join(p, f), size: buf.length, ...pngInfo(buf) }); }
      catch (e) { problems.push(`${lang}/${f}: ${e.message}`); }
    }
    if (list.length) out.set(lang, list);
  }
  return { shots: out, problems };
}

/** Wczytuje zrzuty iPhone, iPada (Oczko ma `ios.supportsTablet`, więc iPad 13″ jest wymagany) i zegarka; `jezyki` (np. „cs,en”) zawęża do wskazanych języków
 *  (każdy musi mieć katalog iPhone). Źródła przechodzą przez ten sam typ APP_SCREENSHOT; grupę urządzeń wybierają wymiary pliku. */
export function loadShots({ iphone, ipad, zegarek, jezyki = '' }) {
  const a = readShots(iphone); const c = readShots(ipad); const b = readShots(zegarek); const problems = [...a.problems, ...c.problems, ...b.problems];
  const langs = parseLangs(jezyki);
  if (langs.error) return { shots: { iphone: new Map() }, problems: [...problems, langs.error] };
  const pick = m => langs.length ? new Map([...m].filter(([l]) => langs.includes(l))) : m;
  const ip = pick(a.shots);
  for (const l of langs) if (!ip.has(l)) problems.push(`brak zrzutów dla języka ${l} (katalog iPhone)`);
  const pad = pick(c.shots); const wt = pick(b.shots);
  return { shots: { iphone: ip, ...(pad.size ? { ipad: pad } : {}), ...(wt.size ? { zegarek: wt } : {}) }, problems };
}

const stateOf = r => r.attributes?.appStoreState ?? r.attributes?.appVersionState ?? '';
/** Aplikacja, edytowalna wersja iOS i jej lokalizacje (tylko GET). */
export async function discover(client) {
  const apps = await client.list('/v1/apps?filter[bundleId]=' + BUNDLE_ID);
  if (apps.length !== 1) throw new Error(`aplikacja ${BUNDLE_ID}: znaleziono ${apps.length}`);
  const appId = apps[0].id;
  const versions = await client.list(`/v1/apps/${appId}/appStoreVersions?filter[platform]=IOS`);
  const version = versions.find(v => EDITABLE_STATES.has(stateOf(v))) ?? null;
  const locs = version ? new Map((await client.list(`/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations`)).map(r => [r.attributes.locale, r.id])) : new Map();
  const lib = await client.call('GET', `/v1/apps/${appId}/assetLibrary`);
  const refRes = await client.call('GET', '/v1/appAssetLibraryRefData');
  const refData = refRes?.data?.[0]?.attributes ?? refRes?.data?.attributes ?? {};
  return { appId, version, locs, libraryId: lib?.data?.id ?? null, refData, versionStates: versions.map(stateOf) };
}

/**
 * Plan: lista { source, lang, locale, locId, group, files[], action, reason }. Nic nie zapisuje. `existing(locId, group)` → liczba istniejących placementów grupy.
 * Źródła: 'iphone', 'ipad' i 'zegarek' (wszystkie przez ten sam typ APP_SCREENSHOT; grupa z wymiarów pliku).
 */
export async function plan({ shots, locs, refData, existing }) {
  const rows = []; const errors = [];
  for (const [source, byLang] of Object.entries(shots)) {
    for (const [lang, files] of byLang) {
      if (!(lang in SHOT_LOCALES)) { errors.push(`${source}/${lang}: nieznany język aplikacji (brak w SHOT_LOCALES)`); continue; }
      const locales = SHOT_LOCALES[lang];
      if (!locales.length) { rows.push({ source, lang, locale: null, action: 'pomiń', reason: 'sklep nie ma tej lokalizacji (docs/wzrost.md, kolumna lokalizacji sklepu)' }); continue; }
      const byGroup = new Map();
      for (const f of files) {
        if (f.alpha) { errors.push(`${source}/${lang}/${f.name}: kanał alfa (Apple: obrazy bez alfa)`); continue; }
        const g = groupsFor({ refData, width: f.width, height: f.height });
        if (g.length !== 1) { errors.push(`${source}/${lang}/${f.name}: ${f.width}×${f.height} — ${g.length ? 'niejednoznaczna grupa urządzeń (' + g.join(', ') + ')' : 'brak pasującej specyfikacji w danych Apple'}`); continue; }
        if (!byGroup.has(g[0])) byGroup.set(g[0], []); byGroup.get(g[0]).push(f);
      }
      for (const [group, gf] of byGroup) {
        const max = maxPerGroup(refData, group);
        if (gf.length > max) { errors.push(`${source}/${lang}: ${gf.length} zrzutów w grupie ${group} > limit ${max}`); continue; }
        for (const locale of locales) {
          if (!LOCALE_MAP[locale]) { rows.push({ source, lang, locale, group, action: 'pomiń', reason: 'lokalizacja nieobsługiwana w ASC' }); continue; }
          const locId = locs.get(LOCALE_MAP[locale]);
          if (!locId) { rows.push({ source, lang, locale, group, files: gf, action: 'pomiń', reason: 'brak lokalizacji wersji w ASC (najpierw workflow „ASC metadane sklepu”)' }); continue; }
          const have = await existing(locId, group);
          if (have > 0) { rows.push({ source, lang, locale, locId, group, files: gf, action: 'pomiń', reason: `grupa ma już ${have} zrzutów (nic nie usuwam)${have < gf.length ? ` — niekompletna: ${have} z ${gf.length} zrzutów (częściowy zapis); dokończ ręcznie w App Store Connect` : ''}` }); continue; }
          rows.push({ source, lang, locale, locId, group, files: gf, action: 'wgraj', reason: '' });
        }
      }
    }
  }
  return { rows, errors };
}

export const renderTable = rows => ['| Źródło | Język | Lokalizacja | Grupa urządzeń | Zrzuty | Działanie |', '|---|---|---|---|---|---|',
  ...rows.map(r => `| ${r.source} | ${r.lang} | ${r.locale ?? '—'} | ${r.group ?? '—'} | ${r.files?.length ?? 0} | ${r.action}${r.reason ? ' — ' + r.reason : ''}${r.error ? ' (błąd)' : ''} |`)].join('\n');

const isReady = st => !!st && !['AWAITING_UPLOAD', 'UPLOAD_COMPLETE', 'FAILED'].includes(st);
/** Obraz biblioteki nadaje się do ponownego użycia, gdy nie jest zepsuty ani zarchiwizowany i ma ten sam rozmiar pliku (binarium jest niezmienne). */
const usable = (img, size) => img.size === size && !['FAILED', 'AWAITING_UPLOAD', 'ARCHIVED', 'REJECTED'].includes(img.state);
export const findReusable = (lib, ref, size) => lib.filter(i => i.ref === ref && usable(i, size)).sort((x, y) => y.created.localeCompare(x.created))[0] ?? null;
export const readLibrary = async (client, libraryId) => (await client.list(`/v1/appAssetLibraries/${libraryId}/images`))
  .map(r => ({ id: r.id, ref: r.attributes?.referenceName ?? '', size: r.attributes?.fileSize, state: r.attributes?.state ?? '', created: r.attributes?.createdDate ?? '' }));

/** Rezerwacja → PUT (części) → commit. Zwraca id obrazu; czekanie na przetworzenie jest osobno (wszystkie obrazy najpierw, potem stany). */
export async function reserveAndUpload({ client, fetchFn, libraryId, refName, file, body }) {
  const res = await client.call('POST', '/v1/appAssetLibraryImages', { data: { type: 'appAssetLibraryImages',
    attributes: { fileName: file.name, fileSize: body.length, category: ASSET_CATEGORY, referenceName: refName },
    relationships: { assetLibrary: { data: { type: 'appAssetLibraries', id: libraryId } } } } });
  const id = res.data.id;
  for (const op of res.data.attributes.uploadOperations ?? []) {
    const headers = Object.fromEntries((op.requestHeaders ?? []).map(h => [h.name, h.value]));
    const r = await fetchFn(op.url, { method: op.method, headers, body: body.subarray(op.offset, op.offset + op.length) });
    if (!r.ok) throw new Error(`wgrywanie części pliku ${file.name} → ${r.status}`);
  }
  await client.call('PATCH', `/v1/appAssetLibraryImages/${id}`, { data: { type: 'appAssetLibraryImages', id, attributes: { uploaded: true } } });
  return id;
}

/** Obraz dla nazwy referencyjnej: istniejący w bibliotece (z tego albo poprzedniego przebiegu) albo nowy. Zły stary obraz dostaje nową nazwę (nic nie usuwam). */
export async function obtainImage({ client, fetchFn, libraryId, lib, refName, file, body, now }) {
  const found = findReusable(lib, refName, body.length);
  if (found) return { id: found.id, file, reused: true, since: now(), done: isReady(found.state) };
  for (const old of lib.filter(i => i.ref === refName)) {
    await client.call('PATCH', `/v1/appAssetLibraryImages/${old.id}`, { data: { type: 'appAssetLibraryImages', id: old.id, attributes: { referenceName: `${refName} [zastąpiony ${String(old.id).slice(0, 8)}]` } } });
  }
  try {
    return { id: await reserveAndUpload({ client, fetchFn, libraryId, refName, file, body }), file, reused: false, since: now(), done: false };
  } catch (e) {
    if (e.status !== 409 || !/DUPLICATE/.test(e.message)) throw e;
    const again = findReusable(await readLibrary(client, libraryId), refName, body.length); /* obraz istnieje, choć lista go nie pokazała */
    if (!again) throw new Error(`nazwa referencyjna ${file.name} zajęta w bibliotece, a obrazu nie da się użyć ponownie (inny rozmiar albo stan)`);
    return { id: again.id, file, reused: true, since: now(), done: isReady(again.state) };
  }
}

/** Czeka na przetworzenie wszystkich obrazów naraz (rosnący odstęp, do WAIT_MS na obraz); ustawia `done` albo `error` na każdym. */
export async function waitForImages({ client, images, sleep, now }) {
  let delay = POLL_START_MS;
  for (;;) {
    const pending = images.filter(i => !i.done && !i.error);
    if (!pending.length) return;
    for (const im of pending) {
      try {
        const st = (await client.call('GET', `/v1/appAssetLibraryImages/${im.id}`)).data.attributes.state;
        if (st === 'FAILED') im.error = `przetwarzanie ${im.file.name} nie powiodło się (szczegóły w App Store Connect)`;
        else if (isReady(st)) im.done = true;
      } catch (e) { im.error = `odczyt stanu ${im.file.name}: ${e.message}`; }
      if (!im.done && !im.error && now() - im.since >= WAIT_MS) im.error = `przetwarzanie ${im.file.name} trwa zbyt długo`;
    }
    if (images.some(i => !i.done && !i.error)) { await sleep(delay); delay = Math.min(Math.round(delay * 1.5), POLL_MAX_MS); }
  }
}

/** Główny przebieg. Zwraca { code, rows }. Kod 1: błędy planu (pliki, grupy), brak aplikacji, brak edytowalnej wersji w trybie apply, błąd zapisu. */
export async function run({ client, fetchFn, shots, problems = [], apply = false, log = console.log, read = p => readFileSync(p), sleep = ms => new Promise(r => setTimeout(r, ms)), now = () => Date.now() }) {
  log(`## Zrzuty ekranu → App Store Connect: tryb ${apply ? 'APPLY' : 'DRY-RUN (tylko odczyt)'}\n`);
  let code = problems.length ? 1 : 0;
  for (const p of problems) log(`BŁĄD pliku: ${p}`);
  const c = apply ? client : readOnlyClient(client);
  let d;
  try { d = await discover(c); } catch (e) { log(`BŁĄD: ${e.message}`); return { code: 1, rows: [] }; }
  if (!d.version || !d.libraryId) {
    log(!d.version ? `### Brak edytowalnej wersji aplikacji w App Store Connect\n\nStany wersji: ${d.versionStates.join(', ') || 'brak wersji'}. Utwórz wersję 1.0 (Prepare for Submission) i uruchom ponownie.` : '### Brak biblioteki zasobów aplikacji (assetLibrary)');
    return { code: apply ? 1 : code, rows: [] };
  }
  const existing = async (locId, group) => {
    const q = `/v1/appStoreVersionLocalizations/${locId}/placements?filter[placementType]=${PLACEMENT_TYPE}&filter[placementGroup]=${group}`;
    return (await c.list(q)).length;
  };
  const { rows, errors } = await plan({ shots, locs: d.locs, refData: d.refData, existing });
  if (errors.length) { code = 1; log('### Błędy planu (zapis zablokowany)\n'); for (const e of errors) log(`- ${e}`); log(''); }
  const refOf = (r, f) => `oczko-1.0/${r.source}/${r.lang}/${f.name}`;
  const planned = new Map(); for (const r of rows.filter(x => x.action === 'wgraj')) for (const f of r.files) planned.set(refOf(r, f), f);
  let lib = [];
  if (planned.size && !(apply && code)) {
    lib = await readLibrary(c, d.libraryId);
    log(`W bibliotece już ${[...planned].filter(([ref, f]) => findReusable(lib, ref, f.size)).length} z ${planned.size} obrazów planu (zostaną użyte ponownie).\n`);
  }
  const n = a => rows.filter(r => r.action === a).length;
  if (apply && code) { log('Zapis wstrzymany — nic nie zapisano.'); return { code: 1, rows }; }
  if (apply) {
    const images = new Map(); /* nazwa referencyjna → obraz: ten sam plik angielski służy czterem lokalizacjom */
    for (const [ref, f] of planned) {
      try { images.set(ref, await obtainImage({ client, fetchFn, libraryId: d.libraryId, lib, refName: ref, file: f, body: read(f.path), now })); }
      catch (e) { images.set(ref, { file: f, error: e.message }); }
    }
    const all = [...images.values()];
    log(`Obrazy: wgrano ${all.filter(i => !i.error && !i.reused).length}, użyto ponownie ${all.filter(i => i.reused).length}, błędy ${all.filter(i => i.error).length}; czekam na przetworzenie.`);
    await waitForImages({ client, images: all.filter(i => !i.error), sleep, now });
    for (const r of rows.filter(x => x.action === 'wgraj')) {
      try {
        const imgs = r.files.map(f => images.get(refOf(r, f)));
        const bad = imgs.find(i => i.error); if (bad) throw new Error(bad.error);
        const placed = [];
        for (const { id } of imgs) {
          const p = await client.call('POST', '/v1/appAssetLibraryPlacements', { data: { type: 'appAssetLibraryPlacements', attributes: { placementType: PLACEMENT_TYPE, placementGroup: r.group },
            relationships: { image: { data: { type: 'appAssetLibraryImages', id } }, appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: r.locId } } } } });
          placed.push({ type: 'appAssetLibraryPlacements', id: p.data.id });
        }
        await client.call('POST', '/v1/appAssetLibraryPlacementOrderingRequests', { data: { type: 'appAssetLibraryPlacementOrderingRequests', attributes: { placementGroup: r.group },
          relationships: { orderedPlacements: { data: placed }, appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: r.locId } } } } });
        r.written = true;
      } catch (e) { r.error = e.message; code = 1; log(`BŁĄD ${r.source}/${r.locale}: ${e.message}`); }
    }
  }
  log(renderTable(rows));
  log(`\nwgraj ${n('wgraj')}, pomiń ${n('pomiń')}${apply ? ', zapisano ' + rows.filter(r => r.written).length : ''}`);
  if (!apply && code === 0) log('Dry-run zakończony — nic nie zapisano. Zapis: uruchom ponownie z trybem „apply” i zatwierdź środowisko release.');
  return { code, rows };
}

async function main() {
  const args = process.argv.slice(2); const apply = args.includes('--apply');
  if (apply && args.includes('--dry-run')) { console.error('Podaj tylko jeden tryb.'); process.exit(2); }
  const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : ''; };
  const { ASC_KEY_ID: keyId, ASC_ISSUER_ID: issuerId, ASC_KEY_PATH: keyPath } = process.env;
  if (!keyId || !issuerId || !keyPath) { console.error('Brak ASC_KEY_ID, ASC_ISSUER_ID lub ASC_KEY_PATH.'); process.exit(2); }
  if (!opt('--iphone')) { console.error('Podaj --iphone <katalog>.'); process.exit(2); }
  const { shots, problems } = loadShots({ iphone: opt('--iphone'), ipad: opt('--ipad'), zegarek: opt('--zegarek'), jezyki: opt('--jezyki') });
  const tokenFor = tokenProvider({ mint: () => makeJwt({ keyId, issuerId, keyPem: readFileSync(keyPath, 'utf8') }) });
  const { code } = await run({ client: makeClient({ token: tokenFor }), fetchFn: fetch, shots, problems, apply });
  process.exit(code);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main().catch(e => { console.error(`Błąd: ${String(e.message).slice(0, 200)}`); process.exit(1); });
