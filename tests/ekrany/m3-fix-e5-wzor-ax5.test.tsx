// M3 fix E5, 07-p3 (AX5): menu wzoru bez wzoru (`GrupaWzorow` w app/wzor.tsx) przy AX5 ma ok. 2117 pt — źródła poza ekranem były nieosiągalne,
// bo lista stała w zwykłym View. Poprawka: ScrollView wokół `GrupaWzorow`. Prawdziwa baza i kompozycja wzoru (jak wzor-trasa-czeka-w-liscie).
import React from 'react';
import * as RN from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { kompozycjaWzoru } from '../../src/kompozycja/wzor';
import { migawkaWKatalogu } from '../../src/platforma/migawka';
import { skrzynkaWKatalogu } from '../../src/platforma/skrzynka';
import { czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { kompozycjaTestowa } from '../dane/pomocnicze/kompozycja-licznika';
import { czasWTle, katalogTymczasowy, wykonaj } from '../dane/pomocnicze/srodowisko';

const mockRouter = { back: jest.fn(), replace: jest.fn(), push: jest.fn() };
jest.mock('expo-router', () => ({ useNavigation: () => (require('../narzedzia/expo-router-react-navigation') as typeof import('../narzedzia/expo-router-react-navigation')).useNavigation(), useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
const mockReact = React;
const mockRn = { View: RN.View };
jest.mock('../../modules/oczko-wzor', () => ({ WidokWzoruNatywny: () => mockReact.createElement(mockRn.View, { testID: 'wzor-pdf' }) }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const EkranWzoru = (require('../../app/wzor') as { default: React.ComponentType }).default;

test('07-p3 AX5: menu źródeł wzoru (projekt bez wzoru) leży w ScrollView — ostatnie źródło osiągalne przewinięciem', async () => {
  const { s, k, j } = await kompozycjaTestowa();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 5)]);
  await k.otworz('l1');
  const grupa = katalogTymczasowy('oczko-grupa-');
  const zw = { ...s.z, konwersja: { naPdf: jest.fn(), sprawdzPdf: jest.fn() }, czasWTle, skrzynka: skrzynkaWKatalogu(grupa, () => s.zegar.teraz().ms), migawka: migawkaWKatalogu(grupa, () => s.zegar.teraz().ms), jezyk: () => 'en' };
  const kw = kompozycjaWzoru(zw, { grupa, zlecenieE2e: null });
  mockAplikacja = { kontener: { z: s.z, j, wzor: { z: zw, k: kw, platforma: { skanerDostepny: () => false, wklej: async () => null } } }, licznik: k };
  render(<EkranWzoru />);
  const dodaj = await screen.findAllByTestId('wzor-dodaj');
  const ostatnie = dodaj[dodaj.length - 1];
  let n = ostatnie?.parent ?? null;
  let wScrollView = false;
  for (; n; n = n.parent) if (n.type === RN.ScrollView || (typeof n.type === 'string' && String(n.type) === 'RCTScrollView')) wScrollView = true;
  expect(wScrollView).toBe(true);
});
