// P-334: `projekt_wloczka.odjeto_motki` w przeniesieniu danych (import „Replace”/„Merge” z kopii): pole jedzie z kopią, a plik bez tej kolumny (starszy) daje NULL, nie błąd
// — zwrot motków przy odznaczeniu wynosi wtedy 0 (nic nie zgadujemy, zasada 10).
import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';
import { scalZKopia, zastapZKopii } from '../../src/dane/baza/przeniesienie';
import { przypiszWloczki } from '../../src/przypadki-uzycia/zapas';
import { bazaWzorcowa, projekt, projektWloczka, wloczka } from './pomocnicze/dane-wejsciowe';
import { T0, katalogTymczasowy, przygotuj, wykonaj } from './pomocnicze/srodowisko';

const dane = [projekt('p1', 'Sweter'), wloczka('y1', 'Merino', 3), projektWloczka('p1', 'y1'), ["UPDATE projekt_wloczka SET zuzyto_motki = 2, odjeto_motki = 1.5 WHERE wloczka_id = 'y1'", []] as [string, unknown[]]];
const staraKopia = () => {
  const plik = join(katalogTymczasowy('oczko-stara-'), 'stara.db');
  bazaWzorcowa(plik, [projekt('p1', 'Sweter'), wloczka('y1', 'Merino', 3), projektWloczka('p1', 'y1'), ["UPDATE projekt_wloczka SET zuzyto_motki = 2 WHERE wloczka_id = 'y1'", []]]);
  const db = new DatabaseSync(plik);
  db.exec('ALTER TABLE projekt_wloczka DROP COLUMN odjeto_motki'); // plik sprzed kolumny
  db.close();
  return plik;
};
const wiersz = (s: Awaited<ReturnType<typeof przygotuj>>) => s.baza.all('SELECT zuzyto_motki, odjeto_motki FROM projekt_wloczka');

test('Replace z kopii z kolumną: odjeto_motki jedzie z kopią', async () => {
  const zrodlo = await przygotuj();
  await wykonaj(zrodlo.baza, dane);
  const cel = await przygotuj();
  await zastapZKopii(cel.baza, join(zrodlo.katalog, 'oczko.db'));
  expect(await wiersz(cel)).toEqual([{ zuzyto_motki: 2, odjeto_motki: 1.5 }]);
});

test('Replace ze starego pliku bez kolumny: import przechodzi, odjeto_motki = NULL, zwrot przy odznaczeniu = 0', async () => {
  const cel = await przygotuj();
  cel.zegar.ustaw(T0);
  await zastapZKopii(cel.baza, staraKopia());
  expect(await wiersz(cel)).toEqual([{ zuzyto_motki: 2, odjeto_motki: null }]);
  expect((await przypiszWloczki(cel.z, { projektId: 'p1', wloczkaIds: [] })).ok).toBe(true);
  expect((await cel.baza.all<{ motki: number }>('SELECT motki FROM wloczka WHERE id = ?', ['y1']))[0]?.motki).toBe(3);
});

test('Merge ze starego pliku bez kolumny: import przechodzi, wiersz dochodzi z NULL', async () => {
  const cel = await przygotuj();
  await scalZKopia(cel.baza, staraKopia(), T0);
  expect(await wiersz(cel)).toEqual([{ zuzyto_motki: 2, odjeto_motki: null }]);
});

test('Merge: nowsza zmiana ze starego pliku (bez kolumny) nie kasuje lokalnego odjeto_motki', async () => {
  const cel = await przygotuj();
  await wykonaj(cel.baza, dane);
  await cel.baza.run('UPDATE projekt_wloczka SET zmieniono_ms = 1');
  await scalZKopia(cel.baza, staraKopia(), T0 + 1);
  expect(await wiersz(cel)).toEqual([{ zuzyto_motki: 2, odjeto_motki: 1.5 }]);
});
