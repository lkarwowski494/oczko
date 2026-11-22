// Model odczytu ekranu licznika (08 partia 4, krok 3A): dane StanEkranuLicznika z bazy aplikacji (node:sqlite), teksty liczy kompozycja.
// F-49 (powrót do miejsca, moduly.md:238), RD-13 (przypomnienie na rzędzie dzierganym), RD-17 (seria na końcu historii), P-065 (limit zawczasu),
// kreski posiedzenia (design-spec „Element firmowy”: przerwa ≥ PRZERWA_NOWEGO_DNIA_MS zaczyna nowe), BR-PRJ-014 (bliźniak w tym samym rzędzie).
import { utworzSzybkiLicznik, dodajRzad, odejmijRzad } from '../../src/przypadki-uzycia/licznik';
import { biezacyLicznik, historiaLicznika, widokLicznika, zapamietajLicznik } from '../../src/przypadki-uzycia/widok-licznika';
import { widokProjektow } from '../../src/przypadki-uzycia/widok-projektow';
import { startSesji, zakonczSesje } from '../../src/przypadki-uzycia/sesja';
import { PRZERWA_NOWEGO_DNIA_MS } from '../../src/konfiguracja';
import { czesc, dzienLimitu, licznik, notatkaRzedu, projekt, przypomnienie, zdarzenie, ustawGlowe } from './pomocnicze/dane-wejsciowe';
import { MIN, T0, ile, przygotuj, wykonaj } from './pomocnicze/srodowisko';

async function z(instrukcje: Parameters<typeof wykonaj>[1], terazMs = T0 + 10 * MIN) {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód', 1, { cel: 96 }), ...instrukcje]);
  s.zegar.ustaw(terazMs);
  return s;
}
const widok = async (s: Awaited<ReturnType<typeof z>>, id = 'l1') => {
  const w = await widokLicznika(s.z, { licznikId: id });
  if (!w.ok) throw new Error(w.powod);
  return w.wartosc;
};

