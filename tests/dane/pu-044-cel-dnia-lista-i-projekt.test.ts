// PU-044 („cel dnia na liście projektów i w projekcie, projekt z terminem wyżej”): prawdziwa baza SQLite → modele `widokProjektow` i `widokProjektu` → teksty `stanListy` i `stanProjektu`
// (angielski, język testowy). Termin 2026-10-31 przy części z celem 100 rzędów i 0 zrobionych → cel 10 dziennie (dziś 2026-10-22): na liście „Today: 0 of 10 rows”, w projekcie
// „Done by Oct 31, today 0 of 10 rows”, a w „W toku” projekt z terminem stoi nad projektem bez terminu, choć ten drugi pracował później.
// Poza Jest: wygląd wiersza i ekranu, nawigacja Projekty → projekt oraz brak celu na karcie „Dziś” na urządzeniu (scenariusz 108, oczekujący).
import { stanListy } from '../../src/kompozycja/projekty';
import { stanProjektu } from '../../src/kompozycja/projekt';
import type { Jezyk } from '../../src/kompozycja/licznik';
import { widokProjektow } from '../../src/przypadki-uzycia/widok-projektow';
import { widokProjektu } from '../../src/przypadki-uzycia/widok-projektu';
import { tEn } from '../ekrany/pomoc';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { DOBA, T0, przygotuj, wykonaj } from './pomocnicze/srodowisko';

let j: Jezyk;
beforeAll(async () => { const t = await tEn(); j = { t, jezyk: () => 'en-US', zegar24h: () => false }; });

test('PU-044: po ustawieniu terminu lista pokazuje „Today: 0 of 10 rows” i stawia projekt nad bezterminowym, a projekt „Done by Oct 31, today 0 of 10 rows”', async () => {
  const s = await przygotuj(); // teraz 2026-10-22 12:00 Europe/Warsaw
  await wykonaj(s.baza, [
    projekt('bez', 'No deadline', T0, { ostatnia: T0 }), czesc('b1', 'bez', 'Body', 1, { cel: 50 }), ...licznik('bl', 'b1', 0),
    projekt('term', 'With deadline', T0, { ostatnia: T0 - 5 * DOBA }), czesc('t1', 'term', 'Body', 1, { cel: 100 }), ...licznik('tl', 't1', 0),
    ["UPDATE projekt SET termin_dzien = '2026-10-31' WHERE id = 'term'", []],
  ]);
  const w = await widokProjektow(s.z);
  if (!w.ok) throw new Error(w.powod);
  const lista = stanListy(w.wartosc, { zapytanie: '', j, terazMs: T0, strefa: 'Europe/Warsaw' });
  expect(lista.wToku.map((p) => p.id)).toEqual(['term', 'bez']);
  expect(lista.wToku[0].termin).toBe('Today: 0 of 10 rows');
  expect(lista.wToku[1].termin ?? null).toBeNull();

  const v = await widokProjektu(s.z, { projektId: 'term' });
  if (!v.ok) throw new Error(v.powod);
  expect(stanProjektu(v.wartosc, { j, terazMs: T0, strefa: 'Europe/Warsaw' }).termin).toBe('Done by Oct 31, today 0 of 10 rows');
});
