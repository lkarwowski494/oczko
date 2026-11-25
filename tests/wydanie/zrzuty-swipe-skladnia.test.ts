/* ZR4 (rola 10 fix, KO-185, P-1000): składnia swipe'ów w scenach zrzutów sklepu.
 * Fakt: przebieg 44697325331 (wszystkie 4 zadania) padł na „Parsing Failed at e2e/zrzuty-sklepu/00-przygotuj.yaml:171:3”. Maestro 2.12.1 waliduje `start`/`end` swipe'a przy PARSOWANIU pliku,
 * przed wyliczeniem JS: nie przechodzi ani wyrażenie (`${A ? B : C}`), ani sama zmienna (`${B}`); przechodzi dosłowne „N%, M%”. Dowód: odczyt prawdziwym `YamlCommandReader` z maestro-orchestra 2.12.1
 * (opis i wynik: docs/wydanie/zrzuty-ramki.md, P-1000). Ten test nie uruchamia Maestro (brak w Jest) — pilnuje reguły, której złamanie psuje parsowanie: każde `start`/`end` każdego swipe'a w scenach
 * zrzutów to dosłowne procenty. Wybór wariantu (orientacja × język) robi `runFlow` z `when: true:`; ten warunek jest wyliczany w przebiegu (nie przy parsowaniu), więc wyrażenie w nim jest dozwolone. */
import { plikiScen, swipyPliku, WARUNEK } from './pomoc-swipe';

const LITERAL = /^\d{1,3}%,\s*\d{1,3}%$/;

describe('ZR4 (P-1000): swipe w scenach zrzutów ma dosłowne współrzędne', () => {
  const swipy = plikiScen().flatMap(swipyPliku);

  test('sceny zawierają swipe\'e (test nie jest pusty): fikstura 4, scena 04 6 (ZR7: iPhone en w trzech grupach języków + iPhone pl + 2 × iPad), 99-zakup 1', () => {
    const wg = (p: string) => swipy.filter((s) => s.plik === p).length;
    expect([wg('00-przygotuj.yaml'), wg('04-zakreslenie.yaml'), wg('99-zakup.yaml')]).toEqual([4, 6, 1]);
  });

  test.each(swipy.map((s, i) => [`${s.plik} #${i}`, s] as const))('%s: start i end to dosłowne „N%, M%” (bez ${…} — Maestro waliduje je przy parsowaniu)', (_n, s) => {
    for (const pole of [s.start, s.end]) {
      expect([typeof pole, String(pole).includes('${')]).toEqual(['string', false]);
      expect(String(pole)).toMatch(LITERAL);
    }
  });

  test('wyrażenie (orientacja × język) stoi tylko w `when: true:` runFlow, w jednym ustalonym kształcie, a nie w polach swipe\'a', () => {
    for (const s of swipy.filter((x) => x.plik !== '99-zakup.yaml')) {
      // ZR7 (P-1016): do orientacji i klucza danych może dojść jeden warunek grupy języków (`[...].includes(JEZYK)`); klucz danych nadal en | pl
      const m = WARUNEK.exec(String(s.warunek));
      expect([s.plik, s.warunek, m !== null && ['en', 'pl'].includes(m[2])]).toEqual([s.plik, s.warunek, true]);
    }
  });

  test('żadne pole `start`/`end` (swipe) w żadnym pliku e2e/zrzuty-sklepu nie jest wyrażeniem — także zapis wieloliniowy (ochrona przed regresją formy zapisu: regex na jednej linii by jej nie złapał)', () => {
    const fs = require('fs') as typeof import('fs'); const path = require('path') as typeof import('path');
    for (const f of plikiScen()) {
      const tekst = fs.readFileSync(path.join(__dirname, '..', '..', 'e2e', 'zrzuty-sklepu', f), 'utf8').split('\n').filter((l) => !l.trimStart().startsWith('#')).join('\n');
      expect([f, /\b(?:start|end)\s*:\s*["']?\s*\$\{/.test(tekst)]).toEqual([f, false]);
    }
  });
});
