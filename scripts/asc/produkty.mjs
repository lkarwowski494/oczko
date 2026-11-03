// Produkty zakupów w App Store Connect przez API: grupa subskrypcji „Oczko Pro”, 2 subskrypcje, zakup jednorazowy (Non-Consumable), ich ceny,
// Family Sharing i dostępność (rola 10, 2026-11-03, P-467: „chcę wszystko mieć automatycznie” — produkty zakłada workflow, nie właściciel).
// Źródło: docs/wydanie/metadane/produkty.store.json (okresy, ceny, Family Sharing) + docs/monetyzacja.md „Produkty”. Endpointy i cytaty: docs/wydanie/sklep.md
// „Produkty zakupów przez API”. Product ID (nieodwracalne) są w jednym miejscu: stała PRODUCTS w iap-localizations.mjs (test zgodności: tests/wydanie/asc-produkty.test.ts).
//   node scripts/asc/produkty.mjs                          → plan bez zmian (--dry-run, domyślnie)
//   node scripts/asc/produkty.mjs --apply                  → tworzy brakujące (kolejność: grupa, produkt, dostępność, Family Sharing, ceny)
//   node scripts/asc/produkty.mjs --apply --bez-family-sharing → jak wyżej, bez NIEODWRACALNEGO włączenia Family Sharing
// Zasady: ten sam klient co iap-localizations.mjs (tylko GET/POST/PATCH, NIGDY DELETE); idempotentny — produkt znajduje po Product ID (grupę po nazwie referencyjnej),
// tworzy tylko brakujące, nigdy nie zmienia Product ID, nazwy referencyjnej, typu, okresu ani istniejącej ceny (dostępność istniejącego produktu UZUPEŁNIA do wszystkich krajów i nowych krajów — widać w planie). Rozbieżność z planem (inny okres/typ/cena) = STOP w planie:
// przy jakimkolwiek STOP zapis nie rusza niczego (także innych produktów). Bez „Add for Review”, bez ofert wprowadzających (P-057).
// Repozytorium jest publiczne — w logu tylko liczby, kody krajów, Product ID i nazwy; nigdy identyfikatory klucza, tokeny ani odpowiedzi API.
// Dane logowania: ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_PATH (plik .p8) — jak iap-localizations.mjs.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { makeClient, makeJwt, BUNDLE_ID, SUBSCRIPTION_GROUP_NAME, PRODUCTS } from './iap-localizations.mjs';

const SUBS = Object.entries(PRODUCTS).filter(([, p]) => p.kind === 'subscription').map(([k]) => k);
const IAPS = Object.entries(PRODUCTS).filter(([, p]) => p.kind === 'iap').map(([k]) => k);
const rowna = (a, b) => Number(a) === Number(b);
const nie404 = e => { if (e?.status !== 404) throw e; return null; };
const kraj = (r, rel) => r.relationships?.[rel]?.data?.id ?? null;

/** Ceny wskazane przez Apple dla jednego produktu: poziom ceny kraju bazowego, równoważniki w pozostałych krajach, poziomy nadpisań.
 *  `rodzaj`: 'sub' (/v1/subscriptions/{id}/pricePoints, równoważniki: /v1/subscriptionPricePoints/{pp}/equalizations) albo 'iap' (/v2/inAppPurchases/{id}/pricePoints,
 *  równoważniki zakupu jednorazowego liczy Apple sam — nie są potrzebne, bo harmonogram ma tylko cenę bazową i ewentualne ręczne). */
