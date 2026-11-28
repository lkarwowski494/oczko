// FX1 P2-2 (KO-246, recenzja niezależna FA2): podpowiedź „+1” (ZM-25, U7 forma A) — `pokazana` czyszczone przy zmianie klucza rzędu, klucz zawiera id licznika,
// „−1” restartuje odliczanie nawet gdy `ostatniaZmianaMs` się nie zmieniło. Zegar wstrzyknięty (fałszywe timery Jesta + licznik `t`).
import React from 'react';
import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { kluczRzedu, useOdliczaniePodpowiedzi, type WejscieOdliczania } from '../../src/ekrany/podpowiedz-odliczanie';

const MIN = 60_000, T0 = 1_800_000_000_000;
let t = T0;
const teraz = () => t;
function Probka(p: Omit<WejscieOdliczania, 'teraz'>): React.ReactElement {
  const w = useOdliczaniePodpowiedzi({ ...p, teraz });
  return <Text testID="wynik">{w ? `${w.minuty} min` : 'brak'}</Text>;
}
const wynik = () => screen.getByTestId('wynik').props.children as string;
const uplyw = (ms: number) => act(() => { t += ms; jest.advanceTimersByTime(ms); });
const bazowe = { progMin: 10 as number | null, ostatniaZmianaMs: T0 as number | null, klucz: 'l1|43', blokada: false };

beforeEach(() => { jest.useFakeTimers(); t = T0; });
afterEach(() => { jest.useRealTimers(); });

describe('FX1 P2-2: odliczanie podpowiedzi po zmianie rzędu', () => {
  test('podpowiedź pokazana przy rzędzie 43, +1 (44), −1 (znów 43): nie wraca od razu, wraca dopiero po pełnym progu od −1', () => {
    const ekran = render(<Probka {...bazowe} />);
    uplyw(10 * MIN);
    expect(wynik()).toBe('10 min');
    ekran.rerender(<Probka {...bazowe} klucz="l1|44" ostatniaZmianaMs={t} />);
    expect(wynik()).toBe('brak');
    ekran.rerender(<Probka {...bazowe} klucz="l1|43" ostatniaZmianaMs={t} />);
    expect(wynik()).toBe('brak');
    uplyw(10 * MIN - 1000);
    expect(wynik()).toBe('brak');
    uplyw(1000);
    expect(wynik()).toBe('10 min');
  });

  test('„−1” bez nowszego czasu ostatniej zmiany (stare ostatniaZmianaMs) restartuje odliczanie od chwili zmiany rzędu, nie pokazuje od razu', () => {
    const ekran = render(<Probka {...bazowe} klucz="l1|44" />);
    uplyw(10 * MIN);
    expect(wynik()).toBe('10 min');
    ekran.rerender(<Probka {...bazowe} klucz="l1|43" ostatniaZmianaMs={T0} />); // jak po −1, gdy zapis nie przesunął czasu ostatniej zmiany
    expect(wynik()).toBe('brak');
    uplyw(10 * MIN - 1000);
    expect(wynik()).toBe('brak');
    uplyw(1000);
    expect(wynik()).toBe('10 min');
  });

  test('klucz rzędu zawiera id licznika: dwa liczniki tej samej części z tą samą wartością mają różne klucze', () => {
    expect(kluczRzedu({ licznikId: 'a', skonczone: 12 })).not.toBe(kluczRzedu({ licznikId: 'b', skonczone: 12 }));
    expect(kluczRzedu({ licznikId: 'a', skonczone: 12 })).not.toBe(kluczRzedu({ licznikId: 'a', skonczone: 13 }));
    expect(kluczRzedu({ licznikId: undefined, skonczone: undefined })).toBe(kluczRzedu({ licznikId: undefined, skonczone: undefined }));
  });
});
