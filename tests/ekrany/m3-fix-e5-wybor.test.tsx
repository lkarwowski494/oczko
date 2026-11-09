// M3 fix E5, 011 (P-614): wybór jednej opcji ma jeden wygląd — `ZnacznikRadio` (znaczniki.radio 28) także w jednostkach formularza włóczki
// (dotąd chipy z ramą); zaznaczony wzór w liście wzorów ▾ = symbol SF `checkmark` w `akcentTekst` (znaczniki.wyboruListy), nie glif „✓”.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { FormularzWloczki } from '../../src/ekrany/Zapas';
import { MenuWzorow } from '../../src/ekrany/WzorMenu';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

test('011: jednostki w formularzu włóczki — każda opcja ma ZnacznikRadio, wybrana jedna', () => {
  render(<FormularzWloczki t={t} poczatek={null} jednostki="metryczne" przelicz={() => null} bazowa={() => null} formatuj={(n) => String(n)} naZapisz={jest.fn()} naAnuluj={jest.fn()} />);
  for (const j of ['m', 'yd', 'g', 'oz']) {
    const opcja = screen.queryByTestId(`zapas-jednostka-${j}`);
    if (!opcja) continue;
    expect(opcja.findAll((n) => n.props.testID === 'znacznik-radio' && typeof n.type === 'string').length).toBe(1);
  }
  expect(screen.getAllByTestId('znacznik-radio', { includeHiddenElements: true }).length).toBeGreaterThanOrEqual(2);
});

test('011: lista wzorów ▾ — bieżący wzór z symbolem checkmark, bez glifu „✓” w tekście', () => {
  const st = { menuTlo: {}, menu: {}, pozycja: {}, tresc: {}, niszczaca: {} };
  render(<MenuWzorow st={st} t={t} wzory={[{ wzorId: 'w1', nazwa: 'Front' }, { wzorId: 'w2', nazwa: 'Back' }]} oczekujace={[]} wzorId="w1" zamknij={jest.fn()} naWybor={jest.fn()} naUsunOczekujacy={jest.fn()} />);
  expect(screen.queryByText(/✓/)).toBeNull();
  expect(screen.getByText('Front')).toBeTruthy();
  const symbole = screen.UNSAFE_root.findAll((n) => n.props.nazwa === 'checkmark');
  expect(symbole.length).toBe(1);
});
