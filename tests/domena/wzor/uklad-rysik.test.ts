// Układ według szerokości okna (P-220 W1a, W3, W4b, G1; ADR-0026; P-218 Q3a) i polityka rysika (P-218 Q2a, ADR-0012; P-225, P-226: logika
// `pencilOnly` jako czysta funkcja zamiast testu z prawdziwym rysikiem). Wyrocznie: design-spec „Wzór, rysik i iPad” (wymiary makiet: telefon
// 320/390 × wysokość, poziomo 844 × 390, iPad 820 × 1180, 1180 × 820, wąskie okno 375 × 1180; kolumna treści iPada maks. 640 pt; kolumna licznika
// poziomo 34 % w granicach 220–360 pt, na iPadzie 340 pt), moduly.md „iPad i orientacja” (układ według szerokości okna, nie orientacji).
import { KOLUMNA_TRESCI_MAKS, ukladOkna } from '../../../src/domena/uklad';
import { narzedzieDlaKlasy, narzedzieRysika, politykaPlotna, poDotyku, poPierwszymRysiku } from '../../../src/domena/rysik';

describe('ukladOkna', () => {
  test.each([
    ['iPhone pionowo 390 × 844', 390, 844, { klasa: 'compact', wzor: 'pasek', kolumnaLicznika: null, tresc: 390 }],
    ['iPhone SE pionowo 320 × 568', 320, 568, { klasa: 'compact', wzor: 'pasek', kolumnaLicznika: null, tresc: 320 }],
    ['iPhone poziomo 844 × 390 (W3: 34 %)', 844, 390, { klasa: 'compact', wzor: 'obok', kolumnaLicznika: 287, tresc: 844 }],
    ['iPhone SE poziomo 568 × 320 (W3: min. 220)', 568, 320, { klasa: 'compact', wzor: 'obok', kolumnaLicznika: 220, tresc: 568 }],
    ['duży iPhone poziomo 956 × 440 (W3: maks. 360)', 1100, 440, { klasa: 'compact', wzor: 'obok', kolumnaLicznika: 360, tresc: 1100 }],
    ['iPad pionowo 820 × 1180 (W4b: wzór na szerokość, pasek)', 820, 1180, { klasa: 'regular', wzor: 'pasek', kolumnaLicznika: null, tresc: KOLUMNA_TRESCI_MAKS }],
    ['iPad poziomo 1180 × 820 (W4b: zawsze obok, 340)', 1180, 820, { klasa: 'regular', wzor: 'obok', kolumnaLicznika: 340, tresc: KOLUMNA_TRESCI_MAKS }],
    ['iPad wąskie okno 375 × 1180 (układ telefonu)', 375, 1180, { klasa: 'compact', wzor: 'pasek', kolumnaLicznika: null, tresc: 375 }],
    ['iPad pół ekranu 590 × 820', 590, 820, { klasa: 'compact', wzor: 'pasek', kolumnaLicznika: null, tresc: 590 }],
    ['iPad Split View 2/3 w poziomie 778 × 820', 778, 820, { klasa: 'regular', wzor: 'pasek', kolumnaLicznika: null, tresc: KOLUMNA_TRESCI_MAKS }],
  ] as const)('%s', (_n, szerokosc, wysokosc, oczekiwany) => {
    expect(ukladOkna({ szerokosc, wysokosc })).toEqual(oczekiwany);
  });
  test('kolumna treści nigdy szersza niż okno; wymiary nieskończone/zerowe → bezpieczny układ telefonu', () => {
    expect(ukladOkna({ szerokosc: 0, wysokosc: 0 })).toEqual({ klasa: 'compact', wzor: 'pasek', kolumnaLicznika: null, tresc: 0 });
    expect(ukladOkna({ szerokosc: Number.NaN, wysokosc: 800 }).klasa).toBe('compact');
  });
});

describe('rysik: pencilOnly po pierwszym dotknięciu (P-218 Q2a)', () => {
  test('bez narzędzia płótno wyłączone: palec przewija, nic się nie rysuje (BR-WZR-008 S3)', () => {
    expect(politykaPlotna({ narzedzie: 'brak', tylkoRysik: false })).toBe('wylaczone');
    expect(politykaPlotna({ narzedzie: 'brak', tylkoRysik: true })).toBe('wylaczone');
  });
  test('iPad bez rysika jak iPhone: wybrane narzędzie → palec rysuje (anyInput; BR-WZR-008 S4)', () => {
    for (const n of ['zakreslacz', 'pioro', 'gumka'] as const) expect(politykaPlotna({ narzedzie: n, tylkoRysik: false })).toBe('dowolne');
  });
  test('po pierwszym rysiku: rysuje tylko rysik, palec przewija (pencilOnly; BR-WZR-004)', () => {
    expect(politykaPlotna({ narzedzie: 'zakreslacz', tylkoRysik: true })).toBe('tylkoRysik');
  });
  test('przejścia: dotyk palcem nic nie zmienia, rysik włącza tylkoRysik na stałe w tym ekranie, nowe otwarcie wzoru zaczyna od nowa', () => {
    let s = poDotyku({ tylkoRysik: false }, 'palec');
    expect(s).toEqual({ tylkoRysik: false });
    s = poDotyku(s, 'rysik');
    expect(s).toEqual({ tylkoRysik: true });
    expect(poDotyku(s, 'palec')).toEqual({ tylkoRysik: true });
    expect(poDotyku(s, 'otwarcie')).toEqual({ tylkoRysik: false });
  });
});

