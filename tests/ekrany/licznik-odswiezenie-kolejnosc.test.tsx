// FX6b (P-909, ocena z kodu): `useStanLicznika` (src/ekrany/Aplikacja.tsx) po +1 i −1 odświeża stan z kompozycji (`odswiez`). Odczyt rozpoczęty po +1, a kończący
// się dopiero po „−1”, nie może nadpisać nowszej wartości ze stanu starszą (na wolnym telefonie odczyty kończą się w innej kolejności niż zaczęły).
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { EkranLicznika } from '../../src/ekrany/Aplikacja';
import type { StanEkranuLicznika } from '../../src/ekrany/Licznik';
import { atrapaHaptyki, odroczona, plusOk, stanLicznika, tEn } from './pomoc';

const tresc = (id: string): string => { const e = screen.getByTestId(id); return String(e.props.accessibilityValue?.text ?? e.props.accessibilityLabel ?? e.props.children); };

async function uklad() {
  const t = await tEn();
  let skonczone = 0;
  const stan = (n: number): StanEkranuLicznika => stanLicznika({ skonczone: n, dziergany: n + 1 });
  const odswiezenia: ReturnType<typeof odroczona<StanEkranuLicznika>>[] = [];
  const dzialania = {
    naMinus: async () => ({ ok: true as const, wartosc: { skonczone: --skonczone } }),
    odswiez: () => { const o = odroczona<StanEkranuLicznika>(); odswiezenia.push(o); return o.obietnica; },
  };
  const uslugi = { start: async () => ({ licznik: stan(0), ekranWlaczony: true }), dodajRzad: async () => plusOk(++skonczone, { dziergany: skonczone + 1 }) };
  render(<EkranLicznika t={t} oglos={jest.fn()} porty={{ haptyka: atrapaHaptyki() }} uslugi={uslugi} dzialania={dzialania} jezyk="en" />);
  await screen.findByTestId('licznik-plus');
  return { stan, odswiezenia };
}

test('FX6b: starszy odczyt stanu (po +1) kończący się po „−1” nie przywraca wartości sprzed „−1”', async () => {
  const { stan, odswiezenia } = await uklad();
  expect(tresc('licznik-wartosc')).toContain('0');
  await act(async () => { fireEvent.press(screen.getByTestId('licznik-plus')); });
  await act(async () => { fireEvent.press(screen.getByTestId('licznik-minus')); });
  expect(odswiezenia).toHaveLength(2); // odczyt po +1 i odczyt po −1
  await act(async () => { odswiezenia[1]!.rozwiaz(stan(0)); }); // nowszy odczyt kończy się pierwszy
  await act(async () => { odswiezenia[0]!.rozwiaz(stan(1)); }); // starszy (z wartością 1) kończy się po nim
  expect(tresc('licznik-wartosc')).toContain('0');
  expect(tresc('licznik-wartosc')).not.toContain('1');
});
