// Stoper sesji projektu (F-21, F-11, F-51; BR-PRJ-008, BR-PRJ-013; moduly.md „Sesja stopera”, P-072). Przejścia liczy maszyna domeny
// (`przejdzSesje`); tu odczyt wiersza, zapis jednej sesji w kolejce i błąd typowany. Jedna otwarta sesja na bazę (indeks UNIQUE
// `sesja_jedna_otwarta`) — drugi start to `niedozwolone_przejscie`, bez zamykania cudzej sesji po cichu. Sygnatury 08 (przegląd 05).
import type { Wynik } from '../domena/bledy';
import { czasSesjiMs, przejdzSesje, type Sesja, type ZdarzenieSesji } from '../domena/maszyny/sesja';
import type { PortBazy } from '../domena/porty';
import { SESJA_MAKS_H } from '../konfiguracja';
import { liczba, liczbaLubNull, tekst, wiersze } from '../dane/repozytoria/wiersze';
import { wKolejce } from './kolejka';
import { blad, operacjaZapisu } from './zapis';
import type { Zaleznosci } from './zaleznosci';

export type SesjaNaEkranie = {
  id: string; projektId: string; stan: 'trwa' | 'wstrzymana' | 'zakonczona'; startMs: number; koniecMs: number | null; przerwyMs: number;
  wstrzymanoMs: number | null; czasMs: number; skorygowano: boolean; doKorekty: boolean;
};

const KOLUMNY = 'id, projekt_id, stan, start_ms, koniec_ms, przerwy_ms, wstrzymano_ms, skorygowano, do_korekty';
function naEkranie(r: Record<string, unknown>): SesjaNaEkranie {
  const st = tekst(r, 'stan');
  const stan: SesjaNaEkranie['stan'] = st === 'trwa' ? 'trwa' : st === 'wstrzymana' ? 'wstrzymana' : 'zakonczona'; // CHECK schematu: trzy wartości
  const s: Sesja = { stan, startMs: liczba(r, 'start_ms'), koniecMs: liczbaLubNull(r, 'koniec_ms'), przerwyMs: liczba(r, 'przerwy_ms'),
    wstrzymanoMs: liczbaLubNull(r, 'wstrzymano_ms'), skorygowano: liczba(r, 'skorygowano') === 1, doSprawdzenia: liczba(r, 'do_korekty') === 1 };
  return { id: tekst(r, 'id'), projektId: tekst(r, 'projekt_id'), stan, startMs: s.startMs, koniecMs: s.koniecMs, przerwyMs: s.przerwyMs,
    wstrzymanoMs: s.wstrzymanoMs, czasMs: czasSesjiMs(s), skorygowano: s.skorygowano, doKorekty: s.doSprawdzenia };
}
async function sesja(tx: PortBazy, id: string): Promise<SesjaNaEkranie | null> {
  const [r] = await wiersze(tx.all(`SELECT ${KOLUMNY} FROM sesja WHERE id = ?`, [id]), 'sesja');
  return r ? naEkranie(r) : null;
}

/** Start stopera (F-21, U-4 „jednym stuknięciem”): projekt w toku poza koszem; inna otwarta sesja → `niedozwolone_przejscie`. */
export function startSesji(z: Zaleznosci, w: { projektId: string }): Promise<Wynik<{ sesjaId: string }>> {
  return operacjaZapisu(z, 'startSesji', async (tx, teraz, chwila) => {
    const [p] = await wiersze(tx.all('SELECT stan, usunieto_ms FROM projekt WHERE id = ?', [w.projektId]), 'startSesji');
    if (!p) return blad('bledne_dane');
    if (liczbaLubNull(p, 'usunieto_ms') !== null || tekst(p, 'stan') !== 'w_toku') return blad('niedozwolone_przejscie');
    const [o] = await wiersze(tx.all("SELECT count(*) AS n FROM sesja WHERE stan IN ('trwa', 'wstrzymana')"), 'startSesji');
    if (o && liczba(o, 'n') > 0) return blad('niedozwolone_przejscie');
    const sesjaId = z.id.nowy();
    await tx.run("INSERT INTO sesja (id, projekt_id, stan, start_ms, strefa, dzien, zmieniono_ms) VALUES (?, ?, 'trwa', ?, ?, ?, ?)", [sesjaId, w.projektId, teraz, chwila.strefa, chwila.dzien, teraz]);
    return { ok: true, wartosc: { sesjaId } };
  });
}

