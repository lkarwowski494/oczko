// Sterownik testów trybu „zastąp” scripts/asc/zrzuty.mjs (ZR10, KO-210) na atrapie serwera App Store Connect w pamięci (wywołuje prawdziwy `makeClient` i `run`).
// Atrapa odzwierciedla odczytaną dokumentację Apple (docs/jakosc/zr10-api.md), nie prawdziwy serwer: DELETE placementu → 204, tworzenie placementu w wersji
// nieedytowalnej → 409 STATE_ERROR.INVALID_STATE, DELETE czegokolwiek innego niż placement → 405 i wpis „wyciek” (test wymaga zera takich wpisów).
// Wejście (argv[2], JSON): { stanWersji?, stare?: n, nowe?: n, jezyk?, kroki: [{ apply?, zastap?, awaria?: { m, tag, nth, status }, przetwarzanie?: { stan, czytania? } }],
//   ZR10b (KO-212): ignorujFiltry? (serwer ignoruje filter[placementGroup]/[placementType], sonda C z RZ4), inne?: [{ group, type?, n }] (placementy innej grupy/typu w tej samej lokalizacji),
//   bezAtrybutow?: 'grupa' | 'typ' (odpowiedź placementów bez tego atrybutu), sklep?: { wspolne: n } | null (wersja 1.0 w sprzedaży: n id współdzielonych ze zdejmowanymi; null = brak wersji w sprzedaży;
//   domyślnie { wspolne: 0 }) }
//   ZR11 (KO-213): `tresc` (scenariusz i krok; domyślnie 'A') — bajty każdego pliku zrzutu = 100 × ten znak, skrót w referenceName liczy atrapa niezależnie od kodu;
//   `stareNazwy: [n…]` — referenceName obrazów starych placementów (np. `oczko-1.0/iphone/pl/01-ekran.png`, jak zrzuty 1.0); `stanSklepu` — stan wersji V0 (domyślnie READY_FOR_SALE);
//   `dodatkowaWersja: { stan }` — trzecia wersja V2 w podanym stanie (bez własnych placementów); `typPlacementu` — pole `type` wpisów placementów (domyślnie appAssetLibraryPlacements);
//   na krok: `trescOdczytu` — bajty zwracane przy wgrywaniu, gdy plik zmienił się po obliczeniu skrótu (kontrola TOCTOU);
//   `strony: n` — odpowiedź placementów dzielona na strony po n wpisów (`links.next`).
//   `przetwarzanie` (na krok): stan, w jakim nowy obraz zostaje po `uploaded: true` (np. FAILED, UPLOAD_COMPLETE, AWAITING_UPLOAD); `czytania: n` — po n odczytach stanu staje się gotowy (bez: nigdy).
//   Zegar wirtualny: `sleep` przesuwa `now` (limit czekania WAIT_MS jest osiągalny bez czekania naprawdę).
// Wyjście (stdout): JSON { kroki: [{ code, rows, log, calls }], placementy: [ref…], pozostale: [id innych grup/typów], obrazy: n, usuniecObrazow: n, wycieki: [...] }
import { createHash } from 'node:crypto';
import { makeClient } from '../../scripts/asc/iap-localizations.mjs';
import { LOCALE_MAP } from '../../scripts/asc/metadane.mjs';
import * as Z from '../../scripts/asc/zrzuty.mjs';

const sc = JSON.parse(process.argv[2]);
const jezyk = sc.jezyk ?? 'pl';
const kodAsc = LOCALE_MAP[Z.SHOT_LOCALES[jezyk][0]];
const LOC = 'LOC-' + kodAsc;
const GRUPA = 'G-IPHONE';
const API = 'https://api.appstoreconnect.apple.com';
const stanWersji = sc.stanWersji ?? 'PREPARE_FOR_SUBMISSION';

