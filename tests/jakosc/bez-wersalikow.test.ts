/* 04-studio-projektowe-003: nagłówki sekcji zwykłą wielką literą na początku (design-spec.md:46), nie wersalikami z rozstrzeleniem;
 * `textTransform` nie występuje w src/ekrany (wersaliki zmieniałyby też brzmienie tekstu u tłumaczy i czytnika). */
import * as fs from 'fs';
import * as path from 'path';

const KATALOG = path.join(__dirname, '..', '..', 'src', 'ekrany');
const pliki = (k: string): string[] => fs.readdirSync(k, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? pliki(path.join(k, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(k, e.name)] : []));

test('04-003: textTransform nie występuje w src/ekrany', () => {
  const trafienia = pliki(KATALOG).filter((p) => fs.readFileSync(p, 'utf8').includes('textTransform')).map((p) => path.relative(KATALOG, p));
  expect(trafienia).toEqual([]);
});
