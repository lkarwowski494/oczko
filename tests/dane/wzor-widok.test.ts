// Model odczytu przeglądarki wzoru (moduly.md „Kontrakt partii 6”: WidokWzoru dostaje plik PDF, rysunki stron i wynik `polozenieZnacznika`;
// P-246 S3a obroty; W9b wzory projektu do przełączania). Wyrocznie: kontrakt, ADR-0011 (znacznik idzie z licznikiem), schemat v1.
import { widokWzoru } from '../../src/przypadki-uzycia/wzor-widok';
import { czesc, licznik, plik, projekt, rysunek, wzor } from './pomocnicze/dane-wejsciowe';
import { przygotuj, wlozPlik, wykonaj } from './pomocnicze/srodowisko';

const PDF = Buffer.from('%PDF-1.4\n%%EOF\n');
test('wzór z rysunkami, obrotem i znacznikiem przy liczniku 13 (ustawiony przy 10, kierunek w dół): ścieżki z magazynu i położenie znacznika', async () => {
  const s = await przygotuj();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  const r = wlozPlik(s.magazyn, 'rys', 'pkdrawing');
  const zn = JSON.stringify({ licznik_id: 'l1', strona: 1, y: 0.2, wysokosc_rzedu: 0.02, rzad_bazowy: 11, wartosc_przy_ustawieniu: 10, kierunek: 1 });
  await wykonaj(s.baza, [projekt('p1', 'Harbor'), czesc('c1', 'p1', 'Back'), ...licznik('l1', 'c1', 13), plik(h, 'pdf', PDF.length), plik(r, 'pkdrawing', 3),
    wzor('w1', 'p1', h, zn), ["UPDATE wzor SET obroty = '{\"1\": 90}' WHERE id = 'w1'", []], rysunek('w1', 1, r)]);
  const w = await widokWzoru(s.z, { wzorId: 'w1' });
  expect(w).toEqual({ ok: true, wartosc: {
    wzorId: 'w1', projektId: 'p1', nazwa: 'Wzór', zrodlo: 'pdf', plikPdf: s.magazyn.sciezka(h), oryginal: null,
    rysunki: [{ strona: 1, plik: s.magazyn.sciezka(r) }], obroty: { 1: 90 }, notatki: [], miejsce: null, // 07-jakosc-006: brak zapisanej pozycji tego wzoru
    znacznik: { licznikId: 'l1', strona: 1, rzad: 14, y: expect.closeTo(0.26, 5), wysokosc: 0.02, pozaStrona: false, przedSchematem: false, kierunek: 1 },
  } });
});
test('wzór bez znacznika → znacznik null; wzór w koszu albo brak → bledne_dane / niedozwolone_przejscie', async () => {
  const s = await przygotuj();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Harbor'), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h)]);
  expect(await widokWzoru(s.z, { wzorId: 'w1' })).toMatchObject({ ok: true, wartosc: { znacznik: null, rysunki: [], obroty: {} } });
  expect(await widokWzoru(s.z, { wzorId: 'nie-ma' })).toEqual({ ok: false, powod: 'bledne_dane' });
  await wykonaj(s.baza, [["UPDATE wzor SET usunieto_ms = 1 WHERE id = 'w1'", []]]);
  expect(await widokWzoru(s.z, { wzorId: 'w1' })).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
});
