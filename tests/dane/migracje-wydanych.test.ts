// Kontrola roli 05 nr 3 (strategia §10): migracja z kopii każdej wydanej wersji schematu (`tests/bazy/vN.db`, dane.md „Polityka migracji”).
// Od wersji 1.0.0 (P-306 B, P-519) zbiór = [v1.db] z `scripts/dane/generuj-wzorzec-v1.mjs` (treść i powtarzalność: tests/dane/wzorzec-v1.test.ts).
// Gałąź „brak wydanych wersji” zostaje dla zbioru pustego: jawnie nazwany test, nie zaliczenie po cichu (R-074).
// Wersja 0.1.0 poza testem (P-070, ADR-0015). Wzorzec vN.db kopiowany razem z -wal/-shm, jeśli są (R-075).
import { copyFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { utworzPortNode } from '../../src/dane/baza/adapter-node';
import { migruj } from '../../src/dane/migracje/migruj';
import { WERSJA_SCHEMATU } from '../../src/konfiguracja';
import { KORZEN, licznosciPliku } from './pomocnicze/dane-wejsciowe';
import { katalogTymczasowy, licznosci, migawka } from './pomocnicze/srodowisko';

const KATALOG_WZORCOW = join(KORZEN, 'tests/bazy');
const wzorce = (k: string) => (existsSync(k) ? readdirSync(k).filter((n) => /^v\d+\.db$/.test(n)).sort() : []);
const wersjaAplikacji = (): string => JSON.parse(readFileSync(join(KORZEN, 'app.json'), 'utf8')).expo.version;
const poWydaniu = (w: string) => Number(w.split('.')[0]) >= 1;

/** Strażnik zbioru wzorców (zasada 2: pusty katalog = błąd). null = zbiór poprawny; tekst = powód błędu. */
export function sprawdzZbiorWzorcow(katalog: string, wersja: string): string | null {
  if (existsSync(katalog) && wzorce(katalog).length === 0) return `${katalog} istnieje, ale nie ma żadnego vN.db — wzorzec wydania nie powstał (R-074)`;
  if (!existsSync(katalog) && poWydaniu(wersja)) return `wersja aplikacji ${wersja} ≥ 1.0, a brak ${katalog} z vN.db (dane.md: wzorzec przy każdym wydaniu schematu)`;
  return null;
}

describe('kontrola 05-3: migracja z kopii każdej wydanej wersji', () => {
  test('[ZIELONY-OK: strażnik zbioru działa przed kodem aplikacji] R-074 Z07-15: tests/bazy pusty albo brak wzorców po 1.0 → błąd z komunikatem', () => {
    expect(sprawdzZbiorWzorcow(KATALOG_WZORCOW, wersjaAplikacji())).toBeNull();
    // pułapki strażnika: pusty katalog i wersja ≥ 1.0 bez katalogu muszą dawać błąd
    expect(sprawdzZbiorWzorcow(katalogTymczasowy('oczko-bazy-pusty-'), '0.9.0')).toMatch(/nie ma żadnego vN\.db/);
    expect(sprawdzZbiorWzorcow(join(katalogTymczasowy(), 'brak'), '1.0.0')).toMatch(/≥ 1\.0/);
  });

  const lista = wzorce(KATALOG_WZORCOW);
  if (lista.length === 0) {
    test(`NFR-DAN-001 R-074: brak wydanych wersji (przed 1.0, aplikacja ${wersjaAplikacji()}) — zbiór vN.db = [], pusta baza migruje do WERSJA_SCHEMATU`, async () => {
      expect(lista).toEqual([]);
      const baza = utworzPortNode(join(katalogTymczasowy(), 'oczko.db'));
      expect(await migruj(baza)).toEqual({ ok: true, wartosc: { z: 0, do: WERSJA_SCHEMATU } });
    });
  }
  for (const n of lista) {
    test(`NFR-DAN-001 BR-DAN-003/S1 ${n}: kopia → migruj → liczności każdej tabeli, integrity_check, foreign_key_check, user_version, drugi przebieg bez zmian`, async () => {
      const k = katalogTymczasowy();
      const kopia = join(k, 'oczko.db');
      for (const sufiks of ['', '-wal', '-shm']) if (existsSync(join(KATALOG_WZORCOW, n + sufiks))) copyFileSync(join(KATALOG_WZORCOW, n + sufiks), kopia + sufiks);
      const przed = licznosciPliku(kopia);
      const v = Number(n.slice(1, -3));
      const baza = utworzPortNode(kopia);
      expect(await migruj(baza)).toEqual({ ok: true, wartosc: { z: v, do: WERSJA_SCHEMATU } });
      const po = await licznosci(baza);
      for (const t of Object.keys(przed)) expect({ t, n: po[t] }).toEqual({ t, n: przed[t] });
      expect(await baza.all('PRAGMA integrity_check')).toEqual([{ integrity_check: 'ok' }]);
      expect(await baza.all('PRAGMA foreign_key_check')).toEqual([]);
      expect(await baza.all('PRAGMA user_version')).toEqual([{ user_version: WERSJA_SCHEMATU }]);
      const m = await migawka(baza);
      expect(await migruj(baza)).toEqual({ ok: true, wartosc: { z: WERSJA_SCHEMATU, do: WERSJA_SCHEMATU } });
      expect(await migawka(baza)).toBe(m);
    });
  }
});
