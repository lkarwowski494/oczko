// Reguła darmowego limitu dni (P-057, kontrakt KP-12–KP-15). Wzorzec: docs/monetyzacja/limit.mjs; wyrocznia: docs/monetyzacja/wektory-limitu.json.
// Dzień z robótką = data lokalna (RD-16), w której praca zaczęła się zdarzeniem wołającym strażnika (P-067).
// Złe dane wejściowe → BladDanych (sygnatury 05/07 bez `Wynik`; Z07-07, R-178).
import { BladDanych } from './bledy';
import type { RodzajZdarzenia } from './stany';
import { LIMIT_DNI_W_MIESIACU, PRZERWA_NOWEGO_DNIA_MS } from '../konfiguracja';

export type RodzajStraznika = 'plus' | 'wpisanie' | 'zerowanie' | 'minus' | 'edycja-historii';
export type DzienLimitu = { data: string; pro: boolean }; // data: RRRR-MM-DD (RD-16)
export type WejscieDnia = { dni: DzienLimitu[]; dzis: string; teraz: number; ostatniPlus: number | null; pro: boolean; limit?: number; przerwa?: number };
export type WynikStartu = { dozwolone: boolean; zapis: DzienLimitu | null; zostalo: number };
export type StanZawczasu = { limitZawczasu: boolean; ostatniDarmowy: boolean; zostalo: number };

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const czyData = (v: unknown): v is string => typeof v === 'string' && DATA.test(v);

/** Mapowanie rodzaju zdarzenia z bazy na rodzaj strażnika (moduly.md, „Mapowanie rodzaju zdarzenia”, P-067). */
const RODZAJ_STRAZNIKA: Record<RodzajZdarzenia, RodzajStraznika> = {
  plus: 'plus',
  minus: 'minus',
  wpisanie: 'wpisanie',
  zerowanie: 'zerowanie',
  cofniecie: 'edycja-historii',
  rozstrzygniecie: 'edycja-historii',
};
export function rodzajStraznika(rodzaj: RodzajZdarzenia): RodzajStraznika {
  return RODZAJ_STRAZNIKA[rodzaj];
}

/** P-067: +1 (każdy licznik, każde urządzenie) i wpisanie (D4) zaczynają dzień; zerowanie, −1 i edycja historii to korekty (KP-02, L-07). */
const ZACZYNA_DZIEN: Record<RodzajStraznika, boolean> = { plus: true, wpisanie: true, zerowanie: false, minus: false, 'edycja-historii': false };
export function wolaStraznika(z: { rodzaj: RodzajStraznika }): boolean {
  const rodzaj: string = z.rodzaj;
  if (!Object.hasOwn(ZACZYNA_DZIEN, rodzaj)) throw new BladDanych(`wolaStraznika: nieznany rodzaj zdarzenia ${rodzaj}`);
  return ZACZYNA_DZIEN[z.rodzaj];
}

function sprawdzDni(lista: unknown, gdzie: string): asserts lista is DzienLimitu[] {
  if (!Array.isArray(lista) || !lista.every((d: unknown) => typeof d === 'object' && d !== null && 'data' in d && czyData(d.data) && 'pro' in d && typeof d.pro === 'boolean')) {
    throw new BladDanych(`${gdzie}: zła lista dni`);
  }
}

/** Darmowe dni miesiąca (D5) po różnych datach (P-103 (1a), R-102): duplikat daty liczy się raz; data z Pro, gdy którykolwiek wpis ma pro (6a). */
function darmoweDni(lista: readonly DzienLimitu[], miesiac: string): number {
  const zPro = new Set(lista.filter((d) => d.pro).map((d) => d.data));
  return new Set(lista.filter((d) => d.data.startsWith(miesiac) && !zPro.has(d.data)).map((d) => d.data)).size;
}

function sprawdzWejscie(w: WejscieDnia, gdzie: string): void {
  sprawdzDni(w.dni, gdzie);
  if (!czyData(w.dzis) || !Number.isFinite(w.teraz)) throw new BladDanych(`${gdzie}: złe dane wejściowe`);
}

export function startDnia(w: WejscieDnia): WynikStartu {
  sprawdzWejscie(w, 'startDnia');
  const { dni, dzis, teraz, ostatniPlus, pro } = w;
  const limit = w.limit ?? LIMIT_DNI_W_MIESIACU; // parametr reguły (KP-01, R-103), domyślnie z konfiguracji
  const przerwa = w.przerwa ?? PRZERWA_NOWEGO_DNIA_MS;
  const miesiac = dzis.slice(0, 7);
  const wynik = (dozwolone: boolean, zapis: DzienLimitu | null): WynikStartu => ({
    dozwolone,
    zapis,
    zostalo: Math.max(0, limit - darmoweDni(zapis ? [...dni, zapis] : dni, miesiac)),
  });
  // Praca w toku (L-04, D3): kolejne +1 przed upływem przerwy nie otwiera nowego dnia, także po północy; +1 z przyszłości nie jest pracą w toku (L-15).
  if (ostatniPlus !== null && teraz - ostatniPlus >= 0 && teraz - ostatniPlus < przerwa) return wynik(true, null);
  // Rozpoczęty dzień zawsze do końca (L-02, L-06, L-12, KP-15).
  if (dni.some((d) => d.data === dzis)) return wynik(true, null);
  if (pro) return wynik(true, { data: dzis, pro: true });
  if (darmoweDni(dni, miesiac) < limit) return wynik(true, { data: dzis, pro: false });
  return wynik(false, null); // L-03: na limicie; dane, historia i eksport działają dalej (poza tą funkcją)
}