const obrazy = new Map(); let licznik = 0; let usunieteObrazy = 0; const wycieki = [];
const placementy = []; // { id, group, loc, image, order, type }
const dodajObraz = (ref, state = 'PREPARE_FOR_SUBMISSION', size = 100) => { const id = 'IMG-' + (++licznik); obrazy.set(id, { id, referenceName: ref, fileSize: size, state, createdDate: '2026-11-25T10:00:00Z' }); return id; };
const dodajPlacement = (image, order, group = GRUPA, type = 'APP_SCREENSHOT') => { const id = 'PLC-' + (++licznik); placementy.push({ id, group, loc: LOC, image, order, type }); return id; };
for (let i = 1; i <= (sc.stare ?? 0); i++) dodajPlacement(dodajObraz(sc.stareNazwy ? sc.stareNazwy[i - 1] : `stare/0${i}.png`), i);
for (const g of sc.inne ?? []) for (let i = 1; i <= (g.n ?? 1); i++) dodajPlacement(dodajObraz(`inne/${g.group}/${g.type ?? 'APP_SCREENSHOT'}/0${i}.png`), 500 + i, g.group, g.type ?? 'APP_SCREENSHOT');
// Wersja 1.0 w sprzedaży (READY_FOR_SALE): własne placementy + `wspolne` pierwszych id zdejmowanych (współdzielenie między wersjami: RZ4-07).
const sklep = 'sklep' in sc ? sc.sklep : { wspolne: 0 };
const LOC0 = 'LOCPUB-' + kodAsc;
const LOC2 = 'LOCV2-' + kodAsc; // trzecia wersja (ZR11): `dodatkowaWersja: { stan, wspolne? }`
const v2Ids = sc.dodatkowaWersja ? [...placementy.filter(x => x.group === GRUPA).slice(0, sc.dodatkowaWersja.wspolne ?? 0).map(x => x.id), 'V2-1', 'V2-2'] : [];
const sklepIds = sklep ? [...placementy.filter(x => x.group === GRUPA).slice(0, sklep.wspolne ?? 0).map(x => x.id), 'PUB-1', 'PUB-2', 'PUB-3'] : [];

const refData = { imageSpecs: [{ specId: 'S69', alphaAllowed: false, dimensions: { minWidth: 1320, maxWidth: 1320, minHeight: 2868, maxHeight: 2868 } }],
  placementTypes: [{ placementTypeId: 'APP_SCREENSHOT', specMappings: [{ specs: ['S69'], placementGroupId: GRUPA }] }] };

let calls = []; let awaria = null; const licznikAwarii = new Map(); let przetwarzanie = null; let zegar = 0;
const odp = (status, json) => ({ status, ok: status >= 200 && status < 300, json: async () => { if (json === undefined) throw new Error('brak treści'); return json; } });
const blad = (status, code, title) => odp(status, { errors: [{ status: String(status), code, title }] });

