/* BX11 zad. 2 / CH-01 (P1, `docs/jakosc/ch-recenzja-bx9.md`): scenariusz 105 (PU-071) ma sprawdzać WARTOŚĆ „okno zostaje w pionie” po obrocie telefonu, nie tylko `below` (prawdziwe w obu orientacjach).
 * Źródłem wartości jest panel `e2e-okno` (src/kompozycja/e2e/okno-stan.tsx, build E2E): po każdym `setOrientation: LANDSCAPE_LEFT` scenariusz asertuje, że okno jest „portrait”.
 * Test pada, gdy asercji nie ma, gdy wzorzec przepuszcza „window: landscape” albo gdy id nie ma w README. */
import * as fs from 'fs';
import * as path from 'path';
import { rozbierz, wczytaj, type Polecenie } from './maestro-runner';

const KAT = path.join(__dirname, '..', '..', 'e2e', 'scenariusze');
const PLIK = fs.readdirSync(KAT).find((f) => /^105-.*\.yaml$/.test(f)) ?? '';
const README = fs.readFileSync(path.join(__dirname, '..', '..', 'e2e', 'README.md'), 'utf8');

/** Płaska lista poleceń głównego pliku scenariusza (bez podprzepływów; obroty są w pliku). */
const polecenia = (): Polecenie[] => wczytaj(path.join(KAT, PLIK)).polecenia;
const poObrocie = (): { obrot: number; nastepne: Polecenie[] }[] => {
  const p = polecenia();
  return p.map((x, i) => ({ x, i })).filter(({ x }) => rozbierz(x)[0] === 'setOrientation' && rozbierz(x)[1] === 'LANDSCAPE_LEFT').map(({ i }) => ({ obrot: i, nastepne: p.slice(i + 1) }));
};
const jestOknoPortrait = (x: Polecenie): boolean => {
  const [n, a] = rozbierz(x);
  if (n !== 'assertVisible' || typeof a !== 'object' || a === null) return false;
  return a.id === 'e2e-okno' && typeof a.text === 'string' && new RegExp(`^${a.text}$`, 'i').test('window: portrait (390 x 844)') && !new RegExp(`^${a.text}$`, 'i').test('window: landscape (844 x 390)');
};

describe('CH-01 · scenariusz 105 sprawdza proporcję okna z panelu `e2e-okno`', () => {
  test('scenariusz 105 istnieje i ma 6 obrotów poziomo (licznik, Dziś, Ustawienia, Projekty, Historia, Narzędzia)', () => {
    expect(PLIK).not.toBe('');
    expect(poObrocie()).toHaveLength(6);
  });
  test('po każdym obrocie poziomo (przed następną zmianą stanu) jest asercja `e2e-okno` = „portrait”, której „landscape” nie spełnia', () => {
    for (const { obrot, nastepne } of poObrocie()) {
      const doZmiany = nastepne.findIndex((x) => ['setOrientation', 'tapOn', 'runFlow'].includes(rozbierz(x)[0]));
      const okno = (doZmiany < 0 ? nastepne : nastepne.slice(0, doZmiany)).filter(jestOknoPortrait);
      expect({ obrot, asercji: okno.length }).toEqual({ obrot, asercji: 1 });
    }
  });
  test('nagłówek scenariusza nie twierdzi już, że orientację poznaje po `below`', () => {
    const tresc = fs.readFileSync(path.join(KAT, PLIK), 'utf8');
    expect(tresc).not.toMatch(/poznaje po tym, że `below` przestaje być prawdą/);
    expect(tresc).toMatch(/e2e-okno/);
  });
  test('id `e2e-okno` jest w README (tabela paneli) z opisem proporcji okna', () => {
    expect(README).toMatch(/\| `e2e-okno` \|[^\n]*window: portrait/);
  });
});
