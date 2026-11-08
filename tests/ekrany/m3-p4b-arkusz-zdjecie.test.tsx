// M3 p4b, kawałek B — arkusz formularza, wybór jako lista ze znacznikiem, przycisk z symbolem przed tekstem (Oczko Pro „czeka”), podgląd zdjęcia i grupa zdjęć
// (makiety ekrany.html `formularz-czesc`, `formularz-narzedzie`, `oferty-czeka`, `zdjecie`; tokeny `arkusz.*`, `znaczniki.*`, `podgladZdjecia.*`, `systemCzarny.*`).
// Zachowanie, etykiety VoiceOver i dotychczasowe testID bez zmian (arkusz-formularza, wybor-testid, zdjecia, oferty).
import React from 'react';
import * as RN from 'react-native';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { Arkusz, Komunikat, Pole, Przycisk, Wybor } from '../../src/ekrany/Arkusz';
import { Oferty, type PropsOfert } from '../../src/ekrany/Oferty';
import { GrupaZdjec, PodgladZdjec } from '../../src/ekrany/Zdjecia';
import { MAX_SKALA_TYTULOWA } from '../../src/ekrany/motyw';
import type { Produkt } from '../../src/domena/porty';
import tokeny from '../../docs/design/tokeny.json';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let mockSkala = 1; // fontScale: 1 = domyślny, 1.786 = AX1, 3.571 = AX5
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 390, height: 844, scale: 3, fontScale: mockSkala }) }));
const AX1 = 1.786;
const UKRYTE = { includeHiddenElements: true } as const;

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
beforeEach(() => { mockSkala = 1; jest.spyOn(RN, 'useColorScheme').mockReturnValue('light'); });
afterEach(() => jest.restoreAllMocks());

const styl = (el: { props: { style?: unknown } }): RN.ViewStyle & RN.TextStyle => (RN.StyleSheet.flatten(el.props.style as RN.StyleProp<RN.ViewStyle & RN.TextStyle>) ?? {}) as RN.ViewStyle & RN.TextStyle;
type El = { props: { style?: unknown; accessibilityRole?: string }; parent: El | null; children: unknown[] };
/** Najbliższy przodek elementu (drzewo testowe zawiera też elementy złożone bez stylu) spełniający warunek. */
function przodek(el: unknown, warunek: (e: El) => boolean): El {
  for (let e = (el as El).parent; e; e = e.parent) if (warunek(e)) return e;
  throw new Error('brak przodka spełniającego warunek');
}
const symbol = (korzen: { props: unknown }, nazwa: string) => within(korzen as Parameters<typeof within>[0]).getByTestId(`symbol-${nazwa}`, UKRYTE);

function formularz(z: { wylaczony?: boolean; dzieci?: React.ReactNode } = {}) {
  render(
    <Arkusz tytul="New part" formularz={{ t, naZapisz: jest.fn(), naAnuluj: jest.fn(), zapisz: 'Add', wylaczony: z.wylaczony }}>{z.dzieci}</Arkusz>,
  );
}

