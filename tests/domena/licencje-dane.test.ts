// M1-245 (P-661, kryterium 3): moduł wygenerowany src/domena/licencje.generated.ts wchodzi do paczki JS aplikacji i zawiera pełny tekst OFL kroju Bree Serif
// (dowód, że licencja jest w pakiecie, nie tylko w assets/ czytanym przez testy). Generator i jego kontrola: tests/jakosc/licencje-generuj.test.ts.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { KROJE, NATYWNE_IOS, PAKIETY_NPM, TEKSTY_LICENCJI } from '../../src/domena/licencje.generated';

const KORZEN = join(__dirname, '../..');
const normalizuj = (s: string) => s.replace(/\s+/g, ' ').trim();

describe('moduł wygenerowany w paczce aplikacji', () => {
  test('Bree Serif: pełny tekst assets/fonts/breeserif-OFL.txt (po normalizacji białych znaków) i nota o prawach autorskich w pierwszym wierszu', () => {
    const plik = readFileSync(join(KORZEN, 'assets/fonts/breeserif-OFL.txt'), 'utf8');
    const k = KROJE.find((x) => x.id === 'bree-serif');
    expect(k?.spdx).toBe('OFL-1.1');
    expect(normalizuj(k?.tekst ?? '')).toBe(normalizuj(plik));
    expect(k?.nota).toMatch(/^Copyright \(c\) 2011, TypeTogether/);
    expect(normalizuj(k?.tekst ?? '')).toContain('SIL OPEN FONT LICENSE Version 1.1');
  });
  test('pakiety npm, biblioteki natywne i treści licencji niepuste; react-native i MIT obecne; pakiety zależne od platformy pominięte', () => {
    expect(PAKIETY_NPM.length).toBeGreaterThan(300);
    expect(PAKIETY_NPM.some((r) => r[0] === 'react-native')).toBe(true);
    expect(PAKIETY_NPM.some((r) => /^(fsevents|lightningcss-)/.test(r[0]))).toBe(false);
    expect(NATYWNE_IOS.map((r) => r[0])).toEqual(expect.arrayContaining(['folly', 'glog', 'boost', 'SocketRocket']));
    expect(TEKSTY_LICENCJI.MIT?.tekst.length).toBeGreaterThan(200);
    expect(TEKSTY_LICENCJI['BSL-1.0']?.tekst).toContain('Boost Software License');
    for (const r of NATYWNE_IOS) expect({ n: r[0], tekst: !!TEKSTY_LICENCJI[r[2]] }).toEqual({ n: r[0], tekst: true });
  });
  test('treść licencji nie ma twardych złamań w akapicie (zawinięta): Apache-2.0 ma mniej wierszy niż 1 na 80 znaków', () => {
    const a = TEKSTY_LICENCJI['Apache-2.0']?.tekst ?? '';
    expect(a.length).toBeGreaterThan(5000);
    expect(a.split('\n').filter((w) => w.length < 60 && w.trim() !== '' && !/^[A-Z0-9 .,-]+$/.test(w.trim()) && !/^\d+\)/.test(w.trim())).length).toBeLessThan(a.split('\n').length / 3);
  });
});
