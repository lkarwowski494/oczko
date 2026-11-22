// Partia 5 (A3, A4, C1; P-182, P-183): lista projektów z „last worked …” i linią terminu (BR-PRJ-016, BR-DNI-005/006), liczba w koszu,
// model „Recently deleted” (BR-DAN-008, F-33), „Next part” (BR-LIC-011/S1, Q4a), cel części pary na liczniku (BR-PRJ-014 S1/S3), dziś na projekcie.
import { nastepnaCzesc } from '../../src/przypadki-uzycia/czesc';
import { usunCzesc, usunLicznik, usunProjekt } from '../../src/przypadki-uzycia/projekt';
import { widokKosza } from '../../src/przypadki-uzycia/widok-kosza';
import { widokLicznika } from '../../src/przypadki-uzycia/widok-licznika';
import { widokProjektow } from '../../src/przypadki-uzycia/widok-projektow';
import { widokProjektu } from '../../src/przypadki-uzycia/widok-projektu';
import { czesc, licznik, projekt, zdarzenie, ustawGlowe } from './pomocnicze/dane-wejsciowe';
import { DOBA, GODZ, T0, przygotuj, wykonaj } from './pomocnicze/srodowisko';

type S = Awaited<ReturnType<typeof przygotuj>>;
const lista = async (s: S) => { const w = await widokProjektow(s.z); if (!w.ok) throw new Error(w.powod); return w.wartosc; };

describe('lista projektów (A4)', () => {
  test('BR-PRJ-016 (bez progu): dni kalendarzowe od ostatniej pracy — dziś 0, wczoraj 1, 41 dni; liczone na datach, nie z różnicy chwil', async () => {
    const s = await przygotuj(); // teraz 2026-10-22 12:00 Europe/Warsaw
    await wykonaj(s.baza, [
      projekt('dzis', 'A', T0, { ostatnia: T0 - 11 * GODZ }), // 2026-10-22 01:00
      projekt('wczoraj', 'B', T0, { ostatnia: T0 - 13 * GODZ }), // 2026-10-21 23:00 — 13 h temu, ale wczoraj
      projekt('stary', 'C', T0, { ostatnia: T0 - 41 * DOBA }),
    ]);
    const w = await lista(s);
    expect(Object.fromEntries(w.wToku.map((p) => [p.id, p.dniOdPracy]))).toEqual({ dzis: 0, wczoraj: 1, stary: 41 });
  });

  test('BR-DNI-006: kolejność w toku — po terminie, potem cel na dziś malejąco, potem bez terminu wg ostatniej pracy; linia dziś przy terminie', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [
      projekt('bez', 'Bez terminu', T0, { ostatnia: T0 }), czesc('b1', 'bez', 'X', 1, { cel: 10 }), ...licznik('bl', 'b1', 1),
      projekt('maly', 'Mały cel', T0, { ostatnia: T0 - DOBA }), czesc('m1', 'maly', 'X', 1, { cel: 20 }), ...licznik('ml', 'm1', 0),
      projekt('duzy', 'Duży cel', T0, { ostatnia: T0 - 2 * DOBA }), czesc('d1', 'duzy', 'X', 1, { cel: 200 }), ...licznik('dl', 'd1', 0),
      projekt('po', 'Po terminie', T0, { ostatnia: T0 - 3 * DOBA }), czesc('p1', 'po', 'X', 1, { cel: 50 }), ...licznik('pl', 'p1', 0),
      ["UPDATE projekt SET termin_dzien = '2026-10-31' WHERE id IN ('maly', 'duzy')", []], ["UPDATE projekt SET termin_dzien = '2026-10-01' WHERE id = 'po'", []],
    ]);
    const w = await lista(s);
    expect(w.wToku.map((p) => p.id)).toEqual(['po', 'duzy', 'maly', 'bez']);
    expect(Object.fromEntries(w.wToku.map((p) => [p.id, p.dzis]))).toEqual({
      po: { cel: { rodzaj: 'po_terminie', zostalo: 50 }, zrobione: 0 }, duzy: { cel: { rodzaj: 'cel', rzedy: 20 }, zrobione: 0 },
      maly: { cel: { rodzaj: 'cel', rzedy: 2 }, zrobione: 0 }, bez: null,
    });
  });

  test('rzędy zrobione dziś (Z_teraz − Z_przed): 3 dziś przy celu 10 dziennie → dzis.zrobione = 3; projekt pokazuje to samo', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'A'), czesc('c1', 'p1', 'X', 1, { cel: 100 }), ...licznik('l1', 'c1', 5, { t: T0 - 2 * DOBA }),
      zdarzenie('d6', 'l1', 'plus', 6, ['l1-z5'], T0 - GODZ), zdarzenie('d7', 'l1', 'plus', 7, ['d6'], T0 - GODZ + 1000), zdarzenie('d8', 'l1', 'plus', 8, ['d7'], T0 - GODZ + 2000),
      ustawGlowe('l1', 8, 'd8'), ["UPDATE projekt SET termin_dzien = '2026-10-31' WHERE id = 'p1'", []]]);
    const p = (await lista(s)).wToku[0];
    expect(p.dzis).toEqual({ cel: { rodzaj: 'cel', rzedy: 10 }, zrobione: 3 }); // (100 − 5) / 10 dni → 10
    const v = await widokProjektu(s.z, { projektId: 'p1' });
    expect(v.ok && [v.wartosc.celDnia, v.wartosc.zrobioneDzis]).toEqual([{ rodzaj: 'cel', rzedy: 10 }, 3]);
  });

  test('liczba w koszu = projekty + części + liczniki widoczne w koszu (część i licznik tylko, gdy rodzic nie w koszu)', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'A'), czesc('c1', 'p1', 'X'), ...licznik('l1', 'c1', 1), ...licznik('l2', 'c1', 0, { kolejnosc: 2 }), czesc('c2', 'p1', 'Y', 2), ...licznik('l3', 'c2', 0),
      projekt('p2', 'B'), czesc('d1', 'p2', 'Z'), ...licznik('m1', 'd1', 0)]);
    expect((await lista(s)).kosz).toBe(0);
    await usunLicznik(s.z, { licznikId: 'l2' });
    await usunCzesc(s.z, { czescId: 'c2' });
    await usunLicznik(s.z, { licznikId: 'l3' }); // w części, która jest w koszu — nie liczy się osobno
    await usunCzesc(s.z, { czescId: 'd1' });
    await usunProjekt(s.z, { projektId: 'p2' }); // część d1 w projekcie z kosza — nie liczy się osobno
    expect((await lista(s)).kosz).toBe(3); // l2, c2, p2
  });
});

