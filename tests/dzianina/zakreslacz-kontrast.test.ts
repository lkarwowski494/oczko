// 04-studio-projektowe-001 (P1), KO-052 opcja B: zakreślenie rysowane nad tekstem wzoru ma mieć alfę z tokenu `wzor.zakreslaczAlfa`,
// tak by najciemniejszy piksel tekstu pod pasem miał ≥ 4,5:1 do tła pasa (WCAG 2.2, 1.4.3). Rachunek: złożenie „źródło nad” żółci o danej alfie
// nad czarnym tekstem (najgorszy przypadek) i nad białą stroną (`wzor.strona`); model jak w raporcie 04 (dowody/c-kontrast.txt).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import tokeny from '../../docs/design/tokeny.json';

const KORZEN = join(__dirname, '..', '..');
const PODLOGA = 4.5;
const MAX_ALFA = 0.45;

type Rgb = readonly [number, number, number];
const rgb = (hex: string): Rgb => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as unknown as Rgb;
const nad = (kolor: Rgb, alfa: number, tlo: Rgb): Rgb => [0, 1, 2].map((i) => Math.round(alfa * (kolor[i] ?? 0) + (1 - alfa) * (tlo[i] ?? 0))) as unknown as Rgb;
function luminancja([r, g, b]: Rgb): number {
  const l = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * l(r) + 0.7152 * l(g) + 0.0722 * l(b);
}
function kontrast(a: Rgb, b: Rgb): number {
  const [x, y] = [luminancja(a), luminancja(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
}

const wzor: unknown = (tokeny as { wzor: unknown }).wzor;
const alfa: unknown = typeof wzor === 'object' && wzor !== null && 'zakreslaczAlfa' in wzor ? wzor.zakreslaczAlfa : undefined;
const zakreslacz = rgb(tokeny.kolory.jasny.zakreslacz);
const strona = rgb(tokeny.wzor.strona);
const CZARNY: Rgb = [0, 0, 0];

describe('04-studio-projektowe-001: zakreślacz nie obniża czytelności tekstu wzoru', () => {
  test('token wzor.zakreslaczAlfa istnieje, jest liczbą z (0, 0,45]', () => {
    expect(typeof alfa).toBe('number');
    expect(alfa as number).toBeGreaterThan(0);
    expect(alfa as number).toBeLessThanOrEqual(MAX_ALFA);
  });
  test('tekst pod pasem ≥ 4,5:1 do tła pasa (czarny tekst, żółć z alfą z tokenu, biała strona)', () => {
    const a = typeof alfa === 'number' ? alfa : 1; // brak tokenu = pełne krycie, czyli stan sprzed poprawki
    const wynik = kontrast(nad(zakreslacz, a, CZARNY), nad(zakreslacz, a, strona));
    expect(wynik).toBeGreaterThanOrEqual(PODLOGA);
  });
  test('widok natywny rysuje zakreślacz z tą samą alfą (stała w Swift = token)', () => {
    const swift = readFileSync(join(KORZEN, 'modules/oczko-wzor/ios/WidokWzoru.swift'), 'utf8');
    const m = swift.match(/ZAKRESLACZ_ALFA\s*(?::\s*CGFloat)?\s*=\s*([0-9.]+)/);
    expect(m).not.toBeNull();
    expect(Number(m?.[1])).toBe(alfa);
    expect(swift).toMatch(/PKInkingTool\(\.marker, color: KOLOR_ZAKRESLACZA,/);
    expect(swift).toMatch(/KOLOR_ZAKRESLACZA\s*=\s*kolor\(0xF6E04A, alfa: ZAKRESLACZ_ALFA\)/);
  });
  test('pas dalej odróżnia się od białej strony (≥ 1,1:1)', () => {
    const a = typeof alfa === 'number' ? alfa : 1;
    expect(kontrast(nad(zakreslacz, a, strona), strona)).toBeGreaterThanOrEqual(1.1);
  });
});
