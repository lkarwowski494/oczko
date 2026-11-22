// M1-audytor-generalny-067 (07-jakosc-002, P-439 (1a)): panel E2E dodaje wzór z prawdziwego wycinka skanu (tests/dane/wzory/corbould-1879-s16-17.pdf),
// źródło `pdf` z plikiem .pdf — scenariusz 21 importuje go zamiast PDF pisanego w kodzie.
import React from 'react';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PanelWzoru } from '../../src/kompozycja/e2e/panele';

test('e2e-wzor-pdf-skan → naDodaj(pdf) z plikiem wycinka skanu z tests/dane', () => {
  const naDodaj = jest.fn();
  render(<PanelWzoru katalogTymczasowy={mkdtempSync(join(tmpdir(), 'oczko-e2e-'))} naDodaj={naDodaj} />);
  fireEvent.press(screen.getByTestId('e2e-wzor-pdf-skan'));
  expect(naDodaj).toHaveBeenCalledTimes(1);
  const w = naDodaj.mock.calls[0][0];
  expect(w.zrodlo.rodzaj).toBe('pdf');
  expect(w.zrodlo.plik.nazwa).toMatch(/\.pdf$/);
  expect(w.zrodlo.plik.typ).toBe('application/pdf');
  expect(readFileSync(w.zrodlo.plik.sciezka).equals(readFileSync('tests/dane/wzory/corbould-1879-s16-17.pdf'))).toBe(true);
});
