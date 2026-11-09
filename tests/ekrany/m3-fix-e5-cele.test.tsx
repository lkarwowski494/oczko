// M3 fix E5: 013 — odnośnik do Oczko Pro na liczniku (`limit-oferta-link`) ma cel dotyku ≥ cele.minimum (44 pt, wzór Dzis.tsx);
// 012 — wyłączony stoper w rzędzie akcji: przerywana rama `przyciskNieaktywnyRama` + `accessibilityState.disabled`, nie samo przyciemnienie
// (design-spec Dzianina: „przerywana rama i ikona stanu, nigdy sam kolor”).
import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Licznik } from '../../src/ekrany/Licznik';
import { AkcjaLicznika } from '../../src/ekrany/LicznikAkcje';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import tokeny from '../../docs/design/tokeny.json';
import { atrapaHaptyki, stanLicznika, tEn, wywolaniaLicznika } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const plasko = (s: unknown) => (StyleSheet.flatten(s as never) ?? {}) as Record<string, unknown>;

test('012: stoper wyłączony — rama przerywana w kolorze przyciskNieaktywnyRama, disabled w dostępności, bez samego przyciemnienia', () => {
  render(<AkcjaLicznika symbol="stopwatch" podpis="Timer" wylaczony testID="licznik-stoper" duzyTekst={false} />);
  const a = screen.getByTestId('licznik-stoper');
  const s = plasko(a.props.style);
  expect(s.borderStyle).toBe('dashed');
  expect(s.borderColor).toBe(tokeny.kolory.jasny.przyciskNieaktywnyRama);
  expect(Number(s.borderWidth)).toBeGreaterThan(0);
  expect(s.opacity).toBeUndefined();
  expect(a.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));
});
