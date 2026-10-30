// Testy akceptacyjne ekranu licznika (rola 07, E3, P-090 Q2a). Wyrocznia: docs/design/design-spec.md (wzorzec zatwierdzony 04)
// i ekrany.html / prototyp.html (makiety 04); BR z docs/brd/wymagania-licznik.md. Teksty przez prawdziwe t() z en.json:
// klucze z tymi tekstami dodaje 08 (DEV-12). Stany bez makiety: zapytanie robocze z komentarzem Z07-05.
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Licznik, type StanEkranuLicznika, type WynikPlus } from '../../src/ekrany/Licznik';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { atrapaHaptyki, odroczona, zagrane, plusOk, przycisk, stanLicznika, tEn, wywolaniaLicznika } from './pomoc';

// Domyślny rozmiar tekstu jak na urządzeniu (fontScale 1); preset jest RN daje 2, czyli kategorię dostępności (układ AX: licznik-ax5.test.tsx, P-275 (3)).
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 402, height: 874, scale: 3, fontScale: 1 }) }));

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

function pokaz(stan: StanEkranuLicznika, naPlus?: () => Promise<WynikPlus>) {
  const w = wywolaniaLicznika(naPlus);
  const haptyka = atrapaHaptyki();
  const oglos = jest.fn();
  const r = render(<Licznik stan={stan} t={t} oglos={oglos} haptyka={haptyka} {...w} />);
  const ponow = (s: StanEkranuLicznika) => r.rerender(<Licznik stan={s} t={t} oglos={oglos} haptyka={haptyka} {...w} />);
  return { w, haptyka, oglos, ponow };
}
const PLUS = /^\+1 row/;  // design-spec.md:32 „etykieta zawiera widoczny tekst („+1 row …”, WCAG 2.5.3)”
const START = stanLicznika({ projekt: null, czesc: null, skonczone: 0, dziergany: 1, miesiac: { nazwa: 'November', wznowienie: 'December 1', rzedyDanych: 0 } });

