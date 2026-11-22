// „Zapisz kopię danych” w trybie awaryjnym (ADR-0019, ADR-0020 (3); P-203): archiwum bez migracji, oryginał bez zmian także przy niepustym WAL.
// Zamknięcie ostatniego połączenia robi checkpoint WAL i zmienia bajty `.db` (eksperyment 07 n12-11-wal-checkpoint.mjs; test kopia-awaryjna),
// więc połączenie trybu awaryjnego nie jest zamykane — jedno na ekran, sprząta je koniec procesu (SIGKILL/zamknięcie nie robi checkpointu).
// Odstępstwo nazwane od P-203 „tylko do odczytu”: expo-sqlite 57 otwiera bazę `sqlite3_open` bez flag (ios/SQLiteModule.swift:114), a
// `PRAGMA query_only` blokuje VACUUM INTO („attempt to write a readonly database”, eksperyment 08). Tańsza kontrola: połączenie nie wykonuje
// zapisów (archiwum: odczyty i VACUUM INTO do nowego pliku) i nie jest zamykane.
import type { Katalogi, Licznosci, Zegar } from '../domena/porty';
import { otworzPortExpo } from '../dane/baza/adapter-expo';
import { utworzArchiwum } from '../dane/archiwum';
import { utworzMagazyn } from '../dane/pliki/magazyn';
import { powodBledu } from '../dane/baza/bledy-sqlite';

export function kopiaAwaryjna(o: { sciezkaBazy: string; pliki: string; zegar: Zegar; katalogi: Katalogi }) {
  let baza: ReturnType<typeof otworzPortExpo> | null = null;
  return {
    /** `brak_miejsca` (M1-011): archiwum nie zmieściło się (baza + pliki magazynu); ekran próbuje wtedy ZIP-a surowej kopii (ADR-0020 (3)), a komunikat (4) dopiero, gdy i on zawiedzie; `null`: baza się nie otwiera. */
    async zapisz(): Promise<{ sciezka: string; licznosci: Licznosci } | 'brak_miejsca' | null> {
      try {
        baza ??= otworzPortExpo(o.sciezkaBazy);
        const a = utworzArchiwum({ baza, magazyn: utworzMagazyn(o.pliki), zegar: o.zegar, katalogi: o.katalogi, migruj: () => Promise.resolve({ ok: true, wartosc: { z: 0, do: 0 } }), aplikacja: 'oczko' });
        const w = await a.zapisz(o.katalogi.tymczasowy);
        if (!w.ok) return w.powod === 'brak_miejsca' ? 'brak_miejsca' : null;
        return { sciezka: w.wartosc.sciezka, licznosci: w.wartosc.manifest.licznosci };
      } catch (e) {
        if (powodBledu(e) === 'brak_miejsca') return 'brak_miejsca';
        return null; // baza się nie otwiera → ZIP surowej kopii (zipSurowej)
      }
    },
  };
}