async function fetchFn(url, init = {}) {
  const u = new URL(url); const m = init.method ?? 'GET'; const p = u.pathname; const body = init.body ? JSON.parse(init.body) : null;
  let tag = `${m} ${p.replace(/\/[A-Za-z]+-\d+/g, '/{id}')}`;
  if (m === 'POST' && p === '/v1/appAssetLibraryImages') tag = 'POST obraz';
  else if (m === 'PATCH' && body?.data?.attributes?.uploaded === true) tag = 'PATCH uploaded';
  else if (m === 'POST' && p === '/v1/appAssetLibraryPlacements') tag = 'POST placement';
  else if (m === 'DELETE' && /^\/v1\/appAssetLibraryPlacements\/[A-Za-z0-9-]+$/.test(p)) tag = 'DELETE placement';
  else if (m === 'POST' && p === '/v1/appAssetLibraryPlacementOrderingRequests') tag = 'POST kolejność';
  calls.push({ m, p, tag, q: u.search });
  if (awaria && awaria.m === m && awaria.tag === tag) { const n = (licznikAwarii.get(tag) ?? 0) + 1; licznikAwarii.set(tag, n); if (n === awaria.nth) return blad(awaria.status ?? 500, 'UNEXPECTED_ERROR', 'awaria wstrzyknięta'); }
  if (m === 'DELETE') {
    if (tag !== 'DELETE placement') { wycieki.push(`${m} ${p}`); if (/appAssetLibraryImages/.test(p)) usunieteObrazy++; return blad(405, 'METHOD_NOT_ALLOWED', 'atrapa: tylko placement'); }
    const i = placementy.findIndex(x => x.id === p.split('/').pop());
    if (i < 0) return blad(404, 'NOT_FOUND', 'brak placementu');
    placementy.splice(i, 1); return odp(204);
  }
  if (m === 'GET') {
    if (p === '/v1/apps') return odp(200, { data: [{ id: 'APP1' }] });
    if (p === '/v1/apps/APP1/appStoreVersions') return odp(200, { data: [...(sklep ? [{ id: 'V0', attributes: { appStoreState: sc.stanSklepu ?? 'READY_FOR_SALE', versionString: '1.0' } }] : []), { id: 'V1', attributes: { appStoreState: stanWersji, versionString: '1.0.1' } },
      ...(sc.dodatkowaWersja ? [{ id: 'V2', attributes: { appStoreState: sc.dodatkowaWersja.stan, versionString: '1.0.2' } }] : [])] });
    if (p === '/v1/appStoreVersions/V1/appStoreVersionLocalizations') return odp(200, { data: [{ id: LOC, attributes: { locale: kodAsc } }] });
    if (sc.dodatkowaWersja && p === '/v1/appStoreVersions/V2/appStoreVersionLocalizations') return odp(200, { data: [{ id: LOC2, attributes: { locale: kodAsc } }] });
    if (sc.dodatkowaWersja && p === `/v1/appStoreVersionLocalizations/${LOC2}/placements`) return odp(200, { data: v2Ids.map(id => ({ id, type: 'appAssetLibraryPlacements', attributes: { placementGroup: GRUPA, placementType: 'APP_SCREENSHOT' } })) });
    if (sklep && p === '/v1/appStoreVersions/V0/appStoreVersionLocalizations') return odp(200, { data: [{ id: LOC0, attributes: { locale: kodAsc } }] });
    if (sklep && p === `/v1/appStoreVersionLocalizations/${LOC0}/placements`) return odp(200, { data: sklepIds.map(id => ({ id, type: 'appAssetLibraryPlacements', attributes: { placementGroup: GRUPA, placementType: 'APP_SCREENSHOT' } })) });
    if (p === '/v1/apps/APP1/assetLibrary') return odp(200, { data: { id: 'LIB1' } });
    if (p === '/v1/appAssetLibraryRefData') return odp(200, { data: [{ attributes: refData }] });
    if (p === '/v1/appAssetLibraries/LIB1/images') return odp(200, { data: [...obrazy.values()].map(o => ({ id: o.id, attributes: { referenceName: o.referenceName, fileSize: o.fileSize, state: o.state, createdDate: o.createdDate } })) });
    if (/^\/v1\/appAssetLibraryImages\/[A-Za-z0-9-]+$/.test(p)) {
      const o = obrazy.get(p.split('/').pop()); if (!o) return blad(404, 'NOT_FOUND', 'brak obrazu');
      if (o.czytania != null) { if (o.czytania <= 0) { o.state = 'PREPARE_FOR_SUBMISSION'; o.czytania = null; } else o.czytania--; } // stan pośredni: gotowy dopiero po n odczytach
      return odp(200, { data: { id: o.id, attributes: { state: o.state, referenceName: o.referenceName } } });
    }
    const mp = p.match(/^\/v1\/appStoreVersionLocalizations\/([A-Za-z0-9-]+)\/placements$/);
    if (mp) {
      const grupa = sc.ignorujFiltry ? null : u.searchParams.get('filter[placementGroup]'); const typ = sc.ignorujFiltry ? null : u.searchParams.get('filter[placementType]');
      const lista = placementy.filter(x => x.loc === mp[1] && (!grupa || x.group === grupa) && (!typ || x.type === typ)).sort((a, b) => a.order - b.order);
      const atr = x => ({ ...(sc.bezAtrybutow === 'grupa' ? {} : { placementGroup: x.group }), ...(sc.bezAtrybutow === 'typ' ? {} : { placementType: x.type }) });
      const poStronie = (sc.strony ?? lista.length) || 1; const nr = Number(u.searchParams.get('strona') ?? 0); const kawalek = lista.slice(nr * poStronie, (nr + 1) * poStronie);
      u.searchParams.set('strona', String(nr + 1));
      return odp(200, { data: kawalek.map(x => ({ id: x.id, type: sc.typPlacementu ?? 'appAssetLibraryPlacements', attributes: atr(x), relationships: { image: { data: { type: 'appAssetLibraryImages', id: x.image } } } })),
        included: kawalek.map(x => ({ type: 'appAssetLibraryImages', id: x.image, attributes: { referenceName: obrazy.get(x.image)?.referenceName } })),
        ...((nr + 1) * poStronie < lista.length ? { links: { next: u.toString() } } : {}) });
    }
  }
  if (m === 'POST' && p === '/v1/appAssetLibraryImages') {
    const a = body.data.attributes; const id = dodajObraz(a.referenceName, 'AWAITING_UPLOAD', a.fileSize);
    return odp(201, { data: { id, attributes: { uploadOperations: [] } } });
  }
  if (m === 'PATCH' && /^\/v1\/appAssetLibraryImages\//.test(p)) {
    const o = obrazy.get(p.split('/').pop()); const a = body.data.attributes;
    if (a.uploaded) { o.state = przetwarzanie ? przetwarzanie.stan : 'PREPARE_FOR_SUBMISSION'; o.czytania = przetwarzanie && przetwarzanie.czytania != null ? przetwarzanie.czytania : null; }
    if (a.referenceName) o.referenceName = a.referenceName; return odp(200, { data: { id: o.id } });
  }
  if (m === 'POST' && p === '/v1/appAssetLibraryPlacements') {
    if (stanWersji !== 'PREPARE_FOR_SUBMISSION') return blad(409, 'STATE_ERROR.INVALID_STATE', 'Creating a placement is not permitted in current state');
    const r = body.data.relationships; const id = dodajPlacement(r.image.data.id, 1000 + licznik);
    return odp(201, { data: { id } });
  }
  if (m === 'POST' && p === '/v1/appAssetLibraryPlacementOrderingRequests') {
    body.data.relationships.orderedPlacements.data.forEach((x, i) => { const pl = placementy.find(y => y.id === x.id); if (pl) pl.order = i + 1; });
    return odp(201, { data: { id: 'ORD' } });
  }
  return blad(404, 'NOT_FOUND', `atrapa nie zna ${m} ${p}`);
}