describe('Licznik', () => {
  test('NFR-PIE-001 / BR-LIC-001: pierwszy ekran to licznik z 0, +1 jednym stuknięciem (ekrany.html licznik-start)', async () => {
    const { w, oglos } = pokaz(START, async () => plusOk(1));
    // ekrany.html:102 aria-label="+1 row" i aria-label="−1 row" (stan licznik-start, bez projektu)
    const plus = przycisk('+1 row', 'button');
    expect(przycisk('−1 row', 'button')).toBeTruthy();
    // ekrany.html:99 podpowiedź pierwszego liczenia; nic o projekcie, zakupie ani dniach (NFR-PIE-001, P-046)
    expect(screen.getByText('Tap the big button each time you finish a row. Each row gets a pencil mark here.')).toBeTruthy();
    expect(screen.queryByText(/Oczko Pro|free crafting day|Welcome|Sign in/)).toBeNull();
    fireEvent.press(plus);
    expect(w.naPlus).toHaveBeenCalledTimes(1);
    // design-spec.md:62 „47 done. Now row 48.” — wzór ogłoszenia po +1
    await waitFor(() => expect(oglos).toHaveBeenCalledWith('1 done. Now row 2.'));
  });

  test('R-148 / NFR-DOS-001: ogłoszenie i haptyka dopiero po wyniku ok (design-spec.md:62)', async () => {
    const d = odroczona<WynikPlus>();
    const { oglos, haptyka } = pokaz(stanLicznika({ skonczone: 46, dziergany: 47 }), () => d.obietnica);
    fireEvent.press(screen.getByRole('button', { name: PLUS }));
    expect(oglos).not.toHaveBeenCalled();
    expect(zagrane(haptyka, 'plus')).toBe(0);
    d.rozwiaz(plusOk(47));
    await waitFor(() => expect(oglos).toHaveBeenCalledWith('47 done. Now row 48.'));
    expect(zagrane(haptyka, 'plus')).toBe(1);
  });

  test('R-004 / NFR-DAN-002: błąd zapisu nigdy cicho — komunikat, bez ogłoszenia i haptyki (design-spec.md:54)', async () => {
    const { oglos, haptyka } = pokaz(stanLicznika(), async () => ({ ok: false, powod: 'zapis' }));
    fireEvent.press(screen.getByRole('button', { name: PLUS }));
    // design-spec.md:54 „Couldn’t save that row. It’s still on screen; try again.”
    expect(await screen.findByText('Couldn’t save that row. It’s still on screen; try again.')).toBeTruthy();
    expect(oglos).not.toHaveBeenCalledWith(expect.stringMatching(/done\. Now row/));
    expect(zagrane(haptyka, 'plus')).toBe(0);
    expect(screen.getByRole('button', { name: PLUS })).toBeTruthy(); // ponowienie: ten sam przycisk
  });

  test('BR-LIC-004/S1: stuknięcie w +1 zablokowanego licznika nie dodaje rzędu (wartość 15 zostaje)', async () => {
    const { oglos, haptyka } = pokaz(stanLicznika({ skonczone: 15, dziergany: 16, zablokowany: true }), async () => ({ ok: false, powod: 'zablokowany' }));
    fireEvent.press(screen.getByRole('button', { name: PLUS }));
    // design-spec.md:30 „Now working row 48” → przy 15 skończonych: rząd 16
    await waitFor(() => expect(screen.getByText('Now working row 16')).toBeTruthy());
    expect(oglos).not.toHaveBeenCalledWith(expect.stringMatching(/^16 done/));
    expect(zagrane(haptyka, 'plus')).toBe(0);
  });

  test('BR-LIC-004/S2: Unlock na pasku blokady, potem +1 znów dodaje (design-spec.md:34, prototyp.html:104)', async () => {
    const { w, oglos, ponow } = pokaz(stanLicznika({ skonczone: 15, dziergany: 16, zablokowany: true }), async () => plusOk(16));
    // design-spec.md:34 pasek „Counter locked · Unlock” pod paskiem nawigacji
    expect(screen.getByText(/Counter locked/)).toBeTruthy();
    fireEvent.press(przycisk('Unlock', 'button'));
    expect(w.naOdblokuj).toHaveBeenCalledTimes(1);
    ponow(stanLicznika({ skonczone: 15, dziergany: 16, zablokowany: false }));
    expect(screen.queryByText(/Counter locked/)).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: PLUS }));
    await waitFor(() => expect(oglos).toHaveBeenCalledWith('16 done. Now row 17.'));
  });

  test('BR-LIC-004/S3: świadome stuknięcie w zablokowany licznik mówi, jak odblokować (design-spec.md:34)', async () => {
    pokaz(stanLicznika({ skonczone: 15, dziergany: 16, zablokowany: true }), async () => ({ ok: false, powod: 'zablokowany' }));
    fireEvent.press(screen.getByRole('button', { name: PLUS }));
    // design-spec.md:34 „Counter is locked. Unlock it at the top.” (BR-LIC-004)
    expect(await screen.findByText('Counter is locked. Unlock it at the top.')).toBeTruthy();
  });

  test('BR-LIC-005/S2: +1 nie odtwarza dźwięku (brzmienie ER-36: „nigdy nie odtwarza dźwięku przy +1”)', async () => {
    // Szpiegi modułów dźwięku: ekran nie może ich użyć. Kontrola repo (brak expo-av/expo-audio w src/) — propozycja dla kontroli 07.
    const graj = jest.fn();
    jest.doMock('expo-av', () => ({ Audio: { Sound: { createAsync: graj } } }), { virtual: true });
    jest.doMock('expo-audio', () => ({ createAudioPlayer: graj, useAudioPlayer: graj }), { virtual: true });
    const { w } = pokaz(stanLicznika());
    fireEvent.press(screen.getByRole('button', { name: PLUS }));
    await waitFor(() => expect(w.naPlus).toHaveBeenCalledTimes(1));
    expect(graj).not.toHaveBeenCalled();
  });

  test('BR-LIC-011/S1: cel 40 osiągnięty — propozycja następnej części (U-11; etykieta robocza Z07-05)', async () => {
    const { w, ponow } = pokaz(stanLicznika({ cel: 40, skonczone: 39, dziergany: 40 }), async () => plusOk(40, { zdarzenia: ['rzad', 'cel-czesci'] }));
    fireEvent.press(screen.getByRole('button', { name: PLUS }));
    await waitFor(() => expect(w.naPlus).toHaveBeenCalledTimes(1));
    ponow(stanLicznika({ cel: 40, skonczone: 40, dziergany: 41 }));
    // design-spec.md:24 „Goal 96 rows · 49 to go” → przy celu 40
    expect(screen.getByText(/Goal 40 rows/)).toBeTruthy();
    // Z07-05: brak makiety stanu „cel osiągnięty”; nazwa robocza 07 („Next part”, docs/scope-contract.md:22 „Następna część”) do zatwierdzenia 04
    fireEvent.press(screen.getByRole('button', { name: /next part/i }));
    expect(w.naNastepnaCzesc).toHaveBeenCalledTimes(1);
  });

  test('BR-LIC-011/S2: 41 przy celu 40 — oznaczenie „ponad cel”, bez ujemnego „to go” (Z07-05)', () => {
    pokaz(stanLicznika({ cel: 40, skonczone: 41, dziergany: 42 }));
    expect(screen.getAllByText('41', { includeHiddenElements: true }).length).toBeGreaterThan(0);
    // Z07-05: brak tekstu „ponad cel” w design-spec; zapytanie robocze 07
    expect(screen.getByText(/over (the )?goal|past (the )?goal|above (the )?goal/i)).toBeTruthy();
    expect(screen.queryByText(/-\s?1 to go|−\s?1 to go/)).toBeNull();
  });

  test('BR-LIC-012/S1: tryb „rząd w trakcie” po 12 skończonych pokazuje rząd 13 (zgłoszenie Z07-04)', () => {
    pokaz(stanLicznika({ znaczenie: 'w_trakcie', skonczone: 12, dziergany: 13 }));
    expect(screen.getAllByText('13', { includeHiddenElements: true }).length).toBeGreaterThan(0);
    expect(screen.queryAllByText('12', { includeHiddenElements: true })).toHaveLength(0);
  });

  test('BR-LIC-019/S4: bez serii dodań nic o strażniku na ekranie (P-046)', () => {
    pokaz(stanLicznika({ baner: null }));
    expect(screen.queryByText(/Added \d+ rows?|Undo/)).toBeNull();
    expect(screen.queryByRole('button', { name: /^Undo/ })).toBeNull();
  });

  test('BR-LIC-019 [macierz 04: seria stuknięć z banerem]: baner, „Undo 3 rows”, ogłoszenie (design-spec.md:35, :64)', () => {
    const { w, oglos, ponow } = pokaz(stanLicznika({ skonczone: 33, dziergany: 34, baner: { rodzaj: 'seria', n: 3, sekundy: 1 } }));
    // design-spec.md:35 „Added 3 rows in 1 s. Undo?”
    expect(screen.getByText('Added 3 rows in 1 s. Undo?')).toBeTruthy();
    // design-spec.md:64 ogłoszenie „Added 3 rows in 1 second. Undo is available.” i przycisk „Undo 3 rows”
    expect(oglos).toHaveBeenCalledWith('Added 3 rows in 1 second. Undo is available.');
    fireEvent.press(przycisk('Undo 3 rows', 'button'));
    expect(w.naCofnijSerie).toHaveBeenCalledTimes(1);
    ponow(stanLicznika({ skonczone: 30, dziergany: 31, baner: { rodzaj: 'cofnieto', n: 3, wartosc: 30 } }));
    // design-spec.md:35 „po Undo potwierdzenie „Removed 3 rows. Back to 30.””
    expect(screen.getByText('Removed 3 rows. Back to 30.')).toBeTruthy();
  });

  test('BR-LIC-020/S1: rząd z przypomnieniem wibruje innym wzorem niż zwykły rząd (F-48)', async () => {
    const wyniki: WynikPlus[] = [plusOk(12, { zdarzenia: ['przypomnienie'] }), plusOk(13, { zdarzenia: ['rzad'] })];
    const { haptyka } = pokaz(stanLicznika({ skonczone: 11, dziergany: 12 }), async () => wyniki.shift()!);
    fireEvent.press(screen.getByRole('button', { name: PLUS }));
    await waitFor(() => expect(zagrane(haptyka, 'rzadZInstrukcja')).toBe(1));
    expect(zagrane(haptyka, 'plus')).toBe(0);
    fireEvent.press(screen.getByRole('button', { name: PLUS }));
    await waitFor(() => expect(zagrane(haptyka, 'plus')).toBe(1));
    expect(zagrane(haptyka, 'rzadZInstrukcja')).toBe(1);
  });

  test('BR-LIC-020/S2: koniec powtórzenia i cel dnia wibrują wzorem przypomnienia, nie rzędu (brzmienie ER-36)', async () => {
    const wyniki: WynikPlus[] = [plusOk(8, { zdarzenia: ['koniec-powtorzenia'] }), plusOk(13, { zdarzenia: ['cel-dnia'] })];
    const { haptyka } = pokaz(stanLicznika({ skonczone: 7, dziergany: 8 }), async () => wyniki.shift()!);
    fireEvent.press(screen.getByRole('button', { name: PLUS }));
    await waitFor(() => expect(zagrane(haptyka, 'rzadZInstrukcja')).toBe(1));
    fireEvent.press(screen.getByRole('button', { name: PLUS }));
    await waitFor(() => expect(zagrane(haptyka, 'rzadZInstrukcja')).toBe(2));
    expect(zagrane(haptyka, 'plus')).toBe(0);
  });

  test('BR-LIC-020/S3: wibracje wyłączone — zero wywołań haptyki', async () => {
    const wyniki: WynikPlus[] = [plusOk(12, { zdarzenia: ['przypomnienie'] }), plusOk(13, { zdarzenia: ['rzad'] })];
    const { w, haptyka } = pokaz(stanLicznika({ skonczone: 11, dziergany: 12, wibracje: false }), async () => wyniki.shift()!);
    fireEvent.press(screen.getByRole('button', { name: PLUS }));
    fireEvent.press(screen.getByRole('button', { name: PLUS }));
    await waitFor(() => expect(w.naPlus).toHaveBeenCalledTimes(2));
    await new Promise((r) => setTimeout(r, 0));
    expect(zagrane(haptyka, 'plus')).toBe(0);
    expect(zagrane(haptyka, 'rzadZInstrukcja')).toBe(0);
  });

  test('BR-PRJ-002/S1: notatka widoczna przy liczniku bez otwierania innego ekranu', () => {
    pokaz(stanLicznika({ notatka: 'następne: 3 oczka prawe, potem warkocz' }));
    expect(screen.getByText('następne: 3 oczka prawe, potem warkocz')).toBeTruthy();
  });

  test('BR-PRJ-014/S2: w rzędzie 30 drugiego rękawa widać notatkę i przypomnienie z pierwszego (Z07-05)', () => {
    pokaz(stanLicznika({ czesc: 'Right sleeve', skonczone: 30, dziergany: 31, blizniak: { rzad: 30, notatka: 'ujmowanie', przypomnienie: 'decrease at both ends' } }));
    expect(screen.getByText(/ujmowanie/)).toBeTruthy();
    expect(screen.getByText(/decrease at both ends/)).toBeTruthy();
  });

  test('BR-DNI-005/S5: bez terminu ekran licznika nie pokazuje celu dziennego ani kalendarza (P-046)', () => {
    pokaz(stanLicznika({ cel: 96, celDnia: null }));
    expect(screen.getByText(/Goal 96 rows/)).toBeTruthy(); // design-spec.md:24 linijka celu części jest dozwolona
    expect(screen.queryByText(/today|per day|deadline|calendar/i)).toBeNull();
  });

  test('NFR-DOS-001: etykieta +1 zawiera instrukcję rzędu (ekrany.html:122, design-spec.md:23)', () => {
    pokaz(stanLicznika({ przypomnienie: { tekst: 'decrease at both ends', ktory: 7, razy: 8, nastepny: 54 } }));
    // ekrany.html:122 aria-label="+1 row, when row 48 is done. Row 48: decrease at both ends"; design-spec.md:31 podpis „tap when row 48 is done”
    expect(przycisk('+1 row, when row 48 is done. Row 48: decrease at both ends', 'button')).toBeTruthy();
    expect(screen.getByText('tap when row 48 is done')).toBeTruthy();
  });

  test('NFR-DOS-001: wejście w rząd z instrukcją ogłaszane raz (design-spec.md:63)', async () => {
    const wyniki: WynikPlus[] = [
      plusOk(47, { wejscieWPrzypomnienie: { rzad: 48, tekst: 'decrease at both ends', ktory: 7, razy: 8 } }),
      plusOk(48),
    ];
    const { oglos } = pokaz(stanLicznika({ skonczone: 46, dziergany: 47 }), async () => wyniki.shift()!);
    fireEvent.press(screen.getByRole('button', { name: PLUS }));
    // design-spec.md:63 „Row 48: decrease at both ends, 7 of 8.” (raz, po +1, które w niego wprowadza)
    await waitFor(() => expect(oglos).toHaveBeenCalledWith('Row 48: decrease at both ends, 7 of 8.'));
    fireEvent.press(screen.getByRole('button', { name: PLUS }));
    await waitFor(() => expect(oglos).toHaveBeenCalledWith('48 done. Now row 49.'));
    expect(oglos.mock.calls.filter(([s]) => /^Row 48:/.test(s))).toHaveLength(1);
  });

  test('KP-13: poza limitem licznik nie ma odnośnika do Pro ani ekranu zakupu', () => {
    const { w } = pokaz(stanLicznika({ limit: { rodzaj: 'brak' } }));
    expect(screen.queryByRole('link', { name: 'Oczko Pro removes the limit' })).toBeNull();
    expect(screen.queryByText(/Oczko Pro/)).toBeNull();
    expect(w.naOferty).not.toHaveBeenCalled();
  });
});

// P-284: VoiceOver Magic Tap = +1 na liczniku (design-spec:88); ta sama ścieżka co przycisk +1 — przy blokadzie bez zapisu (BR-LIC-004/S3).
test('VoiceOver Magic Tap = +1 (design-spec:88); zablokowany → bez naPlus', async () => {
  const w = wywolaniaLicznika();
  const { toJSON, unmount } = render(<Licznik stan={stanLicznika()} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...w} />);
  const korzen = toJSON() as { props: { onMagicTap?: () => void } };
  expect(typeof korzen.props.onMagicTap).toBe('function');
  await act(async () => { korzen.props.onMagicTap?.(); });
  expect(w.naPlus).toHaveBeenCalledTimes(1);
  unmount();
  const z = wywolaniaLicznika();
  const r = render(<Licznik stan={stanLicznika({ zablokowany: true })} t={t} oglos={jest.fn()} haptyka={atrapaHaptyki()} {...z} />);
  await act(async () => { (r.toJSON() as { props: { onMagicTap?: () => void } }).props.onMagicTap?.(); });
  expect(z.naPlus).not.toHaveBeenCalled();
});
