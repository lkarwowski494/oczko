// Przypadki użycia z menu ••• (08 partia 4, 3B): nazwa części, cel (U-8), przypomnienie (F-06, RD-13), powtórzenie (F-05, RD-12-W5).
import { dodajPrzypomnienie, nazwijCzesc, ustawCel, ustawPowtorzenie } from '../../src/przypadki-uzycia/czesc';
import { widokLicznika } from '../../src/przypadki-uzycia/widok-licznika';
import { kartaUkonczenia } from '../../src/przypadki-uzycia/widok-ukonczenia';
import { czesc, licznik, projekt, projektWloczka, wloczka } from './pomocnicze/dane-wejsciowe';
import { DOBA, GODZ, MIN, T0, jeden, przygotuj, wykonaj } from './pomocnicze/srodowisko';

async function s0() {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 5)]);
  return s;
}
const widok = async (s: Awaited<ReturnType<typeof s0>>) => { const w = await widokLicznika(s.z, { licznikId: 'l1' }); if (!w.ok) throw new Error(w.powod); return w.wartosc; };

describe('menu •••: zapisy części i licznika', () => {
  test('nazwa części i cel widać w modelu licznika; cel 0 i pusta nazwa → bledne_dane bez zmiany', async () => {
    const s = await s0();
    expect((await nazwijCzesc(s.z, { czescId: 'c1', nazwa: ' Rękaw lewy ' })).ok).toBe(true);
    expect((await ustawCel(s.z, { czescId: 'c1', cel: 96 })).ok).toBe(true);
    expect((await widok(s)).czesc).toEqual({ nazwa: 'Rękaw lewy', cel: 96 });
    expect(await ustawCel(s.z, { czescId: 'c1', cel: 0 })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await nazwijCzesc(s.z, { czescId: 'c1', nazwa: '  ' })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect((await widok(s)).czesc).toEqual({ nazwa: 'Rękaw lewy', cel: 96 });
  });

  test('RD-13: przypomnienie od 6 co 6 × 5 → pas na rzędzie 6 (skończone 5); N = 0 → bledne_dane, nic nie zapisane', async () => {
    const s = await s0();
    expect(await dodajPrzypomnienie(s.z, { licznikId: 'l1', od: 6, co: 0, razy: 5, tekst: 'x' })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect((await jeden<{ n: number }>(s.baza, 'SELECT count(*) AS n FROM przypomnienie')).n).toBe(0);
    expect((await dodajPrzypomnienie(s.z, { licznikId: 'l1', od: 6, co: 6, razy: 5, tekst: 'decrease at both ends' })).ok).toBe(true);
    expect((await widok(s)).przypomnienie).toEqual({ tekst: 'decrease at both ends', ktory: 1, razy: 5, nastepny: 12 });
  });

  test('RD-12-W5: powtórzenie 0 → bledne_dane; 4 → „powtórzenie 2, rząd 1 z 4” przy 5 skończonych (RD-12: ⌊(5−1)/4⌋+1, ((5−1) mod 4)+1)', async () => {
    const s = await s0();
    expect(await ustawPowtorzenie(s.z, { licznikId: 'l1', dlugosc: 0 })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect((await ustawPowtorzenie(s.z, { licznikId: 'l1', dlugosc: 4, nazwa: 'Warkocz' })).ok).toBe(true);
    const w = await widok(s);
    expect([w.nazwa, w.powtorzenie]).toEqual(['Warkocz', { numer: 2, rzadW: 1, dlugosc: 4 }]);
  });
});

describe('kartaUkonczenia (BR-PRJ-015)', () => {
  test('dni = różne dni z +1, rzędy = suma liczników, bez sesji czas null; z sesją 2 h − przerwy', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), czesc('c2', 'p1', 'Tył', 2), ...licznik('l1', 'c1', 3), ...licznik('l2', 'c2', 2, { t: T0 + DOBA }), wloczka('w1', 'Fjord'), projektWloczka('p1', 'w1')]);
    let k = await kartaUkonczenia(s.z, { projektId: 'p1' });
    expect(k.ok && [k.wartosc.dni, k.wartosc.rzedy, k.wartosc.czesci, k.wartosc.czasMs, k.wartosc.wloczka]).toEqual([2, 5, 2, null, [{ id: 'w1', nazwa: 'Fjord', motki: 3, zuzyto: null }]]); // F-37 (partia 5): model karty niesie zapas i poprzednie zużycie
    await wykonaj(s.baza, [["INSERT INTO sesja (id, projekt_id, stan, start_ms, koniec_ms, przerwy_ms, strefa, dzien) VALUES ('s1', 'p1', 'zakonczona', ?, ?, ?, 'Europe/Warsaw', '2026-10-22')", [T0, T0 + 2 * GODZ, 10 * MIN]]]);
    k = await kartaUkonczenia(s.z, { projektId: 'p1' });
    expect(k.ok && k.wartosc.czasMs).toBe(2 * GODZ - 10 * MIN);
  });
});
