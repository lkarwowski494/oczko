// PU-345 (katalog: docs/jakosc/przypadki-uzycia.md). // EB1 (KO-223/KO-224, P-1079): linia +1 z ekranu blokady, której rodzic nie jest jeszcze w bazie, trafia do `poczekalnia` (ADR-0005),
// a dziennik i tak jest skracany. Poczekalnia `ekran_blokady` musi być ponawiana przy każdym scaleniu (idempotentnie po UUID), a rodzic,
// który nie dochodzi, nie może zostawić rzędów niewidocznych na stałe (zasada wspólna 10).
import type { ZdarzenieWejsciowe } from '../../src/domena/porty';
import { POCZEKALNIA_EKRANU_PROBY } from '../../src/konfiguracja';
import { scalDziennik } from '../../src/przypadki-uzycia/dziennik';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { MIN, T0, ile, jeden, przygotuj, wykonaj } from './pomocnicze/srodowisko';

const linia = (id: string, rodzice: string[], i: number): ZdarzenieWejsciowe => ({
  id, licznikId: 'l1', rodzaj: 'plus', rodzice, czasMs: T0 + (i + 1) * MIN, strefa: 'Europe/Warsaw', dzien: '2026-10-22', zrodlo: 'ekran_blokady', urzadzenie: 'iphone-test', pro: false,
});
async function zLicznikiem(n: number) {
  const s = await przygotuj();
  s.pro.wartosc = true;
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', n)]);
  return s;
}
const stan = (s: Awaited<ReturnType<typeof zLicznikiem>>) => jeden<{ wartosc: number; glowa: string; konflikt: number }>(s.baza, "SELECT wartosc, glowa, konflikt FROM licznik WHERE id = 'l1'");
const wPoczekalni = (s: Awaited<ReturnType<typeof zLicznikiem>>) => ile(s.baza, 'poczekalnia', "zrodlo = 'ekran_blokady'");

