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
    expect(koniec).toMatch(/zaplanujOdswiezenie\(c\.tag\)/);
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
