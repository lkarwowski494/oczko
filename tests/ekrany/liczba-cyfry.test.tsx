// M3 p1 (P-563 (2a), M3-S3-03): Bree Serif nie ma cyfr tabelarycznych, więc każda cyfra liczby stoi w komórce szerokości najszerszej cyfry (typografia.cyfry.komorkaEm × rozmiar),
// wyśrodkowana; znaki inne niż cyfry bez komórki. Języki z krojem systemowym (kroje.tytul.jezykiSystemowe): bez komórek, tabular-nums.
import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import tokeny from '../../docs/design/tokeny.json';
import { komorkiLiczby, szerokoscKomorki } from '../../src/ekrany/liczba';
import { Liczba } from '../../src/ekrany/Liczba';
import { krojTytulowy, typografiaDzianiny as typografia } from '../../src/ekrany/motyw';

const T = tokeny as unknown as { typografia: Record<string, any>; kroje: { tytul: { jezykiSystemowe: string[] } } };

describe('M3-S3-03: komórki cyfr', () => {
  test('szerokość komórki = komorkaEm × rozmiar (104 pt licznika → 55,744 pt)', () => {
    expect(T.typografia.cyfry.komorkaEm).toBe(0.536);
    expect(szerokoscKomorki(104)).toBeCloseTo(0.536 * 104, 6);
  });
  test('„1” i „8” mają tę samą szerokość komórki, a przecinek i spacja żadnej', () => {
    expect(komorkiLiczby('18')).toEqual([{ znak: '1', komorka: true }, { znak: '8', komorka: true }]);
    expect(komorkiLiczby('1 234,5').filter((c) => !c.komorka).map((c) => c.znak)).toEqual([' ', ',']);
    expect(komorkiLiczby('1h 05').filter((c) => c.komorka)).toHaveLength(3);
  });
  test('cyfry arabsko-indyjskie i inne cyfry Unicode też dostają komórkę (\\p{Nd}), litery nie', () => {
    expect(komorkiLiczby('٣a').map((c) => c.komorka)).toEqual([true, false]);
  });
  test('komponent: każda cyfra w komórce o tej samej szerokości (liczba nie przesuwa się przy +1), jeden element dla VoiceOver', () => {
    render(<Liczba wartosc="1087" styl={typografia.liczbaLicznika} pt={T.typografia.liczbaLicznika.pt} testID="liczba" />);
    const kom = screen.getAllByTestId(/^liczba-cyfra-/);
    expect(kom).toHaveLength(4);
    // Zastąpione jawnie (fix E5, 003, P-614): szerokość przy skali okna (atrapa RN: Dimensions.fontScale), bez limitu — komponent bez maxFontSizeMultiplier.
    const skala = Dimensions.get('window').fontScale;
    for (const k of kom) expect(k.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ width: szerokoscKomorki(T.typografia.liczbaLicznika.pt, skala), textAlign: 'center' })]));
    expect(screen.getByLabelText('1087')).toBeTruthy();
    expect(screen.getByTestId('liczba').props.accessible).toBe(true);
  });
  test('język z krojem systemowym (ru, vi, ja…): bez komórek, krój systemowy i tabular-nums', () => {
    render(<Liczba wartosc="42" styl={typografia.liczbaLicznika} pt={104} jezyk="ru" testID="liczba" />);
    expect(screen.queryAllByTestId(/^liczba-cyfra-/)).toHaveLength(0);
    const t = screen.getByTestId('liczba-tekst');
    expect(t.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ fontVariant: ['tabular-nums'] })]));
    // Styl to tablica [krój tytułowy, nadpisanie systemowe]: Bree znika dopiero po spłaszczeniu (`fontFamily: undefined` w drugim elemencie).
    expect(StyleSheet.flatten(t.props.style).fontFamily).toBeUndefined();
  });
});

describe('M3-S3-04: krój tytułowy według języka', () => {
  test('lista języków z krojem systemowym = tokeny (bg, el, ja, ko, ru, sr, uk, vi, zh-Hant)', () => {
    expect(T.kroje.tytul.jezykiSystemowe).toEqual(['bg', 'el', 'ja', 'ko', 'ru', 'sr', 'uk', 'vi', 'zh-Hant']);
  });
  test.each(['bg', 'el', 'ja', 'ko', 'ru', 'sr', 'uk', 'vi', 'zh-Hant', 'zh-Hant-TW', 'ru-RU'])('%s → krój systemowy (undefined)', (j) => {
    expect(krojTytulowy(j)).toBeUndefined();
  });
  test.each(['pl', 'en', 'de', 'nl', 'tr', 'pt-BR', 'es-419'])('%s → Bree Serif', (j) => {
    expect(krojTytulowy(j)).toBe('Bree Serif');
  });
});
