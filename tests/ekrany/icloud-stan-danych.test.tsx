// Data and sync z iCloud (design-spec „iCloud (I1a–I3)”, makieta fix7 udostepnij-icloud.html; testID: e2e/README.md grupa I; P-220, P-229, P-242)
// i „Delete all data” z „Also delete from iCloud” (BR-DAN-009, scenariusz 51). Teksty z en.json (łatka 04 fix-7).
import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import tokeny from '../../docs/design/tokeny.json';
import { StanDanych, type PropsStanuDanych } from '../../src/ekrany/StanDanych';
import { Ustawienia } from '../../src/ekrany/Ustawienia';
import { ArkuszUsunWszystko } from '../../src/ekrany/UsunWszystko';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaSystemu, tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

type Icloud = NonNullable<PropsStanuDanych['icloud']>;
const icloud = (z: Partial<Icloud> = {}): Icloud => ({
  wlaczona: false, stan: 'wylaczona', przyczyna: null, konflikty: 0, niepelna: false,
  naPrzelacz: jest.fn(), naUstawienia: jest.fn(), naZarzadzaj: jest.fn(), ...z,
});
const stan = (z: Partial<PropsStanuDanych['stan']> = {}): PropsStanuDanych['stan'] => ({ synchronizacja: 'wylaczona', ostatniaUdana: null, czekaNaSiec: false, zegarek: null, ...z });

describe('Data and sync: przełącznik iCloud', () => {
  test('bez `icloud` (ZM-06: wiersz ukryty) — brak przełącznika, dane zapisane na telefonie', () => {
    render(<StanDanych stan={stan()} t={t} />);
    expect(screen.queryByTestId('icloud-przelacznik')).toBeNull();
    expect(screen.getByText('Everything is saved on this device.')).toBeTruthy(); // M1-060: „this device” (iPad)
  });
  test('domyślnie wyłączony (BR-DAN-002/S3): przełącznik off z etykietą i podpisem; stuknięcie prosi o włączenie (alert w kompozycji)', () => {
    const i = icloud();
    render(<StanDanych stan={stan()} t={t} icloud={i} />);
    const s = screen.getByTestId('icloud-przelacznik');
    expect(s.props.accessibilityState).toMatchObject({ checked: false });
    expect(s.props.accessibilityLabel).toBe('Sync with iCloud');
    expect(screen.getByText(/Your data goes only to your own iCloud/)).toBeTruthy();
    fireEvent(s, 'valueChange', true);
    expect(i.naPrzelacz).toHaveBeenCalledWith(true);
  });
  test('włączona i aktywna: stan „on” w grupie role=status, zapisane na telefonie', () => {
    render(<StanDanych stan={stan({ synchronizacja: 'aktywna' })} t={t} icloud={icloud({ wlaczona: true, stan: 'aktywna' })} />);
    expect(screen.getByTestId('icloud-przelacznik').props.accessibilityState).toMatchObject({ checked: true });
    expect(screen.getByTestId('icloud-stan')).toBeTruthy();
    expect(screen.getByText('iCloud sync is on.')).toBeTruthy();
    expect(screen.getByText('Everything is saved on this device.')).toBeTruthy(); // M1-060: „this device” (iPad)
    expect(screen.queryByTestId('icloud-problem')).toBeNull();
  });
  test('brak konta: linia problemu z nagłówkiem i „Open Settings”; dane na telefonie', () => {
    const i = icloud({ wlaczona: false, stan: 'brak_konta' });
    render(<StanDanych stan={stan()} t={t} icloud={i} />);
    expect(screen.getByTestId('icloud-problem').props.children).toBe('iCloud isn’t available to Oczko');
    expect(screen.getByText(/Check that you’re signed in to iCloud/)).toBeTruthy();
    fireEvent.press(screen.getByText('Open Settings'));
    expect(i.naUstawienia).toHaveBeenCalled();
    expect(screen.getByText('Everything is saved on this device.')).toBeTruthy(); // M1-060: „this device” (iPad)
  });
  test('brak miejsca: „Your iCloud storage is full” i „Manage storage”', () => {
    const i = icloud({ wlaczona: true, stan: 'blad', przyczyna: 'brak_miejsca' });
    render(<StanDanych stan={stan()} t={t} icloud={i} />);
    expect(screen.getByTestId('icloud-problem').props.children).toBe('Your iCloud storage is full');
    fireEvent.press(screen.getByText('Manage storage'));
    expect(i.naZarzadzaj).toHaveBeenCalled();
  });
  test('błąd sieci: „Sync is waiting for a network connection.”; niepełna historia: linia informacji', () => {
    render(<StanDanych stan={stan()} t={t} icloud={icloud({ wlaczona: true, stan: 'blad', przyczyna: 'siec', niepelna: true })} />);
    expect(screen.getByText('Sync is waiting for a network connection.')).toBeTruthy();
    expect(screen.getByTestId('icloud-problem').props.children).toBe('Some changes from your other devices aren’t shown yet');
  });
  test('niepełna historia z nowszej wersji: „Update Oczko…” (icloud.niepelna_nowsza) zamiast „Oczko keeps trying”', () => {
    const { rerender } = render(<StanDanych stan={stan()} t={t} icloud={icloud({ wlaczona: true, stan: 'aktywna', niepelna: true, niepelnaNowsza: true })} />);
    expect(screen.getByText(/Update Oczko on this device to see them/)).toBeTruthy();
    expect(screen.queryByText(/Oczko keeps trying/)).toBeNull();
    rerender(<StanDanych stan={stan()} t={t} icloud={icloud({ wlaczona: true, stan: 'aktywna', niepelna: true })} />);
    expect(screen.getByText(/Oczko keeps trying/)).toBeTruthy();
  });
  test('„Syncing…” zamiast ostatniej synchronizacji, gdy trwa wysyłka (icloud.synchronizuje)', () => {
    const { rerender } = render(<StanDanych stan={stan({ ostatniaUdana: 'Nov 10, 7:30 PM' })} t={t} icloud={icloud({ wlaczona: true, stan: 'aktywna', synchronizuje: true })} />);
    expect(screen.getByText('Syncing…')).toBeTruthy();
    expect(screen.queryByText(/Nov 10, 7:30 PM/)).toBeNull();
    rerender(<StanDanych stan={stan({ ostatniaUdana: 'Nov 10, 7:30 PM' })} t={t} icloud={icloud({ wlaczona: true, stan: 'aktywna' })} />);
    expect(screen.queryByText('Syncing…')).toBeNull();
    expect(screen.getByText(/Nov 10, 7:30 PM/)).toBeTruthy();
  });
  test('liczniki w konflikcie: wiersz z liczbą (odmiana)', () => {
    const { rerender } = render(<StanDanych stan={stan()} t={t} icloud={icloud({ wlaczona: true, stan: 'aktywna', konflikty: 1 })} />);
    expect(screen.getByTestId('icloud-konflikty')).toBeTruthy();
    expect(screen.getByText('1 counter has two versions')).toBeTruthy();
    rerender(<StanDanych stan={stan()} t={t} icloud={icloud({ wlaczona: true, stan: 'aktywna', konflikty: 2 })} />);
    expect(screen.getByText('2 counters have two versions')).toBeTruthy();
  });
  test('panel buildu E2E pod treścią', () => {
    render(<StanDanych stan={stan()} t={t} icloud={icloud()} panelE2e={<Text>x</Text>} />);
    expect(screen.getByText('x')).toBeTruthy();
  });
});

