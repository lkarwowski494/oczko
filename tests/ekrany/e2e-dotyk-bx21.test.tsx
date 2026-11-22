// P-954: BX21 (KO-140, wariant B; diagnoza czerwieni iOS 43964020781, KP-10 część 3): w buildzie E2E (`EXPO_PUBLIC_E2E=1`) panel `e2e-dotyk` liczy CYKL DOTYKU celów obok „taps accepted”
// (`e2e-nacisniecia`, BX20): `ts` (onTouchStart: dotyk dotarł do widoku w JS), `pin` (onPressIn: Pressable przejął responder), `pout` (onPressOut: koniec naciśnięcia, także po anulowaniu),
// `te` (onTouchEnd), `tc` (onTouchCancel: system anulował dotyk). Przy czerwieni „stuknięcie dotarło, bez skutku” (panel naciśnięć „none”) rozdziela cztery przypadki:
// ts 0 = dotyk nie dotarł do JS; ts 1, pin 0 = widok dostał dotyk, ale responder przejął ktoś inny; tc 1 = anulowany przez system; pin 1, pout 1, tc 0, naciśnięć 0 = Pressable sam odrzucił naciśnięcie.
// Tylko liczy i przepuszcza zdarzenia — zachowanie aplikacji bez zmian. `licznik-plus` poza panelem (NFR-WYD-001). Strona negatywna: e2e-nacisniecia-bx20-wydanie.test.tsx.
process.env.EXPO_PUBLIC_E2E = '1'; // panele E2E ładuje `src/platforma/tryb-e2e.ts` przy imporcie (require niżej, po ustawieniu)
import React from 'react';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AppState } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Dzis, type DaneDzis, type PropsDzis } from '../../src/ekrany/Dzis';
import { KontekstDotyku, KontekstNacisniec, Wstecz } from '../../src/ekrany/Pasek';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { PanelDotyku, PanelNacisniec, PanelWzoru, PanelZdjecia, haki, opisDotyku, zerujDotyk, zerujNacisniecia, zliczDotyk, zliczNacisniecie } from '../../src/kompozycja/e2e/panele';
import { atrapaHaptyki, plusOk, stanLicznika, tEn } from './pomoc';

