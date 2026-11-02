// Poprawki 04, D2 (P-360; aneks partii 8, poz. 4 / design-spec „Aneks partii 8”, P-330 4A; wzorzec 20 Treningu: rozwijanie ▸/▾, `expanded`, etykieta stała):
// starszy, niecofnięty wpis historii ma strzałkę ▸ (zwinięty) / ▾ (rozwinięty) po prawej, cel ≥ 44 pt, stan niesie `accessibilityState.expanded`, etykieta VoiceOver
// jest stała („More about …”, taka sama po rozwinięciu), podpowiedź „Shows how to change this entry.”. Stan nie jest zapamiętywany (nowy ekran = zwinięty).
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Historia, type WpisHistorii } from '../../src/ekrany/Historia';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const wpis = (p: Partial<WpisHistorii> & { id: string }): WpisHistorii => ({ godzina: '20:14', z: 30, na: 31, opis: null, cofniety: false, mozeCofnac: false, seria: null, ...p });
const WPISY = [wpis({ id: 'e3', godzina: '21:02', z: 40, na: 41, mozeCofnac: true }), wpis({ id: 'e2' }), wpis({ id: 'e1', godzina: '19:50', z: 29, na: 30, cofniety: true })];
const ekran = () => render(<Historia stan={{ wpisy: WPISY }} t={t} naCofnij={jest.fn()} naCofnijSerie={jest.fn()} naWpisz={jest.fn()} naZamknij={jest.fn()} />);
const strzalka = () => screen.getByTestId('historia-rozwin-e2');

test('zwinięty starszy wpis: ▸, expanded=false, etykieta „More about …” z opisem wpisu, podpowiedź, rola przycisku', () => {
  ekran();
  expect(strzalka()).toHaveTextContent('▸');
  expect(strzalka().props.accessibilityState).toMatchObject({ expanded: false });
  expect(strzalka().props.accessibilityLabel).toBe('More about 20:14 · 30 → 31');
  expect(strzalka().props.accessibilityHint).toBe('Shows how to change this entry.');
  expect(screen.getByRole('button', { name: 'More about 20:14 · 30 → 31' })).toBeTruthy();
  expect(screen.queryByText(/Only the latest change can be undone/)).toBeNull();
});
test('stuknięcie rozwija: ▾, expanded=true, ta sama etykieta, wyjaśnienie i „Enter the right number”; drugie stuknięcie zwija', () => {
  ekran();
  fireEvent.press(strzalka());
  expect(strzalka()).toHaveTextContent('▾');
  expect(strzalka().props.accessibilityState).toMatchObject({ expanded: true });
  expect(strzalka().props.accessibilityLabel).toBe('More about 20:14 · 30 → 31'); // stała (wzorzec 20): stan niesie `expanded`, nie etykieta
  expect(screen.getByText(/Only the latest change can be undone/)).toBeTruthy();
  expect(screen.getByText('Enter the right number')).toBeTruthy();
  fireEvent.press(strzalka());
  expect(strzalka()).toHaveTextContent('▸');
  expect(screen.queryByText(/Only the latest change can be undone/)).toBeNull();
});
test('cel dotyku strzałki ≥ 44 pt', () => {
  ekran();
  expect(strzalka()).toHaveStyle({ minHeight: 44 });
});
test('ostatni wpis (Undo) i cofnięty nie mają strzałki; „+” / „–” nie istnieją', () => {
  ekran();
  expect(screen.queryByTestId('historia-rozwin-e3')).toBeNull();
  expect(screen.queryByTestId('historia-rozwin-e1')).toBeNull();
  expect(screen.queryByText('+')).toBeNull();
  expect(screen.queryByText('–')).toBeNull();
});
test('nowy ekran historii zaczyna zwinięty (stan niezapamiętywany)', () => {
  const pierwszy = ekran();
  fireEvent.press(strzalka());
  pierwszy.unmount();
  ekran();
  expect(strzalka()).toHaveTextContent('▸');
});
