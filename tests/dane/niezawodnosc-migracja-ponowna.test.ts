// Rola 12 E2 (test oczekujący dla 08): ponowna migracja z przebudową po nieudanej próbie (ADR-0019 „Kopia przed migracją z przebudową”,
// ADR-0021 „poprawka nowym buildem”, dane.md „Polityka migracji”). Dziś kopia ma stałą nazwę `przed-migracja-<wersja>.db`, a `kopiaBazy`
// odrzuca istniejący cel, więc po pierwszej nieudanej próbie migracja tej wersji nie rusza już nigdy — także w buildzie z poprawką.
// Wyrocznia: ADR-0021 (poprawka nowym buildem musi móc zmigrować bazę) i zasada wspólna 10 (kopia sprzed pierwszej próby nietknięta).
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { migruj } from '../../src/dane/migracje/migruj';
import { WERSJA_SCHEMATU } from '../../src/konfiguracja';
import { czytajBaze, wloczka } from './pomocnicze/dane-wejsciowe';
import { jeden, licznosci, przygotuj, sha256Pliku, wykonaj } from './pomocnicze/srodowisko';

// Przebudowa tabeli wloczka (12 kroków sqlite.org/lang_altertable.html §7): wersja z błędem i wersja z poprawką.
const NOWA = `CREATE TABLE wloczka_nowa (id TEXT PRIMARY KEY NOT NULL, nazwa TEXT NOT NULL CHECK (length(nazwa) > 0), producent TEXT NOT NULL DEFAULT '',
  sklad TEXT NOT NULL DEFAULT '', kolor TEXT NOT NULL DEFAULT '', waga_motka_g REAL, dlugosc_motka_m REAL, motki REAL NOT NULL DEFAULT 0,
  pielegnacja TEXT NOT NULL DEFAULT '', notatka TEXT NOT NULL DEFAULT '', zmieniono_ms INTEGER NOT NULL, usunieto_ms INTEGER) STRICT;`;
const PRZENIES = `INSERT INTO wloczka_nowa SELECT id, nazwa, producent, sklad, kolor, waga_motka_g, dlugosc_motka_m, motki, pielegnacja, notatka, zmieniono_ms, usunieto_ms FROM wloczka;
  DROP TABLE wloczka; ALTER TABLE wloczka_nowa RENAME TO wloczka;`;
const Z_BLEDEM = `${NOWA} INSERT INTO wloczka_nowa (id, nazwa, zmieniono_ms) VALUES ('kolizja', '', 0); ${PRZENIES}`; // CHECK → ROLLBACK
const POPRAWIONA = `${NOWA} ${PRZENIES}`;

test('P-080 ADR-0021: migracja z przebudową nieudana w wersji N, poprawka w buildzie N+1 → migracja przechodzi, kopia sprzed pierwszej próby nietknięta', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, [wloczka('y1', 'Merino'), wloczka('y2', 'Alpaka')]);
  const przed = await licznosci(s.baza);
  const v = WERSJA_SCHEMATU + 1;
  const opcje = { katalogKopii: s.z.katalogi.kopie };

  expect(await migruj(s.baza, { ...opcje, dodatkowe: [{ wersja: v, sql: Z_BLEDEM, przebudowa: true }] })).toEqual({ ok: false, powod: 'zapis' });
  const pierwsza = readdirSync(s.z.katalogi.kopie).filter((n) => n.startsWith(`przed-migracja-${v}`));
  expect(pierwsza).toHaveLength(1);
  const shaPierwszej = sha256Pliku(join(s.z.katalogi.kopie, pierwsza[0]));

  // Build z poprawką (ADR-0021): ta sama wersja schematu, poprawiony SQL.
  expect(await migruj(s.baza, { ...opcje, dodatkowe: [{ wersja: v, sql: POPRAWIONA, przebudowa: true }] })).toEqual({ ok: true, wartosc: { z: WERSJA_SCHEMATU, do: v } });
  expect(await jeden(s.baza, 'PRAGMA user_version')).toEqual({ user_version: v });
  expect(await licznosci(s.baza)).toEqual(przed);
  expect(sha256Pliku(join(s.z.katalogi.kopie, pierwsza[0]))).toBe(shaPierwszej);
  expect(czytajBaze(join(s.z.katalogi.kopie, pierwsza[0]), 'PRAGMA user_version')).toEqual([{ user_version: WERSJA_SCHEMATU }]);
});
