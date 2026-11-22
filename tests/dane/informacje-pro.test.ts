// Okno „Uczciwe zasady” na bazie aplikacji (P-089 (3a), KP-16): pierwszy dzień z robótką → nie tego dnia, następnego tak; po zamknięciu nigdy;
// Pro albo stan niepewny → nie; dzień z poprzedniego miesiąca też się liczy (dni limitu z całej bazy, nie z bieżącego miesiąca).
import { dodajRzad, utworzSzybkiLicznik } from '../../src/przypadki-uzycia/licznik';
import { oznaczOknoWidziane, pokazacOknoUczciweZasady } from '../../src/przypadki-uzycia/informacje-pro';
import { DOBA, przygotuj } from './pomocnicze/srodowisko';

const okno = async (s: Awaited<ReturnType<typeof przygotuj>>, poziom: 'darmowa' | 'pro' | 'niepewny' = 'darmowa') => {
  const w = await pokazacOknoUczciweZasady(s.z, { poziom, ekran: 'start' });
  if (!w.ok) throw new Error(w.powod);
  return w.wartosc;
};

test('P-089 (3a): dzień 1 → nie; dzień 2 → tak; Pro/niepewny → nie; po zamknięciu → nie', async () => {
  const s = await przygotuj();
  const n = await utworzSzybkiLicznik(s.z);
  if (!n.ok) throw new Error();
  await dodajRzad(s.z, { licznikId: n.wartosc.licznikId });
  expect(await okno(s)).toBe(false);
  s.zegar.przesun(DOBA);
  expect([await okno(s), await okno(s, 'pro'), await okno(s, 'niepewny')]).toEqual([true, false, false]);
  await oznaczOknoWidziane(s.z);
  expect(await okno(s)).toBe(false);
});

test('dzień z robótką 31 października, start 1 listopada → okno (dni z całej bazy)', async () => {
  const s = await przygotuj();
  s.zegar.ustaw(Date.UTC(2026, 9, 31, 18));
  const n = await utworzSzybkiLicznik(s.z);
  if (!n.ok) throw new Error();
  await dodajRzad(s.z, { licznikId: n.wartosc.licznikId });
  s.zegar.ustaw(Date.UTC(2026, 10, 1, 18));
  expect(await okno(s)).toBe(true);
});
