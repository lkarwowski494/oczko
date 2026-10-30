// Film projektu na ekranie projektu (design-spec W8 :650, W7a :653, stan :666; 04 fix-8 film.html; P-276 (A): zamiana jawna; P-218 (4): film poza wzorem,
// jeden na projekt). Wiersz „Video” (nazwa albo adres, ↗ otwiera w przeglądarce, bez sieci alert), menu „Change link” / „Remove link”,
// „Add video link” i arkusz „Video link” (Link, Name (optional), podpis; zły adres → wzor.link_blad).
import React from 'react';
import { Alert, StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ArkuszFilmu, DodajFilm, WierszFilmu } from '../../src/ekrany/WzorFilm';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaSystemu, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const FILM = { adres: 'https://video.example/sleeve-cap', nazwa: 'Sleeve cap seaming' };

test('wiersz „Video”: nazwa (albo adres bez nazwy); ↗ otwiera link w przeglądarce', () => {
  const system = atrapaSystemu();
  const r = render(<WierszFilmu film={FILM} siec="jest" t={t} system={system} naZmien={jest.fn()} naUsun={jest.fn()} />);
  expect(screen.getByTestId('wzor-film-wiersz')).toBeTruthy();
  expect(screen.getByText('Video')).toBeTruthy();
  expect(screen.getByText('Sleeve cap seaming')).toBeTruthy();
  fireEvent.press(screen.getByRole('link', { name: 'Open video link in browser' }));
  expect(system.otworzAdres).toHaveBeenCalledWith(FILM.adres);
  r.rerender(<WierszFilmu film={{ adres: FILM.adres, nazwa: null }} siec="jest" t={t} system={system} naZmien={jest.fn()} naUsun={jest.fn()} />);
  expect(screen.getByText(FILM.adres)).toBeTruthy();
});

test('film bez sieci (:666): alert „No internet connection” z opisem, adres się nie otwiera', () => {
  const system = atrapaSystemu();
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  render(<WierszFilmu film={FILM} siec="brak" t={t} system={system} naZmien={jest.fn()} naUsun={jest.fn()} />);
  fireEvent.press(screen.getByRole('link', { name: 'Open video link in browser' }));
  expect(alert).toHaveBeenCalledWith('No internet connection', 'This video needs an internet connection. Oczko keeps only the link.', expect.anything());
  expect(system.otworzAdres).not.toHaveBeenCalled();
  alert.mockRestore();
});

test('P-276: menu wiersza „Video” (przytrzymanie) — „Change link” nad „Remove link”; to samo jako akcje VoiceOver', () => {
  const naZmien = jest.fn(), naUsun = jest.fn();
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  render(<WierszFilmu film={FILM} siec="jest" t={t} system={atrapaSystemu()} naZmien={naZmien} naUsun={naUsun} />);
  fireEvent(screen.getByTestId('wzor-film-wiersz'), 'longPress');
  const pozycje = screen.getAllByRole('menuitem').map((x) => x.props.accessibilityLabel);
  expect(pozycje).toEqual(['Change link', 'Remove link']);
  fireEvent.press(screen.getByRole('menuitem', { name: 'Change link' }));
  expect(naZmien).toHaveBeenCalledTimes(1);
  const akcje = screen.getByTestId('wzor-film-wiersz').props.accessibilityActions.filter((a: { name: string }) => a.name !== 'activate').map((a: { label: string }) => a.label);
  expect(akcje).toEqual(['Change link', 'Remove link']);
  expect(naUsun).not.toHaveBeenCalled(); // usunięcie dopiero po potwierdzeniu (04-studio-projektowe-006)
  alert.mockRestore();
});

test('04-studio-projektowe-006: wiersz „Video” ma widoczny przycisk menu (nie tylko przytrzymanie), min. 44 pt', () => {
  render(<WierszFilmu film={FILM} siec="jest" t={t} system={atrapaSystemu()} naZmien={jest.fn()} naUsun={jest.fn()} />);
  expect(screen.queryAllByRole('menuitem')).toHaveLength(0);
  const przycisk = screen.getByRole('button', { name: 'Video link options' });
  expect(StyleSheet.flatten(przycisk.props.style)).toMatchObject({ minWidth: 44, minHeight: 44 });
  fireEvent.press(przycisk);
  expect(screen.getAllByRole('menuitem').map((x) => x.props.accessibilityLabel)).toEqual(['Change link', 'Remove link']);
  fireEvent.press(przycisk);
  expect(screen.queryAllByRole('menuitem')).toHaveLength(0);
});

