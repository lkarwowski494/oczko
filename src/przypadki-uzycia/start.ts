// Start i powrót na pierwszy plan (ADR-0008, ADR-0015, ADR-0019, P-072 (7a), Z07-11).
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22).
import type { Wynik } from '../domena/bledy';
import { przejdzSesje, type Sesja } from '../domena/maszyny/sesja';
import { SESJA_MAKS_H } from '../konfiguracja';
import { zapiszUstawienie } from '../dane/repozytoria/ustawienia';
import { liczba, liczbaLubNull, tekst, wiersze } from '../dane/repozytoria/wiersze';
import { scalDziennikWKolejce } from './dziennik';
import { pracaDoKonca } from './sesja';
import { sprzatnijKoszWKolejce, sprzatnijSierotyMagazynu } from './kosz';
import { wKolejce } from './kolejka';
import { wTransakcji } from './zapis';
import type { Zaleznosci, ZaleznosciDziennika, ZaleznosciStartu } from './zaleznosci';

// potwierdzone: id linii zegarka do `Zegarek.potwierdz` przed `odswiezEkranBlokady` (ADR-0009, 2026-10-26 pkt 3; woła kompozycja aplikacji).
export type WynikStartuDanych = { migracja: { z: number; do: number }; scalono: number; potwierdzone: string[]; sprzatnieto: number; domknieteSesje: number };

/** Zapomniany stoper (P-072 (7a)): sesja „trwa” od co najmniej SESJA_MAKS_H kończy się na start + SESJA_MAKS_H z `do_korekty = 1`. */
function domknijSesje(z: ZaleznosciStartu): Promise<Wynik<number>> {
  return wTransakcji(z, 'domknijSesje', async (tx, teraz) => {
    let n = 0;
    for (const r of await wiersze(tx.all("SELECT id, start_ms, wstrzymano_ms, przerwy_ms FROM sesja WHERE stan = 'trwa'"), 'domknijSesje')) {
      const s: Sesja = { stan: 'trwa', startMs: liczba(r, 'start_ms'), wstrzymanoMs: liczbaLubNull(r, 'wstrzymano_ms'), przerwyMs: liczba(r, 'przerwy_ms'), koniecMs: null, skorygowano: false, doSprawdzenia: false };
      const w = przejdzSesje(s, { rodzaj: 'start_aplikacji' }, teraz, SESJA_MAKS_H);
      if (!w.ok || w.wartosc.stan !== 'zakonczona') continue;
      await tx.run("UPDATE sesja SET stan = 'zakonczona', koniec_ms = ?, do_korekty = 1, zmieniono_ms = ? WHERE id = ?", [w.wartosc.koniecMs, teraz, tekst(r, 'id')]);
      if (w.wartosc.koniecMs !== null) await pracaDoKonca(tx, tekst(r, 'id'), w.wartosc.koniecMs); // P-195 Q5
      n += 1;
    }
    return { ok: true, wartosc: n };
  });
}

/** Kolejność: migruj → scalDziennik → domknięcie zapomnianych sesji (SESJA_MAKS_H) → sprzatnijKosz → sieroty magazynu (M1-023); na końcu `ostatni_start_ms` (P-110 Q5a). */
export function uruchomDane(z: ZaleznosciStartu): Promise<Wynik<WynikStartuDanych>> {
  return wKolejce(z.baza, async () => {
    const migracja = await z.migruj(z.baza);
    if (!migracja.ok) return migracja; // baza nowsza albo błąd migracji: dalej nic (ekran awaryjny, ADR-0019)
    const scalono = await scalDziennikWKolejce(z);
    if (!scalono.ok) return scalono;
    const sesje = await domknijSesje(z);
    if (!sesje.ok) return sesje;
    const kosz = await sprzatnijKoszWKolejce(z); // czyta ostatni_start_ms poprzedniego startu, zanim zapiszemy bieżący
    if (!kosz.ok) return kosz;
    await sprzatnijSierotyMagazynu(z); // M1-023: pliki bez wiersza `plik` (po „zastąp”, przywróceniu kopii, nieudanym imporcie); błąd nie blokuje startu
    const start = await wTransakcji(z, 'ostatniStart', async (tx, teraz) => {
      await zapiszUstawienie(tx, 'ostatni_start_ms', teraz, teraz);
      return { ok: true, wartosc: undefined };
    });
    if (!start.ok) return start;
    const k = kosz.wartosc;
    return { ok: true, wartosc: { migracja: migracja.wartosc, scalono: scalono.wartosc.scalono, potwierdzone: scalono.wartosc.potwierdzone, sprzatnieto: k.projekty + k.czesci + k.liczniki, domknieteSesje: sesje.wartosc } };
  });
}

/** `AppState → active`: scalenie dziennika w kolejce przed pierwszym zapisem po powrocie (Z07-11, R-020). */
export function naPierwszyPlan(z: ZaleznosciDziennika): Promise<Wynik<{ scalono: number; potwierdzone: string[] }>> {
  // Pozycja kolejki powstaje synchronicznie w chwili wywołania, więc zapis z ekranu wywołany później jej nie wyprzedzi (ADR-0008 (2)).
  return wKolejce(z.baza, async () => {
    const w = await scalDziennikWKolejce(z);
    return w.ok ? { ok: true, wartosc: { scalono: w.wartosc.scalono, potwierdzone: w.wartosc.potwierdzone } } : w;
  });
}

/** `AppState → background` (R-091, e3-tlo-bledy-prywatnosc-wydajnosc.md §1): po zapisach z kolejki checkpoint WAL do pliku bazy (kopia urządzenia). */
export function przyTle(z: Pick<Zaleznosci, 'baza'>): Promise<void> {
  return wKolejce(z.baza, async () => { await z.baza.all('PRAGMA wal_checkpoint(TRUNCATE)'); });
}
