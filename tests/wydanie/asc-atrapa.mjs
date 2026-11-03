// Atrapa serwera App Store Connect API (tylko to, czego używa scripts/asc/produkty.mjs) — w pamięci, bez sieci (rola 10, P-467).
// Zachowanie atrapy wynika z odczytanej dokumentacji Apple (docs/wydanie/sklep.md „Produkty zakupów przez API”), nie z prawdziwego serwera:
// to, że prawdziwy serwer przyjmie te same żądania, potwierdzi dopiero pierwszy przebieg workflowu (STOP w raporcie roli).
// Rejestruje każde żądanie (metoda + ścieżka bez identyfikatorów) w `calls`; DELETE kończy się błędem testu.

// CHN jest w atrapie jak na prawdziwym serwerze (Apple zwraca 175 terytoriów); skrypt ma je pominąć (P-479).
const TERYTORIA = ['USA', 'POL', 'DEU', 'JPN', 'FRA', 'GBR', 'CHN'];
/** Poziomy cen: dla USA ceny z planu; równoważniki w pozostałych krajach (tablica jak z „equalizations”). */
const POZIOMY_USA = ['0.99', '1.99', '6.99', '14.99'];
const ROWNOWAZNIKI = {
  '0.99': { POL: '3.99', DEU: '0.99', JPN: '150', FRA: '0.99', GBR: '0.79', CHN: '6' },
  '1.99': { POL: '8.99', DEU: '1.99', JPN: '300', FRA: '1.99', GBR: '1.79', CHN: '12' },
  '6.99': { POL: '29.99', DEU: '6.99', JPN: '1000', FRA: '6.99', GBR: '5.99', CHN: '45' },
  '14.99': { POL: '64.99', DEU: '14.99', JPN: '2200', FRA: '14.99', GBR: '11.99', CHN: '98' },
};
const POZIOMY_INNE = { POL: ['3.99', '4.99', '19.99', '29.99', '59.99', '64.99'], DEU: ['0.99', '6.99', '14.99'], JPN: ['150', '1000', '2200'], FRA: ['0.99', '6.99', '14.99'], GBR: ['0.79', '0.99', '5.99', '6.99', '11.99', '14.99'], CHN: ['6', '12', '45', '98'] };
const punkt = (kraj, cena) => ({ id: `${kraj}:${cena}`, type: 'pricePoints', attributes: { customerPrice: cena }, relationships: { territory: { data: { type: 'territories', id: kraj } } } });

