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
import { cel, kolorJasny, MAX_SKALA_ZNAKU_WYBORU, promien } from '../../src/ekrany/motyw';
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
    expect(s).toMatchObject({ width: cel.poleWyboru, borderWidth: 2, borderColor: kolorJasny.drugiPrzyciskObrys, textAlign: 'center' });
  }
  expect(zaznaczone).toMatchObject({ backgroundColor: kolorJasny.przyciskTlo, color: kolorJasny.przyciskTekst });
  expect(puste.backgroundColor).toBeUndefined();
  expect(within(screen.getByTestId('wloczka-wybor-y1')).getByText('✓', { includeHiddenElements: true })).toBeTruthy();
});

// M1-audytor-generalny-145 (04-studio-projektowe-529, opcja a): pole wyboru brało tokeny zastępcze (`odstep.xxl`, `promien.pole` 10, `instrukcja` 20 pt),
// a znak ✓ rósł bez granicy (przy AX5 ok. 71 pt w polu 28 pt, ucięty). Wzorzec `.pole-wyboru` (partia8.html:208): 28 × 28, promień 8, 700 18 pt;
// granica skali znaku ×1,6 jak kapsuła stopera (design-spec:529). Tokeny `cel.poleWyboru`, `promien.poleWyboru`, `typografia.znakWyboru`.
// P-553 (Dzianina, mapa-tokenow.md): `cel.poleWyboru` = `cele.minimum` (44 pt: celem jest cały wiersz), `promien.poleWyboru` = `promienie.plus` (50%, znacznik okrągły),
// znak wyboru = `typografia.tresc` (17 pt) w wadze 700 krojem systemowym (nie Libre Franklin), skala najwyżej ×1,6 = `typografia.zakladka.maxSkala`.
test('145: pole wyboru z własnych tokenów (cele.minimum, promienie.plus, znak 700 w rozmiarze treści) i znak ✓ najwyżej ×1,6 z tokenów', () => {
  const tokeny = JSON.parse(readFileSync(join(__dirname, '../../docs/design/tokeny.json'), 'utf8')) as {
    cele: Record<string, number>; promienie: Record<string, number | string>; typografia: Record<string, Record<string, number | string>>;
  };
  expect(cel.poleWyboru).toBe(tokeny.cele.minimum);
  expect(promien.poleWyboru).toBe(tokeny.promienie.plus);
  expect(MAX_SKALA_ZNAKU_WYBORU).toBe(tokeny.typografia.zakladka.maxSkala);
  render(<FormularzWloczekProjektu t={t} zapas={[{ id: 'y1', nazwa: 'Merino', motki: 3 }]} poczatkowe={['y1']}
    naZapisz={jest.fn(async () => ({ ok: true as const, wartosc: undefined }))} naAnuluj={jest.fn()} naDodajWloczke={jest.fn()} />);
  const znak = within(screen.getByTestId('wloczka-wybor-y1')).getByText('✓', { includeHiddenElements: true });
  expect(StyleSheet.flatten(znak.props.style)).toMatchObject({
    width: tokeny.cele.minimum, minHeight: tokeny.cele.minimum, borderRadius: tokeny.promienie.plus, fontSize: tokeny.typografia.tresc.pt, fontWeight: '700',
  });
  expect(StyleSheet.flatten(znak.props.style).fontFamily).toBeUndefined(); // krój systemowy, nie tytułowy (Dzianina: Bree Serif tylko tytuły i liczby)
  expect(znak.props.maxFontSizeMultiplier).toBe(tokeny.typografia.zakladka.maxSkala);
});
