// Notatki wzoru na stronie (07-jakosc-007, F-56; BR-WZR-008 S2, P-330 2A): widok wzoru niesie chipy notatek na wysokości ich rzędów,
// notatkę da się zmienić i usunąć (arkusz notatki: Edit/Save, „Delete note”); zapis nie rusza pliku wzoru ani cudzych notatek.
import { notatkiWzoruZId } from '../../src/dane/repozytoria/wzory';
import { widokWzoru } from '../../src/przypadki-uzycia/wzor-widok';
import { dodajNotatkeWzoru, usunNotatkeWzoru, zmienNotatkeWzoru } from '../../src/przypadki-uzycia/wzor';
import { czesc, licznik, notatkaRzedu, plik, projekt, wzor } from './pomocnicze/dane-wejsciowe';
import { ile, jeden, przygotuj, wlozPlik, wykonaj } from './pomocnicze/srodowisko';

const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
// Licznik 45 (rząd w robocie 46), znacznik na rzędzie 6 schematu, strona 1, y 0,4, w górę (BR-WZR-003 S5).
const ZNACZNIK = JSON.stringify({ licznik_id: 'l1', strona: 1, y: 0.4, wysokosc_rzedu: 0.02, rzad_bazowy: 6, wartosc_przy_ustawieniu: 45, kierunek: -1 });

async function start() {
  const s = await przygotuj();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 45), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h, ZNACZNIK),
    notatkaRzedu('n1', 'l1', 46, 'ujmowanie co 4 rzędy'), notatkaRzedu('n2', 'l1', 49, 'zmiana igieł')]);
  return s;
}

test('BR-WZR-008/S2: widok wzoru niesie chipy notatek: rząd 46 licznika = rząd 6 schematu na y 0,4, rząd 49 = rząd 9 trzy rzędy wyżej', async () => {
  const s = await start();
  const w = await widokWzoru(s.z, { wzorId: 'w1' });
  expect(w.ok && w.wartosc.notatki.map((c) => [c.rzadWzoru, Math.round(c.y * 1000) / 1000, c.notatki.map((n) => n.tekst)])).toEqual([[6, 0.4, ['ujmowanie co 4 rzędy']], [9, 0.34, ['zmiana igieł']]]);
});
test('notatka dodana po ustawieniu znacznika pojawia się w widoku od razu (rząd w robocie licznika)', async () => {
  const s = await start();
  await dodajNotatkeWzoru(s.z, { wzorId: 'w1', rzad: 46, tekst: 'druga na tym rzędzie' });
  const w = await widokWzoru(s.z, { wzorId: 'w1' });
  expect(w.ok && w.wartosc.notatki[0]?.notatki.map((n) => n.tekst)).toEqual(['ujmowanie co 4 rzędy', 'druga na tym rzędzie']);
});
test('zmiana treści notatki: tylko ta notatka; pusty tekst i notatka spoza wzoru → bledne_dane, treść bez zmian', async () => {
  const s = await start();
  expect(await zmienNotatkeWzoru(s.z, { wzorId: 'w1', notatkaId: 'n1', tekst: 'ujmowanie co 6 rzędów' })).toEqual({ ok: true, wartosc: undefined });
  expect((await notatkiWzoruZId(s.baza, 'w1')).map((n) => [n.id, n.tekst])).toEqual([['n1', 'ujmowanie co 6 rzędów'], ['n2', 'zmiana igieł']]);
  expect(await zmienNotatkeWzoru(s.z, { wzorId: 'w1', notatkaId: 'n1', tekst: '  ' })).toEqual({ ok: false, powod: 'bledne_dane' });
  expect(await zmienNotatkeWzoru(s.z, { wzorId: 'w1', notatkaId: 'brak', tekst: 'x' })).toEqual({ ok: false, powod: 'bledne_dane' });
  expect((await jeden<{ tekst: string }>(s.baza, 'SELECT tekst FROM notatka_rzedu WHERE id = ?', ['n1'])).tekst).toBe('ujmowanie co 6 rzędów');
});
test('usunięcie notatki: znika z widoku, druga zostaje; notatka innego licznika nie jest ruszana', async () => {
  const s = await start();
  await wykonaj(s.baza, [...licznik('l2', 'c1', 3), notatkaRzedu('obca', 'l2', 4, 'obca')]);
  expect(await usunNotatkeWzoru(s.z, { wzorId: 'w1', notatkaId: 'n1' })).toEqual({ ok: true, wartosc: undefined });
  expect((await notatkiWzoruZId(s.baza, 'w1')).map((n) => n.id)).toEqual(['n2']);
  expect(await usunNotatkeWzoru(s.z, { wzorId: 'w1', notatkaId: 'obca' })).toEqual({ ok: false, powod: 'bledne_dane' });
  expect(await ile(s.baza, 'notatka_rzedu', 'id = ?', ['obca'])).toBe(1);
});
