// Sterownik testów trybu „zastąp” scripts/asc/zrzuty.mjs (ZR10, KO-210) na atrapie serwera App Store Connect w pamięci (wywołuje prawdziwy `makeClient` i `run`).
// Atrapa odzwierciedla odczytaną dokumentację Apple (docs/jakosc/zr10-api.md), nie prawdziwy serwer: DELETE placementu → 204, tworzenie placementu w wersji
// nieedytowalnej → 409 STATE_ERROR.INVALID_STATE, DELETE czegokolwiek innego niż placement → 405 i wpis „wyciek” (test wymaga zera takich wpisów).
// Wejście (argv[2], JSON): { stanWersji?, stare?: n, nowe?: n, jezyk?, kroki: [{ apply?, zastap?, awaria?: { m, tag, nth, status } }] }
// Wyjście (stdout): JSON { kroki: [{ code, rows, log, calls }], placementy: [ref…], obrazy: n, usuniecObrazow: n, wycieki: [...] }
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
const placementy = []; // { id, group, loc, image, order }
const dodajObraz = (ref, state = 'PREPARE_FOR_SUBMISSION', size = 100) => { const id = 'IMG-' + (++licznik); obrazy.set(id, { id, referenceName: ref, fileSize: size, state, createdDate: '2026-11-25T10:00:00Z' }); return id; };
const dodajPlacement = (image, order) => { const id = 'PLC-' + (++licznik); placementy.push({ id, group: GRUPA, loc: LOC, image, order }); return id; };
for (let i = 1; i <= (sc.stare ?? 0); i++) dodajPlacement(dodajObraz(`stare/0${i}.png`), i);

const refData = { imageSpecs: [{ specId: 'S69', alphaAllowed: false, dimensions: { minWidth: 1320, maxWidth: 1320, minHeight: 2868, maxHeight: 2868 } }],
  placementTypes: [{ placementTypeId: 'APP_SCREENSHOT', specMappings: [{ specs: ['S69'], placementGroupId: GRUPA }] }] };

let calls = []; let awaria = null; const licznikAwarii = new Map();
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
  calls.push({ m, p, tag });
  if (awaria && awaria.m === m && awaria.tag === tag) { const n = (licznikAwarii.get(tag) ?? 0) + 1; licznikAwarii.set(tag, n); if (n === awaria.nth) return blad(awaria.status ?? 500, 'UNEXPECTED_ERROR', 'awaria wstrzyknięta'); }
  if (m === 'DELETE') {
    if (tag !== 'DELETE placement') { wycieki.push(`${m} ${p}`); if (/appAssetLibraryImages/.test(p)) usunieteObrazy++; return blad(405, 'METHOD_NOT_ALLOWED', 'atrapa: tylko placement'); }
    const i = placementy.findIndex(x => x.id === p.split('/').pop());
    if (i < 0) return blad(404, 'NOT_FOUND', 'brak placementu');
    placementy.splice(i, 1); return odp(204);
  }
  if (m === 'GET') {
    if (p === '/v1/apps') return odp(200, { data: [{ id: 'APP1' }] });
    if (p === '/v1/apps/APP1/appStoreVersions') return odp(200, { data: [{ id: 'V1', attributes: { appStoreState: stanWersji } }] });
    if (p === '/v1/appStoreVersions/V1/appStoreVersionLocalizations') return odp(200, { data: [{ id: LOC, attributes: { locale: kodAsc } }] });
    if (p === '/v1/apps/APP1/assetLibrary') return odp(200, { data: { id: 'LIB1' } });
    if (p === '/v1/appAssetLibraryRefData') return odp(200, { data: [{ attributes: refData }] });
    if (p === '/v1/appAssetLibraries/LIB1/images') return odp(200, { data: [...obrazy.values()].map(o => ({ id: o.id, attributes: { referenceName: o.referenceName, fileSize: o.fileSize, state: o.state, createdDate: o.createdDate } })) });
    if (/^\/v1\/appAssetLibraryImages\/[A-Za-z0-9-]+$/.test(p)) { const o = obrazy.get(p.split('/').pop()); return o ? odp(200, { data: { id: o.id, attributes: { state: o.state, referenceName: o.referenceName } } }) : blad(404, 'NOT_FOUND', 'brak obrazu'); }
    const mp = p.match(/^\/v1\/appStoreVersionLocalizations\/([A-Za-z0-9-]+)\/placements$/);
    if (mp) {
      const grupa = u.searchParams.get('filter[placementGroup]'); const lista = placementy.filter(x => x.loc === mp[1] && (!grupa || x.group === grupa)).sort((a, b) => a.order - b.order);
      return odp(200, { data: lista.map(x => ({ id: x.id, type: 'appAssetLibraryPlacements', attributes: { placementGroup: x.group, placementType: 'APP_SCREENSHOT' }, relationships: { image: { data: { type: 'appAssetLibraryImages', id: x.image } } } })),
        included: lista.map(x => ({ type: 'appAssetLibraryImages', id: x.image, attributes: { referenceName: obrazy.get(x.image)?.referenceName } })) });
    }
  }
  if (m === 'POST' && p === '/v1/appAssetLibraryImages') {
    const a = body.data.attributes; const id = dodajObraz(a.referenceName, 'AWAITING_UPLOAD', a.fileSize);
    return odp(201, { data: { id, attributes: { uploadOperations: [] } } });
  }
  if (m === 'PATCH' && /^\/v1\/appAssetLibraryImages\//.test(p)) {
    const o = obrazy.get(p.split('/').pop()); const a = body.data.attributes;
    if (a.uploaded) o.state = 'PREPARE_FOR_SUBMISSION'; if (a.referenceName) o.referenceName = a.referenceName; return odp(200, { data: { id: o.id } });
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
const pliki = nazwy.map(n => ({ name: n, path: '/x/' + n, size: 100, width: 1320, height: 2868, alpha: false }));
const kroki = [];
for (const k of sc.kroki) {
  calls = []; awaria = k.awaria ?? null; licznikAwarii.clear();
  const log = [];
  const client = makeClient({ fetchFn, token: 'TOKEN-TESTOWY', sleep: async () => {}, allowDelete: !!k.zastap });
  const w = await Z.run({ client, fetchFn, shots: { iphone: new Map([[jezyk, pliki]]) }, apply: !!k.apply, zastap: !!k.zastap, log: t => log.push(String(t)), read: () => Buffer.alloc(100), sleep: async () => {}, now: () => 0 });
  kroki.push({ code: w.code, rows: w.rows.map(r => ({ action: r.action, reason: r.reason, error: r.error ?? null, written: !!r.written, remove: (r.remove ?? []).map(x => ({ id: x.id, ref: x.ref })) })), log, calls });
}
const koncowe = placementy.filter(x => x.loc === LOC && x.group === GRUPA).sort((a, b) => a.order - b.order).map(x => obrazy.get(x.image).referenceName);
process.stdout.write(JSON.stringify({ kroki, placementy: koncowe, obrazy: obrazy.size, usunieteObrazy, wycieki }));
