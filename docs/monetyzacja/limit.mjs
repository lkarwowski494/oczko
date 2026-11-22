// limit.mjs — wzorzec reguły darmowego limitu dni z robótką (model V4, P-057; rola 02, kontrakt płatności, 2026-10-22).
// Czysta funkcja bez zależności: rola 08 przepisuje ją na TypeScript w kodzie aplikacji; wektory: wektory-limitu.json.
// Dzień z robótką = data lokalna (strefa urządzenia w chwili zdarzenia, RD-16), w której praca zaczęła się pierwszym +1.
// Strażnik woła startDnia() tylko przy zdarzeniach, dla których wolaStraznika() daje true (P-067: +1 na każdym liczniku i urządzeniu, wpisanie; nie: zerowanie, −1, edycja historii).

export const LIMIT_DNI = 5; // D2: „dzierganie raz w tygodniu zawsze darmowe” (miesiąc ma najwyżej 5 tych samych dni tygodnia)
export const PRZERWA_MS = 60 * 60 * 1000; // D3: +1 po północy otwiera nowy dzień dopiero po przerwie ≥ 60 min

const DATA = /^\d{4}-\d{2}-\d{2}$/;

// Błąd danych wejściowych (Z07-07, R-178): test i wołający rozpoznają go po kodzie, nie po dowolnym wyjątku.
export class BladDanych extends Error {
  constructor(komunikat) { super(komunikat); this.name = 'BladDanych'; this.kod = 'BLAD_DANYCH'; }
}

// Darmowe dni miesiąca (D5) liczone po różnych datach (P-103 (1a), R-102): duplikat daty z dwóch urządzeń liczy się raz,
// a data jest dniem z Pro, gdy którykolwiek jej wpis ma pro (P-103 (6a)).
function darmoweDni(lista, miesiac) {
  const zPro = new Set(lista.filter((d) => d.pro).map((d) => d.data));
  return new Set(lista.filter((d) => d.data.startsWith(miesiac) && !zPro.has(d.data)).map((d) => d.data)).size;
}

// Które zdarzenia wołają strażnika startDnia() (P-067): każde +1 na dowolnym liczniku i z każdego urządzenia
// oraz ręczne wpisanie wartości (D4) zaczynają dzień; zerowanie, −1 i edycja historii to korekty danych (zawsze wolne, KP-02, L-07).
const ZACZYNA_DZIEN = { plus: true, wpisanie: true, zerowanie: false, minus: false, 'edycja-historii': false };
export function wolaStraznika({ rodzaj }) {
  if (!(rodzaj in ZACZYNA_DZIEN)) throw new BladDanych(`wolaStraznika: nieznany rodzaj zdarzenia ${rodzaj}`);
  return ZACZYNA_DZIEN[rodzaj];
}

// dni: zapisane dni z robótką [{ data: 'RRRR-MM-DD', pro: boolean }] (pro: czy w chwili startu dnia Pro było aktywne).
// dzis: data lokalna zdarzenia; teraz i ostatniPlus: ms (ostatniPlus = poprzednie +1 w dowolnym projekcie albo null).
// Zwraca: dozwolone (czy wolno dodać rząd), zapis (dzień do dopisania albo null), zostalo (darmowe dni w miesiącu po zdarzeniu).
export function startDnia({ dni, dzis, teraz, ostatniPlus, pro, limit = LIMIT_DNI, przerwa = PRZERWA_MS }) {
  if (!Array.isArray(dni) || !DATA.test(dzis) || !Number.isFinite(teraz)) throw new BladDanych('startDnia: złe dane wejściowe');
  const miesiac = dzis.slice(0, 7);
  // D5: do limitu liczą się tylko dni bez aktywnego Pro.
  const darmowe = (lista) => darmoweDni(lista, miesiac);
  const wynik = (dozwolone, zapis) => {
    const po = zapis ? [...dni, zapis] : dni;
    return { dozwolone, zapis, zostalo: Math.max(0, limit - darmowe(po)) };
  };
  // Praca w toku (L-04): kolejne +1 bez przerwy nie otwiera nowego dnia, także po północy.
  if (ostatniPlus !== null && teraz - ostatniPlus >= 0 && teraz - ostatniPlus < przerwa) return wynik(true, null);
  // Dzień już policzony (L-02, L-06, L-12): rozpoczęty dzień zawsze do końca.
  if (dni.some((d) => d.data === dzis)) return wynik(true, null);
  if (pro) return wynik(true, { data: dzis, pro: true });
  if (darmowe(dni) < limit) return wynik(true, { data: dzis, pro: false });
  return wynik(false, null); // L-03: na limicie; dane, historia, eksport działają dalej (poza tą funkcją)
}

