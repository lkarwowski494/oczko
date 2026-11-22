// Teksty natywne Live Activity i zegarka (ADR-0017 „Teksty natywne”, wzór Treningu tests/widget-i18n.test.ts): tabela język → klucz → tekst
// w targets/widget/Teksty.swift i targets/watch/Teksty.swift generowana ze słowników t() (sekcja `aktywnosc`); test porównuje zapisany plik
// z wygenerowanym. Aktualizacja: UPDATE_TEKSTY_NATYWNE=1 npx jest tests/adaptery/teksty-natywne.test.ts
// 08 partia 4 (P-139, P-143): język = język aplikacji ze stanu (`jezyk`), łańcuch zastępczy jak w aplikacji (lancuchZastepczy), parametry
// {{nazwa}} i liczba mnoga CLDR — kategorie z src/i18n/plural.ts zapisane w tabeli (n < 200 wprost, dalej okres 100, pełne miliony osobno).
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import en from '../../src/i18n/slowniki/en.json';
import { JEZYKI, lancuchZastepczy } from '../../src/i18n/jezyki';
import { kategoriaLiczby, type KategoriaLiczby } from '../../src/i18n/plural';

const KORZEN = join(__dirname, '../..');
const SLOWNIKI = join(KORZEN, 'src/i18n/slowniki');
const CELE = ['targets/widget/Teksty.swift', 'targets/watch/Teksty.swift'].map((c) => join(KORZEN, c)); // ta sama tabela w widżecie i na zegarku
const KLUCZE = Object.keys(en.aktywnosc).sort();
// Partia 6 (cel share, design-spec „Udostępnij do Oczka” R1a): klucze „przestrzeń.klucz” z kilku sekcji słownika w osobnej tabeli celu.
const CEL_SHARE = join(KORZEN, 'targets/share/Teksty.swift');
const SEKCJE_SHARE: Record<string, RegExp> = {
  udostepnij: /./, wspolne: /^(anuluj|zapisz|zamknij)$/, projekty: /^(ostatnia_praca_|nazwa_robocza$)/,
  wzor: /^(blad_rozmiar|blad_typ|wiersz_opis|strony_|rodzaj_)/,
};
type Slownik = Record<string, Record<string, string> | undefined>;
const kluczeShare = (s: Slownik): [string, string][] => Object.entries(SEKCJE_SHARE)
  .flatMap(([sek, wz]) => Object.entries(s[sek] ?? {}).filter(([k]) => wz.test(k)).map(([k, t]): [string, string] => [`${sek}.${k}`, t]))
  .sort(([a], [b]) => (a < b ? -1 : 1));
const KLUCZE_SHARE = kluczeShare(en as unknown as Slownik).map(([k]) => k);
const ZNAK: Record<KategoriaLiczby, string> = { zero: 'z', one: 'o', two: 't', few: 'f', many: 'm', other: 'r' };

/** Kategorie liczb całkowitych: n = 0…199 wprost; n ≥ 200 → wpis 100 + n mod 100, a pełne miliony mają własny znak (`many` w es, fr, it, pt). */
const kategorie = (j: string) => ({ male: Array.from({ length: 200 }, (_, n) => ZNAK[kategoriaLiczby(j, n)]).join(''), milion: ZNAK[kategoriaLiczby(j, 1_000_000)] });
function kategoriaZTabeli(t: { male: string; milion: string }, n: number): string {
  if (n < 200) return t.male[n] ?? 'r';
  if (n % 1_000_000 === 0) return t.milion;
  return t.male[100 + (n % 100)] ?? 'r';
}

