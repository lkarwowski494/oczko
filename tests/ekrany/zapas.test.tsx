// Ekrany zapasu i drutów (P-191 P8a; BR-ZAP-001/003/004; makiety fix6 `zapas`, `zapas-filtr`, `zapas-pusty`, `wloczka`, `druty-lista`, `drut`;
// testID z e2e/README.md i scenariuszy 16, 40).
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { FormularzDrutu, FormularzWloczki, ListaDrutow, Zapas } from '../../src/ekrany/Zapas';
import { bazowa, podgladRozmiaru, przeliczenie, stanZapasu, type FiltrZapasu } from '../../src/kompozycja/zapas';
import type { WierszZapasu } from '../../src/przypadki-uzycia/zapas';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const j = () => ({ t, jezyk: () => 'en-US' });
const LISTA: WierszZapasu[] = [
  { id: 'a', nazwa: 'Fjord', kategoria: 4, motki: 5, dlugoscMotkaM: 399.5928, wagaMotkaG: 100, zdjecieSha: null },
  { id: 'b', nazwa: 'Sock yarn', kategoria: null, motki: 2, dlugoscMotkaM: null, wagaMotkaG: null, zdjecieSha: null },
];
function ZapasTestowy(p: { lista: WierszZapasu[]; naOtworz?(id: string): void; naDodaj?(): void }) {
  const [zapytanie, ustawZ] = React.useState('');
  const [filtr, ustawF] = React.useState<FiltrZapasu>('wszystkie');
  return <Zapas t={t} stan={stanZapasu(p.lista, { zapytanie, filtr, imperialny: true, j: j() })} zapytanie={zapytanie} filtr={filtr}
    naSzukaj={ustawZ} naFiltr={ustawF} naDodaj={p.naDodaj ?? jest.fn()} naOtworz={p.naOtworz ?? jest.fn()} />;
}

describe('lista zapasu', () => {
  test('wiersze z etykietą VoiceOver (scenariusz 40: „Fjord.*437 yd.*399.59 m”), otwarcie wiersza, „+”', () => {
    const naOtworz = jest.fn(), naDodaj = jest.fn();
    render(<ZapasTestowy lista={LISTA} naOtworz={naOtworz} naDodaj={naDodaj} />);
    const wiersze = screen.getAllByTestId('zapas-wynik');
    expect(wiersze[0]?.props.accessibilityLabel).toMatch(/^Fjord.*437 yd.*399\.59 m/);
    fireEvent.press(wiersze[1]!);
    fireEvent.press(screen.getByTestId('zapas-dodaj'));
    expect([naOtworz.mock.calls, naDodaj.mock.calls.length]).toEqual([[['b']], 1]);
    expect(screen.getByTestId('zapas-lista')).toBeTruthy();
  });
  test('BR-ZAP-004/S2 (scenariusz 16): szukanie „Fjo” → jeden wynik; „xyz” → zapas-brak-wynikow', () => {
    render(<ZapasTestowy lista={LISTA} />);
    fireEvent.changeText(screen.getByTestId('zapas-szukaj'), 'Fjo');
    expect(screen.getAllByTestId('zapas-wynik')).toHaveLength(1);
    fireEvent.changeText(screen.getByTestId('zapas-szukaj'), 'xyz');
    expect(screen.queryByTestId('zapas-wynik')).toBeNull();
    expect(screen.getByTestId('zapas-brak-wynikow')).toHaveProperty('props.children', 'No yarn called “xyz”.');
  });
  test('chipy jako radio w grupie z etykietą; wybór „Not set” filtruje', () => {
    render(<ZapasTestowy lista={LISTA} />);
    expect(screen.getByTestId('zapas-filtr').props.accessibilityLabel).toBe('Weight filter');
    fireEvent.press(screen.getByRole('radio', { name: 'Not set' }));
    expect(screen.getAllByTestId('zapas-wynik').map((w) => w.props.accessibilityLabel)).toEqual([expect.stringMatching(/^Sock yarn/)]);
    expect(screen.getByRole('radio', { name: 'Not set' }).props.accessibilityState).toMatchObject({ selected: true });
  });
  test('pusty zapas: tekst i przycisk „Add yarn” (zapas-pusty)', () => {
    const naDodaj = jest.fn();
    render(<ZapasTestowy lista={[]} naDodaj={naDodaj} />);
    expect(screen.getByText(t('zapas.pusto'))).toBeTruthy();
    expect(screen.queryByTestId('zapas-szukaj')).toBeNull();
    const dodaj = screen.getAllByRole('button', { name: 'Add yarn' }); // „+” w pasku i przycisk pod tekstem
    expect(dodaj).toHaveLength(2);
    fireEvent.press(dodaj[1]!);
    expect(naDodaj).toHaveBeenCalled();
  });
});

