// 07-jakosc-006 (F-49, BR-PRJ-011 S1): wzór wraca na stronę i do powiększenia po zamknięciu aplikacji, a start otwiera ekran wzoru, jeśli tam skończyła się praca.
// Wyrocznia: BR-PRJ-011 („wzór na stronie 3 w powiększeniu 200%”), moduly.md:238 (miejsce w koszu → lista). Strona zapisana od 0 (jak `znacznik.strona`),
// powiększenie jako krotność dopasowania do szerokości (1 = dopasowany), więc obrót i inny rozmiar okna nie psują zapisu. Prawdziwy SQLite (node:sqlite).
import { usunWzor, zapamietajWzor } from '../../src/przypadki-uzycia/wzor';
import { biezacyLicznik, zapamietajLicznik } from '../../src/przypadki-uzycia/widok-licznika';
import { widokWzoru } from '../../src/przypadki-uzycia/wzor-widok';
import { startNaWzorze, zapamietajPozycjeWzoru } from '../../src/przypadki-uzycia/wzor-miejsce';
import { czesc, licznik, plik, projekt, wzor, type Instr } from './pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from './pomocnicze/kompozycja-licznika';
import { jeden, wlozPlik, wykonaj, T0 } from './pomocnicze/srodowisko';

const OK = { ok: true, wartosc: undefined };
const PDF = Buffer.from('%PDF-1.4\n%%EOF\n');
const nazwany = (id: string, p: string, h: string, nazwa: string): Instr => ["INSERT INTO wzor (id, projekt_id, nazwa, zrodlo, pdf_sha256, zmieniono_ms) VALUES (?, ?, ?, 'pdf', ?, ?)", [id, p, nazwa, h, T0]];

async function start() {
  const { s, k } = await kompozycjaTestowa();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 3), projekt('p2', 'Skarpeta'), czesc('c2', 'p2', 'Stopa'), ...licznik('l2', 'c2', 1),
    plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h), nazwany('w2', 'p1', h, 'ażurowy brzeg'), nazwany('w3', 'p2', h, 'Cudzy')]);
  return { s, k };
}
const miejsce = async (s: Awaited<ReturnType<typeof start>>['s']) => JSON.parse((await jeden<{ wartosc: string }>(s.baza, "SELECT wartosc FROM ustawienie WHERE klucz = 'ostatnie_miejsce'")).wartosc) as unknown;
const pozycja = async (s: Awaited<ReturnType<typeof start>>['s'], wzorId: string) => { const w = await widokWzoru(s.z, { wzorId }); return w.ok ? w.wartosc.miejsce : 'błąd'; };

test('S1: strona 3 (indeks 2) w powiększeniu 2× przeżywa restart — zapis w ostatnie_miejsce, widok wzoru oddaje pozycję, start otwiera wzór', async () => {
  const { s, k } = await start();
  await zapamietajLicznik(s.z, { licznikId: 'l1' });
  expect(await zapamietajPozycjeWzoru(s.z, { licznikId: 'l1', wzorId: 'w1', strona: 2, powiekszenie: 2 })).toEqual(OK);
  expect(await miejsce(s)).toEqual({ ekran: 'wzor', id: 'l1', wzor: 'w1', strona: 2, powiekszenie: 2 });
  expect(await biezacyLicznik(s.z)).toEqual({ ok: true, wartosc: 'l1' });
  expect(await startNaWzorze(s.z)).toEqual({ ok: true, wartosc: true });
  expect(await pozycja(s, 'w1')).toEqual({ strona: 2, powiekszenie: 2 });
  expect(await k.przygotuj()).toEqual({ ok: true, wartosc: { cel: 'dzis', miejsce: 'wzor' } });
});

test('widok natywny zgłasza strony i powiększenie osobno: zapis jednego nie kasuje drugiego', async () => {
  const { s } = await start();
  await zapamietajPozycjeWzoru(s.z, { licznikId: 'l1', wzorId: 'w1', strona: 4 });
  expect(await pozycja(s, 'w1')).toEqual({ strona: 4, powiekszenie: null }); // brak powiększenia zostaje brakiem (dopasowany do szerokości), nie 1 z zgadnięcia w zapisie
  await zapamietajPozycjeWzoru(s.z, { licznikId: 'l1', wzorId: 'w1', powiekszenie: 3 });
  expect(await pozycja(s, 'w1')).toEqual({ strona: 4, powiekszenie: 3 });
  await zapamietajPozycjeWzoru(s.z, { licznikId: 'l1', wzorId: 'w1', strona: 1 });
  expect(await pozycja(s, 'w1')).toEqual({ strona: 1, powiekszenie: 3 });
});

