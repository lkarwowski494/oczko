// 04-studio-projektowe-023 (P1, reaudyt 04 9.11; P-627 decyzja A): linia konfliktu iCloud (`licznik-konflikt`) jest pierwszym elementem treści licznika
// — przed liczbą od AX3, przed „Projekt ›” i tytułem — w każdym rozmiarze tekstu, więc wybór wersji widać bez przewijania (E2E 49).
import React from 'react';
import * as RN from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Licznik } from '../../src/ekrany/Licznik';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { PROG_AX3 } from '../../src/ekrany/motyw';
import { atrapaHaptyki, stanLicznika, tEn, wywolaniaLicznika } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
afterEach(() => { mockSkala = 1; });
let mockSkala = 1;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 390, height: 844, scale: 3, fontScale: mockSkala }) }));

/** testID elementów treści przewijanej w kolejności drzewa (pre-order). */
const kolejnosc = () => screen.UNSAFE_getByType(RN.ScrollView).findAll((n) => typeof n.type === 'string' && typeof n.props.testID === 'string').map((n) => n.props.testID as string);

test.each([['zwykły', 1], ['AX1', 1.786], ['AX3', PROG_AX3], ['AX5', 3.571]])('023: przy konflikcie (%s) pierwszy element treści = licznik-konflikt', (_n, skala) => {
  mockSkala = skala;
  render(<Licznik stan={stanLicznika({ projekt: 'Harbor', czesc: 'Left sleeve', skonczone: 1, dziergany: 2, konflikt: { lokalna: 1, zdalna: 6, urzadzenie: 'iPad (test)' } })}
    t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...wywolaniaLicznika()} naKonflikt={jest.fn()} />);
  const ids = kolejnosc();
  expect(ids[0]).toBe('licznik-konflikt');
  expect(ids).toContain('licznik-wartosc');
});
