// P-255 (a), scenariusz 10: przyciski arkusza (Save / Cancel) nad klawiaturą numeryczną — stuknięcie w Save trafiało w klawisz „0” (46 → 460).
// Odstęp = ile dół paska przycisków (w oknie) zachodzi na górną krawędź klawiatury; arkusz formSheet jest przesunięty w oknie, więc pomiar
// w oknie (measureInWindow), nie ramka względem rodzica (KeyboardAvoidingView).
import React from 'react';
import { Keyboard, Platform, Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { Arkusz, odstepNadKlawiatura } from '../../src/ekrany/Arkusz';
import { odstep } from '../../src/ekrany/motyw';

test('odstęp = zachodzenie dołu przycisków na klawiaturę; bez zachodzenia albo bez klawiatury 0', () => {
  expect(odstepNadKlawiatura({ dolPrzyciskow: 800, gornaKlawiatury: 500 })).toBe(300);
  expect(odstepNadKlawiatura({ dolPrzyciskow: 450, gornaKlawiatury: 500 })).toBe(0);
  expect(odstepNadKlawiatura({ dolPrzyciskow: 800, gornaKlawiatury: null })).toBe(0);
});

type Zdarzenie = { endCoordinates: { screenY: number; height: number } };
function sluchaj() {
  const sluchacze: Record<string, (e: Zdarzenie) => void> = {};
  const spy = jest.spyOn(Keyboard, 'addListener').mockImplementation(((nazwa: string, fn: (e: Zdarzenie) => void) => {
    sluchacze[nazwa] = fn;
    return { remove: () => undefined };
  }) as unknown as typeof Keyboard.addListener);
  return { sluchacze, spy };
}
const pasek = () => screen.getByTestId('arkusz-przyciski');

test('iPad: odstęp z pomiaru w oknie (arkusz formSheet na środku, system go przesuwa); po schowaniu 0', () => {
  const { sluchacze, spy } = sluchaj();
  jest.spyOn(Platform as { isPad: boolean }, 'isPad', 'get').mockReturnValue(true); // iOS: typ Platform bez isPad w unii
  render(<Arkusz tytul="T" przyciski={<Text>Save</Text>} zmierz={(f) => f(0, 600, 390, 200)}>{null}</Arkusz>);
  act(() => sluchacze.keyboardWillShow({ endCoordinates: { screenY: 500, height: 300 } }));
  expect(pasek()).toHaveStyle({ paddingBottom: odstep.l + 300 }); // token 04 zostaje, odstęp dochodzi
  act(() => sluchacze.keyboardWillHide({ endCoordinates: { screenY: 844, height: 0 } }));
  expect(pasek()).toHaveStyle({ paddingBottom: odstep.l });
  spy.mockRestore();
  jest.restoreAllMocks();
});

// P-262 (a), przebieg 119 (scen. 34, krok 45): pasek [0,745][402,874] bez odstępu przy klawiaturze numerycznej — pomiar w oknie w arkuszu
// formSheet na telefonie zawiódł. Na telefonie dół paska = dół ekranu (hierarchia: 874 = wysokość ekranu), więc odstęp = wysokość klawiatury.
test('telefon: odstęp = wysokość klawiatury, bez pomiaru; także z keyboardDidShow (gdy WillShow przepadnie)', () => {
  const { sluchacze, spy } = sluchaj();
  const zmierz = jest.fn();
  render(<Arkusz tytul="T" przyciski={<Text>Save</Text>} zmierz={zmierz}>{null}</Arkusz>);
  act(() => sluchacze.keyboardWillShow({ endCoordinates: { screenY: 567, height: 307 } }));
  expect(pasek()).toHaveStyle({ paddingBottom: odstep.l + 307 });
  act(() => sluchacze.keyboardWillHide({ endCoordinates: { screenY: 874, height: 0 } }));
  act(() => sluchacze.keyboardDidShow({ endCoordinates: { screenY: 567, height: 307 } }));
  expect(pasek()).toHaveStyle({ paddingBottom: odstep.l + 307 });
  expect(zmierz).not.toHaveBeenCalled();
  spy.mockRestore();
});
