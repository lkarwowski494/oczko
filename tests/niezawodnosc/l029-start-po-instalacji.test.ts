// P-271 (L-029 Treningu, ZK-07): ekran awaryjny po przerwanym pierwszym starcie po instalacji. Trzy pytania koordynatora: (1) świeża
// instalacja z jednym przerwanym startem nie wchodzi w tryb awaryjny, (2) wyjście do tła przed kamieniem nie jest awarią, (3) etap
// poprzedniego startu w „Zgłoś problem” trybu awaryjnego (bez danych osobowych). Logika czysta; kompozycja w l029-kompozycja.test.ts.
import { kamienMilowy, odczytajStan, poczatekStartu, wyjscieDoTla, STAN_POCZATKOWY, type StanStartu } from '../../src/niezawodnosc/start';
import { odczytajEtap, opisEtapu } from '../../src/niezawodnosc/etap-startu';

type Krok = 'start' | 'tlo' | 'kamien';
/** Jak w aplikacji: stan przechodzi przez plik JSON; brak pliku = świeża instalacja. */
function przebieg(kroki: readonly Krok[]): ('normalny' | 'awaryjny')[] {
  let plik: string | null = null;
  const d: ('normalny' | 'awaryjny')[] = [];
  for (const k of kroki) {
    const s = odczytajStan(plik);
    if (k === 'start') { const p = poczatekStartu(s); d.push(p.awaryjny ? 'awaryjny' : 'normalny'); plik = JSON.stringify(p.stan); }
    else plik = JSON.stringify(k === 'tlo' ? wyjscieDoTla(s) : kamienMilowy(s));
  }
  return d;
}

describe('L-029 / P-271 — start po instalacji', () => {
  test('(1) [ZIELONY-OK: dowód, że przypadek L-029 nie dotyczy Oczka] świeża instalacja, pierwszy start przerwany → drugi start normalny (próg liczy poprzednie nieudane, nie bieżący)', () => {
    expect(przebieg(['start', 'start'])).toEqual(['normalny', 'normalny']);
  });
  test('(2) instalacja → otwarcie → natychmiastowe wyjście do tła (proces potem ubity) ×3 → żaden start nie jest awaryjny', () => {
    expect(przebieg(['start', 'tlo', 'start', 'tlo', 'start', 'tlo', 'start'])).toEqual(['normalny', 'normalny', 'normalny', 'normalny']);
  });
  test('(2) wyjście do tła przed kamieniem kończy start bez awarii: licznik zerowany, start nie „w toku”', () => {
    expect(wyjscieDoTla({ nieudane: 1, wToku: true })).toEqual({ nieudane: 0, wToku: false });
  });
  test('(2) tło na ekranie awaryjnym (start nie w toku) nie zeruje licznika — pętla awarii zostaje wykryta', () => {
    const awaryjny: StanStartu = { nieudane: 2, wToku: false };
    expect(wyjscieDoTla(awaryjny)).toEqual(awaryjny);
    expect(przebieg(['start', 'start', 'start', 'tlo', 'start'])).toEqual(['normalny', 'normalny', 'awaryjny', 'awaryjny']);
  });
  test('(2) awaria na pierwszym planie (bez tła) nadal liczy się: dwa nieudane → trzeci awaryjny', () => {
    expect(przebieg(['start', 'start', 'start'])).toEqual(['normalny', 'normalny', 'awaryjny']);
    expect(wyjscieDoTla(STAN_POCZATKOWY)).toEqual(STAN_POCZATKOWY);
  });
  test('(3) etap startu: zapis → odczyt → jedna linia techniczna (etap i czas, bez danych osobowych)', () => {
    expect(odczytajEtap(JSON.stringify({ etap: 'kontener', ms: 840 }))).toEqual({ etap: 'kontener', ms: 840 });
    expect(opisEtapu({ etap: 'kontener', ms: 840 })).toBe('boot_phase=kontener boot_ms=840');
    expect(opisEtapu(null)).toBe('boot_phase=-');
  });
  test.each([null, 'nie-json', '{"etap":"x","ms":1}', '{"etap":"poczatek","ms":-1}', '{"etap":"kamien"}'])('(3) zapis etapu %j uszkodzony → brak (diagnostyka nie blokuje)', (z) => {
    expect(odczytajEtap(z)).toBeNull();
  });
});
