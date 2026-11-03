// Eksport i import `.oczko` (ADR-0004, maszyna importu moduly.md, P-047, P-091 (6a)); pod CzasWTle.chron (import: sprawdzenie i zapis osobno, dialog wyboru poza nim).
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22).
import type { Wynik } from '../domena/bledy';
import { przejdzImport, type StanImportu, type ZdarzenieImportu } from '../domena/maszyny/import';
import type { Manifest, TrybImportu, WynikImportu } from '../domena/porty';
import { scalDziennikWKolejce } from './dziennik';
import { wKolejce } from './kolejka';
import type { ZaleznosciArchiwum } from './zaleznosci';
import { stanBazy } from '../dane/repozytoria/icloud';

/** Najpierw scalenie dziennika +1 (R-063), sprawdzenie miejsca (ZAPAS_MIEJSCA_EKSPORTU), potem archiwum; eksport nie woła strażnika (KP-02). */
export function eksportuj(z: ZaleznosciArchiwum, w: { katalogDocelowy: string }): Promise<Wynik<{ sciezka: string; manifest: Manifest }>> {
  return z.czasWTle.chron('eksport', () => wKolejce(z.baza, async () => {
    const d = await scalDziennikWKolejce(z);
    if (!d.ok) return d;
    return z.archiwum.zapisz(w.katalogDocelowy);
  }));
}

/** Maszyna importu (moduly.md): przejście spoza tabeli to błąd programisty, nie stan danych. */
function dalej(s: StanImportu, zd: ZdarzenieImportu): StanImportu {
  const n = przejdzImport(s, zd);
  if (n === 'niedozwolone') throw new Error(`import: przejście ${s} --${zd}--> spoza tabeli`);
  return n;
}

/**
 * sprawdzanie → wybór (scal / zastąp / anuluj) → kopia przed (tylko zastąp) → wczytywanie; przed wczytywaniem baza bez zmian.
 * Sprawdzenie i wybór poza kolejką zapisów (pytanie do użytkowniczki nie wstrzymuje +1); kopia przed i wczytanie jako jedna pozycja kolejki.
 * Błąd przed wczytywaniem → odrzucony (niepełna kopia przed usunięta, P-118 W3); błąd wczytania „zastąp” → wycofany: przywrócenie kopii przed.
 */
export async function importuj(
  z: ZaleznosciArchiwum,
  w: { sciezka: string; wybierz: (m: Manifest) => Promise<TrybImportu | 'anuluj'> },
): Promise<Wynik<WynikImportu>> {
  let stan: StanImportu = 'sprawdzanie';
  const a = await z.czasWTle.chron('import-sprawdzenie', () => z.archiwum.sprawdz(w.sciezka));
  if (!a.ok) { stan = dalej(stan, 'sprawdzono_zle'); return a; }
  stan = dalej(stan, 'sprawdzono_ok');
  const tryb = await w.wybierz(a.wartosc.manifest); // poza czasem w tle: dialog może trwać dłużej niż czas przyznany przez system
  if (tryb === 'anuluj') return { ok: true, wartosc: { tryb: 'anulowano', kopiaPrzed: null, licznosci: a.wartosc.manifest.licznosci } };
  stan = dalej(stan, 'wybrano');
  return z.czasWTle.chron('import', (sygnal) => wKolejce(z.baza, async (): Promise<Wynik<WynikImportu>> => {
    let kopiaPrzed: string | null = null;
    // ADR-0005: „zastąp” tylko przy wyłączonym iCloud — usunięcia przy aktywnych wyzwalaczach poszłyby do iCloud (partia 7, icloud.zastap_wylacz).
    if (tryb === 'zastap' && (await stanBazy(z.baza)).wlaczona) return { ok: false, powod: 'niedozwolone_przejscie' };
    if (tryb === 'zastap') {
      const k = await z.archiwum.kopiaPrzed();
      if (!k.ok) { dalej(stan, 'blad'); return k; }
      kopiaPrzed = k.wartosc.sciezka;
    }
    stan = dalej(stan, 'kopia_gotowa');
    const wynik = await z.archiwum.wczytaj(a.wartosc, tryb, sygnal); // jedna transakcja pod ochroną czasu w tle (ADR-0002 (7))
    if (wynik.ok) { dalej(stan, 'wczytano'); return { ok: true, wartosc: { tryb, kopiaPrzed, licznosci: wynik.wartosc.licznosci } }; }
    dalej(stan, 'blad'); // wycofany: „scal” to jedna transakcja (ROLLBACK), „zastąp” też — kopia przed zostaje do ręcznego przywrócenia (30 dni)
    return wynik;
  }));
}
