/* M1-audytor-generalny-035 (04-studio-projektowe-008, DEC-04 a, P-418): kropka koloru włóczki wylatuje z design-spec i z kodu.
 * Model nie ma koloru włóczki (zapas trzyma kolor tekstem), więc kropka nigdy się nie pokazywała — ozdoba bez danych (zasada studia 2).
 * Kontrola trwała: pole `kolorWloczki` nie wraca do `src/`, a „Element firmowy” w design-spec nie obiecuje elementu bez danych. */
import * as fs from 'fs';
import * as path from 'path';

const KORZEN = path.join(__dirname, '..', '..');
const pliki = (k: string): string[] => fs.readdirSync(k, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? pliki(path.join(k, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(k, e.name)] : []));

test('035: `kolorWloczki` nie występuje w src/ (typ wiersza, kompozycja, ekran)', () => {
  const trafienia = pliki(path.join(KORZEN, 'src')).filter((p) => fs.readFileSync(p, 'utf8').includes('kolorWloczki')).map((p) => path.relative(KORZEN, p));
  expect(trafienia).toEqual([]);
});

test('035: styl `kropka` zniknął z listy projektów', () => {
  expect(fs.readFileSync(path.join(KORZEN, 'src', 'ekrany', 'ListaProjektow.tsx'), 'utf8')).not.toMatch(/\bkropka\b/);
});

test('035: design-spec „Element firmowy” nie ma kropki koloru włóczki', () => {
  const spec = fs.readFileSync(path.join(KORZEN, 'docs', 'design', 'design-spec.md'), 'utf8');
  const sekcja = spec.slice(spec.indexOf('## Element firmowy'), spec.indexOf('## Komponenty'));
  expect(sekcja).toContain('## Element firmowy');
  expect(sekcja).not.toMatch(/Kolor włóczki|kropk/i);
});
