// P-195 (ER-53, ER-55): dzień z robótką także z samą sesją stopera ≥ 1 min (Q3b, BR-DNI-001), ostatnia praca = później z ostatniej zmiany
// licznika i końca sesji stopera (Q5, BR-PRJ-016), „Zrób taką samą” kopiuje narzędzie i rozmiar, bez stanu (Q4a, BR-PRJ-007).
import { dniZRobotka } from '../../src/dane/repozytoria/kalendarz';
import { korygujSesje, startSesji, zakonczSesje } from '../../src/przypadki-uzycia/sesja';
import { zrobPonownie } from '../../src/przypadki-uzycia/projekt';
import { uruchomDane } from '../../src/przypadki-uzycia/start';
import { migruj } from '../../src/dane/migracje/migruj';
import { czesc, licznik, projekt, sesja } from './pomocnicze/dane-wejsciowe';
import { DOBA, GODZ, MIN, T0, przygotuj, wykonaj } from './pomocnicze/srodowisko';

const ostatnia = async (s: Awaited<ReturnType<typeof przygotuj>>, id = 'p1') =>
  ((await s.baza.all<{ o: number }>('SELECT ostatnia_praca_ms AS o FROM projekt WHERE id = ?', [id]))[0])?.o;

describe('P-195 Q3b: dzień z robótką ze stoperem', () => {
  test('22.10: sam stoper 40 min → znacznik; 24.10: stoper 20 s → bez znacznika; dzień z dnia startu sesji', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Szalik')]);
    const d22 = Date.UTC(2026, 9, 22, 18); // 20:00 w Warszawie
    s.zegar.ustaw(d22);
    const a = await startSesji(s.z, { projektId: 'p1' });
    s.zegar.ustaw(d22 + 40 * MIN);
    if (a.ok) await zakonczSesje(s.z, { sesjaId: a.wartosc.sesjaId });
    const d24 = Date.UTC(2026, 9, 24, 18);
    s.zegar.ustaw(d24);
    const b = await startSesji(s.z, { projektId: 'p1' });
    s.zegar.ustaw(d24 + 20_000);
    if (b.ok) await zakonczSesje(s.z, { sesjaId: b.wartosc.sesjaId });
    expect(await dniZRobotka(s.baza, '2026-10')).toEqual(['2026-10-22']);
  });

  test('korekta skraca sesję do 30 s → dzień traci znacznik (próg liczony po korekcie)', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Szalik')]);
    s.zegar.ustaw(T0);
    const a = await startSesji(s.z, { projektId: 'p1' });
    s.zegar.ustaw(T0 + 10 * MIN);
    if (!a.ok) throw new Error('start');
    await zakonczSesje(s.z, { sesjaId: a.wartosc.sesjaId });
    expect(await dniZRobotka(s.baza, '2026-10')).toEqual(['2026-10-22']);
    await korygujSesje(s.z, { sesjaId: a.wartosc.sesjaId, startMs: T0, koniecMs: T0 + 30_000 });
    expect(await dniZRobotka(s.baza, '2026-10')).toEqual([]);
  });
});

describe('P-195 Q5: ostatnia praca z końca sesji stopera', () => {
  test('ostatnia zmiana licznika 10 dni temu, sesja 40 min 2 dni temu → ostatnia praca = koniec sesji; starszy koniec nie cofa', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Szalik', T0 - 10 * DOBA)]);
    s.zegar.ustaw(T0 - 2 * DOBA);
    const a = await startSesji(s.z, { projektId: 'p1' });
    s.zegar.ustaw(T0 - 2 * DOBA + 40 * MIN);
    if (!a.ok) throw new Error('start');
    await zakonczSesje(s.z, { sesjaId: a.wartosc.sesjaId });
    expect(await ostatnia(s)).toBe(T0 - 2 * DOBA + 40 * MIN);
    await korygujSesje(s.z, { sesjaId: a.wartosc.sesjaId, startMs: T0 - 3 * DOBA, koniecMs: T0 - 3 * DOBA + MIN });
    expect(await ostatnia(s)).toBe(T0 - 2 * DOBA + 40 * MIN);
  });

  test('zapomniany stoper zamknięty przy starcie (P-072 (7a)) → ostatnia praca = start + SESJA_MAKS_H', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Szalik', T0 - 10 * DOBA), sesja('s1', 'p1', T0)]);
    s.zegar.ustaw(T0 + 20 * GODZ);
    await uruchomDane({ ...s.z, migruj: (b) => migruj(b) });
    expect(await ostatnia(s)).toBe(T0 + 8 * GODZ);
  });
});

describe('P-195 Q4a: kopia z narzędziem i rozmiarem', () => {
  test('szydełko 6,5 mm → kopia szydełko 6,5 mm; bez notatki, terminu i stanu', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Torba', T0, { notatka: 'x' }), czesc('c1', 'p1', 'Dno'), ...licznik('l1', 'c1', 12),
      ["UPDATE projekt SET narzedzie = 'szydelko', drut_mm = 6.5, termin_dzien = '2026-12-01' WHERE id = 'p1'", []]]);
    const k = await zrobPonownie(s.z, { projektId: 'p1', szablonNazwy: '{{nazwa}} {{n}}' });
    if (!k.ok) throw new Error(k.powod);
    const [p] = await s.baza.all<Record<string, unknown>>('SELECT narzedzie, drut_mm, notatka, termin_dzien FROM projekt WHERE id = ?', [k.wartosc.projektId]);
    expect(p).toEqual({ narzedzie: 'szydelko', drut_mm: 6.5, notatka: '', termin_dzien: null });
  });
});
