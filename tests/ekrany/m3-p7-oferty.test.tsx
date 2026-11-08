// M3 p7 — Oczko Pro w „Dzianinie” (P-557, P-558, P-561, P-563 (11)(12); raport 02 `02-monetyzacja-2026-11-08`: 001–004; design-spec Dzianiny wiersz `oferty`, ekrany.html sekcja 7).
// Uczciwość (3.1.2(c), P-558): Pro zdejmuje tylko limit dni (`src/domena/limit.ts:70`) — żaden kafel nie obiecuje więcej; kafle opisują to, co daje zakup,
// albo jawnie mówią, że część jest wspólna (kafel „Dane”). Ceny nadal tylko ze sklepu (KP-09).
import React from 'react';
import { render, screen, within } from '@testing-library/react-native';
import { Oferty, type PropsOfert } from '../../src/ekrany/Oferty';
import { FAMILY_SHARING } from '../../src/kompozycja/adresy';
import type { Produkt } from '../../src/domena/porty';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';

let t: Tlumacz;
let tPl: Tlumacz;
beforeAll(async () => {
  t = await tEn();
  tPl = (await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['pl-PL'], zasoby: ZASOBY })).t;
});
// Ilustracje i ikony są dekoracyjne (ukryte przed VoiceOver), więc zapytania muszą je jawnie uwzględniać.
const UKRYTE = { includeHiddenElements: true } as const;
const PRODUKTY: Produkt[] = [
  { id: 'oczko.pro.miesiac', cenaWyswietlana: '4,99 zł', okres: 'miesiac' },
  { id: 'oczko.pro.rok', cenaWyswietlana: '19,99 zł', okres: 'rok' },
  { id: 'oczko.pro.dozywotni', cenaWyswietlana: '59,99 zł', okres: 'dozywotni' },
];
const ADRESY = { polityka: 'https://example.invalid/p', warunki: 'https://example.invalid/w' };
function pokaz(stan: Partial<PropsOfert['stan']> = {}, tt: Tlumacz = t) {
  render(<Oferty stan={{ produkty: { rodzaj: 'gotowe', produkty: PRODUKTY }, aktywne: null, familySharing: true, ...stan }} t={tt} adresy={ADRESY}
    naKup={jest.fn()} naPrzywroc={jest.fn()} naZarzadzaj={jest.fn()} naOtworzAdres={jest.fn()} naZamknij={jest.fn()} />);
}

describe('P-561 (02-monetyzacja-002): Family Sharing włączone w konfiguracji', () => {
  test('FAMILY_SHARING = true (Family Sharing włączone w App Store Connect dla trzech produktów, P-495, P-536)', () => {
    expect(FAMILY_SHARING).toBe(true);
  });
});

