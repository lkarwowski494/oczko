// 10-wydanie-019 (sesja AO, 2026-11-11, KO-044; P-748): pociągnięcie narysowane na żywo jest w danych (licznik „2 highlights”), ale nie ma go na ekranie,
// gdy płótno strony ma już rysunek wczytany z pliku. Dowód z artefaktów: `zrzuty-sklepu.yml` 43035080611 i 43090241469 (kadr 04: „2 highlights”, widoczny
// tylko pas fikstury; także iPhone bez obrotu) wobec „Jakość · iOS” 42899408194 (scen. 47: ten sam swipe na pustym płótnie widoczny na zrzucie).
// Kreski przypisane płótnu kodem (wczytanie nakładki, `WidokWzoru.swift` pdfView(_:overlayViewFor:)) wyświetlają się zawsze, więc po każdej zmianie
// rysunku przez użytkownika widok przypisuje wyświetlanemu płótnu strony rysunek z danych (`rysunki[s]`) — tą samą ścieżką, w następnym obiegu pętli
// i nie w trakcie pociągnięcia (rysik pisze szybko po sobie: przypisanie w trakcie przerwałoby kreskę).
// Test statyczny (Swift nie kompiluje się w Linuksie, jak widok-wzoru-kontrakt.test.ts): pilnuje kształtu poprawki; widoczność pociągnięcia sprawdza
// kontrola pikseli P-745 w jobie „komplet” workflowu zrzutów (04 ma więcej pasów niż 03) — czerwona na kodzie sprzed poprawki (przebieg 43090241469).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const swift = readFileSync(join(__dirname, '../../modules/oczko-wzor/ios/WidokWzoru.swift'), 'utf8');

/** Ciało funkcji Swift (od nagłówka do zamykającej klamry na wcięciu 2 spacji). Brak funkcji = pusty napis. */
function cialo(naglowek: RegExp): string {
  const m = naglowek.exec(swift);
  if (!m) return '';
  const od = m.index + m[0].length;
  const koniec = swift.indexOf('\n  }\n', od);
  return koniec < 0 ? '' : swift.slice(od, koniec);
}

