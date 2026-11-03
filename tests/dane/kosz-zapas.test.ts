// P-209 (05 fix-6 Q7a, N4; dane.md „Usuwanie włóczki i narzędzia przez kosz”, e3b29d7): włóczka i narzędzie przez kosz KOSZ_DNI z ochroną historii.
// Wyrocznia: punkty „Testy (08)” kontraktu — usuń → brak w zapasie, w koszu z terminem; przywróć → wraca z przypisaniami i zdjęciami;
// po 31 dniach i dwóch startach narzędzie i nieprzypisana włóczka usunięte (plik etykiety sprzątnięty), przypisana zostaje ukryta na stałe.
import { KOSZ_DNI } from '../../src/konfiguracja';
import { sprzatnijKosz } from '../../src/przypadki-uzycia/kosz';
import { kartaUkonczenia } from '../../src/przypadki-uzycia/widok-ukonczenia';
import { widokKosza } from '../../src/przypadki-uzycia/widok-kosza';
import {
  narzedzia, przywrocNarzedzie, przywrocWloczke, usunNarzedzie, usunWloczke, zapasZDetalami, zapiszNarzedzie, zapiszWloczke,
} from '../../src/przypadki-uzycia/zapas';
import { zakonczProjekt } from '../../src/przypadki-uzycia/projekt';
import { czesc, plik, projekt, projektWloczka } from './pomocnicze/dane-wejsciowe';
import { DOBA, T0, dzienLokalny, ile, przygotuj, sierotyPrzyStarcie, wlozPlik, wykonaj } from './pomocnicze/srodowisko';

const OK = { ok: true, wartosc: undefined };
const FORM = { producent: '', sklad: '', kolor: '', kategoria: null, motki: 3, dlugoscMotkaM: null, wagaMotkaG: null, pielegnacja: '', notatka: '' };
async function srodowisko() {
  const s = await przygotuj();
  const wolna = await zapiszWloczke(s.z, { ...FORM, nazwa: 'Wolna' });
  const przyp = await zapiszWloczke(s.z, { ...FORM, nazwa: 'Merino' });
  const dr = await zapiszNarzedzie(s.z, { rodzaj: 'druty', rozmiarMm: 4, opis: '' });
  if (!wolna.ok || !przyp.ok || !dr.ok) throw new Error('zapis');
  const h = wlozPlik(s.magazyn, Buffer.from('ETYKIETA'), 'jpg');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), projektWloczka('p1', przyp.wartosc.id), plik(h, 'jpg', 8),
    ['INSERT INTO zdjecie (id, projekt_id, wloczka_id, plik_sha256, utworzono_ms) VALUES (?, NULL, ?, ?, ?)', ['z1', wolna.wartosc.id, h, T0]]]);
  return { s, wolna: wolna.wartosc.id, przyp: przyp.wartosc.id, drut: dr.wartosc.id, h };
}
const poprzedniStartTeraz = (s: Awaited<ReturnType<typeof przygotuj>>) =>
  s.baza.run("INSERT INTO ustawienie (klucz, wartosc, zmieniono_ms) VALUES ('ostatni_start_ms', ?, ?) ON CONFLICT (klucz) DO UPDATE SET wartosc = excluded.wartosc", [String(s.zegar.teraz().ms), s.zegar.teraz().ms]);