/** Napis Swift: ucieczka `\` i `"` (teksty bez znaków sterujących — sprawdza test niżej). */
const swift = (t: string) => `"${t.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
function generuj(share = false): string {
  const jezyki = readdirSync(SLOWNIKI).filter((n) => /^[a-zA-Z-]+\.json$/.test(n) && !n.includes('kontekst')).map((n) => n.replace(/\.json$/, '')).sort();
  const wiersze = jezyki.map((j) => {
    const slownik = JSON.parse(readFileSync(join(SLOWNIKI, `${j}.json`), 'utf8')) as Slownik;
    const pary: [string, string][] = share ? kluczeShare(slownik) : KLUCZE.filter((k) => slownik.aktywnosc?.[k]).map((k) => [k, slownik.aktywnosc?.[k] ?? '']);
    return `    ${swift(j)}: [${pary.map(([k, t]) => `${swift(k)}: ${swift(t)}`).join(', ')}],`;
  });
  const lancuchy = JEZYKI.map((j) => `    ${swift(j)}: [${lancuchZastepczy(j).map(swift).join(', ')}],`);
  const liczby = JEZYKI.map((j) => { const k = kategorie(j); return `    ${swift(j)}: (${swift(k.male)}, ${swift(k.milion)}),`; });
  return [
    share
      ? '// Wygenerowane z src/i18n/slowniki/*.json (klucze `udostepnij.*` i wybrane `wspolne`, `projekty`, `wzor`), src/i18n/jezyki.ts i src/i18n/plural.ts'
      : '// Wygenerowane z src/i18n/slowniki/*.json (sekcja `aktywnosc`), src/i18n/jezyki.ts i src/i18n/plural.ts przez tests/adaptery/teksty-natywne.test.ts',
    share
      ? '// przez tests/adaptery/teksty-natywne.test.ts — nie edytować (ADR-0017). Język = pierwszy obsługiwany z języków systemu (rozszerzenie nie czyta bazy).'
      : '// — nie edytować (ADR-0017). Język = język aplikacji ze stanu (P-139); brak albo nieznany → angielski (P-115).',
    'import Foundation',
    '',
    'enum Teksty {',
    '  static let tabela: [String: [String: String]] = [',
    ...wiersze,
    '  ]',
    '  /// Łańcuch zastępczy jak w aplikacji (wariant → język bazowy → źródło), `lancuchZastepczy` w src/i18n/jezyki.ts.',
    '  static let lancuch: [String: [String]] = [',
    ...lancuchy,
    '  ]',
    '  /// Kategorie CLDR liczb całkowitych (z, o, t, f, m, r = zero, one, two, few, many, other): n < 200 wprost, dalej 100 + n mod 100, pełne miliony osobno.',
    '  static let liczby: [String: (String, String)] = [',
    ...liczby,
    '  ]',
    '',
    '  static func tekst(_ klucz: String, _ jezyk: String?) -> String? {',
    '    for j in lancuch[jezyk ?? "en"] ?? ["en"] { if let t = tabela[j]?[klucz] { return t } }',
    '    return nil',
    '  }',
    '  static func podstaw(_ t: String, _ parametry: [String: String]) -> String {',
    '    parametry.reduce(t) { $0.replacingOccurrences(of: "{{\\($1.key)}}", with: $1.value) }',
    '  }',
    '  /// Tekst w języku aplikacji z parametrami `{{nazwa}}`; brak tekstu = klucz (wykrywa test kluczy).',
    '  static func t(_ klucz: String, _ jezyk: String?, _ parametry: [String: String] = [:]) -> String {',
    '    podstaw(tekst(klucz, jezyk) ?? klucz, parametry)',
    '  }',
    '  static func kategoria(_ jezyk: String?, _ n: Int) -> String {',
    '    guard n >= 0, let (male, milion) = liczby[jezyk ?? "en"] ?? liczby["en"] else { return "other" }',
    '    let znak: Character',
    '    if n < 200 { znak = Array(male)[n] } else if n % 1_000_000 == 0 { znak = Character(milion) } else { znak = Array(male)[100 + n % 100] }',
    '    return ["z": "zero", "o": "one", "t": "two", "f": "few", "m": "many"][znak] ?? "other"',
    '  }',
    '  /// Liczba mnoga (`klucz_one`, `klucz_few`, …, brak formy → `klucz_other`, ADR-0017) z `{{count}}` i parametrami.',
    '  static func tl(_ klucz: String, _ count: Int, _ jezyk: String?, _ parametry: [String: String] = [:]) -> String {',
    '    let forma = tekst("\\(klucz)_\\(kategoria(jezyk, count))", jezyk) ?? tekst("\\(klucz)_other", jezyk) ?? klucz',
    '    return podstaw(forma, parametry.merging(["count": String(count)]) { a, _ in a })',
    '  }',
    '}',
    '',
  ].join('\n');
}

test.each(CELE.map((c) => [c.slice(KORZEN.length + 1), c] as const))('%s = tabela wygenerowana ze słowników t()', (_n, cel) => {
  const g = generuj();
  if (process.env.UPDATE_TEKSTY_NATYWNE === '1') writeFileSync(cel, g);
  expect(readFileSync(cel, 'utf8')).toBe(g);
});
test('targets/share/Teksty.swift = tabela wygenerowana ze słowników t() (cel share, partia 6)', () => {
  const g = generuj(true);
  if (process.env.UPDATE_TEKSTY_NATYWNE === '1') writeFileSync(CEL_SHARE, g);
  expect(readFileSync(CEL_SHARE, 'utf8')).toBe(g);
});
test('każdy klucz Teksty.t/tl("…") w Swift celu share jest w tabeli share (tl: z formą `_other`)', () => {
  const kod = readdirSync(join(KORZEN, 'targets/share')).filter((n) => n.endsWith('.swift')).map((n) => readFileSync(join(KORZEN, 'targets/share', n), 'utf8')).join('\n');
  const uzyte = [...new Set([...kod.matchAll(/Teksty\.t\("([^"]+)"/g)].map((m) => m[1] ?? ''))];
  const mnogie = [...new Set([...kod.matchAll(/Teksty\.tl\("([^"]+)"/g)].map((m) => `${m[1]}_other`))];
  expect(uzyte.length).toBeGreaterThan(0);
  expect([...uzyte, ...mnogie].filter((k) => !KLUCZE_SHARE.includes(k))).toEqual([]);
});
test('P-143: klucze `aktywnosc` = tabela „Ekran blokady i zegarek” w design-spec (04 fix-2, fix-3); bez znaków sterujących', () => {
  const spec = readFileSync(join(KORZEN, 'docs/design/archiwum/2026-11-08-kreski/design-spec.md'), 'utf8');
  const sekcja = spec.slice(spec.indexOf('## Ekran blokady i zegarek'), spec.indexOf('## Dla 08 (fix NZ-08-P3-04'));
  const zSpec = [...sekcja.matchAll(/^\| `aktywnosc\.([a-z_0-9]+)`(?: \/ `aktywnosc\.([a-z_0-9]+)`| \/ `_([a-z]+)`)? \|/gm)]
    .flatMap((m) => [m[1], m[2], m[3] ? `${(m[1] ?? '').replace(/_[a-z]+$/, '')}_${m[3]}` : undefined]).filter((k): k is string => !!k);
  // `aktywnosc.sesja_a11y` jest w opisie wiersza karta_a11y („dopisek `aktywnosc.sesja_a11y` „session {{czas}}””), nie w osobnym wierszu.
  expect([...new Set([...zSpec, 'sesja_a11y'])].sort()).toEqual(KLUCZE);
  expect(Object.values(en.aktywnosc).filter((t) => /[\u0000-\u001f]/.test(t))).toEqual([]);
});
test('ADR-0017: kategorie z tabeli Swift = kategoriaLiczby dla 35 języków, n = 0…10 000 i pełne miliony do 10⁹', () => {
  const rozjazdy: string[] = [];
  for (const j of JEZYKI) {
    const t = kategorie(j);
    const liczby = [...Array.from({ length: 10_001 }, (_, n) => n), ...Array.from({ length: 1000 }, (_, i) => (i + 1) * 1_000_000), 1_000_001, 2_000_100];
    for (const n of liczby) {
      const oczek = ZNAK[kategoriaLiczby(j, n)];
      if (kategoriaZTabeli(t, n) !== oczek) { rozjazdy.push(`${j} ${n}: ${kategoriaZTabeli(t, n)} ≠ ${oczek}`); break; }
    }
  }
  expect(rozjazdy).toEqual([]);
});
test('każdy klucz Teksty.t/tl("…") użyty w Swift widżetu i zegarka jest w tabeli (tl: z formą `_other`)', () => {
  const swiftKod = ['targets/widget', 'targets/watch'].flatMap((k) => readdirSync(join(KORZEN, k)).filter((n) => n.endsWith('.swift')).map((n) => readFileSync(join(KORZEN, k, n), 'utf8'))).join('\n');
  const uzyte = [...new Set([...swiftKod.matchAll(/Teksty\.t\("([^"]+)"/g)].map((m) => m[1]))].sort();
  const mnogie = [...new Set([...swiftKod.matchAll(/Teksty\.tl\("([^"]+)"/g)].map((m) => `${m[1]}_other`))].sort();
  expect(uzyte.length).toBeGreaterThan(0);
  expect([...uzyte, ...mnogie].filter((k) => !KLUCZE.includes(k ?? ''))).toEqual([]);
});
