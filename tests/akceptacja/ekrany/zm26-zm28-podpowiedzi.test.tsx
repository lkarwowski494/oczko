// PU-030, PU-016 (zmienione 1.0.2). ZM-26 (U10, P-1101): podpowiedź pod typem „Oczka” w „Dodaj licznik”; ZM-28 (W0, P-1112): zdanie pod
// listą źródeł w „Dodaj wzór” (`wzor-podpowiedz-tekst`). Wyrocznia: teksty en z docs/design/1-0-2.md (tabela kluczy `formularz.rodzaj_oczka_opis`,
// `wzor.podpowiedz_tekst`), makiety u6-dodaj-licznik i z28-wzor-zrodla.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { FormularzLicznika } from '../../../src/ekrany/FormularzeProjektu';
import { GrupaWzorow } from '../../../src/ekrany/WzorGrupa';
import type { Tlumacz } from '../../../src/ekrany/wspolne';
import { tEn } from '../../ekrany/pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

test('ZM-26 PU-030: pod „Stitches” w „Add counter” widać „For example, a chain or casting on.” jako część etykiety radia dla VoiceOver', () => {
  render(<FormularzLicznika t={t} czesci={[{ id: 'c1', nazwa: 'Front' }]} domyslnaCzesc="c1" naZapisz={jest.fn()} naAnuluj={jest.fn()} />);
  expect(screen.getByText('For example, a chain or casting on.')).toBeTruthy();
  const radio = screen.getByTestId('wybor-rodzaj-oczka');
  expect(String(radio.props.accessibilityLabel ?? '')).toContain('For example, a chain or casting on.');
});

test('ZM-28 PU-016: w „Add pattern” pod listą źródeł zdanie o rozpisce tekstem (`wzor-podpowiedz-tekst`), bez nowej akcji', () => {
  render(<GrupaWzorow t={t} wzory={[]} oczekujace={[]} skaner={false} menuOtwarte naOtworz={jest.fn()} naDodaj={jest.fn()} naUsunOczekujacy={jest.fn()} />);
  const zdanie = screen.getByTestId('wzor-podpowiedz-tekst');
  expect(zdanie.props.children).toBe('Pattern written out as text? Paste it into a note — the Note button on the counter.');
  expect(zdanie.props.accessibilityRole).not.toBe('button');
});