export async function ustalCeny(client, { rodzaj, id, klucz, data }) {
  const baza = data.krajBazowy; const cena = data.produkty[klucz].cenaBazowa;
  const sciezka = rodzaj === 'sub' ? `/v1/subscriptions/${id}/pricePoints` : `/v2/inAppPurchases/${id}/pricePoints`;
  const punkty = async k => client.list(`${sciezka}?filter[territory]=${k}&include=territory`);
  const bazowe = await punkty(baza);
  const pb = bazowe.find(p => rowna(p.attributes?.customerPrice, cena));
  if (!pb) throw new Error(`brak poziomu ceny ${cena} w kraju bazowym ${baza} dla ${PRODUCTS[klucz].productId}`);
  const rownowazniki = new Map();
  if (rodzaj === 'sub') for (const p of await client.list(`/v1/subscriptionPricePoints/${pb.id}/equalizations?include=territory`)) { const k = kraj(p, 'territory'); if (k) rownowazniki.set(k, p.id); }
  const nadpisania = new Map();
  for (const [k, ceny] of Object.entries(data.nadpisaniaCen ?? {})) {
    if (ceny[klucz] === undefined) continue;
    const p = (await punkty(k)).find(x => rowna(x.attributes?.customerPrice, ceny[klucz]));
    if (!p) throw new Error(`brak poziomu ceny ${ceny[klucz]} w kraju ${k} dla ${PRODUCTS[klucz].productId}`);
    nadpisania.set(k, p.id);
  }
  const nazwyPunktow = new Map(bazowe.map(p => [p.id, p.attributes?.customerPrice]));
  return { bazaKraj: baza, bazaPunkt: pb.id, cena, rownowazniki, nadpisania, nazwyPunktow };
}

/** Odczyt stanu App Store Connect (tylko GET): aplikacja, kraje, grupa, produkty i to, co już mają. */
export async function odczytajStan(client, data) {
  const apps = await client.list('/v1/apps?filter[bundleId]=' + BUNDLE_ID);
  if (apps.length !== 1) throw new Error(`aplikacja ${BUNDLE_ID}: znaleziono ${apps.length}`);
  const appId = apps[0].id;
  const kraje = (await client.list('/v1/territories')).map(t => t.id);
  const st = { appId, kraje, grupa: null, produkty: {} };
  const grupy = (await client.list(`/v1/apps/${appId}/subscriptionGroups`)).filter(g => g.attributes?.referenceName === SUBSCRIPTION_GROUP_NAME);
  if (grupy.length > 1) st.zdublowanaGrupa = grupy.length;
  st.grupa = grupy[0] ?? null;
  const subs = st.grupa ? await client.list(`/v1/subscriptionGroups/${st.grupa.id}/subscriptions`) : [];
  for (const klucz of SUBS) {
    const p = subs.find(x => x.attributes?.productId === PRODUCTS[klucz].productId);
    if (!p) { st.produkty[klucz] = null; continue; }
    const wpisy = await client.list(`/v1/subscriptions/${p.id}/prices?include=subscriptionPricePoint,territory`);
    const ceny = new Map(wpisy.map(w => [kraj(w, 'territory'), kraj(w, 'subscriptionPricePoint')]));
    const dost = await client.call('GET', `/v1/subscriptions/${p.id}/subscriptionAvailability`).catch(nie404);
    const dostKraje = dost?.data ? (await client.list(`/v1/subscriptionAvailabilities/${dost.data.id}/availableTerritories`)).map(t => t.id) : [];
    st.produkty[klucz] = { id: p.id, okres: p.attributes.subscriptionPeriod, rodzina: !!p.attributes.familySharable, ceny, dostepnosc: dost?.data ? { nowe: !!dost.data.attributes?.availableInNewTerritories, kraje: dostKraje } : null };
    st.produkty[klucz].wskazane = await ustalCeny(client, { rodzaj: 'sub', id: p.id, klucz, data }).catch(e => ({ blad: e.message }));
  }
  for (const klucz of IAPS) {
    const lista = await client.list(`/v1/apps/${appId}/inAppPurchasesV2?filter[productId]=${PRODUCTS[klucz].productId}`);
    const p = lista.find(x => x.attributes?.productId === PRODUCTS[klucz].productId);
    if (!p) { st.produkty[klucz] = null; continue; }
    const h = await client.call('GET', `/v2/inAppPurchases/${p.id}/iapPriceSchedule`).catch(nie404);
    let harmonogram = null;
    if (h?.data) {
      const baza = (await client.call('GET', `/v1/inAppPurchasePriceSchedules/${h.data.id}/baseTerritory`)).data?.id;
      const reczne = new Map((await client.list(`/v1/inAppPurchasePriceSchedules/${h.data.id}/manualPrices?include=inAppPurchasePricePoint,territory`)).map(w => [kraj(w, 'territory'), kraj(w, 'inAppPurchasePricePoint')]));
      harmonogram = { baza, reczne };
    }
    const dost = await client.call('GET', `/v2/inAppPurchases/${p.id}/inAppPurchaseAvailability`).catch(nie404);
    const dostKraje = dost?.data ? (await client.list(`/v1/inAppPurchaseAvailabilities/${dost.data.id}/availableTerritories`)).map(t => t.id) : [];
    st.produkty[klucz] = { id: p.id, typ: p.attributes.inAppPurchaseType, rodzina: !!p.attributes.familySharable, harmonogram, dostepnosc: dost?.data ? { nowe: !!dost.data.attributes?.availableInNewTerritories, kraje: dostKraje } : null };
    st.produkty[klucz].wskazane = await ustalCeny(client, { rodzaj: 'iap', id: p.id, klucz, data }).catch(e => ({ blad: e.message }));
  }
  return st;
}

