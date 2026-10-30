// Partia 5 (C3, A4; P-183 1a, 2a; design-spec „Projekt, części i kosz”): wiersz listy z linią terminu i „last worked …”, wejście do kosza
// tylko przy niepustym koszu, ekran „Recently deleted” z przywracaniem (BR-DAN-008, F-33). Teksty z łatki 04 fix-5.
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ListaProjektow, type StanListyProjektow } from '../../src/ekrany/ListaProjektow';
import { Kosz, type StanKosza } from '../../src/ekrany/Kosz';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { przycisk, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const lista = (z: Partial<StanListyProjektow> = {}): StanListyProjektow => ({
  wToku: [{ id: 'p1', nazwa: 'Harbor', opis: 'Back · Now working row 2', kolorWloczki: null, termin: 'Today: 3 of 10 rows', ostatniaPraca: 'last worked 41 days ago' }],
  ukonczone: [{ id: 'p2', nazwa: 'Hat', opis: '', kolorWloczki: null }], zapytanie: '', dni: null, ...z,
});

describe('lista projektów (partia 5)', () => {
  test('BR-PRJ-016/S1: każdy wiersz w toku ma „last worked …” (testID projekty-ostatnia-praca); linia terminu tylko gdy jest', () => {
    render(<ListaProjektow stan={lista()} t={t} naSzukaj={jest.fn()} naOtworz={jest.fn()} naNowy={jest.fn()} />);
    expect(screen.getByTestId('projekty-ostatnia-praca').props.children).toBe('last worked 41 days ago');
    expect(screen.getByText('Today: 3 of 10 rows')).toBeTruthy();
    expect(screen.queryByText(/sleeping|resting|not touched/i)).toBeNull(); // bez sekcji z progiem (P-182)
  });

  test('P-183 2a: wiersz kosza na końcu tylko przy niepustym koszu, z liczbą i etykietą VoiceOver; stuknięcie otwiera kosz', () => {
    const naKosz = jest.fn();
    const r = render(<ListaProjektow stan={lista({ kosz: 0 })} t={t} naSzukaj={jest.fn()} naOtworz={jest.fn()} naNowy={jest.fn()} naKosz={naKosz} />);
    expect(screen.queryByTestId('projekty-kosz')).toBeNull();
    r.rerender(<ListaProjektow stan={lista({ kosz: 3 })} t={t} naSzukaj={jest.fn()} naOtworz={jest.fn()} naNowy={jest.fn()} naKosz={naKosz} />);
    expect(screen.getByText('Recently deleted')).toBeTruthy();
    fireEvent.press(przycisk('Recently deleted, 3 items', 'button'));
    expect(naKosz).toHaveBeenCalledTimes(1);
  });
});

const kosz = (z: Partial<StanKosza> = {}): StanKosza => ({
  dni: 30,
  pozycje: [
    { rodzaj: 'licznik', id: 'l2', nazwa: 'Stitches', podpis: 'Counter in Harbor, Back · until Nov 21' },
    { rodzaj: 'projekt', id: 'p2', nazwa: 'Scarf', podpis: 'Project · until Nov 23' },
  ], ...z,
});
describe('ekran „Recently deleted” (C3, BR-DAN-008)', () => {
  test('opis z KOSZ_DNI, pozycje z terminem, „Restore” z etykietą nazwy wywołuje przywrócenie właściwej pozycji', () => {
    const naPrzywroc = jest.fn();
    render(<Kosz stan={kosz()} t={t} naPrzywroc={naPrzywroc} />);
    expect(screen.getByText('Deleted projects, parts, counters, patterns, yarn and needles stay here for 30 days. Then they’re deleted for good.')).toBeTruthy();
    expect(screen.getByText('Counter in Harbor, Back · until Nov 21')).toBeTruthy();
    fireEvent.press(przycisk('Restore Scarf', 'button'));
    expect(naPrzywroc).toHaveBeenCalledWith({ rodzaj: 'projekt', id: 'p2' });
    expect(screen.getAllByTestId('kosz-przywroc')).toHaveLength(2);
  });

  test('pusty kosz: zdanie „Nothing here…” bez listy', () => {
    render(<Kosz stan={kosz({ pozycje: [] })} t={t} naPrzywroc={jest.fn()} />);
    expect(screen.getByText('Nothing here. Deleted projects, parts, counters, patterns, yarn and needles stay here for 30 days.')).toBeTruthy();
    expect(screen.queryByTestId('kosz-przywroc')).toBeNull();
  });

  test('P-266 (2), scen. 36: powrót „‹ Back” (nav-wstecz) także w pustym koszu po przywróceniu ostatniej pozycji', () => {
    const naWstecz = jest.fn();
    const { rerender } = render(<Kosz stan={kosz()} t={t} naPrzywroc={jest.fn()} naWstecz={naWstecz} />);
    expect(screen.getByTestId('nav-wstecz')).toBeTruthy();
    rerender(<Kosz stan={kosz({ pozycje: [] })} t={t} naPrzywroc={jest.fn()} naWstecz={naWstecz} />);
    fireEvent.press(screen.getByTestId('nav-wstecz'));
    expect(naWstecz).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
  });
});
