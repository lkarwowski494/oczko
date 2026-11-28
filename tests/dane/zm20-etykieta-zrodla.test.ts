// PU-362 (ex PU-362, R2, TQ1): arkusz „Dwie wersje” (PU-099) rozróżnia gałęzie z tego samego urządzenia według źródła (P-1111, ADR-0035 „Ryzyko szczątkowe”):
// „… z ekranu blokady” / „… z zegarka” dla linii dziennika, „… z aplikacji” dla drugiej gałęzi tego samego urządzenia; inne urządzenie zostaje przy nazwie urządzenia.
// Konflikt powstaje jak w SC-02 (wpisanie w aplikacji po stuknięciu z ekranu blokady od starej głowy): `scalDziennik` → `konflikt.kandydaci()` kompozycji licznika.
import { migruj } from '../../src/dane/migracje/migruj';
import type { LiveActivity, Zegarek, ZdarzenieWejsciowe } from '../../src/domena/porty';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { kompozycjaLicznika, type Jezyk } from '../../src/kompozycja/licznik';
import { czesc, projekt, zdarzenie } from './pomocnicze/dane-wejsciowe';
import { T0, przygotuj, wykonaj } from './pomocnicze/srodowisko';

const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined, aktywna: () => false };
const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async () => undefined, odbieraj: () => () => undefined };
const DZIEN = '2026-10-22';
const linia = (id: string, zrodlo: 'ekran_blokady' | 'zegarek', czasMs: number): ZdarzenieWejsciowe =>
  ({ id, licznikId: 'l1', rodzaj: 'plus', rodzice: ['w'], czasMs, strefa: 'Europe/Warsaw', dzien: DZIEN, zrodlo, urzadzenie: 'iphone-test' } as ZdarzenieWejsciowe);

/** Baza jak SC-02: w (wpisanie 10) → x (wpisanie 20, aplikacja, czas 300); `inneUrzadzenie` = x pochodzi z innego urządzenia. */
async function konflikt(zrodlo: 'ekran_blokady' | 'zegarek', inneUrzadzenie = false) {
  const s = await przygotuj();
  s.pro.wartosc = true;
  const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  const j: Jezyk = { t: i.t, jezyk: i.jezyk, zegar24h: () => true };
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'),
    ['INSERT INTO licznik (id, czesc_id, rodzaj, zablokowany, wartosc, glowa, kolejnosc, zmieniono_ms) VALUES (?, ?, ?, 0, ?, ?, 1, ?)', ['l1', 'c1', 'rzedy', 20, 'x', T0]],
    zdarzenie('w', 'l1', 'wpisanie', 10, [], T0, { wartosc: 10, dzien: DZIEN }),
    zdarzenie('x', 'l1', 'wpisanie', 20, ['w'], T0 + 300, { wartosc: 20, dzien: DZIEN, urzadzenie: inneUrzadzenie ? 'ipad-test' : 'iphone-test' })]);
  s.dziennik.linie.push(linia('l1z', zrodlo, T0 + 200));
  const k = kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity, zegarek }, j);
  await k.przygotuj();
  await k.otworz('l1');
  await k.uslugi.scalDziennik();
  return (await k.konflikt.kandydaci()).sort((a, b) => b.wartosc - a.wartosc);
}

describe('ZM-20 etykieta źródła gałęzi w arkuszu „Dwie wersje” (PU-099, P-1111)', () => {
  test('ZM-20 PU-362: stuknięcie z ekranu blokady i wpisanie w aplikacji z tego samego urządzenia → „z aplikacji” i „z ekranu blokady” (tekst wiersza i etykieta VoiceOver)', async () => {
    const [aplikacja, blokada] = await konflikt('ekran_blokady');
    expect(aplikacja).toMatchObject({ wartosc: 20, tekst: expect.stringContaining('from the app') as string, etykieta: expect.stringMatching(/^Keep 20 rows from the app, /) as string });
    expect(blokada).toMatchObject({ wartosc: 11, tekst: expect.stringContaining('from the Lock Screen') as string, etykieta: expect.stringMatching(/^Keep 11 rows from the Lock Screen, /) as string });
  });

  test('ZM-20 PU-362: linia z zegarka → „z zegarka” (Apple Watch)', async () => {
    const [, zegar] = await konflikt('zegarek');
    expect(zegar).toMatchObject({ wartosc: 11, etykieta: expect.stringMatching(/^Keep 11 rows from Apple Watch, /) as string });
  });

  test('ZM-20 PU-362: gałąź z INNEGO urządzenia zostaje przy nazwie urządzenia (bez „z aplikacji”), linia z ekranu blokady nadal „z ekranu blokady”', async () => {
    const [inne, blokada] = await konflikt('ekran_blokady', true);
    expect(inne?.tekst).not.toContain('from the app');
    expect(inne?.tekst).toContain('ipad-test');
    expect(blokada?.etykieta).toMatch(/^Keep 11 rows from the Lock Screen, /);
  });
});
