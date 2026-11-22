// Przekazanie 01 → 07 (P-202, P-195 Q1/Q2a, P-193): testy oczekujące dla 08 — czerwone na asercji do czasu kodu.
// BR-DAN-011/S3 (ER-52): Stan danych na telefonie pokazuje czas ostatniego kontaktu z zegarkiem BEZ liczby zmian czekających na zegarku
// (liczbę zna tylko zegarek, ADR-0009). Sygnatura `zegarek: { ostatniKontakt }` to propozycja 07 (Z07-22) — 08 może ją zmienić z testem.
// BR-PRJ-013/S4: przeniesione przez 08 (partia 5, bd0b1f0) do tests/ekrany/sesje.test.tsx w sygnaturze KorektaSesji 08.
// 08 (partia 5, sesja 3): plik przeniesiony z tests/akceptacja/ (DS-02) w commicie, który zazielenia S3; asercje bez zmian.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StanDanych, type PropsStanuDanych } from '../../src/ekrany/StanDanych';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

describe('P-202: przekazanie 01 (BR-DAN-011/S3)', () => {
  test('BR-DAN-011/S3: ostatni kontakt z zegarkiem 2 godziny temu → czas kontaktu widoczny, bez liczby zmian na zegarku', () => {
    const stan = { synchronizacja: 'wylaczona', ostatniaUdana: null, czekaNaSiec: false, zegarek: { ostatniKontakt: 'Nov 10, 14:00' } } as unknown as PropsStanuDanych['stan'];
    render(<StanDanych stan={stan} t={t} />);
    expect(screen.getByText(/Nov 10, 14:00/)).toBeTruthy();
    expect(screen.queryByText(/change(s)? waiting/i)).toBeNull();
  });
});
