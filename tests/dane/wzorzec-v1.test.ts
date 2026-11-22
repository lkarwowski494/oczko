// Wzorzec wydanej bazy schematu 1 (`tests/bazy/v1.db` + `-wal` + `-shm`; P-306 (B), P-496, P-519; dane.md „Polityka migracji”, R-074, R-075).
// Migrację z kopii sprawdza tests/dane/migracje-wydanych.test.ts; tu: wzorzec jest powtarzalny (skrypt w repo), ma schemat runnera
// aplikacji (wydanej migracji nie zmieniamy), pokrywa każdą tabelę i przypadki brzegowe, a ostatnie zapisy leżą tylko w `-wal`.
// Wzorca nie otwieramy w miejscu: zamknięcie połączenia przepisałoby `-wal` do pliku. Zawsze kopia trzech plików.
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { utworzPortNode } from '../../src/dane/baza/adapter-node';
import { migruj } from '../../src/dane/migracje/migruj';
import { KORZEN } from './pomocnicze/dane-wejsciowe';
import { katalogTymczasowy } from './pomocnicze/srodowisko';

const WZORZEC = join(KORZEN, 'tests/bazy');
const GENERATOR = join(KORZEN, 'scripts/dane/generuj-wzorzec-v1.mjs');
const POLECENIE = 'node --experimental-strip-types --no-warnings scripts/dane/generuj-wzorzec-v1.mjs';
const DOBA = 86_400_000;

