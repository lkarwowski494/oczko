// CP-02 (08-programista-002, KO-149): pełny stan z „+1” (`wartosc.stan`, BX20) trafia na ekran przez `naPlus` w `useStanLicznika` (src/ekrany/Aplikacja.tsx).
// Jak odczyt po +1/−1 (`odswiez`, FX6b), wynik „+1” rozpoczętego wcześniej, a kończącego się po nowszym, nie może nadpisać nowszego stanu starszym.
// Drugi test pilnuje granicy straży: nowszy „+1” zakończony niepowodzeniem (np. limit) niczego nie zatwierdza, więc stan starszego „+1” ma dojść do ekranu.
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { EkranLicznika } from '../../src/ekrany/Aplikacja';
import type { StanEkranuLicznika, WynikPlus } from '../../src/ekrany/Licznik';
import { atrapaHaptyki, odroczona, plusOk, stanLicznika, tEn } from './pomoc';

const tresc = (id: string): string => { const e = screen.getByTestId(id); return String(e.props.accessibilityValue?.text ?? e.props.accessibilityLabel ?? e.props.children); };

async function uklad() {
  const t = await tEn();
  const stan = (n: number): StanEkranuLicznika => stanLicznika({ skonczone: n, dziergany: n + 1 });
  const zapisy: ReturnType<typeof odroczona<WynikPlus>>[] = [];
  const dodajRzad = jest.fn(() => { const o = odroczona<WynikPlus>(); zapisy.push(o); return o.obietnica; });
  const uslugi = { start: async () => ({ licznik: stan(0), ekranWlaczony: true }), dodajRzad };
  render(<EkranLicznika t={t} oglos={jest.fn()} porty={{ haptyka: atrapaHaptyki() }} uslugi={uslugi} dzialania={{}} jezyk="en" />);
  await screen.findByTestId('licznik-plus');
  const wynik = (n: number) => plusOk(n, { stan: stan(n) });
  return { zapisy, wynik };
}

test('CP-02: starszy „+1” kończący się po nowszym nie nadpisuje nowszego pełnego stanu', async () => {
  const { zapisy, wynik } = await uklad();
  await act(async () => { fireEvent.press(screen.getByTestId('licznik-plus')); });
  await act(async () => { fireEvent.press(screen.getByTestId('licznik-plus')); });
  expect(zapisy).toHaveLength(2);
  await act(async () => { zapisy[1]!.rozwiaz(wynik(2)); }); // nowszy kończy się pierwszy
  await act(async () => { zapisy[0]!.rozwiaz(wynik(1)); }); // starszy (wartość 1) dociera po nim
  expect(tresc('licznik-wartosc')).toContain('2');
  expect(tresc('licznik-wartosc')).not.toContain('1');
});

test('CP-02: nowszy „+1” zakończony niepowodzeniem nie odbiera ekranowi stanu starszego, udanego „+1”', async () => {
  const { zapisy, wynik } = await uklad();
  await act(async () => { fireEvent.press(screen.getByTestId('licznik-plus')); });
  await act(async () => { fireEvent.press(screen.getByTestId('licznik-plus')); });
  await act(async () => { zapisy[0]!.rozwiaz(wynik(1)); });
  await act(async () => { zapisy[1]!.rozwiaz({ ok: false, powod: 'zapis' }); });
  expect(tresc('licznik-wartosc')).toContain('1');
});

// CQ-01 (08-programista-001): odczyt stanu rozpoczęty PRZED „+1” i kończący się PO jego zatwierdzeniu nie nadpisuje stanu po „+1” starym wynikiem
// (licznik `wydanie` unieważnia odczyt; w `naPlus` robi to `wydanie.current += 1`). Odczyt wyzwala powrót z innej karty (`poScaleniu`, R-020).
test('CQ-01: odczyt stanu w toku, „+1” zatwierdzone, odczyt kończy się starym wynikiem — ekran zostaje przy stanie po „+1”', async () => {
  const t = await tEn();
  const stan = (n: number): StanEkranuLicznika => stanLicznika({ skonczone: n, dziergany: n + 1 });
  const zapis = odroczona<WynikPlus>();
  const odczyt = odroczona<StanEkranuLicznika>();
  const dodajRzad = jest.fn(() => zapis.obietnica);
  const odswiez = jest.fn(() => odczyt.obietnica);
  let wyzwolOdczyt: () => void = () => undefined;
  const poScaleniu = (f: () => void) => { wyzwolOdczyt = f; return () => undefined; };
  const uslugi = { start: async () => ({ licznik: stan(0), ekranWlaczony: true }), dodajRzad };
  render(<EkranLicznika t={t} oglos={jest.fn()} porty={{ haptyka: atrapaHaptyki() }} uslugi={uslugi} dzialania={{ odswiez }} poScaleniu={poScaleniu} jezyk="en" />);
  await screen.findByTestId('licznik-plus');
  await act(async () => { wyzwolOdczyt(); }); // odczyt rusza (stan sprzed „+1”) i czeka
  expect(odswiez).toHaveBeenCalledTimes(1);
  await act(async () => { fireEvent.press(screen.getByTestId('licznik-plus')); });
  await act(async () => { zapis.rozwiaz(plusOk(1, { stan: stan(1) })); }); // „+1” zatwierdzone z pełnym stanem
  expect(tresc('licznik-wartosc')).toContain('1');
  await act(async () => { odczyt.rozwiaz(stan(0)); }); // odczyt kończy się starym wynikiem
  expect(tresc('licznik-wartosc')).toContain('1');
  expect(tresc('licznik-wartosc')).not.toContain('0');
});