/** Ostatnia praca = później z ostatniej zmiany licznika i końca sesji stopera (BR-PRJ-016, P-195 Q5); wcześniejszy koniec po korekcie nie cofa. */
export async function pracaDoKonca(tx: PortBazy, sesjaId: string, koniecMs: number): Promise<void> {
  await tx.run('UPDATE projekt SET ostatnia_praca_ms = max(ostatnia_praca_ms, ?) WHERE id = (SELECT projekt_id FROM sesja WHERE id = ?)', [koniecMs, sesjaId]);
}
/** Przejście maszyny na zapisanej sesji (UPDATE jednej sesji); `po` mapuje nowy stan na wynik przypadku użycia. */
function przejscie<T>(z: Zaleznosci, operacja: string, id: string, zd: ZdarzenieSesji, po: (s: Sesja) => T): Promise<Wynik<T>> {
  return operacjaZapisu(z, operacja, async (tx, teraz) => {
    const s = await sesja(tx, id);
    if (!s) return blad('bledne_dane');
    const n = przejdzSesje({ stan: s.stan, startMs: s.startMs, koniecMs: s.koniecMs, przerwyMs: s.przerwyMs, wstrzymanoMs: s.wstrzymanoMs, skorygowano: s.skorygowano, doSprawdzenia: s.doKorekty },
      zd, teraz, SESJA_MAKS_H);
    if (!n.ok) return n;
    const x = n.wartosc;
    await tx.run('UPDATE sesja SET stan = ?, start_ms = ?, wstrzymano_ms = ?, przerwy_ms = ?, koniec_ms = ?, skorygowano = ?, do_korekty = ?, zmieniono_ms = ? WHERE id = ?',
      [x.stan, x.startMs, x.wstrzymanoMs, x.przerwyMs, x.koniecMs, x.skorygowano ? 1 : 0, zd.rodzaj === 'koryguj' ? 0 : x.doSprawdzenia ? 1 : 0, teraz, id]); // korekta rozstrzyga „do sprawdzenia”
    if (x.koniecMs !== null) await pracaDoKonca(tx, id, x.koniecMs);
    return { ok: true, wartosc: po(x) };
  });
}
export const wstrzymajSesje = (z: Zaleznosci, w: { sesjaId: string }): Promise<Wynik<void>> => przejscie(z, 'wstrzymajSesje', w.sesjaId, { rodzaj: 'wstrzymaj' }, () => undefined);
export const wznowSesje = (z: Zaleznosci, w: { sesjaId: string }): Promise<Wynik<void>> => przejscie(z, 'wznowSesje', w.sesjaId, { rodzaj: 'wznow' }, () => undefined);
export const zakonczSesje = (z: Zaleznosci, w: { sesjaId: string }): Promise<Wynik<{ czasMs: number }>> =>
  przejscie(z, 'zakonczSesje', w.sesjaId, { rodzaj: 'zakoncz' }, (s) => ({ czasMs: czasSesjiMs(s) }));
/** Korekta zakończonej sesji (BR-PRJ-013/S3: koniec ≥ start); zdejmuje oznaczenie zapomnianego stopera (`do_korekty`, P-072 (7a)). */
export const korygujSesje = (z: Zaleznosci, w: { sesjaId: string; startMs: number; koniecMs: number }): Promise<Wynik<void>> =>
  przejscie(z, 'korygujSesje', w.sesjaId, { rodzaj: 'koryguj', startMs: w.startMs, koniecMs: w.koniecMs }, () => undefined);

