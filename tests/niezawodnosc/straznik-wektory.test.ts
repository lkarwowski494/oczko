// Rola 12 E2: strażnik startu (ADR-0019, P-080) wobec wektorów wzorca roli 12 (`wektory-straznika.json`) i modelu odniesienia.
// Wyrocznia z innego źródła niż kod 08: sekwencje z wzorca roli 12 oraz model „historia startów” liczony od końca (własność, fast-check).
import fc from 'fast-check';
import { PROG_NIEUDANYCH_STARTOW } from '../../src/konfiguracja';
import { kamienMilowy, odczytajStan, poczatekStartu, sprobujNormalnie, STAN_POCZATKOWY, type StanStartu } from '../../src/niezawodnosc/start';
import wektory from './wektory-straznika.json';

type Krok = 'start' | 'kamien' | 'sprobuj';

/** Kroki jak w aplikacji: stan przechodzi przez plik (JSON), więc każdy krok czyta to, co zapisał poprzedni. */
function przebieg(kroki: readonly Krok[], prog: number): { decyzje: ('normalny' | 'awaryjny')[]; koniec: StanStartu } {
  let plik: string | null = null;
  const decyzje: ('normalny' | 'awaryjny')[] = [];
  for (const k of kroki) {
    const s = odczytajStan(plik);
    if (k === 'start') {
      const p = poczatekStartu(s, prog);
      decyzje.push(p.awaryjny ? 'awaryjny' : 'normalny');
      plik = JSON.stringify(p.stan);
    } else plik = JSON.stringify(k === 'kamien' ? kamienMilowy(s) : sprobujNormalnie(s, prog));
  }
  return { decyzje, koniec: odczytajStan(plik) };
}

describe('P-080 ADR-0019 strażnik startu — wektory roli 12', () => {
  test('P-080: próg wektorów = PROG_NIEUDANYCH_STARTOW', () => expect(wektory.prog).toBe(PROG_NIEUDANYCH_STARTOW));

  test.each(wektory.sekwencje.map((w) => [w.id, w.opis, w] as const))('P-080 %s: %s', (_id, _opis, w) => {
    expect(przebieg(w.kroki as Krok[], wektory.prog)).toEqual({ decyzje: w.decyzje, koniec: w.koniec });
  });

  test.each(wektory.zapisy.map((w) => [w.id, w.surowy] as const))('P-080 %s: uszkodzony zapis %j → stan początkowy', (_id, surowy) => {
    expect(odczytajStan(surowy)).toEqual(STAN_POCZATKOWY);
  });

  // Model odniesienia: decyzja startu zależy tylko od historii. Liczymy od końca: ile startów normalnych z rzędu nie doszło do kamienia.
  // „Spróbuj normalnie” to start normalny w procesie; start awaryjny nie jest startem normalnym i nie przerywa serii.
  function modelDecyzja(historia: readonly Krok[], prog: number): 'normalny' | 'awaryjny' {
    const normalne: { kamien: boolean; zProby: boolean }[] = [];
    let wTrybieAwaryjnym = false;
    for (const k of historia) {
      if (k === 'kamien') { if (normalne.length && !wTrybieAwaryjnym) normalne[normalne.length - 1].kamien = true; continue; }
      if (k === 'sprobuj') { if (wTrybieAwaryjnym) { normalne.push({ kamien: false, zProby: true }); wTrybieAwaryjnym = false; } continue; }
      // Seria nieudanych przed tym startem: normalne starty od najnowszego wstecz do pierwszego z kamieniem. Nieudana próba po
      // „spróbuj normalnie” od razu daje tryb awaryjny (jedna próba, wzorzec 12).
      let seria = 0;
      let nieudanaProba = false;
      for (let i = normalne.length - 1; i >= 0 && !normalne[i].kamien; i--) {
        seria++;
        if (normalne[i].zProby) { nieudanaProba = true; break; }
      }
      wTrybieAwaryjnym = nieudanaProba || seria >= prog;
      if (!wTrybieAwaryjnym) normalne.push({ kamien: false, zProby: false });
    }
    return wTrybieAwaryjnym ? 'awaryjny' : 'normalny';
  }

  test('P-080: własność — decyzja każdego startu równa modelowi historii (losowe ciągi start / kamień / spróbuj)', () => {
    const krok = fc.constantFrom<Krok>('start', 'start', 'start', 'kamien', 'sprobuj');
    fc.assert(fc.property(fc.array(krok, { maxLength: 40 }), (kroki) => {
      // Kroki niemożliwe w aplikacji odrzucamy: kamień tylko po starcie normalnym, „spróbuj” tylko z ekranu awaryjnego.
      const wykonalne: Krok[] = [];
      let tryb: 'brak' | 'normalny' | 'awaryjny' = 'brak';
      for (const k of kroki) {
        if (k === 'kamien' && tryb !== 'normalny') continue;
        if (k === 'sprobuj' && tryb !== 'awaryjny') continue;
        wykonalne.push(k);
        if (k === 'start') tryb = przebieg(wykonalne, PROG_NIEUDANYCH_STARTOW).decyzje.at(-1) ?? 'brak';
        if (k === 'sprobuj') tryb = 'normalny';
        if (k === 'kamien') tryb = 'brak';
      }
      const { decyzje } = przebieg(wykonalne, PROG_NIEUDANYCH_STARTOW);
      const oczekiwane = wykonalne.flatMap((k, i) => (k === 'start' ? [modelDecyzja(wykonalne.slice(0, i + 1), PROG_NIEUDANYCH_STARTOW)] : []));
      expect(decyzje).toEqual(oczekiwane);
    }));
  });
});
