// M3 p2: dane „Dziś” z istniejących odczytów (ZM-18 wiersz „08 (p2)”: widokHistorii, widokProjektow, widok licznika) → model ekranu.
// Wyrocznia: makiety dzianina/wzorce-zrzuty/dzis-* (czwartek 5 listopada 2026: tydzień pn–nd od 2 listopada, RD-20 poniedziałek), design-spec
// „Macierz stanów” (pusty tydzień; linia dni tylko bez Pro, P-563 (10a)); RD-13 dla „co dalej” (tests/domena/co-dalej.test.ts). Rachunek dat ręczny.
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { daneDzis } from '../../src/kompozycja/dzis';
import type { Jezyk } from '../../src/kompozycja/licznik';

async function jezyk(kod: string): Promise<Jezyk> {
  const i = await utworzI18n({ magazyn: { odczytaj: async () => kod, zapisz: async () => {} }, systemowe: () => [kod], zasoby: ZASOBY });
  return { t: i.t, jezyk: i.jezyk, zegar24h: () => true };
}
const PUSTE = { dniRobotki: [] as string[], dzien: [] as { projektId: string; rzedy: number }[] };

describe('daneDzis', () => {
  test('tydzień od poniedziałku przez granicę miesiąca; dziś zaznaczone; dni z robótką z obu miesięcy', async () => {
    const j = await jezyk('pl');
    const d = daneDzis({
      dzis: '2026-10-01', // czwartek; tydzień 28 września – 4 października
      historia: [{ dniRobotki: ['2026-09-28', '2026-09-30'], dzien: [] }, { dniRobotki: ['2026-10-01'], dzien: [{ projektId: 'p1', rzedy: 3 }] }],
      projekty: { wToku: 2, dni: { zostalo: 3, limit: 5, dzis: '2026-10-01' } },
      licznik: { projektId: 'p1', dziergany: 43, plany: [] },
      miejsce: 'licznik',
    }, j);
    expect(d.tydzien.map((x) => x.dzien)).toEqual(['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
    expect(d.tydzien.map((x) => x.dziergany)).toEqual([true, false, true, true, false, false, false]);
    expect(d.tydzien.map((x) => x.dzis)).toEqual([false, false, false, true, false, false, false]);
    expect(d.tydzien[3]?.skrot).toBe('czw.'); // skrót z Intl (CLDR pl „czw.”), jak skróty Historii; makieta pisze „czw” — różnica do 04
    expect(d.data).toBe('czwartek, 1 października');
    expect(d.pustyTydzien).toBe(false);
    expect(d.rzedyDzis).toBe(3);
    expect(d.dni).toEqual({ zostalo: 3, limit: 5, miesiac: 'październik' });
    expect(d.wToku).toBe(2);
  });

  test('pierwsze użycie: pusty tydzień, bez licznika; Pro → bez linii dni (P-563 (10a))', async () => {
    const d = daneDzis({ dzis: '2026-11-05', historia: [PUSTE], projekty: { wToku: 0, dni: null }, licznik: null, miejsce: 'licznik' }, await jezyk('en'));
    expect(d.pustyTydzien).toBe(true);
    expect(d.tydzien).toHaveLength(7);
    expect(d.tydzien[0]?.dzien).toBe('2026-11-02');
    expect(d.dni).toBeNull();
    expect(d.rzedyDzis).toBe(0);
    expect(d.coDalej).toBeNull();
  });

  test('co dalej z planów licznika (RD-13): rząd w robocie 43, ujmowanie od 11 co 9 × 8 → za 4, 5 z 8', async () => {
    const d = daneDzis({ dzis: '2026-11-05', historia: [PUSTE], projekty: { wToku: 1, dni: null }, licznik: { projektId: 'p1', dziergany: 43, plany: [{ tekst: 'ujmowanie', od: 11, co: 9, razy: 8 }] }, miejsce: 'licznik' }, await jezyk('pl'));
    expect(d.coDalej).toEqual({ za: 4, tekst: 'ujmowanie', ktory: 5, razy: 8 });
  });
});
