// Model widoku „History” (F-59; BR-DNI-001–003; P-191 P6a, P-195 Q3b): dni z robótką miesiąca, projekty wybranego dnia, tydzień wybranego
// dnia (od poniedziałku, z poprzednim) i miesiąc z kalendarza; pierwsze użycie bez danych.
import { widokHistorii } from '../../src/przypadki-uzycia/historia';
import { czesc, licznik, projekt, sesja } from './pomocnicze/dane-wejsciowe';
import { T0, przygotuj, wykonaj } from './pomocnicze/srodowisko';

test('22.10 (czwartek): 5 rzędów w „Sweter”; 23.10 sesja 40 min w „Szal”; tydzień 19–25.10 i miesiąc październik', async () => {
  const s = await przygotuj();
  const d23 = Date.UTC(2026, 9, 23, 18);
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 5), projekt('p2', 'Szal'),
    sesja('s1', 'p2', d23), ["UPDATE sesja SET stan = 'zakonczona', koniec_ms = ? WHERE id = 's1'", [d23 + 40 * 60_000]]]);
  const w = await widokHistorii(s.z, { miesiac: '2026-10', dzien: '2026-10-22' });
  if (!w.ok) throw new Error(w.powod);
  expect(w.wartosc.dniRobotki).toEqual(['2026-10-22', '2026-10-23']);
  expect(w.wartosc.dzien.map((p) => [p.nazwa, p.rzedy, p.czasMs])).toEqual([['Sweter', 5, null]]);
  expect([w.wartosc.tydzien.od, w.wartosc.tydzien.do, w.wartosc.tydzien.rzedy, w.wartosc.tydzien.czasMs]).toEqual(['2026-10-19', '2026-10-25', 5, 40 * 60_000]);
  expect(w.wartosc.miesiac).toEqual({ rzedy: 5, czasMs: 40 * 60_000, ukonczone: 0, dni: 2 });
  expect(w.wartosc.pierwsze).toBe(false);
  void T0;
});

test('pierwsze użycie: brak zdarzeń i sesji → pierwsze, bez dni', async () => {
  const s = await przygotuj();
  const w = await widokHistorii(s.z, { miesiac: '2026-10', dzien: '2026-10-22' });
  expect(w.ok && [w.wartosc.pierwsze, w.wartosc.dniRobotki, w.wartosc.miesiac.czasMs]).toEqual([true, [], null]);
});
