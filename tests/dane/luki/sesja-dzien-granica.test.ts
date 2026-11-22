// BR-DNI-001/S3–S4 (ER-55, P-195 Q3b; przekazanie 01 P-202): granica „sesja stopera ≥ SESJA_DNIA_MIN_MS czyni dzień dniem z robótką”.
// Testy 08 (p195-stoper-kopia) sprawdzają 40 min, 10 min, 30 s i 20 s — mutant `>=` → `>` w dniZRobotka przeżywał (JAK-04). Wyrocznia: parametr
// z konfiguracji (decyzja P-195 Q3b), nie liczba; przerwy odejmowane od czasu sesji (moduly.md, czas = koniec − start − przerwy).
import { dniZRobotka } from '../../../src/dane/repozytoria/kalendarz';
import { SESJA_DNIA_MIN_MS } from '../../../src/konfiguracja';
import { startSesji, wstrzymajSesje, wznowSesje, zakonczSesje } from '../../../src/przypadki-uzycia/sesja';
import { projekt } from '../pomocnicze/dane-wejsciowe';
import { przygotuj, wykonaj } from '../pomocnicze/srodowisko';

const D22 = Date.UTC(2026, 9, 22, 18); // 20:00 w Warszawie
async function sesjaTrwajaca(ms: number, przerwaMs = 0) {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Szalik')]);
  s.zegar.ustaw(D22);
  const a = await startSesji(s.z, { projektId: 'p1' });
  if (!a.ok) throw new Error('start');
  if (przerwaMs) {
    s.zegar.ustaw(D22 + 1_000);
    await wstrzymajSesje(s.z, { sesjaId: a.wartosc.sesjaId });
    s.zegar.ustaw(D22 + 1_000 + przerwaMs);
    await wznowSesje(s.z, { sesjaId: a.wartosc.sesjaId });
  }
  s.zegar.ustaw(D22 + ms + przerwaMs);
  await zakonczSesje(s.z, { sesjaId: a.wartosc.sesjaId });
  return dniZRobotka(s.baza, '2026-10');
}

describe('BR-DNI-001/S3–S4 granica sesji stopera (P-195 Q3b)', () => {
  test('czas równy progowi → dzień z robótką', async () => {
    expect(await sesjaTrwajaca(SESJA_DNIA_MIN_MS)).toEqual(['2026-10-22']);
  });
  test('czas o 1 ms krótszy niż próg → bez znacznika', async () => {
    expect(await sesjaTrwajaca(SESJA_DNIA_MIN_MS - 1)).toEqual([]);
  });
  test('przerwa się nie liczy: 59 s pracy + 10 min pauzy → bez znacznika', async () => {
    expect(await sesjaTrwajaca(SESJA_DNIA_MIN_MS - 1_000, 10 * 60_000)).toEqual([]);
  });
});
