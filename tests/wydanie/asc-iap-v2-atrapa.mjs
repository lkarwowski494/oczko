// Atrapa serwera App Store Connect API dla lokalizacji IAP/subskrypcji w modelu wersji (v2) — w pamięci, bez sieci (rola 10, KO-056, 2026-11-13).
// Kształt wynika z odczytanej dokumentacji Apple (odczyt 2026-11-13, surowy JSON stron dokumentacji):
//   migrating-in-app-purchase-metadata-to-v2.json, working-with-in-app-purchase-versions.json, working-with-subscription-versions.json,
//   working-with-subscription-group-versions.json (cykl życia wersji, relacja `version`, ścieżki GET lokalizacji wersji) oraz OpenAPI 4.6
//   (atrybuty żądań *V2CreateRequest/*V2UpdateRequest). To NIE jest prawdziwy serwer: czy prawdziwy przyjmie te same żądania, pokaże dopiero
//   przebieg właściciela (docs/wydanie/asc-v2/przebieg-wlasciciela.md). Dwa zachowania są w dokumentacji niewyjaśnione i atrapa ma je jako opcję:
//   `dziedziczy` — czy nowa wersja kopiuje lokalizacje poprzedniej (domyślnie nie; skrypt ma działać w obu wariantach).
// Ścieżki spoza modelu v2 (w tym wycofane v1 lokalizacje) kończą się 404 i trafiają do `s.nieznane`; DELETE kończy się błędem testu.
const RODZAJE = {
  group: { wersje: 'subscriptionGroupVersions', lok: 'subscriptionGroupLocalizations', rel: 'subscriptionGroup', rodzic: 'subscriptionGroups', atr: ['name', 'customAppName'] },
  sub: { wersje: 'subscriptionVersions', lok: 'subscriptionLocalizations', rel: 'subscription', rodzic: 'subscriptions', atr: ['name', 'description'] },
  iap: { wersje: 'inAppPurchaseVersions', lok: 'inAppPurchaseLocalizations', rel: 'inAppPurchase', rodzic: 'inAppPurchases', atr: ['name', 'description'] },
};
const PO_WERSJACH = Object.fromEntries(Object.entries(RODZAJE).map(([k, r]) => [r.wersje, k]));
const PO_LOK = Object.fromEntries(Object.entries(RODZAJE).map(([k, r]) => [r.lok, k]));

/** Obiekt atrapy: rodzaj (group|sub|iap), id rodzica, lista wersji (każda: id, n, state, lok[]) i productId (sub, iap). */
export function obiekt(rodzaj, id, wersje = [], productId = null) { return { rodzaj, id, wersje, productId }; }
export function wersja(id, n, state, lok = []) { return { id, n, state, lok: lok.map((l, i) => ({ id: `${id}-L${i}`, ...l })) }; }

