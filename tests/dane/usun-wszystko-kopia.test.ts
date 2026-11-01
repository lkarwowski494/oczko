// N-05-1 (P-328, ADR-0028, zasada 10): „Delete all data” zawsze najpierw zapisuje pełną kopię (archiwum .oczko w Documents/Backup, jak Trening safetyBackup('reset')).
// Nieudana kopia przerywa usunięcie bez żadnej zmiany; kopię da się zaimportować z powrotem zwykłym importem.
import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { utworzArchiwum } from '../../src/dane/archiwum';
import { migruj } from '../../src/dane/migracje/migruj';
import { importuj } from '../../src/przypadki-uzycia/archiwum';
import { usunWszystkieDane } from '../../src/przypadki-uzycia/projekt';
import type { Manifest } from '../../src/przypadki-uzycia/porty-propozycja';
import { zycie } from './pomocnicze/dane-wejsciowe';
import { czasWTle, licznosci, migawka, przygotuj, wlozPlik, wykonaj } from './pomocnicze/srodowisko';

const POMIN = ['blad', 'ustawienie'];
async function srodowisko(kopiePrzed?: (katalog: string) => string) {
  const s = await przygotuj();
  const pliki = { pdf: wlozPlik(s.magazyn, Buffer.from('PDF-1.4 abc'), 'pdf'), rys: wlozPlik(s.magazyn, Buffer.from('PKDRAWING'), 'pkdrawing'), jpg: wlozPlik(s.magazyn, Buffer.from('JPEG-DANE!'), 'jpg') };
  await wykonaj(s.baza, zycie(pliki));
  const katalogi = kopiePrzed ? { ...s.z.katalogi, kopiePrzed: kopiePrzed(s.katalog) } : s.z.katalogi;
  const archiwum = utworzArchiwum({ baza: s.baza, magazyn: s.magazyn, zegar: s.zegar, katalogi, migruj: (b) => migruj(b), aplikacja: '1.0.0 (test)' });
  return { ...s, katalogi, za: { ...s.z, katalogi, archiwum, czasWTle } };
}
const szpieg = (odp: 'scal' | 'zastap') => ({ wybierz: async (_m: Manifest) => odp });

test('N-05-1: usunięcie zostawia kopię oczko-przed-usunieciem-<dzień>.oczko z danymi sprzed usunięcia, a baza jest pusta', async () => {
  const s = await srodowisko();
  const przed = await licznosci(s.baza);
  expect(await usunWszystkieDane(s.za)).toMatchObject({ ok: true });
  expect(readdirSync(s.katalogi.kopiePrzed)).toEqual(['oczko-przed-usunieciem-2026-10-22.oczko']);
  const kopia = await s.za.archiwum.sprawdz(join(s.katalogi.kopiePrzed, 'oczko-przed-usunieciem-2026-10-22.oczko'));
  if (!kopia.ok) throw new Error(kopia.powod);
  expect(kopia.wartosc.manifest.licznosci).toEqual(przed);
  expect((await licznosci(s.baza)).projekt).toBe(0);
});
test('N-05-1: kopię z usunięcia da się zaimportować (Replace) i dane wracają: liczności, migawka i pliki jak przed', async () => {
  const s = await srodowisko();
  const przed = await licznosci(s.baza);
  const migPrzed = await migawka(s.baza, POMIN);
  const plikiPrzed = readdirSync(s.magazyn.katalog).sort();
  expect(await usunWszystkieDane(s.za)).toMatchObject({ ok: true });
  expect(readdirSync(s.magazyn.katalog)).toEqual([]);
  const w = await importuj(s.za, { sciezka: join(s.katalogi.kopiePrzed, 'oczko-przed-usunieciem-2026-10-22.oczko'), wybierz: szpieg('zastap').wybierz });
  expect(w).toMatchObject({ ok: true });
  expect(await licznosci(s.baza)).toEqual(przed);
  expect(await migawka(s.baza, POMIN)).toBe(migPrzed);
  expect(readdirSync(s.magazyn.katalog).sort()).toEqual(plikiPrzed);
});
test('N-05-1: nie da się zapisać kopii → błąd z etapem „kopia”, nic nie usunięto (liczności, migawka i pliki bez zmian)', async () => {
  const s = await srodowisko((katalog) => { const plik = join(katalog, 'plik-zamiast-katalogu'); writeFileSync(plik, 'x'); return join(plik, 'Backup'); });
  const przed = await licznosci(s.baza);
  const migPrzed = await migawka(s.baza, POMIN);
  const plikiPrzed = readdirSync(s.magazyn.katalog).sort();
  const w = await usunWszystkieDane(s.za);
  expect(w).toMatchObject({ ok: false, etap: 'kopia' });
  expect(await licznosci(s.baza)).toEqual(przed);
  expect(await migawka(s.baza, POMIN)).toBe(migPrzed);
  expect(readdirSync(s.magazyn.katalog).sort()).toEqual(plikiPrzed);
  expect(s.magazyn.usuniete).toEqual([]);
});