describe('10-wydanie-019 (AO): pociągnięcie użytkownika widoczne na płótnie z rysunkiem wczytanym z pliku', () => {
  const zmiana = cialo(/func canvasViewDrawingDidChange\(_ c: PKCanvasView\) \{/);
  const odswiez = cialo(/private func odswiezPlotna\(\) \{/);

  test('po zapisie zmiany do danych (`rysunki[s] = c.drawing`) widok planuje odświeżenie płótna tej strony', () => {
    const dane = zmiana.indexOf('rysunki[s] = c.drawing');
    const plan = zmiana.search(/zaplanujOdswiezenie\(s\)/);
    expect([dane >= 0, plan >= 0]).toEqual([true, true]);
    expect(plan).toBeGreaterThan(dane);
  });

  test('odświeżenie: w następnym obiegu pętli przypisuje wyświetlanemu płótnu strony rysunek z danych, bez zdarzenia zmiany (zKodu)', () => {
    const planowanie = cialo(/private func zaplanujOdswiezenie\(_ s: Int\) \{/);
    expect(planowanie).toMatch(/DispatchQueue\.main\.async/);
    expect(planowanie).toMatch(/odswiezPlotna\(\)/);
    const zKodu = odswiez.indexOf('zKodu = true');
    const przypisanie = odswiez.search(/k\.plotno\.drawing = r\b/);
    const koniecZKodu = odswiez.indexOf('zKodu = false');
    expect([zKodu >= 0, przypisanie >= 0, koniecZKodu >= 0]).toEqual([true, true, true]);
    expect(zKodu).toBeLessThan(przypisanie);
    expect(przypisanie).toBeLessThan(koniecZKodu);
    expect(odswiez).toMatch(/nakladki\[s\]/); // płótno wyświetlanej nakładki strony, nie to, które zgłosiło zmianę
    expect(odswiez).toMatch(/rysunki\[s\]/);
  });

  test('w trakcie pociągnięcia nie przypisuje (strona w użyciu czeka do końca narzędzia)', () => {
    expect(odswiez).toMatch(/wUzyciu\.contains\(s\)/);
    const poczatek = cialo(/func canvasViewDidBeginUsingTool\(_ c: PKCanvasView\) \{/);
    const koniec = cialo(/func canvasViewDidEndUsingTool\(_ c: PKCanvasView\) \{/);
    expect(poczatek).toMatch(/wUzyciu\.insert\(c\.tag\)/);
    expect(koniec).toMatch(/wUzyciu\.remove\(c\.tag\)/);
    // Przegląd AO (P0, pewność ~35%): koniec narzędzia może przyjść przed zatwierdzeniem kreski w c.drawing — planuje więc tylko stronę, która już czeka
    // (zmiana jest w danych), nigdy nowej.
    expect(koniec).toMatch(/if doOdswiezenia\.contains\(c\.tag\) \{ zaplanujOdswiezenie\(c\.tag\) \}/);
  });

  test('przegląd AO (P0): przypisanie tylko, gdy płótno ma te same kreski co dane — nigdy nie nadpisuje płótna z kreską nowszą niż dane', () => {
    const straz = odswiez.search(/takieSame\(k\.plotno\.drawing, r\)/);
    const przypisanie = odswiez.search(/k\.plotno\.drawing = r\b/);
    expect([straz >= 0, przypisanie >= 0]).toEqual([true, true]);
    expect(straz).toBeLessThan(przypisanie);
  });

  test('przegląd AO (P1): koniec wyświetlania nakładki zdejmuje stronę z „w użyciu” i z oczekujących (przerwane pociągnięcie nie blokuje odświeżania na zawsze)', () => {
    const koniecNakladki = cialo(/func pdfView\(_ v: PDFView, willEndDisplayingOverlayView o: UIView, for page: PDFPage\) \{/);
    expect(koniecNakladki).toMatch(/wUzyciu\.remove\(s\)/);
    expect(koniecNakladki).toMatch(/doOdswiezenia\.remove\(s\)/);
  });

  test('zgłoszenie zmiany bez zmiany kresek (echo przypisania kodem, gdyby PencilKit zgłosił je poza zKodu) nie trafia do historii ani do odświeżenia — bez pętli', () => {
    const echo = zmiana.search(/if let poprzedni = rysunki\[s\], takieSame\(poprzedni, c\.drawing\) \{ return \}/);
    const historia = zmiana.indexOf('historia[s, default: []].append');
    expect([echo >= 0, historia >= 0]).toEqual([true, true]);
    expect(echo).toBeLessThan(historia);
    const porownanie = cialo(/private func takieSame\(_ a: PKDrawing, _ b: PKDrawing\) -> Bool \{/);
    expect(porownanie).toMatch(/strokes\.count/);
    expect(porownanie).toMatch(/bounds/);
  });

  test('zmiana dokumentu czyści strony czekające na odświeżenie i strony w użyciu (nie przenoszą się na inny wzór)', () => {
    expect(swift).toMatch(/nakladki = \[:\]; rysunki = \[:\]; historia = \[:\]; doZapisu = \[\]; doOdswiezenia = \[\]; wUzyciu = \[\]/);
  });
});

// KO-044 (koordynator, 2026-11-11): przypadek w E2E „Jakość · iOS” — wzór z zakreśleniem wczytanym z pliku (po restarcie) + nowe pociągnięcie.
// Maestro nie ma asercji widoczności kreski (brak testID na pociągnięcie), a kontrola pikseli w tym workflow wymagałaby zmiany workflowu (zakaz sesji AO):
// asercja licznika 2 + zrzut po odczekaniu (H5: kreska znikająca po czasie) do obejrzenia w artefakcie e2e-czesc-*-ipad.
describe('10-wydanie-019 (AO): scen. 47 rysuje drugie pociągnięcie na wzorze wczytanym po restarcie', () => {
  const s47 = readFileSync(join(__dirname, '../../e2e/scenariusze/47-br-wzr-008-s4-ipad-bez-rysika.yaml'), 'utf8')
    .split('\n').filter((l) => !l.trimStart().startsWith('#'));
  const i = (re: RegExp, od = 0) => s47.findIndex((l, n) => n >= od && re.test(l));
  test('po restarcie i asercji „1 highlight”: zakreślacz, swipe na innej wysokości, „2 highlights”, odczekanie i zrzut', () => {
    const restart = i(/subflows\/restart\.yaml/);
    const jeden = i(/wzor-zakreslenia.*"1 highlight"/, restart);
    const narzedzie = i(/tapOn:.*wzor-zakreslacz/, jeden);
    const swipe = i(/swipe:.*"30%, 55%".*"70%, 55%"/, narzedzie);
    const dwa = i(/wzor-zakreslenia.*"2 highlights"/, swipe);
    const czekaj = i(/waitForAnimationToEnd/, dwa);
    const zrzut = i(/takeScreenshot:\s*47-ipad-drugie-zakreslenie/, czekaj);
    expect([restart, jeden, narzedzie, swipe, dwa, czekaj, zrzut].every((n) => n >= 0)).toBe(true);
    expect(restart < jeden && jeden < narzedzie && narzedzie < swipe && swipe < dwa && dwa < czekaj && czekaj < zrzut).toBe(true);
  });
});

// AQ (2026-11-12, KO-046; recenzja AP, P2, pewność średnia): `canvasViewDidEndUsingTool` ponownie planuje odświeżenie strony, która „już czeka” (`doOdswiezenia`). Przy dwóch szybkich
// pociągnięciach wpis po pierwszym może przeżyć do końca drugiego (odświeżenie pominięte, bo `wUzyciu` zawiera stronę), a płótno przypisane z `rysunki[s]` zanim drugie pociągnięcie
// trafi do `c.drawing` mogłoby je zgubić. Dokumentacja Apple nie podaje kolejności ani opóźnienia callbacków (EndUsingTool vs DrawingDidChange; odczyt 12.11.2026,
// developer.apple.com/tutorials/data/documentation/pencilkit/pkcanvasviewdelegate/…), a Swift nie kompiluje się w Linuksie, więc defektu nie da się potwierdzić kodem: zamiast zmiany
// logiki ręcznie bez możliwości uruchomienia — tani wykrywacz w E2E: dwa swipe'y jeden po drugim BEZ czekania, licznik zgodny z liczbą pociągnięć i zrzut do obejrzenia.
describe('10-wydanie-019 (AQ, P2): scen. 47 rysuje dwa szybkie pociągnięcia jedno po drugim na wzorze z zakreśleniami', () => {
  const s47 = readFileSync(join(__dirname, '../../e2e/scenariusze/47-br-wzr-008-s4-ipad-bez-rysika.yaml'), 'utf8')
    .split('\n').filter((l) => !l.trimStart().startsWith('#'));
  const i = (re: RegExp, od = 0) => s47.findIndex((l, n) => n >= od && re.test(l));
  test('po zrzucie drugiego zakreślenia: dwa swipe\'y jeden po drugim (między nimi tylko szybka asercja narzędzia, bez czekania), „4 highlights” (1 z pliku + 1 + 2 szybkie), odczekanie i zrzut', () => {
    const poprzedni = i(/takeScreenshot:\s*47-ipad-drugie-zakreslenie/);
    const a = i(/swipe:.*"30%, 62%".*"70%, 62%"/, poprzedni);
    const b = i(/swipe:.*"30%, 68%".*"70%, 68%"/, poprzedni);
    expect([poprzedni, a, b].every((n) => n >= 0)).toBe(true);
    expect(s47.slice(a + 1, b)).toEqual([expect.stringMatching(/assertVisible:.*wzor-zakreslacz.*selected: true/)]); // reguła §3.8: asercja po swipe; żadnego czekania ani drugiego kroku między pociągnięciami
    expect(s47.slice(a, b).join('\n')).not.toMatch(/waitFor|extendedWait|sleep/i);
    const cztery = i(/wzor-zakreslenia.*"4 highlights"/, b);
    const czekaj = i(/waitForAnimationToEnd/, cztery);
    const zrzut = i(/takeScreenshot:\s*47-ipad-szybkie-zakreslenia/, czekaj);
    expect([cztery, czekaj, zrzut].every((n) => n >= 0)).toBe(true);
    expect(b < cztery && cztery < czekaj && czekaj < zrzut).toBe(true);
  });
  test('Swift bez zmiany logiki odświeżania w AQ: nadal tylko strona, która już czeka (sekcja AQ w docs/programista/zrzuty-018-019-an.md)', () => {
    expect(cialo(/func canvasViewDidEndUsingTool\(_ c: PKCanvasView\) \{/)).toMatch(/if doOdswiezenia\.contains\(c\.tag\) \{ zaplanujOdswiezenie\(c\.tag\) \}/);
  });
});