describe('Delete all data z „Also delete from iCloud” (BR-DAN-009, P-229)', () => {
  const props = (icloudWlaczona: boolean, blad = false) => ({ t, icloudWlaczona, blad, naUsun: jest.fn(), naZamknij: jest.fn() });
  test('Ustawienia: „Delete all data” otwiera arkusz potwierdzenia (trasa), bez usuwania (P-266 (3))', () => {
    const naUsunWszystko = jest.fn();
    render(<Ustawienia stan={{ pro: null, dni: null, wibracje: true }} t={t} system={atrapaSystemu()} adresy={{ polityka: 'p', recenzja: 'r' }}
      naOferty={jest.fn()} naWibracje={jest.fn()} naZglosProblem={jest.fn()} naStanDanych={jest.fn()} dane={{ naEksport: jest.fn(), naImport: jest.fn(), naUsunWszystko }} />);
    fireEvent.press(screen.getByTestId('ustawienia-usun-wszystko'));
    expect(naUsunWszystko).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('potwierdz-usun-wszystko')).toBeNull();
  });
  test('synchronizacja wyłączona: bez przełącznika; potwierdzenie usuwa bez iCloud', () => {
    const p = props(false);
    render(<ArkuszUsunWszystko {...p} />);
    expect(screen.queryByTestId('usun-z-icloud')).toBeNull();
    fireEvent.press(screen.getByTestId('potwierdz-usun-wszystko'));
    expect(p.naUsun).toHaveBeenCalledWith(false);
  });
  test('włączona: przełącznik domyślnie wyłączony z „Data in iCloud … stays”; włączony → usunięcie także z iCloud', () => {
    const p = props(true);
    render(<ArkuszUsunWszystko {...p} />);
    const s = screen.getByTestId('usun-z-icloud');
    expect(s.props.accessibilityState).toMatchObject({ checked: false });
    expect(screen.getByText('Data in iCloud and on your other devices stays.')).toBeTruthy();
    fireEvent(s, 'valueChange', true);
    expect(screen.getByTestId('usun-z-icloud').props.accessibilityState).toMatchObject({ checked: true });
    expect(screen.getByText('Your other devices lose these projects the next time they sync.')).toBeTruthy();
    fireEvent.press(screen.getByTestId('potwierdz-usun-wszystko'));
    expect(p.naUsun).toHaveBeenCalledWith(true);
  });
  test('P-266 (3), scen. 51, design-spec:776: potwierdzenie w pasku arkusza (zawsze widoczny), tło `blad`; Cancel zamyka bez usuwania; błąd w arkuszu', () => {
    const p = props(true);
    const { rerender } = render(<ArkuszUsunWszystko {...p} />);
    const pasek = screen.getByTestId('arkusz-przyciski');
    expect(within(pasek).getByTestId('potwierdz-usun-wszystko')).toHaveStyle({ backgroundColor: tokeny.kolor.jasny.blad });
    expect(within(pasek).queryByTestId('usun-z-icloud')).toBeNull(); // przełącznik w treści arkusza, nie w pasku
    fireEvent.press(within(pasek).getByTestId('usun-wszystko-anuluj'));
    expect(p.naZamknij).toHaveBeenCalledTimes(1);
    expect(p.naUsun).not.toHaveBeenCalled();
    rerender(<ArkuszUsunWszystko {...props(true, true)} />);
    expect(screen.getByRole('alert')).toBeTruthy();
  });
});
