// M1-audytor-generalny-195 (05-architekt-527): inwentarz prywatności (wejście roli 10) wymienia każdy plik stanu urządzenia obok bazy
// z `dane.md` „Pliki stanu urządzenia poza bazą”, a wiersz „Uprawnienie Pro” wskazuje rzeczywiste miejsce (`pamiec-pro.json`), nie `ustawienie`.
// Trwała kontrola: nowy plik w tabeli `dane.md` bez wiersza w `prywatnosc.md` czerwieni ten test (rodzaj 517: dokument nie nadąża za zmianą).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const docs = join(__dirname, '../../docs/architektura');
const dane = readFileSync(join(docs, 'dane.md'), 'utf8');
const prywatnosc = readFileSync(join(docs, 'prywatnosc.md'), 'utf8');

function sekcja(tekst: string, naglowek: string): string {
  const od = tekst.indexOf(`## ${naglowek}`);
  if (od < 0) throw new Error(`brak sekcji „${naglowek}”`);
  const dalej = tekst.indexOf('\n## ', od + 3);
  return tekst.slice(od, dalej < 0 ? undefined : dalej);
}

const pliki = [...new Set([...sekcja(dane, 'Pliki stanu urządzenia poza bazą').matchAll(/`([\w-]+\.(?:json|txt))`/g)].map((m) => m[1]))];

test('dane.md wymienia pliki stanu obok bazy (wejście testu)', () => {
  expect(pliki).toEqual(expect.arrayContaining(['stan-startu.json', 'stan-startu-etap.json', 'jezyk.json', 'urzadzenie.txt', 'pamiec-pro.json']));
});

test.each(pliki)('prywatnosc.md wymienia `%s`', (plik) => {
  expect(prywatnosc).toContain(`\`${plik}\``);
});

test('wiersz „Uprawnienie Pro” wskazuje `pamiec-pro.json`, nie `ustawienie`', () => {
  const wiersz = prywatnosc.split('\n').find((l) => l.startsWith('| Uprawnienie Pro |'));
  expect(wiersz).toBeDefined();
  expect(wiersz).toContain('`pamiec-pro.json`');
  expect(wiersz).not.toContain('`ustawienie`');
});
