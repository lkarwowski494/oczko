// M1-audytor-generalny-091 (02-monetyzacja-502, MON-11, KP-14, KP-03): po kupnie dożywotniego przy aktywnej subskrypcji stan dostępu
// oznacza, że subskrypcja nadal trwa, a Oferty i Ustawienia pokazują wtedy „Manage subscription” (tekst KP-03 każe ją anulować).
// Sam dożywotni — bez przycisku. Stan dostępu z prawdziwego `dostepPro` na sztucznym sklepie.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { dostepPro } from '../../src/kompozycja/dostep';
import { sklepSztuczny } from '../../src/platforma/sklep-sztuczny';
import { Oferty } from '../../src/ekrany/Oferty';
import { Ustawienia } from '../../src/ekrany/Ustawienia';
import type { AktywnePro } from '../../src/ekrany/Oferty';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaSystemu, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const TERAZ = Date.UTC(2026, 10, 10);

async function aktywneZeSklepu(produkty: string[]): Promise<AktywnePro> {
  const sklep = sklepSztuczny(() => TERAZ);
  for (const p of produkty) await sklep.kup(p);
  const dostep = dostepPro(sklep, { czytaj: async () => null, zapisz: async () => undefined }, () => TERAZ);
  return (await dostep.odswiez()).aktywne;
}
function oferty(aktywne: AktywnePro) {
  render(<Oferty stan={{ produkty: { rodzaj: 'gotowe', produkty: [] }, aktywne, familySharing: false }} t={t} adresy={{ polityka: 'https://example.invalid/p', warunki: 'https://example.invalid/w' }}
    naKup={jest.fn()} naPrzywroc={jest.fn()} naZarzadzaj={jest.fn()} naOtworzAdres={jest.fn()} naZamknij={jest.fn()} />);
}
function ustawienia(aktywne: AktywnePro) {
  render(<Ustawienia stan={{ pro: aktywne, dni: null, wibracje: true }} t={t} system={atrapaSystemu()} adresy={{ polityka: 'https://example.invalid/p', wsparcie: 'https://example.invalid/s', recenzja: 'https://example.invalid/r' }}
    naOferty={jest.fn()} naWibracje={jest.fn()} naZglosProblem={jest.fn()} naStanDanych={jest.fn()} />);
}
const zarzadzaj = () => screen.queryByRole('button', { name: 'Manage subscription' });

test('M1-091: dostęp z ważną subskrypcją i dożywotnim → rodzaj „dozywotni” z oznaczoną subskrypcją; sam dożywotni — bez oznaczenia', async () => {
  expect(await aktywneZeSklepu(['oczko.pro.monthly', 'oczko.pro.lifetime'])).toEqual({ rodzaj: 'dozywotni', subskrypcja: 'oczko.pro.monthly' });
  expect(await aktywneZeSklepu(['oczko.pro.lifetime'])).toEqual({ rodzaj: 'dozywotni' });
});

test('M1-091: Oferty — dożywotni + trwająca subskrypcja → „Manage subscription” widoczny; sam dożywotni → brak', async () => {
  oferty(await aktywneZeSklepu(['oczko.pro.monthly', 'oczko.pro.lifetime']));
  expect(screen.getByTestId('oferty-stan-pro')).toBeTruthy();
  expect(zarzadzaj()).toBeTruthy();
  screen.unmount();
  oferty(await aktywneZeSklepu(['oczko.pro.lifetime']));
  expect(zarzadzaj()).toBeNull();
});

test('M1-091: Ustawienia — dożywotni + trwająca subskrypcja → „Manage subscription” widoczny; sam dożywotni → brak', async () => {
  ustawienia(await aktywneZeSklepu(['oczko.pro.yearly', 'oczko.pro.lifetime']));
  expect(zarzadzaj()).toBeTruthy();
  screen.unmount();
  ustawienia(await aktywneZeSklepu(['oczko.pro.lifetime']));
  expect(zarzadzaj()).toBeNull();
});