/** Stan zawczasu (P-065 (1a), (2a)): limit zamiast +1 i linia o ostatnim darmowym dniu; ta sama reguła co startDnia, bez zapisu. */
export function mozeZaczacDzien(w: WejscieDnia): StanZawczasu {
  const start = startDnia(w);
  const limit = w.limit ?? LIMIT_DNI_W_MIESIACU;
  const zostalo = Math.max(0, limit - darmoweDni(w.dni, w.dzis.slice(0, 7)));
  return { limitZawczasu: !start.dozwolone, ostatniDarmowy: !w.pro && zostalo === 1, zostalo };
}

// Funkcje dopisane przez 02 w fixie Z07-07–Z07-09 (P-103, P-109); sygnatury 08 według prototypu (P-114 Q2a, zgłoszenie do 05).
export type ZrodloCofniecia = 'pytanie-serii' | 'historia';
export type PoziomDostepu = 'darmowa' | 'pro' | 'niepewny';

/** Pierwszy dzień następnego miesiąca kalendarzowego 'RRRR-MM-01' (R-105, P-065 (1a)); zła data → BladDanych. */
export function wznowienieLimitu(w: { dzis: string }): string {
  if (!czyData(w.dzis)) throw new BladDanych('wznowienieLimitu: zła data');
  const [r, m] = w.dzis.split('-').map(Number);
  return m === 12 ? `${r + 1}-01-01` : `${r}-${String(m + 1).padStart(2, '0')}-01`;
}

const ZRODLA_COFNIECIA: readonly string[] = ['pytanie-serii', 'historia'];
/** „Cofnij” w pytaniu o serię (L-19, P-091 (7b), P-103 (7)): dzień limitu wraca tylko z pytania, gdy seria zaczęła dzień bez innych dodań. */
export function cofniecieSerii(w: { dni: DzienLimitu[]; dzienSerii: string; seriaZaczelaDzien: boolean; inneDodaniaDnia: number; zrodlo: ZrodloCofniecia }): { dni: DzienLimitu[]; zwrocono: boolean } {
  const { dni, dzienSerii, seriaZaczelaDzien, inneDodaniaDnia, zrodlo } = w;
  if (!Array.isArray(dni) || !czyData(dzienSerii) || typeof seriaZaczelaDzien !== 'boolean' || !Number.isInteger(inneDodaniaDnia) || inneDodaniaDnia < 0 || !ZRODLA_COFNIECIA.includes(zrodlo)) {
    throw new BladDanych('cofniecieSerii: złe dane wejściowe');
  }
  const zwraca = zrodlo === 'pytanie-serii' && seriaZaczelaDzien && inneDodaniaDnia === 0 && dni.some((d) => d.data === dzienSerii);
  return { dni: zwraca ? dni.filter((d) => d.data !== dzienSerii) : dni, zwrocono: zwraca };
}

/** Scalenie list dni z dwóch urządzeń (R-048, P-103 (6a)): suma po dacie, `pro` = OR, żaden dzień nie ginie (KP-15), rosnąco po dacie. */
export function scalDni(w: { a: DzienLimitu[]; b: DzienLimitu[] }): DzienLimitu[] {
  sprawdzDni(w.a, 'scalDni');
  sprawdzDni(w.b, 'scalDni');
  const wg = new Map<string, boolean>();
  for (const d of [...w.a, ...w.b]) wg.set(d.data, (wg.get(d.data) ?? false) || d.pro);
  return [...wg.entries()].sort(([x], [y]) => (x < y ? -1 : x > y ? 1 : 0)).map(([data, pro]) => ({ data, pro }));
}

const POZIOMY: readonly string[] = ['darmowa', 'pro', 'niepewny'];
/** Okno „Uczciwe zasady” (P-089 (3a), P-103 (5a), R-120): raz, po minionym dniu z robótką bez Pro, tylko w pewnym stanie darmowym, nigdy na liczniku. */
export function oknoUczciweZasady(w: { dni: DzienLimitu[]; dzis: string; widziane: boolean; poziom: PoziomDostepu; ekran: string }): boolean {
  sprawdzDni(w.dni, 'oknoUczciweZasady');
  if (!czyData(w.dzis) || typeof w.widziane !== 'boolean' || !POZIOMY.includes(w.poziom) || typeof w.ekran !== 'string') {
    throw new BladDanych('oknoUczciweZasady: złe dane wejściowe');
  }
  if (w.widziane || w.poziom !== 'darmowa' || w.ekran === 'licznik') return false;
  return scalDni({ a: w.dni, b: [] }).some((d) => !d.pro && d.data < w.dzis);
}