describe('arkusz włóczki', () => {
  const pola = { przelicz: (x: string, u: 'm' | 'yd' | 'g' | 'oz') => przeliczenie(x, u, j()), bazowa: (x: string, u: 'm' | 'yd' | 'g' | 'oz') => bazowa(x, u, 'en-US') };
  test('BR-ZAP-001/S1 (scenariusz 40): nazwa, jardy 437 → „= 399.59 m”, zapis w metrach; pole nazwy wymagane', async () => {
    const naZapisz = jest.fn(async () => ({ ok: true as const, wartosc: undefined }));
    render(<FormularzWloczki t={t} poczatek={null} jednostki="imperialne" {...pola} formatuj={(n) => String(n)} naZapisz={naZapisz} naAnuluj={jest.fn()} />);
    expect(screen.getByText('Add yarn')).toBeTruthy();
    expect(screen.getByTestId('formularz-zapisz').props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.changeText(screen.getByTestId('zapas-nazwa'), 'Fjord');
    expect(screen.getByTestId('zapas-jednostka-yd').props.accessibilityState).toMatchObject({ selected: true }); // układ imperialny
    fireEvent.press(screen.getByTestId('zapas-jednostka-m'));
    fireEvent.press(screen.getByTestId('zapas-jednostka-yd'));
    fireEvent.changeText(screen.getByTestId('zapas-dlugosc'), '437');
    expect(screen.getByTestId('zapas-przeliczone')).toHaveProperty('props.children', '= 399.59 m');
    fireEvent.press(screen.getByRole('button', { name: 'One skein more' }));
    fireEvent.press(screen.getByTestId('formularz-zapisz'));
    await waitFor(() => expect(naZapisz).toHaveBeenCalledTimes(1));
    const zapis = (naZapisz.mock.calls[0] as unknown as [Record<string, unknown>])[0];
    expect(zapis).toMatchObject({ nazwa: 'Fjord', motki: 0.5, wagaMotkaG: null, kategoria: null, producent: '', pielegnacja: '' });
    expect(zapis.dlugoscMotkaM).toBeCloseTo(399.5928, 9);
  });
  test('edycja: pola z zapisu (metryczne), kategoria wybierana z listy „Not set / 4 · medium”; zły wpis długości blokuje zapis', () => {
    const naZapisz = jest.fn(async () => ({ ok: true as const, wartosc: undefined }));
    render(<FormularzWloczki t={t} jednostki="metryczne" {...pola} formatuj={(n) => String(n)} naZapisz={naZapisz} naAnuluj={jest.fn()}
      poczatek={{ nazwa: 'Fjord', producent: 'Harbor', sklad: '', kolor: 'navy', kategoria: 4, motki: 5, dlugoscMotkaM: 400, wagaMotkaG: 100, pielegnacja: 'Hand wash', notatka: '' }} />);
    expect(screen.getByText('Edit yarn')).toBeTruthy();
    expect(screen.getByTestId('zapas-dlugosc').props.value).toBe('400');
    expect(screen.getByDisplayValue('Hand wash')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Weight category, 4 · medium' }));
    fireEvent.press(screen.getByRole('radio', { name: 'Not set' }));
    fireEvent.changeText(screen.getByTestId('zapas-dlugosc'), '0');
    expect(screen.getByRole('alert')).toHaveProperty('props.accessibilityLabel', 'Enter a number above 0.'); // M3 p4b: znak „!” w kółku (ukryty przed VoiceOver), zdanie osobno
    expect(screen.getByText('Enter a number above 0.')).toBeTruthy();
    expect(screen.getByTestId('formularz-zapisz').props.accessibilityState).toMatchObject({ disabled: true });
  });
});

test('edycja bez zmiany pola długości zapisuje wartość z bazy, nie zaokrągloną z ekranu (399.5928 m, nie 399.59)', async () => {
  const naZapisz = jest.fn(async () => ({ ok: true as const, wartosc: undefined }));
  render(<FormularzWloczki t={t} jednostki="metryczne" przelicz={(x, u) => przeliczenie(x, u, j())} bazowa={(x, u) => bazowa(x, u, 'en-US')}
    formatuj={(n) => String(Math.round(n * 100) / 100)} naZapisz={naZapisz} naAnuluj={jest.fn()}
    poczatek={{ nazwa: 'Fjord', producent: '', sklad: '', kolor: '', kategoria: null, motki: 1, dlugoscMotkaM: 399.5928, wagaMotkaG: 99.2233, pielegnacja: '', notatka: '' }} />);
  expect(screen.getByTestId('zapas-dlugosc').props.value).toBe('399.59');
  fireEvent.press(screen.getByTestId('formularz-zapisz'));
  await waitFor(() => expect(naZapisz).toHaveBeenCalledWith(expect.objectContaining({ dlugoscMotkaM: 399.5928, wagaMotkaG: 99.2233 })));
});

describe('druty', () => {
  test('lista w grupach z uwagą o milimetrach; pusta: druty.pusto', () => {
    const naOtworz = jest.fn();
    const r = render(<ListaDrutow t={t} stan={{ grupy: [{ naglowek: 'Needles', wiersze: [{ id: '1', rozmiar: '4 mm (US 6)', opis: 'circular, 80 cm' }] }] }} naDodaj={jest.fn()} naOtworz={naOtworz} />);
    expect(screen.getByText(t('druty.uwaga_mm'))).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: '4 mm (US 6), circular, 80 cm' }));
    expect(naOtworz).toHaveBeenCalledWith('1');
    r.rerender(<ListaDrutow t={t} stan={{ grupy: [] }} naDodaj={jest.fn()} naOtworz={naOtworz} />);
    expect(screen.getByText(t('druty.pusto'))).toBeTruthy();
  });
  test('arkusz: Hook 2.5 → podgląd bez US; zapis w mm z opisem', async () => {
    const naZapisz = jest.fn(async () => ({ ok: true as const, wartosc: undefined }));
    render(<FormularzDrutu t={t} poczatek={null} podglad={(x, r) => podgladRozmiaru(x, r, j())} parsuj={(x) => { const b = bazowa(x, 'm', 'en-US'); return b; }}
      formatuj={String} naZapisz={naZapisz} naAnuluj={jest.fn()} />);
    expect(screen.getByText('Add needles or hook')).toBeTruthy();
    fireEvent.press(screen.getByRole('radio', { name: 'Hook' }));
    fireEvent.changeText(screen.getByTestId('formularz-rozmiar-mm'), '2.5');
    expect(screen.getByText('Shows as: 2.5 mm. No US size is listed for this one. Go by millimeters.')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Notes'), 'bamboo');
    fireEvent.press(screen.getByTestId('formularz-zapisz'));
    await waitFor(() => expect(naZapisz).toHaveBeenCalledWith({ rodzaj: 'szydelko', rozmiarMm: 2.5, opis: 'bamboo' }));
  });
});

