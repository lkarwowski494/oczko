// P-203 / kontrakt 07 (koordynator 16:11 UTC): panel E2E `e2e-sha-bazy` = SHA-256 połączonych plików `.db` + `-wal` (brak `-wal` = pusty),
// bez checkpointu; `e2e-wal-bajty` = rozmiar `-wal` w bajtach.
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stanPlikuBazy } from '../../src/dane/pliki/magazyn';
import { sha256 } from './pomocnicze/srodowisko';

test('SHA pary .db + -wal i rozmiar WAL; bez -wal liczy się jako pusty', async () => {
  const k = mkdtempSync(join(tmpdir(), 'sha-'));
  const db = join(k, 'oczko.db');
  writeFileSync(db, 'BAZA');
  expect(await stanPlikuBazy(db)).toEqual({ sha: sha256('BAZA'), walBajty: 0 });
  writeFileSync(`${db}-wal`, 'DZIENNIK');
  expect(await stanPlikuBazy(db)).toEqual({ sha: sha256('BAZADZIENNIK'), walBajty: 8 });
});
