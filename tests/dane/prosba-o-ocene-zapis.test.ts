// Przypadek użycia prośby o ocenę (moduly.md „Prośba o ocenę”, P-156 Q1a): zapis klucza tylko po udanym requestReview; drugi raz w tej
// samej wersji bez prośby; wyjątek modułu → bez zapisu; klucz to stan urządzenia — import „zastąp” go nie nadpisuje.
import { join } from 'node:path';
import { prosbaPoUkonczeniu, type PortOceny } from '../../src/przypadki-uzycia/ocena';
import { odczytajUstawienie, zapiszUstawienie } from '../../src/dane/repozytoria/ustawienia';
import { zastapZKopii } from '../../src/dane/baza/przeniesienie';
import { przyTle } from '../../src/przypadki-uzycia/start';
import { przygotuj } from './pomocnicze/srodowisko';

const port = (o: Partial<{ dostepna: boolean; blad: boolean }> = {}) => {
  const wywolania: string[] = [];
  const p: PortOceny = {
    dostepna: async () => o.dostepna ?? true, wersja: () => '1.0.0',
    popros: async () => { wywolania.push('popros'); if (o.blad) throw new Error('brak sceny'); },
  };
  return { p, wywolania };
};

describe('prosbaPoUkonczeniu', () => {
  test('pierwsza prośba → wywołanie i zapis { wersja, dzien }; druga w tej samej wersji → bez wywołania', async () => {
    const s = await przygotuj();
    const a = port();
    expect(await prosbaPoUkonczeniu(s.z, a.p)).toBe('poproszono');
    expect(await odczytajUstawienie(s.baza, 'ostatnia_prosba_o_ocene')).toEqual({ wersja: '1.0.0', dzien: '2026-10-22' });
    s.zegar.przesun(30 * 86_400_000);
    expect(await prosbaPoUkonczeniu(s.z, a.p)).toBe('bez-prosby');
    expect(a.wywolania).toEqual(['popros']);
  });

  test('wyjątek requestReview albo niedostępność (TestFlight) → bez zapisu klucza', async () => {
    const s = await przygotuj();
    expect(await prosbaPoUkonczeniu(s.z, port({ blad: true }).p)).toBe('bez-prosby');
    const n = port({ dostepna: false });
    expect(await prosbaPoUkonczeniu(s.z, n.p)).toBe('bez-prosby');
    expect(n.wywolania).toEqual([]);
    expect(await odczytajUstawienie(s.baza, 'ostatnia_prosba_o_ocene')).toBeUndefined();
  });

  test('P-156 Q1a: import „zastąp” zostawia klucz urządzenia i nie bierze klucza z kopii', async () => {
    const zrodlo = await przygotuj();
    await zapiszUstawienie(zrodlo.baza, 'ostatnia_prosba_o_ocene', { wersja: '0.9.0', dzien: '2026-01-01' }, 1);
    await przyTle(zrodlo.z);
    const s = await przygotuj();
    await zapiszUstawienie(s.baza, 'ostatnia_prosba_o_ocene', { wersja: '1.0.0', dzien: '2026-10-22' }, 1);
    await zastapZKopii(s.baza, join(zrodlo.katalog, 'oczko.db'));
    expect(await odczytajUstawienie(s.baza, 'ostatnia_prosba_o_ocene')).toEqual({ wersja: '1.0.0', dzien: '2026-10-22' });
  });
});