describe.each([['jasny', 'light'], ['ciemny', 'dark']] as const)('motyw %s', (nazwaMotywu, schemat) => {
  const p = tokeny.kolory[nazwaMotywu];
  beforeEach(() => { jest.spyOn(RN, 'useColorScheme').mockReturnValue(schemat); });

  describe('arkusz formularza (formularz-czesc, formularz-narzedzie)', () => {
    test('Anuluj: akcentTekst, waga 400; Dodaj: akcentTekst, waga 700 (arkusz.anuluj, arkusz.zapisz)', () => {
      formularz();
      const a = styl(screen.getByText('Cancel'));
      const z = styl(screen.getByText('Add'));
      expect({ kolor: a.color, waga: a.fontWeight }).toEqual({ kolor: p[tokeny.arkusz.anuluj.kolor as 'akcentTekst'], waga: String(tokeny.arkusz.anuluj.waga) });
      expect({ kolor: z.color, waga: z.fontWeight }).toEqual({ kolor: p[tokeny.arkusz.zapisz.kolor as 'akcentTekst'], waga: String(tokeny.arkusz.zapisz.waga) });
    });

    test('nieaktywny zapis: przyciskNieaktywnyTekst, waga 600 (arkusz.nieaktywny)', () => {
      formularz({ wylaczony: true });
      const z = styl(screen.getByText('Add'));
      expect({ kolor: z.color, waga: z.fontWeight }).toEqual({ kolor: p[tokeny.arkusz.nieaktywny.kolor as 'przyciskNieaktywnyTekst'], waga: String(tokeny.arkusz.nieaktywny.waga) });
    });

    test('tytuł nagłówka skaluje się jak tytuły (najwyżej ×1,8), także w układzie od AX1', () => {
      formularz();
      expect(screen.getByRole('header', { name: 'New part' }).props.maxFontSizeMultiplier).toBe(MAX_SKALA_TYTULOWA);
      mockSkala = AX1;
      screen.unmount();
      formularz();
      expect(screen.getByRole('header', { name: 'New part' }).props.maxFontSizeMultiplier).toBe(MAX_SKALA_TYTULOWA);
    });

    test('pole: obrys 2 pt tekst2, min. 48 pt, z fokusem obrys akcentTekst (arkusz.pole)', () => {
      formularz({ dzieci: <Pole etykieta="Part name" wartosc="" naZmiane={jest.fn()} testID="pole" /> });
      const pole = screen.getByTestId('pole');
      const przed = styl(pole);
      expect({ grubosc: przed.borderWidth, obrys: przed.borderColor, min: przed.minHeight }).toEqual({ grubosc: tokeny.arkusz.pole.grubosc, obrys: p.tekst2, min: tokeny.arkusz.pole.minWysokosc });
      fireEvent(pole, 'focus');
      expect(styl(screen.getByTestId('pole')).borderColor).toBe(p.akcentTekst);
      fireEvent(screen.getByTestId('pole'), 'blur');
      expect(styl(screen.getByTestId('pole')).borderColor).toBe(p.tekst2);
    });

    test('pole: fokus wywołuje też naFokus od ekranu (zachowanie bez zmian)', () => {
      const naFokus = jest.fn();
      formularz({ dzieci: <Pole etykieta="Part name" wartosc="" naZmiane={jest.fn()} testID="pole" naFokus={naFokus} /> });
      fireEvent(screen.getByTestId('pole'), 'focus');
      expect(naFokus).toHaveBeenCalledTimes(1);
    });

    test('błąd ze znakiem: alert z etykietą bez „!”, znak w kółku (obrys tekst, 22 pt) ukryty przed VoiceOver, zdanie w tekst', () => {
      formularz({ dzieci: <Komunikat tekst="Enter a whole number." znak /> });
      const alert = screen.getByRole('alert');
      expect(alert.props.accessibilityLabel).toBe('Enter a whole number.');
      expect(within(alert).getByText('Enter a whole number.')).toBeTruthy();
      const znak = within(alert).getByTestId('komunikat-znak', UKRYTE);
      expect(znak.props.accessibilityElementsHidden).toBe(true);
      expect(znak.props.importantForAccessibility).toBe('no-hide-descendants');
      const s = styl(znak);
      expect({ w: s.width, h: s.height, obrys: s.borderColor, r: s.borderRadius }).toEqual({ w: tokeny.arkusz.blad.znakRozmiar, h: tokeny.arkusz.blad.znakRozmiar, obrys: p.tekst, r: tokeny.arkusz.blad.znakRozmiar / 2 });
      expect(within(znak).getByText('!', UKRYTE)).toBeTruthy();
      expect(styl(within(alert).getByText('Enter a whole number.')).color).toBe(p.tekst);
    });

    test('błąd ze znakiem od AX1: kółko 32 pt (arkusz.blad.znakRozmiarAx5)', () => {
      mockSkala = AX1;
      formularz({ dzieci: <Komunikat tekst="Enter a whole number." znak /> });
      const s = styl(screen.getByTestId('komunikat-znak', UKRYTE));
      expect({ w: s.width, h: s.height }).toEqual({ w: tokeny.arkusz.blad.znakRozmiarAx5, h: tokeny.arkusz.blad.znakRozmiarAx5 });
    });

    test('błąd bez znaku: sam tekst w tekst, rola alert (bez zmian)', () => {
      formularz({ dzieci: <Komunikat tekst="Enter a whole number." /> });
      const alert = screen.getByRole('alert');
      expect(alert.props.children).toBe('Enter a whole number.');
      expect(styl(alert).color).toBe(p.tekst);
      expect(screen.queryByTestId('komunikat-znak', UKRYTE)).toBeNull();
    });
  });

  describe('wybór jednej opcji jako lista ze znacznikiem (formularz-narzedzie, znaczniki.radio)', () => {
    const grupa = () => przodek(screen.getByTestId('opcja-druty'), (e) => e.props.accessibilityRole === 'radiogroup');
    const opcje = [{ wartosc: 'druty', tekst: 'Needles', testID: 'opcja-druty' }, { wartosc: 'szydelko', tekst: 'Hook', opis: 'Crochet', testID: 'opcja-szydelko' }];

    test('role radiogroup i radio, selected i testID bez zmian; wybór wywołuje naWybor', () => {
      const naWybor = jest.fn();
      render(<Wybor opcje={opcje} wybrana="druty" naWybor={naWybor} />);
      expect(grupa().props.accessibilityRole).toBe('radiogroup');
      expect(screen.getByTestId('opcja-druty').props.accessibilityState).toEqual({ selected: true });
      expect(screen.getByTestId('opcja-szydelko').props.accessibilityState).toEqual({ selected: false });
      expect(screen.getByRole('radio', { name: 'Hook' })).toBeTruthy();
      fireEvent.press(screen.getByTestId('opcja-szydelko'));
      expect(naWybor).toHaveBeenCalledWith('szydelko');
    });

    test('znacznik 28 pt: niewybrany kółko z obwódką tekst2, wybrany wypełniony przycisk z ptaszkiem w przyciskTekst', () => {
      render(<Wybor opcje={opcje} wybrana="druty" naWybor={jest.fn()} />);
      const wybrany = within(screen.getByTestId('opcja-druty')).getByTestId('znacznik-radio', UKRYTE);
      const niewybrany = within(screen.getByTestId('opcja-szydelko')).getByTestId('znacznik-radio', UKRYTE);
      const sw = styl(wybrany), sn = styl(niewybrany);
      expect({ w: sw.width, h: sw.height, r: sw.borderRadius, tlo: sw.backgroundColor }).toEqual({ w: tokeny.znaczniki.radio, h: tokeny.znaczniki.radio, r: tokeny.znaczniki.radio / 2, tlo: p.przycisk });
      expect({ w: sn.width, h: sn.height, r: sn.borderRadius, obrys: sn.borderColor, grubosc: sn.borderWidth, tlo: sn.backgroundColor }).toEqual({ w: tokeny.znaczniki.radio, h: tokeny.znaczniki.radio, r: tokeny.znaczniki.radio / 2, obrys: p.tekst2, grubosc: 2, tlo: undefined });
      expect(symbol(wybrany, 'checkmark').props.tintColor).toBe(p.przyciskTekst);
      expect(within(niewybrany).queryByTestId('symbol-checkmark', UKRYTE)).toBeNull();
      expect(wybrany.props.accessibilityElementsHidden).toBe(true);
      expect(wybrany.props.importantForAccessibility).toBe('no-hide-descendants');
    });

    test('znacznik od AX1: 40 pt (znaczniki.radioAx5)', () => {
      mockSkala = AX1;
      render(<Wybor opcje={opcje} wybrana="druty" naWybor={jest.fn()} />);
      const s = styl(within(screen.getByTestId('opcja-druty')).getByTestId('znacznik-radio', UKRYTE));
      expect({ w: s.width, h: s.height }).toEqual({ w: tokeny.znaczniki.radioAx5, h: tokeny.znaczniki.radioAx5 });
    });

    test('lista bez ramki opcjaWybrana: tło tlo, promień lista, wiersze ≥ cele.minimum, treść w tekst, opis w tekst2', () => {
      render(<Wybor opcje={opcje} wybrana="druty" naWybor={jest.fn()} />);
      const sg = styl(grupa());
      expect({ tlo: sg.backgroundColor, r: sg.borderRadius }).toEqual({ tlo: p.tlo, r: tokeny.promienie.lista });
      for (const id of ['opcja-druty', 'opcja-szydelko']) {
        const w = styl(screen.getByTestId(id));
        expect([id, w.borderWidth ?? 0, w.minHeight]).toEqual([id, 0, tokeny.cele.minimum]);
      }
      expect(styl(screen.getByText('Needles')).color).toBe(p.tekst);
      expect(styl(screen.getByText('Crochet')).color).toBe(p.tekst2);
    });
  });

  describe('podgląd zdjęcia (zdjecie, podgladZdjecia)', () => {
    const DWA = [{ id: 'a', uri: 'file:///a.jpg' }, { id: 'b', uri: 'file:///b.jpg' }];
    const pokazPodglad = (z: { poczatek?: number } = {}) => {
      const w = { naZamknij: jest.fn(), naUsun: jest.fn(), naUdostepnij: jest.fn(), potwierdz: jest.fn() };
      render(<PodgladZdjec t={t} zdjecia={DWA} poczatek={z.poczatek ?? 0} {...w} />);
      return w;
    };
    const sc = tokeny.kolory.systemCzarny;

    test('Zamknij w prawym górnym rogu: testID zdjecie-zamknij, pierwszy pasek wyrównany do końca, podpis w systemCzarny.akcentTekst', () => {
      const w = pokazPodglad();
      const zamknij = screen.getByTestId('zdjecie-zamknij');
      expect(zamknij.props.accessibilityRole).toBe('button');
      expect(zamknij.props.accessibilityLabel).toBe('Close');
      expect(styl(przodek(zamknij, (e) => styl(e).justifyContent !== undefined)).justifyContent).toBe('flex-end');
      expect(styl(within(zamknij).getByText('Close')).color).toBe(sc.akcentTekst);
      fireEvent.press(zamknij);
      expect(w.naZamknij).toHaveBeenCalled();
    });

    test('Udostępnij i Usuń: symbol (square.and.arrow.up, trash) i podpis w systemCzarny.akcentTekst; etykiety i testID bez zmian', () => {
      const w = pokazPodglad({ poczatek: 1 });
      const ud = screen.getByTestId('zdjecie-udostepnij');
      const us = screen.getByTestId('zdjecie-usun');
      expect(symbol(ud, 'square.and.arrow.up').props.tintColor).toBe(sc.akcentTekst);
      expect(symbol(us, 'trash').props.tintColor).toBe(sc.akcentTekst);
      expect(styl(within(ud).getByText('Share')).color).toBe(sc.akcentTekst);
      expect(styl(within(us).getByText('Delete photo')).color).toBe(sc.akcentTekst);
      expect(ud.props.accessibilityLabel).toBe('Share');
      expect(us.props.accessibilityLabel).toBe('Delete photo');
      fireEvent.press(ud);
      expect(w.naUdostepnij).toHaveBeenCalledWith('b');
    });

    test('licznik „1 z 2” w systemCzarny.tekst2', () => {
      pokazPodglad();
      expect(styl(screen.getByText('Photo 1 of 2')).color).toBe(sc.tekst2);
    });

    test('od AX1 dolny pasek w kolumnie, licznik przed akcjami (jak makieta `zdjecie` AX5)', () => {
      mockSkala = AX1;
      pokazPodglad();
      const pasek = przodek(screen.getByTestId('zdjecie-udostepnij'), (e) => e.props.style !== undefined && styl(e).justifyContent !== undefined && styl(e).paddingHorizontal !== undefined);
      expect(styl(pasek).flexDirection).toBe('column');
      const rodzaje = pasek.children.map((c) => String((c as { props: { testID?: string } }).props.testID ?? 'licznik'));
      expect(rodzaje.indexOf('licznik')).toBeLessThan(rodzaje.indexOf('zdjecie-udostepnij'));
    });
  });

  describe('grupa zdjęć na ekranie projektu', () => {
    const DWA = [{ id: 'a', uri: 'file:///a.jpg' }];
    test('kafel „Add photo”: tło powierzchnia, bez obrysu, promień pole; plus w ikona (makieta `.zdj .d .ik`)', () => {
      render(<GrupaZdjec t={t} miniatury={DWA} naWybierz={jest.fn()} naOtworz={jest.fn()} />);
      const s = styl(screen.getByTestId('zdjecia-dodaj'));
      expect({ tlo: s.backgroundColor, grubosc: s.borderWidth ?? 0, promien: s.borderRadius }).toEqual({ tlo: p.powierzchnia, grubosc: 0, promien: tokeny.promienie.pole });
      expect(symbol(screen.getByTestId('zdjecia-dodaj'), 'plus').props.tintColor).toBe(p.ikona);
    });

    test('lista wyboru źródła: powierzchnia, promień lista, pozycje ≥ cele.minimum, tekst w tekst', () => {
      render(<GrupaZdjec t={t} miniatury={[]} naWybierz={jest.fn()} naOtworz={jest.fn()} />);
      fireEvent.press(screen.getByTestId('zdjecia-dodaj'));
      const poz = screen.getByRole('button', { name: 'Take photo' });
      const menu = styl(przodek(poz, (e) => styl(e).backgroundColor !== undefined));
      expect({ tlo: menu.backgroundColor, r: menu.borderRadius }).toEqual({ tlo: p.powierzchnia, r: tokeny.promienie.lista });
      expect(styl(poz).minHeight).toBeGreaterThanOrEqual(tokeny.cele.minimum);
      expect(styl(within(poz).getByText('Take photo')).color).toBe(p.tekst);
    });
  });
});