describe('widokKosza (C1, BR-DAN-008)', () => {
  test('pozycje od najkrótszego terminu z „until” = dzień usunięcia + 30; nazwy rodziców; części i liczniki tylko przy rodzicu poza koszem', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Tył'), ...licznik('l1', 'c1', 1), ...licznik('l2', 'c1', 0, { kolejnosc: 2, rodzaj: 'oczka' }),
      czesc('c2', 'p1', 'Rękaw', 2), ...licznik('l3', 'c2', 0), projekt('p2', 'Szal'), czesc('d1', 'p2', 'Całość'), ...licznik('m1', 'd1', 0)]);
    await usunLicznik(s.z, { licznikId: 'l2' }); // 2026-10-22 → do 2026-11-21
    s.zegar.przesun(DOBA);
    await usunCzesc(s.z, { czescId: 'c2' }); // 2026-10-23 → do 2026-11-22
    s.zegar.przesun(DOBA);
    await usunCzesc(s.z, { czescId: 'd1' });
    await usunProjekt(s.z, { projektId: 'p2' }); // 2026-10-24 → do 2026-11-23; d1 ukryta
    const w = await widokKosza(s.z);
    expect(w.ok && w.wartosc.map((e) => [e.rodzaj, e.id, e.nazwa, e.rodzajLicznika, e.projekt, e.czesc, e.doDnia])).toEqual([
      ['licznik', 'l2', '', 'oczka', 'Sweter', 'Tył', '2026-11-21'],
      ['czesc', 'c2', 'Rękaw', null, 'Sweter', null, '2026-11-22'],
      ['projekt', 'p2', 'Szal', null, 'Szal', null, '2026-11-23'],
    ]);
  });

  test('projekt roboczy: część w koszu niesie flagę i chwilę startu rodzica (etykieta zamiast daty zapasowej; 05 fix-6, P-199)', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', '2026-10-20', T0 - 2 * DOBA), ["UPDATE projekt SET nienazwany = 1 WHERE id = 'p1'", []], czesc('c1', 'p1', 'Tył'), ...licznik('l1', 'c1', 0)]);
    await usunCzesc(s.z, { czescId: 'c1' });
    const w = await widokKosza(s.z);
    expect(w.ok && w.wartosc.map((e) => [e.rodzaj, e.projekt, e.projektNienazwany, e.projektUtworzonoMs])).toEqual([['czesc', '2026-10-20', true, T0 - 2 * DOBA]]);
  });

  test('pusty kosz → pusta lista', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'A')]);
    expect(await widokKosza(s.z)).toEqual({ ok: true, wartosc: [] });
  });
});