describe('poczekalnia ekranu blokady (EB1, P-1079)', () => {
  test('PU-345: rodzic dochodzi w późniejszym scaleniu → linia czekająca scalona: 10 + 2, poczekalnia pusta', async () => {
    const s = await zLicznikiem(10);
    s.dziennik.linie.push(linia('d2', ['d1'], 1)); // rodzic d1 jeszcze nie dotarł
    await scalDziennik(s.z);
    expect(await wPoczekalni(s)).toBe(1);
    expect(await stan(s)).toMatchObject({ wartosc: 10 });
    s.dziennik.linie.push(linia('d1', ['l1-z10'], 0)); // rodzic dotarł (dziennik jest już po skróceniu)
    await scalDziennik(s.z);
    expect(await wPoczekalni(s)).toBe(0);
    expect(await ile(s.baza, 'zdarzenie', "zrodlo = 'ekran_blokady'")).toBe(2);
    expect(await stan(s)).toEqual({ wartosc: 12, glowa: 'd2', konflikt: 0 });
  });

  test('łańcuch czekających (d3 → d2 → d1) scalany w jednym przebiegu w kolejności czasu', async () => {
    const s = await zLicznikiem(10);
    s.dziennik.linie.push(linia('d3', ['d2'], 2), linia('d2', ['d1'], 1));
    await scalDziennik(s.z);
    s.dziennik.linie.push(linia('d1', ['l1-z10'], 0));
    await scalDziennik(s.z);
    expect(await stan(s)).toEqual({ wartosc: 13, glowa: 'd3', konflikt: 0 });
    expect(await wPoczekalni(s)).toBe(0);
  });

  test('podwójna dostawa: ta sama linia czekająca dostarczona ponownie nie dubluje rzędu', async () => {
    const s = await zLicznikiem(10);
    s.dziennik.linie.push(linia('d2', ['d1'], 1));
    await scalDziennik(s.z);
    s.dziennik.linie.push(linia('d2', ['d1'], 1), linia('d1', ['l1-z10'], 0)); // d2 drugi raz razem z rodzicem
    await scalDziennik(s.z);
    s.dziennik.linie.push(linia('d2', ['d1'], 1));
    await scalDziennik(s.z);
    expect(await ile(s.baza, 'zdarzenie', "zrodlo = 'ekran_blokady'")).toBe(2);
    expect(await stan(s)).toEqual({ wartosc: 12, glowa: 'd2', konflikt: 0 });
    expect(await wPoczekalni(s)).toBe(0);
  });

  test(`PU-345: rodzic nigdy nie dochodzi: po ${POCZEKALNIA_EKRANU_PROBY} próbach linia dołączona do bieżącej głowy — rząd nie ginie, bez dublowania`, async () => {
    const s = await zLicznikiem(10);
    s.dziennik.linie.push(linia('d2', ['nieznany'], 1));
    for (let i = 0; i < POCZEKALNIA_EKRANU_PROBY; i += 1) {
      await scalDziennik(s.z);
      expect(await stan(s)).toMatchObject({ wartosc: 10 }); // jeszcze czeka
      expect(await wPoczekalni(s)).toBe(1);
    }
    await scalDziennik(s.z); // próba po progu
    expect(await wPoczekalni(s)).toBe(0);
    expect(await stan(s)).toEqual({ wartosc: 11, glowa: 'd2', konflikt: 0 });
    expect(await jeden(s.baza, "SELECT rodzice FROM zdarzenie WHERE id = 'd2'")).toEqual({ rodzice: '["l1-z10"]' });
    s.dziennik.linie.push(linia('d2', ['nieznany'], 1)); // późna druga dostawa
    await scalDziennik(s.z);
    expect(await ile(s.baza, 'zdarzenie', "zrodlo = 'ekran_blokady'")).toBe(1);
    expect(await stan(s)).toMatchObject({ wartosc: 11 });
  });

  test('plik dziennika jest pusty, a w poczekalni jest wpis → scalenie i tak go ponawia (bez nowych linii w pliku)', async () => {
    const s = await zLicznikiem(10);
    s.dziennik.linie.push(linia('d2', ['d1'], 1));
    await scalDziennik(s.z);
    s.dziennik.linie.length = 0; // plik pusty
    await scalDziennik(s.z);
    expect(await wPoczekalni(s)).toBe(1); // nadal czeka, nie zniknęła
  });

  test('recenzja P1-1: dwie osierocone linie tego samego licznika w jednej partii po progu → łańcuch 11, 12 (nie dwa rozwidlone 11)', async () => {
    const s = await zLicznikiem(10);
    s.dziennik.linie.push(linia('o1', ['brak-1'], 0), linia('o2', ['brak-2'], 1));
    for (let i = 0; i < POCZEKALNIA_EKRANU_PROBY; i += 1) await scalDziennik(s.z);
    expect(await stan(s)).toMatchObject({ wartosc: 10 });
    await scalDziennik(s.z);
    expect(await stan(s)).toEqual({ wartosc: 12, glowa: 'o2', konflikt: 0 });
    expect(await wPoczekalni(s)).toBe(0);
  });

  test('recenzja P1-2: ponowna dostawa linii z zastąpionym rodzicem nie zapisuje fałszywego dziennik_kolizja_id', async () => {
    const s = await zLicznikiem(10);
    s.dziennik.linie.push(linia('d2', ['nieznany'], 1));
    for (let i = 0; i <= POCZEKALNIA_EKRANU_PROBY; i += 1) await scalDziennik(s.z);
    expect(await stan(s)).toMatchObject({ wartosc: 11 });
    s.dziennik.linie.push(linia('d2', ['nieznany'], 1));
    await scalDziennik(s.z);
    expect(await ile(s.baza, 'blad', "kod = 'dziennik_kolizja_id'")).toBe(0);
    expect(await ile(s.baza, 'zdarzenie', "zrodlo = 'ekran_blokady'")).toBe(1);
  });
});
