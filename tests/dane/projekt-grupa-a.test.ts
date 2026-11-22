// Grupa A partii 5 (P-181, P-182 Q3a): zapisy projektu i części bez UI — dodanie części z licznikiem (BR-PRJ-001, U-5), znaczenie liczby
// (BR-LIC-012, F-09), drut w mm (BR-PRJ-004, RD-11), termin „Gotowe do” (BR-DNI-005, F-61). Zasada 10: UPDATE jednej kolumny, dzieci
// i pola spoza formularza bez zmian; błąd danych niczego nie zapisuje.
import { dodajCzescProjektu, ustawDrut, ustawTermin } from '../../src/przypadki-uzycia/projekt';
import { ustawZnaczenie } from '../../src/przypadki-uzycia/czesc';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { MIN, T0, jeden, licznosci, migawka, przygotuj, wykonaj } from './pomocnicze/srodowisko';

async function s0() {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter', T0, { notatka: 'Drut 4 mm na ściągacz' }), czesc('c1', 'p1', 'Tył', 1, { cel: 96 }), ...licznik('l1', 'c1', 5)]);
  s.zegar.przesun(10 * MIN);
  return s;
}
type S = Awaited<ReturnType<typeof s0>>;
const projektRow = (s: S) => jeden<Record<string, unknown>>(s.baza, "SELECT nazwa, notatka, drut_mm, termin_dzien, ostatnia_praca_ms, zmieniono_ms FROM projekt WHERE id = 'p1'");

describe('dodajCzescProjektu (BR-PRJ-001, U-5)', () => {
  test('nowa część na końcu kolejności z jednym licznikiem rzędów; istniejące części, liczniki i historia bez zmian', async () => {
    const s = await s0();
    const przed = await migawka(s.baza);
    const w = await dodajCzescProjektu(s.z, { projektId: 'p1', nazwa: ' Rękaw lewy ', cel: 120 });
    expect(w.ok).toBe(true);
    if (!w.ok) return;
    expect(await jeden(s.baza, 'SELECT projekt_id, nazwa, kolejnosc, cel_rzedow, para_z FROM czesc WHERE id = ?', [w.wartosc.czescId]))
      .toEqual({ projekt_id: 'p1', nazwa: 'Rękaw lewy', kolejnosc: 2, cel_rzedow: 120, para_z: null });
    expect(await jeden(s.baza, 'SELECT czesc_id, rodzaj, wartosc, kolejnosc FROM licznik WHERE id = ?', [w.wartosc.licznikId]))
      .toEqual({ czesc_id: w.wartosc.czescId, rodzaj: 'rzedy', wartosc: 0, kolejnosc: 1 });
    // wszystko poza nową częścią i jej licznikiem bez zmian
    const po = JSON.parse(await migawka(s.baza)) as Record<string, string[]>;
    const p = JSON.parse(przed) as Record<string, string[]>;
    expect(po.zdarzenie).toEqual(p.zdarzenie);
    expect(po.czesc.filter((r) => !r.includes(w.wartosc.czescId))).toEqual(p.czesc);
    expect(po.licznik.filter((r) => !r.includes(w.wartosc.licznikId))).toEqual(p.licznik);
  });

  test('pusta nazwa, cel 0, projekt nieistniejący albo w koszu → błąd, nic nie zapisane', async () => {
    const s = await s0();
    await wykonaj(s.baza, [projekt('p2', 'Szal', T0, { usunieto: T0 })]);
    const przed = await licznosci(s.baza);
    expect(await dodajCzescProjektu(s.z, { projektId: 'p1', nazwa: '  ', cel: null })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await dodajCzescProjektu(s.z, { projektId: 'p1', nazwa: 'A', cel: 0 })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await dodajCzescProjektu(s.z, { projektId: 'brak', nazwa: 'A', cel: null })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await dodajCzescProjektu(s.z, { projektId: 'p2', nazwa: 'A', cel: null })).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
    expect(await licznosci(s.baza)).toEqual(przed);
  });
});

describe('ustawZnaczenie (BR-LIC-012, F-09)', () => {
  test('„rząd w trakcie” i z powrotem: tylko kolumna znaczenie, wartość i historia bez zmian; zła wartość → bledne_dane', async () => {
    const s = await s0();
    const zdarzenia = await s.baza.all('SELECT * FROM zdarzenie ORDER BY id');
    expect((await ustawZnaczenie(s.z, { licznikId: 'l1', znaczenie: 'w_trakcie' })).ok).toBe(true);
    expect(await jeden(s.baza, "SELECT znaczenie, wartosc, glowa FROM licznik WHERE id = 'l1'")).toEqual({ znaczenie: 'w_trakcie', wartosc: 5, glowa: 'l1-z5' });
    expect(await s.baza.all('SELECT * FROM zdarzenie ORDER BY id')).toEqual(zdarzenia);
    expect((await ustawZnaczenie(s.z, { licznikId: 'l1', znaczenie: 'skonczone' })).ok).toBe(true);
    expect(await jeden(s.baza, "SELECT znaczenie FROM licznik WHERE id = 'l1'")).toEqual({ znaczenie: 'skonczone' });
    const zla: unknown = 'polowa';
    expect(await ustawZnaczenie(s.z, { licznikId: 'l1', znaczenie: zla as 'skonczone' })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await ustawZnaczenie(s.z, { licznikId: 'brak', znaczenie: 'w_trakcie' })).toEqual({ ok: false, powod: 'bledne_dane' });
  });
});

