// 07-jakosc-029 (BR-LIC-002 „Granica zera”): −1 przy wartości 0 niczego nie zapisuje — ani zdarzenia w historii, ani zmiany ostatniej pracy; wynik to nadal 0.
import { dodajRzad, odejmijRzad } from '../../src/przypadki-uzycia/licznik';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { ile, jeden, migawka, przygotuj, wykonaj } from './pomocnicze/srodowisko';

async function swiezy() {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p', 'Czapka'), czesc('c', 'p', 'Główka'), ...licznik('l', 'c', 0)]);
  return s;
}

test('029: −1 przy zerze → wartość 0, brak nowego zdarzenia, baza (poza dziennikiem błędów) bez zmian', async () => {
  const s = await swiezy();
  const przed = await migawka(s.baza, ['blad']);
  const zdarzenPrzed = await ile(s.baza, 'zdarzenie');
  const w = await odejmijRzad(s.z, { licznikId: 'l' });
  expect(w).toMatchObject({ ok: true, wartosc: { wartosc: 0 } });
  expect(await ile(s.baza, 'zdarzenie')).toBe(zdarzenPrzed);
  expect(await migawka(s.baza, ['blad'])).toBe(przed);
});
test('029: +1, −1, −1 → pierwsze −1 zapisuje zmianę (1 → 0), drugie nie dopisuje nic', async () => {
  const s = await swiezy();
  await dodajRzad(s.z, { licznikId: 'l' });
  expect(await odejmijRzad(s.z, { licznikId: 'l' })).toMatchObject({ ok: true, wartosc: { wartosc: 0 } });
  const po = await ile(s.baza, 'zdarzenie');
  expect(po).toBe(2);
  expect(await odejmijRzad(s.z, { licznikId: 'l' })).toMatchObject({ ok: true, wartosc: { wartosc: 0 } });
  expect(await ile(s.baza, 'zdarzenie')).toBe(po);
  expect(await jeden<{ wartosc: number }>(s.baza, "SELECT wartosc FROM licznik WHERE id = 'l'")).toEqual({ wartosc: 0 });
});
