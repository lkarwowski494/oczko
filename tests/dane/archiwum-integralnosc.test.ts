// N12-12 (P-197): archiwum `.oczko` sprawdza kopię VACUUM INTO (integrity_check i foreign_key_check, osobne połączenie tylko do odczytu)
// przed spakowaniem i udostępnieniem — uszkodzona kopia nie trafia do użytkownika jako „kopia zapasowa”. Bez kontroli wersji (tryb awaryjny).
import { readdirSync } from 'node:fs';
import { utworzArchiwum } from '../../src/dane/archiwum';
import { migruj } from '../../src/dane/migracje/migruj';
import { eksportuj } from '../../src/przypadki-uzycia/archiwum';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { czasWTle, przygotuj, wykonaj } from './pomocnicze/srodowisko';

async function srodowisko() {
  const s = await przygotuj();
  const archiwum = utworzArchiwum({ baza: s.baza, magazyn: s.magazyn, zegar: s.zegar, katalogi: s.z.katalogi, migruj: (b) => migruj(b), aplikacja: '1.0.0 (test)' });
  return { ...s, z: { ...s.z, archiwum, czasWTle } };
}

test('N12-12: naruszenie klucza obcego w bazie → eksport „uszkodzony”, w katalogu docelowym nie zostaje żaden plik', async () => {
  const s = await srodowisko();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 2)]);
  await s.baza.run('PRAGMA foreign_keys = OFF');
  await s.baza.run("INSERT INTO czesc (id, projekt_id, nazwa, kolejnosc, zmieniono_ms) VALUES ('sierota', 'brak', 'X', 1, 0)");
  await s.baza.run('PRAGMA foreign_keys = ON');
  const w = await eksportuj(s.z, { katalogDocelowy: s.z.katalogi.tymczasowy });
  expect(w).toEqual({ ok: false, powod: 'uszkodzony' });
  expect(readdirSync(s.z.katalogi.tymczasowy).filter((n) => n.endsWith('.oczko') || n.endsWith('.db'))).toEqual([]);
});

test('N12-12: zdrowa baza → eksport jak dotąd', async () => {
  const s = await srodowisko();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 2)]);
  const w = await eksportuj(s.z, { katalogDocelowy: s.z.katalogi.tymczasowy });
  expect(w.ok).toBe(true);
});