const mockRn = jest.requireActual<typeof import('react-native')>('react-native');
const mockReact = React;
const mockWstecz = jest.fn();
jest.mock('expo-router', () => {
  const { Wstecz: W } = jest.requireActual<typeof import('../../src/ekrany/Pasek')>('../../src/ekrany/Pasek');
  const Stack = ({ children }: { children: React.ReactNode }) => mockReact.createElement(mockRn.View, { testID: 'stos' }, children, mockReact.createElement(W, { tekst: 'Back', onPress: () => mockWstecz() }));
  Stack.Screen = () => null;
  return { Stack, useFocusEffect: () => undefined };
});
jest.mock('../../src/kompozycja/start-aplikacji', () => ({
  ...jest.requireActual<object>('../../src/kompozycja/start-aplikacji'),
  rozpocznijStart: async () => ({ tryb: 'normalny' }), zapiszEtap: () => undefined, zapiszWyjscieDoTla: async () => undefined,
}));
jest.mock('../../src/kompozycja/kontener', () => ({
  utworzKontener: async () => ({
    ok: true,
    wartosc: {
      dostep: { nasluchuj: () => () => undefined, odswiez: async () => undefined, stan: () => ({ pro: false }), naZmiane: () => () => undefined },
      z: {}, j: {}, icloud: null, porty: { siec: { stan: () => 'jest', obserwuj: () => () => undefined } },
      wzor: { k: { obserwujSiec: () => () => undefined, poStarcie: async () => undefined, odswiezMigawke: async () => undefined } },
    },
  }),
}));
jest.mock('../../src/kompozycja/wstecz-trasa', () => ({ useTytulPoprzedniego: () => null }));
jest.mock('../../src/kompozycja/bledy-js', () => ({ zainstalujObslugeBledow: () => ({ ustawZapis: () => undefined }) }));
jest.mock('../../src/kompozycja/Kontekst', () => ({ DostawcaAplikacji: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/licznik', () => ({ kompozycjaLicznika: () => ({ zamknij: jest.fn(), poZmianie: jest.fn(async () => undefined) }) }));
jest.mock('../../src/kompozycja/preferencje', () => ({ preferencje: () => ({ wczytaj: async () => undefined, stan: () => ({ wibracje: true, ekranNieGasnie: false }) }) }));
/* eslint-disable @typescript-eslint/no-require-imports */
const Korzen = (require('../../app/_layout') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
beforeEach(() => { zerujDotyk(); zerujNacisniecia(); mockWstecz.mockClear(); });

const DANE: DaneDzis = { data: 'Thursday, November 5', tydzien: [], pustyTydzien: true, dni: { zostalo: 3, limit: 5, miesiac: 'November' }, wToku: 3, miejsce: 'licznik', rzedyDzis: 4, coDalej: null };
function dzis(stan: PropsDzis['stan'], naPlus = jest.fn(async () => plusOk(43)), naKontynuuj = jest.fn(), naWybierzProjekt = jest.fn(), dane: DaneDzis = DANE) {
  render(
    <KontekstNacisniec.Provider value={zliczNacisniecie}>
      <KontekstDotyku.Provider value={haki}>
        <Dzis stan={stan} dane={dane} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} naPlus={naPlus} naCofnijSerie={jest.fn()} naOferty={jest.fn()}
          naKontynuuj={naKontynuuj} naWybierzProjekt={naWybierzProjekt} naUstawienia={jest.fn()} naKafel={jest.fn()} />
        <PanelDotyku />
        <PanelNacisniec />
      </KontekstDotyku.Provider>
    </KontekstNacisniec.Provider>,
  );
  return { naPlus, naKontynuuj, naWybierzProjekt };
}
const dotyk = () => String(screen.getByTestId('e2e-dotyk').props.children);
const STAN = () => stanLicznika({ projekt: 'Mist Sweater', czesc: 'Left sleeve', skonczone: 42, dziergany: 43, cel: 96 });

describe('opis cyklu dotyku (czysta funkcja)', () => {
  test('brak dotyku: „touch: none”', () => { expect(opisDotyku(new Map())).toBe('touch: none'); });
  test('kilka celów: w kolejności pierwszego zdarzenia, wszystkie pola z liczbą (także zera)', () => {
    expect(opisDotyku(new Map([['dzis-plus', { ts: 2, pin: 1, pout: 1, te: 1, tc: 1 }], ['nav-wstecz', { ts: 1, pin: 0, pout: 0, te: 0, tc: 0 }]])))
      .toBe('touch: dzis-plus ts2 pin1 pout1 te1 tc1, nav-wstecz ts1 pin0 pout0 te0 tc0');
  });
});

describe('panel `e2e-dotyk`', () => {
  test('zaczyna od „none”; `zliczDotyk(cel, rodzaj)` podnosi tylko wskazane pole celu', () => {
    render(<PanelDotyku />);
    expect(dotyk()).toBe('touch: none');
    act(() => { zliczDotyk('dzis-plus', 'ts'); zliczDotyk('dzis-plus', 'ts'); zliczDotyk('dzis-plus', 'tc'); });
    expect(dotyk()).toBe('touch: dzis-plus ts2 pin0 pout0 te0 tc1');
  });
  test('panel nie przechwytuje dotyku (`pointerEvents="none"`) i nie zasłania panelu naciśnięć (inny róg wysokości)', () => {
    render(<><PanelDotyku /><PanelNacisniec /></>);
    expect(screen.getByTestId('e2e-dotyk').props.pointerEvents).toBe('none');
    const st = screen.getByTestId('e2e-dotyk').props.style as { bottom: number };
    const stN = screen.getByTestId('e2e-nacisniecia').props.style as { bottom: number };
    expect(st.bottom).toBeGreaterThan(stN.bottom);
  });
  test('`haki(cel)` daje pięć obserwatorów i każdy liczy swoje pole', () => {
    render(<PanelDotyku />);
    const h = haki('x');
    act(() => { h.onTouchStart?.({} as never); h.onPressIn?.({} as never); h.onPressOut?.({} as never); h.onTouchEnd?.({} as never); h.onTouchCancel?.({} as never); });
    expect(dotyk()).toBe('touch: x ts1 pin1 pout1 te1 tc1');
  });
});

describe('„Dziś” (scenariusze 01, 03, 118, KP-10): cykl dotyku `dzis-plus`, `dzis-kontynuuj`, `dzis-wybierz-projekt`', () => {
  test('pełne stuknięcie w „+1”: ts, pin, pout, te po 1; naciśnięcie i naPlus jak dotąd', async () => {
    const { naPlus } = dzis(STAN());
    const plus = screen.getByTestId('dzis-plus');
    await act(async () => {
      fireEvent(plus, 'touchStart'); fireEvent(plus, 'pressIn'); fireEvent(plus, 'pressOut'); fireEvent(plus, 'touchEnd'); fireEvent.press(plus);
    });
    expect(dotyk()).toBe('touch: dzis-plus ts1 pin1 pout1 te1 tc0');
    expect(String(screen.getByTestId('e2e-nacisniecia').props.children)).toBe('taps accepted: dzis-plus 1');
    expect(naPlus).toHaveBeenCalledTimes(1);
  });
  test('dotyk anulowany przez system (touchStart, touchCancel): tc 1, naciśnięć brak — przypadek KP-10', () => {
    const { naKontynuuj } = dzis(STAN());
    const k = screen.getByTestId('dzis-kontynuuj');
    fireEvent(k, 'touchStart'); fireEvent(k, 'touchCancel');
    expect(dotyk()).toBe('touch: dzis-kontynuuj ts1 pin0 pout0 te0 tc1');
    expect(String(screen.getByTestId('e2e-nacisniecia').props.children)).toBe('taps accepted: none');
    expect(naKontynuuj).not.toHaveBeenCalled();
  });
  test('„Wybierz projekt” (przycisk karty bez projektu) też ma cykl dotyku pod swoim testID', () => {
    const { naWybierzProjekt } = dzis(stanLicznika({ projekt: null, czesc: null, skonczone: 0, dziergany: 1 }), undefined, undefined, undefined, { ...DANE, miejsce: 'lista' });
    const w = screen.getByTestId('dzis-wybierz-projekt');
    fireEvent(w, 'touchStart'); fireEvent(w, 'pressIn'); fireEvent(w, 'pressOut'); fireEvent(w, 'touchEnd'); fireEvent.press(w);
    expect(dotyk()).toBe('touch: dzis-wybierz-projekt ts1 pin1 pout1 te1 tc0');
    expect(naWybierzProjekt).toHaveBeenCalledTimes(1);
  });
});

describe('„Wstecz” i menu E2E', () => {
  test('„Wstecz”: cykl dotyku pod testID przycisku (domyślnym i własnym), onPress przepuszczony', () => {
    const wstecz = jest.fn();
    render(<KontekstNacisniec.Provider value={zliczNacisniecie}><KontekstDotyku.Provider value={haki}>
      <Wstecz tekst="Back" onPress={wstecz} /><Wstecz tekst="Back" onPress={jest.fn()} testID="wzor-wstecz" /><PanelDotyku />
    </KontekstDotyku.Provider></KontekstNacisniec.Provider>);
    const w = screen.getByTestId('nav-wstecz');
    fireEvent(w, 'touchStart'); fireEvent(w, 'pressIn'); fireEvent.press(w); fireEvent(w, 'pressOut'); fireEvent(w, 'touchEnd');
    fireEvent(screen.getByTestId('wzor-wstecz'), 'touchStart');
    expect(wstecz).toHaveBeenCalledTimes(1);
    expect(dotyk()).toBe('touch: nav-wstecz ts1 pin1 pout1 te1 tc0, wzor-wstecz ts1 pin0 pout0 te0 tc0');
  });
  test('`e2e-zdjecie-testowe` i `e2e-wzor-pdf`: cykl dotyku liczony, inne pozycje panelu wzoru nie', () => {
    render(<>
      <PanelZdjecia katalogTymczasowy={mkdtempSync(join(tmpdir(), 'oczko-e2e-'))} naPlik={jest.fn()} />
      <PanelWzoru katalogTymczasowy={mkdtempSync(join(tmpdir(), 'oczko-e2e-'))} naDodaj={jest.fn()} />
      <PanelDotyku />
    </>);
    fireEvent(screen.getByTestId('e2e-zdjecie-testowe'), 'touchStart');
    fireEvent(screen.getByTestId('e2e-wzor-pdf'), 'pressIn');
    expect(screen.getByTestId('e2e-wzor-pdf-skan').props.onTouchStart).toBeUndefined(); // pozostałe pozycje panelu wzoru bez obserwatorów
    expect(dotyk()).toBe('touch: e2e-zdjecie-testowe ts1 pin0 pout0 te0 tc0, e2e-wzor-pdf ts0 pin1 pout0 te0 tc0');
  });
});

describe('korzeń nawigacji w buildzie E2E', () => {
  test('ma panel `e2e-dotyk` i podaje ekranom hak: „wstecz” w stosie liczy cykl dotyku', async () => {
    Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
    render(<Korzen />);
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    expect(dotyk()).toBe('touch: none');
    const w = screen.getByTestId('nav-wstecz');
    fireEvent(w, 'touchStart'); fireEvent(w, 'touchCancel');
    expect(dotyk()).toBe('touch: nav-wstecz ts1 pin0 pout0 te0 tc1');
  });
});
