// M1-audytor-generalny-190 (12-niezawodnosc-508, 07-jakosc-543): prawdziwy `utworzKontener` przekazuje wolne miejsce platformy do `otworzBaze`
// (M1-157, ADR-0020 (4)), więc błąd I/O przy otwarciu bazy na pełnym dysku daje `brak_miejsca`, a nie `zapis` (nagłówek „uszkodzony”, 505).
// Testy ekranów podmieniają cały kontener; ten test woła prawdziwy (atrapy tylko: katalog biblioteki, wolne miejsce, fabryka portu z IOERR).
import { join } from 'node:path';
import { katalogTymczasowy } from '../dane/pomocnicze/srodowisko';

let mockBiblioteka = '';
const mockWolne: { v: number | null } = { v: 0 };
jest.mock('../../src/dane/pliki/system', () => ({ ...jest.requireActual('../../src/dane/pliki/system'), katalogBiblioteki: () => mockBiblioteka, wolneMiejsce: () => mockWolne.v }));
jest.mock('../../src/dane/baza/adapter-expo', () => ({ ...jest.requireActual('../../src/dane/baza/adapter-expo'), otworzPortExpo: () => { throw new Error('disk I/O error'); } }));

test.each([[0, 'brak_miejsca'], [999_999, 'brak_miejsca'], [10_000_000_000, 'zapis'], [null, 'zapis']] as const)(
  'utworzKontener: błąd I/O otwarcia bazy przy wolnym %p B → %s', async (wolne, powod) => {
    mockBiblioteka = join(katalogTymczasowy('m1-190-'), 'Library');
    mockWolne.v = wolne;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { utworzKontener } = require('../../src/kompozycja/kontener') as typeof import('../../src/kompozycja/kontener');
    expect(await utworzKontener()).toEqual({ ok: false, powod });
  });
