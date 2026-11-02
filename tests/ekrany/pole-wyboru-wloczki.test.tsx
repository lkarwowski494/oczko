// M1-audytor-generalny-050 (źródło 08-programista-009, DEV-11; zasada wspólna 15, zasada programisty 7): pole wyboru w arkuszu włóczek projektu
// miało lokalne wartości stylu na sztywno (`fontSize: 20, width: 28, … borderRadius: 4`). Wyrocznia: wzorzec 04 `.pole-wyboru`
// (docs/design/fix10-2026-11-01/partia8.html:208–209: kwadrat 28 pt, obrys 2 pt kolorem `m-obrys`, zaznaczone wypełnione `p-tlo` ze znakiem `p-tekst`;
// design-spec „Partia 8” 001: stan niesie znak ✓, nie kolor) i moduł motywu (tokeny.json) — liczby stylu nie w ekranie, tylko w systemie.
import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { StyleSheet } from 'react-native';
import { render, screen, within } from '@testing-library/react-native';
import { FormularzWloczekProjektu } from '../../src/ekrany/FormularzeProjektu';
import { kolorJasny, odstep } from '../../src/ekrany/motyw';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

test('FormularzeProjektu.tsx: żadnej liczby wpisanej w style (wartości z modułu motywu albo stylu arkusza)', () => {
  const zrodlo = readFileSync(join(__dirname, '../../src/ekrany/FormularzeProjektu.tsx'), 'utf8');
  const wlasnosci = 'fontSize|lineHeight|width|height|minWidth|minHeight|maxWidth|maxHeight|gap|rowGap|columnGap|border\\w*(?:Width|Radius)|padding\\w*|margin\\w*|top|left|right|bottom';
  const trafienia = zrodlo.split('\n').flatMap((w, i) => (new RegExp(`\\b(?:${wlasnosci})\\s*:\\s*-?\\d`).test(w) ? [`${i + 1}: ${w.trim().slice(0, 120)}`] : []));
  expect(trafienia).toEqual([]);
});

test('pole wyboru włóczki wg wzorca 04: obrys drugiPrzyciskObrys, rozmiar z tokenów; zaznaczone wypełnione przyciskTlo ze znakiem ✓ w przyciskTekst', () => {
  render(<FormularzWloczekProjektu t={t} zapas={[{ id: 'y1', nazwa: 'Merino', motki: 3 }, { id: 'y2', nazwa: 'Alpaka', motki: 0 }]} poczatkowe={['y1']}
    naZapisz={jest.fn(async () => ({ ok: true as const, wartosc: undefined }))} naAnuluj={jest.fn()} naDodajWloczke={jest.fn()} />);
  const pole = (id: string) => StyleSheet.flatten(within(screen.getByTestId(`wloczka-wybor-${id}`)).getAllByText(/.*/, { includeHiddenElements: true })[0].props.style);
  const zaznaczone = pole('y1');
  const puste = pole('y2');
  for (const s of [zaznaczone, puste]) {
    expect(s).toMatchObject({ width: odstep.xxl, borderWidth: 2, borderColor: kolorJasny.drugiPrzyciskObrys, textAlign: 'center' });
  }
  expect(zaznaczone).toMatchObject({ backgroundColor: kolorJasny.przyciskTlo, color: kolorJasny.przyciskTekst });
  expect(puste.backgroundColor).toBeUndefined();
  expect(within(screen.getByTestId('wloczka-wybor-y1')).getByText('✓', { includeHiddenElements: true })).toBeTruthy();
});
