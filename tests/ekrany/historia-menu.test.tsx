// Historia licznika i menu projektu (F-02, F-03, F-45; BR-LIC-003, BR-LIC-004, BR-LIC-017/S6, R-007; prototyp.html:128–129, design-spec.md:34, :44).
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Historia } from '../../src/ekrany/Historia';
import { MenuProjektu } from '../../src/ekrany/MenuProjektu';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { przycisk, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const menu = () => ({
  naNazwa: jest.fn(), naCel: jest.fn(), naPrzypomnienie: jest.fn(), naPowtorzenie: jest.fn(), naWpisz: jest.fn(),
  naZablokuj: jest.fn(), naOdblokuj: jest.fn(), naZeruj: jest.fn(), naUkoncz: jest.fn(), naZamknij: jest.fn(),
});

const wpis = (o: { id: string; godzina: string; z: number; na: number; opis: string | null; mozeCofnac?: boolean }) => ({ cofniety: false, mozeCofnac: false, seria: null, ...o });
const bezAkcji = { naCofnijSerie: jest.fn(), naWpisz: jest.fn() };

describe('Historia i menu projektu', () => {
  test('BR-LIC-003/S1: obie zmiany z godziną i wartością po zmianie (prototyp.html:128)', () => {
    render(<Historia stan={{ wpisy: [
      wpis({ id: 'z2', godzina: '20:31', z: 1, na: 2, opis: null, mozeCofnac: true }),
      wpis({ id: 'z1', godzina: '20:14', z: 0, na: 1, opis: null }),
    ] }} t={t} naCofnij={jest.fn()} {...bezAkcji} naZamknij={jest.fn()} />);
    // prototyp.html:128 wiersz „${czas} · ${z} → ${na}”
    expect(screen.getByText(/20:14.*→ 1\b/)).toBeTruthy();
    expect(screen.getByText(/20:31.*→ 2\b/)).toBeTruthy();
  });

  test('BR-LIC-017/S6 / R-007: zerowanie dopiero po potwierdzeniu; w historii 42 → 0 z „Undo” (Z07-05)', () => {
    const w = menu();
    render(<MenuProjektu stan={{ projekt: 'Harbor Sweater', zablokowany: false, wartosc: 42 }} t={t} {...w} />);
    // Z07-05: pozycji zerowania brak w prototyp.html:129; nazwa robocza 07 „Reset to 0…”, potwierdzenie z czasownikiem (design-spec.md:47)
    fireEvent.press(screen.getByRole('button', { name: /^Reset/ }));
    expect(w.naZeruj).not.toHaveBeenCalled();
    const potwierdz = screen.getAllByRole('button', { name: /^Reset/ });
    fireEvent.press(potwierdz[potwierdz.length - 1]);
    expect(w.naZeruj).toHaveBeenCalledTimes(1);

    const naCofnij = jest.fn();
    render(<Historia stan={{ wpisy: [wpis({ id: 'z9', godzina: '21:02', z: 42, na: 0, opis: 'reset', mozeCofnac: true })] }} t={t} naCofnij={naCofnij} {...bezAkcji} naZamknij={jest.fn()} />);
    expect(screen.getByText(/42 → 0/)).toBeTruthy();
    // design-spec.md:44 „Undo: … ostatnia zmiana w historii (BR-LIC-003)”
    fireEvent.press(przycisk('Undo', 'button'));
    expect(naCofnij).toHaveBeenCalledWith('z9');
  });

  test('BR-LIC-003 [macierz 04: pusta historia]: „No changes yet.” i „Close” (prototyp.html:128)', () => {
    const naZamknij = jest.fn();
    render(<Historia stan={{ wpisy: [] }} t={t} naCofnij={jest.fn()} {...bezAkcji} naZamknij={naZamknij} />);
    expect(screen.getByText('No changes yet.')).toBeTruthy();
    fireEvent.press(przycisk('Close', 'button'));
    expect(naZamknij).toHaveBeenCalledTimes(1);
  });

  test('BR-LIC-004 [menu]: „Lock counter (ignore taps)” i „Unlock counter” (design-spec.md:34, prototyp.html:129)', () => {
    const w = menu();
    const r = render(<MenuProjektu stan={{ projekt: 'Harbor Sweater', zablokowany: false, wartosc: 15 }} t={t} {...w} />);
    fireEvent.press(przycisk('Lock counter (ignore taps)', 'button'));
    expect(w.naZablokuj).toHaveBeenCalledTimes(1);
    r.rerender(<MenuProjektu stan={{ projekt: 'Harbor Sweater', zablokowany: true, wartosc: 15 }} t={t} {...w} />);
    fireEvent.press(przycisk('Unlock counter', 'button'));
    expect(w.naOdblokuj).toHaveBeenCalledTimes(1);
  });

  test('BR-PRJ-006 [menu]: pozycje menu z prototypu wołają swoje formularze (prototyp.html:129)', () => {
    const w = menu();
    render(<MenuProjektu stan={{ projekt: 'Harbor Sweater', zablokowany: false, wartosc: 15 }} t={t} {...w} />);
    fireEvent.press(przycisk('Name project and part', 'button'));
    fireEvent.press(przycisk('Set a goal for this part', 'button'));
    fireEvent.press(przycisk('Add a reminder (“every N rows”)', 'button'));
    fireEvent.press(przycisk('Enter the row number', 'button'));
    fireEvent.press(przycisk('Mark project as finished', 'button'));
    expect([w.naNazwa, w.naCel, w.naPrzypomnienie, w.naWpisz, w.naUkoncz].map((f) => f.mock.calls.length)).toEqual([1, 1, 1, 1, 1]);
  });
});
