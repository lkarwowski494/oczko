// PU-168 („Centrum powiadomień i sterowania nie dodaje rzędu”), część, którą da się sprawdzić w Jest: gdy system przejmuje dotyk (ściągnięcie Centrum powiadomień albo sterowania → UIKit anuluje dotyk,
// w React Native `responderTerminate`), przycisk „+1” licznika NIE dodaje rzędu, a zwykłe puszczenie palca w przycisku dodaje dokładnie jeden (kontrola dodatnia — bez niej test byłby pusty).
// To zachowanie ekranu `Licznik` (+1 na puszczeniu palca, nie na dotknięciu), nie samego systemu. Poza Jest: faktyczne ściągnięcie Centrów na urządzeniu i powrót (scenariusz 95, oczekujący).
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Licznik } from '../../src/ekrany/Licznik';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaHaptyki, stanLicznika, tEn, wywolaniaLicznika } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

const zdarzenie = () => ({ nativeEvent: { pageX: 100, pageY: 700, locationX: 10, locationY: 10, timestamp: 1, touches: [], changedTouches: [] }, persist: jest.fn(), currentTarget: 1, target: 1 });
function pokaz() {
  const w = wywolaniaLicznika();
  render(<Licznik stan={stanLicznika({ projekt: 'Harbor', czesc: 'Back', skonczone: 1, dziergany: 2 })} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...w} />);
  return w;
}
const dotykaj = (zakonczenie: 'responderRelease' | 'responderTerminate') => {
  const plus = screen.getByTestId('licznik-plus');
  fireEvent(plus, 'responderGrant', zdarzenie());
  fireEvent(plus, zakonczenie, zdarzenie());
};

test('PU-168: dotyk w „+1” anulowany przez system (Centrum powiadomień/sterowania) nie dodaje rzędu; puszczenie palca dodaje jeden', async () => {
  const w = pokaz();
  dotykaj('responderTerminate');
  dotykaj('responderTerminate');
  expect(w.naPlus).not.toHaveBeenCalled();
  expect(w.naMinus).not.toHaveBeenCalled();
  dotykaj('responderRelease'); // kontrola dodatnia: ten sam gest zakończony puszczeniem to jedno +1
  expect(w.naPlus).toHaveBeenCalledTimes(1);
});
