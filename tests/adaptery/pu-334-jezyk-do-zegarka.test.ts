// PU-334 (katalog przypadków użycia, „Język zegarka = język aplikacji”): „stan wysłany do zegarka ma `jezyk: de`” po wyborze „Deutsch” i +1, a wcześniej `en` — na prawdziwej bazie (node:sqlite),
// prawdziwym i18n (`ustawJezyk`), prawdziwej kompozycji licznika i prawdziwym adapterze `zegarek` (`src/platforma/zegarek.ts`); atrapa tylko moduł natywny Swift (`zegarekWyslij`).
// Poza Jest: teksty po niemiecku na prawdziwym zegarku („+1 Reihe”), także po jego restarcie bez telefonu — scenariusz 90 (oczekujący) i próba na urządzeniu (F).
import { migruj } from '../../src/dane/migracje/migruj';
import type { LiveActivity } from '../../src/domena/porty';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { kompozycjaLicznika, type Jezyk } from '../../src/kompozycja/licznik';
import { zegarek } from '../../src/platforma/zegarek';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';

test('PU-334: „Deutsch” → +1 → do zegarka idzie stan z językiem `de` (przed wyborem `en`), z wartością po +1', async () => {
  const s = await przygotuj();
  const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  const j: Jezyk = { t: i.t, jezyk: i.jezyk, zegar24h: () => true };
  const wyslane: unknown[][] = [];
  const natywny = { zegarekWyslij: async (...a: unknown[]) => { wyslane.push(a); }, addListener: () => ({ remove() {} }) };
  const czekajNaWysylke = async (n: number) => { for (let p = 0; p < 100 && wyslane.length < n; p++) await new Promise((r) => setTimeout(r, 20)); }; // stan do zegarka idzie po +1 w tle (`void poZapisie`)
  const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined, aktywna: () => false };
  const k = kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity, zegarek: zegarek(natywny, () => i.jezyk()) }, j, { wibracje: () => false });
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 3)]);
  await k.otworz('l1');

  expect((await k.uslugi.dodajRzad()).ok).toBe(true);
  await czekajNaWysylke(1);
  await i.ustawJezyk('de'); // „Język” → „Deutsch”
  expect(i.jezyk()).toBe('de');
  expect((await k.uslugi.dodajRzad()).ok).toBe(true);
  await czekajNaWysylke(2);

  const wyslano = wyslane.map((a) => ({ wartosc: (JSON.parse(a[0] as string) as { wartosc: number }).wartosc, jezyk: a[2] }));
  expect(wyslano.length).toBeGreaterThanOrEqual(2);
  expect(wyslano.at(-1)).toEqual({ wartosc: 5, jezyk: 'de' });
  expect(wyslano.find((w) => w.wartosc === 4)).toEqual({ wartosc: 4, jezyk: 'en' });
});