export function utworzAtrape({ obiekty, dziedziczy = false, bundleId = 'com.apps4brew.knitting', grupa = 'Oczko Pro' } = {}) {
  const s = { obiekty: obiekty ?? {}, nieznane: [], seq: 0, dziedziczy };
  const calls = [];
  const odp = (status, body) => ({ ok: status < 400, status, json: async () => body });
  const lista = (data) => odp(200, { data, links: {} });
  const blad = (status, title) => odp(status, { errors: [{ code: `E${status}`, title }] });
  const o = (klucz) => s.obiekty[klucz];
  const znajdzWersje = (rodzaj, vid) => { for (const ob of Object.values(s.obiekty)) if (ob.rodzaj === rodzaj) { const w = ob.wersje.find((x) => x.id === vid); if (w) return { ob, w }; } return null; };
  const znajdzLok = (rodzaj, lid) => { for (const ob of Object.values(s.obiekty)) if (ob.rodzaj === rodzaj) for (const w of ob.wersje) { const l = w.lok.find((x) => x.id === lid); if (l) return { ob, w, l }; } return null; };
  const wersjaDto = (rodzaj, w) => ({ id: w.id, type: RODZAJE[rodzaj].wersje, attributes: { version: w.n, state: w.state } });
  const lokDto = (rodzaj, l) => ({ id: l.id, type: RODZAJE[rodzaj].lok, attributes: Object.fromEntries(['locale', ...RODZAJE[rodzaj].atr].filter((k) => l[k] !== undefined).map((k) => [k, l[k]])) });
  const subskrypcje = Object.values(s.obiekty).filter((x) => x.rodzaj === 'sub');

  async function fetchFn(url, init = {}) {
    const u = new URL(url); const m = init.method ?? 'GET'; const path = u.pathname; const q = u.searchParams;
    calls.push({ m, p: path.split('/').map((seg, i) => (i === 1 && /^v\d$/.test(seg) ? seg : /\d/.test(seg) ? '{id}' : seg)).join('/'), raw: path, body: init.body ? JSON.parse(init.body) : null });
    if (m === 'DELETE') throw new Error('DELETE niedozwolone');
    const body = init.body ? JSON.parse(init.body) : null;
    let r;
    if (path === '/v1/apps' && m === 'GET') return lista(q.get('filter[bundleId]') === bundleId ? [{ id: 'APP1', type: 'apps' }] : []);
    if (path === '/v1/apps/APP1/subscriptionGroups' && m === 'GET') return lista(o('group') ? [{ id: o('group').id, type: 'subscriptionGroups', attributes: { referenceName: grupa } }] : []);
    if (o('group') && path === `/v1/subscriptionGroups/${o('group').id}/subscriptions` && m === 'GET')
      return lista(subskrypcje.map((x) => ({ id: x.id, type: 'subscriptions', attributes: { productId: x.productId } })));
    if (path === '/v1/apps/APP1/inAppPurchasesV2' && m === 'GET') {
      const p = q.get('filter[productId]'); return lista(Object.values(s.obiekty).filter((x) => x.rodzaj === 'iap' && (!p || x.productId === p)).map((x) => ({ id: x.id, type: 'inAppPurchases', attributes: { productId: x.productId } })));
    }
    // --- listy wersji rodzica
    if ((r = path.match(/^\/v1\/subscriptionGroups\/([^/]+)\/versions$/)) && m === 'GET') { const ob = Object.values(s.obiekty).find((x) => x.rodzaj === 'group' && x.id === r[1]); return lista((ob?.wersje ?? []).map((w) => wersjaDto('group', w))); }
    if ((r = path.match(/^\/v1\/subscriptions\/([^/]+)\/versions$/)) && m === 'GET') { const ob = subskrypcje.find((x) => x.id === r[1]); return lista((ob?.wersje ?? []).map((w) => wersjaDto('sub', w))); }
    if ((r = path.match(/^\/v2\/inAppPurchases\/([^/]+)\/versions$/)) && m === 'GET') { const ob = Object.values(s.obiekty).find((x) => x.rodzaj === 'iap' && x.id === r[1]); return lista((ob?.wersje ?? []).map((w) => wersjaDto('iap', w))); }
    // --- lokalizacje wersji
    if ((r = path.match(/^\/v1\/([A-Za-z]+Versions)\/([^/]+)\/localizations$/)) && m === 'GET' && PO_WERSJACH[r[1]]) {
      const rodzaj = PO_WERSJACH[r[1]]; const z = znajdzWersje(rodzaj, r[2]); if (!z) return blad(404, 'brak wersji');
      return lista(z.w.lok.map((l) => lokDto(rodzaj, l)));
    }
    // --- tworzenie wersji
    if ((r = path.match(/^\/v1\/([A-Za-z]+Versions)$/)) && m === 'POST' && PO_WERSJACH[r[1]]) {
      const rodzaj = PO_WERSJACH[r[1]]; const R = RODZAJE[rodzaj];
      const rodzic = body?.data?.relationships?.[R.rel]?.data;
      const ob = Object.values(s.obiekty).find((x) => x.rodzaj === rodzaj && x.id === rodzic?.id);
      if (body?.data?.type !== R.wersje || rodzic?.type !== R.rodzic || !ob) return blad(409, 'zła relacja wersji');
      if (ob.wersje.some((w) => w.state === 'PREPARE_FOR_SUBMISSION')) return blad(409, 'wersja robocza już istnieje');
      const n = Math.max(0, ...ob.wersje.map((w) => w.n)) + 1; const poprzednia = ob.wersje.find((w) => w.n === n - 1);
      const nowa = { id: `${ob.id}-V${n}`, n, state: 'PREPARE_FOR_SUBMISSION', lok: s.dziedziczy && poprzednia ? poprzednia.lok.map((l, i) => ({ ...l, id: `${ob.id}-V${n}-K${i}` })) : [] };
      ob.wersje.push(nowa); return odp(201, { data: wersjaDto(rodzaj, nowa) });
    }
    // --- zapis lokalizacji (v2)
    if ((r = path.match(/^\/v2\/([A-Za-z]+Localizations)$/)) && m === 'POST' && PO_LOK[r[1]]) {
      const rodzaj = PO_LOK[r[1]]; const R = RODZAJE[rodzaj]; const a = body?.data?.attributes ?? {}; const rel = body?.data?.relationships?.version?.data;
      if (body?.data?.type !== R.lok || rel?.type !== R.wersje) return blad(409, 'relacja `version` wymagana');
      const z = znajdzWersje(rodzaj, rel.id); if (!z) return blad(404, 'brak wersji');
      if (z.w.state !== 'PREPARE_FOR_SUBMISSION') return blad(409, `wersja w stanie ${z.w.state} jest tylko do odczytu`);
      const obce = Object.keys(a).filter((k) => !['locale', ...R.atr].includes(k)); if (obce.length) return blad(409, `nieznane atrybuty: ${obce.join(',')}`);
      if (!a.locale || !a.name) return blad(409, 'locale i name są wymagane');
      if (z.w.lok.some((l) => l.locale === a.locale)) return blad(409, 'lokalizacja już istnieje');
      const l = { id: `${z.w.id}-N${++s.seq}`, locale: a.locale, ...Object.fromEntries(R.atr.filter((k) => a[k] !== undefined).map((k) => [k, a[k]])) };
      z.w.lok.push(l); return odp(201, { data: lokDto(rodzaj, l) });
    }
    if ((r = path.match(/^\/v2\/([A-Za-z]+Localizations)\/([^/]+)$/)) && m === 'PATCH' && PO_LOK[r[1]]) {
      const rodzaj = PO_LOK[r[1]]; const R = RODZAJE[rodzaj]; const a = body?.data?.attributes ?? {};
      const z = znajdzLok(rodzaj, r[2]); if (!z) return blad(404, 'brak lokalizacji');
      if (body?.data?.type !== R.lok || body?.data?.id !== r[2]) return blad(409, 'zły typ lub id');
      if (z.w.state !== 'PREPARE_FOR_SUBMISSION') return blad(409, `wersja w stanie ${z.w.state} jest tylko do odczytu`);
      const obce = Object.keys(a).filter((k) => !R.atr.includes(k)); if (obce.length) return blad(409, `nieznane atrybuty: ${obce.join(',')}`);
      Object.assign(z.l, a); return odp(200, { data: lokDto(rodzaj, z.l) });
    }
    s.nieznane.push(`${m} ${path}`);
    return blad(404, 'ścieżka spoza modelu v2');
  }
  return { fetchFn, calls, s };
}
