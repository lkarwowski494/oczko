// M1-audytor-generalny-080 (07-jakosc-004): import „scal” a dni limitu — `pro` dnia to OR obu stron (L-20, `docs/architektura/dane.md`, `scalDni`
// w `src/domena/limit.ts`). SQL scalania w `src/dane/baza/przeniesienie.ts` to druga kopia reguły; ten test sprawdza ją na prawdziwym SQLite (node:sqlite),
// żeby dzień zaczęty z Pro nie wrócił do puli darmowych dni po imporcie kopii z drugiego urządzenia z tym samym dniem bez Pro.
import { join } from 'node:path';
import { scalZKopia } from '../../src/dane/baza/przeniesienie';
import { dzienLimitu } from './pomocnicze/dane-wejsciowe';
import { przygotuj, wykonaj } from './pomocnicze/srodowisko';

const dni = async (s: Awaited<ReturnType<typeof przygotuj>>) => s.baza.all<{ dzien: string; pro: number }>('SELECT dzien, pro FROM dzien_limitu ORDER BY dzien');

async function scal(lokalnie: number, wKopii: number) {
  const kopia = await przygotuj();
  await wykonaj(kopia.baza, [dzienLimitu('2026-10-22', 'z-kopia', wKopii)]);
  const s = await przygotuj();
  await wykonaj(s.baza, [dzienLimitu('2026-10-22', 'z-lokalne', lokalnie)]);
  await scalZKopia(s.baza, join(kopia.katalog, 'oczko.db'), s.zegar.teraz().ms);
  return dni(s);
}

describe('M1-080 (07-jakosc-004): import „scal” — pro dnia limitu = OR (L-20)', () => {
  test('dzień z pro=1 lokalnie, kopia z pro=0 tego dnia → po „scal” pro=1', async () => {
    expect(await scal(1, 0)).toEqual([{ dzien: '2026-10-22', pro: 1 }]);
  });
  test('dzień z pro=0 lokalnie, kopia z pro=1 tego dnia → po „scal” pro=1', async () => {
    expect(await scal(0, 1)).toEqual([{ dzien: '2026-10-22', pro: 1 }]);
  });
  test('ten sam dzień bez Pro po obu stronach → pro=0 (dzień liczy się do limitu)', async () => {
    expect(await scal(0, 0)).toEqual([{ dzien: '2026-10-22', pro: 0 }]);
  });
});
