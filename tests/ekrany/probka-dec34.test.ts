// Przekazanie 04 → 08 (M1-audytor-generalny-134, DEC-34 a; design-spec „Aneks M2 partia 3c1”): test akceptacyjny zachowania ekranu „Swatch”.
// Miejsce docelowe: tests/ekrany/probka-dec34.test.ts. Wyrocznia: docs/design/fix15-2026-11-03/klucze.json → probka_podglad.
// Czerwony na kodzie sprzed poprawki (src/kompozycja/probka.ts: MIEJSCA = 3 dla wszystkich liczb), zielony po zmianie 08.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { stanProbki, type WejscieProbki } from '../../src/kompozycja/probka';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

type Przypadek = { opis: string; oczka: string; na: '10cm' | '4in'; szerokosc?: string; jednostka?: 'cm' | 'in'; klucz: string; pokazana: string };
const WYR = JSON.parse(readFileSync(join(__dirname, '../../docs/design/fix15-2026-11-03/klucze.json'), 'utf8')) as { probka_podglad: { przypadki: Przypadek[] } };
let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });
const licz = (c: Przypadek) => stanProbki({ oczka: c.oczka, na: c.na, szerokosc: c.szerokosc ?? '', jednostka: c.jednostka ?? 'cm' } satisfies WejscieProbki, { t, jezyk: () => 'en-US' });
const napis = (c: Przypadek): string | null | undefined => {
  const s = licz(c);
  if (c.klucz === 'probka.przeliczona') return s.przeliczona;
  if (c.klucz === 'probka.oczka_wynik') return s.wynik?.liczba;
  if (c.klucz === 'probka.na_4in_dokladnie') return s.grubosc?.dokladnie;
  return s.wynik?.zDanych;
};

describe('DEC-34 a: podgląd „Swatch” — wyliczone jedno miejsce, wpisane jak wpisano, obliczenia z pełnej wartości', () => {
  for (const c of WYR.probka_podglad.przypadki) test(c.opis, () => expect(napis(c)).toBe(c.pokazana));
  test('pl-PL: zapis regionu z jednym miejscem (BR-KAL-003/S3: 20,5 o./4 in → 20,2)', () => {
    expect(stanProbki({ oczka: '20,5', na: '4in', szerokosc: '', jednostka: 'cm' }, { t, jezyk: () => 'pl-PL' }).przeliczona).toBe('= 20,2 stitches per 10 cm');
  });
});
