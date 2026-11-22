// M1-audytor-generalny-070 (09-lokalizacja-007, LOK-13; P-455 wariant a): ekran awaryjny mówi językiem wybranym w aplikacji, nie językiem systemu.
// Preferencja zostaje w `ustawienie.jezyk` (źródło prawdy), a jej lustro w pliku `jezyk.json` obok bazy (dane.md „Pliki stanu urządzenia poza bazą”)
// jest czytane przez `tAwaryjny()` bez SQLite. Prawdziwy kontener na prawdziwym dysku (jak l029-kompozycja.test.ts); telefon po angielsku.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { katalogTymczasowy } from '../dane/pomocnicze/srodowisko';

let mockBiblioteka = '';
jest.mock('../../src/dane/pliki/system', () => ({ ...jest.requireActual('../../src/dane/pliki/system'), katalogBiblioteki: () => mockBiblioteka }));
jest.mock('../../src/platforma/lokalizacja', () => ({ ...jest.requireActual<object>('../../src/platforma/lokalizacja'), tagiSystemowe: () => ['en-US'] }));
// Moduł Swift poza Node: pusty dziennik +1 i SHA-256 z node:crypto (jak skrot-natywny.test.ts); reszta kontenera prawdziwa.
jest.mock('../../modules/oczko-dziennik-plus', () => ({
  natywny: () => ({
    odczytajTekst: async () => '', skroc: async () => undefined, liveDostepne: () => false,
    sha256Pliku: async (s: string) => jest.requireActual<typeof import('node:crypto')>('node:crypto').createHash('sha256').update(jest.requireActual<typeof import('node:fs')>('node:fs').readFileSync(s)).digest('hex'),
    addListener: () => ({ remove: () => undefined }),
  }),
}));
jest.mock('../../modules/oczko-czas-w-tle', () => ({ natywny: () => ({ start: async () => '1', czyWygaslo: () => false, koniec: async () => undefined }) }));
/* eslint-disable @typescript-eslint/no-require-imports */
const { utworzKontener } = require('../../src/kompozycja/kontener') as typeof import('../../src/kompozycja/kontener');
const { tAwaryjny } = require('../../src/kompozycja/jezyk-awaryjny') as typeof import('../../src/kompozycja/jezyk-awaryjny');
const { usunWszystkieDane } = require('../../src/przypadki-uzycia/projekt') as typeof import('../../src/przypadki-uzycia/projekt');
const { uruchomDane } = require('../../src/przypadki-uzycia/start') as typeof import('../../src/przypadki-uzycia/start');
const { zLustremJezyka } = require('../../src/kompozycja/pliki-urzadzenia') as typeof import('../../src/kompozycja/pliki-urzadzenia');
/* eslint-enable @typescript-eslint/no-require-imports */

const PL = 'Spróbuj uruchomić normalnie';
const EN = 'Try starting normally';
const katalogDanych = () => join(mockBiblioteka, 'Application Support');
function swiezaInstalacja(): void {
  mockBiblioteka = join(katalogTymczasowy('oczko-m1-070-'), 'Library');
  mkdirSync(katalogDanych(), { recursive: true });
}
/** Start normalny: kontener (odczyt preferencji), potem dane startu z migracją (jak kompozycja licznika). */
async function kontener() {
  const k = await utworzKontener();
  if (!k.ok) throw new Error(`kontener: ${k.powod}`);
  const d = await uruchomDane(k.wartosc.z);
  if (!d.ok) throw new Error(`dane startu: ${d.powod}`);
  return k.wartosc;
}
/** Baza nieczytelna: nagłówek pliku nadpisany (SQLITE_NOTADB przy otwarciu). */
function zepsujBaze(): void {
  const plik = join(katalogDanych(), 'oczko.db');
  const b = readFileSync(plik);
  b.fill(0x41, 0, 100);
  writeFileSync(plik, b);
}

test('M1-070: preferencja „Polski” zapisana w aplikacji, baza nieczytelna → tAwaryjny() daje teksty pl', async () => {
  swiezaInstalacja();
  const k = await kontener();
  await k.j.ustawJezyk('pl');
  expect(k.j.t('awaryjny.sprobuj')).toBe(PL);
  await k.zamknij();
  zepsujBaze();
  expect((await utworzKontener()).ok).toBe(false); // baza naprawdę nieczytelna dla startu normalnego
  const t = await tAwaryjny();
  expect(t('awaryjny.sprobuj')).toBe(PL);
});

