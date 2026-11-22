// P-506: kontrola (a) treści krytycznej wykazała 6 rozbieżnych par. Test pilnuje poprawek:
// - `probka.uwaga_oczka` (blokowanie próbki, [T] z listy krytycznych) w et/ja/ro/tr ma termin blokowania i NIE dodaje
//   pary ani prasowania (en: „Block your swatch … after blocking” — bez metody);
// - zh-Hant `probka.kategoria_other` / `kategoria_otwarta_other` oddają „stockinette stitch” nazwą ściegu 平針
//   (nie „平面編織”, które czyta się jako „tkane na płasko”), z zachowanymi parametrami.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const KAT = join(__dirname, '..', '..', 'src', 'i18n', 'slowniki');
type Slownik = { probka: Record<string, string> };
const probka = (j: string) => (JSON.parse(readFileSync(join(KAT, `${j}.json`), 'utf8')) as Slownik).probka;

describe('uwaga_oczka: termin blokowania, bez pary i prasowania', () => {
  const przypadki: Array<[string, RegExp, RegExp]> = [
    // [język, wymagany termin, zakazane słowa (para, żelazko, wilgotna ściereczka, prasowanie)]
    ['et', /blocking/, /aur|triik|niisut|märj/i],
    ['ja', /ブロッキング/, /スチーム|アイロン|蒸|湿/],
    ['ro', /bloc(are|hează)/i, /călc|fier|cârp|umed|abur/i],
    ['tr', /blok/i, /buhar|ütü|nem/i],
  ];
  test.each(przypadki)('%s', (j, termin, zakazane) => {
    const t = probka(j).uwaga_oczka;
    expect(t).toMatch(termin);
    expect(t).not.toMatch(zakazane);
  });
  test.each(['ja', 'ro', 'tr'])('%s: termin blokowania także przy „po blokowaniu” (drugi raz jak w en)', (j) => {
    const t = probka(j).uwaga_oczka;
    const wzorzec = j === 'ja' ? /ブロッキング/g : j === 'ro' ? /bloc(are|hează)/gi : /blok/gi;
    expect((t.match(wzorzec) ?? []).length).toBeGreaterThanOrEqual(2);
  });
});

describe('zh-Hant: ścieg gładki 平針 w opisie kategorii', () => {
  test.each(['kategoria_other', 'kategoria_otwarta_other'])('%s', (k) => {
    const t = probka('zh-Hant')[k] as string;
    expect(t).toContain('平針');
    expect(t).not.toContain('平面編織');
    for (const p of ['{{n}}', '{{nazwa}}', '{{max}}']) expect(t).toContain(p);
  });
  test('kategoria_other zachowuje {{min}} i {{max}}', () => {
    expect(probka('zh-Hant').kategoria_other).toContain('{{min}}');
  });
});
