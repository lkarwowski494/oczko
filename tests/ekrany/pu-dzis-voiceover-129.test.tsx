// PU-129 („VoiceOver”): każdy element „Dziś” ma etykietę z treścią (nie nazwę typu ani pliku); „+1” czytane „+1 row…”.
// Poziom: komponentowy, prawdziwy ekran `Dzis` w pełnym stanie (karta z dzianiną, tydzień, kafle, pasek); przegląd wszystkich elementów dostępnych dla VoiceOver.
import React from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { Dzis, type DaneDzis, type PropsDzis } from '../../src/ekrany/Dzis';
import { atrapaHaptyki, plusOk, stanLicznika, tEn } from './pomoc';

const DANE: DaneDzis = {
  data: 'Thursday, November 5', pustyTydzien: false, dni: { zostalo: 3, limit: 5, miesiac: 'November' }, wToku: 3, miejsce: 'licznik', rzedyDzis: 4, coDalej: null,
  tydzien: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((s, i) => ({ dzien: `2026-11-0${i + 2}`, skrot: s[0]!, dziergany: i < 3, dzis: i === 3, a11y: `${s} Nov ${i + 2}${i < 3 ? ', crafting day' : ''}` })),
} as unknown as DaneDzis;

// PU-129: karta „Left sleeve: 42 of 96 rows done, today 4”, „+1 row, when row 43 is done”, „Continue”, „Guide”, „Settings”; żadna etykieta nie jest nazwą typu ani pliku, a każdy przycisk ma nazwę.
test('PU-129: elementy „Dziś” mają etykiety z treścią („+1 row…”, „Continue”, „Guide”, „Settings”, opis karty), bez nazw typów i plików', async () => {
  const t = await tEn();
  const props: PropsDzis = {
    stan: stanLicznika({ projekt: 'Mist Sweater', czesc: 'Left sleeve', skonczone: 42, dziergany: 43, cel: 96 }), dane: DANE, t, oglos: jest.fn(), haptyka: atrapaHaptyki(),
    naPlus: jest.fn(async () => plusOk(43)), naCofnijSerie: jest.fn(), naOferty: jest.fn(), naKontynuuj: jest.fn(), naWybierzProjekt: jest.fn(), naUstawienia: jest.fn(), naPrzewodnik: jest.fn(), naKafel: jest.fn(),
  };
  render(<Dzis {...props} />);
  act(() => { // układ karty: kolumna dzianiny pojawia się po pomiarze (onLayout), jak na urządzeniu
    for (const w of screen.UNSAFE_root.findAll((n) => typeof n.type === 'string' && typeof n.props.onLayout === 'function')) w.props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 96, height: 160 } } });
  });
  expect(screen.getByTestId('dzis-plus').props.accessibilityLabel).toMatch(/^\+1 row/);
  expect(screen.getByTestId('dzis-kontynuuj').props.accessibilityLabel).toBe('Continue');
  expect(screen.getByTestId('nav-przewodnik').props.accessibilityLabel).toBe('Guide');
  expect(screen.getByTestId('nav-ustawienia').props.accessibilityLabel).toBe('Settings');
  const etykiety = screen.UNSAFE_root.findAll((n) => typeof n.type === 'string' && typeof n.props.accessibilityLabel === 'string').map((n) => n.props.accessibilityLabel as string);
  expect(etykiety.some((e) => /^Left sleeve: 42 of 96 rows done, today 4/.test(e))).toBe(true);
  expect(etykiety.some((e) => /Nov 2, crafting day/.test(e))).toBe(true);
  expect(etykiety.filter((e) => /\.(png|jpe?g|svg)\b|^(image|img|button|text|view)$/i.test(e.trim()))).toEqual([]);
  const przyciski = screen.getAllByRole('button').concat(screen.queryAllByRole('link'));
  expect(przyciski.length).toBeGreaterThanOrEqual(8);
  for (const p of przyciski) {
    const nazwa = (p.props.accessibilityLabel as string | undefined) ?? '';
    expect(nazwa.trim().length).toBeGreaterThan(0);
  }
});
