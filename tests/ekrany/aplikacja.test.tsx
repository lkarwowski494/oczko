// Korzeń aplikacji (NFR-PIE-001, BR-LIC-001, KP-07, KP-08, KP-13, BR-DAN-012/S2, R-020, R-091). Atrapy portów z src/domena/porty.ts;
// `UslugiAplikacji` = atrapa przypadków użycia (sygnatury [DO USTALENIA] 05).
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Aplikacja, type UslugiAplikacji } from '../../src/ekrany/Aplikacja';
import type { EkranAktywny, Sklep } from '../../src/domena/porty';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaCyklu, atrapaHaptyki, atrapaSystemu, plusOk, stanLicznika, tEn, znajdzPrzycisk } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
function pokaz(ekranWlaczony = false) {
  const sklep = { produkty: jest.fn(async () => []), kup: jest.fn(), przywroc: jest.fn(), transakcje: jest.fn(async () => []), obserwuj: jest.fn(() => () => {}) } as unknown as jest.Mocked<Sklep>;
  const ekranAktywny: jest.Mocked<EkranAktywny> = { wlacz: jest.fn(), wylacz: jest.fn() };
  const uslugi: jest.Mocked<UslugiAplikacji> = {
    // świeża instalacja: licznik bez nazwy z 0 (BR-LIC-001/S1)
    start: jest.fn(async () => ({ licznik: stanLicznika({ projekt: null, czesc: null, skonczone: 0, dziergany: 1 }), ekranWlaczony })),
    dodajRzad: jest.fn(async () => plusOk(1)),
    scalDziennik: jest.fn(async () => {}),
    przyTle: jest.fn(async () => {}),
  };
  const { cykl, przejdz } = atrapaCyklu();
  const system = atrapaSystemu();
  render(<Aplikacja porty={{ sklep, ekranAktywny, haptyka: atrapaHaptyki() }} uslugi={uslugi} cykl={cykl} system={system} oglos={jest.fn()} t={t} />);
  return { sklep, ekranAktywny, uslugi, przejdz, system };
}

describe('Aplikacja', () => {
  test('NFR-PIE-001 / BR-LIC-001/S1 (po ER-68, M3 p2): pierwszy ekran „Dziś”, 0 ekranów przed nim, pierwszy rząd jednym stuknięciem w „+1” karty', async () => {
    const { uslugi } = pokaz();
    // ekrany.html:102 aria-label="+1 row" (licznik-start)
    const plus = await znajdzPrzycisk('+1 row', 'button');
    expect(screen.queryByText(/Welcome|Get started|Sign in|Allow|quiz/i)).toBeNull();
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    fireEvent.press(plus);
    await waitFor(() => expect(uslugi.dodajRzad).toHaveBeenCalledTimes(1));
  });

  test('KP-07: nasłuch transakcji zarejestrowany od startu, nie tylko na ekranie zakupu', async () => {
    const { sklep } = pokaz();
    await waitFor(() => expect(sklep.obserwuj).toHaveBeenCalledTimes(1));
  });

  test('KP-08 / KP-13: przy starcie bez przywracania i bez ekranu zakupu', async () => {
    const { sklep } = pokaz();
    await znajdzPrzycisk('+1 row', 'button');
    expect(sklep.przywroc).not.toHaveBeenCalled();
    expect(sklep.kup).not.toHaveBeenCalled();
    expect(screen.queryByText(/Oczko Pro|Restore purchases/)).toBeNull();
  });

  test('BR-DAN-012/S2: start i liczenie nie wołają prośby o ocenę', async () => {
    const { system, uslugi } = pokaz();
    fireEvent.press(await znajdzPrzycisk('+1 row', 'button'));
    await waitFor(() => expect(uslugi.dodajRzad).toHaveBeenCalled());
    expect(system.prosbaOOcene).not.toHaveBeenCalled();
  });

  test('R-020: powrót na pierwszy plan scala dziennik ekranu blokady (ADR-0008:11; kolejność vs zapis: Z07-11)', async () => {
    const { uslugi, przejdz } = pokaz();
    await znajdzPrzycisk('+1 row', 'button');
    const przed = uslugi.scalDziennik.mock.calls.length;
    przejdz('background');
    przejdz('active');
    await waitFor(() => expect(uslugi.scalDziennik.mock.calls.length).toBe(przed + 1));
  });

  test('R-091 / NFR-DAN-002: przejście w tło wyłącza każdy tag ekranu aktywnego i robi checkpoint', async () => {
    const { ekranAktywny, uslugi, przejdz } = pokaz(true);
    await znajdzPrzycisk('+1 row', 'button');
    await waitFor(() => expect(ekranAktywny.wlacz).toHaveBeenCalled());
    const tagi = new Set(ekranAktywny.wlacz.mock.calls.map(([tag]) => tag));
    przejdz('background');
    await waitFor(() => expect(uslugi.przyTle).toHaveBeenCalledTimes(1));
    expect(new Set(ekranAktywny.wylacz.mock.calls.map(([tag]) => tag))).toEqual(tagi);
  });
});
