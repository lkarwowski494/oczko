// M1-audytor-generalny-206 (05-architekt-001, ARCH-11; BR-DAN-006, ADR-0004): plik `.oczko` otwarty z Plików albo z poczty przy zimnym starcie.
// Wcześniej `+native-intent` kierował od razu na „/ustawienia?import=…”, więc trasa „/” (start danych: migracja, scalenie dziennika +1) nie
// była montowana i import na świeżej bazie padał („scal” → zapis, „zastąp” → no such table). Teraz zimny start zapamiętuje plik i otwiera „/”;
// licznik po `przygotuj()` otwiera Ustawienia z importem (push: licznik zostaje pod spodem, „wstecz” wraca na licznik). Ciepły start bez zmian.
import React from 'react';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { act, render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { utworzPortNode } from '../../src/dane/baza/adapter-node';
import { utworzArchiwum } from '../../src/dane/archiwum';
import { migruj } from '../../src/dane/migracje/migruj';
import type { LiveActivity, Zegarek } from '../../src/domena/porty';
import { WERSJA_SCHEMATU } from '../../src/konfiguracja';
import { odbierzImportPliku, oznaczStartDanych, zerujStanImportu } from '../../src/kompozycja/import-pliku';
import { kompozycjaLicznika } from '../../src/kompozycja/licznik';
import { redirectSystemPath } from '../../app/+native-intent';
import { archiwumWzorcowe, czesc, licznik as licznikDanych, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { czasWTle, dziennikTestowy, identyfikatory, katalogTymczasowy, licznosci, magazynTestowy, zegarTestowy } from '../dane/pomocnicze/srodowisko';
import { przycisk, tEn } from './pomoc';

const mockRouter = { push: jest.fn(), replace: jest.fn(), canGoBack: () => false, back: jest.fn() };
const mockParametry: { import?: string } = {};
jest.mock('expo-router', () => ({
  usePathname: () => '/', useRouter: () => mockRouter, useIsFocused: () => true, useLocalSearchParams: () => mockParametry,
  useFocusEffect: (f: () => void | (() => void)) => { // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('react') as typeof React).useEffect(f, []);
  },
}));
jest.mock('../../src/ekrany/Aplikacja', () => ({ Aplikacja: () => null }));
jest.mock('../../src/ekrany/ListaProjektow', () => ({ ListaProjektow: () => null }));
jest.mock('../../src/kompozycja/SkrzynkaNaEkranie', () => ({ SkrzynkaNaEkranie: () => null }));
jest.mock('../../src/kompozycja/StoperLicznika', () => ({ StoperLicznika: () => null, SprawdzStopera: () => null }));
jest.mock('../../src/kompozycja/Bezpieczny', () => ({ Bezpieczny: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../../src/kompozycja/system', () => ({ cyklAplikacji: {}, oglos: jest.fn(), systemAplikacji: {} }));
jest.mock('../../src/kompozycja/start-aplikacji', () => ({ zapiszKamien: () => Promise.resolve(), powodAwaryjny: () => 'uszkodzony' }));
jest.mock('../../src/platforma/system-plikow-uzytkownika', () => ({ udostepnijPlik: jest.fn(), wybierzArchiwum: jest.fn() }));
let mockAplikacja: unknown;
jest.mock('../../src/kompozycja/Kontekst', () => ({ useAplikacja: () => mockAplikacja }));
/* eslint-disable @typescript-eslint/no-require-imports */
const EkranLicznika = (require('../../app/(zakladki)/index') as { default: React.ComponentType }).default;
const EkranUstawien = (require('../../app/ustawienia') as { default: React.ComponentType }).default;
/* eslint-enable @typescript-eslint/no-require-imports */

/** Świeża instalacja: plik bazy bez migracji (jak pierwszy start na nowym telefonie) i kompozycja jak w aplikacji. */
async function swiezaInstalacja() {
  const k = katalogTymczasowy('import-206-');
  const baza = utworzPortNode(join(k, 'oczko.db'));
  const katalogi = { kopie: join(k, 'kopie'), kopiePrzed: join(k, 'Documents', 'Backup'), tymczasowy: join(k, 'tmp'), podreczny: join(k, 'Caches') };
  for (const d of Object.values(katalogi)) mkdirSync(d, { recursive: true });
  const zegar = zegarTestowy(); const magazyn = magazynTestowy(join(k, 'pliki'));
  const archiwum = utworzArchiwum({ baza, magazyn, zegar, katalogi, migruj: (b) => migruj(b), aplikacja: '1.0.0 (test)' });
  const z = { baza, zegar, id: identyfikatory('6'), urzadzenie: 'nowy-telefon', pro: () => false, magazyn, katalogi, dziennik: dziennikTestowy(), archiwum, czasWTle };
  const t = await tEn();
  const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined };
  const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async () => undefined, odbieraj: () => () => undefined };
  const licznik = kompozycjaLicznika({ ...z, migruj: (b) => migruj(b, { katalogKopii: katalogi.kopie }), liveActivity, zegarek }, { t, jezyk: () => 'en', zegar24h: () => true }, { wibracje: () => true });
  const naAwarie = jest.fn();
  mockAplikacja = {
    kontener: { z, j: { t, preferencja: () => 'auto', jezyk: () => 'en' }, porty: {}, icloud: null, katalogDanych: k, wzor: { k: {} },
      dostep: { stan: () => ({ poziom: 'darmowa', aktywne: null, pro: false }), naZmiane: () => () => undefined } },
    licznik, preferencje: { stan: () => ({ wibracje: true }), ustaw: jest.fn() }, naAwarie,
  };
  return { baza, naAwarie };
}
/** Plik `.oczko` ze starego telefonu: dwa projekty z częścią i licznikiem. */
function plikZeStaregoTelefonu(): { sciezka: string; projekty: number } {
  const k = katalogTymczasowy('import-206-plik-');
  return { sciezka: archiwumWzorcowe(k, 'stary-telefon', [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznikDanych('l1', 'c1', 7), projekt('p2', 'Czapka')]), projekty: 2 };
}
const odczekaj = async () => { await act(async () => { await new Promise((r) => setTimeout(r, 200)); }); };

beforeEach(() => {
  mockRouter.push.mockReset();
  delete mockParametry.import;
  zerujStanImportu(); // pusta skrzynka i start danych od nowa (jak nowy proces)
});

test('206: zimny start z pliku .oczko → „/” (start danych), plik czeka na licznik; ciepły start → od razu Ustawienia z importem', () => {
  const adres = 'file:///private/var/mobile/Inbox/Kopia%2026-10.oczko';
  expect(redirectSystemPath({ path: adres, initial: true })).toBe('/');
  expect(odbierzImportPliku()).toBe('/private/var/mobile/Inbox/Kopia 26-10.oczko');
  expect(odbierzImportPliku()).toBeNull(); // odebrany raz
  oznaczStartDanych(); // ciepły start po zakończonym starcie danych
  expect(redirectSystemPath({ path: adres, initial: false })).toBe(`/ustawienia?import=${encodeURIComponent('/private/var/mobile/Inbox/Kopia 26-10.oczko')}`);
  expect(odbierzImportPliku()).toBeNull();
  expect(redirectSystemPath({ path: 'oczko://projekty', initial: true })).toBe('oczko://projekty'); // inne adresy bez zmian
});

for (const [tryb, etykieta] of [['scal', 'Merge with what’s here'], ['zastap', 'Replace what’s here']] as const) {
  test(`206: świeża baza, zimny start z pliku → licznik uruchamia dane (user_version = WERSJA_SCHEMATU) i dopiero wtedy otwiera Ustawienia; „${tryb}” kończy się sukcesem z licznościami pliku`, async () => {
    const { baza, naAwarie } = await swiezaInstalacja();
    const plik = plikZeStaregoTelefonu();
    const wersjaPrzyOtwarciu: number[] = [];
    mockRouter.push.mockImplementation(() => { void baza.all<{ user_version: number }>('PRAGMA user_version').then((w) => wersjaPrzyOtwarciu.push(w[0].user_version)); });
    expect(redirectSystemPath({ path: `file://${plik.sciezka}`, initial: true })).toBe('/');
    render(<EkranLicznika />);
    await odczekaj();
    expect(naAwarie).not.toHaveBeenCalled();
    // push, nie replace: licznik zostaje pod Ustawieniami, „wstecz” wraca na licznik; cel startu (lista projektów) nie przykrywa importu.
    expect(mockRouter.push.mock.calls).toEqual([[{ pathname: '/ustawienia', params: { import: plik.sciezka } }]]);
    expect(wersjaPrzyOtwarciu).toEqual([WERSJA_SCHEMATU]);
    mockParametry.import = plik.sciezka;
    render(<EkranUstawien />);
    await waitFor(() => expect(screen.getByTestId('import-gotowy')).toBeTruthy());
    await userEvent.press(przycisk(etykieta));
    await screen.findByTestId('import-wynik');
    const po = await licznosci(baza);
    expect({ projekt: po.projekt, czesc: po.czesc, licznik: po.licznik }).toEqual({ projekt: plik.projekty, czesc: 1, licznik: 1 });
    const integralnosc = await baza.all<{ integrity_check: string }>('PRAGMA integrity_check');
    expect(integralnosc).toEqual([{ integrity_check: 'ok' }]);
    expect(await baza.all('PRAGMA foreign_key_check')).toEqual([]);
  });
}

// Przegląd ścieżek wrażliwych (D-043) do 206: proces obudzony w tle (Live Activity, zegarek, CloudKit) zużył adres startowy, więc plik
// przychodzi z `initial: false`, zanim start danych się skończył (stos bywa jeszcze niezamontowany i link przepada). Rozstrzyga start danych, nie `initial`.
test('206 (przegląd): plik przy żywym procesie przed końcem startu danych → „/” i skrzynka, nie Ustawienia', () => {
  expect(redirectSystemPath({ path: 'file:///tmp/B.oczko', initial: false })).toBe('/');
  expect(odbierzImportPliku()).toBe('/tmp/B.oczko');
});

test('206 (przegląd): plik przychodzi w trakcie `przygotuj()` licznika → po starcie danych Ustawienia z importem (push), nie cel startu', async () => {
  const { baza } = await swiezaInstalacja();
  const plik = plikZeStaregoTelefonu();
  const wersjaPrzyOtwarciu: number[] = [];
  mockRouter.push.mockImplementation(() => { void baza.all<{ user_version: number }>('PRAGMA user_version').then((w) => wersjaPrzyOtwarciu.push(w[0].user_version)); });
  render(<EkranLicznika />);
  redirectSystemPath({ path: `file://${plik.sciezka}`, initial: false }); // przed zakończeniem startu danych
  await odczekaj();
  expect(mockRouter.push.mock.calls).toEqual([[{ pathname: '/ustawienia', params: { import: plik.sciezka } }]]);
  expect(wersjaPrzyOtwarciu).toEqual([WERSJA_SCHEMATU]);
});