test('04-studio-projektowe-006: „Remove link” pyta o potwierdzenie (menu i akcja VoiceOver); Cancel nic nie usuwa, Remove usuwa', () => {
  const naUsun = jest.fn();
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  render(<WierszFilmu film={FILM} siec="jest" t={t} system={atrapaSystemu()} naZmien={jest.fn()} naUsun={naUsun} />);
  fireEvent.press(screen.getByRole('button', { name: 'Video link options' }));
  fireEvent.press(screen.getByRole('menuitem', { name: 'Remove link' }));
  expect(naUsun).not.toHaveBeenCalled();
  expect(alert).toHaveBeenCalledTimes(1);
  const [tytul, opis, przyciski] = alert.mock.calls[0] as [string, string, { text: string; style?: string; onPress?: () => void }[]];
  expect([tytul, opis]).toEqual(['Remove video link?', 'The link and its name are removed from this project. The video itself isn’t affected.']);
  expect(opis).not.toContain('You can add it again'); // 04: adres trzeba wpisać ponownie, tekst nie obiecuje przywrócenia
  expect(przyciski.map((b) => [b.text, b.style])).toEqual([['Cancel', 'cancel'], ['Remove link', 'destructive']]);
  przyciski[0]?.onPress?.();
  expect(naUsun).not.toHaveBeenCalled();
  przyciski[1]?.onPress?.();
  expect(naUsun).toHaveBeenCalledTimes(1);
  fireEvent(screen.getByTestId('wzor-film-wiersz'), 'accessibilityAction', { nativeEvent: { actionName: 'usun' } });
  expect(alert).toHaveBeenCalledTimes(2);
  expect(naUsun).toHaveBeenCalledTimes(1);
  alert.mockRestore();
});

test('„Add video link” (W7a) → naDodaj', () => {
  const naDodaj = jest.fn();
  render(<DodajFilm t={t} naDodaj={naDodaj} />);
  fireEvent.press(screen.getByTestId('wzor-dodaj-film'));
  expect(screen.getByRole('button', { name: 'Add video link' })).toBeTruthy();
  expect(naDodaj).toHaveBeenCalledTimes(1);
});

test('arkusz „Video link”: nowy — pola puste, podpis; zły adres → wzor.link_blad, nic nie zapisane; dobry → adres i nazwa', () => {
  const naZapisz = jest.fn();
  render(<ArkuszFilmu t={t} poczatek={null} naZapisz={naZapisz} naAnuluj={jest.fn()} />);
  expect(screen.getByText('Oczko keeps only the link. The video opens in your browser and needs the internet.')).toBeTruthy();
  fireEvent.changeText(screen.getByLabelText('Link'), 'javascript:alert(1)');
  fireEvent.press(screen.getByRole('button', { name: 'Save' }));
  expect(naZapisz).not.toHaveBeenCalled();
  expect(screen.getByText(t('wzor.link_blad'))).toBeTruthy();
  fireEvent.changeText(screen.getByLabelText('Link'), ' https://video.example/x ');
  fireEvent.changeText(screen.getByLabelText('Name (optional)'), 'Cast-on');
  fireEvent.press(screen.getByRole('button', { name: 'Save' }));
  expect(naZapisz).toHaveBeenCalledWith({ adres: 'https://video.example/x', nazwa: 'Cast-on' });
});

test('P-276 „Change link”: arkusz wypełniony obecnym linkiem i nazwą; Save zastępuje', () => {
  const naZapisz = jest.fn();
  render(<ArkuszFilmu t={t} poczatek={FILM} naZapisz={naZapisz} naAnuluj={jest.fn()} />);
  expect(screen.getByLabelText('Link').props.value).toBe(FILM.adres);
  expect(screen.getByLabelText('Name (optional)').props.value).toBe(FILM.nazwa);
  fireEvent.press(screen.getByRole('button', { name: 'Save' }));
  expect(naZapisz).toHaveBeenCalledWith({ adres: FILM.adres, nazwa: FILM.nazwa });
});

test('VoiceOver: wiersz „Video” jest jednym elementem — podwójne stuknięcie (activate) otwiera link jak ↗', () => {
  const system = atrapaSystemu();
  render(<WierszFilmu film={FILM} siec="jest" t={t} system={system} naZmien={jest.fn()} naUsun={jest.fn()} />);
  fireEvent(screen.getByTestId('wzor-film-wiersz'), 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
  expect(system.otworzAdres).toHaveBeenCalledWith(FILM.adres);
});
