// Kopia ratunkowa i przywracanie (ADR-0020, ADR-0019): surowa kopia trzech plików, sprawdzenie kopii osobnym połączeniem,
// przywrócenie przez kolejkę portu (nigdy podmiana pliku), kopia bieżącej bazy przed przywróceniem.
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22).
// Wyjątek nazwany kontroli KOPIA-SAMEGO-DB (e4-przekazanie „Do 12”): surowa kopia kopiuje zawsze oczko.db razem z -wal i -shm.
import type { Powod, Wynik } from '../domena/bledy';
import type { Katalogi, PortBazy, SygnalCzasu, Zegar } from '../domena/porty';
import { WERSJA_SCHEMATU } from '../konfiguracja';
import { otworzPortExpo } from './baza/adapter-expo';
import { powodBledu } from './baza/bledy-sqlite';
import { kopiaBazy } from './baza/kopia';
import { zastapZKopii } from './baza/przeniesienie';
import { PLIK_BAZY } from './baza/sciezki';
import { APPLICATION_ID, migruj } from './migracje/migruj';
import { istniejePlik, kopiuj, polacz, usunPlik, utworzKatalog } from './pliki/system';
import { liczbaLubNull, tekst, wiersze } from './repozytoria/wiersze';

const PLIKI_BAZY = [PLIK_BAZY, `${PLIK_BAZY}-wal`, `${PLIK_BAZY}-shm`];
const zapisNieudany = (e: unknown): { ok: false; powod: Powod } => ({ ok: false, powod: powodBledu(e) === 'brak_miejsca' ? 'brak_miejsca' : 'zapis' });

/** ADR-0020 (1): oczko.db, -wal, -shm do `kopie/ratunkowe-<czas>/`, zanim cokolwiek otworzy bazę. */
export async function surowaKopia(katalogDanych: string, katalogKopii: string, zegar: Zegar): Promise<Wynik<{ katalog: string; pliki: string[] }>> {
  const obecne = PLIKI_BAZY.filter((n) => istniejePlik(polacz(katalogDanych, n)));
  if (!obecne.includes(PLIK_BAZY)) return { ok: false, powod: 'bledne_dane' }; // nie ma czego ratować
  const katalog = polacz(katalogKopii, `ratunkowe-${zegar.teraz().ms}`);
  try {
    utworzKatalog(katalog);
    for (const n of obecne) kopiuj(polacz(katalogDanych, n), polacz(katalog, n));
    return { ok: true, wartosc: { katalog, pliki: obecne } };
  } catch (e) {
    return zapisNieudany(e);
  }
}

/** ADR-0020 (2), (5): integrity_check, foreign_key_check, user_version w zakresie, application_id Oczka; nowsza → `wersja_nowsza`, obca/pusta → `bledne_dane`. */
export async function sprawdzKopie(sciezka: string): Promise<Wynik<{ wersjaSchematu: number }>> {
  if (!istniejePlik(sciezka)) return { ok: false, powod: 'bledne_dane' };
  let port: Awaited<ReturnType<typeof otworzPortExpo>> | null = null;
  try {
    port = otworzPortExpo(sciezka, { tylkoOdczyt: true });
    const [v] = await wiersze(port.all('PRAGMA user_version'), 'sprawdzKopie');
    const wersja = v ? liczbaLubNull(v, 'user_version') : null;
    if (wersja === null) return { ok: false, powod: 'bledne_dane' };
    if (wersja > WERSJA_SCHEMATU) return { ok: false, powod: 'wersja_nowsza' };
    // Plik innej aplikacji (inny identyfikator) = obca baza, przed kontrolą tabel (dane.md „Identyfikator pliku bazy”, P-124 Q5a).
    const [a] = await wiersze(port.all('PRAGMA application_id'), 'sprawdzKopie');
    if (!a || liczbaLubNull(a, 'application_id') !== APPLICATION_ID) return { ok: false, powod: 'bledne_dane' };
    const tabele = (await wiersze(port.all("SELECT name FROM sqlite_schema WHERE type = 'table'"), 'sprawdzKopie')).map((r) => tekst(r, 'name'));
    if (wersja < 1 || !['projekt', 'licznik', 'zdarzenie'].every((t) => tabele.includes(t))) return { ok: false, powod: 'bledne_dane' }; // obca albo pusta baza
    const [integralnosc] = await wiersze(port.all('PRAGMA integrity_check'), 'sprawdzKopie');
    if (!integralnosc || tekst(integralnosc, 'integrity_check') !== 'ok') return { ok: false, powod: 'uszkodzony' };
    if ((await port.all('PRAGMA foreign_key_check')).length) return { ok: false, powod: 'uszkodzony' };
    return { ok: true, wartosc: { wersjaSchematu: wersja } };
  } catch (e) {
    return { ok: false, powod: powodBledu(e) === 'uszkodzony' ? 'bledne_dane' : powodBledu(e) }; // plik obcy (nie SQLite) = dane spoza Oczka
  } finally {
    await port?.zamknij();
  }
}

/** Kopia w starszym schemacie: migrowana na kopii roboczej (oryginał kopii nietknięty), potem przenoszona; ta sama ścieżka co aktualizacja. */
async function kopiaWBiezacymSchemacie(sciezka: string, wersja: number, katalogi: Katalogi, ms: number): Promise<Wynik<{ sciezka: string; robocza: boolean }>> {
  if (wersja === WERSJA_SCHEMATU) return { ok: true, wartosc: { sciezka, robocza: false } };
  const robocza = polacz(katalogi.tymczasowy, `przywracanie-${ms}.db`);
  utworzKatalog(katalogi.tymczasowy);
  kopiuj(sciezka, robocza);
  const port = otworzPortExpo(robocza);
  try {
    const m = await migruj(port, { katalogKopii: katalogi.tymczasowy }); // kopia przed przebudową obok kopii roboczej (N12-08, dane.md)
    return m.ok ? { ok: true, wartosc: { sciezka: robocza, robocza: true } } : m;
  } finally {
    await port.zamknij();
  }
}

/** ADR-0020 (5): sprawdzKopie → kopia bieżącej bazy do `katalogi.kopie` → dane z kopii do bazy głównej przez kolejkę (bez podmiany pliku). */
/** `sygnal`: czas w tle (ADR-0002 (7)); wołający trzyma całość w jednej pozycji kolejki (przypadek użycia `przywrocKopie`, ADR-0020 (5′)). */
export async function przywrocZKopii(z: { baza: PortBazy; zegar: Zegar; katalogi: Katalogi }, sciezka: string, sygnal?: SygnalCzasu): Promise<Wynik<{ kopiaPrzed: string }>> {
  const s = await sprawdzKopie(sciezka);
  if (!s.ok) return s;
  const ms = z.zegar.teraz().ms;
  const kopiaPrzed = polacz(z.katalogi.kopie, `przed-przywroceniem-${ms}.db`);
  const k = await kopiaBazy(z.baza, kopiaPrzed);
  if (!k.ok) return k;
  let robocza: string | null = null;
  try {
    const c = await kopiaWBiezacymSchemacie(sciezka, s.wartosc.wersjaSchematu, z.katalogi, ms);
    if (!c.ok) return c;
    if (c.wartosc.robocza) robocza = c.wartosc.sciezka;
    await zastapZKopii(z.baza, c.wartosc.sciezka, sygnal); // jedna transakcja: błąd w trakcie zostawia bieżącą bazę bez zmian
    return { ok: true, wartosc: { kopiaPrzed } };
  } catch (e) {
    return zapisNieudany(e);
  } finally {
    if (robocza) usunPlik(robocza);
  }
}
