// M1-audytor-generalny-024 (źródła 05-architekt-002, 05-architekt-505; ADR-0008 (3), ARCH-22): skrócenie dziennika +1 po COMMIT, które
// zawiedzie (pełny dysk przy zapisie pliku tymczasowego — natywnie `skroc` rzuca, plik dziennika bez zmian), nie odbiera scaleniu sukcesu:
// stuknięcia są już w bazie, linie zostają w dzienniku do następnego razu, a ponowne scalenie ich nie dubluje (R-022). Strona Swift:
// `DziennikTests.testSkrocenieNieudanyZapisZostawiaPlik` (swift test na macOS).
import type { ZdarzenieWejsciowe } from '../../src/domena/porty';
import { scalDziennik } from '../../src/przypadki-uzycia/dziennik';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { MIN, T0, ile, jeden, przygotuj, wykonaj } from './pomocnicze/srodowisko';

const linia = (id: string, rodzic: string, i: number): ZdarzenieWejsciowe => ({
  id, licznikId: 'l1', rodzaj: 'plus', rodzice: [rodzic], czasMs: T0 + (i + 1) * MIN, strefa: 'Europe/Warsaw', dzien: '2026-10-22', zrodlo: 'ekran_blokady', urzadzenie: 'iphone-test', pro: false,
});

test('skroc rzuca po COMMIT → scalDziennik { ok: true } ze scalonymi liniami; linie zostają; następne scalenie bez dubli i ze skróceniem', async () => {
  const s = await przygotuj();
  s.pro.wartosc = true;
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 10)]);
  s.dziennik.linie.push(linia('d1', 'l1-z10', 0), linia('d2', 'd1', 1));
  const skroc = s.dziennik.skroc.bind(s.dziennik);
  s.dziennik.skroc = async () => { throw new Error('ENOSPC: zapis pliku tymczasowego'); };
  await expect(scalDziennik(s.z)).resolves.toEqual({ ok: true, wartosc: { scalono: 2, pominieto: 0, potwierdzone: [] } });
  expect(s.dziennik.linie.map((l) => l.id)).toEqual(['d1', 'd2']); // linie do następnego razu
  s.dziennik.skroc = skroc;
  await scalDziennik(s.z);
  expect(await ile(s.baza, 'zdarzenie', "zrodlo = 'ekran_blokady'")).toBe(2);
  expect(await jeden<{ wartosc: number }>(s.baza, "SELECT wartosc FROM licznik WHERE id = 'l1'")).toEqual({ wartosc: 12 });
  expect(s.dziennik.skrocono).toEqual(['d2']);
});