test('usuń włóczkę i drut → brak w zapasie i na liście, są w koszu z terminem; ponowne usunięcie → niedozwolone_przejscie', async () => {
  const { s, wolna, drut } = await srodowisko();
  expect(await usunWloczke(s.z, { wloczkaId: wolna })).toEqual(OK);
  expect(await usunNarzedzie(s.z, { narzedzieId: drut })).toEqual(OK);
  const z = await zapasZDetalami(s.z);
  expect(z.ok && z.wartosc.map((x) => x.nazwa)).toEqual(['Merino']);
  const n = await narzedzia(s.z);
  expect(n.ok && n.wartosc).toEqual([]);
  const k = await widokKosza(s.z);
  const termin = (() => { const d = new Date(Date.parse(`${dzienLokalny(T0, 'Europe/Warsaw')}T00:00:00Z`) + KOSZ_DNI * DOBA); return d.toISOString().slice(0, 10); })();
  expect(k.ok && k.wartosc.map((e) => [e.rodzaj, e.id, e.doDnia])).toEqual([['wloczka', wolna, termin], ['narzedzie', drut, termin]].sort((a, b) => String(a[1]).localeCompare(String(b[1]))));
  expect(k.ok && k.wartosc.find((e) => e.rodzaj === 'narzedzie')?.narzedzie).toEqual({ rodzaj: 'druty', rozmiarMm: 4, opis: '' });
  expect(await usunWloczke(s.z, { wloczkaId: wolna })).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
});

test('przywróć → włóczka wraca ze zdjęciem etykiety, przypisana z przypisaniem; drut wraca', async () => {
  const { s, wolna, przyp, drut } = await srodowisko();
  for (const id of [wolna, przyp]) await usunWloczke(s.z, { wloczkaId: id });
  await usunNarzedzie(s.z, { narzedzieId: drut });
  s.zegar.przesun((KOSZ_DNI - 1) * DOBA);
  await poprzedniStartTeraz(s);
  await sprzatnijKosz(s.z);
  for (const id of [wolna, przyp]) expect(await przywrocWloczke(s.z, { wloczkaId: id })).toEqual(OK);
  expect(await przywrocNarzedzie(s.z, { narzedzieId: drut })).toEqual(OK);
  const z = await zapasZDetalami(s.z);
  expect(z.ok && z.wartosc.map((x) => [x.nazwa, x.zdjecieSha !== null])).toEqual([['Merino', false], ['Wolna', true]]);
  expect(await ile(s.baza, 'projekt_wloczka')).toBe(1);
  expect((await narzedzia(s.z)).ok).toBe(true);
  expect(await ile(s.baza, 'narzedzie', 'usunieto_ms IS NULL')).toBe(1);
  expect(await przywrocWloczke(s.z, { wloczkaId: wolna })).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
});

test('po 31 dniach i dwóch startach: drut i wolna włóczka usunięte (plik etykiety sprzątnięty), przypisana ukryta na stałe — karta pokazuje nazwę i zużycie', async () => {
  const { s, wolna, przyp, drut, h } = await srodowisko();
  for (const id of [wolna, przyp]) await usunWloczke(s.z, { wloczkaId: id });
  await usunNarzedzie(s.z, { narzedzieId: drut });
  s.zegar.przesun((KOSZ_DNI + 1) * DOBA);
  await poprzedniStartTeraz(s);
  expect(await sprzatnijKosz(s.z)).toMatchObject({ ok: true, wartosc: { wloczki: 1, narzedzia: 1 } });
  expect(await ile(s.baza, 'narzedzie')).toBe(0);
  expect(await ile(s.baza, 'wloczka', `id = '${wolna}'`)).toBe(0);
  expect(await ile(s.baza, 'zdjecie')).toBe(0);
  expect(await ile(s.baza, 'plik', `sha256 = '${h}'`)).toBe(0);
  expect(s.magazyn.usuniete).toEqual([]); // plik etykiety bez wiersza usuwa krok startu (ADR-0001, 05-architekt-513)
  await sierotyPrzyStarcie(s);
  expect(s.magazyn.usuniete).toContain(h);
  expect(await ile(s.baza, 'wloczka', `id = '${przyp}'`)).toBe(1);
  expect(await ile(s.baza, 'projekt_wloczka')).toBe(1);
  const k = await widokKosza(s.z);
  expect(k.ok && k.wartosc).toEqual([]); // poza terminem: przypisana włóczka nie wraca do kosza
  expect(await zakonczProjekt(s.z, { projektId: 'p1' })).toEqual(OK);
  const karta = await kartaUkonczenia(s.z, { projektId: 'p1' });
  expect(karta.ok && karta.wartosc.wloczka.map((x) => x.nazwa)).toEqual(['Merino']);
});
