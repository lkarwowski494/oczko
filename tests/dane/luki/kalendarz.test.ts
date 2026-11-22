// Luki pokrycia E3 (rola 07): kalendarz dni z robótką (BR-DNI-001/S1–S3), dzień (BR-DNI-002/S1), podsumowanie tygodnia (BR-DNI-003/S1),
// kolejność „który projekt dziś” (BR-DNI-006/S1–S3) — poziom dane-node:sqlite (utworzPortNode + migruj aplikacji, dane wejściowe SQL).
// Wyrocznie: scenariusze docs/brd/wymagania-dni.md:10, :14, :18, :32, :45, :100, :104, :108 (wartości w scenariuszu);
// RD-15 (wykonanie: +1/−1 rzędów, bez wpisań i cofniętych; cel g = ⌈R/d⌉; RD-15-W4 po terminie), RD-16 (dzień ze zdarzenia),
// P-048 (3) wpisanie nie jest pracą, (4) kolejność: po terminie, cel na dziś malejąco, bez terminu według ostatniej pracy,
// P-059 (2a) dzień z robótką ≠ dzień limitu; L-04 (bez przerwy po północy brak nowego dnia), L-06 (cofnięcie nie oddaje dnia limitu).
import { dniZRobotka, kolejnoscProjektow, podsumowanieTygodnia, szczegolyDnia } from '../../../src/dane/repozytoria/kalendarz';
import { cofnijOstatnie, dodajRzad } from '../../../src/przypadki-uzycia/licznik';
import { czesc, licznik, projekt, ustawGlowe, zdarzenie, type Instr } from '../pomocnicze/dane-wejsciowe';
import { GODZ, MIN, T0, przygotuj, wykonaj } from '../pomocnicze/srodowisko';

/** Chwila UTC dla czasu lokalnego Europe/Warsaw w październiku 2026 przed 25.10 (CEST, UTC+2). */
const waw = (dzien: number, h: number, m = 0) => Date.UTC(2026, 9, dzien, h - 2, m);
const sesjaZakonczona = (id: string, projektId: string, startMs: number, trwanieMs: number, dzien: string): Instr => [
  "INSERT INTO sesja (id, projekt_id, stan, start_ms, koniec_ms, strefa, dzien) VALUES (?, ?, 'zakonczona', ?, ?, 'Europe/Warsaw', ?)",
  [id, projektId, startMs, startMs + trwanieMs, dzien],
];
const projektZCzescia = (id: string, nazwa: string, o: { cel?: number | null; ostatnia?: number; stan?: string; ukonczono?: number | null; usunieto?: number | null } = {}): Instr[] => [
  projekt(id, nazwa, T0, { ostatnia: o.ostatnia, stan: o.stan, ukonczono: o.ukonczono, usunieto: o.usunieto }),
  czesc(`${id}-c`, id, 'Część', 1, { cel: o.cel ?? null }),
];
const termin = (projektId: string, dzien: string): Instr => ['UPDATE projekt SET termin_dzien = ? WHERE id = ?', [dzien, projektId]];

describe('BR-DNI-001 kalendarz dni z robótką (RD-15, RD-16)', () => {
  test('BR-DNI-001/S1 21.10 12 rzędów w „Skarpecie”, 20.10 nic → znacznik tylko 21.10', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [...projektZCzescia('skarpeta', 'Skarpeta'), ...licznik('l1', 'skarpeta-c', 12, { t: waw(21, 10) })]);
    expect(await dniZRobotka(s.baza, '2026-10')).toEqual(['2026-10-21']);
  });

  test('BR-DNI-001/S2 19.10 tylko wpisanie, zerowanie i +1 cofnięte z historii → bez znacznika 19.10 (18.10 z +1 ma znacznik)', async () => {
    const s = await przygotuj();
    const t = waw(19, 10);
    await wykonaj(s.baza, [
      ...projektZCzescia('p1', 'Sweter'),
      ...licznik('l1', 'p1-c', 0),
      zdarzenie('a', 'l1', 'plus', 1, [], waw(18, 10)),
      zdarzenie('w', 'l1', 'wpisanie', 57, ['a'], t, { wartosc: 57 }),
      zdarzenie('p', 'l1', 'plus', 58, ['w'], t + MIN),
      zdarzenie('u', 'l1', 'cofniecie', 57, ['p'], t + 2 * MIN, { wartosc: 57, cofa: ['p'] }),
      zdarzenie('z', 'l1', 'zerowanie', 0, ['u'], t + 3 * MIN),
      ustawGlowe('l1', 0, 'z'),
    ]);
    expect(await dniZRobotka(s.baza, '2026-10')).toEqual(['2026-10-18']);
  });

  test('BR-DNI-001/S3 bez Pro: praca 21.10 23:40 → 22.10 00:10 bez przerwy, 23.10 +1 i cofnięcie → robótka 21 i 22; dni limitu 21 i 23 (L-04, L-06)', async () => {
    const s = await przygotuj();
    s.pro.wartosc = false;
    await wykonaj(s.baza, [...projektZCzescia('p1', 'Skarpeta'), ...licznik('l1', 'p1-c', 0)]);
    for (const [d, h, m] of [[21, 23, 40], [21, 23, 50], [22, 0, 0], [22, 0, 10]] as const) {
      s.zegar.ustaw(waw(d, h, m));
      const w = await dodajRzad(s.z, { licznikId: 'l1' });
      expect(w.ok).toBe(true);
    }
    s.zegar.ustaw(waw(23, 12));
    expect((await dodajRzad(s.z, { licznikId: 'l1' })).ok).toBe(true);
    expect((await cofnijOstatnie(s.z, { licznikId: 'l1' })).ok).toBe(true);
    expect(await dniZRobotka(s.baza, '2026-10')).toEqual(['2026-10-21', '2026-10-22']);
    const dniLimitu = await s.baza.all<{ dzien: string; pro: number }>('SELECT dzien, pro FROM dzien_limitu ORDER BY dzien');
    expect(dniLimitu).toEqual([{ dzien: '2026-10-21', pro: 0 }, { dzien: '2026-10-23', pro: 0 }]);
  });
});

