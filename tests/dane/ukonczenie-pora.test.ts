// Zmiana daty ukończenia zachowuje porę dnia (P-137, 04 fix-2: ekran wybiera tylko datę, od startu do dziś): ukonczonoMs = ta sama pora
// lokalna (strefa urządzenia z Zegar) co pierwotnie, w nowym dniu; zmienia się tylko data. Test oczekujący roli 05 (fix-4): czerwony na asercji
// do wdrożenia przez 08 (partia 4; sygnatura bez ukonczonoMs: „Kontrakt partii 4” w docs/architektura/moduly.md). Wyrocznia: rachunek dat
// (Europe/Warsaw: CEST = UTC+2 do 2026-10-25 03:00, potem CET = UTC+1; 2026-03-29 02:00–03:00 nie istnieje).
import { utworzProjekt, zakonczProjekt, zmienDateUkonczenia } from '../../src/przypadki-uzycia/projekt';
import { jeden, przygotuj } from './pomocnicze/srodowisko';

type Wejscie = Parameters<typeof zmienDateUkonczenia>[1];
async function ukonczony(ukonczonoUtc: number) {
  const s = await przygotuj();
  const p = await utworzProjekt(s.z, { nazwa: 'Sweter', czesci: [] });
  if (!p.ok) throw new Error(p.powod);
  s.zegar.ustaw(ukonczonoUtc, 'Europe/Warsaw');
  await zakonczProjekt(s.z, { projektId: p.wartosc.projektId });
  s.zegar.ustaw(Date.UTC(2026, 9, 26, 9), 'Europe/Warsaw'); // teraz: 2026-10-26 10:00 CET
  const zmien = (dzien: string) => zmienDateUkonczenia(s.z, { projektId: p.wartosc.projektId, ukonczonoDzien: dzien } as unknown as Wejscie);
  const odczyt = () => jeden<{ ukonczono_ms: number; ukonczono_dzien: string }>(s.baza, 'SELECT ukonczono_ms, ukonczono_dzien FROM projekt WHERE id = ?', [p.wartosc.projektId]);
  return { zmien, odczyt };
}

describe('P-137 zmienDateUkonczenia: ta sama pora dnia, nowa data', () => {
  test.each([
    ['typowy: 18:30 CEST → 2026-10-15 18:30 CEST', Date.UTC(2026, 9, 20, 16, 30), '2026-10-15', Date.UTC(2026, 9, 15, 16, 30)],
    ['przez zmianę czasu: 18:30 CEST → 2026-10-25 18:30 CET (pora lokalna, nie ta sama chwila UTC)', Date.UTC(2026, 9, 20, 16, 30), '2026-10-25', Date.UTC(2026, 9, 25, 17, 30)],
    ['dziś, pora jeszcze nie nadeszła (18:30 > 10:00) → teraz', Date.UTC(2026, 9, 20, 16, 30), '2026-10-26', Date.UTC(2026, 9, 26, 9)],
    ['luka DST: 02:30 → 2026-03-29 (02:00–03:00 nie istnieje) → 03:30 CEST', Date.UTC(2026, 9, 20, 0, 30), '2026-03-29', Date.UTC(2026, 2, 29, 1, 30)],
  ] as const)('P-137 RD-16: %s', async (_n, ukonczono, dzien, oczekiwaneMs) => {
    const { zmien, odczyt } = await ukonczony(ukonczono);
    expect(await zmien(dzien)).toEqual({ ok: true, wartosc: undefined });
    expect(await odczyt()).toEqual({ ukonczono_ms: oczekiwaneMs, ukonczono_dzien: dzien });
  });
});
