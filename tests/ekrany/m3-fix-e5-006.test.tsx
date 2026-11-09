// M3 fix E5, 006 (P-614 (1) A; design-spec „Fix E5”): jeden wygląd „wstecz” — `chevron.backward` + nazwa w `akcentTekst`, 400 (jak makieta `ekrany.html:30` `.nav a`);
// korzenie zakładek (Dziś, Projekty, Narzędzia, Historia) bez „wstecz”. Wyjątki nazwane: pasek wzoru sama strzałka (007); ekran wczytywania na czerni — kolor `systemCzarny.tekst`.
import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { StyleSheet } from 'react-native';
import { render, screen, within } from '@testing-library/react-native';
import { Wstecz } from '../../src/ekrany/Pasek';
import { kolorJasny } from '../../src/ekrany/motyw';

const H = { includeHiddenElements: true };

test('006 Wstecz bez `kolor`: symbol i tekst w akcentTekst, bez pogrubienia', () => {
  render(<Wstecz tekst="Today" onPress={jest.fn()} />);
  const el = screen.getByTestId('nav-wstecz');
  expect(within(el).getByTestId(/^symbol-/, H).props.color ?? within(el).getByTestId(/^symbol-/, H).props.tintColor).toBe(kolorJasny.akcentTekst);
  const tekst = StyleSheet.flatten(within(el).getByText('Today').props.style) as Record<string, unknown>;
  expect(tekst.color).toBe(kolorJasny.akcentTekst);
  expect(tekst.fontWeight).toBeUndefined();
});

test.each(['dni', 'narzedzia', 'index', 'projekty'])('006 korzeń zakładki app/(zakladki)/%s.tsx nie przekazuje naWstecz (bez „wstecz”)', (plik) => {
  const zrodlo = readFileSync(join(__dirname, '../../app/(zakladki)', `${plik}.tsx`), 'utf8');
  expect(zrodlo).not.toMatch(/naWstecz/);
});