/** Plan z samego stanu (czysta funkcja): { akcje, stop, nieodwracalne }. */
export function planuj(st, data, { familySharing = data.familySharing } = {}) {
  const akcje = []; const stop = []; const nieodwracalne = [];
  const dod = (typ, klucz, opis, ile = null, nadpisania = undefined) => akcje.push({ typ, klucz, opis, ile, ...(nadpisania?.length ? { nadpisania } : {}) });
  const nad = k => Object.entries(data.nadpisaniaCen ?? {}).filter(([, c]) => c[k] !== undefined).map(([kr, c]) => `${kr} ${c[k]}`);
  const opNad = k => (nad(k).length ? `; nadpisania: ${nad(k).join(', ')}` : '');
  const id = k => PRODUCTS[k].productId;
  const FS = k => { nieodwracalne.push(`NIEODWRACALNE: Family Sharing dla ${id(k)} (Apple: „once you turn on Family Sharing for an In-App Purchases in App Store Connect, you can't turn it off”)`); };
  if (st.zdublowanaGrupa) stop.push(`grupa subskrypcji „${SUBSCRIPTION_GROUP_NAME}”: znaleziono ${st.zdublowanaGrupa} (nie wybieram sam)`);
  if (!st.grupa) dod('grupa:utworz', 'group', `grupa subskrypcji „${SUBSCRIPTION_GROUP_NAME}”`);
  const dostepnosc = (typ, k, d) => {
    const brak = st.kraje.filter(c => !d?.kraje.includes(c));
    if (!d || brak.length || !d.nowe) dod(typ, k, `dostępność ${id(k)}: wszystkie kraje i nowe kraje`, d ? brak.length : st.kraje.length);
  };
  for (const k of SUBS) {
    const p = st.produkty[k]; const def = data.produkty[k];
    if (!p) {
      dod('subskrypcja:utworz', k, `subskrypcja ${id(k)} (${def.okres}, poziom grupy ${def.poziomGrupy}${familySharing ? ', Family Sharing' : ''})`);
      if (familySharing) FS(k);
      dostepnosc('subskrypcja:dostepnosc', k, null);
      dod('subskrypcja:ceny', k, `ceny ${id(k)}: ${def.cenaBazowa} (kraj bazowy ${data.krajBazowy}) i równoważniki Apple w pozostałych krajach${opNad(k)}`, null, nad(k));
      continue;
    }
    if (p.okres !== def.okres) { stop.push(`${id(k)}: okres w App Store Connect ${p.okres} ≠ ${def.okres} z planu (nie zmieniam okresu istniejącej subskrypcji)`); continue; }
    if (familySharing && !p.rodzina) { dod('subskrypcja:rodzina', k, `Family Sharing ${id(k)}`); FS(k); }
    dostepnosc('subskrypcja:dostepnosc', k, p.dostepnosc);
    const w = p.wskazane;
    if (w.blad) { stop.push(`${id(k)}: ${w.blad}`); continue; }
    const usa = p.ceny.get(data.krajBazowy);
    if (usa && usa !== w.bazaPunkt) { stop.push(`${id(k)}: cena ${data.krajBazowy} w App Store Connect ${w.nazwyPunktow.get(usa) ?? 'inna'} ≠ ${w.cena} z planu (zmiana ceny istniejącego produktu poza zakresem skryptu)`); continue; }
    const oczekiwane = new Map([[data.krajBazowy, w.bazaPunkt], ...w.rownowazniki, ...w.nadpisania]);
    const brak = [...oczekiwane.keys()].filter(c => !p.ceny.has(c));
    if (brak.length) dod('subskrypcja:ceny', k, `ceny ${id(k)}: dokładam ${brak.length} brakujących krajów (istniejące nietykane)`, brak.length);
  }
  for (const k of IAPS) {
    const p = st.produkty[k]; const def = data.produkty[k];
    if (!p) {
      dod('iap:utworz', k, `zakup jednorazowy ${id(k)} (${def.typ}${familySharing ? ', Family Sharing' : ''})`);
      if (familySharing) FS(k);
      dostepnosc('iap:dostepnosc', k, null);
      dod('iap:cena', k, `cena ${id(k)}: ${def.cenaBazowa} (kraj bazowy ${data.krajBazowy}), pozostałe kraje automatycznie (Apple)${opNad(k)}`, null, nad(k));
      continue;
    }
    if (p.typ !== def.typ) { stop.push(`${id(k)}: typ w App Store Connect ${p.typ} ≠ ${def.typ} z planu (nie zmieniam typu)`); continue; }
    if (familySharing && !p.rodzina) { dod('iap:rodzina', k, `Family Sharing ${id(k)}`); FS(k); }
    dostepnosc('iap:dostepnosc', k, p.dostepnosc);
    const w = p.wskazane;
    if (w.blad) { stop.push(`${id(k)}: ${w.blad}`); continue; }
    const h = p.harmonogram;
    if (!h) { dod('iap:cena', k, `cena ${id(k)}: ${def.cenaBazowa} (kraj bazowy ${data.krajBazowy})${opNad(k)}`, null, nad(k)); continue; }
    if (h.baza !== data.krajBazowy) { stop.push(`${id(k)}: kraj bazowy w App Store Connect ${h.baza} ≠ ${data.krajBazowy} z planu (nie zmieniam)`); continue; }
    const usa = h.reczne.get(data.krajBazowy);
    if (usa !== w.bazaPunkt) { stop.push(`${id(k)}: cena ${data.krajBazowy} w App Store Connect ${w.nazwyPunktow.get(usa) ?? 'inna'} ≠ ${w.cena} z planu (zmiana ceny istniejącego produktu poza zakresem skryptu)`); continue; }
    const brak = [...w.nadpisania.keys()].filter(c => !h.reczne.has(c));
    if (brak.length) dod('iap:cena', k, `cena ${id(k)}: dokładam ręczne ceny w ${brak.length} krajach`, brak.length);
  }
  return { akcje, stop, nieodwracalne };
}

