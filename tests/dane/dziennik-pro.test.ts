// `pro` w linii dziennika +1 (P-111 (2), ADR-0008 (6), NZ-05-04; test roli 08 z kontraktu, do przeglądu 07): dzień limitu ze scalenia dostaje
// `dzien` i `pro` z linii (stan urządzenia w chwili stuknięcia), nie z chwili scalenia; scalenie nie odrzuca niczego z powodu limitu (L-16).
import type { ZdarzenieWejsciowe } from '../../src/domena/porty';
import { parsujDziennik } from '../../src/dane/dziennik';
import { scalDziennik } from '../../src/przypadki-uzycia/dziennik';
import { czesc, dzienLimitu, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { MIN, przygotuj, wykonaj } from './pomocnicze/srodowisko';

/** Chwila UTC dla czasu lokalnego Europe/Warsaw w listopadzie 2026 (CET, UTC+1). */
const waw = (dzien: number, h: number, m = 0) => Date.UTC(2026, 10, dzien, h - 1, m);
const linia = (id: string, rodzice: string[], czasMs: number, dzien: string, pro: boolean): ZdarzenieWejsciowe => ({
  id, licznikId: 'l1', rodzaj: 'plus', rodzice, czasMs, strefa: 'Europe/Warsaw', dzien, zrodlo: 'ekran_blokady', urzadzenie: 'iphone-test', pro,
});
async function srodowisko(proTeraz: boolean, dni: [string, unknown[]][] = []) {
  const s = await przygotuj();
  s.pro.wartosc = proTeraz;
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 0), ...dni]);
  s.zegar.ustaw(waw(12, 8));
  return s;
}
const dniLimitu = (s: Awaited<ReturnType<typeof srodowisko>>) => s.baza.all('SELECT dzien, pro FROM dzien_limitu ORDER BY dzien');

describe('NZ-05-04 P-111 (2): pro z linii dziennika', () => {
  test('ADR-0008 (6) P-103: stuknięcie z Pro, scalenie po wygaśnięciu Pro → dzień z pro = 1 (niepewność na korzyść użytkowniczki)', async () => {
    const s = await srodowisko(false);
    s.dziennik.linie.push(linia('d1', [], waw(11, 20), '2026-11-11', true));
    expect(await scalDziennik(s.z)).toEqual({ ok: true, wartosc: { scalono: 1, pominieto: 0, potwierdzone: [] } });
    expect(await dniLimitu(s)).toEqual([{ dzien: '2026-11-11', pro: 1 }]);
  });

  test('ADR-0008 (6): stuknięcie bez Pro, scalenie po zakupie Pro → dzień z pro = 0 (pro z chwili stuknięcia, nie scalenia)', async () => {
    const s = await srodowisko(true);
    s.dziennik.linie.push(linia('d1', [], waw(11, 20), '2026-11-11', false));
    await scalDziennik(s.z);
    expect(await dniLimitu(s)).toEqual([{ dzien: '2026-11-11', pro: 0 }]);
  });

  test('ADR-0008 (6) scenariusz: stuknięcia o 23:30 dnia D, scalenie o 08:00 D+1 → wiersz tylko dla D, D+1 niezaczęty', async () => {
    const s = await srodowisko(false);
    s.dziennik.linie.push(linia('d1', [], waw(11, 23, 30), '2026-11-11', false), linia('d2', ['d1'], waw(11, 23, 30) + MIN, '2026-11-11', false));
    await scalDziennik(s.z);
    expect(await dniLimitu(s)).toEqual([{ dzien: '2026-11-11', pro: 0 }]);
  });

  test('L-16 ADR-0008 (6): pięć darmowych dni w miesiącu, scalenie stuknięcia z szóstego dnia → zapisane, wiersz dnia dopisany', async () => {
    const s = await srodowisko(false, ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05'].map((d) => dzienLimitu(d, `z-${d}`)));
    s.dziennik.linie.push(linia('d1', [], waw(11, 20), '2026-11-11', false));
    expect(await scalDziennik(s.z)).toEqual({ ok: true, wartosc: { scalono: 1, pominieto: 0, potwierdzone: [] } });
    expect((await dniLimitu(s)).length).toBe(6);
  });

  test('tests/wspolne/README.md (2): linia bez pola pro nie spełnia typu → uszkodzona, pozostałe przyjęte', () => {
    const z = linia('d1', [], waw(11, 20), '2026-11-11', true);
    const { pro: _pro, ...bezPro } = z;
    expect(parsujDziennik(`${JSON.stringify(bezPro)}\n${JSON.stringify(z)}\n`)).toEqual({ zdarzenia: [z], uszkodzone: [1] });
  });
});
