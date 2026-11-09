// 04-studio-projektowe-002 (P1, reaudyt 04 9.11, P-627): w arkuszu decyzji z `zamknij` (Oferty) nagłówek — tytuł i ✕ — stoi nad przewijaną treścią
// jak w `ArkuszMenu` (src/ekrany/MenuLista.tsx); po przewinięciu do „Restore purchases” ✕ zostaje w zasięgu. Bez `zamknij` tytuł zostaje w treści.
import React from 'react';
import { ScrollView, Text } from 'react-native';
import { render, screen, within } from '@testing-library/react-native';
import { Arkusz } from '../../src/ekrany/Arkusz';

const zamknij = { etykieta: 'Close', naZamknij: jest.fn(), testID: 'oferty-zamknij' };

test('002: z `zamknij` nagłówek (tytuł + ✕) nie leży w ScrollView, treść tak', () => {
  render(<Arkusz tytul="Oczko Pro" zamknij={zamknij} testID="oferty"><Text testID="tresc-arkusza">Plan</Text></Arkusz>);
  const przewijane = screen.UNSAFE_getAllByType(ScrollView);
  expect(przewijane).toHaveLength(1);
  const sv = przewijane[0]!;
  expect(within(sv).queryByTestId('arkusz-naglowek-decyzji')).toBeNull();
  expect(within(sv).queryByTestId('oferty-zamknij')).toBeNull();
  expect(within(sv).getByTestId('tresc-arkusza')).toBeTruthy();
  const naglowek = screen.getByTestId('arkusz-naglowek-decyzji');
  expect(within(naglowek).getByText('Oczko Pro')).toBeTruthy();
  expect(within(naglowek).getByTestId('oferty-zamknij')).toBeTruthy();
});

test('002: bez `zamknij` tytuł zostaje w treści przewijanej (jak dotąd)', () => {
  render(<Arkusz tytul="Delete project?"><Text>Body</Text></Arkusz>);
  const sv = screen.UNSAFE_getAllByType(ScrollView)[0]!;
  expect(within(sv).getByText('Delete project?')).toBeTruthy();
  expect(screen.queryByTestId('arkusz-naglowek-decyzji')).toBeNull();
});