describe('P-563 (11)(12): cztery kafle Oczko Pro', () => {
  test('en: kafle w kolejności dzień, urządzenia, rodzina, dane z tekstami P-563 (11)(12)', () => {
    pokaz();
    const kafle = ['oferty-kafel-dzien', 'oferty-kafel-urzadzenia', 'oferty-kafel-rodzina', 'oferty-kafel-dane'].map((id) => screen.getByTestId(id));
    const tekst = (el: typeof kafle[number]) => within(el).getAllByText(/./).map((x) => x.props.children as string);
    expect(tekst(kafle[0])).toEqual(['Every crafting day', 'Count whenever you craft, with no monthly limit.']);
    expect(tekst(kafle[1])).toEqual(['No limit on any device', 'iPhone, iPad, and Apple Watch.']);
    expect(tekst(kafle[2])).toEqual(['For your family', 'You can share it with your family through Family Sharing.']);
    expect(tekst(kafle[3])).toEqual(['Your data stays yours', 'Projects, patterns, and history stay, with Pro or without.']);
  });

  test('pl: teksty kafli 2 i 3 z P-563 (11)(12), nazwa Apple „Chmura rodzinna” (02-monetyzacja-003)', () => {
    pokaz({}, tPl);
    expect(within(screen.getByTestId('oferty-kafel-urzadzenia')).getByText('Bez limitu na każdym urządzeniu')).toBeTruthy();
    expect(within(screen.getByTestId('oferty-kafel-urzadzenia')).getByText('iPhone, iPad i Apple Watch.')).toBeTruthy();
    expect(within(screen.getByTestId('oferty-kafel-rodzina')).getByText('Możesz podzielić się z rodziną przez Chmurę rodzinną.')).toBeTruthy();
    expect(screen.queryByText(/Udostępnian\S* rodzinn/)).toBeNull();
  });

  test('02-monetyzacja-002: kafel „Dla rodziny” zamiast zdania dopisanego do „Bez Pro” — nigdy oba', () => {
    pokaz();
    expect(screen.getAllByText(/Family Sharing/)).toHaveLength(1);
    expect(screen.queryByText(/Shared with your family/)).toBeNull();
    expect(screen.getByText(/Without Pro: 5 crafting days every month/).props.children).not.toMatch(/family/i);
  });

  test('bez Family Sharing: kafel „Dla rodziny” znika, zostają trzy (ujawnienie 7)', () => {
    pokaz({ familySharing: false });
    expect(screen.queryByTestId('oferty-kafel-rodzina')).toBeNull();
    expect(screen.queryByText(/Family Sharing/)).toBeNull();
    expect(['oferty-kafel-dzien', 'oferty-kafel-urzadzenia', 'oferty-kafel-dane'].map((id) => screen.queryByTestId(id) !== null)).toEqual([true, true, true]);
  });

  test('02-monetyzacja-004: kafel 1 ma własną ikonę dnia dzierganego, nie symbol żadnej z czterech zakładek', () => {
    pokaz();
    const kafel = screen.getByTestId('oferty-kafel-dzien');
    expect(within(kafel).getByTestId('oferty-ikona-dzien', UKRYTE)).toBeTruthy();
    for (const zakladka of ['sun.max', 'square.stack', 'ruler', 'calendar']) expect(within(kafel).queryByTestId(`symbol-${zakladka}`)).toBeNull();
  });

  test('ikony kafli są dekoracyjne: VoiceOver czyta tytuł i opis kafla jako jeden element', () => {
    pokaz();
    for (const id of ['oferty-kafel-dzien', 'oferty-kafel-urzadzenia', 'oferty-kafel-rodzina', 'oferty-kafel-dane']) {
      const kafel = screen.getByTestId(id);
      expect(kafel.props.accessible).toBe(true);
    }
    expect(screen.getByTestId('oferty-kafel-urzadzenia').props.accessibilityLabel).toBe('No limit on any device. iPhone, iPad, and Apple Watch.');
  });

  test('uczciwość (3.1.2(c)): kafle nie obiecują nic poza zdjęciem limitu; bez znaczków, procentów i porównań (P-054)', () => {
    pokaz();
    const wszystkie = ['oferty-kafel-dzien', 'oferty-kafel-urzadzenia', 'oferty-kafel-rodzina', 'oferty-kafel-dane']
      .map((id) => String(screen.getByTestId(id).props.accessibilityLabel)).join(' ');
    expect(wszystkie).not.toMatch(/%|best|save|most popular|exclusive|extra|more features|premium|unlock/i);
  });
});

describe('P-557: karta Oczko Pro z miesiącem dni dzierganych', () => {
  test('karta ma opis i ilustrację 30 dni (dekoracyjna, nie dane), tytuł „Oczko Pro” zostaje w nagłówku arkusza', () => {
    pokaz();
    const karta = screen.getByTestId('oferty-karta');
    expect(within(karta).getByText('Count rows on as many days as you like. Everything else stays the same.')).toBeTruthy();
    const miesiac = within(karta).getByTestId('oferty-miesiac', UKRYTE);
    expect(miesiac.props.accessibilityElementsHidden).toBe(true);
    expect(miesiac.props.importantForAccessibility).toBe('no-hide-descendants');
    expect(within(miesiac).getAllByTestId('oferty-miesiac-dzien', UKRYTE)).toHaveLength(30);
    expect(screen.getAllByText('Oczko Pro')).toHaveLength(1);
  });

  test('Rocznie domyślnie bez znaczka „najlepsza oferta”, cena tylko ze sklepu (3.1.2(c), KP-09)', () => {
    pokaz();
    expect(screen.getByRole('radio', { name: /Yearly.*19,99 zł/, selected: true })).toBeTruthy();
    expect(screen.queryByText(/best value|most popular|save/i)).toBeNull();
    expect(screen.queryByText(/\$\s?\d|0[.,]99|6[.,]99|14[.,]99/)).toBeNull();
  });
});