test('ponowne wczytanie ekranu (zapamietajWzor po +1) nie zeruje pozycji tego samego wzoru; inny wzór zaczyna od początku', async () => {
  const { s } = await start();
  await zapamietajPozycjeWzoru(s.z, { licznikId: 'l1', wzorId: 'w1', strona: 2, powiekszenie: 2 });
  await zapamietajWzor(s.z, { licznikId: 'l1', wzorId: 'w1' });
  expect(await pozycja(s, 'w1')).toEqual({ strona: 2, powiekszenie: 2 });
  expect((await miejsce(s) as { ekran: string }).ekran).toBe('wzor'); // ekran wzoru nie wraca do „licznik” przy odświeżeniu
  await zapamietajWzor(s.z, { licznikId: 'l1', wzorId: 'w2' });
  expect(await pozycja(s, 'w2')).toBeNull();
  expect(await pozycja(s, 'w1')).toBeNull(); // pamiętany jest jeden, ostatni wzór (ostatnie_miejsce.wzor)
});

test('wyjście z ekranu wzoru: zapamietajLicznik ustawia ekran „licznik”, pozycja zostaje, start otwiera licznik', async () => {
  const { s, k } = await start();
  await zapamietajPozycjeWzoru(s.z, { licznikId: 'l1', wzorId: 'w1', strona: 2, powiekszenie: 2 });
  await zapamietajLicznik(s.z, { licznikId: 'l1' });
  expect(await miejsce(s)).toEqual({ ekran: 'licznik', id: 'l1', wzor: 'w1', strona: 2, powiekszenie: 2 });
  expect(await startNaWzorze(s.z)).toEqual({ ok: true, wartosc: false });
  expect(await k.przygotuj()).toEqual({ ok: true, wartosc: { cel: 'dzis', miejsce: 'licznik' } });
  expect(await pozycja(s, 'w1')).toEqual({ strona: 2, powiekszenie: 2 });
});

test('niepoprawna pozycja → bledne_dane bez zmiany zapisu (strona ujemna lub ułamkowa, powiększenie zero, ujemne, NaN, nieskończone, ponad maksimum)', async () => {
  const { s } = await start();
  await zapamietajPozycjeWzoru(s.z, { licznikId: 'l1', wzorId: 'w1', strona: 2, powiekszenie: 2 });
  const przed = await miejsce(s);
  for (const w of [{ strona: -1 }, { strona: 1.5 }, { strona: Number.NaN }, { powiekszenie: 0 }, { powiekszenie: -2 }, { powiekszenie: Number.NaN }, { powiekszenie: Number.POSITIVE_INFINITY }, { powiekszenie: 1000 }]) {
    expect(await zapamietajPozycjeWzoru(s.z, { licznikId: 'l1', wzorId: 'w1', ...w })).toEqual({ ok: false, powod: 'bledne_dane' });
  }
  expect(await miejsce(s)).toEqual(przed);
});

test('wzór usunięty, z innego projektu albo licznik w koszu: start nie otwiera wzoru; pozycja cudzego wzoru nie jest zapisywana', async () => {
  const { s, k } = await start();
  await zapamietajPozycjeWzoru(s.z, { licznikId: 'l1', wzorId: 'w1', strona: 2, powiekszenie: 2 });
  expect(await zapamietajPozycjeWzoru(s.z, { licznikId: 'l1', wzorId: 'w3', strona: 1 })).toEqual({ ok: false, powod: 'bledne_dane' }); // w3 należy do projektu p2
  expect(await zapamietajPozycjeWzoru(s.z, { licznikId: 'l1', wzorId: 'nie-ma', strona: 1 })).toEqual({ ok: false, powod: 'bledne_dane' });
  expect(await miejsce(s)).toEqual({ ekran: 'wzor', id: 'l1', wzor: 'w1', strona: 2, powiekszenie: 2 });
  await usunWzor(s.z, { wzorId: 'w1' });
  expect(await startNaWzorze(s.z)).toEqual({ ok: true, wartosc: false });
  expect(await k.przygotuj()).toEqual({ ok: true, wartosc: { cel: 'dzis', miejsce: 'licznik' } });
});