/** Kopia `v1.db` (+ `-wal`, `-shm`, jeśli są) do nowego katalogu; `bezWal` = sam plik główny (stan po ostatnim checkpoincie). */
function kopia(katalog: string, bezWal = false): string {
  const cel = join(katalogTymczasowy('oczko-v1-'), 'v1.db');
  for (const s of bezWal ? [''] : ['', '-wal', '-shm']) if (existsSync(join(katalog, 'v1.db' + s))) copyFileSync(join(katalog, 'v1.db' + s), cel + s);
  return cel;
}
function zapytaj<T = Record<string, unknown>>(sciezka: string, sql: string): T[] {
  const db = new DatabaseSync(sciezka, { readOnly: true });
  try { return db.prepare(sql).all() as T[]; } finally { db.close(); }
}
const tabele = (s: string) => zapytaj<{ name: string }>(s, "SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map((r) => r.name);
/** Schemat i znaczniki pliku: każdy obiekt sqlite_schema (posortowany), user_version, application_id. */
const schemat = (s: string) => JSON.stringify({
  obiekty: zapytaj(s, "SELECT type, name, tbl_name, sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name"),
  user_version: zapytaj(s, 'PRAGMA user_version'),
  application_id: zapytaj(s, 'PRAGMA application_id'),
});
/** Pełny zrzut: schemat + każdy wiersz każdej tabeli (BLOB jako hex), posortowany. */
const zrzut = (s: string) => JSON.stringify({
  schemat: schemat(s),
  dane: tabele(s).map((t) => [t, zapytaj(s, `SELECT * FROM ${t}`).map((r) => JSON.stringify(r, (_k, v: unknown) => (v instanceof Uint8Array ? Buffer.from(v).toString('hex') : v))).sort()]),
});

describe('wzorzec tests/bazy/v1.db (P-306 B, R-074, R-075)', () => {
  const wzorzec = kopia(WZORZEC);

  test(`powtarzalny: ${POLECENIE} <katalog> daje tę samą treść (schemat, wiersze) co plik w repo`, () => {
    const k = katalogTymczasowy('oczko-v1-gen-');
    execFileSync(process.execPath, ['--experimental-strip-types', '--no-warnings', GENERATOR, k], { stdio: 'pipe' });
    expect(zrzut(kopia(k))).toBe(zrzut(wzorzec));
  });

  test('schemat = migracje 1..1 runnera aplikacji (wydanej migracji nie zmieniamy; zmiana 0001.sql przed wydaniem w App Store = ponowne generowanie)', async () => {
    const k = join(katalogTymczasowy('oczko-v1-runner-'), 'oczko.db');
    const baza = utworzPortNode(k);
    expect(await migruj(baza)).toEqual({ ok: true, wartosc: { z: 0, do: 1 } });
    baza.zamknij();
    expect(schemat(wzorzec)).toBe(schemat(k));
    expect(zapytaj(wzorzec, 'PRAGMA user_version')).toEqual([{ user_version: 1 }]);
  });

  test('każda tabela schematu v1 ma wiersze (pełny schemat, nie pusta baza)', () => {
    const puste = tabele(wzorzec).filter((t) => zapytaj<{ n: number }>(wzorzec, `SELECT count(*) AS n FROM ${t}`)[0].n === 0);
    expect(puste).toEqual([]);
  });

  test('R-075: ostatnie zapisy tylko w -wal (wariant migawki kopii urządzenia) — plik główny bez nich, kopia trzech plików z nimi', () => {
    expect(statSync(join(WZORZEC, 'v1.db-wal')).size).toBeGreaterThan(0);
    const SQL = "SELECT count(*) AS n FROM poczekalnia WHERE id = 'wal-0000-4000-8000-000000000001'";
    expect(zapytaj(wzorzec, SQL)).toEqual([{ n: 1 }]);
    expect(zapytaj(kopia(WZORZEC, true), SQL)).toEqual([{ n: 0 }]);
  });

  test('przypadki brzegowe dane.md: puste napisy, NULL, wiersze podrzędne, konflikt licznika, kosz 29 i 31 dni, poczekalnia, długie teksty, znaki spoza ASCII, liczniki maksymalne', () => {
    const jeden = (sql: string) => Object.values(zapytaj(wzorzec, sql)[0]);
    const [teraz] = jeden("SELECT CAST(json_extract(wartosc, '$') AS INTEGER) FROM ustawienie WHERE klucz = 'ostatni_start_ms'") as number[];
    expect(jeden("SELECT count(*) FROM projekt WHERE notatka = '' AND drut_mm IS NULL AND termin_dzien IS NULL AND film_adres IS NULL")[0]).toBeGreaterThan(0);
    expect(jeden('SELECT count(*) FROM licznik l JOIN czesc c ON c.id = l.czesc_id JOIN zdarzenie z ON z.licznik_id = l.id')[0]).toBeGreaterThan(0);
    expect(jeden('SELECT count(*) FROM licznik WHERE konflikt = 1')[0]).toBe(1);
    expect(jeden(`SELECT count(*) FROM projekt WHERE usunieto_ms = ${teraz - 29 * DOBA}`)[0]).toBe(1);
    expect(jeden(`SELECT count(*) FROM projekt WHERE usunieto_ms = ${teraz - 31 * DOBA}`)[0]).toBe(1);
    expect(jeden(`SELECT count(*) FROM wloczka WHERE usunieto_ms IN (${teraz - 29 * DOBA}, ${teraz - 31 * DOBA})`)[0]).toBe(2);
    expect(jeden("SELECT group_concat(DISTINCT powod) FROM (SELECT powod FROM poczekalnia ORDER BY powod)")[0]).toBe('brak_encji,brak_rodzica,nowsza_wersja');
    expect(jeden('SELECT max(length(notatka)) FROM projekt')[0]).toBeGreaterThanOrEqual(100_000);
    expect(jeden(`SELECT max(wartosc) FROM licznik`)[0]).toBe(Number.MAX_SAFE_INTEGER);
    expect(jeden("SELECT count(*) FROM projekt WHERE nazwa = 'Ząb 🧶 毛衣 سترة Ελληνικά é 👩‍👩‍👧 «\"'';--»'")[0]).toBe(1);
    expect(jeden('SELECT group_concat(DISTINCT zrodlo) FROM (SELECT zrodlo FROM zdarzenie ORDER BY zrodlo)')[0]).toBe('aplikacja,ekran_blokady,import,synchronizacja,zegarek');
    expect(jeden('SELECT group_concat(DISTINCT rodzaj) FROM (SELECT rodzaj FROM zdarzenie ORDER BY rodzaj)')[0]).toBe('cofniecie,minus,plus,rozstrzygniecie,wpisanie,zerowanie');
  });
});