describe('07-jakosc-026 (F-28, P-327 (a), BR-WZR-004 S2): pierwsze dotknięcie rysikiem bez wybranego narzędzia wybiera Pen', () => {
  test('bez narzędzia: Pen i od razu pencilOnly — rysik pisze (płótno nie jest wyłączone), palec przewija', () => {
    const po = poPierwszymRysiku({ narzedzie: 'brak', tylkoRysik: false }, 'regular');
    expect(po).toEqual({ narzedzie: 'pioro', tylkoRysik: true });
    expect(politykaPlotna(po)).toBe('tylkoRysik');
  });
  test('z wybranym narzędziem zostaje ono (zakreślacz, gumka, pióro); tylkoRysik włącza się', () => {
    for (const n of ['zakreslacz', 'pioro', 'gumka'] as const) expect(poPierwszymRysiku({ narzedzie: n, tylkoRysik: false }, 'regular')).toEqual({ narzedzie: n, tylkoRysik: true });
  });
  test('tylko pierwszy raz: po odznaczeniu narzędzia przez użytkownika kolejne zgłoszenie rysika go nie wybiera na nowo', () => {
    const odznaczone = { narzedzie: 'brak' as const, tylkoRysik: true };
    expect(poPierwszymRysiku(odznaczone, 'regular')).toEqual(odznaczone);
    expect(poPierwszymRysiku(odznaczone, 'compact')).toEqual(odznaczone);
    expect(politykaPlotna(odznaczone)).toBe('wylaczone'); // rysik też nic nie rysuje, dopóki nie wybierze narzędzia (BR-WZR-008 S3)
  });
});

// P2-9 (Aneks P2 poz. 3, pozycja 10 C, P-360): w oknie iPada compact pasek ma jedno narzędzie rysujące — Highlighter; Pen jest tylko w regular.
describe('P2-9 / P-360 (10 C): iPad compact — pierwszy rysik wybiera Highlighter, zmiana szerokości z Pen → Highlighter', () => {
  test('pierwszy rysik bez narzędzia: compact → Highlighter i pencilOnly od razu; regular → Pen (P-327 (a) bez zmian)', () => {
    const compact = poPierwszymRysiku({ narzedzie: 'brak', tylkoRysik: false }, 'compact');
    expect(compact).toEqual({ narzedzie: 'zakreslacz', tylkoRysik: true });
    expect(politykaPlotna(compact)).toBe('tylkoRysik');
    expect(poPierwszymRysiku({ narzedzie: 'brak', tylkoRysik: false }, 'regular')).toEqual({ narzedzie: 'pioro', tylkoRysik: true });
  });
  test('z wybranym narzędziem w compact zostaje ono (Highlighter, gumka); tylko jednorazowo', () => {
    for (const n of ['zakreslacz', 'gumka'] as const) expect(poPierwszymRysiku({ narzedzie: n, tylkoRysik: false }, 'compact')).toEqual({ narzedzie: n, tylkoRysik: true });
  });
  test('narzedzieRysika: narzędzie, które natywny widok wybiera przy pierwszym rysiku — wspólne z poPierwszymRysiku', () => {
    expect(narzedzieRysika('compact')).toBe('zakreslacz');
    expect(narzedzieRysika('regular')).toBe('pioro');
    for (const klasa of ['compact', 'regular'] as const) expect(poPierwszymRysiku({ narzedzie: 'brak', tylkoRysik: false }, klasa).narzedzie).toBe(narzedzieRysika(klasa));
  });
  test('zmiana szerokości: wybrany Pen przechodzi w Highlighter tylko do compact; compact → regular zostawia Highlighter; reszta bez zmian', () => {
    expect(narzedzieDlaKlasy('pioro', 'compact')).toBe('zakreslacz');
    expect(narzedzieDlaKlasy('pioro', 'regular')).toBe('pioro');
    expect(narzedzieDlaKlasy('zakreslacz', 'regular')).toBe('zakreslacz');
    expect(narzedzieDlaKlasy('zakreslacz', 'compact')).toBe('zakreslacz');
    for (const klasa of ['compact', 'regular'] as const) for (const n of ['brak', 'gumka'] as const) expect(narzedzieDlaKlasy(n, klasa)).toBe(n);
  });
});
