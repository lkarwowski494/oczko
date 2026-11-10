// B3-03 (P-664, fix11): „Next part” leżało w przewijanej treści i w pierwszym widoku trafiało w połowie pod stałą strefę licznika (E2E 34: stuknięcie w środek
// trafiało w stoper). Teraz jest pierwszym elementem strefy (`licznik-strefa`), nad rzędem akcji (od AX3 nad −1/+1), bez duplikatu w treści.
// Jest nie liczy układu: testy sprawdzają przynależność do kontenera strefy i kolejność; położenie na ekranie potwierdza E2E 34 na macOS.
import React from 'react';
import * as RN from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import { Licznik } from '../../src/ekrany/Licznik';
import type { StanEkranuLicznika } from '../../src/ekrany/Licznik';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { MAX_SKALA_TYTULOWA } from '../../src/ekrany/motyw';
import tokeny from '../../docs/design/tokeny.json';
import { atrapaHaptyki, plusOk, stanLicznika, tEn, wywolaniaLicznika } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
let mockSkala = 1;
afterEach(() => { mockSkala = 1; });
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 390, height: 844, scale: 3, fontScale: mockSkala }) }));

const plasko = (s: unknown) => (RN.StyleSheet.flatten(s as RN.StyleProp<RN.ViewStyle & RN.TextStyle>) ?? {}) as RN.ViewStyle & RN.TextStyle;
const wywolania = wywolaniaLicznika;
const rysuj = (stan: Partial<StanEkranuLicznika>, oglos = jest.fn(), w = wywolania()) => {
  const r = render(<Licznik stan={stanLicznika({ projekt: 'Harbor', czesc: 'Left sleeve', cel: 3, ...stan })} t={t} oglos={oglos} haptyka={atrapaHaptyki()} {...w} />);
  return { ...r, oglos, w };
};
const idy = (korzen: ReactTestInstance) => korzen.findAll((n) => typeof n.props.testID === 'string' && typeof n.type === 'string').map((n) => n.props.testID as string);
const OSIAGNIETY = { skonczone: 3, dziergany: 4 };

test.each([[1, 'licznik-akcje'], [2.643, 'licznik-przyciski'], [3.571, 'licznik-przyciski']])(
  'cel osiągnięty, fontScale %s: „Next part” jest w strefie przed %s i nie ma go w przewijanej treści',
  (skala, nastepny) => {
    mockSkala = skala;
    rysuj(OSIAGNIETY);
    const strefa = screen.getByTestId('licznik-strefa');
    const wStrefie = idy(strefa);
    expect(wStrefie).toContain('licznik-nastepna-czesc');
    expect(wStrefie.indexOf('licznik-nastepna-czesc')).toBeLessThan(wStrefie.indexOf(nastepny));
    expect(idy(screen.UNSAFE_getByType(RN.ScrollView))).not.toContain('licznik-nastepna-czesc');
    expect(screen.getAllByTestId('licznik-nastepna-czesc')).toHaveLength(1);
  });

test('przed osiągnięciem celu „Next part” nie istnieje', () => {
  rysuj({ skonczone: 2, dziergany: 3 });
  expect(screen.queryByTestId('licznik-nastepna-czesc')).toBeNull();
  expect(screen.getByTestId('licznik-strefa')).toBeTruthy();
});

test('etykieta „Next part” z limitem skali tytułów, minHeight ≥ cele.minimum, stuknięcie wywołuje przejście (F-52)', () => {
  mockSkala = 3.571;
  const { w } = rysuj(OSIAGNIETY);
  expect(screen.getByText('Next part').props.maxFontSizeMultiplier).toBe(MAX_SKALA_TYTULOWA);
  expect(plasko(screen.getByTestId('licznik-nastepna-czesc').props.style).minHeight).toBeGreaterThanOrEqual(tokeny.cele.minimum);
  fireEvent.press(screen.getByTestId('licznik-nastepna-czesc'));
  expect(w.naNastepnaCzesc).toHaveBeenCalledTimes(1);
});

describe('ogłoszenie VoiceOver „Goal reached”', () => {
  const ogloszeniaCelu = (o: jest.Mock) => o.mock.calls.filter(([tekst]) => tekst === 'Goal reached');
  test('dokładnie raz przy „+1” osiągającym cel; ani przy kolejnym „+1” ponad cel', async () => {
    const wyniki = [plusOk(3, { zdarzenia: ['rzad', 'cel-czesci'] }), plusOk(4)];
    const { oglos } = rysuj({ skonczone: 2, dziergany: 3 }, jest.fn(), wywolania(async () => wyniki.shift() ?? plusOk(5)));
    fireEvent.press(screen.getByTestId('licznik-plus'));
    await waitFor(() => expect(ogloszeniaCelu(oglos)).toHaveLength(1));
    fireEvent.press(screen.getByTestId('licznik-plus'));
    await waitFor(() => expect(oglos.mock.calls.length).toBeGreaterThanOrEqual(3));
    expect(ogloszeniaCelu(oglos)).toHaveLength(1);
  });
  test('otwarcie licznika z osiągniętym celem: bez ogłoszenia', () => {
    const { oglos } = rysuj(OSIAGNIETY);
    expect(oglos).not.toHaveBeenCalled();
  });
});