test('M1-070: odczyt preferencji z bazy rzuca → lustro bez zmian (uszkodzona baza nie kasuje wyboru); nieudany zapis do bazy → lustro bez zmian', async () => {
  swiezaInstalacja();
  const plik = join(katalogDanych(), 'jezyk.json');
  writeFileSync(plik, '{"jezyk":"pl"}');
  const zepsuty = zLustremJezyka({ odczytaj: async () => { throw new Error('SQLITE_CORRUPT'); }, zapisz: async () => { throw new Error('SQLITE_FULL'); } }, katalogDanych());
  await expect(zepsuty.odczytaj('jezyk')).rejects.toThrow('SQLITE_CORRUPT');
  await expect(zepsuty.zapisz('jezyk', 'de')).rejects.toThrow('SQLITE_FULL');
  expect(readFileSync(plik, 'utf8')).toBe('{"jezyk":"pl"}');
  expect((await tAwaryjny())('awaryjny.sprobuj')).toBe(PL);
});

/** Liczności wszystkich tabel, integrity_check i foreign_key_check na kopii trzech plików bazy (oryginał nietknięty). */
function stanKopii(): { licznosci: Record<string, number>; integrity: string; fk: number } {
  const kat = katalogTymczasowy('oczko-m1-070-kopia-');
  for (const n of ['oczko.db', 'oczko.db-wal', 'oczko.db-shm']) if (existsSync(join(katalogDanych(), n))) copyFileSync(join(katalogDanych(), n), join(kat, n));
  const db = new DatabaseSync(join(kat, 'oczko.db'));
  try {
    const tabele = (db.prepare("SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as { name: string }[]).map((r) => r.name);
    const licznosci = Object.fromEntries(tabele.map((t) => [t, Number((db.prepare(`SELECT count(*) AS n FROM "${t}"`).get() as { n: number }).n)]));
    const integrity = (db.prepare('PRAGMA integrity_check').all() as { integrity_check: string }[]).map((r) => r.integrity_check).join('; ');
    const fk = db.prepare('PRAGMA foreign_key_check').all().length;
    return { licznosci, integrity, fk };
  } finally {
    db.close();
  }
}

test('M1-070: dane — uzgodnienie lustra przy starcie nie pisze do bazy (liczności, integrity_check, foreign_key_check na kopii)', async () => {
  swiezaInstalacja();
  const k = await kontener();
  await k.j.ustawJezyk('pl');
  await k.zamknij();
  writeFileSync(join(katalogDanych(), 'jezyk.json'), 'nie-json'); // lustro do uzgodnienia przy następnym starcie
  const przed = stanKopii();
  const k2 = await utworzKontener(); // sam odczyt preferencji i uzgodnienie lustra (bez danych startu, które piszą `ostatni_start_ms`)
  if (!k2.ok) throw new Error('kontener');
  await k2.wartosc.zamknij();
  const po = stanKopii();
  console.log(`[M1-070 dane] przed: ${JSON.stringify(przed)}\n[M1-070 dane] po:    ${JSON.stringify(po)}`);
  expect(readFileSync(join(katalogDanych(), 'jezyk.json'), 'utf8')).toBe('{"jezyk":"pl"}');
  expect(po).toEqual(przed);
  expect(po.integrity).toBe('ok');
  expect(po.fk).toBe(0);
  expect(po.licznosci.ustawienie).toBeGreaterThan(0);
});

test('M1-070: „Same as phone” po „Polski” → ekran awaryjny znów w języku systemu', async () => {
  swiezaInstalacja();
  const k = await kontener();
  await k.j.ustawJezyk('pl');
  await k.j.ustawJezyk('auto');
  await k.zamknij();
  expect((await tAwaryjny())('awaryjny.sprobuj')).toBe(EN);
});

test('M1-070: uszkodzony albo obcy jezyk.json → język systemu, bez wyjątku', async () => {
  for (const zly of ['nie-json', '{"jezyk":5}', '{"jezyk":"xx-YY"}', 'null', '[]']) {
    swiezaInstalacja();
    writeFileSync(join(katalogDanych(), 'jezyk.json'), zly);
    const t = await tAwaryjny();
    expect(t('awaryjny.sprobuj')).toBe(EN);
  }
});

test('M1-070: [kontrola] brak pliku (świeża instalacja) → język systemu jak dotąd', async () => {
  swiezaInstalacja();
  expect((await tAwaryjny())('awaryjny.sprobuj')).toBe(EN);
});

test('M1-070: „Usuń wszystkie dane” zostawia jezyk.json (stan urządzenia jak stan-startu.json); następny start uzgadnia go z bazą', async () => {
  swiezaInstalacja();
  const k = await kontener();
  await k.j.ustawJezyk('pl');
  const plik = join(katalogDanych(), 'jezyk.json');
  const przed = readFileSync(plik, 'utf8');
  const w = await usunWszystkieDane(k.z);
  expect(w.ok).toBe(true);
  expect(existsSync(plik)).toBe(true);
  expect(readFileSync(plik, 'utf8')).toBe(przed); // usunięcie nie dotyka plików obok bazy
  await k.zamknij();
  const po = await kontener(); // `ustawienie` puste → „auto”; lustro uzgodnione przy starcie
  expect(po.j.preferencja()).toBe('auto');
  await po.zamknij();
  expect((await tAwaryjny())('awaryjny.sprobuj')).toBe(EN);
});