/** Klient tylko do odczytu (obrona w głąb): tryb planu nie może zapisać, nawet gdyby kod planu próbował. */
export function tylkoOdczyt(client) {
  return { ...client, call: (m, ...a) => { if (m !== 'GET') throw new Error(`Tryb planu: ${m} niedozwolone (tylko odczyt)`); return client.call(m, ...a); } };
}

const rel = (type, id) => ({ data: { type, id } });

/** Zapis planu (tylko POST/PATCH). Zwraca liczbę błędów; błąd jednego kroku nie przerywa niezależnych kroków. */
export async function zastosuj(client, st, plan, data, { familySharing = data.familySharing, log = console.log } = {}) {
  let bledy = 0; const id = k => PRODUCTS[k].productId;
  const krok = async (opis, f) => { try { await f(); log(`  ${opis} → zapisano`); } catch (e) { bledy++; log(`  ${opis} → BŁĄD ${e.message}`); } };
  const ma = (typ, k) => plan.akcje.some(a => a.typ === typ && a.klucz === k);
  let grupaId = st.grupa?.id;
  if (ma('grupa:utworz', 'group')) await krok(`grupa „${SUBSCRIPTION_GROUP_NAME}”`, async () => {
    grupaId = (await client.call('POST', '/v1/subscriptionGroups', { data: { type: 'subscriptionGroups', attributes: { referenceName: SUBSCRIPTION_GROUP_NAME }, relationships: { app: rel('apps', st.appId) } } })).data.id;
  });
  const wszystkie = st.kraje.map(c => ({ type: 'territories', id: c }));
  const dostepnosc = (typ, nazwa, k, idProduktu, relacja) => krok(`dostępność ${id(k)}`, () => client.call('POST', nazwa, {
    data: { type: typ, attributes: { availableInNewTerritories: true }, relationships: { [relacja[0]]: rel(relacja[1], idProduktu), availableTerritories: { data: wszystkie } } } }));
  for (const k of SUBS) {
    const def = data.produkty[k]; let p = st.produkty[k]; let sid = p?.id; let w = p?.wskazane;
    if (ma('subskrypcja:utworz', k)) {
      if (!grupaId) { bledy++; log(`  subskrypcja ${id(k)} → pominięta (brak grupy)`); continue; }
      await krok(`subskrypcja ${id(k)}`, async () => {
        sid = (await client.call('POST', '/v1/subscriptions', { data: { type: 'subscriptions',
          attributes: { name: def.referenceName, productId: id(k), subscriptionPeriod: def.okres, groupLevel: def.poziomGrupy, ...(familySharing ? { familySharable: true } : {}) },
          relationships: { group: rel('subscriptionGroups', grupaId) } } })).data.id;
      });
      if (!sid) continue;
    }
    if (ma('subskrypcja:dostepnosc', k)) await dostepnosc('subscriptionAvailabilities', '/v1/subscriptionAvailabilities', k, sid, ['subscription', 'subscriptions']);
    if (ma('subskrypcja:rodzina', k)) await krok(`Family Sharing ${id(k)}`, () => client.call('PATCH', `/v1/subscriptions/${sid}`, { data: { type: 'subscriptions', id: sid, attributes: { familySharable: true } } }));
    if (ma('subskrypcja:ceny', k)) {
      try { w = await ustalCeny(client, { rodzaj: 'sub', id: sid, klucz: k, data }); } catch (e) { bledy++; log(`  ceny ${id(k)} → BŁĄD ${e.message}`); continue; }
      const oczekiwane = new Map([[data.krajBazowy, w.bazaPunkt], ...w.rownowazniki, ...w.nadpisania]);
      const maja = p?.ceny ?? new Map(); let n = 0; let b = 0;
      for (const [c, pp] of oczekiwane) {
        if (maja.has(c)) continue;
        try { await client.call('POST', '/v1/subscriptionPrices', { data: { type: 'subscriptionPrices', relationships: { subscription: rel('subscriptions', sid), subscriptionPricePoint: rel('subscriptionPricePoints', pp), territory: rel('territories', c) } } }); n++; }
        catch (e) { b++; bledy++; log(`  cena ${id(k)} ${c} → BŁĄD ${e.message}`); }
      }
      log(`  ceny ${id(k)} → zapisano ${n}${b ? `, błędy ${b}` : ''}`);
    }
  }
  for (const k of IAPS) {
    const def = data.produkty[k]; const p = st.produkty[k]; let iid = p?.id;
    if (ma('iap:utworz', k)) {
      await krok(`zakup jednorazowy ${id(k)}`, async () => {
        iid = (await client.call('POST', '/v2/inAppPurchases', { data: { type: 'inAppPurchases',
          attributes: { name: def.referenceName, productId: id(k), inAppPurchaseType: def.typ, ...(familySharing ? { familySharable: true } : {}) },
          relationships: { app: rel('apps', st.appId) } } })).data.id;
      });
      if (!iid) continue;
    }
    if (ma('iap:dostepnosc', k)) await dostepnosc('inAppPurchaseAvailabilities', '/v1/inAppPurchaseAvailabilities', k, iid, ['inAppPurchase', 'inAppPurchases']);
    if (ma('iap:rodzina', k)) await krok(`Family Sharing ${id(k)}`, () => client.call('PATCH', `/v2/inAppPurchases/${iid}`, { data: { type: 'inAppPurchases', id: iid, attributes: { familySharable: true } } }));
    if (ma('iap:cena', k)) await krok(`cena ${id(k)}`, async () => {
      const w = await ustalCeny(client, { rodzaj: 'iap', id: iid, klucz: k, data });
      const punkty = [w.bazaPunkt, ...[...w.nadpisania.values()]];
      const istniejace = p?.harmonogram ? [...p.harmonogram.reczne.values()] : [];
      const wszystkieReczne = [...new Set([...istniejace, ...punkty])];
      await client.call('POST', '/v1/inAppPurchasePriceSchedules', { data: { type: 'inAppPurchasePriceSchedules',
        relationships: { inAppPurchase: rel('inAppPurchases', iid), baseTerritory: rel('territories', data.krajBazowy), manualPrices: { data: wszystkieReczne.map((_, i) => ({ type: 'inAppPurchasePrices', id: `\${price${i}}` })) } } },
        included: wszystkieReczne.map((pp, i) => ({ type: 'inAppPurchasePrices', id: `\${price${i}}`, attributes: { startDate: null }, relationships: { inAppPurchasePricePoint: rel('inAppPurchasePricePoints', pp) } })) });
    });
  }
  return bledy;
}

