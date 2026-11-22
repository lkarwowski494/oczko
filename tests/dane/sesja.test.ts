// Grupa B partii 5 (F-21, F-11, F-51; BR-PRJ-008, BR-PRJ-013; moduly.md „Sesja stopera”, P-072): przypadki użycia stopera na bazie aplikacji.
import { czasSesjiMs } from '../../src/domena/maszyny/sesja';
import { korygujSesje, otwartaSesja, sesjeProjektu, startSesji, wstrzymajSesje, wznowSesje, zakonczSesje } from '../../src/przypadki-uzycia/sesja';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { MIN, T0, jeden, licznosci, przygotuj, wykonaj } from './pomocnicze/srodowisko';

async function s0() {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Tył'), ...licznik('l1', 'c1', 3), projekt('p2', 'Szal')]);
  return s;
}

describe('stoper sesji', () => {
  test('BR-PRJ-008/S1: start 20:00, pauza 10 min, stop 20:45 → 35 min; dzień i strefa z chwili startu', async () => {
    const s = await s0();
    const st = await startSesji(s.z, { projektId: 'p1' });
    expect(st.ok).toBe(true);
    if (!st.ok) return;
    const id = st.wartosc.sesjaId;
    expect(await jeden(s.baza, 'SELECT stan, start_ms, strefa, dzien FROM sesja WHERE id = ?', [id])).toEqual({ stan: 'trwa', start_ms: T0, strefa: 'Europe/Warsaw', dzien: '2026-10-22' });
    s.zegar.przesun(20 * MIN);
    expect((await wstrzymajSesje(s.z, { sesjaId: id })).ok).toBe(true);
    s.zegar.przesun(10 * MIN);
    expect((await wznowSesje(s.z, { sesjaId: id })).ok).toBe(true);
    s.zegar.przesun(15 * MIN);
    expect(await zakonczSesje(s.z, { sesjaId: id })).toEqual({ ok: true, wartosc: { czasMs: 35 * MIN } });
    expect(await jeden(s.baza, 'SELECT stan, koniec_ms, przerwy_ms FROM sesja WHERE id = ?', [id])).toEqual({ stan: 'zakonczona', koniec_ms: T0 + 45 * MIN, przerwy_ms: 10 * MIN });
  });

  test('jedna otwarta sesja (UNIQUE): drugi start, także w innym projekcie → niedozwolone_przejscie, nic nie zapisane', async () => {
    const s = await s0();
    expect((await startSesji(s.z, { projektId: 'p1' })).ok).toBe(true);
    const przed = await licznosci(s.baza);
    expect(await startSesji(s.z, { projektId: 'p2' })).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
    expect(await licznosci(s.baza)).toEqual(przed);
  });

  test('niedozwolone przejścia z maszyny: wznów trwającej, wstrzymaj zakończonej; projekt w koszu albo nieistniejący → błąd', async () => {
    const s = await s0();
    await wykonaj(s.baza, [projekt('p3', 'Kosz', T0, { usunieto: T0 })]);
    const st = await startSesji(s.z, { projektId: 'p1' });
    if (!st.ok) throw new Error('start');
    expect(await wznowSesje(s.z, { sesjaId: st.wartosc.sesjaId })).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
    await zakonczSesje(s.z, { sesjaId: st.wartosc.sesjaId });
    expect(await wstrzymajSesje(s.z, { sesjaId: st.wartosc.sesjaId })).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
    expect(await startSesji(s.z, { projektId: 'p3' })).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
    expect(await startSesji(s.z, { projektId: 'brak' })).toEqual({ ok: false, powod: 'bledne_dane' });
  });

  test('BR-PRJ-013 (F-51): korekta zakończonej sesji — koniec przed startem → bledne_dane; poprawna zdejmuje „do sprawdzenia”', async () => {
    const s = await s0();
    await wykonaj(s.baza, [["INSERT INTO sesja (id, projekt_id, stan, start_ms, koniec_ms, do_korekty, strefa, dzien) VALUES ('z1', 'p1', 'zakonczona', ?, ?, 1, 'Europe/Warsaw', '2026-10-22')", [T0, T0 + 600 * MIN]]]);
    expect(await korygujSesje(s.z, { sesjaId: 'z1', startMs: T0 + 60 * MIN, koniecMs: T0 })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect((await korygujSesje(s.z, { sesjaId: 'z1', startMs: T0, koniecMs: T0 + 90 * MIN })).ok).toBe(true);
    expect(await jeden(s.baza, "SELECT start_ms, koniec_ms, skorygowano, do_korekty FROM sesja WHERE id = 'z1'")).toEqual({ start_ms: T0, koniec_ms: T0 + 90 * MIN, skorygowano: 1, do_korekty: 0 });
  });

  test('odczyt: otwarta sesja (z czasem przerw) i sesje projektu od najnowszej z czasem = koniec − start − przerwy', async () => {
    const s = await s0();
    expect(await otwartaSesja(s.z)).toEqual({ ok: true, wartosc: null });
    await wykonaj(s.baza, [["INSERT INTO sesja (id, projekt_id, stan, start_ms, koniec_ms, przerwy_ms, strefa, dzien) VALUES ('z1', 'p1', 'zakonczona', ?, ?, ?, 'Europe/Warsaw', '2026-10-21')", [T0 - 1440 * MIN, T0 - 1380 * MIN, 5 * MIN]]]);
    const st = await startSesji(s.z, { projektId: 'p1' });
    const o = await otwartaSesja(s.z);
    expect(o.ok && o.wartosc && [o.wartosc.projektId, o.wartosc.stan, o.wartosc.startMs, st.ok && st.wartosc.sesjaId === o.wartosc.id]).toEqual(['p1', 'trwa', T0, true]);
    const l = await sesjeProjektu(s.z, { projektId: 'p1' });
    expect(l.ok && l.wartosc.map((x) => [x.stan, x.czasMs])).toEqual([['trwa', 0], ['zakonczona', 55 * MIN]]);
    expect(czasSesjiMs({ stan: 'zakonczona', startMs: 0, koniecMs: 60 * MIN, przerwyMs: 5 * MIN, wstrzymanoMs: null, skorygowano: false, doSprawdzenia: false })).toBe(55 * MIN);
  });
});