const nazwy = Array.from({ length: sc.nowe ?? 3 }, (_, i) => `0${i + 1}-ekran.png`);
const bajty = tresc => Buffer.alloc(100, tresc);
const sha12 = buf => createHash('sha256').update(buf).digest('hex').slice(0, 12); // niezależnie od kodu skryptu
const kroki = [];
for (const k of sc.kroki) {
  calls = []; awaria = k.awaria ?? null; licznikAwarii.clear(); przetwarzanie = k.przetwarzanie ?? null;
  const log = []; const tresc = k.tresc ?? sc.tresc ?? 'A';
  const pliki = nazwy.map(n => ({ name: n, path: '/x/' + n, size: 100, width: 1320, height: 2868, alpha: false, sha: sha12(bajty(tresc)) }));
  const client = makeClient({ fetchFn, token: 'TOKEN-TESTOWY', sleep: async () => {}, allowDelete: !!k.zastap });
  const w = await Z.run({ client, fetchFn, shots: { iphone: new Map([[jezyk, pliki]]) }, apply: !!k.apply, zastap: !!k.zastap, log: t => log.push(String(t)), read: () => bajty(k.trescOdczytu ?? tresc), sleep: async ms => { zegar += ms; }, now: () => zegar });
  kroki.push({ code: w.code, rows: w.rows.map(r => ({ action: r.action, reason: r.reason, error: r.error ?? null, written: !!r.written, remove: (r.remove ?? []).map(x => ({ id: x.id, ref: x.ref })) })), log, calls });
}
const koncowe = placementy.filter(x => x.loc === LOC && x.group === GRUPA).sort((a, b) => a.order - b.order).map(x => obrazy.get(x.image).referenceName);
const pozostale = placementy.filter(x => x.loc === LOC && !(x.group === GRUPA && x.type === 'APP_SCREENSHOT')).map(x => x.id);
process.stdout.write(JSON.stringify({ kroki, placementy: koncowe, pozostale, obrazy: obrazy.size, usunieteObrazy, wycieki }));
