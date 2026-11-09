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
import { kolorJasny, MAX_SKALA_TYTULOWA } from '../../src/ekrany/motyw';
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

// Zmienione jawnie w 011 (P-619 wariant B, `docs/programista/m3-fix-e5-zastapione-testy.md`): było koło `cel.poleWyboru` 44 (`promienie.plus`) ze znakiem „✓” w Text;
// jest komponent `PoleWyboru` — kwadrat `znaczniki.radio` 28 z promieniem `promienie.pole`, zaznaczone `przycisk` + symbol SF `checkmark` w `przyciskTekst`.
const pokaz = (zapas: { id: string; nazwa: string; motki: number }[]) => render(<FormularzWloczekProjektu t={t} zapas={zapas} poczatkowe={['y1']}
  naZapisz={jest.fn(async () => ({ ok: true as const, wartosc: undefined }))} naAnuluj={jest.fn()} naDodajWloczke={jest.fn()} />);
const pole = (id: string) => within(screen.getByTestId(`wloczka-wybor-${id}`)).getByTestId('pole-wyboru', { includeHiddenElements: true });

test('pole wyboru włóczki (011): obrys tekst2, rozmiar z tokenów; zaznaczone wypełnione przycisk z checkmark w przyciskTekst', () => {
  pokaz([{ id: 'y1', nazwa: 'Merino', motki: 3 }, { id: 'y2', nazwa: 'Alpaka', motki: 0 }]);
  const zaznaczone = StyleSheet.flatten(pole('y1').props.style);
  const puste = StyleSheet.flatten(pole('y2').props.style);
  expect(puste).toMatchObject({ borderWidth: 2, borderColor: kolorJasny.tekst2 });
  expect(zaznaczone).toMatchObject({ backgroundColor: kolorJasny.przycisk });
  expect(puste.backgroundColor).toBeUndefined();
  const znak = pole('y1').findAll((n) => n.props.nazwa === 'checkmark')[0];
  expect(znak?.props.kolor).toBe(kolorJasny.przyciskTekst);
  expect(within(screen.getByTestId('wloczka-wybor-y1')).queryByText('✓', { includeHiddenElements: true })).toBeNull();
});

// M1-audytor-generalny-145: znak wyboru nie rośnie bez granicy — symbol `checkmark` ma `maxSkala` jak `ZnacznikRadio` (MAX_SKALA_TYTULOWA), pole 28 (AX1+ 40) z tokenów.
test('145 (011): pole wyboru z tokenów znaczniki.radio i promienie.pole; symbol z granicą skali', () => {
  const tokeny = JSON.parse(readFileSync(join(__dirname, '../../docs/design/tokeny.json'), 'utf8')) as { znaczniki: Record<string, number | string>; promienie: Record<string, number | string> };
  pokaz([{ id: 'y1', nazwa: 'Merino', motki: 3 }]);
  const s = StyleSheet.flatten(pole('y1').props.style);
  expect([tokeny.znaczniki.radio, tokeny.znaczniki.radioAx5]).toContain(s.width);
  expect(s.height).toBe(s.width);
  expect(s.borderRadius).toBe(tokeny.promienie.pole);
  expect(pole('y1').findAll((n) => n.props.nazwa === 'checkmark')[0]?.props.maxSkala).toBe(MAX_SKALA_TYTULOWA);
});
