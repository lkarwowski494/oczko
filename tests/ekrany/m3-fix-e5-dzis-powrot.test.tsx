// M3 fix E5, poz. 17 (07-p3, P-617 A): po powrocie z licznika gestem „Dziś” pokazywało 0 zamiast 1 (przebieg 3 iOS). Ten test NIE odtwarza błędu:
// komponent `Aplikacja` („Dziś” pod licznikiem) pokazuje nowy stan po +1 także bez powrotu na wierzch — przed poprawką i po niej zielony.
// Zostaje jako kontrola regresji warstwy JS; przyczyna jest w warstwie natywnej (pełnoekranowy gest iOS 26), którą A wyłącza — potwierdzi E2E przebiegu 4.
// Prawdziwa baza (node:sqlite) i kompozycja; atrapy tylko na granicy platformy.
import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { migruj } from '../../src/dane/migracje/migruj';
import type { LiveActivity, Sklep, Zegarek } from '../../src/domena/porty';
import { Aplikacja } from '../../src/ekrany/Aplikacja';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { kompozycjaLicznika } from '../../src/kompozycja/licznik';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';
import { atrapaCyklu, atrapaHaptyki, atrapaSystemu } from './pomoc';

const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined };
const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async () => undefined, odbieraj: () => () => undefined };
const sklep = { produkty: jest.fn(async () => []), kup: jest.fn(), przywroc: jest.fn(), transakcje: jest.fn(async () => []), obserwuj: jest.fn(() => () => {}) } as unknown as Sklep;

test('poz. 17: +1 na liczniku nad „Dziś”, potem powrót („Dziś” na wierzchu) → karta pokazuje 1, nie 0', async () => {
  const s = await przygotuj();
  const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 0)]);
  const k = kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity, zegarek }, { t: i.t, jezyk: i.jezyk, zegar24h: () => true }, { wibracje: () => true });
  expect((await k.przygotuj()).ok).toBe(true);
  await k.otworz('l1');
  const cykl = atrapaCyklu().cykl;
  const system = atrapaSystemu();
  const ekran = (dzisNaWierzchu: boolean) => (
    <Aplikacja porty={{ sklep, ekranAktywny: { wlacz: jest.fn(), wylacz: jest.fn() }, haptyka: atrapaHaptyki() }} uslugi={k.uslugi} dzialania={k.dzialania} cykl={cykl} system={system} oglos={jest.fn()} t={i.t}
      naWierzchu={false} dzisNaWierzchu={dzisNaWierzchu} />
  );
  const r = render(ekran(true));
  await waitFor(() => expect(screen.getByTestId('dzis-wartosc')).toHaveTextContent('0'));
  r.rerender(ekran(false)); // push „/licznik”: „Dziś” pod spodem
  await act(async () => { expect((await k.uslugi.dodajRzad()).ok).toBe(true); }); // +1 na ekranie licznika
  r.rerender(ekran(true)); // powrót (przycisk albo gest od krawędzi)
  await waitFor(() => expect(screen.getByTestId('dzis-wartosc')).toHaveTextContent('1'), { timeout: 3000 });
});