describe('widokLicznika: dane ekranu licznika z bazy', () => {
  test('BR-LIC-001: świeży licznik roboczy → 0, projekt bez nazwy, bez limitu, bez kresek i serii', async () => {
    const s = await z([]);
    const n = await utworzSzybkiLicznik(s.z);
    expect(n.ok).toBe(true);
    const w = await widok(s, n.ok ? n.wartosc.licznikId : '');
    expect([w.wartosc, w.projekt.nienazwany, w.limit, w.sesja, w.seria, w.przypomnienie, w.zablokowany]).toEqual([0, true, 'brak', null, null, null, false]);
    expect(w.wznowienie).toBe('2026-11-01');
  });

  test('RD-13: przypomnienie „od 6 co 6, 5 razy” na rzędzie dzierganym 6 (wartość 5) → 1 z 5, następne 12; na rzędzie 7 → brak', async () => {
    const s = await z([...licznik('l1', 'c1', 5), przypomnienie('pr1', 'l1')]);
    expect((await widok(s)).przypomnienie).toEqual({ tekst: 'ujmowanie', ktory: 1, razy: 5, nastepny: 12 });
    await dodajRzad(s.z, { licznikId: 'l1' });
    expect((await widok(s)).przypomnienie).toBeNull();
  });

  // Zmiana 08 (partia 5): design-spec:244 (N2, P-126 (6a)) — po przerwie ≥ 60 min kreski poprzedniego posiedzenia zostają do następnego +1;
  // wcześniej test oczekiwał braku posiedzenia. Nowe posiedzenie przy następnym +1: tests/domena/posiedzenie/posiedzenie.test.ts.
  test('kreski: trzy +1 co minutę → 3 rzędy od pierwszego; przerwa ≥ PRZERWA_NOWEGO_DNIA_MS od ostatniego → kreski zostają do następnego +1', async () => {
    const s = await z(licznik('l1', 'c1', 3), T0 + 3 * MIN);
    expect((await widok(s)).sesja).toEqual({ rzedy: 3, odMs: T0 });
    s.zegar.ustaw(T0 + 2 * MIN + PRZERWA_NOWEGO_DNIA_MS);
    expect((await widok(s)).sesja).toEqual({ rzedy: 3, odMs: T0 });
  });

  test('kreski od startu stopera (design-spec:242): posiedzenie = sesja stopera; po zatrzymaniu +1 sprzed zatrzymania nie wracają', async () => {
    const s = await z(licznik('l1', 'c1', 2), T0 + 10 * MIN);
    const start = await startSesji(s.z, { projektId: 'p1' });
    expect((await widok(s)).sesja).toEqual({ rzedy: 0, odMs: T0 + 10 * MIN });
    s.zegar.ustaw(T0 + 11 * MIN);
    await dodajRzad(s.z, { licznikId: 'l1' });
    expect((await widok(s)).sesja).toEqual({ rzedy: 1, odMs: T0 + 10 * MIN });
    s.zegar.ustaw(T0 + 12 * MIN);
    if (start.ok) await zakonczSesje(s.z, { sesjaId: start.wartosc.sesjaId });
    expect((await widok(s)).sesja).toBeNull();
  });

  test('kreski: cofnięte +1 się nie liczą; przerwa ≥ 60 min w środku dzieli posiedzenia', async () => {
    const s = await z([
      ...licznik('l1', 'c1', 2),
      zdarzenie('l1-z3', 'l1', 'plus', 3, ['l1-z2'], T0 + 70 * MIN),
      zdarzenie('l1-z4', 'l1', 'plus', 4, ['l1-z3'], T0 + 71 * MIN),
      zdarzenie('l1-c', 'l1', 'cofniecie', 3, ['l1-z4'], T0 + 72 * MIN, { wartosc: 3, cofa: ['l1-z4'] }),
      ustawGlowe('l1', 3, 'l1-c'),
    ], T0 + 73 * MIN);
    expect((await widok(s)).sesja).toEqual({ rzedy: 1, odMs: T0 + 70 * MIN });
  });

  // [04-studio-projektowe-571] design-spec:250–256: „−1 zdejmuje ostatnią kreskę”; rzędy posiedzenia = zdarzenia +1/−1 od początku posiedzenia.
  test('kreski: +1, −1, +1, +1 → licznik 2 i 2 kreski (−1 zdejmuje ostatnią kreskę)', async () => {
    const s = await z(licznik('l1', 'c1', 0), T0);
    const krok = async (f: typeof dodajRzad | typeof odejmijRzad, min: number) => { s.zegar.ustaw(T0 + min * MIN); expect((await f(s.z, { licznikId: 'l1' })).ok).toBe(true); };
    await krok(dodajRzad, 1);
    await krok(odejmijRzad, 2);
    expect(await widok(s)).toMatchObject({ wartosc: 0, sesja: null }); // zero kresek = brak posiedzenia (posiedzenie → null);
    await krok(dodajRzad, 3);
    await krok(dodajRzad, 4);
    expect(await widok(s)).toMatchObject({ wartosc: 2, sesja: { rzedy: 2, odMs: T0 + 3 * MIN } });
  });

  test('kreski: cofnięte −1 się nie liczy; −1 po przerwie ≥ 60 min zdejmuje kreskę poprzedniego posiedzenia, a granica posiedzenia zostaje', async () => {
    const s = await z([
      ...licznik('l1', 'c1', 2),
      zdarzenie('l1-z3', 'l1', 'plus', 3, ['l1-z2'], T0 + 70 * MIN),
      zdarzenie('l1-z4', 'l1', 'plus', 4, ['l1-z3'], T0 + 71 * MIN),
      zdarzenie('m1', 'l1', 'minus', 3, ['l1-z4'], T0 + 72 * MIN),
      zdarzenie('l1-c', 'l1', 'cofniecie', 4, ['m1'], T0 + 73 * MIN, { wartosc: 4, cofa: ['m1'] }),
      ustawGlowe('l1', 4, 'l1-c'),
    ], T0 + 74 * MIN);
    expect((await widok(s)).sesja).toEqual({ rzedy: 2, odMs: T0 + 70 * MIN });
    await wykonaj(s.baza, [zdarzenie('m2', 'l1', 'minus', 3, ['l1-c'], T0 + 75 * MIN), ustawGlowe('l1', 3, 'm2')]);
    expect((await widok(s)).sesja).toEqual({ rzedy: 1, odMs: T0 + 70 * MIN });
  });

  test('RD-17: trzy +1 w 1 s na końcu historii → seria od pierwszego; po kolejnej zmianie (−1) pytania nie ma', async () => {
    const s = await z([
      ...licznik('l1', 'c1', 1),
      zdarzenie('s1', 'l1', 'plus', 2, ['l1-z1'], T0 + 5 * MIN),
      zdarzenie('s2', 'l1', 'plus', 3, ['s1'], T0 + 5 * MIN + 400),
      zdarzenie('s3', 'l1', 'plus', 4, ['s2'], T0 + 5 * MIN + 800),
      ustawGlowe('l1', 4, 's3'),
    ], T0 + 5 * MIN + 1000);
    expect((await widok(s)).seria).toEqual({ ile: 3, sekundy: 1, odZdarzeniaId: 's1', zrodlo: 'aplikacja', odMs: T0 + 5 * MIN }); // 07-jakosc-014: źródło i początek serii dla banera (S5)
    await wykonaj(s.baza, [zdarzenie('m1', 'l1', 'minus', 3, ['s3'], T0 + 6 * MIN), ustawGlowe('l1', 3, 'm1')]);
    expect((await widok(s)).seria).toBeNull();
  });

  test('P-065: 5 darmowych dni w miesiącu (dziś nie zaczęty) → limit zawczasu; 4 → ostatni darmowy; Pro → brak', async () => {
    const dni = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'].map((d, i) => dzienLimitu(d, `l1-z${i + 1}`));
    const s = await z([...licznik('l1', 'c1', 5, { t: T0 - 3 * 86_400_000 }), ...dni], T0);
    expect((await widok(s)).limit).toBe('ostatni-darmowy');
    await wykonaj(s.baza, [dzienLimitu('2026-10-05', 'l1-z5')]);
    expect((await widok(s)).limit).toBe('zawczasu');
    s.pro.wartosc = true;
    expect((await widok(s)).limit).toBe('brak');
  });

  test('BR-PRJ-014: bliźniak z notatką w tym samym rzędzie dzierganym → pokazany; inny rząd → brak', async () => {
    const s = await z([
      czesc('c2', 'p1', 'Rękaw prawy', 2, { paraZ: 'c1' }),
      ...licznik('l1', 'c1', 3),
      ...licznik('l2', 'c2', 3),
      notatkaRzedu('n1', 'l1', 4, 'zmiana koloru'),
    ]);
    expect((await widok(s, 'l2')).blizniak).toEqual({ rzad: 4, notatka: 'zmiana koloru', przypomnienie: null });
    await dodajRzad(s.z, { licznikId: 'l2' });
    expect((await widok(s, 'l2')).blizniak).toBeNull();
  });

  test('licznik w koszu → bledne_dane (kompozycja otwiera listę projektów)', async () => {
    const s = await z(licznik('l1', 'c1', 1, { usunieto: T0 }));
    expect(await widokLicznika(s.z, { licznikId: 'l1' })).toEqual({ ok: false, powod: 'bledne_dane' });
  });
});

