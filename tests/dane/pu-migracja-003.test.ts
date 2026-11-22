// PU-003 (katalog przypadków użycia, „Instalacja i pierwszy start”): kopia bazy wydanej 1.0.0 (tests/bazy/v1.db, wzorzec z docs/jakosc/migracje-wydane.json)
// otwarta nowym kodem (migruj) zachowuje liczności projektów, liczników i zdarzeń oraz wartości liczników, a stary plik 0.1.0 obok zostaje nietknięty (P-070).
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { utworzPortNode } from '../../src/dane/baza/adapter-node';
import { sciezkiDanych } from '../../src/dane/baza/sciezki';
import { migruj } from '../../src/dane/migracje/migruj';
import { WERSJA_SCHEMATU } from '../../src/konfiguracja';
import { KORZEN, czytajBaze } from './pomocnicze/dane-wejsciowe';
import { katalogTymczasowy, sha256Pliku } from './pomocnicze/srodowisko';

const odczyt = (sciezka: string) => ({
  projekty: czytajBaze<{ n: number }>(sciezka, 'SELECT count(*) n FROM projekt')[0].n,
  liczniki: czytajBaze<{ n: number }>(sciezka, 'SELECT count(*) n FROM licznik')[0].n,
  zdarzenia: czytajBaze<{ n: number }>(sciezka, 'SELECT count(*) n FROM zdarzenie')[0].n,
  wartosci: czytajBaze<{ id: string; wartosc: number }>(sciezka, 'SELECT id, wartosc FROM licznik ORDER BY id').map((r) => ({ ...r })),
});

test('PU-003: kopia bazy 1.0.0 → migruj → te same liczności projektów, liczników i zdarzeń oraz wartości liczników; plik 0.1.0 nietknięty', async () => {
  const lib = join(katalogTymczasowy(), 'Library');
  const stary = join(lib, 'SQLite', 'oczko.db'); // „0.1.0”: inna, nieznana nowej wersji struktura (P-070, ADR-0015)
  mkdirSync(dirname(stary), { recursive: true });
  const db = new DatabaseSync(stary);
  db.exec("CREATE TABLE projects (id INTEGER PRIMARY KEY, name TEXT); INSERT INTO projects (name) VALUES ('Sweter 0.1.0');");
  db.close();
  const shaStarego = sha256Pliku(stary);

  const nowa = sciezkiDanych(lib).baza; // baza wydana 1.0.0 skopiowana na miejsce, gdzie nowy kod ją otworzy
  mkdirSync(dirname(nowa), { recursive: true });
  for (const sufiks of ['', '-wal', '-shm']) if (existsSync(join(KORZEN, 'tests/bazy/v1.db' + sufiks))) copyFileSync(join(KORZEN, 'tests/bazy/v1.db' + sufiks), nowa + sufiks);
  const przed = odczyt(nowa);
  expect(przed.projekty).toBeGreaterThan(0); // wzorzec ma dane: porównanie nie jest puste
  expect(przed.liczniki).toBeGreaterThan(0);
  expect(przed.zdarzenia).toBeGreaterThan(0);

  const baza = utworzPortNode(nowa);
  expect(await migruj(baza)).toEqual({ ok: true, wartosc: { z: 1, do: WERSJA_SCHEMATU } });
  expect(await baza.all('PRAGMA integrity_check')).toEqual([{ integrity_check: 'ok' }]);
  const po = {
    projekty: (await baza.all<{ n: number }>('SELECT count(*) n FROM projekt'))[0].n,
    liczniki: (await baza.all<{ n: number }>('SELECT count(*) n FROM licznik'))[0].n,
    zdarzenia: (await baza.all<{ n: number }>('SELECT count(*) n FROM zdarzenie'))[0].n,
    wartosci: (await baza.all<{ id: string; wartosc: number }>('SELECT id, wartosc FROM licznik ORDER BY id')).map((r) => ({ ...r })),
  };
  expect(po).toEqual(przed);
  expect(sha256Pliku(stary)).toBe(shaStarego);
});
