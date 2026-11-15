// Grupa „Pattern(s)” na ekranie projektu i dodanie wzoru (design-spec W7a, W8, W11; P-218 (1), Q6a — każde dodanie to nowy wzór; P-220 W9b).
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ArkuszLinku, ArkuszNazwyWzoru, GrupaWzorow } from '../../src/ekrany/WzorGrupa';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const wywolania = () => ({ naOtworz: jest.fn(), naDodaj: jest.fn(), naUsunOczekujacy: jest.fn() });

// PU-246 (katalog przypadków użycia): grupa „Dodaj wzór” bez wzoru.
test('bez wzoru: nagłówek „Pattern”, „Add pattern” z podpisem; menu źródeł: plik, skan (gdy dostępny), zdjęcia, link', () => {
  const w = wywolania();
  const r = render(<GrupaWzorow wzory={[]} oczekujace={[]} skaner t={t} {...w} />);
  expect(screen.getByRole('header', { name: 'Pattern' })).toBeTruthy();
  expect(screen.getByText('PDF, Word, a photo of a page or a web page')).toBeTruthy();
  fireEvent.press(screen.getByTestId('wzor-dodaj'));
  for (const [tekst, zrodlo] of [['Choose file (PDF or Word)', 'plik'], ['Scan pages', 'skan'], ['Choose photos', 'zdjecia'], ['Web page link…', 'link']] as const) {
    fireEvent.press(screen.getByRole('menuitem', { name: tekst }));
    expect(w.naDodaj).toHaveBeenLastCalledWith(zrodlo);
    fireEvent.press(screen.getByTestId('wzor-dodaj'));
  }
  r.rerender(<GrupaWzorow wzory={[]} oczekujace={[]} skaner={false} t={t} {...w} />);
  expect(screen.queryByRole('menuitem', { name: 'Scan pages' })).toBeNull(); // VNDocumentCameraViewController.isSupported = false
});

test('≥ 2 wzory: „Patterns”, wiersz każdego wzoru (nazwa, opis) otwiera ten wzór; „Add pattern” zawsze na końcu', () => {
  const w = wywolania();
  render(<GrupaWzorow wzory={[{ wzorId: 'w1', nazwa: 'Harbor chart', opis: 'PDF · 6 pages' }, { wzorId: 'w2', nazwa: 'Edging', opis: 'Photo · 1 page' }]} oczekujace={[]} skaner t={t} {...w} />);
  expect(screen.getByRole('header', { name: 'Patterns' })).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Edging, Photo · 1 page' }));
  expect(w.naOtworz).toHaveBeenCalledWith('w2');
  const kolejnosc = screen.UNSAFE_root.findAll((n) => typeof n.type === 'string' && (n.props.testID === 'wzor-dodaj' || n.props.testID === 'projekt-wzor')).map((n) => n.props.testID);
  expect(kolejnosc[kolejnosc.length - 1]).toBe('wzor-dodaj');
});

test('W11: import w toku (status) i strona czekająca na sieć z ✕ (wzor-czeka-siec)', () => {
  const w = wywolania();
  render(<GrupaWzorow wzory={[]} oczekujace={[{ id: 'z1', nazwa: 'example.org', stan: 'siec' }, { id: 'z2', nazwa: 'Socks.pdf', stan: 'import' }]} skaner t={t} {...w} />);
  expect(screen.getByTestId('wzor-czeka-siec')).toBeTruthy();
  expect(screen.getByText('Waiting for the internet to save the web page.')).toBeTruthy();
  expect(screen.getByText('Adding the pattern…')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Remove example.org from the list' }));
  expect(w.naUsunOczekujacy).toHaveBeenCalledWith('z1');
});

// PU-256 (katalog przypadków użycia): zły link do strony.
test('arkusz linku strony: zły adres → zdanie pod polem, bez zapisu; dobry → naZapisz z adresem', () => {
  const naZapisz = jest.fn();
  render(<ArkuszLinku t={t} naZapisz={naZapisz} naAnuluj={jest.fn()} naWklej={async () => 'https://example.org/czapka'} />);
  fireEvent.changeText(screen.getByTestId('wzor-link-pole'), 'czapka na drutach');
  fireEvent.press(screen.getByRole('button', { name: 'Save page' }));
  expect(naZapisz).not.toHaveBeenCalled();
  expect(screen.getByText('That doesn’t look like a web link. Check it and try again.')).toBeTruthy();
  fireEvent.changeText(screen.getByTestId('wzor-link-pole'), ' https://example.org/czapka ');
  fireEvent.press(screen.getByRole('button', { name: 'Save page' }));
  expect(naZapisz).toHaveBeenCalledWith('https://example.org/czapka');
});

test('arkusz „Pattern name” (••• → Rename): wypełniony obecną nazwą; pusta nazwa nie zapisuje; Save → nowa nazwa', () => {
  const naZapisz = jest.fn();
  render(<ArkuszNazwyWzoru t={t} nazwa="Harbor chart" naZapisz={naZapisz} naAnuluj={jest.fn()} />);
  expect(screen.getByLabelText('Pattern name').props.value).toBe('Harbor chart');
  fireEvent.changeText(screen.getByLabelText('Pattern name'), '   ');
  fireEvent.press(screen.getByRole('button', { name: 'Save' }));
  expect(naZapisz).not.toHaveBeenCalled();
  fireEvent.changeText(screen.getByLabelText('Pattern name'), ' Edging ');
  fireEvent.press(screen.getByRole('button', { name: 'Save' }));
  expect(naZapisz).toHaveBeenCalledWith('Edging');
});

test('W8 (plan 1.1 pkt 7): wiersz wzoru z miniaturą pierwszej strony (obraz dekoracyjny — VoiceOver czyta nazwę i opis); bez miniatury sam tekst', () => {
  render(<GrupaWzorow wzory={[{ wzorId: 'w1', nazwa: 'Harbor chart', opis: 'PDF · 6 pages', miniatura: 'file:///tmp/m/a.png' }, { wzorId: 'w2', nazwa: 'Edging', opis: 'Word document' }]}
    oczekujace={[]} skaner t={t} {...wywolania()} />);
  const m = screen.getAllByTestId('wzor-miniatura', { includeHiddenElements: true });
  expect(m).toHaveLength(1);
  expect(m[0].props.source).toEqual({ uri: 'file:///tmp/m/a.png' });
  expect(screen.getByRole('button', { name: 'Harbor chart, PDF · 6 pages' })).toBeTruthy();
});
