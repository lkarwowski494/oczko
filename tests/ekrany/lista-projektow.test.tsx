// Lista projektów (F-50, BR-PRJ-012, BR-ZAK-006/S5; design-spec.md:18, :55; ekrany.html `projekty`).
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ListaProjektow, type StanListyProjektow } from '../../src/ekrany/ListaProjektow';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { przycisk, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const HARBOR = { id: 'p1', nazwa: 'Harbor Sweater', opis: 'Left sleeve · row 47 of 96 · today', kolorWloczki: '#4F6F94' };
const stan = (z: Partial<StanListyProjektow> = {}): StanListyProjektow =>
  ({ wToku: [HARBOR], ukonczone: [], zapytanie: '', dni: { zostalo: 3, limit: 5, miesiac: 'November' }, ...z });
function pokaz(s: StanListyProjektow) {
  const w = { naSzukaj: jest.fn(), naOtworz: jest.fn(), naNowy: jest.fn() };
  const r = render(<ListaProjektow stan={s} t={t} {...w} />);
  return { w, ponow: (n: StanListyProjektow) => r.rerender(<ListaProjektow stan={n} t={t} {...w} />) };
}

describe('ListaProjektow', () => {
  test('BR-PRJ-012/S3: brak wyników dla „kamizelka”, po wyczyszczeniu lista wraca (design-spec.md:55)', () => {
    const { w, ponow } = pokaz(stan());
    // ekrany.html:180 pole „Search”
    fireEvent.changeText(screen.getByPlaceholderText('Search'), 'kamizelka');
    expect(w.naSzukaj).toHaveBeenLastCalledWith('kamizelka');
    ponow(stan({ zapytanie: 'kamizelka', wToku: [], ukonczone: [] }));
    // design-spec.md:55 „No project called “…”.”
    expect(screen.getByText('No project called “kamizelka”.')).toBeTruthy();
    fireEvent.changeText(screen.getByPlaceholderText('Search'), '');
    expect(w.naSzukaj).toHaveBeenLastCalledWith('');
    ponow(stan());
    expect(screen.queryByText(/No project called/)).toBeNull();
    expect(screen.getByText('Harbor Sweater')).toBeTruthy();
  });

  test('BR-PRJ-012 [macierz 04: pusty]: jedno zaproszenie do działania (design-spec.md:55, :73)', () => {
    pokaz(stan({ wToku: [], ukonczone: [] }));
    expect(screen.getByText('No projects yet. Your first row starts one.')).toBeTruthy();
  });

  test('BR-ZAK-006/S5: lista pokazuje, ile darmowych dni zostało (design-spec.md:18)', () => {
    pokaz(stan());
    // design-spec.md:18 „3 of 5 free crafting days left in November”
    expect(screen.getByText('3 of 5 free crafting days left in November')).toBeTruthy();
  });

  test('BR-ZAK-006/S7 [Pro]: przy Pro żadnej linii o dniach (design-spec.md:19)', () => {
    pokaz(stan({ dni: null }));
    expect(screen.queryByText(/free crafting days? left/)).toBeNull();
  });

  test('BR-PRJ-012: wiersz projektu otwiera projekt; „New project” (ekrany.html:178 aria-label)', () => {
    const { w } = pokaz(stan());
    fireEvent.press(screen.getByText('Harbor Sweater'));
    expect(w.naOtworz).toHaveBeenCalledWith('p1');
    fireEvent.press(przycisk('New project', 'button'));
    expect(w.naNowy).toHaveBeenCalledTimes(1);
  });
});
