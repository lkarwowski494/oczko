// PU-156 (katalog przypadków użycia, „Apple Watch”): telefon wysyła zegarkowi bieżący licznik — po każdym +1 stan udawanego zegarka (build E2E,
// panel `e2e-zegarek-stan`) zawiera nazwę projektu i bieżący rząd. Poziom: kompozycja licznika na prawdziwej bazie, zegarek = `zegarekSztuczny` z `src/`.
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { migruj } from '../../src/dane/migracje/migruj';
import type { LiveActivity } from '../../src/domena/porty';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { PanelZegarka, zegarekSztuczny } from '../../src/kompozycja/e2e/panele';
import { kompozycjaLicznika } from '../../src/kompozycja/licznik';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';

// PU-156: „Watch test” → +1 → panel zegarka ma nazwę projektu i rząd 2; kolejne +1 → rząd 3.
test('PU-156: po każdym +1 stan zegarka (e2e-zegarek-stan) zawiera nazwę „Watch test” i bieżący rząd (2, potem 3)', async () => {
  const s = await przygotuj();
  const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined, aktywna: () => false };
  const k = kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity, zegarek: zegarekSztuczny }, { t: i.t, jezyk: i.jezyk, zegar24h: () => true }, { wibracje: () => false });
  await wykonaj(s.baza, [projekt('p1', 'Watch test'), czesc('c1', 'p1', 'Body'), ...licznik('l1', 'c1', 0)]);
  await k.otworz('l1');
  render(<PanelZegarka />);
  const panel = () => String(screen.getByTestId('e2e-zegarek-stan').props.children);
  for (const rzad of [2, 3]) {
    expect((await k.uslugi.dodajRzad()).ok).toBe(true);
    await waitFor(() => expect(panel()).toContain(`row ${rzad}`));
    expect(panel()).toContain('Watch test');
  }
});
