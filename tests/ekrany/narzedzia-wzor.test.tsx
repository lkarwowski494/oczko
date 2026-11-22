// Warstwa „Narzędzia” (P-046): włóczka (F-37, BR-ZAP-001/S2), kalkulator (F-38, BR-KAL-003, R-131); link do filmu przy wzorze (F-55, BR-WZR-007/S4).
// Ekrany nienarysowane (design-spec.md:95; Z07-05).
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Probka, Wloczka } from '../../src/ekrany/Narzedzia';
import { stanProbki } from '../../src/kompozycja/probka';
import { LinkFilmu } from '../../src/ekrany/Wzor';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaSystemu, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

describe('Narzędzia i wzór', () => {
  test('BR-ZAP-001/S2: pielęgnacja jako tekst, bez rysowanych symboli (OG-13, OP-11)', () => {
    const r = render(<Wloczka stan={{ nazwa: 'Fjord Wool, Slate', pielegnacja: { tekst: 'Hand wash, 30 °C, dry flat', zdjecie: null } }} t={t} naZapisz={jest.fn()} />);
    expect(screen.getByText('Hand wash, 30 °C, dry flat')).toBeTruthy();
    expect(screen.queryAllByRole('image')).toHaveLength(0);
    r.rerender(<Wloczka stan={{ nazwa: 'Fjord Wool, Slate', pielegnacja: { tekst: null, zdjecie: 'file:///etykieta.jpg' } }} t={t} naZapisz={jest.fn()} />);
    expect(screen.getAllByRole('image')).toHaveLength(1); // tylko zdjęcie etykiety
  });

  // Zmiana 08 (partia 5, grupa D): `Kalkulator` (pola Z07-05) zastąpiony kalkulatorem „Swatch” z makiety 04 fix-6 (design-spec: `narzedzia.kalk_*`
  // i `narzedzia.oblicz` przestają być używane, P-191). Asercja bez zmian: jednostka z ustawień przy polu długości (szerokości), bez drugiej.
  test('R-131 / BR-KAL-003: jednostka z ustawień widoczna przy polu długości (P-075 (4a); Z07-05)', () => {
    const licz = (w: Parameters<typeof stanProbki>[0]) => stanProbki(w, { t, jezyk: () => 'en-US' });
    // getAll: przełącznik podstawy próbki („per 10 cm” / „per 4 in”) jest na ekranie zawsze (makieta `probka`).
    const r = render(<Probka t={t} jednostka="cm" poczatek={{ oczka: '', na: '10cm' }} licz={licz} />);
    expect(screen.getAllByLabelText(/\bcm\b/).length).toBeGreaterThan(0);
    r.rerender(<Probka t={t} jednostka="in" poczatek={{ oczka: '', na: '4in' }} licz={licz} />);
    expect(screen.getAllByLabelText(/\bin\b|inch/).length).toBeGreaterThan(0);
    expect(screen.queryByLabelText(/^Width you want, cm$/)).toBeNull();
  });

  test('BR-WZR-007/S4: link do filmu bez sieci — informacja, że film wymaga sieci; Oczko trzyma tylko link (Z07-05)', () => {
    const system = atrapaSystemu();
    const r = render(<LinkFilmu stan={{ tytul: 'Cable cast-on video', url: 'https://video.example/abc', siec: 'brak' }} t={t} system={system} />);
    fireEvent.press(screen.getByRole('link', { name: /Cable cast-on video/ }));
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(system.otworzAdres).not.toHaveBeenCalled();
    r.rerender(<LinkFilmu stan={{ tytul: 'Cable cast-on video', url: 'https://video.example/abc', siec: 'jest' }} t={t} system={system} />);
    fireEvent.press(screen.getByRole('link', { name: /Cable cast-on video/ }));
    expect(system.otworzAdres).toHaveBeenCalledWith('https://video.example/abc');
  });
});
