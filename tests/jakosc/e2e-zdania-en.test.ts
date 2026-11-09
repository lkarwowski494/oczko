/* M3 build 2, e2e 64 (P-627, 04-studio-projektowe-022): po zmianie tekstu en („…use the stopwatch.” → „…use the timer.”) scenariusz 64 dalej oczekiwał
 * starego zdania i padał dopiero na urządzeniu (przebieg 5, run 42601620032). Trwała kontrola: każda asercja `assertVisible` scenariusza, która jest
 * pełnym zdaniem en (spacja, kropka na końcu, bez znaków wyrażeń poza kropką), odpowiada wartości ze słownika en (`{{…}}` = dowolny fragment).
 * Asercje z wyrażeniem regularnym albo bez kropki (etykiety, liczby) są poza kontrolą — tam rozjazd wykrywa test ekranu albo przebieg E2E. */
import * as fs from 'fs';
import * as path from 'path';
import { kroki, wczytaj, type Scenariusz } from './maestro-runner';

const root = path.join(__dirname, '..', '..');
const KAT = path.join(root, 'e2e/scenariusze');
const en: unknown = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/slowniki/en.json'), 'utf8'));
const wartosci: string[] = [];
(function zbierz(o: unknown): void {
  if (typeof o === 'string') wartosci.push(o);
  else if (o !== null && typeof o === 'object') Object.values(o).forEach(zbierz);
})(en);
const wzorzec = (w: string): RegExp =>
  new RegExp(`^${w.split(/\{\{[^}]+\}\}/).map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.+')}$`);
// Wartość z samych parametrów (np. „{{n}}”) dopasowałaby każde zdanie — kontrola bierze tylko wartości z co najmniej 8 znakami stałego tekstu.
const WZORCE = wartosci.filter(w => w.replace(/\{\{[^}]+\}\}/g, '').trim().length >= 8).map(wzorzec);

/** Zdania en z `assertVisible` (tekst wprost albo `text:` selektora), które kontrola obejmuje. */
export function zdaniaScenariusza(s: Scenariusz): string[] {
  const out: string[] = [];
  for (const { nazwa, arg } of kroki(s.polecenia)) {
    if (nazwa !== 'assertVisible') continue;
    const tekst: unknown = typeof arg === 'string' ? arg : arg?.text;
    if (typeof tekst === 'string' && / /.test(tekst) && /\.$/.test(tekst) && !/[*[\]()|\\{}+?^$]/.test(tekst)) out.push(tekst);
  }
  return out;
}
export const bezSlownika = (zdania: string[]): string[] => zdania.filter(z => !WZORCE.some(r => r.test(z)));

const scen = fs.readdirSync(KAT).filter(f => /^\d\d-.*\.yaml$/.test(f)).sort().map(f => wczytaj(path.join(KAT, f)));

test('zdania en w asercjach scenariuszy istnieją w słowniku en (kontrola obejmuje co najmniej 8 zdań)', () => {
  const zdania = scen.flatMap(s => zdaniaScenariusza(s).map(z => ({ plik: path.basename(s.plik), z })));
  expect(zdania.length).toBeGreaterThanOrEqual(8);
  expect(zdania.filter(({ z }) => bezSlownika([z]).length > 0)).toEqual([]);
});

test('pułapka: stare zdanie „…use the stopwatch.” jest wykrywane, obecne „…use the timer.” i zdanie z parametrem przechodzą', () => {
  expect(bezSlownika(['Time shows here when you use the stopwatch.'])).toEqual(['Time shows here when you use the stopwatch.']);
  expect(bezSlownika(['Time shows here when you use the timer.'])).toEqual([]);
  expect(bezSlownika(['Today’s goal: 13 rows. It stays the same all day.'])).toEqual([]);
});