describe('BR-DNI-002 dzień: projekty, rzędy i czas', () => {
  test('BR-DNI-002/S1 21.10: „Skarpeta: 12 rzędów, 50 min” i „Sweter: 5 rzędów” (bez czasu: null, P-048 (6)); praca z 20.10 nie wchodzi', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [
      ...projektZCzescia('p-skarpeta', 'Skarpeta'),
      ...licznik('l1', 'p-skarpeta-c', 12, { t: waw(21, 9) }),
      sesjaZakonczona('s1', 'p-skarpeta', waw(21, 9), 50 * MIN, '2026-10-21'),
      ...projektZCzescia('p-sweter', 'Sweter'),
      ...licznik('l2', 'p-sweter-c', 5, { t: waw(21, 18) }),
      czesc('p-sweter-c2', 'p-sweter', 'Rękaw', 2),
      ...licznik('l3', 'p-sweter-c2', 3, { t: waw(20, 18) }),
    ]);
    const dzien = (await szczegolyDnia(s.baza, '2026-10-21')).sort((a, b) => a.projektId.localeCompare(b.projektId));
    expect(dzien).toEqual([
      { projektId: 'p-skarpeta', nazwa: 'Skarpeta', rzedy: 12, czasMs: 50 * MIN },
      { projektId: 'p-sweter', nazwa: 'Sweter', rzedy: 5, czasMs: null },
    ]);
  });
});

describe('BR-DNI-003 podsumowanie tygodnia (początek tygodnia z regionu, ADR-0017)', () => {
  /** Ten tydzień (pon 19.10–nd 25.10): 80 rzędów, 2 × 2 h stopera, 1 ukończony; poprzedni (pon 12.10–nd 18.10): 60 rzędów. */
  async function dane(zNiedziela: boolean) {
    const s = await przygotuj();
    await wykonaj(s.baza, [
      ...projektZCzescia('a', 'Czapka'), ...licznik('la', 'a-c', 80, { t: waw(20, 10) }),
      ...projektZCzescia('b', 'Szal'), ...licznik('lb', 'b-c', 60, { t: waw(14, 10) }),
      sesjaZakonczona('s1', 'a', waw(20, 10), 2 * GODZ, '2026-10-20'),
      sesjaZakonczona('s2', 'a', waw(21, 10), 2 * GODZ, '2026-10-21'),
      ...projektZCzescia('c', 'Rękawiczki', { stan: 'ukonczony', ukonczono: waw(21, 20) }),
      ...(zNiedziela ? [...projektZCzescia('d', 'Opaska'), ...licznik('ld', 'd-c', 7, { t: waw(18, 10) })] : []),
    ]);
    return s;
  }
  test('BR-DNI-003/S1 region z poniedziałkiem (pl-PL): 80 rzędów, 4 h, 1 ukończony, poprzedni tydzień 60 rzędów', async () => {
    const s = await dane(false);
    expect(await podsumowanieTygodnia(s.baza, { dzis: '2026-10-22', pierwszyDzienTygodnia: 1 })).toEqual({
      od: '2026-10-19', do: '2026-10-25', rzedy: 80, czasMs: 4 * GODZ, ukonczone: 1, poprzednie: { rzedy: 60 },
    });
  });
  test('BR-DNI-003/S1 granica tygodnia z regionu: 7 rzędów w niedzielę 18.10 — z poniedziałkiem w poprzednim tygodniu, z niedzielą (en-US) w bieżącym', async () => {
    const s = await dane(true);
    expect(await podsumowanieTygodnia(s.baza, { dzis: '2026-10-22', pierwszyDzienTygodnia: 1 })).toMatchObject({ od: '2026-10-19', rzedy: 80, poprzednie: { rzedy: 67 } });
    expect(await podsumowanieTygodnia(s.baza, { dzis: '2026-10-22', pierwszyDzienTygodnia: 7 })).toEqual({
      od: '2026-10-18', do: '2026-10-24', rzedy: 87, czasMs: 4 * GODZ, ukonczone: 1, poprzednie: { rzedy: 60 },
    });
  });
});

