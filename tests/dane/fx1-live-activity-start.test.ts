// FX1 P3 (KO-246, recenzja niezależna FA2): dwa szybkie +1 → dwa `poZapisie` bez czekania; oba widziały `aktywna() = false` i robiły podwójny `start` Live Activity
// (dawniej chroniła flaga synchroniczna; teraz stan natywny, ADR-0037). Poprawka: decyzja i wywołanie portu Live Activity idą jedną kolejką. Atrapa tylko na granicy platformy.
import type { LiveActivity, Zegarek } from '../../src/domena/porty';
import { dodajRzad } from '../../src/przypadki-uzycia/licznik';
import { odswiezEkranBlokady } from '../../src/przypadki-uzycia/ekran-blokady';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { przygotuj, wykonaj } from './pomocnicze/srodowisko';

test('FX1 P3: dwa równoczesne odświeżenia po +1 (zdarzenie „liczenie”) → jeden start i jedna aktualizacja, nie dwa starty', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 3)]);
  expect((await dodajRzad(s.z, { licznikId: 'l1' })).ok).toBe(true);
  const wywolania: string[] = [];
  let natywnieAktywna = false; // jak `Activity.activities` po zakończeniu `request`: prawda dopiero po starcie
  const liveActivity: LiveActivity = {
    start: async () => { wywolania.push('start'); await new Promise((r) => setTimeout(r, 20)); natywnieAktywna = true; return { ok: true, wartosc: undefined }; },
    aktualizuj: async () => { wywolania.push('aktualizuj'); },
    zakoncz: async () => { wywolania.push('zakoncz'); },
    aktywna: () => natywnieAktywna,
  };
  const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async () => undefined, odbieraj: () => () => undefined };
  const z = { ...s.z, liveActivity, zegarek };
  const w = { licznikId: 'l1', nazwa: 'Sweter', dostep: { pro: false, wygasa: null }, zdarzenie: 'liczenie' as const };
  await Promise.all([odswiezEkranBlokady(z, w), odswiezEkranBlokady(z, w)]);
  expect(wywolania).toEqual(['start', 'aktualizuj']);
});
