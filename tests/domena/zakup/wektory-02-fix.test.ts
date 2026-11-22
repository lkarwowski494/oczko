// Testy roli 08 (P-114 Q2a): sekcje wektorów roli 02 bez testu 07 — wznowienieLimitu (Z-10*), cofniecieSerii (L-19*), scalDni (L-20*),
// oknoUczciweZasady (O-*) w docs/monetyzacja/wektory-limitu.json oraz komunikatZakupu (K-*) w wektory-dostepu.json (P-103, P-109).
// Wyrocznia: wektor (rola 02), nie kod; prototyp: docs/monetyzacja/limit.mjs, dostep.mjs. Każda sekcja z licznością „wykonano N z N”.
import wektoryLimituJson from '../../../docs/monetyzacja/wektory-limitu.json';
import wektoryDostepuJson from '../../../docs/monetyzacja/wektory-dostepu.json';
import { wznowienieLimitu, cofniecieSerii, scalDni, oknoUczciweZasady } from '../../../src/domena/limit';
import { komunikatZakupu } from '../../../src/domena/dostep';
import { BladDanych } from '../../../src/domena/bledy';
import { czyBlad, licznikWektorow } from './pomocnicze';

type Wektor = { id: string; scenariusz: string; wejscie: unknown; oczekiwane: unknown };
const L = wektoryLimituJson as unknown as Record<string, Wektor[]>;
const D = wektoryDostepuJson as unknown as Record<string, Wektor[]>;

/** Błąd danych z kodem (Z07-07, R-178): BladDanych, nie dowolny wyjątek. */
function oczekujBladDanych(fn: () => unknown): void {
  expect(fn).toThrow(BladDanych);
}

const SEKCJE: [string, Wektor[], number, (wejscie: never) => unknown][] = [
  ['wznowienieLimitu (R-105)', L.wznowienieLimitu, 4, wznowienieLimitu],
  ['cofniecieSerii (L-19, P-091 7b, P-103 7)', L.cofniecieSerii, 9, cofniecieSerii],
  ['scalDni (R-048, P-103 6a)', L.scalDni, 5, scalDni],
  ['oknoUczciweZasady (P-089 3a, P-103 5a, R-120)', L.oknoUczciweZasady, 11, oknoUczciweZasady],
  ['komunikatZakupu (MON-04, R-111)', D.komunikatZakupu, 5, komunikatZakupu],
];

describe.each(SEKCJE)('P-114 Q2a %s: wektory roli 02', (_nazwa, wektory, ile, fn) => {
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`${w.id} ${w.scenariusz}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      const wywolaj = () => fn(w.wejscie as never);
      if (czyBlad(w.oczekiwane)) oczekujBladDanych(wywolaj);
      else expect(wywolaj()).toEqual(w.oczekiwane);
    });
  });
  test(`liczność: wykonano ${wektory.length} z ${ile} wektorów (pusty zbiór = porażka)`, () => {
    expect(wektory.length).toBe(ile);
    licznik.wynik(wektory.length);
  });
});
