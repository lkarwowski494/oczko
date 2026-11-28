// ZM-24 (U6, ADR-0036 „Potwierdzenie”, P-1097): zgodność wstecz zapisu „+2” przez iCloud. Urządzenie A zapisuje jedno stuknięcie „+2” tak,
// jak ma to robić 1.0.2 (dwa zdarzenia `plus` w jednej transakcji, ten sam `czas_ms`, łańcuch rodziców); urządzenie B ma dzisiejszy kod odbioru
// (schemat 1 jak w 1.0.1, 9275460e) → po odbiorze wartość +2 bez konfliktu i bez poczekalni. Rekord `Licznik` z nieznanym polem `krok`
// (przyszła synchronizacja kroku, K3) stosowany bez błędu: pole pominięte (`src/dane/repozytoria/icloud.ts:133`, ADR-0027 (3)).
// Zielony od razu: strażnik, że zapis wybrany w ADR-0036 jest czytany poprawnie przez kod sprzed 1.0.2 (bezpiecznik 2, P-1090 (4), nie zachodzi).
import type { PortBazy } from '../../src/domena/porty';
import { dodajRzad, utworzSzybkiLicznik } from '../../src/przypadki-uzycia/licznik';
import { sterownikSynchronizacji, type Sterownik } from '../../src/przypadki-uzycia/synchronizacja';
import { przygotuj, type Srodowisko } from './pomocnicze/srodowisko';
import { serwerIcloud, type SerwerTestowy, type UrzadzenieTestowe } from './pomocnicze/serwer-icloud';

type Urz = { s: Srodowisko; u: UrzadzenieTestowe; st: Sterownik };
async function urzadzenie(serwer: SerwerTestowy, nazwa: string, prefiks: string): Promise<Urz> {
  const s = await przygotuj({ urzadzenie: nazwa, prefiksId: prefiks });
  const u = serwer.urzadzenie();
  const st = sterownikSynchronizacji({ ...s.z, synchronizacja: u, magazyn: s.magazyn });
  await st.start();
  return { s, u, st };
}
const licznik = (b: PortBazy, id: string) => b.all<{ wartosc: number; konflikt: number }>('SELECT wartosc, konflikt FROM licznik WHERE id = ?', [id]);
const ile = async (b: PortBazy, sql: string) => (await b.all<{ n: number }>(sql))[0].n;

/** Stuknięcie „+2” zapisane jak w kontrakcie 08-A (ADR-0036 kontrakt TS pkt 1): dwa `plus`, rodzic drugiego = pierwszy, ten sam czas. */
async function plusDwa(b: PortBazy, licznikId: string, ids: [string, string], czasMs: number): Promise<void> {
  await b.transakcja(async (tx) => {
    const [l] = await tx.all<{ wartosc: number; glowa: string | null }>('SELECT wartosc, glowa FROM licznik WHERE id = ?', [licznikId]);
    const [z] = await tx.all<{ strefa: string; dzien: string; urzadzenie: string }>('SELECT strefa, dzien, urzadzenie FROM zdarzenie WHERE id = ?', [l.glowa]);
    let rodzic = l.glowa;
    for (const [i, id] of ids.entries()) {
      await tx.run('INSERT INTO zdarzenie (id, licznik_id, rodzaj, wartosc, wartosc_po, rodzice, cofa, zrodlo, urzadzenie, czas_ms, strefa, dzien) VALUES (?, ?, \'plus\', NULL, ?, ?, \'[]\', \'aplikacja\', ?, ?, ?, ?)',
        [id, licznikId, l.wartosc + i + 1, JSON.stringify(rodzic ? [rodzic] : []), z.urzadzenie, czasMs, z.strefa, z.dzien]);
      rodzic = id;
    }
    await tx.run('UPDATE licznik SET wartosc = ?, glowa = ? WHERE id = ?', [l.wartosc + 2, rodzic, licznikId]);
  });
}

describe('ZM-24 zgodność wstecz „+2” przez iCloud (ADR-0036)', () => {
  test('A: +1 ×2 i jedno „+2” (dwa plus, ten sam czas) → B (kod odbioru sprzed 1.0.2) po odbiorze: 4, bez konfliktu i poczekalni', async () => {
    const serwer = serwerIcloud();
    const a = await urzadzenie(serwer, 'iphone', 'a');
    const b = await urzadzenie(serwer, 'ipad', 'b');
    const w = await utworzSzybkiLicznik(a.s.z);
    if (!w.ok) throw new Error(w.powod);
    const l = w.wartosc.licznikId;
    await dodajRzad(a.s.z, { licznikId: l });
    await dodajRzad(a.s.z, { licznikId: l });
    await plusDwa(a.s.baza, l, ['a-plus2-1', 'a-plus2-2'], a.s.zegar.teraz().ms + 60_000);
    await a.st.wlacz();
    await b.st.wlacz();
    await b.u.dostarcz();
    expect(await licznik(b.s.baza, l)).toEqual([{ wartosc: 4, konflikt: 0 }]);
    expect(await ile(b.s.baza, 'SELECT count(*) AS n FROM poczekalnia')).toBe(0);
    expect(await ile(b.s.baza, "SELECT count(*) AS n FROM zdarzenie WHERE id LIKE 'a-plus2-%'")).toBe(2);
  });

  test('rekord Licznik z nieznanym polem `krok` (przyszła synchronizacja kroku, K3) stosowany na B bez błędu: pole pominięte, wartość z A', async () => {
    const serwer = serwerIcloud();
    const a = await urzadzenie(serwer, 'iphone', 'a');
    const b = await urzadzenie(serwer, 'ipad', 'b');
    const w = await utworzSzybkiLicznik(a.s.z);
    if (!w.ok) throw new Error(w.powod);
    const l = w.wartosc.licznikId;
    await dodajRzad(a.s.z, { licznikId: l });
    await a.st.wlacz();
    const rekordy = [...serwer.rekordy.values()].filter((r) => r.encja === 'licznik');
    expect(rekordy.length).toBe(1);
    for (const r of rekordy) r.pola.krok = 2;
    await b.st.wlacz();
    await b.u.dostarcz();
    expect(await licznik(b.s.baza, l)).toEqual([{ wartosc: 1, konflikt: 0 }]);
    expect(await ile(b.s.baza, 'SELECT count(*) AS n FROM poczekalnia')).toBe(0);
    expect(await ile(b.s.baza, "SELECT count(*) AS n FROM blad WHERE kod LIKE 'icloud%'")).toBe(0);
  });
});
