// Sterownik testów trybu „spis” scripts/asc/zrzuty.mjs (ZR12, KO-214) na atrapie serwera App Store Connect w pamięci (wywołuje prawdziwy `makeClient` i `runSpis`).
// Atrapa zapisuje KAŻDE żądanie (metoda, ścieżka) — test sprawdza, że wszystkie są GET. Każda lista (wersje, lokalizacje, placementy) jest dzielona na strony po `strony` wpisów (`links.next`).
// Wejście (argv[2], JSON): { strony?: n, wersje: [{ id, wersja, stan, lokalizacje: [{ kod, placementy: [{ id, grupa, typ?, zasob?, poz?, ref?, stan?, w?, h?, bezObrazu? }], awaria?: status }] }], brakAplikacji?: true }
// Obrazy w odpowiedzi niosą też pola, których log nie może powtórzyć (adres wgrywania, nazwa pliku): test sprawdza ich brak w logu.
// Wyjście (stdout): JSON { code, log, calls: [{ m, p, q }], podsumowanie }
import { makeClient } from '../../scripts/asc/iap-localizations.mjs';
import * as Z from '../../scripts/asc/zrzuty.mjs';

const sc = JSON.parse(process.argv[2]);
const API = 'https://api.appstoreconnect.apple.com';
const calls = [];
const odp = (status, json) => ({ status, ok: status >= 200 && status < 300, json: async () => json });
const blad = (status, code) => odp(status, { errors: [{ status: String(status), code, title: 'SEKRET-TRESC-BLEDU' }] });

/** Odpowiedź listy dzielona na strony: numer strony w parametrze `strona`, kolejny adres w `links.next` (pełny adres jak w API). */
function strona(u, lista, mapuj, extra = {}) {
  const po = sc.strony || lista.length || 1; const nr = Number(u.searchParams.get('strona') ?? 0);
  const kawalek = lista.slice(nr * po, (nr + 1) * po);
  const nast = new URL(u.toString()); nast.searchParams.set('strona', String(nr + 1));
  return odp(200, { data: kawalek.map(mapuj), ...extra(kawalek), ...((nr + 1) * po < lista.length ? { links: { next: nast.toString() } } : {}) });
}

async function fetchFn(url, init = {}) {
  const u = new URL(url); const m = init.method ?? 'GET'; const p = u.pathname;
  calls.push({ m, p, q: u.search });
  if (m !== 'GET') return blad(405, 'METHOD_NOT_ALLOWED');
  if (p === '/v1/apps') return sc.brakAplikacji ? odp(200, { data: [] }) : odp(200, { data: [{ id: 'APP1' }] });
  if (p === '/v1/apps/APP1/appStoreVersions') return strona(u, sc.wersje, v => ({ id: v.id, attributes: { appStoreState: v.stan, versionString: v.wersja } }), () => ({}));
  for (const v of sc.wersje) {
    if (p === `/v1/appStoreVersions/${v.id}/appStoreVersionLocalizations`) return strona(u, v.lokalizacje, l => ({ id: `${v.id}-${l.kod}`, attributes: { locale: l.kod } }), () => ({}));
    for (const l of v.lokalizacje) {
      if (p !== `/v1/appStoreVersionLocalizations/${v.id}-${l.kod}/placements`) continue;
      if (l.awaria) return blad(l.awaria, 'UNEXPECTED_ERROR');
      return strona(u, l.placementy, x => ({ id: x.id, type: x.zasob ?? 'appAssetLibraryPlacements',
        attributes: { placementGroup: x.grupa, placementType: x.typ ?? 'APP_SCREENSHOT', ...(x.poz != null ? { placementGroupPosition: x.poz } : {}), tajne: 'SEKRET-POLE' },
        ...(x.bezObrazu ? {} : { relationships: { image: { data: { type: 'appAssetLibraryImages', id: `IMG-${x.id}` } } } }) }),
      kawalek => ({ included: kawalek.filter(x => !x.bezObrazu).map(x => ({ type: 'appAssetLibraryImages', id: `IMG-${x.id}`,
        attributes: { referenceName: x.ref ?? '', state: x.stan ?? 'PREPARE_FOR_SUBMISSION', ...(x.w ? { imageAsset: { width: x.w, height: x.h } } : {}),
          uploadOperations: [{ url: 'https://upload.example/SEKRET-ADRES' }], fileName: 'SEKRET-PLIK.png' } })) }));
    }
  }
  return blad(404, 'NOT_FOUND');
}

const log = [];
const client = makeClient({ fetchFn, token: 'TOKEN-TESTOWY', sleep: async () => {} });
const w = await Z.runSpis({ client, log: t => log.push(String(t)) });
process.stdout.write(JSON.stringify({ code: w.code, log, calls, podsumowanie: w.podsumowanie }));
