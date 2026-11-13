// Dopisanie lokalizacji produktów zakupu (grupa subskrypcji + 2 subskrypcje + zakup jednorazowy) w App Store Connect przez API.
// Przeniesione z Treningu (P-315, P-316 (4); wzór: scripts/asc/iap-localizations.mjs tamtego repo, 2e4b0f8), dostosowane do Oczka (rola 10, 2026-11-01).
// KO-056 (sesja BG, 2026-11-13; decyzja właściciela 13.11 „To zróbmy tą migrację teraz”; P-789): zapis przez zasoby v2 — lokalizacja należy do WERSJI
// (InAppPurchaseVersion, SubscriptionVersion, SubscriptionGroupVersion), nie do produktu; zasoby v1 (lokalizacje, obrazy, *Submissions) są wycofane.
// Źródło Apple, odczyt 2026-11-13 (surowy JSON stron dokumentacji, adres + cytat w docs/wydanie/asc-v2/inwentarz.md):
//   https://developer.apple.com/tutorials/data/documentation/appstoreconnectapi/migrating-in-app-purchase-metadata-to-v2.json — mapowanie v1 → v2;
//   .../working-with-in-app-purchase-versions.json, .../working-with-subscription-versions.json, .../working-with-subscription-group-versions.json —
//   „`PREPARE_FOR_SUBMISSION`: The version is open for editing”, „Versions are read-only after creation. To change a version’s contents, create a new version.”
// Trening NIE zmigrował tego skryptu (main @2d975814, 2026-11-11: iap-localizations.mjs:103-117 nadal v1) — wybór wersji to własna rekomendacja (P-789, do weta):
// edytowalna wersja robocza (PREPARE_FOR_SUBMISSION) jest używana; gdy jej nie ma, a teksty się różnią, skrypt tworzy nową (POST …Versions) i planuje względem JEJ
// odczytanych lokalizacji (Apple nie opisuje, czy nowa wersja dziedziczy lokalizacje poprzedniej — `[DO USTALENIA]`); lokalizacje spoza pliku (obce) kopiuje do nowej wersji.
// Wersja w recenzji (READY_FOR_REVIEW, WAITING_FOR_REVIEW, IN_REVIEW) i różne teksty → PROBLEM (kod 1), bez zapisu. Skrypt NIE wysyła niczego do recenzji.
// Źródło tekstów: docs/wydanie/metadane/produkty.store.json (jedno źródło prawdy). Grupa subskrypcji jest znajdowana po nazwie referencyjnej
// („Oczko Pro”, docs/monetyzacja.md „Produkty”). Produkty zakłada wcześniej workflow asc-produkty (scripts/asc/produkty.mjs, P-467) — ten skrypt uruchamiaj PO nim.
//   node scripts/asc/iap-localizations.mjs            → plan bez zmian (--dry-run, domyślnie)
//   node scripts/asc/iap-localizations.mjs --apply    → tworzy brakujące i aktualizuje różniące się (w razie potrzeby tworzy wersję roboczą)
// Zasady: NIGDY nie usuwa (klient dopuszcza tylko GET, POST, PATCH i odmawia wycofanych ścieżek: scripts/asc/wycofane-endpointy.mjs); wszystkie lokalizacje (także en-US i pl)
// z pliku źródłowego zapisuje skrypt (P-467: koniec wyjątku właściciela); język z polem `czeka` (pl: P-422) jest tylko pokazany w planie, bez zapisu;
// repozytorium jest publiczne — w logu tylko liczby, kody lokalizacji i nazwy produktów, nigdy identyfikatory klucza, tokeny ani odpowiedzi API.
// Dane logowania z zmiennych środowiskowych: ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_PATH (plik .p8).
// Grupa subskrypcji (P-517): `customAppName` = pełna nazwa aplikacji z docs/wydanie/metadane/nazwy.store.json (apple.info[<ascLocale>].title; jedno źródło prawdy, P-174) —
// bez niego opcja „Use App Name” pokazuje nazwę z języka podstawowego (pl) we wszystkich lokalizacjach. Brak nazwy dla lokalizacji = błąd planu.
// Limit długości customAppName: Apple go NIE podaje (odczyt 2026-11-03: https://developer.apple.com/tutorials/data/documentation/appstoreconnectapi/subscriptiongrouplocalization/attributes-data.dictionary.json
// — `customAppName: string`, bez maxLength; tak samo w SubscriptionGroupLocalizationCreateRequest/UpdateRequest; pomoc ASC „Auto-renewable subscription information”, wiersz
// App Name Display Options — bez limitu). Założenie nazwane: nazwy pochodzą z pola Name (≤ 30 znaków, test tests/wydanie/iap-nazwa-aplikacji.test.ts) — potwierdzi pierwszy zapis.
import { createPrivateKey, sign as cryptoSign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { wycofany } from './wycofane-endpointy.mjs';

export const BUNDLE_ID = 'com.apps4brew.knitting';
export const SUBSCRIPTION_GROUP_NAME = 'Oczko Pro';
export const PRODUCTS = {
  monthly: { productId: 'oczko.pro.monthly', kind: 'subscription' },
  yearly: { productId: 'oczko.pro.yearly', kind: 'subscription' },
  lifetime: { productId: 'oczko.pro.lifetime', kind: 'iap' },
};
export const API = 'https://api.appstoreconnect.apple.com';
const ALLOWED_METHODS = new Set(['GET', 'POST', 'PATCH']);

const b64u = b => Buffer.from(b).toString('base64url');
/** Token JWT ES256 (ważny 10 minut) — bez zależności, tylko `crypto`. */
export function makeJwt({ keyId, issuerId, keyPem, now = Math.floor(Date.now() / 1000) }) {
  const head = b64u(JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' }));
  const body = b64u(JSON.stringify({ iss: issuerId, iat: now, exp: now + 600, aud: 'appstoreconnect-v1' }));
  const sig = cryptoSign('sha256', Buffer.from(`${head}.${body}`), { key: createPrivateKey(keyPem), dsaEncoding: 'ieee-p1363' });
  return `${head}.${body}.${b64u(sig)}`;
}

/** Klient API: tylko GET/POST/PATCH; stronicowanie przez links.next; błąd bez treści odpowiedzi (tylko status, kody i tytuły).
 *  `token`: tekst albo fabryka `() => tekst` wywoływana przy każdym żądaniu (długie przebiegi odnawiają token; zgodne wstecz ze stałym tokenem). */
export function makeClient({ fetchFn = fetch, token, sleep = ms => new Promise(r => setTimeout(r, ms)) }) {
  async function call(method, path, body) {
    if (!ALLOWED_METHODS.has(method)) throw new Error(`Niedozwolona metoda ${method} — skrypt nigdy nie usuwa`);
    const url = path.startsWith('http') ? path : API + path;
    // Token nigdy nie opuszcza api.appstoreconnect.apple.com (np. `links.next` z podstawionej odpowiedzi); przegląd bezpieczeństwa 2026-11-03.
    if (!url.startsWith(API + '/')) throw new Error('Adres spoza API App Store Connect — odmowa');
    // 10-wydanie-002 (BI): maska tylko dla segmentów z cyfrą lub myślnikiem (identyfikatory); nazwy zasobów (same litery) zostają w komunikacie.
    const wyc = wycofany(new URL(url).pathname); // KO-056: zasoby wycofane przez Apple nie są wołane (zastępstwo: model wersji v2)
    if (wyc) throw new Error(`Wycofany endpoint ${method} ${new URL(url).pathname.replace(/\/(?=[A-Za-z_]*[\d-])[0-9A-Za-z_-]{6,}/g, '/{id}')} — odmowa (zastępstwo: ${wyc.zastepstwo})`);
    for (let attempt = 0; ; attempt++) {
      const res = await fetchFn(url, { method, headers: { Authorization: `Bearer ${typeof token === 'function' ? token() : token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      if (res.status === 429 && attempt < 3) { await sleep(2000 * (attempt + 1)); continue; }
      let json = null; try { json = await res.json(); } catch { json = null; }
      if (!res.ok) {
        const errs = (json?.errors ?? []).map(e => [e.code, e.title].filter(Boolean).join(': ')).filter(Boolean).join('; ');
        const err = new Error(`${method} ${path.split('?')[0].replace(/\/[0-9a-f-]{8,}/gi, '/{id}')} → ${res.status}${errs ? ` (${errs})` : ''}`); err.status = res.status; throw err;
      }
      return json;
    }
  }
  async function list(path) {
    const out = []; let next = path + (path.includes('?') ? '&' : '?') + 'limit=200';
    while (next) { const j = await call('GET', next); out.push(...(j?.data ?? [])); next = j?.links?.next ?? null; }
    return out;
  }
  return { call, list };
}

/** Plan dla jednego obiektu: istniejące lokalizacje (locale → {id, name, description}) kontra tłumaczenia. */
export function planObject({ key, translations, existing, hasDescription, appNames = null }) {
  const fields = [...(hasDescription ? ['name', 'description'] : ['name']), ...(appNames ? ['customAppName'] : [])];
  const same = (a, b) => fields.every(f => (a?.[f] ?? '') === (b?.[f] ?? ''));
  const items = [];
  for (const [lang, tr] of Object.entries(translations)) {
    if (tr.czeka) { items.push({ key, lang, locale: tr.ascLocale ?? null, action: 'czeka', reason: `czeka na ${tr.czeka}${tr.czekaPowod ? ` (${tr.czekaPowod})` : ''}` }); continue; }
    if (!tr.ascLocale) { items.push({ key, lang, locale: null, action: 'pomiń', reason: 'brak lokalizacji w App Store Connect' }); continue; }
    const have = existing.get(tr.ascLocale);
    if (appNames && !appNames[tr.ascLocale]) { items.push({ key, lang, locale: tr.ascLocale, action: 'błąd', reason: `brak nazwy aplikacji dla ${tr.ascLocale} w nazwy.store.json (customAppName)` }); continue; }
    const want = appNames ? { ...tr[key], customAppName: appNames[tr.ascLocale] } : tr[key];
    if (!have) items.push({ key, lang, locale: tr.ascLocale, action: 'utwórz', want });
    else if (same(have, want)) items.push({ key, lang, locale: tr.ascLocale, action: 'pomiń', reason: 'bez zmian' });
    else items.push({ key, lang, locale: tr.ascLocale, action: 'zaktualizuj', id: have.id, want });
  }
  const known = new Set(Object.values(translations).map(t => t.ascLocale).filter(Boolean));
  const extra = [...existing.keys()].filter(l => !known.has(l));
  return { items, extra };
}

const toMap = rows => new Map(rows.map(r => [r.attributes.locale, { id: r.id, name: r.attributes.name, description: r.attributes.description, customAppName: r.attributes.customAppName }]));

// Model wersji (v2): rodzaj → ścieżki i kształty żądań (Apple, odczyt 2026-11-13: migrating-in-app-purchase-metadata-to-v2, working-with-*-versions; atrybuty: OpenAPI 4.6).
export const RODZAJE = {
  group: { wersjeType: 'subscriptionGroupVersions', locType: 'subscriptionGroupLocalizations', relacja: 'subscriptionGroup', rodzicType: 'subscriptionGroups',
    wersje: id => `/v1/subscriptionGroups/${id}/versions`, lokWersji: vid => `/v1/subscriptionGroupVersions/${vid}/localizations`, tworzWersje: '/v1/subscriptionGroupVersions', tworzLok: '/v2/subscriptionGroupLocalizations' },
  sub: { wersjeType: 'subscriptionVersions', locType: 'subscriptionLocalizations', relacja: 'subscription', rodzicType: 'subscriptions',
    wersje: id => `/v1/subscriptions/${id}/versions`, lokWersji: vid => `/v1/subscriptionVersions/${vid}/localizations`, tworzWersje: '/v1/subscriptionVersions', tworzLok: '/v2/subscriptionLocalizations' },
  iap: { wersjeType: 'inAppPurchaseVersions', locType: 'inAppPurchaseLocalizations', relacja: 'inAppPurchase', rodzicType: 'inAppPurchases',
    wersje: id => `/v2/inAppPurchases/${id}/versions`, lokWersji: vid => `/v1/inAppPurchaseVersions/${vid}/localizations`, tworzWersje: '/v1/inAppPurchaseVersions', tworzLok: '/v2/inAppPurchaseLocalizations' },
};
const ROBOCZA = 'PREPARE_FOR_SUBMISSION';
const W_RECENZJI = new Set(['READY_FOR_REVIEW', 'WAITING_FOR_REVIEW', 'IN_REVIEW']);
const patchAttrs = (t, w) => (t.hasDescription ? { name: w.name, description: w.description } : t.appName ? { name: w.name, customAppName: w.customAppName } : { name: w.name });
const createAttrs = (t, locale, w) => ({ locale, name: w.name, ...(t.hasDescription ? { description: w.description } : {}), ...(t.appName ? { customAppName: w.customAppName } : {}) });

/** Znajduje obiekty w App Store Connect. Cel: obiekt rodzica (id, rodzaj) — wersje i lokalizacje czyta `wczytajWersje`. */
export async function discover(client, log) {
  const targets = []; const problems = [];
  try {
    const groups = await client.list('/v1/apps?filter[bundleId]=' + BUNDLE_ID);
    if (groups.length !== 1) throw new Error(`aplikacja ${BUNDLE_ID}: znaleziono ${groups.length}`);
    const appId = groups[0].id;
    const sg = await client.list(`/v1/apps/${appId}/subscriptionGroups`);
    const grupy = sg.filter(g => g.attributes?.referenceName === SUBSCRIPTION_GROUP_NAME);
    if (grupy.length !== 1) throw new Error(`grupa subskrypcji „${SUBSCRIPTION_GROUP_NAME}”: znaleziono ${grupy.length} (najpierw uruchom workflow asc-produkty)`);
    const group = grupy[0];
    targets.push({ key: 'group', label: 'grupa subskrypcji', rodzaj: 'group', parentId: group.id, hasDescription: false, appName: true });
    const subs = await client.list(`/v1/subscriptionGroups/${group.id}/subscriptions`);
    for (const [key, p] of Object.entries(PRODUCTS).filter(([, p]) => p.kind === 'subscription')) {
      const s = subs.find(x => x.attributes.productId === p.productId);
      if (!s) { problems.push(`brak subskrypcji ${p.productId}`); continue; }
      targets.push({ key, label: p.productId, rodzaj: 'sub', parentId: s.id, hasDescription: true });
    }
    // Zakup jednorazowy (Non-Consumable)
    const lt = PRODUCTS.lifetime;
    const iaps = await client.list(`/v1/apps/${appId}/inAppPurchasesV2?filter[productId]=${lt.productId}`);
    const iap = iaps.find(x => x.attributes.productId === lt.productId);
    if (!iap) problems.push(`brak produktu ${lt.productId}`);
    else targets.push({ key: 'lifetime', label: lt.productId, rodzaj: 'iap', parentId: iap.id, hasDescription: true });
  } catch (e) { problems.push(e.message); }
  return { targets, problems };
}

/** Wersje produktu i lokalizacje wersji „bieżącej”: roboczej (PREPARE_FOR_SUBMISSION), a gdy jej nie ma — najnowszej. Czyta, nie zapisuje. */
export async function wczytajWersje(client, t) {
  const R = RODZAJE[t.rodzaj];
  const wersje = (await client.list(R.wersje(t.parentId))).map(v => ({ id: v.id, n: Number(v.attributes?.version ?? 0), state: v.attributes?.state ?? '' })).sort((a, b) => b.n - a.n);
  const robocza = wersje.find(v => v.state === ROBOCZA) ?? null;
  const biezaca = robocza ?? wersje[0] ?? null;
  const existing = biezaca ? toMap(await client.list(R.lokWersji(biezaca.id))) : new Map();
  return { wersje, robocza, biezaca, existing, wRecenzji: wersje.filter(v => W_RECENZJI.has(v.state)) };
}

/** Lokalizacje starej wersji (kody), których plan NIE zapisuje (brak akcji utwórz/zaktualizuj/pomiń „bez zmian”): obce, `czeka`, błąd planu. Po utworzeniu nowej wersji bez dziedziczenia zniknęłyby (10-wydanie-001). */
export function lokalizacjeDoPrzeniesienia(plan, existing) {
  const zapisywane = new Set(plan.items.filter(i => i.locale && ['utwórz', 'zaktualizuj', 'pomiń'].includes(i.action)).map(i => i.locale));
  return [...existing.keys()].filter(l => !zapisywane.has(l));
}

/** Główny przebieg. Zwraca { code, counts } (code 1 przy brakujących obiektach, wersji w recenzji z innymi tekstami lub błędach zapisu). */
export async function run({ client, data, apply = false, log = console.log, appNames = {} }) {
  const { targets, problems } = await discover(client, log);
  log(`Tryb: ${apply ? 'APPLY (zapis)' : 'DRY-RUN (bez zmian)'}; obiektów znalezionych: ${targets.length} z 4`);
  const counts = { 'utwórz': 0, 'zaktualizuj': 0, 'pomiń': 0, 'czeka': 0, 'błąd': 0, błędy: 0, wersje: 0 };
  for (const t of targets) {
    const R = RODZAJE[t.rodzaj];
    const planuj = existing => planObject({ key: t.key, translations: data.tlumaczenia, existing, hasDescription: t.hasDescription, appNames: t.appName ? appNames : null });
    let v;
    try { v = await wczytajWersje(client, t); } catch (e) { counts.błędy++; problems.push(`${t.label}: odczyt wersji — ${e.message}`); continue; }
    let plan = planuj(v.existing);
    const zmiany = plan.items.some(i => i.action === 'utwórz' || i.action === 'zaktualizuj');
    const stan = v.biezaca ? `wersja ${v.biezaca.n}, ${v.biezaca.state}` : 'brak wersji';
    log(`\n== ${t.label} (${stan}; istniejących lokalizacji: ${v.existing.size}) ==`);
    let wersjaId = v.robocza?.id ?? null; let zapis = true;
    if (!wersjaId && zmiany) {
      if (v.wRecenzji.length) {
        const w = v.wRecenzji[0]; zapis = false;
        problems.push(`${t.label}: wersja ${w.n} w stanie ${w.state} (w recenzji, tylko do odczytu) — teksty różnią się od pliku; nie tworzę kolejnej wersji (poczekaj na wynik recenzji albo wycofaj wysyłkę w App Store Connect)`);
        log(`  [wersja w recenzji: ${w.state}] zapis zablokowany`);
      } else {
        // 10-wydanie-001 (BI): lokalizacje starej wersji, których plan nie zapisuje (obca, `czeka`, błąd planu), przechodzą do nowej wersji — zawsze, bo Apple może jej nie dziedziczyć.
        const doPrzeniesienia = lokalizacjeDoPrzeniesienia(plan, v.existing);
        const nieprzenosne = doPrzeniesienia.filter(l => !v.existing.get(l)?.name);
        log(`  [do przeniesienia do nowej wersji (kopia; nic nie jest usuwane): ${doPrzeniesienia.length ? doPrzeniesienia.join(', ') : 'brak'}]`);
        if (nieprzenosne.length) {
          zapis = false;
          problems.push(`${t.label}: nie można przenieść lokalizacji ${nieprzenosne.join(', ')} do nowej wersji (brak nazwy w starej wersji; POST lokalizacji wymaga \`name\`) — nie tworzę nowej wersji (uzupełnij lokalizację w App Store Connect albo usuń ją tam ręcznie)`);
        } else if (!apply) log('  [nowa wersja zostanie utworzona; plan względem ostatniej wersji — po utworzeniu odczyt lokalizacji nowej wersji może go zmienić]');
        else {
          try {
            const nowa = await client.call('POST', R.tworzWersje, { data: { type: R.wersjeType, relationships: { [R.relacja]: { data: { type: R.rodzicType, id: t.parentId } } } } });
            wersjaId = nowa?.data?.id; if (!wersjaId) throw new Error('odpowiedź bez id wersji');
            counts.wersje++; log(`  nowa wersja → utworzona (stan ${ROBOCZA})`);
            const stare = v.existing; const stareDoKopii = doPrzeniesienia; // lokalizacje poprzedniej wersji bez zapisu w planie; nowa wersja może je dziedziczyć albo być pusta
            const nowaMapa = toMap(await client.list(R.lokWersji(wersjaId)));
            const planStary = plan;
            plan = planuj(nowaMapa);
            for (const l of stareDoKopii) { // lokalizacja z poprzedniej wersji znika z nowej, jeśli Apple jej nie dziedziczy: kopia (nigdy nie usuwa)
              if (nowaMapa.has(l)) continue;
              const it = planStary.items.find(i => i.locale === l);
              plan.items.push({ key: t.key, lang: it ? `${it.lang} (kopia)` : '(obca)', locale: l, action: 'utwórz', want: stare.get(l), reason: `kopia z poprzedniej wersji, ${it ? `plan: ${it.action}` : 'poza plikiem źródłowym'}` });
            }
          } catch (e) { counts.błędy++; zapis = false; problems.push(`${t.label}: tworzenie wersji — ${e.message}`); }
        }
      }
    }
    if (plan.extra.length) log(`  [obce, nietykane] ${plan.extra.join(', ')}`);
    for (const it of plan.items) {
      let note = it.reason ? ` (${it.reason})` : '';
      if (apply && zapis && wersjaId && (it.action === 'utwórz' || it.action === 'zaktualizuj')) {
        try {
          if (it.action === 'utwórz') await client.call('POST', R.tworzLok, { data: { type: R.locType, attributes: createAttrs(t, it.locale, it.want), relationships: { version: { data: { type: R.wersjeType, id: wersjaId } } } } });
          else await client.call('PATCH', `/v2/${R.locType}/${it.id}`, { data: { type: R.locType, id: it.id, attributes: patchAttrs(t, it.want) } });
          note = ' → zapisano';
        } catch (e) { counts.błędy++; note = ` → BŁĄD ${e.message}`; }
      }
      counts[it.action]++;
      log(`  ${it.lang} → ${it.locale ?? '-'}: ${it.action}${note}`);
    }
  }
  for (const p of problems) log(`PROBLEM: ${p}`);
  log(`\nPodsumowanie: utwórz ${counts['utwórz']}, zaktualizuj ${counts['zaktualizuj']}, pomiń ${counts['pomiń']}, czeka ${counts['czeka']}, błędy planu ${counts['błąd']}, błędy zapisu ${counts.błędy}, nowe wersje ${counts.wersje}, problemy ${problems.length}`);
  return { code: problems.length || counts.błędy || counts['błąd'] ? 1 : 0, counts, problems };
}

async function main() {
  const args = process.argv.slice(2); const apply = args.includes('--apply');
  if (apply && args.includes('--dry-run')) { console.error('Podaj tylko jeden tryb.'); process.exit(2); }
  const { ASC_KEY_ID: keyId, ASC_ISSUER_ID: issuerId, ASC_KEY_PATH: keyPath } = process.env;
  if (!keyId || !issuerId || !keyPath) { console.error('Brak ASC_KEY_ID, ASC_ISSUER_ID lub ASC_KEY_PATH.'); process.exit(2); }
  const data = JSON.parse(readFileSync(new URL('../../docs/wydanie/metadane/produkty.store.json', import.meta.url), 'utf8'));
  const appNames = Object.fromEntries(Object.entries(JSON.parse(readFileSync(new URL('../../docs/wydanie/metadane/nazwy.store.json', import.meta.url), 'utf8')).apple.info).map(([k, v]) => [k, v.title]));
  const token = makeJwt({ keyId, issuerId, keyPem: readFileSync(keyPath, 'utf8') });
  const { code } = await run({ client: makeClient({ token }), data, apply, appNames });
  process.exit(code);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main().catch(e => { console.error(`Błąd: ${String(e.message).slice(0, 200)}`); process.exit(1); });