describe('ustawDrut (BR-PRJ-004) i ustawTermin (BR-DNI-005)', () => {
  test('drut 4 mm, potem brak (null); 0, ujemny i NaN → bledne_dane; nazwa, notatka i ostatnia praca bez zmian', async () => {
    const s = await s0();
    expect((await ustawDrut(s.z, { projektId: 'p1', drutMm: 4, narzedzie: 'druty' })).ok).toBe(true);
    expect(await projektRow(s)).toMatchObject({ drut_mm: 4, nazwa: 'Sweter', notatka: 'Drut 4 mm na ściągacz', ostatnia_praca_ms: T0, zmieniono_ms: T0 + 10 * MIN });
    for (const zly of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) expect(await ustawDrut(s.z, { projektId: 'p1', drutMm: zly, narzedzie: 'druty' })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect((await projektRow(s)).drut_mm).toBe(4);
    expect((await ustawDrut(s.z, { projektId: 'p1', drutMm: null, narzedzie: 'druty' })).ok).toBe(true);
    expect((await projektRow(s)).drut_mm).toBeNull();
  });

  test('BR-PRJ-004/S3 (P-184): szydełko 6,5 mm zapisuje narzędzie; nieznane narzędzie → bledne_dane bez zmiany', async () => {
    const s = await s0();
    expect((await ustawDrut(s.z, { projektId: 'p1', drutMm: 6.5, narzedzie: 'szydelko' })).ok).toBe(true);
    expect(await jeden(s.baza, "SELECT drut_mm, narzedzie FROM projekt WHERE id = 'p1'")).toEqual({ drut_mm: 6.5, narzedzie: 'szydelko' });
    const inne: unknown = 'igla';
    expect(await ustawDrut(s.z, { projektId: 'p1', drutMm: 5, narzedzie: inne as 'druty' })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await jeden(s.baza, "SELECT drut_mm, narzedzie FROM projekt WHERE id = 'p1'")).toEqual({ drut_mm: 6.5, narzedzie: 'szydelko' });
  });

  test('termin dzień RRRR-MM-DD albo null; zły format → bledne_dane; ostatnia praca bez zmian', async () => {
    const s = await s0();
    expect((await ustawTermin(s.z, { projektId: 'p1', terminDzien: '2026-12-24' })).ok).toBe(true);
    expect(await projektRow(s)).toMatchObject({ termin_dzien: '2026-12-24', ostatnia_praca_ms: T0 });
    for (const zly of ['24.12.2026', '2026-13-01', '']) expect(await ustawTermin(s.z, { projektId: 'p1', terminDzien: zly })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect((await projektRow(s)).termin_dzien).toBe('2026-12-24');
    expect((await ustawTermin(s.z, { projektId: 'p1', terminDzien: null })).ok).toBe(true);
    expect((await projektRow(s)).termin_dzien).toBeNull();
    expect(await ustawTermin(s.z, { projektId: 'brak', terminDzien: null })).toEqual({ ok: false, powod: 'bledne_dane' });
  });
});

import { utworzProjekt } from '../../src/przypadki-uzycia/projekt';
describe('utworzProjekt z arkusza „New project” (F-14, P-126 (1b))', () => {
  test('pusta nazwa → projekt roboczy (nienazwany, nazwa zapasowa = dzień startu), jedna część z licznikiem; części z nazwami zapisane', async () => {
    const s = await przygotuj();
    const r = await utworzProjekt(s.z, { nazwa: '  ', czesci: [] });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(await jeden(s.baza, 'SELECT nazwa, nienazwany FROM projekt WHERE id = ?', [r.wartosc.projektId])).toEqual({ nazwa: '2026-10-22', nienazwany: 1 });
    expect(r.wartosc.czesci).toHaveLength(1);
    const n = await utworzProjekt(s.z, { nazwa: 'Harbor', czesci: ['Back', 'Front'] });
    expect(n.ok && n.wartosc.czesci.map((c) => c.nazwa)).toEqual(['Back', 'Front']);
    expect(await utworzProjekt(s.z, { nazwa: 'X', czesci: ['  '] })).toEqual({ ok: false, powod: 'bledne_dane' });
  });
});