describe('F-49: biezacyLicznik / zapamietajLicznik (ostatnie_miejsce)', () => {
  test('brak klucza → null; zapamiętany licznik → jego id', async () => {
    const s = await z(licznik('l1', 'c1', 1));
    expect(await biezacyLicznik(s.z)).toEqual({ ok: true, wartosc: null });
    expect((await zapamietajLicznik(s.z, { licznikId: 'l1' })).ok).toBe(true);
    expect(await biezacyLicznik(s.z)).toEqual({ ok: true, wartosc: 'l1' });
  });

  test('moduly.md:238: wskazanie na licznik w koszu → null i klucz usunięty, bez komunikatu', async () => {
    const s = await z(licznik('l1', 'c1', 1));
    await zapamietajLicznik(s.z, { licznikId: 'l1' });
    await wykonaj(s.baza, [['UPDATE licznik SET usunieto_ms = ? WHERE id = ?', [T0, 'l1']]]);
    expect(await biezacyLicznik(s.z)).toEqual({ ok: true, wartosc: null });
    expect(await ile(s.baza, 'ustawienie', "klucz = 'ostatnie_miejsce'")).toBe(0);
  });
});

describe('widokProjektow: lista z pierwszym licznikiem i dniami darmowymi (F-50, P-065 (2a))', () => {
  test('projekt z dwiema częściami → licznik pierwszej części; projekt roboczy z flagą; dni: 5 − zużyte; Pro → null', async () => {
    const s = await z([
      czesc('c0', 'p1', 'Tył', 0, { cel: 80 }), ...licznik('l0', 'c0', 7), ...licznik('l1', 'c1', 2, { kolejnosc: 1 }),
      dzienLimitu('2026-10-01', 'l0-z1'),
    ]);
    await utworzSzybkiLicznik(s.z);
    const w = await widokProjektow(s.z);
    if (!w.ok) throw new Error(w.powod);
    const sweter = w.wartosc.wToku.find((p) => p.id === 'p1');
    expect(sweter?.licznik).toEqual({ id: 'l0', czesc: 'Tył', wartosc: 7, cel: 80 });
    expect(w.wartosc.wToku.map((p) => p.nienazwany).sort()).toEqual([false, true]);
    expect(w.wartosc.dni).toEqual({ zostalo: 4, limit: 5, dzis: '2026-10-22' });
    s.pro.wartosc = true;
    const p = await widokProjektow(s.z);
    expect(p.ok && p.wartosc.dni).toBeNull();
  });
});

describe('historiaLicznika (F-02, BR-LIC-003)', () => {
  test('od najnowszej: z → na z wartości rodzica; pierwsze zdarzenie z 0', async () => {
    const s = await z(licznik('l1', 'c1', 2));
    await wykonaj(s.baza, [zdarzenie('l1-m', 'l1', 'minus', 1, ['l1-z2'], T0 + 5 * MIN), ustawGlowe('l1', 1, 'l1-m')]);
    const h = await historiaLicznika(s.z, { licznikId: 'l1' });
    expect(h.ok && h.wartosc.map((x) => [x.id, x.z, x.na, x.rodzaj])).toEqual([['l1-m', 2, 1, 'minus'], ['l1-z2', 1, 2, 'plus'], ['l1-z1', 0, 1, 'plus']]);
  });
});
