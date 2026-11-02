// E2-A5 (W1-A, P-282 wariant A) i E2-A3 (08 poprawki E2, sesja C): kontrakt Swift konwersji Word → PDF sprawdzany statycznie, bo Swift nie kompiluje się w Linuksie.
// Kompilację i `swift test` (Pakiet OczkoWzorLogika, TestyOknaMaszyn) sprawdza przebieg macOS (`jakosc-ios.yml`); tu pilnujemy, żeby zaślepka nie wróciła
// i żeby przycinanie końcowych pustych stron oraz osobny powód przekroczenia czasu były podłączone w jedynym miejscu konwersji.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const KORZEN = join(__dirname, '../..');
const czytaj = (p: string): string => readFileSync(join(KORZEN, p), 'utf8');
const konwersja = czytaj('modules/oczko-wzor/ios/KonwersjaNaPdf.swift');
const sprawdzenie = czytaj('modules/oczko-wzor/ios/SprawdzeniePdf.swift');
const testyMaszyn = czytaj('modules/oczko-wzor/TestyOknaMaszyn/Testy/EksperymentyTests.swift');

/** Ciało funkcji od jej sygnatury do pierwszej linii zaczynającej się dwiema spacjami i `}` (koniec funkcji w rozszerzeniu enum). */
function cialo(zrodlo: string, sygnatura: string): string {
  const od = zrodlo.indexOf(sygnatura);
  if (od < 0) return '';
  const reszta = zrodlo.slice(od);
  const koniec = reszta.search(/\n {2}\}\n/);
  return koniec < 0 ? reszta : reszta.slice(0, koniec);
}

describe('E2-A5: przycinanie końcowych pustych stron po konwersji Word', () => {
  const funkcja = cialo(sprawdzenie, 'static func bezPustychStronNaKoncu');

  test('bezPustychStronNaKoncu nie jest zaślepką: usuwa strony i zapisuje plik', () => {
    expect(funkcja).not.toBe('');
    expect(sprawdzenie).not.toMatch(/ZAŚLEPKA \(W1/);
    expect(funkcja).toMatch(/removePage\(at:/);
    expect(funkcja).toMatch(/\.write\(to:/);
  });
  test('nigdy do zera stron: pętla przycinania zatrzymuje się na pierwszej stronie', () => {
    expect(funkcja).toMatch(/while\s+\w+\s*>\s*1\b/);
  });
  test('pusta strona = bez tekstu i jednolicie biała miniatura (strona z obrazem albo tekstem zostaje)', () => {
    const pusta = cialo(sprawdzenie, 'static func stronaPusta');
    expect(pusta).toMatch(/\.string/);
    expect(pusta).toMatch(/jednolicieBiala\(/);
  });
  test('Konwersja.naPdf: tylko wynik Worda jest przycinany, przed sprawdzeniem PDF (liczba stron z przyciętego pliku)', () => {
    const naPdf = cialo(konwersja, '@MainActor static func naPdf');
    const word = naPdf.slice(naPdf.indexOf('case let .word'), naPdf.indexOf('case let .obrazy'));
    expect(word).toMatch(/bezPustychStronNaKoncu\(/);
    expect(naPdf.slice(naPdf.indexOf('case let .adres'), naPdf.indexOf('case let .word'))).not.toMatch(/bezPustychStronNaKoncu/);
    expect(naPdf.slice(naPdf.indexOf('case let .obrazy'))).not.toMatch(/bezPustychStronNaKoncu/);
    expect(naPdf.indexOf('bezPustychStronNaKoncu(')).toBeGreaterThan(0);
    expect(naPdf.indexOf('bezPustychStronNaKoncu(')).toBeLessThan(naPdf.indexOf('SprawdzeniePdf.sprawdz('));
  });
  test('test okna maszyn nie ma już oczekiwanej porażki i zachowuje wszystkie asercje przycinania', () => {
    expect(testyMaszyn).not.toMatch(/XCTExpectFailure/);
    const t = cialo(testyMaszyn, 'func testW1PustaStronaNaKoncu');
    expect(t).not.toBe('');
    expect((t.match(/XCTAssertEqual\(SprawdzeniePdf\.bezPustychStronNaKoncu\(/g) ?? []).length).toBe(4);
    expect(t).toMatch(/XCTAssertEqual\(PDFDocument\(url: u\)\?\.pageCount, 1\)/);
  });
});
