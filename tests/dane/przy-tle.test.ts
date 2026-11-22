// R-091 (e3-tlo-bledy-prywatnosc-wydajnosc.md §1): przejście w tło → checkpoint WAL po zapisach z kolejki; plik bazy sam w sobie ma każdą zmianę.
import { statSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';
import { dodajRzad } from '../../src/przypadki-uzycia/licznik';
import { przyTle } from '../../src/przypadki-uzycia/start';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { przygotuj, wykonaj } from './pomocnicze/srodowisko';

test('R-091: +1 zlecone przed przyTle jest w pliku bazy, a -wal po checkpoincie ma 0 bajtów', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 2)]);
  const plus = dodajRzad(s.z, { licznikId: 'l1' }); // bez await: przyTle staje w kolejce za zapisem
  await przyTle(s.z);
  expect((await plus).ok).toBe(true);
  expect(statSync(join(s.katalog, 'oczko.db-wal')).size).toBe(0);
  const kopia = new DatabaseSync(join(s.katalog, 'oczko.db'), { readOnly: true });
  expect(kopia.prepare('SELECT wartosc FROM licznik').get()).toEqual({ wartosc: 3 });
  kopia.close();
});
