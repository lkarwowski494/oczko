// PU-360 (R4, TQ1): odliczanie podpowiedzi formy A z wstrzykniętym zegarem — po N min, raz na rząd, znika po +1/−1/wyjściu, nie przy blokadzie, limicie i pauzie stopera.
// Zegar systemowy zastąpiony przez fałszywe timery Jesta i licznik `t` podawany jako `teraz`; komponent próbny pokazuje wynik hooka.
import React from 'react';
import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { useOdliczaniePodpowiedzi, type WejscieOdliczania } from '../../src/ekrany/podpowiedz-odliczanie';

const MIN = 60_000, T0 = 1_800_000_000_000;
let t = T0;
const teraz = () => t;
function Probka(p: Omit<WejscieOdliczania, 'teraz'>): React.ReactElement {
  const w = useOdliczaniePodpowiedzi({ ...p, teraz });
  return <Text testID="wynik">{w ? `${w.minuty} min` : 'brak'}</Text>;
}
const wynik = () => screen.getByTestId('wynik').props.children as string;
const uplyw = (ms: number) => act(() => { t += ms; jest.advanceTimersByTime(ms); });
const bazowe = { progMin: 10 as number | null, ostatniaZmianaMs: T0 as number | null, klucz: 'l1:43', blokada: false };

beforeEach(() => { jest.useFakeTimers(); t = T0; });
afterEach(() => { jest.useRealTimers(); });

describe('ZM-25 odliczanie podpowiedzi (forma A, P-1103)', () => {
  test('ZM-25 PU-360: nie przed progiem, jest po N min bez +1; wibracja ostrzeżenia dokładnie raz', () => {
    const poPokazaniu = jest.fn();
    render(<Probka {...bazowe} poPokazaniu={poPokazaniu} />);
    uplyw(10 * MIN - 1000);
    expect(wynik()).toBe('brak');
    expect(poPokazaniu).not.toHaveBeenCalled();
    uplyw(1000);
    expect(wynik()).toBe('10 min');
    uplyw(30 * MIN);
    expect(poPokazaniu).toHaveBeenCalledTimes(1);
  });

  test('ZM-25 PU-360: po +1 (nowy rząd, nowy czas zmiany) podpowiedź znika, odliczanie startuje od nowa i znów pokazuje się raz', () => {
    const poPokazaniu = jest.fn();
    const ekran = render(<Probka {...bazowe} poPokazaniu={poPokazaniu} />);
    uplyw(10 * MIN);
    expect(wynik()).toBe('10 min');
    ekran.rerender(<Probka {...bazowe} klucz="l1:44" ostatniaZmianaMs={t} poPokazaniu={poPokazaniu} />);
    expect(wynik()).toBe('brak');
    uplyw(10 * MIN - 1000);
    expect(wynik()).toBe('brak');
    uplyw(1000);
    expect(wynik()).toBe('10 min');
    expect(poPokazaniu).toHaveBeenCalledTimes(2); // raz na rząd: dwa rzędy, dwie wibracje
  });

  test('ZM-25 PU-360: −1 zmienia rząd tak samo jak +1 — podpowiedź znika i odlicza od nowa', () => {
    const ekran = render(<Probka {...bazowe} />);
    uplyw(10 * MIN);
    ekran.rerender(<Probka {...bazowe} klucz="l1:42" ostatniaZmianaMs={t} />);
    expect(wynik()).toBe('brak');
  });

  test('ZM-25 PU-360: blokada (licznik zablokowany, limit dni, pauza stopera) → brak podpowiedzi i brak wibracji, także po upływie progu', () => {
    const poPokazaniu = jest.fn();
    render(<Probka {...bazowe} blokada poPokazaniu={poPokazaniu} />);
    uplyw(60 * MIN);
    expect(wynik()).toBe('brak');
    expect(poPokazaniu).not.toHaveBeenCalled();
  });

  test('ZM-25 PU-360: wyłączona (null) → brak; wyjście z ekranu (odmontowanie) kasuje licznik czasu — wibracja nie przychodzi po wyjściu', () => {
    const wylaczona = render(<Probka {...bazowe} progMin={null} />);
    uplyw(60 * MIN);
    expect(wynik()).toBe('brak');
    wylaczona.unmount();
    const poPokazaniu = jest.fn();
    const ekran = render(<Probka {...bazowe} ostatniaZmianaMs={t} poPokazaniu={poPokazaniu} />);
    uplyw(5 * MIN);
    ekran.unmount();
    uplyw(60 * MIN);
    expect(poPokazaniu).not.toHaveBeenCalled();
  });

  test('ZM-25 PU-360: ostatnia zmiana sprzed godziny, ale ekran otwarty przed chwilą → liczymy od otwarcia (nie pokazuje się od razu)', () => {
    render(<Probka {...bazowe} ostatniaZmianaMs={T0 - 60 * MIN} />);
    expect(wynik()).toBe('brak');
    uplyw(10 * MIN);
    expect(wynik()).toBe('10 min');
  });
});