/** Główny przebieg: odczyt → plan → (przy apply i braku STOP) zapis. Zwraca { code, plan, bledy }. */
export async function run({ client, data, apply = false, opcje = {}, log = console.log }) {
  const familySharing = opcje.familySharing ?? data.familySharing;
  log(`Tryb: ${apply ? 'APPLY (zapis)' : 'DRY-RUN (bez zmian)'}; kraj bazowy ${data.krajBazowy}; Family Sharing: ${familySharing ? 'TAK (P-466)' : 'NIE (pominięte)'}`);
  const st = await odczytajStan(apply ? client : tylkoOdczyt(client), data);
  const plan = planuj(st, data, { familySharing });
  log(`Stan: grupa ${st.grupa ? 'jest' : 'brak'}; produkty istniejące ${Object.values(st.produkty).filter(Boolean).length} z ${Object.keys(st.produkty).length}; krajów w App Store Connect ${st.kraje.length}`);
  if (!plan.akcje.length && !plan.stop.length) log('Brak zmian: wszystko zgodne z planem.');
  for (const a of plan.akcje) log(`  [utwórz/uzupełnij] ${a.opis}${a.ile !== null ? ` (${a.ile})` : ''}`);
  for (const n of plan.nieodwracalne) log(`  ${n}`);
  for (const s of plan.stop) log(`STOP: ${s}`);
  if (plan.stop.length) { log(`\nSTOP: ${plan.stop.length}. ${apply ? 'Nic nie zapisano' : 'Zapis byłby odmówiony'} — rozstrzyga właściciel w App Store Connect (skrypt nie zmienia istniejących produktów).`); return { code: 1, plan, bledy: 0 }; }
  if (!apply) { log(`\nPodsumowanie planu: ${plan.akcje.length} pozycji, w tym nieodwracalnych ${plan.nieodwracalne.length}.`); return { code: 0, plan, bledy: 0 }; }
  const bledy = await zastosuj(client, st, plan, data, { familySharing, log });
  log(`\nPodsumowanie: ${plan.akcje.length} pozycji planu, błędy zapisu ${bledy}`);
  return { code: bledy ? 1 : 0, plan, bledy };
}

async function main() {
  const args = process.argv.slice(2); const apply = args.includes('--apply');
  if (apply && args.includes('--dry-run')) { console.error('Podaj tylko jeden tryb.'); process.exit(2); }
  const { ASC_KEY_ID: keyId, ASC_ISSUER_ID: issuerId, ASC_KEY_PATH: keyPath } = process.env;
  if (!keyId || !issuerId || !keyPath) { console.error('Brak ASC_KEY_ID, ASC_ISSUER_ID lub ASC_KEY_PATH.'); process.exit(2); }
  const data = JSON.parse(readFileSync(new URL('../../docs/wydanie/metadane/produkty.store.json', import.meta.url), 'utf8'));
  const keyPem = readFileSync(keyPath, 'utf8');
  const opcje = args.includes('--bez-family-sharing') ? { familySharing: false } : {};
  const { code } = await run({ client: makeClient({ token: () => makeJwt({ keyId, issuerId, keyPem }) }), data, apply, opcje });
  process.exit(code);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main().catch(e => { console.error(`Błąd: ${String(e.message).slice(0, 200)}`); process.exit(1); });
