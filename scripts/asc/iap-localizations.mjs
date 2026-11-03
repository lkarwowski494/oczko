// Dopisanie lokalizacji produktów zakupu (grupa subskrypcji + 2 subskrypcje + zakup jednorazowy) w App Store Connect przez API.
// Przeniesione z Treningu (P-315, P-316 (4); wzór: scripts/asc/iap-localizations.mjs tamtego repo, 2e4b0f8), dostosowane do Oczka (rola 10, 2026-11-01).
// Źródło tekstów: docs/wydanie/metadane/produkty.store.json (jedno źródło prawdy). Grupa subskrypcji jest znajdowana po nazwie referencyjnej
// („Oczko Pro”, docs/monetyzacja.md „Produkty”). Produkty zakłada wcześniej workflow asc-produkty (scripts/asc/produkty.mjs, P-467) — ten skrypt uruchamiaj PO nim.
//   node scripts/asc/iap-localizations.mjs            → plan bez zmian (--dry-run, domyślnie)
//   node scripts/asc/iap-localizations.mjs --apply    → tworzy brakujące i aktualizuje różniące się
// Zasady: NIGDY nie usuwa (klient dopuszcza tylko GET, POST, PATCH); wszystkie lokalizacje (także en-US i pl) z pliku źródłowego zapisuje skrypt (P-467: koniec wyjątku
// właściciela); język z polem `czeka` (pl: P-422) jest tylko pokazany w planie, bez zapisu;
// repozytorium jest publiczne — w logu tylko liczby, kody lokalizacji i nazwy produktów, nigdy identyfikatory klucza, tokeny ani odpowiedzi API.
// Dane logowania z zmiennych środowiskowych: ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_PATH (plik .p8).
import { createPrivateKey, sign as cryptoSign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

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
export function planObject({ key, translations, existing, hasDescription }) {
  const fields = hasDescription ? ['name', 'description'] : ['name'];
  const same = (a, b) => fields.every(f => (a?.[f] ?? '') === (b?.[f] ?? ''));
  const items = [];
  for (const [lang, tr] of Object.entries(translations)) {
    if (tr.czeka) { items.push({ key, lang, locale: tr.ascLocale ?? null, action: 'czeka', reason: `czeka na ${tr.czeka}${tr.czekaPowod ? ` (${tr.czekaPowod})` : ''}` }); continue; }
    if (!tr.ascLocale) { items.push({ key, lang, locale: null, action: 'pomiń', reason: 'brak lokalizacji w App Store Connect' }); continue; }
    const have = existing.get(tr.ascLocale); const want = tr[key];
    if (!have) items.push({ key, lang, locale: tr.ascLocale, action: 'utwórz', want });
    else if (same(have, want)) items.push({ key, lang, locale: tr.ascLocale, action: 'pomiń', reason: 'bez zmian' });
    else items.push({ key, lang, locale: tr.ascLocale, action: 'zaktualizuj', id: have.id, want });
  }
  const known = new Set(Object.values(translations).map(t => t.ascLocale).filter(Boolean));
  const extra = [...existing.keys()].filter(l => !known.has(l));
  return { items, extra };
}

const toMap = rows => new Map(rows.map(r => [r.attributes.locale, { id: r.id, name: r.attributes.name, description: r.attributes.description }]));

/** Znajduje obiekty w App Store Connect i ich istniejące lokalizacje. Zwraca listę celów (cel = obiekt z `existing`, ścieżkami tworzenia i aktualizacji). */
export async function discover(client, log) {
  const targets = []; const problems = [];
  // Grupa subskrypcji
  try {
    const groups = await client.list('/v1/apps?filter[bundleId]=' + BUNDLE_ID);
    if (groups.length !== 1) throw new Error(`aplikacja ${BUNDLE_ID}: znaleziono ${groups.length}`);
    const appId = groups[0].id;
    const sg = await client.list(`/v1/apps/${appId}/subscriptionGroups`);
    const grupy = sg.filter(g => g.attributes?.referenceName === SUBSCRIPTION_GROUP_NAME);
    if (grupy.length !== 1) throw new Error(`grupa subskrypcji „${SUBSCRIPTION_GROUP_NAME}”: znaleziono ${grupy.length} (najpierw uruchom workflow asc-produkty)`);
    const group = grupy[0];
    const locs = await client.list(`/v1/subscriptionGroups/${group.id}/subscriptionGroupLocalizations`);
    targets.push({ key: 'group', label: 'grupa subskrypcji', hasDescription: false, existing: toMap(locs),
      create: (locale, w) => ({ type: 'subscriptionGroupLocalizations', attributes: { locale, name: w.name }, relationships: { subscriptionGroup: { data: { type: 'subscriptionGroups', id: group.id } } } }),
      createPath: '/v1/subscriptionGroupLocalizations', updatePath: id => `/v1/subscriptionGroupLocalizations/${id}`, updateType: 'subscriptionGroupLocalizations' });
    const subs = await client.list(`/v1/subscriptionGroups/${group.id}/subscriptions`);
    for (const [key, p] of Object.entries(PRODUCTS).filter(([, p]) => p.kind === 'subscription')) {
      const s = subs.find(x => x.attributes.productId === p.productId);
      if (!s) { problems.push(`brak subskrypcji ${p.productId}`); continue; }
      const l = await client.list(`/v1/subscriptions/${s.id}/subscriptionLocalizations`);
      targets.push({ key, label: p.productId, hasDescription: true, existing: toMap(l),
        create: (locale, w) => ({ type: 'subscriptionLocalizations', attributes: { locale, name: w.name, description: w.description }, relationships: { subscription: { data: { type: 'subscriptions', id: s.id } } } }),
        createPath: '/v1/subscriptionLocalizations', updatePath: id => `/v1/subscriptionLocalizations/${id}`, updateType: 'subscriptionLocalizations' });
    }
    // Zakup jednorazowy (Non-Consumable)
    const lt = PRODUCTS.lifetime;
    const iaps = await client.list(`/v1/apps/${appId}/inAppPurchasesV2?filter[productId]=${lt.productId}`);
    const iap = iaps.find(x => x.attributes.productId === lt.productId);
    if (!iap) problems.push(`brak produktu ${lt.productId}`);
    else {
      const l = await client.list(`/v2/inAppPurchases/${iap.id}/inAppPurchaseLocalizations`);
      targets.push({ key: 'lifetime', label: lt.productId, hasDescription: true, existing: toMap(l),
        create: (locale, w) => ({ type: 'inAppPurchaseLocalizations', attributes: { locale, name: w.name, description: w.description }, relationships: { inAppPurchaseV2: { data: { type: 'inAppPurchases', id: iap.id } } } }),
        createPath: '/v1/inAppPurchaseLocalizations', updatePath: id => `/v1/inAppPurchaseLocalizations/${id}`, updateType: 'inAppPurchaseLocalizations' });
    }
  } catch (e) { problems.push(e.message); }
  return { targets, problems };
}

/** Główny przebieg. Zwraca { code, counts } (code 1 przy brakujących obiektach lub błędach zapisu). */
export async function run({ client, data, apply = false, log = console.log }) {
  const { targets, problems } = await discover(client, log);
  log(`Tryb: ${apply ? 'APPLY (zapis)' : 'DRY-RUN (bez zmian)'}; obiektów znalezionych: ${targets.length} z 4`);
  const counts = { 'utwórz': 0, 'zaktualizuj': 0, 'pomiń': 0, 'czeka': 0, błędy: 0 };
  for (const t of targets) {
    const plan = planObject({ key: t.key, translations: data.tlumaczenia, existing: t.existing, hasDescription: t.hasDescription });
    log(`\n== ${t.label} (istniejących lokalizacji: ${t.existing.size}) ==`);
    if (plan.extra.length) log(`  [obce, nietykane] ${plan.extra.join(', ')}`);
    for (const it of plan.items) {
      let note = it.reason ? ` (${it.reason})` : '';
      if (apply && (it.action === 'utwórz' || it.action === 'zaktualizuj')) {
        try {
          if (it.action === 'utwórz') await client.call('POST', t.createPath, { data: t.create(it.locale, it.want) });
          else await client.call('PATCH', t.updatePath(it.id), { data: { type: t.updateType, id: it.id, attributes: t.hasDescription ? { name: it.want.name, description: it.want.description } : { name: it.want.name } } });
          note = ' → zapisano';
        } catch (e) { counts.błędy++; note = ` → BŁĄD ${e.message}`; }
      }
      counts[it.action]++;
      log(`  ${it.lang} → ${it.locale ?? '-'}: ${it.action}${note}`);
    }
  }
  for (const p of problems) log(`PROBLEM: ${p}`);
  log(`\nPodsumowanie: utwórz ${counts['utwórz']}, zaktualizuj ${counts['zaktualizuj']}, pomiń ${counts['pomiń']}, czeka ${counts['czeka']}, błędy zapisu ${counts.błędy}, problemy ${problems.length}`);
  return { code: problems.length || counts.błędy ? 1 : 0, counts, problems };
}

async function main() {
  const args = process.argv.slice(2); const apply = args.includes('--apply');
  if (apply && args.includes('--dry-run')) { console.error('Podaj tylko jeden tryb.'); process.exit(2); }
  const { ASC_KEY_ID: keyId, ASC_ISSUER_ID: issuerId, ASC_KEY_PATH: keyPath } = process.env;
  if (!keyId || !issuerId || !keyPath) { console.error('Brak ASC_KEY_ID, ASC_ISSUER_ID lub ASC_KEY_PATH.'); process.exit(2); }
  const data = JSON.parse(readFileSync(new URL('../../docs/wydanie/metadane/produkty.store.json', import.meta.url), 'utf8'));
  const token = makeJwt({ keyId, issuerId, keyPem: readFileSync(keyPath, 'utf8') });
  const { code } = await run({ client: makeClient({ token }), data, apply });
  process.exit(code);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main().catch(e => { console.error(`Błąd: ${String(e.message).slice(0, 200)}`); process.exit(1); });
