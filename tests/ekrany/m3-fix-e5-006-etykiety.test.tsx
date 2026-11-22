// 006 etykiety (P-614 (1), zadania-08 „Wstecz”): „wstecz” = tytuł poprzedniego ekranu w stosie; nazwa dłuższa niż ok. 1/3 paska → „Back”.
// Część 3 (08c): czysta funkcja trasa poprzednia → klucz tytułu + `Wstecz` czyta etykietę z kontekstu (hak w kompozycji, expo-router).
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { kluczTytuluDynamicznego, miesciSieWPasku, tytulPoprzedniej, type TrasaStosu } from '../../src/kompozycja/wstecz';
import { KontekstWstecz, Wstecz } from '../../src/ekrany/Pasek';

const zakladki = (z?: string): TrasaStosu => ({ key: 'z-1', name: '(zakladki)', ...(z ? { state: { index: 0, routes: [{ name: z }] } } : {}) });
const BRAK = new Map<string, string>();

describe('tytulPoprzedniej', () => {
  test('z „Dziś” do licznika: „zakladki.dzis”; z Projektów: „zakladki.projekty”; grupa bez stanu = Dziś', () => {
    expect(tytulPoprzedniej([zakladki('index'), { key: 'l', name: 'licznik' }], 'l', BRAK)).toEqual({ klucz: 'zakladki.dzis' });
    expect(tytulPoprzedniej([zakladki('projekty'), { key: 'p', name: 'projekt/[id]' }], 'p', BRAK)).toEqual({ klucz: 'zakladki.projekty' });
    expect(tytulPoprzedniej([zakladki(), { key: 'l', name: 'licznik' }], 'l', BRAK)).toEqual({ klucz: 'zakladki.dzis' });
    expect(tytulPoprzedniej([zakladki('narzedzia'), { key: 'u', name: 'ustawienia' }], 'u', BRAK)).toEqual({ klucz: 'zakladki.narzedzia' });
  });
  test('ekran stosu: klucz jego tytułu (Ustawienia → Język: „ustawienia.tytul”)', () => {
    expect(tytulPoprzedniej([zakladki('narzedzia'), { key: 'u', name: 'ustawienia' }, { key: 'j', name: 'jezyk' }], 'j', BRAK)).toEqual({ klucz: 'ustawienia.tytul' });
  });
  test('tytuł dynamiczny z rejestru (projekt → licznik: nazwa projektu)', () => {
    const r = new Map([[kluczTytuluDynamicznego('projekt/[id]', 'p1'), 'Vest']]);
    expect(tytulPoprzedniej([zakladki('projekty'), { key: 'p', name: 'projekt/[id]', params: { id: 'p1' } }, { key: 'l', name: 'licznik' }], 'l', r)).toEqual({ tekst: 'Vest' });
  });
  test('brak poprzedniej albo trasa bez tytułu (arkusz) → null („Back”)', () => {
    expect(tytulPoprzedniej([{ key: 'l', name: 'licznik' }], 'l', BRAK)).toBeNull();
    expect(tytulPoprzedniej([zakladki('index'), { key: 'f', name: 'formularz/[rodzaj]' }, { key: 'l', name: 'licznik' }], 'l', BRAK)).toBeNull();
    expect(tytulPoprzedniej([zakladki('index'), { key: 'p', name: 'projekt/[id]' }, { key: 'l', name: 'licznik' }], 'l', BRAK)).toBeNull();
  });
});

describe('miesciSieWPasku (ok. 1/3 paska)', () => {
  const w = { szerokoscOkna: 390, skalaTekstu: 1, ptTresci: 17, marginesPaska: 16, maxSkala: 1.8 };
  test('„Today” i „Projects” mieszczą się; długa nazwa projektu nie', () => {
    expect(miesciSieWPasku('Today', w)).toBe(true);
    expect(miesciSieWPasku('Projects', w)).toBe(true);
    expect(miesciSieWPasku('Counter from Nov 10 at 7:30 PM', w)).toBe(false);
  });
  test('większa skala tekstu zmniejsza miejsce (limit ×1,8)', () => {
    expect(miesciSieWPasku('Settings', { ...w, skalaTekstu: 3.571 })).toBe(false);
  });
});

describe('Wstecz: tekst z kontekstu, „Back” bez niego', () => {
  test('bez dostawcy: tekst z propsa („Back”)', () => {
    render(<Wstecz tekst="Back" onPress={jest.fn()} />);
    expect(screen.getByTestId('nav-wstecz').props.accessibilityLabel).toBe('Back');
    expect(screen.getByText('Back')).toBeTruthy();
  });
  // Zmiana jawna, wyjątek nazwany P-627 (04-studio-projektowe-017 A): VoiceOver czyta systemowe „Back” (bez fali tłumaczeń); było: etykieta = tytuł.
  test('z dostawcą: tytuł poprzedniego ekranu w widocznym tekście, etykieta VoiceOver „Back” (017, P-627 A)', () => {
    render(<KontekstWstecz.Provider value={() => 'Today'}><Wstecz tekst="Back" onPress={jest.fn()} /></KontekstWstecz.Provider>);
    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByTestId('nav-wstecz').props.accessibilityLabel).toBe('Back');
  });
  test('dostawca bez tytułu (null) → „Back”; jawna etykieta (pasek wzoru) wygrywa', () => {
    render(<KontekstWstecz.Provider value={() => null}><Wstecz tekst="Back" onPress={jest.fn()} /></KontekstWstecz.Provider>);
    expect(screen.getByText('Back')).toBeTruthy();
  });
});
