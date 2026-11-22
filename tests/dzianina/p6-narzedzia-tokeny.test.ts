// M3 p6 (redesign „Dzianina”): ekrany zakładki Narzędzia czytają tokeny Dzianiny, a nie stare nazwy ról z aliasów `motyw.ts` (alias znika, gdy ostatnia
// partia przejdzie na nowe nazwy; docs/design/dzianina/mapa-tokenow.md). Test czyta źródło — ma paść, dopóki któryś plik partii używa starej nazwy.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const KORZEN = join(__dirname, '..', '..');
const PLIKI = [
  'src/ekrany/Narzedzia.tsx', 'src/ekrany/Zapas.tsx', 'src/ekrany/Miary.tsx',
  'app/(zakladki)/narzedzia.tsx', 'app/zapas.tsx', 'app/druty.tsx', 'app/drut.tsx', 'app/probka.tsx', 'app/miary.tsx', 'app/wloczka.tsx',
];
// Stare nazwy z aliasów `motyw.ts` (zgodnosc(), odstep.sekcja, promien/cel/typografia) → token Dzianiny w komentarzu.
const STARE: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bk\.papier\b/, 'k.tlo'], [/\bk\.papierGrupa\b/, 'k.powierzchnia'], [/\bk\.arkusz\b/, 'k.powierzchnia'],
  [/\bk\.grafit\b/, 'k.tekst'], [/\bk\.olowek\b/, 'k.tekst2'], [/\bk\.kreska\b/, 'k.tekst'],
  [/\bk\.(przyciskTlo|przyciskObrys)\b/, 'k.przycisk'], [/\bk\.drugiPrzyciskObrys\b/, 'k.tekst2'], [/\bk\.blad\b/, 'k.niszczacy / k.tekst'],
  [/\bk\.przyciskNieaktywnyTlo\b/, 'k.przyciskNieaktywny'], [/\bk\.przyciskNiszczacyTlo\b/, 'k.niszczacy'], [/\bk\.przyciskNiszczacyTekst\b/, 'k.niszczacyTekst'],
  [/\bodstep\.sekcja\b/, 'odstep.xxl'],
  [/\bpromien\.(grupa|przyciskGlowny|przyciskPelny|przyciskDrugi|poleWyboru|zakreslacz)\b/, 'promien.lista / plusLicznik / przycisk / plus'],
  [/\bcel\.(przyciskMinus|przyciskMinusPaska|poleWyboru|przyciskPlus\w*)\b/, 'cel.minus / cel.minimum / cel.paskaWzoru'],
  [/\btypografia\.(tytul|podpis|drobny|liczba\w*|instrukcja|przycisk\w*|znakWyboru)\b/, 'typografiaDzianiny.duzyTytul / tresc2 / mala / …'],
];

describe('M3 p6: Narzędzia, zapas, druty, próbka, miary, włóczka — tokeny Dzianiny zamiast starych nazw', () => {
  test.each(PLIKI)('%s: bez starych nazw ról', (plik) => {
    const zrodlo = readFileSync(join(KORZEN, plik), 'utf8');
    const trafienia = STARE.flatMap(([wzor, nowy]) => {
      const m = zrodlo.match(new RegExp(wzor.source, 'g'));
      return m ? [`${[...new Set(m)].join(', ')} → ${nowy}`] : [];
    });
    expect(trafienia).toEqual([]);
  });
});
