// Limit dni na ekranie licznika (BR-ZAK-006, KP-13; P-065 (1a), (2a); design-spec.md:15–19, :65; ekrany.html `limit`, `limit-zawczasu`).
// Decyzję „zawczasu / praca w toku” liczy domena (`mozeZaczacDzien`, wektory Z-02, Z-03, L-04); ekran pokazuje stan, który dostał.
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Licznik, type StanEkranuLicznika, type WynikPlus } from '../../src/ekrany/Licznik';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaHaptyki, plusOk, przycisk, stanLicznika, tEn, wywolaniaLicznika, znajdzPrzycisk } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

function pokaz(stan: StanEkranuLicznika, naPlus?: () => Promise<WynikPlus>) {
  const w = wywolaniaLicznika(naPlus);
  const oglos = jest.fn();
  const haptyka = atrapaHaptyki();
  const r = render(<Licznik stan={stan} t={t} oglos={oglos} haptyka={haptyka} {...w} />);
  const ponow = (s: StanEkranuLicznika) => r.rerender(<Licznik stan={s} t={t} oglos={oglos} haptyka={haptyka} {...w} />);
  return { w, oglos, ponow };
}
const NA_LIMICIE = { cel: 96, skonczone: 61, dziergany: 62, miesiac: { nazwa: 'November', wznowienie: 'December 1', rzedyDanych: 61 } };

describe('Licznik: limit dni', () => {
  test('BR-ZAK-006/S1: nowy dzień ponad limit — komunikat zamiast +1 i −1, odnośnik do Pro poza strefą +1 (design-spec.md:16)', () => {
    const { w } = pokaz(stanLicznika({ ...NA_LIMICIE, limit: { rodzaj: 'zawczasu' } }));
    expect(screen.queryByRole('button', { name: /^\+1 row/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^−1 row/ })).toBeNull();
    // design-spec.md:16 „No free crafting days left in {month}. Counting is paused until {date}. Your {n} rows and everything else are kept.”
    expect(screen.getByText(/No free crafting days left in November/)).toBeTruthy();
    expect(screen.getByText(/Counting is paused until December 1/)).toBeTruthy();
    expect(screen.getByText(/Your 61 rows and everything else are kept\./)).toBeTruthy();
    // design-spec.md:16 odnośnik „Oczko Pro removes the limit” (ekrany.html:152 role="link")
    expect(w.naOferty).not.toHaveBeenCalled();
    fireEvent.press(przycisk('Oczko Pro removes the limit', 'link'));
    expect(w.naOferty).toHaveBeenCalledTimes(1);
    // BR-ZAK-006/S1 „Oraz historia, menu projektu … działają” (ekrany.html:149 aria-label="History", "Project options")
    fireEvent.press(przycisk('History', 'button'));
    fireEvent.press(screen.getByRole('button', { name: /^Project options/ }));
    expect(w.naHistorie).toHaveBeenCalledTimes(1);
    expect(w.naMenu).toHaveBeenCalledTimes(1);
  });

  test('KP-13: komunikat limitu to nie ekran zakupu — bez planów, cen i przywracania', () => {
    pokaz(stanLicznika({ ...NA_LIMICIE, limit: { rodzaj: 'zawczasu' } }));
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'Restore purchases' })).toBeNull();
    expect(screen.queryByText(/[$€£]\s?\d|\d\s?zł/)).toBeNull();
  });

  test('BR-ZAK-006/S2: praca po północy bez przerwy (L-04) — przyciski +1 i −1 zostają', async () => {
    const { w } = pokaz(stanLicznika({ ...NA_LIMICIE, limit: { rodzaj: 'brak' } }), async () => plusOk(62));
    expect(screen.queryByText(/No free crafting days/)).toBeNull();
    expect(screen.getByRole('button', { name: /^−1 row/ })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: /^\+1 row/ }));
    await waitFor(() => expect(w.naPlus).toHaveBeenCalledTimes(1));
  });

  test('BR-ZAK-006/S3: nowy dzień przy otwartej aplikacji — „Row 62 wasn’t added”, potem stan zawczasu (design-spec.md:17, :65)', async () => {
    const { w, oglos, ponow } = pokaz(stanLicznika({ ...NA_LIMICIE, limit: { rodzaj: 'brak' } }), async () => ({ ok: false, powod: 'limit' }));
    fireEvent.press(screen.getByRole('button', { name: /^\+1 row/ }));
    // design-spec.md:17 arkusz „Row {n} wasn’t added”; :65 fokus na nagłówku (ekrany.html:133 aria-label="Row 62 wasn’t added")
    expect(await znajdzPrzycisk('Row 62 wasn’t added', 'header')).toBeTruthy();
    // ekrany.html:137–138 treść arkusza (definicja dnia, dane zostają)
    expect(screen.getByText('Your 5 free crafting days for November are used. A crafting day starts with your first row that day; they come back on December 1.')).toBeTruthy();
    expect(screen.getByText('Nothing is lost: your 61 rows, projects, history and export all stay.')).toBeTruthy();
    // design-spec.md:65 ogłoszenie
    expect(oglos).toHaveBeenCalledWith('Row 62 wasn’t added. Free crafting days for November are used. Nothing is lost.');
    expect(oglos).not.toHaveBeenCalledWith(expect.stringMatching(/done\. Now row/));
    // design-spec.md:48 „Not now” — neutralna odmowa
    fireEvent.press(przycisk('Not now', 'button'));
    expect(screen.queryByText(/wasn’t added/)).toBeNull();
    expect(w.naOferty).not.toHaveBeenCalled();
    ponow(stanLicznika({ ...NA_LIMICIE, limit: { rodzaj: 'zawczasu' } }));
    expect(screen.getByText(/No free crafting days left in November/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^\+1 row/ })).toBeNull();
  });

  test('BR-ZAK-006/S3: „See Oczko Pro” z arkusza limitu otwiera oferty (ekrany.html:141)', async () => {
    const { w } = pokaz(stanLicznika({ ...NA_LIMICIE, limit: { rodzaj: 'brak' } }), async () => ({ ok: false, powod: 'limit' }));
    fireEvent.press(screen.getByRole('button', { name: /^\+1 row/ }));
    fireEvent.press(await znajdzPrzycisk('See Oczko Pro', 'button'));
    expect(w.naOferty).toHaveBeenCalledTimes(1);
  });

  test('BR-ZAK-006/S6: ostatni darmowy dzień — cicha linia pod liczbą (design-spec.md:18, P-065 (2a))', () => {
    pokaz(stanLicznika({ limit: { rodzaj: 'ostatni-darmowy' } }));
    // design-spec.md:18 „1 free crafting day left in November”
    expect(screen.getByText('1 free crafting day left in November')).toBeTruthy();
    expect(screen.getByRole('button', { name: /^\+1 row/ })).toBeTruthy();
  });

  test('BR-ZAK-006/S5: licznik nie pokazuje liczby dni, gdy zostało więcej niż 1 (P-046)', () => {
    pokaz(stanLicznika({ limit: { rodzaj: 'brak' } }));
    expect(screen.queryByText(/free crafting days? left/)).toBeNull();
  });
});
