// Pomocnicy testów ekranów (rola 07, E3). `t` to prawdziwy mechanizm i18n (ADR-0017) ze słownikiem en: test pyta po tekście
// z design-spec.md, więc zazieleni się dopiero, gdy 08 doda klucz z tym tekstem do en.json (DEV-12). Atrapy portów: jest.fn.
import { screen, waitFor } from '@testing-library/react-native';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import type { Tlumacz, System, CyklAplikacji, StanCyklu } from '../../src/ekrany/wspolne';
import type { Haptyka } from '../../src/domena/porty';
import type { StanEkranuLicznika, WynikPlus } from '../../src/ekrany/Licznik';

export async function tEn(): Promise<Tlumacz> {
  const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  return i.t;
}
// 08 partia 4 (P-135 Q4a): port Haptyka.zagraj(WzorzecHaptyki) zamiast rzad()/przypomnienie(); `zagrane` liczy wywołania wzorca
// (rzad → 'plus', przypomnienie → 'rzadZInstrukcja') — te same asercje co przed zmianą portu.
export const atrapaHaptyki = () => ({ zagraj: jest.fn() }) satisfies Haptyka;
export const zagrane = (h: ReturnType<typeof atrapaHaptyki>, w: Parameters<Haptyka['zagraj']>[0]): number => h.zagraj.mock.calls.filter(([x]) => x === w).length;
export const atrapaSystemu = () =>
  ({ otworzAdres: jest.fn(), prosbaOOcene: jest.fn(), zarzadzajSubskrypcja: jest.fn(), udostepnij: jest.fn() }) satisfies System;
export function atrapaCyklu() {
  const sluchacze = new Set<(s: StanCyklu) => void>();
  const cykl: CyklAplikacji = { naZmiane: (fn) => (sluchacze.add(fn), () => void sluchacze.delete(fn)) };
  return { cykl, przejdz: (s: StanCyklu) => sluchacze.forEach((f) => f(s)) };
}
/** Obietnica do rozwiązania z testu (kolejność: nic przed wynikiem, R-148). */
export function odroczona<T>() {
  let rozwiaz!: (w: T) => void;
  const obietnica = new Promise<T>((r) => (rozwiaz = r));
  return { obietnica, rozwiaz };
}
/** Stan licznika „Harbor Sweater / Left sleeve, rząd 48” z ekrany.html `licznik-w-toku` (wzorzec 04). */
export function stanLicznika(z: Partial<StanEkranuLicznika> = {}): StanEkranuLicznika {
  return {
    rodzaj: 'rzedy', projekt: 'Harbor Sweater', czesc: 'Left sleeve', skonczone: 47, dziergany: 48, znaczenie: 'skonczone',
    cel: null, celDnia: null, przypomnienie: null, powtorzenie: null, notatka: null, sesja: null,
    zablokowany: false, limit: { rodzaj: 'brak' }, miesiac: { nazwa: 'November', wznowienie: 'December 1', rzedyDanych: 47 },
    baner: null, blizniak: null, wibracje: true, ...z,
  };
}
export const plusOk = (skonczone: number, z: Partial<Extract<WynikPlus, { ok: true }>['wartosc']> = {}): WynikPlus =>
  ({ ok: true, wartosc: { skonczone, dziergany: skonczone + 1, zdarzenia: ['rzad'], wejscieWPrzypomnienie: null, ...z } });
/** Atrapy wywołań licznika; każde zwraca wynik zgodny z typem. */
export function wywolaniaLicznika(naPlus: () => Promise<WynikPlus> = async () => plusOk(48)) {
  return {
    naPlus: jest.fn(naPlus), naMinus: jest.fn(async () => ({ ok: true as const, wartosc: { skonczone: 46 } })),
    naOdblokuj: jest.fn(), naCofnijSerie: jest.fn(), naOferty: jest.fn(), naHistorie: jest.fn(), naMenu: jest.fn(), naNastepnaCzesc: jest.fn(),
  };
}
/** Tekst elementu i jego dzieci (porównanie nagłówków bez tekstu wzorcowego, Z07-05). */
export function tekst(el: { children: unknown[] }): string {
  return el.children.map((c) => (typeof c === 'string' ? c : tekst(c as { children: unknown[] }))).join('');
}
/** Element po roli i nazwie VoiceOver z design-spec. `getByRole({ name })` przyjmuje etykietę ALBO tekst w środku, więc dodatkowo
 *  nazwa dostępna (accessibilityLabel, a bez niej tekst: RNTL computeAccessibleName) musi być równa wzorcowi (WCAG 2.5.3, design-spec.md:32). */
export function przycisk(nazwa: string, rola: 'button' | 'link' | 'radio' | 'header' = 'button') {
  const el = screen.getByRole(rola, { name: nazwa });
  expect(el).toHaveAccessibleName(nazwa);
  return el;
}
export const znajdzPrzycisk = (nazwa: string, rola: 'button' | 'link' | 'radio' | 'header' = 'button') => waitFor(() => przycisk(nazwa, rola));
