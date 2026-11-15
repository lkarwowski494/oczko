// PU-279 (katalog przypadków użycia, „Licznik”): stoper zapomniany na 8 godzin zostaje zatrzymany przy starcie aplikacji; licznik pokazuje „The timer ran for 8 hours, so Oczko stopped it.”,
// „Check the end time” otwiera arkusz „Oczko stopped this timer after 8 hours…”, koniec o 1 h 30 min po starcie → po „Save” sesja „Edited”, 1 h 30 min, linia znika.
// Trasy app/licznik (z prawdziwym stoperem), app/sesja-korekta i app/sesje na prawdziwej bazie; start aplikacji = uruchomDane (domknięcie zapomnianych sesji).
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { migruj } from '../../src/dane/migracje/migruj';
import { sesjaDoSprawdzenia } from '../../src/przypadki-uzycia/sesja';
import { uruchomDane } from '../../src/przypadki-uzycia/start';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { GODZ, MIN, T0, wykonaj } from '../dane/pomocnicze/srodowisko';
import { tekst } from './pomoc';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), dismissTo: jest.fn(), navigate: jest.fn(), canGoBack: () => true };
let mockParams: Record<string, string> = {};
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 402, height: 874, scale: 3, fontScale: 1 }) }));
jest.mock('expo-router', () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(),
  useRouter: () => mockRouter, useLocalSearchParams: () => mockParams, usePathname: () => '/', useIsFocused: () => true,
  useFocusEffect: (f: () => void) => { const R = require('react') as typeof import('react'); R.useEffect(f, [f]); }, // eslint-disable-line @typescript-eslint/no-require-imports
}));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/SkrzynkaNaEkranie', () => ({ SkrzynkaNaEkranie: () => null }));
jest.mock('../../src/kompozycja/miniatury', () => ({ miniaturyWzorow: async () => ({}) }));
jest.mock('../../src/kompozycja/system', () => {
  const p = jest.requireActual('./pomoc') as typeof import('./pomoc');
  return { cyklAplikacji: p.atrapaCyklu().cykl, oglos: jest.fn(), systemAplikacji: p.atrapaSystemu() };
});
/* eslint-disable @typescript-eslint/no-require-imports */
const EkranKorekty = (require('../../app/sesja-korekta') as { default: React.ComponentType }).default;
const EkranLicznika = (require('../../app/licznik') as { default: React.ComponentType }).default;
const EkranSesji = (require('../../app/sesje') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */



test('PU-279: zapomniany stoper zatrzymany po 8 h → linia „The timer ran for 8 hours…” → „Check the end time” → koniec 1 h 30 min po starcie → „Edited”, 1 h 30 min, linia znika', async () => {
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj(s.baza, [projekt('p1', 'Sweater'), czesc('c1', 'p1', 'Back'), ...licznik('l1', 'c1', 3),
    ["INSERT INTO sesja (id, projekt_id, stan, start_ms, strefa, dzien) VALUES ('s1', 'p1', 'trwa', ?, 'Europe/Warsaw', '2026-10-22')", [T0]]]);
  s.zegar.ustaw(T0 + 13 * GODZ); // „zabij aplikację → start 13 h później”
  expect(await uruchomDane({ ...s.z, migruj: (b) => migruj(b) })).toMatchObject({ ok: true, wartosc: { domknieteSesje: 1 } });
  await k.otworz('l1');
  mockAplikacja = { kontener: { z: s.z, j, porty: { haptyka: { zagraj: jest.fn() }, ekranAktywny: { wlacz: jest.fn(), wylacz: jest.fn() } }, dostep: { stan: () => ({ poziom: 'darmowa' }) } }, licznik: k, preferencje: { stan: () => ({ wibracje: false }) } };
  Object.values(mockRouter).forEach((f) => typeof f === 'function' && 'mockClear' in f && (f as jest.Mock).mockClear());

  const przedKorekta = render(<EkranLicznika />);
  expect(await screen.findByText('The timer ran for 8 hours, so Oczko stopped it.')).toBeTruthy();
  fireEvent.press(screen.getByTestId('stoper-sprawdz'));
  expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/sesja-korekta', params: { sesja: 's1', projekt: 'p1' } });
  przedKorekta.unmount();

  mockParams = { sesja: 's1', projekt: 'p1' };
  render(<EkranKorekty />);
  await waitFor(() => screen.getByTestId('formularz-sesja-koniec'));
  expect(screen.getByText('Oczko stopped this timer after 8 hours. Set when you really stopped.')).toBeTruthy();
  fireEvent.press(screen.getByTestId('formularz-sesja-koniec'));
  fireEvent(screen.getByTestId('formularz-sesja-koniec-wybor'), 'onValueChange', { type: 'set', nativeEvent: {} }, new Date(T0 + 90 * MIN));
  expect(screen.getByText('Project time after saving: 1 h 30 min.')).toBeTruthy();
  await act(async () => { fireEvent.press(screen.getByText('Save')); await new Promise((r) => setTimeout(r, 150)); });
  expect(mockRouter.back).toHaveBeenCalled();
  expect(await s.baza.all('SELECT koniec_ms - start_ms AS ms, skorygowano, do_korekty FROM sesja WHERE id = ?', ['s1'])).toEqual([{ ms: 90 * MIN, skorygowano: 1, do_korekty: 0 }]);
  screen.unmount();

  mockParams = { projekt: 'p1' };
  const lista = render(<EkranSesji />);
  await waitFor(() => expect(screen.getAllByText('Edited')).toHaveLength(1));
  expect(screen.queryByTestId('sesje-do-sprawdzenia')).toBeNull();
  expect(tekst(screen.getByTestId('sesje-lista'))).toContain('1 h 30 min');
  lista.unmount();

  // linia na liczniku znika, bo sesja nie jest już „do sprawdzenia” (sam moduł pamięta też, że korektę otwarto, więc pytamy przypadek użycia, nie ekran)
  expect(await sesjaDoSprawdzenia(s.z, { projektId: 'p1' })).toEqual({ ok: true, wartosc: null });
});
