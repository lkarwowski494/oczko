// P-287 (hipoteza 07 dla scen. 01, przebieg 126): pierwsze +1 i odświeżenie licznika w tym samym czasie (naPartie → poZmianie → przemontowanie
// ekranu z nowym odczytem `uslugi.start`). Odczyt rozpoczęty po stuknięciu musi widzieć jego zapis — inaczej nowy ekran zostaje na 0, a wynik
// +1 trafia do odmontowanego komponentu (Aplikacja.tsx naPlus). Stuknięcie nie może zginąć (U12).
import { migruj } from '../../src/dane/migracje/migruj';
import type { LiveActivity, Zegarek } from '../../src/domena/porty';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { kompozycjaLicznika } from '../../src/kompozycja/licznik';
import { przygotuj } from './pomocnicze/srodowisko';

const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined };
const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async () => undefined, odbieraj: () => () => undefined };

async function kompozycja() {
  const s = await przygotuj();
  const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  const k = kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity, zegarek }, { t: i.t, jezyk: i.jezyk, zegar24h: () => true });
  expect((await k.przygotuj()).ok).toBe(true);
  return k;
}

test('pierwsze +1 w toku, potem odczyt startu nowego ekranu (przemontowanie) → odczyt widzi 1', async () => {
  const k = await kompozycja();
  const plus = k.uslugi.dodajRzad();
  const start = k.uslugi.start();
  const [w, s] = await Promise.all([plus, start]);
  expect(w.ok).toBe(true);
  expect(s.licznik.skonczone).toBe(1);
});

test('pierwsze +1 w toku, poZmianie (naPartie), potem odczyt startu → 1; trwały zapis po wszystkim', async () => {
  const k = await kompozycja();
  const plus = k.uslugi.dodajRzad();
  const zmiana = k.poZmianie();
  const start = k.uslugi.start();
  const [, , s] = await Promise.all([plus, zmiana, start]);
  expect(s.licznik.skonczone).toBe(1);
  expect((await k.dzialania.odswiez!()).skonczone).toBe(1);
});

test('kolejne +1 w toku (z projektem) i odczyt startu → widzi nową wartość', async () => {
  const k = await kompozycja();
  await k.uslugi.dodajRzad();
  const plus = k.uslugi.dodajRzad();
  const s = await k.uslugi.start();
  await plus;
  expect(s.licznik.skonczone).toBe(2);
});
