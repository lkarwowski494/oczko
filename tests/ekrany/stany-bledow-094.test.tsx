// M1-audytor-generalny-094 (DEC-26 a, P-418): 04 projektuje teksty i powroty dla stanów błędów naraz (design-spec „Aneks M2 partia 3a”, „Stany błędów”).
// 04-studio-projektowe-501: lista projektów ma „Back”; 502: stan błędu wczytania ma wyjście (Back na trasach push, Close w arkuszach i na zdjęciu);
// 504: brak miejsca ma własny nagłówek i „Try starting normally” jako główny przycisk; 506: przy blokadzie „Reset to 0…” jest wyłączony z podpowiedzią.
import React from 'react';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { ListaProjektow } from '../../src/ekrany/ListaProjektow';
import { StanWczytywania } from '../../src/ekrany/StanWczytywania';
import { TrybAwaryjny, type PowodTrybuAwaryjnego } from '../../src/ekrany/TrybAwaryjny';
import { MenuProjektu, type PropsMenuProjektu } from '../../src/ekrany/MenuProjektu';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn, tekst } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

describe('501: lista projektów z „Back”', () => {
  test('pasek listy ma „Back” (nav-wstecz) przed symbolami; stuknięcie woła naWstecz — także przy pustej liście', () => {
    const naWstecz = jest.fn();
    render(<ListaProjektow stan={{ wToku: [], ukonczone: [], zapytanie: '', dni: null }} t={t} naSzukaj={jest.fn()} naOtworz={jest.fn()} naNowy={jest.fn()} naWstecz={naWstecz} />);
    expect(screen.getByText(t('projekty.pusto'))).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(naWstecz).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('nav-wstecz')).toBe(screen.getByRole('button', { name: 'Back' }));
  });
});

describe('502: stan błędu wczytania z wyjściem', () => {
  test('trasa push: w stanie błędu „Back” (nav-wstecz) obok „Try again”; stuknięcie woła wyjście', () => {
    const naWyjdz = jest.fn();
    render(<StanWczytywania stan="blad" t={t} przedrostek="sesje" naPonow={jest.fn()} wyjscie={{ rodzaj: 'wstecz', naWyjdz }} />);
    expect(screen.getByTestId('sesje-ponow')).toBeTruthy();
    fireEvent.press(screen.getByTestId('nav-wstecz'));
    expect(naWyjdz).toHaveBeenCalledTimes(1);
  });
  test('arkusz i zdjęcie: w stanie błędu „Close” (`<przedrostek>-zamknij`), także na czarnym tle', () => {
    const naWyjdz = jest.fn();
    render(<StanWczytywania stan="blad" t={t} przedrostek="zdjecie" tlo="czarne" naPonow={jest.fn()} wyjscie={{ rodzaj: 'zamknij', naWyjdz }} />);
    const zamknij = screen.getByTestId('zdjecie-zamknij');
    expect(zamknij).toBe(screen.getByRole('button', { name: 'Close' }));
    fireEvent.press(zamknij);
    expect(naWyjdz).toHaveBeenCalledTimes(1);
  });
  test('trwała kontrola: każda trasa z app/ rysująca StanWczytywania podaje wyjście z router.back()', () => {
    const APP = path.join(__dirname, '..', '..', 'app');
    const pliki = (k: string): string[] => fs.readdirSync(k, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? pliki(path.join(k, e.name)) : e.name.endsWith('.tsx') ? [path.join(k, e.name)] : []));
    const uzycia = pliki(APP).flatMap((p) => [...fs.readFileSync(p, 'utf8').matchAll(/<StanWczytywania\b[\s\S]*?\/>/g)].map((m) => ({ plik: path.relative(APP, p), kod: m[0] })));
    expect(uzycia.length).toBeGreaterThanOrEqual(16);
    // Stały stan="ladowanie" (licznik na korzeniu „/” po 068) nigdy nie rysuje błędu, a komponent pokazuje wyjście tylko przy stan='blad' —
    // kontrola dotyczy użyć, które mogą pokazać błąd; liczba stałych użyć jest przypięta, żeby wyjątek nie rósł po cichu.
    const stale = uzycia.filter((u) => /\bstan="ladowanie"/.test(u.kod));
    expect(stale.map((u) => u.plik)).toEqual(['index.tsx']);
    expect(uzycia.filter((u) => !stale.includes(u)).filter((u) => !/wyjscie=\{\{ rodzaj: '(wstecz|zamknij)', naWyjdz: \(\) => router\.back\(\) \}\}/.test(u.kod)).map((u) => u.plik)).toEqual([]);
  });
});

