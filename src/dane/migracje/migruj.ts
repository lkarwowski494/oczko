// Runner migracji (dane.md „Polityka migracji”): user_version, jedna transakcja na migrację, foreign_keys = OFF przed BEGIN tylko
// przy przebudowie, foreign_key_check pusty przed COMMIT, kopia `przed-migracja-<wersja>.db` przed przebudową, baza nowsza odrzucona.
// sygnatura: propozycja 07, zatwierdzona w fix 05 2026-10-25 (Z07-22).
// Migracje aplikacji: src/dane/migracje/NNNN.sql (0001.sql = docs/architektura/schemat.sql v1) → sql.ts; `dodatkowe` tylko dla testów runnera.
import type { Wynik } from '../../domena/bledy';
import type { Migracja, PortBazy } from '../../domena/porty';
import { WERSJA_SCHEMATU } from '../../konfiguracja';
import { kopiaBazy } from '../baza/kopia';
import { instrukcjeSql } from '../baza/parametry';
import { powodBledu } from '../baza/bledy-sqlite';
import { MIGRACJE } from './sql';

/** Identyfikator pliku bazy Oczka (PRAGMA application_id w 0001.sql, dane.md „Identyfikator pliku bazy”, P-124 Q5a). */
export const APPLICATION_ID = 1331919467; // 0x4F637A6B

/** `teraz`: czas w nazwie kopii przed przebudową (ms), żeby ponowna próba po nieudanej migracji nie trafiała na istniejący plik (rola 12 E2). */
export type OpcjeMigracji = { dodatkowe?: readonly Migracja[]; katalogKopii?: string; teraz?: () => number };

async function wersjaBazy(port: PortBazy): Promise<number> {
  const [w] = await port.all<unknown>('PRAGMA user_version');
  if (typeof w === 'object' && w !== null && 'user_version' in w && typeof w.user_version === 'number' && Number.isInteger(w.user_version)) return w.user_version;
  throw new Error('migruj: PRAGMA user_version bez liczby całkowitej');
}

/** Błąd migracji → ROLLBACK całości, `powod: 'zapis'` (albo `brak_miejsca`); baza nowsza → `powod: 'wersja_nowsza'`, bez zmian. */
export async function migruj(port: PortBazy, opcje: OpcjeMigracji = {}): Promise<Wynik<{ z: number; do: number }>> {
  const ostatniaAplikacji = MIGRACJE[MIGRACJE.length - 1]?.wersja;
  if (ostatniaAplikacji !== WERSJA_SCHEMATU) throw new Error(`migruj: ostatnia migracja ${String(ostatniaAplikacji)} ≠ WERSJA_SCHEMATU ${WERSJA_SCHEMATU}`);
  const wszystkie = [...MIGRACJE, ...(opcje.dodatkowe ?? [])].sort((a, b) => a.wersja - b.wersja);
  const docelowa = wszystkie[wszystkie.length - 1].wersja;
  let z: number;
  try {
    z = await wersjaBazy(port);
  } catch (e) {
    return { ok: false, powod: powodBledu(e) };
  }
  if (z > docelowa) return { ok: false, powod: 'wersja_nowsza' };
  for (const m of wszystkie.filter((x) => x.wersja > z)) {
    if (!Number.isInteger(m.wersja) || m.wersja < 1) throw new Error(`migruj: zła wersja migracji ${m.wersja}`);
    const instrukcje = instrukcjeSql(m.sql);
    try {
      if (m.przebudowa) {
        if (!opcje.katalogKopii) return { ok: false, powod: 'zapis' }; // przebudowa bez kopii przed nią nie rusza (dane.md)
        const kopia = await kopiaBazy(port, `${opcje.katalogKopii}/przed-migracja-${m.wersja}-${(opcje.teraz ?? Date.now)()}.db`);
        if (!kopia.ok) return kopia;
        await port.run('PRAGMA foreign_keys = OFF'); // przed BEGIN: w transakcji pragma nic nie robi (eksperyment B, E0)
      }
      try {
        await port.transakcja(async (tx) => {
          for (const s of instrukcje) await tx.run(s);
          if (m.przebudowa) {
            const zle = await tx.all('PRAGMA foreign_key_check');
            if (zle.length) throw new Error(`migruj ${m.wersja}: foreign_key_check zwrócił ${zle.length} wierszy`);
          }
          await tx.run(`PRAGMA user_version = ${m.wersja}`);
        });
      } finally {
        if (m.przebudowa) await port.run('PRAGMA foreign_keys = ON');
      }
    } catch (e) {
      const powod = powodBledu(e);
      return { ok: false, powod: powod === 'brak_miejsca' ? 'brak_miejsca' : 'zapis' };
    }
  }
  return { ok: true, wartosc: { z, do: Math.max(z, docelowa) } };
}