export function utworzAtrape({ stan = {}, bundleId = 'com.apps4brew.knitting' } = {}) {
  const s = {
    grupy: [], subskrypcje: [], ceny: [], dostSub: [], iap: [], harmonogramy: [], dostIap: [], seq: 0, ...stan,
  };
  const calls = [];
  const id = (p) => `${p}${++s.seq}`;
  const odp = (status, body) => ({ ok: status < 400, status, json: async () => body });
  const lista = (data) => odp(200, { data, links: {} });
  const pp = (kraj) => (kraj === 'USA' ? POZIOMY_USA : POZIOMY_INNE[kraj] ?? []).map((c) => punkt(kraj, c));

  async function fetchFn(url, init = {}) {
    const u = new URL(url); const m = init.method ?? 'GET'; const path = u.pathname; const q = u.searchParams;
    calls.push({ m, p: path.replace(/\/[A-Za-z0-9:._-]*\d[A-Za-z0-9:._-]*(?=\/|$)/g, '/{id}'), raw: path });
    if (m === 'DELETE') throw new Error('DELETE niedozwolone');
    const body = init.body ? JSON.parse(init.body) : null;
    let r;
    if ((r = path.match(/^\/v1\/apps$/)) && m === 'GET') return lista(q.get('filter[bundleId]') === bundleId ? [{ id: 'APP1', type: 'apps' }] : []);
    // --- grupa subskrypcji
    if (path === '/v1/apps/APP1/subscriptionGroups' && m === 'GET') return lista(s.grupy.map((g) => ({ id: g.id, type: 'subscriptionGroups', attributes: { referenceName: g.referenceName } })));
    if (path === '/v1/subscriptionGroups' && m === 'POST') { const g = { id: id('G'), referenceName: body.data.attributes.referenceName }; s.grupy.push(g); return odp(201, { data: { id: g.id, type: 'subscriptionGroups', attributes: { referenceName: g.referenceName } } }); }
    if ((r = path.match(/^\/v1\/subscriptionGroups\/([^/]+)\/subscriptions$/)) && m === 'GET') return lista(s.subskrypcje.filter((x) => x.grupa === r[1]).map((x) => ({ id: x.id, type: 'subscriptions', attributes: { productId: x.productId, name: x.name, subscriptionPeriod: x.okres, familySharable: x.fs, state: 'MISSING_METADATA', groupLevel: x.poziom } })));
    // --- subskrypcje
    if (path === '/v1/subscriptions' && m === 'POST') {
      const a = body.data.attributes; const x = { id: id('S'), grupa: body.data.relationships.group.data.id, productId: a.productId, name: a.name, okres: a.subscriptionPeriod, fs: a.familySharable ?? false, poziom: a.groupLevel };
      if (s.subskrypcje.some((y) => y.productId === x.productId)) return odp(409, { errors: [{ code: 'ENTITY_ERROR.ATTRIBUTE.INVALID.DUPLICATE', title: 'productId used' }] });
      s.subskrypcje.push(x); return odp(201, { data: { id: x.id, type: 'subscriptions', attributes: { productId: x.productId } } });
    }
    if ((r = path.match(/^\/v1\/subscriptions\/([^/]+)$/)) && m === 'PATCH') { const x = s.subskrypcje.find((y) => y.id === r[1]); Object.assign(x, body.data.attributes.familySharable !== undefined ? { fs: body.data.attributes.familySharable } : {}); return odp(200, { data: { id: x.id } }); }
    if ((r = path.match(/^\/v1\/subscriptions\/([^/]+)\/pricePoints$/)) && m === 'GET') return lista(pp(q.get('filter[territory]')));
    if ((r = path.match(/^\/v1\/subscriptionPricePoints\/([^/]+)\/equalizations$/)) && m === 'GET') { const [kraj, cena] = decodeURIComponent(r[1]).split(':'); const t = ROWNOWAZNIKI[cena]; return lista(Object.entries(t).map(([k, c]) => punkt(k, c))); }
    if ((r = path.match(/^\/v1\/subscriptions\/([^/]+)\/prices$/)) && m === 'GET')
      return lista(s.ceny.filter((c) => c.sub === r[1]).map((c) => ({ id: c.id, type: 'subscriptionPrices', attributes: { startDate: c.start ?? null, preserved: false }, relationships: { territory: { data: { type: 'territories', id: c.kraj } }, subscriptionPricePoint: { data: { type: 'subscriptionPricePoints', id: c.punkt } } } })));
    if (path === '/v1/subscriptionPrices' && m === 'POST') {
      const rel = body.data.relationships; const c = { id: id('SP'), sub: rel.subscription.data.id, kraj: rel.territory.data.id, punkt: rel.subscriptionPricePoint.data.id };
      if (decodeURIComponent(c.punkt).split(':')[0] !== c.kraj) return odp(409, { errors: [{ code: 'ENTITY_ERROR.RELATIONSHIP.INVALID', title: 'price point z innego kraju' }] });
      if (s.ceny.some((y) => y.sub === c.sub && y.kraj === c.kraj)) return odp(409, { errors: [{ code: 'ENTITY_ERROR.PRICE.EXISTS', title: 'cena już istnieje' }] });
      s.ceny.push(c); return odp(201, { data: { id: c.id } });
    }
    if (path === '/v1/territories' && m === 'GET') return lista(TERYTORIA.map((t) => ({ id: t, type: 'territories', attributes: { currency: 'X' } })));
    // --- dostępność subskrypcji
    if ((r = path.match(/^\/v1\/subscriptions\/([^/]+)\/subscriptionAvailability$/)) && m === 'GET') { const d = s.dostSub.find((x) => x.sub === r[1]); return d ? odp(200, { data: { id: d.id, type: 'subscriptionAvailabilities', attributes: { availableInNewTerritories: d.nowe } } }) : odp(404, { errors: [{ code: 'NOT_FOUND', title: 'brak' }] }); }
    if ((r = path.match(/^\/v1\/subscriptionAvailabilities\/([^/]+)\/availableTerritories$/)) && m === 'GET') return lista(s.dostSub.find((x) => x.id === r[1]).kraje.map((t) => ({ id: t, type: 'territories' })));
    if (path === '/v1/subscriptionAvailabilities' && m === 'POST') {
      const sub = body.data.relationships.subscription.data.id; s.dostSub = s.dostSub.filter((x) => x.sub !== sub);
      const d = { id: id('SA'), sub, nowe: body.data.attributes.availableInNewTerritories, kraje: body.data.relationships.availableTerritories.data.map((x) => x.id) }; s.dostSub.push(d); return odp(201, { data: { id: d.id } });
    }
    // --- zakup jednorazowy (IAP v2)
    if (path === '/v1/apps/APP1/inAppPurchasesV2' && m === 'GET') { const f = q.get('filter[productId]'); return lista(s.iap.filter((x) => !f || x.productId === f).map((x) => ({ id: x.id, type: 'inAppPurchases', attributes: { productId: x.productId, name: x.name, inAppPurchaseType: x.typ, familySharable: x.fs, state: 'MISSING_METADATA' } }))); }
    if (path === '/v2/inAppPurchases' && m === 'POST') {
      const a = body.data.attributes; const x = { id: id('I'), productId: a.productId, name: a.name, typ: a.inAppPurchaseType, fs: a.familySharable ?? false };
      if (s.iap.some((y) => y.productId === x.productId)) return odp(409, { errors: [{ code: 'ENTITY_ERROR.ATTRIBUTE.INVALID.DUPLICATE', title: 'productId used' }] });
      s.iap.push(x); return odp(201, { data: { id: x.id, type: 'inAppPurchases', attributes: { productId: x.productId } } });
    }
    if ((r = path.match(/^\/v2\/inAppPurchases\/([^/]+)$/)) && m === 'PATCH') { const x = s.iap.find((y) => y.id === r[1]); if (body.data.attributes.familySharable !== undefined) x.fs = body.data.attributes.familySharable; return odp(200, { data: { id: x.id } }); }
    if ((r = path.match(/^\/v2\/inAppPurchases\/([^/]+)\/pricePoints$/)) && m === 'GET') return lista(pp(q.get('filter[territory]')));
    if ((r = path.match(/^\/v2\/inAppPurchases\/([^/]+)\/iapPriceSchedule$/)) && m === 'GET') { const h = s.harmonogramy.find((x) => x.iap === r[1]); return h ? odp(200, { data: { id: h.id, type: 'inAppPurchasePriceSchedules' }, included: [{ id: h.baza, type: 'territories' }] }) : odp(404, { errors: [{ code: 'NOT_FOUND', title: 'brak' }] }); }
    if ((r = path.match(/^\/v1\/inAppPurchasePriceSchedules\/([^/]+)\/baseTerritory$/)) && m === 'GET') return odp(200, { data: { id: s.harmonogramy.find((x) => x.id === r[1]).baza, type: 'territories' } });
    if ((r = path.match(/^\/v1\/inAppPurchasePriceSchedules\/([^/]+)\/manualPrices$/)) && m === 'GET')
      return lista(s.harmonogramy.find((x) => x.id === r[1]).reczne.map((c, i) => ({ id: `P${i}`, type: 'inAppPurchasePrices', attributes: { startDate: null, manual: true }, relationships: { territory: { data: { type: 'territories', id: c.kraj } }, inAppPurchasePricePoint: { data: { type: 'inAppPurchasePricePoints', id: c.punkt } } } })));
    if (path === '/v1/inAppPurchasePriceSchedules' && m === 'POST') {
      const rel = body.data.relationships; const inc = new Map((body.included ?? []).map((x) => [x.id, x]));
      if (!rel.baseTerritory?.data?.id) return odp(409, { errors: [{ code: 'ENTITY_ERROR.RELATIONSHIP.REQUIRED', title: 'baseTerritory wymagane' }] });
      // pozycja ceny nie ma relacji `territory` (InAppPurchasePriceInlineCreate: tylko inAppPurchasePricePoint i inAppPurchaseV2): kraj wynika z price pointu
      const reczne = rel.manualPrices.data.map((d) => { const punkt = inc.get(d.id).relationships.inAppPurchasePricePoint.data.id; return { kraj: decodeURIComponent(punkt).split(':')[0], punkt }; });
      const h = { id: id('PS'), iap: rel.inAppPurchase.data.id, baza: rel.baseTerritory.data.id, reczne }; s.harmonogramy = s.harmonogramy.filter((x) => x.iap !== h.iap); s.harmonogramy.push(h); return odp(201, { data: { id: h.id } });
    }
    if ((r = path.match(/^\/v2\/inAppPurchases\/([^/]+)\/inAppPurchaseAvailability$/)) && m === 'GET') { const d = s.dostIap.find((x) => x.iap === r[1]); return d ? odp(200, { data: { id: d.id, type: 'inAppPurchaseAvailabilities', attributes: { availableInNewTerritories: d.nowe } } }) : odp(404, { errors: [{ code: 'NOT_FOUND', title: 'brak' }] }); }
    if ((r = path.match(/^\/v1\/inAppPurchaseAvailabilities\/([^/]+)\/availableTerritories$/)) && m === 'GET') return lista(s.dostIap.find((x) => x.id === r[1]).kraje.map((t) => ({ id: t, type: 'territories' })));
    if (path === '/v1/inAppPurchaseAvailabilities' && m === 'POST') {
      const iap = body.data.relationships.inAppPurchase.data.id; s.dostIap = s.dostIap.filter((x) => x.iap !== iap);
      const d = { id: id('IA'), iap, nowe: body.data.attributes.availableInNewTerritories, kraje: body.data.relationships.availableTerritories.data.map((x) => x.id) }; s.dostIap.push(d); return odp(201, { data: { id: d.id } });
    }
    return odp(404, { errors: [{ code: 'NOT_FOUND', title: `atrapa nie zna: ${m} ${path}` }] });
  }
  return { fetchFn, calls, s, TERYTORIA };
}