describe('Przycisk z symbolem przed tekstem (symbolPrzed, wyjątek P-598)', () => {
  const p = tokeny.kolory.jasny;
  test('symbol stoi przed tekstem, w kolorze tekstu przycisku; etykieta VoiceOver to sam tekst', () => {
    render(<Przycisk tekst="Waiting" onPress={jest.fn()} rodzaj="glowny" symbolPrzed="hourglass" testID="p" />);
    const przycisk = screen.getByTestId('p');
    expect(przycisk.props.accessibilityLabel).toBe('Waiting');
    expect(symbol(przycisk, 'hourglass').props.tintColor).toBe(p.przyciskTekst);
    expect(screen.getByText('Waiting')).toBeTruthy();
    const wiersz = przodek(screen.getByText('Waiting'), (e) => styl(e).flexDirection === 'row');
    expect(wiersz.children).toHaveLength(2);
    expect(symbol(wiersz, 'hourglass')).toBeTruthy();
    expect(within(wiersz.children[0] as never).queryByTestId('symbol-hourglass', UKRYTE)).toBeTruthy(); // pierwszy w kolejności: symbol
    expect(within(wiersz.children[1] as never).queryByTestId('symbol-hourglass', UKRYTE)).toBeNull(); // drugi: tekst
  });
  test('rodzaj drugi: symbol w tekst; wylaczony: symbol i tekst w przyciskNieaktywnyTekst', () => {
    render(<>
      <Przycisk tekst="Two" onPress={jest.fn()} rodzaj="drugi" symbolPrzed="hourglass" testID="d" />
      <Przycisk tekst="Off" onPress={jest.fn()} rodzaj="glowny" symbolPrzed="hourglass" wylaczony testID="w" />
    </>);
    expect(symbol(screen.getByTestId('d'), 'hourglass').props.tintColor).toBe(p.tekst);
    expect(symbol(screen.getByTestId('w'), 'hourglass').props.tintColor).toBe(p.przyciskNieaktywnyTekst);
    expect(styl(screen.getByText('Off')).color).toBe(p.przyciskNieaktywnyTekst);
  });
  test('istniejąca właściwość symbol nadal zastępuje tekst (sam symbol, bez Text)', () => {
    render(<Przycisk tekst="Expand" onPress={jest.fn()} symbol="chevron.down" testID="s" />);
    expect(screen.queryByText('Expand')).toBeNull();
    expect(symbol(screen.getByTestId('s'), 'chevron.down')).toBeTruthy();
  });
  test('bez symbolPrzed: tylko tekst, bez symbolu', () => {
    render(<Przycisk tekst="Plain" onPress={jest.fn()} testID="z" />);
    expect(within(screen.getByTestId('z')).queryByTestId(/^symbol-/, UKRYTE)).toBeNull();
  });
});

