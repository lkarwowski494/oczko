// EB1 (P-1082, KO-225): „Zgłoś problem” niesie pola diagnostyczne ekranu blokady — liczbę linii czekających w poczekalni (rodzic jeszcze nie dotarł)
// i liczbę liczników w konflikcie (rozwidlenie blokada↔aplikacja, NFR-DAN-003). Tylko liczby: bez nazw, notatek i treści linii (NFR-PRY-001).
import { przygotujZgloszenie } from '../../src/przypadki-uzycia/zgloszenie';
import { scalDziennik } from '../../src/przypadki-uzycia/dziennik';
import { dodajRzad } from '../../src/przypadki-uzycia/licznik';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { MIN, T0, przygotuj, wykonaj } from './pomocnicze/srodowisko';

const linia = (id: string, rodzice: string[]) => ({
  id, licznikId: 'l1', rodzaj: 'plus' as const, rodzice, czasMs: T0 + MIN, strefa: 'Europe/Warsaw', dzien: '2026-10-22', zrodlo: 'ekran_blokady' as const, urzadzenie: 'iphone-test', pro: false,
});
async function tresc(z: Parameters<typeof przygotujZgloszenie>[0]): Promise<string> {
  const w = await przygotujZgloszenie(z);
  if (!w.ok) throw new Error(w.powod);
  return w.wartosc.tresc;
}

test('bez linii czekających i konfliktów: lockscreen: pending=0 conflicts=0', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 10)]);
  expect(await tresc(s.z)).toContain('lockscreen: pending=0 conflicts=0');
});

test('linia bez rodzica → pending=1; rozwidlenie głowy → conflicts=1; treść linii nie wychodzi', async () => {
  const s = await przygotuj();
  s.pro.wartosc = true;
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 10)]);
  s.dziennik.linie.push(linia('d9', ['nieznany-rodzic']));
  await scalDziennik(s.z);
  expect(await tresc(s.z)).toContain('lockscreen: pending=1 conflicts=0');
  await dodajRzad(s.z, { licznikId: 'l1' }); // aplikacja: 11 od głowy l1-z10
  s.dziennik.linie.push(linia('d1', ['l1-z10'])); // ekran blokady: też od l1-z10
  await scalDziennik(s.z);
  const t = await tresc(s.z);
  expect(t).toContain('lockscreen: pending=1 conflicts=1');
  expect(t).not.toMatch(/nieznany-rodzic|Sweter|Przód/);
});