describe('504: brak miejsca na ekranie awaryjnym', () => {
  const rysuj = (powod: PowodTrybuAwaryjnego) => render(<TrybAwaryjny stan={{ powod }} t={t} naZapiszKopie={jest.fn()} naSprobujNormalnie={jest.fn()} naZglosProblem={jest.fn()} />);
  const kolejnosc = () => screen.getByTestId('arkusz-przyciski').findAll((n: { props: { testID?: unknown }; type: unknown }) => typeof n.props.testID === 'string' && typeof n.type === 'string' && /^awaryjny-/.test(n.props.testID as string)).map((n: { props: { testID?: unknown } }) => n.props.testID as string);
  test('nagłówek „Your device is out of space”, główny przycisk „Try starting normally”, kopia druga', () => {
    rysuj('brak_miejsca');
    expect(tekst(screen.getByRole('header'))).toBe(t('awaryjny.tytul_brak_miejsca'));
    expect(t('awaryjny.tytul_brak_miejsca')).not.toBe(t('awaryjny.tytul_petla'));
    expect([...new Set(kolejnosc())]).toEqual(['awaryjny-sprobuj-normalnie', 'awaryjny-zapisz-kopie', 'awaryjny-zglos-problem']);
    expect(within(screen.getByTestId('awaryjny-brak-miejsca')).getByText(t('awaryjny.opis_brak_miejsca'))).toBeTruthy();
  });
  test('każdy powód ma własny klucz nagłówka; przy innych powodach kopia zostaje pierwsza', () => {
    const naglowki = (['petla-startow', 'wersja_nowsza', 'uszkodzony', 'brak_miejsca'] as const).map((p) => { rysuj(p); const h = tekst(screen.getByRole('header')); screen.unmount(); return h; });
    expect(new Set(naglowki).size).toBe(4);
    rysuj('uszkodzony');
    expect([...new Set(kolejnosc())][0]).toBe('awaryjny-zapisz-kopie');
  });
});

describe('506: „Reset to 0…” przy zablokowanym liczniku', () => {
  const menu = (zablokowany: boolean, naZeruj = jest.fn()) => {
    const p: PropsMenuProjektu = { stan: { projekt: 'Harbor', zablokowany, wartosc: 3 }, t, naNazwa: jest.fn(), naCel: jest.fn(), naPrzypomnienie: jest.fn(), naPowtorzenie: jest.fn(),
      naWpisz: jest.fn(), naZablokuj: jest.fn(), naOdblokuj: jest.fn(), naZeruj, naUkoncz: jest.fn(), naZamknij: jest.fn() };
    render(<MenuProjektu {...p} />);
  };
  test('blokada: przycisk wyłączony (accessibilityState.disabled), widoczna podpowiedź, stuknięcie nie otwiera pytania', () => {
    menu(true);
    const reset = screen.getByTestId('menu-zeruj');
    expect(reset.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));
    expect(screen.getByText(t('menu.zeruj_zablokowany'))).toBeTruthy();
    fireEvent.press(reset);
    expect(screen.queryByText(t('menu.zeruj_potwierdz'))).toBeNull();
  });
  test('bez blokady: przycisk aktywny, bez podpowiedzi, pytanie po stuknięciu', () => {
    menu(false);
    expect(screen.queryByText(t('menu.zeruj_zablokowany'))).toBeNull();
    fireEvent.press(screen.getByTestId('menu-zeruj'));
    expect(screen.getByText(t('menu.zeruj_potwierdz'))).toBeTruthy();
  });
});