// Stan zawczasu (P-065 (1a), (2a)): czy ekran licznika ma pokazać limit zamiast +1 i czy to ostatni darmowy dzień.
// Ta sama reguła co startDnia(), ale bez zapisu dnia i bez zmiany wejścia; praca w toku po północy (L-04) nie pokazuje limitu.
// zostalo: darmowe dni w miesiącu przed dzisiejszym startem (licznik dni na liście projektów i w Ustawieniach).
export function mozeZaczacDzien({ dni, dzis, teraz, ostatniPlus, pro, limit = LIMIT_DNI, przerwa = PRZERWA_MS }) {
  const start = startDnia({ dni, dzis, teraz, ostatniPlus, pro, limit, przerwa });
  const zostalo = Math.max(0, limit - darmoweDni(dni, dzis.slice(0, 7)));
  return { limitZawczasu: !start.dozwolone, ostatniDarmowy: !pro && zostalo === 1, zostalo };
}

// Data wznowienia liczenia na limicie (Z07-07, R-105): pierwszy dzień następnego miesiąca kalendarzowego,
// w grudniu z rokiem + 1 („Counting is paused until January 1.”, P-065 (1a)). Zwraca 'RRRR-MM-01'.
export function wznowienieLimitu({ dzis }) {
  if (typeof dzis !== 'string' || !DATA.test(dzis)) throw new BladDanych('wznowienieLimitu: zła data');
  const [r, m] = dzis.split('-').map(Number);
  return m === 12 ? `${r + 1}-01-01` : `${r}-${String(m + 1).padStart(2, '0')}-01`;
}

// „Cofnij” w pytaniu o serię przypadkowych stuknięć (RD-17, BR-LIC-019; L-19, P-091 (7b), P-103 (7)).
// Dzień limitu wraca tylko, gdy seria zaczęła ten dzień i dziś nie było innego zdarzenia zaczynającego dzień
// (wolaStraznika = true; liczy się także dodanie później cofnięte −1, L-06). Cofnięcie z historii nigdy nie zwraca dnia.
// dni: lista dni z robótką; dzienSerii: data dnia, który zaczęłaby seria; zwraca nową listę i czy dzień wrócił.
const ZRODLA_COFNIECIA = ['pytanie-serii', 'historia'];
export function cofniecieSerii({ dni, dzienSerii, seriaZaczelaDzien, inneDodaniaDnia, zrodlo }) {
  if (!Array.isArray(dni) || typeof dzienSerii !== 'string' || !DATA.test(dzienSerii) || typeof seriaZaczelaDzien !== 'boolean'
    || !Number.isInteger(inneDodaniaDnia) || inneDodaniaDnia < 0 || !ZRODLA_COFNIECIA.includes(zrodlo)) throw new BladDanych('cofniecieSerii: złe dane wejściowe');
  const zwraca = zrodlo === 'pytanie-serii' && seriaZaczelaDzien && inneDodaniaDnia === 0 && dni.some((d) => d.data === dzienSerii);
  return { dni: zwraca ? dni.filter((d) => d.data !== dzienSerii) : dni, zwrocono: zwraca };
}

const sprawdzDni = (lista, gdzie) => {
  if (!Array.isArray(lista) || !lista.every((d) => d && typeof d.data === 'string' && DATA.test(d.data) && typeof d.pro === 'boolean')) throw new BladDanych(`${gdzie}: zła lista dni`);
};

// Scalenie list dni z dwóch urządzeń (Z07-09, R-048; P-103 (6a); wzorzec dla `scal` roli 05, ADR-0005):
// suma po dacie (jedna data = jeden dzień, L-11), dzień raz zaczęty z Pro zostaje dniem z Pro (OR),
// żaden rozpoczęty dzień nie ginie (KP-15, L-16). Wynik posortowany po dacie, niezależny od kolejności urządzeń.
export function scalDni({ a, b }) {
  sprawdzDni(a, 'scalDni'); sprawdzDni(b, 'scalDni');
  const wg = new Map();
  for (const d of [...a, ...b]) wg.set(d.data, (wg.get(d.data) ?? false) || d.pro);
  return [...wg.keys()].sort().map((data) => ({ data, pro: wg.get(data) }));
}

// Okno „Uczciwe zasady” (P-089 (3a), P-103 (5a); Z07-09, R-120): raz, gdy minął co najmniej jeden dzień z robótką bez Pro
// (data < dzis; dzień z Pro według OR jak w scalDni), tylko w pewnym stanie darmowym, nigdy na ekranie licznika.
// poziom: 'darmowa' (sklep odpowiedział: brak Pro) | 'pro' | 'niepewny' (błąd sklepu bez pamięci); ekran: miejsce, w którym okno by się pokazało.
const POZIOMY = ['darmowa', 'pro', 'niepewny'];
export function oknoUczciweZasady({ dni, dzis, widziane, poziom, ekran }) {
  sprawdzDni(dni, 'oknoUczciweZasady');
  if (typeof dzis !== 'string' || !DATA.test(dzis) || typeof widziane !== 'boolean' || !POZIOMY.includes(poziom) || typeof ekran !== 'string') throw new BladDanych('oknoUczciweZasady: złe dane wejściowe');
  if (widziane || poziom !== 'darmowa' || ekran === 'licznik') return false;
  return scalDni({ a: dni, b: [] }).some((d) => !d.pro && d.data < dzis);
}
