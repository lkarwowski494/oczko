// P-282 (W1-A zawężony): panel E2E dodaje wzór z .docx z tabelą i z obrazem (korpus W1), źródło `word` z plikiem .docx.
import React from 'react';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PanelWzoru } from '../../src/kompozycja/e2e/panele';

test.each(['tabela', 'obraz', 'strony'] as const)('e2e-wzor-word-%s → naDodaj(word) z plikiem korpusu W1', (r) => {
  const naDodaj = jest.fn();
  render(<PanelWzoru katalogTymczasowy={mkdtempSync(join(tmpdir(), 'oczko-e2e-'))} naDodaj={naDodaj} />);
  fireEvent.press(screen.getByTestId(`e2e-wzor-word-${r}`));
  expect(naDodaj).toHaveBeenCalledTimes(1);
  const w = naDodaj.mock.calls[0][0];
  expect(w.zrodlo.rodzaj).toBe('word');
  expect(readFileSync(w.zrodlo.plik.sciezka).equals(readFileSync(`modules/oczko-wzor/TestyOknaMaszyn/Testy/korpus/${r}.docx`))).toBe(true);
});
