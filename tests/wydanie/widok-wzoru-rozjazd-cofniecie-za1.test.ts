// ZA1 (PU-008, KO-243/KO-244; P-1138): po „zakreśl A, B → cofnij → zakreśl B ponownie” etykieta mówiła „3 highlights” przy 2 widocznych pasach (DG4, `docs/jakosc/dg4-e2e.md`, 6 z 6 podejść,
// kod wzoru bez zmian od 9aa5ee44). Liczenie kresek i cofanie żyją w widoku natywnym (WidokWzoru.swift), a Swift nie kompiluje się w Linuksie (jak 10-wydanie-019, widok-wzoru-odswiezenie-plotna.test.ts):
// test statyczny pilnuje kształtu poprawki. Poprawka stoi na hipotezie ≈ 30% (płótno PencilKit po `drawing = rys` kodem zachowuje cofniętą kreskę, następne pociągnięcie wraca do danych razem z nią);
// dowód (czy defekt znika, a rozjazd jest widoczny w panelu `e2e-wzor-rozjazdy`) dopiero z przebiegu e2e cz. 4 iPhone.
// Reguła: bez rozjazdu zachowanie bez zmian — przypisanie płótna i zmiana danych tylko w gałęzi rozjazdu.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const swift = readFileSync(join(__dirname, '../../modules/oczko-wzor/ios/WidokWzoru.swift'), 'utf8');
const indeks = readFileSync(join(__dirname, '../../modules/oczko-wzor/index.ts'), 'utf8');

/** Ciało funkcji Swift (od nagłówka do zamykającej klamry na wcięciu 2 spacji). Brak funkcji = pusty napis. */
function cialo(naglowek: RegExp): string {
  const m = naglowek.exec(swift);
  if (!m) return '';
  const od = m.index + m[0].length;
  const koniec = swift.indexOf('\n  }\n', od);
  return koniec < 0 ? '' : swift.slice(od, koniec);
}

describe('ZA1 (PU-008): rozjazd płótna z danymi po cofnięciu jest wykrywany, zgłaszany i naprawiany tylko przy rozjeździe', () => {
  const cofnijDo = cialo(/func cofnijDo\(_ n: Int\) \{/);
  const sprawdz = cialo(/private func sprawdzPlotnoPoCofnieciu\(_ s: Int, proba: Int\) \{/);
  const zmiana = cialo(/func canvasViewDrawingDidChange\(_ c: PKCanvasView\) \{/);
  const naprawa = cialo(/private func naprawPlotna\(_ s: Int, proba: Int\) \{/);
  const zgloszenie = cialo(/private func zglosZakreslenia\(\) \{/);

  test('cofnięcie planuje sprawdzenie płótna strony po zmianie danych i zapisu (w następnym obiegu pętli)', () => {
    expect(cofnijDo).toMatch(/sprawdzPlotnoPoCofnieciu\(s, proba: 0\)/);
    expect(cofnijDo.indexOf('rysunki[s] = rys')).toBeLessThan(cofnijDo.indexOf('sprawdzPlotnoPoCofnieciu'));
    expect(sprawdz).toMatch(/DispatchQueue\.main\.asyncAfter/);
  });

  test('sprawdzenie po cofnięciu: przypisanie płótnu `rysunki[s]` (zKodu) tylko w gałęzi „liczba kresek płótna ≠ danych” i nie w trakcie pociągnięcia', () => {
    expect(sprawdz).toMatch(/wUzyciu\.contains\(s\)/);
    const warunek = sprawdz.search(/k\.plotno\.drawing\.strokes\.count != r\.strokes\.count/);
    const zglos = sprawdz.indexOf('zglosRozjazd(');
    const zKoduOn = sprawdz.indexOf('zKodu = true');
    const przypisanie = sprawdz.search(/k\.plotno\.drawing = r\b/);
    const zKoduOff = sprawdz.indexOf('zKodu = false');
    expect([warunek, zglos, zKoduOn, przypisanie, zKoduOff].every((n) => n >= 0)).toBe(true);
    expect(warunek).toBeLessThan(zglos);
    expect(zglos).toBeLessThan(zKoduOn);
    expect(zKoduOn).toBeLessThan(przypisanie);
    expect(przypisanie).toBeLessThan(zKoduOff);
    expect(sprawdz.slice(0, warunek)).not.toMatch(/k\.plotno\.drawing = /); // przed warunkiem żadnego przypisania
  });

  test('nowe pociągnięcie: więcej niż jedna nowa kreska w jednym zdarzeniu → dane = stare kreski + ostatnia, rozjazd zgłoszony, płótno naprawione; historia dostaje stan sprzed pociągnięcia', () => {
    const historia = zmiana.search(/historia\[s, default: \[\]\]\.append\(poprzednie\)/);
    const warunek = zmiana.search(/c\.drawing\.strokes\.count > poprzednie\.strokes\.count \+ 1/);
    const zgl = zmiana.indexOf('zglosRozjazd(');
    const dane = zmiana.search(/rysunki\[s\] = PKDrawing\(strokes: poprzednie\.strokes \+ \[ostatnia\]\)/);
    const napraw = zmiana.search(/naprawPlotna\(s, proba: 0\)/);
    const zwykle = zmiana.indexOf('rysunki[s] = c.drawing');
    expect([historia, warunek, zgl, dane, napraw, zwykle].every((n) => n >= 0)).toBe(true);
    expect(historia).toBeLessThan(warunek); // historia dostaje stan sprzed pociągnięcia w obu gałęziach
    expect(warunek).toBeLessThan(zgl);
    expect(zgl).toBeLessThan(dane);
    expect(dane).toBeLessThan(napraw);
    expect(napraw).toBeLessThan(zwykle); // gałąź zwykła (`else`) = zachowanie sprzed ZA1: dane = c.drawing
    expect(zmiana.slice(napraw, zwykle)).toMatch(/\}\s*else\s*\{/);
    expect(zmiana.indexOf('takieSame(poprzedni, c.drawing)')).toBeLessThan(historia); // echo przypisania kodem nadal przed historią (019)
  });

  test('naprawa płótna: poza pociągnięciem (strona w użyciu czeka krótko, z limitem prób), przypisanie bez zdarzenia zmiany (zKodu)', () => {
    expect(naprawa).toMatch(/wUzyciu\.contains\(s\)/);
    expect(naprawa).toMatch(/proba < 5/);
    const on = naprawa.indexOf('zKodu = true');
    const przypisanie = naprawa.search(/k\.plotno\.drawing = r\b/);
    const off = naprawa.indexOf('zKodu = false');
    expect(on).toBeLessThan(przypisanie);
    expect(przypisanie).toBeLessThan(off);
  });

  test('zdarzenie diagnostyczne: licznik rozjazdów i opis ostatniego idą z `onZakreslenia`, liczba kresek bez zmiany', () => {
    expect(zgloszenie).toMatch(/onZakreslenia\(\["liczba": n, "rozjazdy": rozjazdy, "ostatni": ostatniRozjazd\]\)/);
    expect(zgloszenie).toMatch(/\.filter \{ \$0\.ink\.inkType == \.marker \}\.count/);
    expect(swift).toMatch(/private var rozjazdy = 0/);
    expect(cialo(/private func zglosRozjazd\(_ opis: String\) \{/)).toMatch(/rozjazdy \+= 1/);
    expect(indeks).toMatch(/onZakreslenia\?: \(e: NativeSyntheticEvent<\{ liczba: number; rozjazdy\?: number; ostatni\?: string \}>\)/);
  });
});
