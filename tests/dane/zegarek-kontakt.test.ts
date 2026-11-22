// „Ostatni kontakt z zegarkiem” (F-58, BR-DAN-011 S3; P-193, P-195 Q1, P-199 Q5a; dane.md `zegarek_ostatnia_partia_ms`): czas odbioru partii
// z zegarka (także samych powtórzeń) w transakcji scalenia; linie ekranu blokady go nie zmieniają; stan urządzenia — import go nie nadpisuje.
import { join } from 'node:path';
import type { ZdarzenieWejsciowe } from '../../src/domena/porty';
import { odczytajUstawienie, zapiszUstawienie, zegarekOstatniaPartiaMs } from '../../src/dane/repozytoria/ustawienia';
import { zastapZKopii } from '../../src/dane/baza/przeniesienie';
import { scalDziennik } from '../../src/przypadki-uzycia/dziennik';
import { przyTle } from '../../src/przypadki-uzycia/start';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { przygotuj, wykonaj } from './pomocnicze/srodowisko';

const T = Date.UTC(2026, 10, 10, 10);
const linia = (id: string, rodzice: string[], zrodlo: ZdarzenieWejsciowe['zrodlo'] = 'zegarek'): ZdarzenieWejsciowe => ({
  id, licznikId: 'l1', rodzaj: 'plus', rodzice, czasMs: T, strefa: 'Europe/Warsaw', dzien: '2026-11-10', zrodlo, urzadzenie: 'u', pro: false,
});
async function srodowisko() {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 0)]);
  return s;
}

describe('zegarek_ostatnia_partia_ms', () => {
  test('partia z zegarka odebrana o 14:00 (stuknięcie o 11:00) → czas odbioru, nie stuknięcia', async () => {
    const s = await srodowisko();
    s.zegar.ustaw(T + 4 * 3_600_000);
    s.dziennik.linie.push(linia('z1', []));
    await scalDziennik(s.z);
    expect(await odczytajUstawienie(s.baza, 'zegarek_ostatnia_partia_ms')).toBe(T + 4 * 3_600_000);
  });

  test('same powtórzenia z zegarka to też kontakt; linie ekranu blokady nie zmieniają klucza', async () => {
    const s = await srodowisko();
    s.zegar.ustaw(T + 60_000);
    s.dziennik.linie.push(linia('e1', [], 'ekran_blokady'));
    await scalDziennik(s.z);
    expect(await odczytajUstawienie(s.baza, 'zegarek_ostatnia_partia_ms')).toBeUndefined();
    s.dziennik.linie.push(linia('z1', ['e1']));
    await scalDziennik(s.z);
    s.zegar.ustaw(T + 120_000);
    s.dziennik.linie.push(linia('z1', ['e1']));
    await scalDziennik(s.z);
    expect(await odczytajUstawienie(s.baza, 'zegarek_ostatnia_partia_ms')).toBe(T + 120_000);
  });

  test('stan urządzenia: import „zastąp” zostawia bieżący i nie bierze z kopii', async () => {
    const zrodlo = await przygotuj();
    await zapiszUstawienie(zrodlo.baza, 'zegarek_ostatnia_partia_ms', 5, 1);
    await przyTle(zrodlo.z);
    const s = await przygotuj();
    await zapiszUstawienie(s.baza, 'zegarek_ostatnia_partia_ms', 7, 1);
    await zastapZKopii(s.baza, join(zrodlo.katalog, 'oczko.db'));
    expect(await odczytajUstawienie(s.baza, 'zegarek_ostatnia_partia_ms')).toBe(7);
  });

  test('odczyt dla Stanu danych: liczba całkowita → ta liczba; brak albo zły zapis → null (brak zostaje brakiem)', async () => {
    const s = await przygotuj();
    expect(await zegarekOstatniaPartiaMs(s.baza)).toBeNull();
    await zapiszUstawienie(s.baza, 'zegarek_ostatnia_partia_ms', 'wczoraj', 1);
    expect(await zegarekOstatniaPartiaMs(s.baza)).toBeNull();
    await zapiszUstawienie(s.baza, 'zegarek_ostatnia_partia_ms', T, 1);
    expect(await zegarekOstatniaPartiaMs(s.baza)).toBe(T);
  });
});
