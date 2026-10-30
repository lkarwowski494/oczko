// Ekran projektu, partia 5 (A5; design-spec „Ekran projektu”, makiety fix5 `projekt`, `projekt-dodaj`, `projekt-menu`, `projekt-edycja`,
// `projekt-ukonczony`, `projekt-bez-celow`; P-183 3a). Teksty z łatki 04 fix-5; dane sformatowane w kompozycji.
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Projekt, type PropsProjektu } from '../../src/ekrany/Projekt';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { przycisk, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const stan = (z: Partial<PropsProjektu['stan']> = {}): PropsProjektu['stan'] => ({
  nazwa: 'Harbor Sweater', notatka: 'Switch to 4 mm for the cuff', miejsceWzoru: null, ostatniaZmiana: 'Oct 22', postep: { rodzaj: 'procent', wartosc: 51 },
  termin: 'Done by Oct 31 · today 3 of 10 rows', ukonczony: false,
  czesci: [
    { id: 'c1', nazwa: 'Back', rzedy: 60, cel: 96, paraZ: null, liczniki: [{ id: 'l1', nazwa: 'Rows', opis: '60 rows' }], calosc: null },
    { id: 'c2', nazwa: 'Blanket', rzedy: 20, cel: null, paraZ: null, calosc: 20, liczniki: [{ id: 'l2', nazwa: 'Square 1', opis: '12 rows' }, { id: 'l3', nazwa: 'Square 2', opis: '8 rows' }] },
    { id: 'c3', nazwa: 'Right sleeve', rzedy: 0, cel: null, paraZ: 'c1', paraNazwa: 'Back', liczniki: [{ id: 'l4', nazwa: 'Rows', opis: '0 rows' }], calosc: null },
  ],
  szczegoly: { narzedzie: 'Needles', rozmiar: '4 mm (US 6)', termin: 'Oct 31' }, ...z,
});
function pokaz(s = stan(), edycja = false) {
  const w = {
    naOtworzCzesc: jest.fn(), naOtworzLicznik: jest.fn(), naDodajCzesc: jest.fn(), naDodajLicznik: jest.fn(), naNotatka: jest.fn(), naNarzedzie: jest.fn(), naTermin: jest.fn(),
    naEdytuj: jest.fn(), naKoniecEdycji: jest.fn(), naZrobTakaSama: jest.fn(), naUsunProjekt: jest.fn(), naWznow: jest.fn(), naUsunCzesc: jest.fn(), naUsunLicznik: jest.fn(), naWstecz: jest.fn(),
  };
  render(<Projekt stan={s} t={t} edycja={edycja} {...w} />);
  return w;
}

describe('Projekt (partia 5)', () => {
  test('P-307: opis części z celem — forma liczby mnogiej wg celu: „60 of 96 rows”, „0 of 1 row”', () => {
    pokaz(stan({ czesci: [
      { id: 'c1', nazwa: 'Back', rzedy: 60, cel: 96, paraZ: null, liczniki: [{ id: 'l1', nazwa: 'Rows', opis: '60 rows' }], calosc: null },
      { id: 'c9', nazwa: 'Tag', rzedy: 0, cel: 1, paraZ: null, liczniki: [{ id: 'l9', nazwa: 'Rows', opis: '0 rows' }], calosc: null },
    ] }));
    expect(screen.getByText('60 of 96 rows')).toBeTruthy();
    expect(screen.getByText('0 of 1 row')).toBeTruthy();
  });
  test('RD-14: postęp z opisem przybliżenia; linia terminu; grupy Parts, Note, Details; ostatnia zmiana (BR-PRJ-005)', () => {
    pokaz();
    expect(screen.getByText('51% done')).toBeTruthy();
    expect(screen.getByText('Approximate, counted from rows of parts with a goal.')).toBeTruthy();
    expect(screen.getByText('Done by Oct 31 · today 3 of 10 rows')).toBeTruthy();
    for (const n of ['Parts', 'Note', 'Details']) expect(screen.getByText(n)).toBeTruthy();
    expect(screen.getByText('4 mm (US 6)')).toBeTruthy();
    expect(screen.getByText('Last change Oct 22')).toBeTruthy();
  });

  test('BR-LIC-018: część z kilkoma licznikami → „Whole piece: 20 rows” i wcięte liczniki; para „Pair of Back” z celem z pary', () => {
    const w = pokaz();
    expect(screen.getByText('Whole piece: 20 rows')).toBeTruthy();
    fireEvent.press(screen.getByText('Square 2'));
    expect(w.naOtworzLicznik).toHaveBeenCalledWith('l3');
    expect(screen.getByText('Pair of Back')).toBeTruthy();
    expect(screen.getByText('The goal comes from Back once it has rows.')).toBeTruthy();
  });

  test('BR-PRJ-002: notatka otwiera arkusz (etykieta „Note: … . Edit”); bez notatki „Add a note”', () => {
    const w = pokaz();
    fireEvent.press(przycisk('Note: Switch to 4 mm for the cuff. Edit', 'button'));
    expect(w.naNotatka).toHaveBeenCalledTimes(1);
    pokaz(stan({ notatka: null }));
    expect(screen.getByText('Add a note')).toBeTruthy();
  });

  test('„+” → Add part / Add counter; ••• → Edit, Make another, Delete project… (P-183 3a)', () => {
    const w = pokaz();
    fireEvent.press(przycisk('Add part or counter', 'button'));
    fireEvent.press(screen.getByText('Add counter'));
    expect(w.naDodajLicznik).toHaveBeenCalledTimes(1);
    fireEvent.press(przycisk('Project options', 'button'));
    expect(screen.queryByText('Resume project')).toBeNull();
    fireEvent.press(screen.getByTestId('projekt-usun'));
    expect(w.naUsunProjekt).toHaveBeenCalledTimes(1);
    fireEvent.press(przycisk('Project options', 'button'));
    fireEvent.press(screen.getByTestId('projekt-zrob-taka-sama'));
    expect(w.naZrobTakaSama).toHaveBeenCalledTimes(1);
  });

  test('ukończony: bez „+”, w ••• pierwsze „Resume project”', () => {
    const w = pokaz(stan({ ukonczony: true }));
    expect(screen.queryByTestId('projekt-dodaj')).toBeNull();
    fireEvent.press(przycisk('Project options', 'button'));
    fireEvent.press(screen.getByTestId('projekt-wznow'));
    expect(w.naWznow).toHaveBeenCalledTimes(1);
  });

  test('tryb Edit: ⊖ przy części i liczniku z etykietą „Delete …”, informacja o koszu, „Done” kończy', () => {
    const w = pokaz(stan(), true);
    expect(screen.getByText('Deleted parts and counters stay in Recently deleted for 30 days.')).toBeTruthy();
    fireEvent.press(przycisk('Delete Blanket', 'button'));
    expect(w.naUsunCzesc).toHaveBeenCalledWith('c2');
    fireEvent.press(przycisk('Delete Square 1', 'button'));
    expect(w.naUsunLicznik).toHaveBeenCalledWith('l2');
    fireEvent.press(przycisk('Done', 'button'));
    expect(w.naKoniecEdycji).toHaveBeenCalledTimes(1);
  });

  test('BR-DNI-005: bez terminu brak linii terminu, w Details „None”; narzędzie nieustawione → „Needles or hook” + „Add”', () => {
    pokaz(stan({ termin: null, szczegoly: { narzedzie: null, rozmiar: null, termin: null } }));
    expect(screen.queryByText(/Done by .* ·/)).toBeNull();
    expect(screen.getByText('None')).toBeTruthy();
    expect(screen.getByText('Needles or hook')).toBeTruthy();
    expect(screen.getByText('Add')).toBeTruthy();
  });
});

describe('data ukończenia (F-51, design-spec „Data ukończenia”)', () => {
  test('ukończony: grupa „Started” / „Finished” z podpisem; stuknięcie w „Finished” rozwija wybór daty od startu do dziś, wybór zapisuje od razu', () => {
    const naDataUkonczenia = jest.fn();
    render(<Projekt stan={stan({ ukonczony: true, daty: { start: 'Oct 1, 2026', koniec: 'Oct 20, 2026', startDzien: '2026-10-01', koniecDzien: '2026-10-20', dzis: '2026-10-22' } })}
      t={t} naOtworzCzesc={jest.fn()} naDataUkonczenia={naDataUkonczenia} />);
    expect(screen.getByText('The calendar and the weekly summary count the project as finished on this day.')).toBeTruthy();
    expect(screen.queryByTestId('projekt-data-ukonczenia-wybor')).toBeNull();
    fireEvent.press(przycisk('Finished, Oct 20, 2026', 'button'));
    const wybor = screen.getByTestId('projekt-data-ukonczenia-wybor');
    expect([new Date(wybor.props.minimumDate).getDate(), new Date(wybor.props.maximumDate).getDate()]).toEqual([1, 22]); // natywny komponent dostaje ms
    fireEvent(wybor, 'onValueChange', { type: 'set', nativeEvent: {} }, new Date(2026, 9, 18, 12));
    expect(naDataUkonczenia).toHaveBeenCalledWith('2026-10-18');
  });
  test('w toku: bez grupy dat', () => {
    render(<Projekt stan={stan()} t={t} naOtworzCzesc={jest.fn()} />);
    expect(screen.queryByText('Finished')).toBeNull();
  });
});

describe('czas projektu (P-191 P4a, makieta projekt-czas)', () => {
  test('grupa „Time”: suma i „Sessions” z linią do sprawdzenia; stuknięcie otwiera sesje', () => {
    const naSesje = jest.fn();
    render(<Projekt stan={stan({ czas: { suma: '18 h 10 min', sesje: 12, doSprawdzenia: 1 } })} t={t} naOtworzCzesc={jest.fn()} naSesje={naSesje} />);
    expect(screen.getByRole('header', { name: 'Time' })).toBeTruthy();
    expect(screen.getByText('18 h 10 min')).toBeTruthy();
    expect(screen.getByText('1 session to check')).toBeTruthy();
    fireEvent.press(screen.getByTestId('projekt-sesje'));
    expect(naSesje).toHaveBeenCalledTimes(1);
  });
  test('bez sesji: sam wiersz „Time shows here when you use the stopwatch.”, bez „0 h” i bez „Sessions”', () => {
    render(<Projekt stan={stan({ czas: { suma: null, sesje: 0, doSprawdzenia: 0 } })} t={t} naOtworzCzesc={jest.fn()} naSesje={jest.fn()} />);
    expect(screen.getByText('Time shows here when you use the stopwatch.')).toBeTruthy();
    expect(screen.queryByTestId('projekt-sesje')).toBeNull();
  });
});

describe('U-10 na ekranie projektu (grupa D)', () => {
  test('wiersz „Swatch” w „Details” z wartością albo „Add”, otwiera kalkulator', () => {
    const naProbka = jest.fn();
    const s = stan({ szczegoly: { narzedzie: 'Needles', rozmiar: '4 mm (US 6)', termin: null, probka: '22 stitches / 10 cm' } });
    const r = render(<Projekt stan={s} t={t} naOtworzCzesc={jest.fn()} naProbka={naProbka} />);
    expect(screen.getByTestId('projekt-probka')).toBeTruthy();
    expect(screen.getByText('22 stitches / 10 cm')).toBeTruthy();
    fireEvent.press(screen.getByTestId('projekt-probka'));
    expect(naProbka).toHaveBeenCalled();
    r.rerender(<Projekt stan={stan({ szczegoly: { narzedzie: null, rozmiar: null, termin: null, probka: null } })} t={t} naOtworzCzesc={jest.fn()} naProbka={naProbka} />);
    expect(screen.getAllByText('Add').length).toBeGreaterThan(0);
  });
});
