/* Przebieg „Jakość · iOS” #142 (run 41570876905, SHA 3f0fe68, 2026-11-03).
 *  S1 · 59, 34, 35, 61 (BR-DNI-004, BR-LIC-011, BR-DNI-005, BR-PRJ-007): podprzepływ `dodaj-czesc-cel.yaml` kończył się `tapOn: "Back.*"` (wiersz części „Back”).
 *       Od partii 3a przycisk wstecz (`nav-wstecz`, `src/ekrany/Pasek.tsx`) ma etykietę „Back”, a Maestro dopasowuje cały tekst: „Back.*” trafia w przycisk
 *       (wyżej na ekranie), nie w wiersz „Back, 0 of 3 rows”. Licznik pokazuje wtedy domyślną część bez celu, +1 idzie do niej, a część „Back” z celem 3 zostaje na 0
 *       (hierarchia kroku 66: „0% done”, wiersz „Back, 0 of 3 rows”). Sklasyfikowane: scenariusz (P-091), aplikacja bez zmian (etykieta dla VoiceOver jest zamierzona).
 *  Kontrola trwała: żaden `tapOn` z samym tekstem nie może pasować do całego tekstu „Back” (etykieta przycisku wstecz). */
import * as fs from 'fs';
import * as path from 'path';

const KAT = path.join(__dirname, '..', '..', 'e2e/scenariusze');
const pliki = (d: string): string[] =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? pliki(path.join(d, e.name)) : e.name.endsWith('.yaml') ? [path.join(d, e.name)] : []));

/** Wiersze `tapOn: "tekst"` (sam tekst, bez id) — Maestro traktuje tekst jako regex dopasowany do całości. */
export function stukniecia(tresc: string): { linia: number; regex: string }[] {
  return tresc.split('\n').flatMap((w, i) => {
    const m = /^\s*(?:-\s+)?(?:tapOn:\s*)"((?:[^"\\]|\\.)*)"\s*(?:#.*)?$/.exec(w);
    return m ? [{ linia: i + 1, regex: m[1].replace(/\\\\/g, '\\') }] : [];
  });
}
const pasujeDoWstecz = (regex: string): boolean => new RegExp(`^(?:${regex})$`).test('Back');

describe('E2-142-S1 · selektor tekstowy nie trafia w przycisk „Back”', () => {
  test('rozpoznanie: „Back.*” pasuje do „Back”, „Back, .*” nie', () => {
    expect(pasujeDoWstecz('Back.*')).toBe(true);
    expect(pasujeDoWstecz('Back, .*')).toBe(false);
  });
  test('podprzepływ dodaj-czesc-cel ma selektor wiersza części z przecinkiem', () => {
    const sp = fs.readFileSync(path.join(KAT, 'subflows/dodaj-czesc-cel.yaml'), 'utf8');
    expect(stukniecia(sp).map((s) => s.regex)).toContain('Back, .*');
  });
  test.each(pliki(KAT).map((f) => [path.relative(KAT, f), f]))('%s: brak tapOn pasującego do całego tekstu „Back”', (_n, f) => {
    const zle = stukniecia(fs.readFileSync(f, 'utf8')).filter((s) => pasujeDoWstecz(s.regex));
    expect(zle).toEqual([]);
  });
});
