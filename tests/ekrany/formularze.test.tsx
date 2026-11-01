// Formularze w arkuszach (F-05, F-06, F-45, F-51; prototyp.html:130–138; design-spec.md:45, :67). Walidacja z BR; komunikat błędu bez
// makiety → zapytanie po roli „alert” bez etykiety wzorcowej (Z07-05).
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { FormularzPowtorzenia, FormularzPrzypomnienia, FormularzWartosci, KorektaSesji, type PlanPrzypomnieniaEkranu } from '../../src/ekrany/Formularze';
import type { Tlumacz, WynikEkranu } from '../../src/ekrany/wspolne';
import { przycisk, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const ok = async (): Promise<WynikEkranu<void>> => ({ ok: true, wartosc: undefined });

describe('Formularze', () => {
  test('BR-LIC-017/S7: wartość ujemna albo tekst — licznik bez zmian, komunikat (prototyp.html:132)', async () => {
    const naZapisz = jest.fn(ok);
    render(<FormularzWartosci stan={{ obecna: 42 }} t={t} jezyk="en" tekstLimitu="" naZapisz={naZapisz} naAnuluj={jest.fn()} />);
    // prototyp.html:132 pole „Rows already finished”, podgląd „You’ll continue on row 43.”
    expect(screen.getByText('You’ll continue on row 43.')).toBeTruthy();
    for (const zle of ['-3', 'abc']) {
      fireEvent.changeText(screen.getByLabelText('Rows already finished'), zle);
      fireEvent.press(przycisk('Save', 'button')); // design-spec.md:45 „Save / Cancel”
      expect(naZapisz).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toBeTruthy(); // Z07-05: tekst „liczba całkowita od 0” bez makiety
    }
    fireEvent.changeText(screen.getByLabelText('Rows already finished'), '50');
    fireEvent.press(przycisk('Save', 'button'));
    await waitFor(() => expect(naZapisz).toHaveBeenCalledWith(50));
  });

  test('BR-LIC-007/S3: długość powtórzenia 0 — bez zapisu, prośba o co najmniej 1 (RD-12-W5; Z07-05)', () => {
    const naZapisz = jest.fn(ok);
    render(<FormularzPowtorzenia stan={{ nazwa: 'Cable pattern', dlugosc: null }} t={t} naZapisz={naZapisz} naAnuluj={jest.fn()} />);
    // Z07-05: formularz powtórzenia bez makiety; etykieta robocza 07 (pole liczby rzędów powtórzenia)
    fireEvent.changeText(screen.getByLabelText(/rows/i), '0');
    fireEvent.press(przycisk('Save', 'button'));
    expect(naZapisz).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  test('BR-LIC-010/S1: od rzędu 6, co 6, 5 razy — lista 6, 12, 18, 24, 30 w podglądzie i etykiecie zapisu (design-spec.md:67)', async () => {
    const naZapisz = jest.fn(ok);
    // podgląd z domeny (RD-13); wyrocznia listy: scenariusz BR-LIC-010/S1 (docs/brd/wymagania-licznik.md:144)
    const podglad = jest.fn((p: PlanPrzypomnieniaEkranu): WynikEkranu<number[]> =>
      p.od === 6 && p.co === 6 && p.razy === 5 ? { ok: true, wartosc: [6, 12, 18, 24, 30] } : { ok: false, powod: 'bledne_dane' });
    render(<FormularzPrzypomnienia stan={{ tekst: '', od: null, co: null, razy: null }} t={t} podglad={podglad} naZapisz={naZapisz} naAnuluj={jest.fn()} />);
    // prototyp.html:136–137 etykiety pól; design-spec.md:67 „każde pole z accessibilityLabel”
    fireEvent.changeText(screen.getByLabelText('What to do'), 'decrease at both ends');
    fireEvent.changeText(screen.getByLabelText('Starting on row'), '6');
    fireEvent.changeText(screen.getByLabelText('Every … rows'), '6');
    fireEvent.changeText(screen.getByLabelText('How many times'), '5');
    // prototyp.html:138 „You’ll be reminded on rows: …”
    expect(await screen.findByText('You’ll be reminded on rows: 6, 12, 18, 24, 30')).toBeTruthy();
    // design-spec.md:67 „podgląd planu rzędów dołączony do etykiety „Save reminder””
    fireEvent.press(screen.getByRole('button', { name: /^Save reminder.*6, 12, 18, 24, 30/ }));
    await waitFor(() => expect(naZapisz).toHaveBeenCalledWith({ tekst: 'decrease at both ends', od: 6, co: 6, razy: 5 }));
  });

  test('BR-LIC-010/S2: bez rzędu początkowego — prośba o rząd, bez zgadywania (OP-06; Z07-05)', () => {
    const naZapisz = jest.fn(ok);
    const podglad = jest.fn((_p: PlanPrzypomnieniaEkranu): WynikEkranu<number[]> => ({ ok: false, powod: 'bledne_dane' }));
    render(<FormularzPrzypomnienia stan={{ tekst: '', od: null, co: null, razy: null }} t={t} podglad={podglad} naZapisz={naZapisz} naAnuluj={jest.fn()} />);
    fireEvent.changeText(screen.getByLabelText('What to do'), 'decrease at both ends');
    fireEvent.changeText(screen.getByLabelText('Every … rows'), '6');
    fireEvent.changeText(screen.getByLabelText('How many times'), '5');
    fireEvent.press(screen.getByRole('button', { name: /^Save reminder/ }));
    expect(naZapisz).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(podglad.mock.calls.every(([p]) => !Number.isFinite(p.od))).toBe(true); // rząd początkowy nie zgadywany
  });

  // Zmiana 08 (partia 5, P-191 P4a): makieta 04 fix-6 `sesja-korekta` zastąpiła pola tekstowe Z07-05 systemowym wyborem daty i godziny;
  // sens bez zmian — koniec przed początkiem nie zapisuje się i daje komunikat. Pozostałe przypadki: tests/ekrany/sesje.test.tsx.
  test('BR-PRJ-013/S3: koniec sesji 19:30 przed początkiem 20:00 — bez zapisu, komunikat (makieta sesja-korekta-blad)', () => {
    const naZapisz = jest.fn(ok);
    const d = (h: number, m: number) => new Date(2026, 9, 22, h, m).getTime();
    render(<KorektaSesji stan={{ startMs: d(20, 0), koniecMs: d(22, 10), terazMs: d(23, 0), przerwyMs: 0, doSprawdzenia: null, czasInnychMs: 0 }} t={t}
      formatuj={{ dataGodzina: (ms) => String(ms), czas: (ms) => `${ms / 60_000} min` }} naZapisz={naZapisz} naAnuluj={jest.fn()} />);
    fireEvent.press(screen.getByTestId('formularz-sesja-koniec'));
    fireEvent(screen.getByTestId('formularz-sesja-koniec-wybor'), 'onValueChange', { type: 'set', nativeEvent: {} }, new Date(2026, 9, 22, 19, 30));
    fireEvent.press(przycisk('Save', 'button'));
    expect(naZapisz).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeTruthy();
  });
});
