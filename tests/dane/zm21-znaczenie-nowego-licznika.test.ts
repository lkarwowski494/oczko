// PU-353 (katalog: „Oczekujące 1.0.2”). ZM-21 (U3, P-1090 (1), P-1098, P-1101): nowy licznik w nowej instalacji i w nowym projekcie ma
// `znaczenie = 'w_trakcie'` zapisane jawnie w INSERT (dziś polega na DEFAULT 'skonczone': projekt.ts:28, licznik.ts:157, licznik.ts:181);
// nowy licznik w istniejącym projekcie bierze znaczenie ostatnio używanego licznika projektu. Wyrocznia: decyzje P-1090 (1), P-1101;
// „ostatnio używany” = licznik projektu z najnowszym zdarzeniem (`czas_ms`) — definicja testu P-1115, do potwierdzenia przez 08 przy kodzie.
import { dodajLicznik, utworzSzybkiLicznik } from '../../src/przypadki-uzycia/licznik';
import { dodajCzescProjektu, utworzProjekt } from '../../src/przypadki-uzycia/projekt';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { MIN, T0, jeden, przygotuj, wykonaj } from './pomocnicze/srodowisko';

const znaczenie = async (s: Awaited<ReturnType<typeof przygotuj>>, id: string) => (await jeden<{ znaczenie: string }>(s.baza, 'SELECT znaczenie FROM licznik WHERE id = ?', [id])).znaczenie;
/** Projekt p1, część c1, liczniki a (najnowsze zdarzenie, znaczenie `ostatni`) i b (starsze zdarzenia, znaczenie przeciwne). */
async function projektZDwoma(ostatni: 'skonczone' | 'w_trakcie') {
  const s = await przygotuj();
  const inny = ostatni === 'skonczone' ? 'w_trakcie' : 'skonczone';
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'),
    ...licznik('b', 'c1', 3, { t: T0, kolejnosc: 1 }), ...licznik('a', 'c1', 2, { t: T0 + 30 * MIN, kolejnosc: 2 }),
    ['UPDATE licznik SET znaczenie = ? WHERE id = ?', [ostatni, 'a']], ['UPDATE licznik SET znaczenie = ? WHERE id = ?', [inny, 'b']]]);
  return s;
}

describe('ZM-21 znaczenie nowego licznika (U3)', () => {
  test('ZM-21 PU-353: pierwszy licznik w świeżej instalacji (utworzSzybkiLicznik) → w_trakcie', async () => {
    const s = await przygotuj();
    const w = await utworzSzybkiLicznik(s.z);
    if (!w.ok) throw new Error(w.powod);
    expect(await znaczenie(s, w.wartosc.licznikId)).toBe('w_trakcie');
  });

  test('ZM-21 PU-353: nowy projekt (utworzProjekt) — liczniki części → w_trakcie', async () => {
    const s = await przygotuj();
    const w = await utworzProjekt(s.z, { nazwa: 'Czapka', czesci: ['Główka', 'Ściągacz'] });
    if (!w.ok) throw new Error(w.powod);
    for (const c of w.wartosc.czesci) expect({ c: c.nazwa, z: await znaczenie(s, c.licznikId) }).toEqual({ c: c.nazwa, z: 'w_trakcie' });
  });

  // Oba kierunki w jednym teście: wariant `skonczone` przechodzi już dziś przez DEFAULT, więc sam nie mógłby paść przed kodem (zasada roli 07 nr 3).
  test('ZM-21 PU-353: „Dodaj licznik” w istniejącym projekcie bierze znaczenie ostatnio używanego (w_trakcie i skonczone)', async () => {
    for (const ostatni of ['w_trakcie', 'skonczone'] as const) {
      const s = await projektZDwoma(ostatni);
      const w = await dodajLicznik(s.z, { czescId: 'c1', rodzaj: 'rzedy' });
      if (!w.ok) throw new Error(w.powod);
      expect({ ostatni, nowy: await znaczenie(s, w.wartosc.licznikId) }).toEqual({ ostatni, nowy: ostatni });
    }
  });

  test('ZM-21 PU-353: nowa część istniejącego projektu (dodajCzescProjektu) bierze znaczenie ostatnio używanego (w_trakcie i skonczone)', async () => {
    for (const ostatni of ['w_trakcie', 'skonczone'] as const) {
      const s = await projektZDwoma(ostatni);
      const w = await dodajCzescProjektu(s.z, { projektId: 'p1', nazwa: 'Tył', cel: null });
      if (!w.ok) throw new Error(w.powod);
      expect({ ostatni, nowy: await znaczenie(s, w.wartosc.licznikId) }).toEqual({ ostatni, nowy: ostatni });
    }
  });
});
