// M1-audytor-generalny-019 (09-lokalizacja-002, P-307): w „Zostało {{zostalo}} z {{limit}} darmowych dni” rzeczownik stoi po {{limit}}, więc formę
// liczby mnogiej wybiera `count = limit`, nie `zostalo`. Lista projektów i Ustawienia na prawdziwym t() w pl, ru, lt, cs przy limit = 5 i
// zostalo ∈ {0, 1, 2, 5}: nigdy forma pojedyncza przy „z 5” (pl „darmowego dnia”, ru „бесплатного дня”, lt „nemokamos … dienos”).
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ListaProjektow } from '../../src/ekrany/ListaProjektow';
import { Ustawienia } from '../../src/ekrany/Ustawienia';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaSystemu, tekst } from './pomoc';

const tDla = async (jezyk: string): Promise<Tlumacz> =>
  (await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => [jezyk], zasoby: ZASOBY })).t;
const POJEDYNCZA: Record<string, RegExp | null> = { pl: /darmowego dnia/, ru: /бесплатного дня/, lt: /nemokamos rankdarbio dienos/, cs: null };
const ADRESY = { polityka: 'https://example.invalid/oczko/privacy', recenzja: 'https://apps.apple.com/app/id0000000000?action=write-review' };

describe.each(Object.keys(POJEDYNCZA))('M1-019 %s: „z 5” zawsze z formą liczby mnogiej dla 5', (jezyk) => {
  let t: Tlumacz;
  beforeAll(async () => { t = await tDla(jezyk); });
  test.each([0, 1, 2, 5])('zostalo = %i: lista projektów i Ustawienia = forma dla count 5', (zostalo) => {
    const dni = { zostalo, limit: 5, miesiac: 'M' };
    const oczekiwany = t('projekty.dni', { count: 5, zostalo, limit: 5, miesiac: 'M' });
    render(<ListaProjektow stan={{ wToku: [], ukonczone: [], zapytanie: '', dni }} t={t} naSzukaj={jest.fn()} naOtworz={jest.fn()} naNowy={jest.fn()} />);
    const lista = tekst(screen.getByTestId('projekty-dni-darmowe') as unknown as { children: unknown[] });
    screen.unmount();
    render(<Ustawienia stan={{ pro: null, dni, wibracje: true }} t={t} system={atrapaSystemu()} adresy={ADRESY} naOferty={jest.fn()} naWibracje={jest.fn()} naZglosProblem={jest.fn()} naStanDanych={jest.fn()} />);
    const ustawienia = tekst(screen.getByTestId('ustawienia-dni-darmowe') as unknown as { children: unknown[] });
    expect([lista, ustawienia]).toEqual([oczekiwany, oczekiwany]);
    const zla = POJEDYNCZA[jezyk];
    if (zla) expect([lista, ustawienia].filter((x) => zla.test(x))).toEqual([]);
  });
});
