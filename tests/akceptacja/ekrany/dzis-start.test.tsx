// 07-e2e (2026-11-08), test przed kodem p2: pierwszy ekran aplikacji to „Dziś” z kartą „Pierwszy licznik”; „+1” karty to to samo zdarzenie co +1 licznika.
// Wyrocznia: NFR-PIE-001 i BR-LIC-001/S1, S2 po ER-68 (docs/brd/wymagania.md:89–92, wymagania-licznik.md:8–15), ZM-18 (docs/scope-contract.md, wiersz „08 (p2)”:
// „»+1« karty przez ten sam przypadek użycia co licznik … bez drugiej ścieżki zapisu”), STOP 3 M3 „flagi danych: żadna (p2: test równoważności +1 karty i licznika)”,
// P-563 (10a) (na „Dziś” bez odnośnika „Oczko Pro”), BR-ZAK-006/S1 po ER-70 (limit zawczasu na karcie zamiast „+1”, dzianina/design-spec.md:73).
// testID z kontraktu e2e/README.md (wiersze `dzis-*`, 07-e2e). Harness jak tests/ekrany/aplikacja.test.tsx (atrapy portów, `UslugiAplikacji` = atrapa przypadków użycia).
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Aplikacja, type UslugiAplikacji } from '../../../src/ekrany/Aplikacja';
import type { EkranAktywny, Sklep } from '../../../src/domena/porty';
import type { Tlumacz } from '../../../src/ekrany/wspolne';
import type { StanEkranuLicznika } from '../../../src/ekrany/Licznik';
import { atrapaCyklu, atrapaHaptyki, atrapaSystemu, plusOk, stanLicznika, tEn, zagrane } from '../../ekrany/pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const SWIEZA = () => stanLicznika({ projekt: null, czesc: null, skonczone: 0, dziergany: 1 }); // BR-LIC-001/S1: licznik bez projektu z 0
function pokaz(licznik: StanEkranuLicznika = SWIEZA()) {
  const sklep = { produkty: jest.fn(async () => []), kup: jest.fn(), przywroc: jest.fn(), transakcje: jest.fn(async () => []), obserwuj: jest.fn(() => () => {}) } as unknown as jest.Mocked<Sklep>;
  const ekranAktywny: jest.Mocked<EkranAktywny> = { wlacz: jest.fn(), wylacz: jest.fn() };
  const haptyka = atrapaHaptyki();
  const uslugi: jest.Mocked<UslugiAplikacji> = {
    start: jest.fn(async () => ({ licznik, ekranWlaczony: false })),
    dodajRzad: jest.fn(async () => plusOk(licznik.skonczone + 1)),
    scalDziennik: jest.fn(async () => {}),
    przyTle: jest.fn(async () => {}),
  };
  const { cykl } = atrapaCyklu();
  render(<Aplikacja porty={{ sklep, ekranAktywny, haptyka }} uslugi={uslugi} cykl={cykl} system={atrapaSystemu()} oglos={jest.fn()} t={t} />);
  return { sklep, uslugi, haptyka };
}

describe('„Dziś” jako pierwszy ekran (ZM-18, P-563 4a)', () => {
  test('NFR-PIE-001 / BR-LIC-001/S1 (ER-68): pierwszy ekran „Dziś”, karta z 0 i „+1”, bez powitania, quizu, zakupu i odnośnika Pro', async () => {
    pokaz();
    expect(await screen.findByTestId('dzis-karta')).toBeTruthy();
    expect(screen.getByTestId('dzis-wartosc')).toHaveTextContent('0');
    expect(screen.getByTestId('dzis-plus')).toBeTruthy();
    expect(screen.getByTestId('dzis-kontynuuj')).toBeTruthy(); // „Otwórz licznik ›” (dzianina/design-spec.md:68)
    expect(screen.queryByText(/Welcome|Get started|Sign in|Allow|quiz/i)).toBeNull();
    expect(screen.queryByText(/Oczko Pro/)).toBeNull(); // P-563 (10a)
    expect(screen.queryByTestId('licznik-plus')).toBeNull(); // licznik na własnej trasie, nie pierwszy ekran
  });

  test('BR-LIC-001/S2 (ER-68): „+1” karty = +1 licznika — ten sam przypadek użycia raz, wibracja „plus” po wyniku, karta 1 bez zmiany ekranu', async () => {
    const { uslugi, haptyka } = pokaz();
    fireEvent.press(await screen.findByTestId('dzis-plus'));
    await waitFor(() => expect(uslugi.dodajRzad).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(zagrane(haptyka, 'plus')).toBe(1)); // F-01; jak +1 licznika (tests/ekrany/licznik.test.tsx, R-148)
    await waitFor(() => expect(screen.getByTestId('dzis-wartosc')).toHaveTextContent('1'));
    expect(screen.getByTestId('dzis-karta')).toBeTruthy();
    expect(screen.queryByTestId('licznik-plus')).toBeNull();
  });

  test('BR-ZAK-006/S1 (ER-70): limit zawczasu na karcie — bez „+1”, komunikat limitu z odnośnikiem Pro, „Kontynuuj ›” działa, bez ekranu zakupu', async () => {
    const { uslugi, sklep } = pokaz(stanLicznika({ skonczone: 5, dziergany: 6, limit: { rodzaj: 'zawczasu' }, miesiac: { nazwa: 'November', wznowienie: 'December 1', rzedyDanych: 5 } }));
    expect(await screen.findByTestId('dzis-karta')).toBeTruthy();
    expect(screen.queryByTestId('dzis-plus')).toBeNull();
    expect(screen.getByTestId('limit-zawczasu')).toBeTruthy();
    expect(screen.getByTestId('limit-oferta-link')).toBeTruthy();
    expect(screen.getByTestId('dzis-kontynuuj')).toBeTruthy();
    expect(uslugi.dodajRzad).not.toHaveBeenCalled();
    expect(sklep.kup).not.toHaveBeenCalled();
  });
});