/** Otwarta sesja (trwa albo wstrzymana) albo brak — stan stopera na ekranie licznika. */
export function otwartaSesja(z: Zaleznosci): Promise<Wynik<SesjaNaEkranie | null>> {
  return operacjaZapisu(z, 'otwartaSesja', async (tx) => {
    const [r] = await wiersze(tx.all(`SELECT ${KOLUMNY} FROM sesja WHERE stan IN ('trwa', 'wstrzymana') LIMIT 1`), 'otwartaSesja');
    return { ok: true, wartosc: r ? naEkranie(r) : null };
  });
}
/** Sesje projektu od najnowszej (lista do korekty, F-51). */
export function sesjeProjektu(z: Zaleznosci, w: { projektId: string }): Promise<Wynik<SesjaNaEkranie[]>> {
  return operacjaZapisu(z, 'sesjeProjektu', async (tx) => ({
    ok: true, wartosc: (await wiersze(tx.all(`SELECT ${KOLUMNY} FROM sesja WHERE projekt_id = ? ORDER BY start_ms DESC, id`, [w.projektId]), 'sesjeProjektu')).map(naEkranie),
  }));
}
/** P-191 P3a „Stop and start here”: otwarta sesja innego projektu kończy się (jak `zakonczSesje`) i nowa zaczyna — jedna transakcja. */
export function przelaczSesje(z: Zaleznosci, w: { projektId: string }): Promise<Wynik<{ sesjaId: string }>> {
  return operacjaZapisu(z, 'przelaczSesje', async (tx, teraz, chwila) => {
    const [p] = await wiersze(tx.all('SELECT stan, usunieto_ms FROM projekt WHERE id = ?', [w.projektId]), 'przelaczSesje');
    if (!p) return blad('bledne_dane');
    if (liczbaLubNull(p, 'usunieto_ms') !== null || tekst(p, 'stan') !== 'w_toku') return blad('niedozwolone_przejscie');
    for (const r of await wiersze(tx.all(`SELECT ${KOLUMNY} FROM sesja WHERE stan IN ('trwa', 'wstrzymana')`), 'przelaczSesje')) {
      const o = naEkranie(r);
      const n = przejdzSesje({ stan: o.stan, startMs: o.startMs, koniecMs: o.koniecMs, przerwyMs: o.przerwyMs, wstrzymanoMs: o.wstrzymanoMs, skorygowano: o.skorygowano, doSprawdzenia: o.doKorekty },
        { rodzaj: 'zakoncz' }, teraz, SESJA_MAKS_H);
      if (!n.ok) return n;
      await tx.run('UPDATE sesja SET stan = ?, wstrzymano_ms = ?, przerwy_ms = ?, koniec_ms = ?, zmieniono_ms = ? WHERE id = ?', [n.wartosc.stan, n.wartosc.wstrzymanoMs, n.wartosc.przerwyMs, n.wartosc.koniecMs, teraz, o.id]);
      if (n.wartosc.koniecMs !== null) await pracaDoKonca(tx, o.id, n.wartosc.koniecMs);
    }
    const sesjaId = z.id.nowy();
    await tx.run("INSERT INTO sesja (id, projekt_id, stan, start_ms, strefa, dzien, zmieniono_ms) VALUES (?, ?, 'trwa', ?, ?, ?, ?)", [sesjaId, w.projektId, teraz, chwila.strefa, chwila.dzien, teraz]);
    return { ok: true, wartosc: { sesjaId } };
  });
}

/** P-191 P5a: sesja projektu zamknięta automatycznie (`do_korekty`), po której końcu nie było +1 na licznikach projektu; brak → null. */
export function sesjaDoSprawdzenia(z: Zaleznosci, w: { projektId: string }): Promise<Wynik<{ sesjaId: string; godziny: number } | null>> {
  return wKolejce(z.baza, async () => {
    const [r] = await wiersze(z.baza.all(
      `SELECT s.id FROM sesja s WHERE s.projekt_id = ? AND s.do_korekty = 1 AND s.koniec_ms IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM zdarzenie e JOIN licznik l ON l.id = e.licznik_id JOIN czesc c ON c.id = l.czesc_id
                          WHERE c.projekt_id = s.projekt_id AND e.rodzaj = 'plus' AND e.czas_ms > s.koniec_ms)
       ORDER BY s.koniec_ms DESC, s.id LIMIT 1`, [w.projektId]), 'sesjaDoSprawdzenia');
    return { ok: true, wartosc: r ? { sesjaId: tekst(r, 'id'), godziny: SESJA_MAKS_H } : null };
  });
}