describe('P-209: usuwanie z arkusza (tylko edycja)', () => {
  const pola = { przelicz: (x: string, u: 'm' | 'yd' | 'g' | 'oz') => przeliczenie(x, u, j()), bazowa: (x: string, u: 'm' | 'yd' | 'g' | 'oz') => bazowa(x, u, 'en-US') };
  test('włóczka: „Delete yarn” przy edycji woła naUsun; nowa włóczka bez przycisku', () => {
    const naUsun = jest.fn();
    const r = render(<FormularzWloczki t={t} jednostki="metryczne" {...pola} formatuj={String} naZapisz={jest.fn()} naAnuluj={jest.fn()} naUsun={naUsun}
      poczatek={{ nazwa: 'Fjord', producent: '', sklad: '', kolor: '', kategoria: null, motki: 1, dlugoscMotkaM: null, wagaMotkaG: null, pielegnacja: '', notatka: '' }} />);
    fireEvent.press(screen.getByTestId('zapas-usun'));
    expect(naUsun).toHaveBeenCalled();
    r.rerender(<FormularzWloczki t={t} jednostki="metryczne" {...pola} formatuj={String} naZapisz={jest.fn()} naAnuluj={jest.fn()} naUsun={naUsun} poczatek={null} />);
    expect(screen.queryByTestId('zapas-usun')).toBeNull();
  });
  test('drut: „Delete needles or hook” przy edycji', () => {
    const naUsun = jest.fn();
    render(<FormularzDrutu t={t} poczatek={{ rodzaj: 'druty', rozmiarMm: 4, opis: '' }} podglad={() => null} parsuj={() => 4} formatuj={String}
      naZapisz={jest.fn()} naAnuluj={jest.fn()} naUsun={naUsun} />);
    fireEvent.press(screen.getByRole('button', { name: 'Delete needles or hook' }));
    expect(naUsun).toHaveBeenCalled();
  });
});
