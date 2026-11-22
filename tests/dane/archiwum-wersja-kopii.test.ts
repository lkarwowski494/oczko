// 05 fix-6 (P-199, zgłoszenia roli 12 N12-07 i N12-08; dane.md „Kopie i eksport”): wersja schematu w manifeście archiwum i kopia przed migracją
// kopii roboczej przy przywracaniu. Obie luki są latentne przy jednej wersji schematu, więc N12-08 sprawdza tańsza kontrola źródła (zasada 7).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { utworzArchiwum } from '../../src/dane/archiwum';
import { migruj } from '../../src/dane/migracje/migruj';
import { WERSJA_SCHEMATU } from '../../src/konfiguracja';
import { katalogTymczasowy, przygotuj } from './pomocnicze/srodowisko';

test('N12-07: wersja_schematu w manifeście = PRAGMA user_version bazy w archiwum, nie stała aplikacji (tryb awaryjny: baza niezmigrowana)', async () => {
  const s = await przygotuj();
  const archiwum = utworzArchiwum({ baza: s.baza, magazyn: s.magazyn, zegar: s.zegar, katalogi: s.z.katalogi, migruj: (b) => migruj(b), aplikacja: '1.0.0 (test)' });
  await s.baza.run(`PRAGMA user_version = ${WERSJA_SCHEMATU - 1}`); // jak baza, której migracja nie przeszła (tryb awaryjny eksportuje bez migracji)
  const w = await archiwum.zapisz(katalogTymczasowy('oczko-eksport-'));
  if (!w.ok) throw new Error(w.powod);
  expect(w.wartosc.manifest.wersja_schematu).toBe(WERSJA_SCHEMATU - 1);
});

test('N12-08: każde bezpośrednie wywołanie migruj() w src/dane podaje katalogKopii (migracja z przebudową bez kopii odmawia, migruj.ts)', () => {
  for (const plik of ['src/dane/kopia-ratunkowa.ts', 'src/kompozycja/kontener.ts']) {
    const wywolania = [...readFileSync(join(__dirname, '../..', plik), 'utf8').matchAll(/\bmigruj\(([^)]*)\)/g)].map((m) => m[1]);
    expect(wywolania.length).toBeGreaterThan(0);
    for (const a of wywolania) expect([plik, a.includes('katalogKopii')]).toEqual([plik, true]);
  }
});
