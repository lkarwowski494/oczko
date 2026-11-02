// P2-7 (Aneks P2 poz. 5, 04, P-368): błąd zapisu poza licznikiem i wzorem mówi, co się nie udało (tytuł wg miejsca) i ma wspólną drugą linię;
// „Couldn’t save that row” (`licznik.blad_zapisu`) zostaje tylko na liczniku i pasku licznika pod wzorem.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { FormularzNowegoProjektu } from '../../src/ekrany/FormularzeProjektu';
import { FormularzDrutu } from '../../src/ekrany/Zapas';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

const KORZEN = join(__dirname, '../..');
let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const nieudany = () => jest.fn(async () => ({ ok: false as const, powod: 'zapis' as const }));

const pliki = (katalog: string): string[] => readdirSync(katalog).flatMap((n) => {
  const p = join(katalog, n);
  return statSync(p).isDirectory() ? pliki(p) : /\.tsx?$/.test(n) ? [p] : [];
});

test('`licznik.blad_zapisu` występuje w kodzie tylko na liczniku i pasku licznika pod wzorem', () => {
  const trafienia = [...pliki(join(KORZEN, 'src')), ...pliki(join(KORZEN, 'app'))]
    .filter((p) => /['"]licznik\.blad_zapisu['"]/.test(readFileSync(p, 'utf8')))
    .map((p) => p.slice(KORZEN.length + 1))
    .sort();
  expect(trafienia).toEqual(['src/ekrany/Licznik.tsx', 'src/ekrany/WzorLicznik.tsx']);
});

test('formularz projektu: nieudany zapis pokazuje tytuł „Couldn’t save your changes” i wspólny opis, arkusz zostaje z wpisaną nazwą', async () => {
  const naZapisz = nieudany();
  render(<FormularzNowegoProjektu t={t} naZapisz={naZapisz} naAnuluj={jest.fn()} />);
  fireEvent.changeText(screen.getByLabelText('Project'), 'Harbor');
  fireEvent.press(screen.getByTestId('formularz-zapisz'));
  await waitFor(() => expect(screen.getByText('Couldn’t save your changes')).toBeTruthy());
  expect(screen.getByText('Your device may be out of space. Nothing was changed. Free some space and try again.')).toBeTruthy();
  expect(screen.queryByText(/save that row/)).toBeNull();
  expect(screen.getByLabelText('Project').props.value).toBe('Harbor');
});

test('formularz zapasu (druty): ten sam tytuł i opis', async () => {
  render(<FormularzDrutu t={t} poczatek={null} podglad={() => null} parsuj={() => null} formatuj={String} naZapisz={nieudany()} naAnuluj={jest.fn()} />);
  fireEvent.press(screen.getByTestId('formularz-zapisz'));
  await waitFor(() => expect(screen.getByText('Couldn’t save your changes')).toBeTruthy());
  expect(screen.getByText('Your device may be out of space. Nothing was changed. Free some space and try again.')).toBeTruthy();
});
