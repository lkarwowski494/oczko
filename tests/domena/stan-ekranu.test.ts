// Stan Live Activity i zegarka, wersja 2 (moduly.md „Stan Live Activity i zegarka”, Z07-12; przełączenie v1 → v2: P-111 (3), P-129 Q7a;
// test roli 08 z kontraktu, do przeglądu 07): limity ładunku z konfiguracji, wersja, a złote pliki tests/wspolne/stan-*.json = wynik generatora.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { STAN_NAZWA_MAKS_ZNAKOW, STAN_PRZYPOMNIENIA_MAKS, STAN_PRZYPOMNIENIE_TEKST_MAKS, WERSJA_STANU } from '../../src/konfiguracja';
import { stanEkranuBlokady, utnijZnaki } from '../../src/domena/zegarek';
import { WEJSCIA, stany, tresc } from '../wspolne/generator-stanow';

const KAT = join(__dirname, '../wspolne');

describe('stanEkranuBlokady (wersja 3; 08 partia 4, N1 P-135 Q7a)', () => {
  const duzy = WEJSCIA['stan-ekranu-blokady-najwiekszy.json'];
  test('wersja = WERSJA_STANU = 3', () => expect([stanEkranuBlokady(duzy).wersja, WERSJA_STANU]).toEqual([3, 3]));
  test(`nazwa ucięta do ${STAN_NAZWA_MAKS_ZNAKOW} punktów kodowych (320 znaków CJK na wejściu), bez rozcinania pary zastępczej`, () => {
    expect([...stanEkranuBlokady(duzy).nazwa].length).toBe(STAN_NAZWA_MAKS_ZNAKOW);
    const emoji = stanEkranuBlokady({ ...duzy, nazwa: '🧶'.repeat(100) }).nazwa;
    expect([[...emoji].length, emoji.length]).toEqual([STAN_NAZWA_MAKS_ZNAKOW, 2 * STAN_NAZWA_MAKS_ZNAKOW]);
    expect(stanEkranuBlokady({ ...duzy, nazwa: 'Czapka' }).nazwa).toBe('Czapka');
  });
  // P-131 (1): bez niepełnego znaku na końcu — granica cofnięta przed ZWJ, selektorem wariantu, znakiem łączącym i modyfikatorem karnacji;
  // ścieżka z Intl.Segmenter (grafemy) i bez niego (punkty kodowe z cofnięciem) dają ten sam wynik.
  describe.each([['z Intl.Segmenter', true], ['bez Intl.Segmenter', false]] as const)('ucinanie na granicy znaku złożonego (%s)', (_n, zSegmenterem) => {
    const ucinaj = (nazwa: string, n: number) => utnijZnaki(nazwa, n, zSegmenterem);
    const rodzina = '👩\u200D👩\u200D👧'; // 5 punktów kodowych, 1 znak
    test.each([
      ['emoji ZWJ przecięte w środku → całe poza', `${'a'.repeat(58)}${rodzina}`, 60, 'a'.repeat(58)],
      ['emoji ZWJ mieszczące się w całości zostaje', `${'a'.repeat(55)}${rodzina}b`, 60, `${'a'.repeat(55)}${rodzina}`],
      ['akcent łączący na granicy → litera z akcentem poza', `${'a'.repeat(59)}e\u0301`, 60, 'a'.repeat(59)],
      ['modyfikator karnacji na granicy → emoji poza', `${'a'.repeat(59)}👍🏽`, 60, 'a'.repeat(59)],
      ['selektor wariantu na granicy → znak poza', `${'a'.repeat(59)}❤\uFE0F`, 60, 'a'.repeat(59)],
      ['krótka nazwa bez zmian', 'Czapka é', 60, 'Czapka é'],
    ])('%s', (_opis, nazwa, n, oczekiwane) => expect(ucinaj(nazwa, n)).toBe(oczekiwane));
  });
  test(`najwyżej ${STAN_PRZYPOMNIENIA_MAKS} przypomnienia, tekst ucięty do ${STAN_PRZYPOMNIENIE_TEKST_MAKS} znaków, plan bez zmian`, () => {
    const p = stanEkranuBlokady(duzy).przypomnienia;
    expect(p.length).toBe(STAN_PRZYPOMNIENIA_MAKS);
    expect(p.map((x) => [...x.tekst].length)).toEqual([40, 40, 40]);
    expect(p.map((x) => x.od)).toEqual([100, 200, 300]);
  });
  test('ładunek najgorszego przypadku < 4096 B w UTF-8 (rejestr Apple 1b, R-028)', () => {
    expect(Buffer.byteLength(JSON.stringify(stanEkranuBlokady(duzy)), 'utf8')).toBeLessThan(4096);
  });
});

describe('złote pliki stanu = generator (tests/wspolne/generator-stanow.ts)', () => {
  const s = stany();
  if (process.env.UPDATE_STANY === '1') for (const [p, v] of Object.entries(s)) writeFileSync(join(KAT, p), tresc(v));
  test.each(Object.keys(s).map((p) => [p] as const))('%s: plik = wynik stanEkranuBlokady(wejście)', (p) => {
    expect(readFileSync(join(KAT, p), 'utf8')).toBe(tresc(s[p]));
  });
  test('liczność: 7 plików stanu v2 (3 × ekran blokady, 4 × zegarek)', () => expect(Object.keys(s).length).toBe(7));
});