describe('Oczko Pro, stan „czeka”: klepsydra przed tekstem przycisku (oferty-czeka)', () => {
  const PRODUKTY: Produkt[] = [{ id: 'oczko.pro.rok', cenaWyswietlana: '19,99 zł', okres: 'rok' }];
  const ADRESY = { polityka: 'https://example.invalid/p', warunki: 'https://example.invalid/w' };
  const pokaz = (z: Partial<PropsOfert['stan']>) => render(<Oferty stan={{ produkty: { rodzaj: 'gotowe', produkty: PRODUKTY }, aktywne: null, familySharing: false, ...z }} t={t} adresy={ADRESY}
    naKup={jest.fn()} naPrzywroc={jest.fn()} naZarzadzaj={jest.fn()} naOtworzAdres={jest.fn()} naZamknij={jest.fn()} />);
  test('przycisk oferty-kup w stanie oczekującym ma klepsydrę przed tekstem w przyciskNieaktywnyTekst, jest nieaktywny, etykieta bez zmian', () => {
    pokaz({ oczekujacy: true });
    const kup = screen.getByTestId('oferty-kup');
    expect(kup.props.accessibilityState).toEqual({ disabled: true });
    expect(kup.props.accessibilityLabel).toBe(t('oferty.czeka_przycisk'));
    expect(symbol(kup, 'hourglass').props.tintColor).toBe(tokeny.kolory.jasny.przyciskNieaktywnyTekst);
    expect(within(kup).getByText(t('oferty.czeka_przycisk'))).toBeTruthy();
  });
  test('przycisk kupna w stanie zwykłym bez klepsydry', () => {
    pokaz({});
    expect(within(screen.getByTestId('oferty-kup')).queryByTestId('symbol-hourglass', UKRYTE)).toBeNull();
  });
});
