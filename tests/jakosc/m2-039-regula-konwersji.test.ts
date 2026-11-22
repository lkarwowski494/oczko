// M2-koordynator-napraw-039 (MON-17, rola 02; P-458): reguła konwersji w „Test modelu” nie może odrzucać wyższego limitu dni powołując KP-01,
// bo KP-01 pozwala limit tylko luzować (N rośnie) — wykluczone jest zaostrzenie (mniej darmowych dni); wiersz progu skarg dopuszcza wyższy limit.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const linie = readFileSync(join(__dirname, '../../docs/monetyzacja.md'), 'utf8').split('\n');
const wiersz = (poczatek: string) => linie.find((l) => l.startsWith(poczatek)) ?? '';

test('KP-01: limit tylko się luzuje (wejście testu)', () => {
  expect(wiersz('| KP-01 (zmienione) |')).toContain('tylko się luzuje (N rośnie, nigdy nie maleje');
});
test('reguła konwersji: zaostrzenie limitu wykluczone przez KP-01, bez „wyższy limit nie”', () => {
  const r = wiersz('| Reguła | < 3,79%');
  expect(r).not.toMatch(/wyższy limit nie/);
  expect(r).toMatch(/niższy limit dni nie, bo KP-01 pozwala tylko luzować/);
});
test('wiersz progu skarg dalej dopuszcza wyższy limit dni (KP-01)', () => {
  expect(wiersz('| Próg skarg i ocen |')).toContain('wyższy limit dni, bo KP-01 pozwala luzować');
});
