// Próbka projektu (U-10; design-spec „Kalkulator Swatch” → „Z projektu”): zapis {oczka, na_cm} w `projekt.probka` (JSON) bez ruszania
// innych kluczy (np. `rzedy` z komentarza schematu), odczyt w `widokProjektu`; zły zapis w bazie = brak próbki (brak zostaje brakiem).
import { ustawProbke } from '../../src/przypadki-uzycia/projekt';
import { widokProjektu } from '../../src/przypadki-uzycia/widok-projektu';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { jeden, przygotuj, wykonaj } from './pomocnicze/srodowisko';

async function srodowisko() {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 0)]);
  return s;
}

test('zapis 22 na 10 cm → JSON, odczyt w widoku; inne klucze zostają; null usuwa próbkę', async () => {
  const s = await srodowisko();
  await s.baza.run(`UPDATE projekt SET probka = '{"rzedy":30}' WHERE id = 'p1'`);
  expect(await ustawProbke(s.z, { projektId: 'p1', probka: { oczka: 22, naCm: 10 } })).toEqual({ ok: true, wartosc: undefined });
  expect(JSON.parse((await jeden<{ probka: string }>(s.baza, "SELECT probka FROM projekt WHERE id = 'p1'")).probka)).toEqual({ rzedy: 30, oczka: 22, na_cm: 10 });
  const w = await widokProjektu(s.z, { projektId: 'p1' });
  expect(w.ok && w.wartosc.probka).toEqual({ oczka: 22, naCm: 10 });
  await ustawProbke(s.z, { projektId: 'p1', probka: { oczka: 20.5, naCm: 10.16 } });
  const w2 = await widokProjektu(s.z, { projektId: 'p1' });
  expect(w2.ok && w2.wartosc.probka).toEqual({ oczka: 20.5, naCm: 10.16 });
  await ustawProbke(s.z, { projektId: 'p1', probka: null });
  expect(JSON.parse((await jeden<{ probka: string }>(s.baza, "SELECT probka FROM projekt WHERE id = 'p1'")).probka)).toEqual({ rzedy: 30 });
});

test('złe dane: 0 oczek, podstawa inna niż 10 albo 10,16 cm → bledne_dane; zły JSON w bazie → próbka null', async () => {
  const s = await srodowisko();
  expect(await ustawProbke(s.z, { projektId: 'p1', probka: { oczka: 0, naCm: 10 } })).toEqual({ ok: false, powod: 'bledne_dane' });
  expect(await ustawProbke(s.z, { projektId: 'p1', probka: { oczka: 22, naCm: 12 as never } })).toEqual({ ok: false, powod: 'bledne_dane' });
  await s.baza.run(`UPDATE projekt SET probka = '{"oczka":"dużo","na_cm":10}' WHERE id = 'p1'`);
  const w = await widokProjektu(s.z, { projektId: 'p1' });
  expect(w.ok && w.wartosc.probka).toBeNull();
});