describe('nastepnaCzesc (A3, BR-LIC-011/S1, P-182 Q4a)', () => {
  test('jest następna nieusunięta część → jej pierwszy licznik; usunięta część pominięta', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Tył', 1, { cel: 96 }), czesc('c2', 'p1', 'Usunięta', 2, { usunieto: T0 }), czesc('c3', 'p1', 'Przód', 3),
      ...licznik('l1', 'c1', 96), ...licznik('l2', 'c2', 0), ...licznik('l3', 'c3', 0), ...licznik('l4', 'c3', 0, { kolejnosc: 2 })]);
    expect(await nastepnaCzesc(s.z, { licznikId: 'l1' })).toEqual({ ok: true, wartosc: { rodzaj: 'licznik', licznikId: 'l3' } });
  });

  test('ostatnia część → koniec z celem drugiej = rzędy tej części (BR-PRJ-014 S1, P-199 Q2a); 0 rzędów → null', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Skarpety'), czesc('c1', 'p1', 'Pierwsza', 1, { cel: 60 }), ...licznik('l1', 'c1', 60),
      projekt('p2', 'Rękawy'), czesc('d1', 'p2', 'Lewy'), ...licznik('m1', 'd1', 88), projekt('p3', 'Puste'), czesc('e1', 'p3', 'X'), ...licznik('n1', 'e1', 0)]);
    expect(await nastepnaCzesc(s.z, { licznikId: 'l1' })).toEqual({ ok: true, wartosc: { rodzaj: 'koniec', czescId: 'c1', czesc: 'Pierwsza', projekt: 'Skarpety', celDrugiej: 60 } });
    expect(await nastepnaCzesc(s.z, { licznikId: 'm1' })).toEqual({ ok: true, wartosc: { rodzaj: 'koniec', czescId: 'd1', czesc: 'Lewy', projekt: 'Rękawy', celDrugiej: 88 } });
    const p3 = await nastepnaCzesc(s.z, { licznikId: 'n1' });
    expect(p3.ok && p3.wartosc.rodzaj === 'koniec' && p3.wartosc.celDrugiej).toBeNull();
    expect(await nastepnaCzesc(s.z, { licznikId: 'brak' })).toEqual({ ok: false, powod: 'bledne_dane' });
  });

  test('cel części 60, zrobione 64 rzędy → celDrugiej 64, nie 60 (P-199 Q2a)', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Skarpety'), czesc('c1', 'p1', 'Pierwsza', 1, { cel: 60 }), ...licznik('l1', 'c1', 64)]);
    const w = await nastepnaCzesc(s.z, { licznikId: 'l1' });
    expect(w.ok && w.wartosc.rodzaj === 'koniec' && w.wartosc.celDrugiej).toBe(64);
  });
});

describe('cel części pary na ekranie licznika (BR-PRJ-014 S1, S3)', () => {
  test('druga część bez celu: cel = rzędy pierwszej; pierwsza bez rzędów → brak celu', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Skarpety'), czesc('c1', 'p1', 'Pierwsza'), czesc('c2', 'p1', 'Druga', 2, { paraZ: 'c1' }), ...licznik('l1', 'c1', 72), ...licznik('l2', 'c2', 3),
      projekt('p2', 'Rękawy'), czesc('d1', 'p2', 'Lewy'), czesc('d2', 'p2', 'Prawy', 2, { paraZ: 'd1' }), ...licznik('m2', 'd2', 0)]);
    const w = await widokLicznika(s.z, { licznikId: 'l2' });
    expect(w.ok && w.wartosc.czesc).toEqual({ nazwa: 'Druga', cel: 72 });
    const m = await widokLicznika(s.z, { licznikId: 'm2' });
    expect(m.ok && m.wartosc.czesc).toEqual({ nazwa: 'Prawy', cel: null });
  });
});