describe('BR-DNI-006 kolejność projektów w toku według terminu (P-048 (4), RD-15)', () => {
  const DZIS = '2026-10-22';
  /** Czapka: C 120, 20 rzędów do wczoraj, termin 26.10 (d = 5) → cel 20; Szal: C 60, 20 do wczoraj, termin 26.10 → cel 8. */
  const czapka = (ostatnia: number): Instr[] => [...projektZCzescia('czapka', 'Czapka', { cel: 120, ostatnia }), ...licznik('lc', 'czapka-c', 20, { t: waw(20, 10) }), termin('czapka', '2026-10-26')];
  const sweterBezTerminu = (ostatnia: number): Instr[] => [...projektZCzescia('sweter', 'Sweter', { ostatnia }), ...licznik('lw', 'sweter-c', 4, { t: waw(21, 10) })];

  test('BR-DNI-006/S1 „Czapka” cel 20, „Szal” cel 8, „Sweter” bez terminu → Czapka, Szal, Sweter; ukończone i usunięte poza listą', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [
      ...czapka(T0 + 1 * GODZ),
      ...projektZCzescia('szal', 'Szal', { cel: 60, ostatnia: T0 + 2 * GODZ }), ...licznik('ls', 'szal-c', 20, { t: waw(21, 10) }), termin('szal', '2026-10-26'),
      ...sweterBezTerminu(T0 + 3 * GODZ),
      ...projektZCzescia('rek', 'Rękawiczki', { cel: 50, stan: 'ukonczony', ukonczono: T0 }), termin('rek', '2026-10-30'),
      ...projektZCzescia('kosz', 'Kocyk', { cel: 50, usunieto: T0 }), termin('kosz', '2026-10-23'),
    ]);
    expect(await kolejnoscProjektow(s.baza, DZIS)).toEqual([
      { id: 'czapka', nazwa: 'Czapka', cel: { rodzaj: 'cel', rzedy: 20 } },
      { id: 'szal', nazwa: 'Szal', cel: { rodzaj: 'cel', rzedy: 8 } },
      { id: 'sweter', nazwa: 'Sweter', cel: null },
    ]);
  });

  test('BR-DNI-006/S2 RD-15-W4 termin „Szala” minął (21.10), zostało 10 rzędów → Szal na górze z „termin minął, zostało 10”', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [
      ...czapka(T0 + 2 * GODZ),
      ...projektZCzescia('szal', 'Szal', { cel: 60, ostatnia: T0 }), ...licznik('ls', 'szal-c', 50, { t: waw(20, 10) }), termin('szal', '2026-10-21'),
      ...sweterBezTerminu(T0 + 3 * GODZ),
    ]);
    expect(await kolejnoscProjektow(s.baza, DZIS)).toEqual([
      { id: 'szal', nazwa: 'Szal', cel: { rodzaj: 'po_terminie', zostalo: 10 } },
      { id: 'czapka', nazwa: 'Czapka', cel: { rodzaj: 'cel', rzedy: 20 } },
      { id: 'sweter', nazwa: 'Sweter', cel: null },
    ]);
  });

  test('BR-DNI-006/S3 BR-PRJ-012 żaden projekt bez terminu → według ostatniej pracy malejąco', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [
      ...projektZCzescia('a', 'Czapka', { ostatnia: T0 + 1 * GODZ }),
      ...projektZCzescia('b', 'Szal', { ostatnia: T0 + 3 * GODZ }),
      ...projektZCzescia('c', 'Sweter', { ostatnia: T0 + 2 * GODZ }),
    ]);
    expect(await kolejnoscProjektow(s.baza, DZIS)).toEqual([
      { id: 'b', nazwa: 'Szal', cel: null },
      { id: 'c', nazwa: 'Sweter', cel: null },
      { id: 'a', nazwa: 'Czapka', cel: null },
    ]);
  });
});
