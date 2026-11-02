// Kontrakt widoku natywnego wzoru (statycznie, Swift nie kompiluje się w Linuksie): każdy prop i zdarzenie z `PropsWidokuNatywnego` (modules/oczko-wzor/index.ts)
// ma odpowiednik w `View(WidokWzoru.self)` modułu Swift i odwrotnie. Rozjazd = prop ignorowany po cichu na urządzeniu (07-jakosc-007, -023, -006, -026).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Narzedzie, PolitykaPlotna } from '../../src/domena/rysik';

const KORZEN = join(__dirname, '../..');
const ts = readFileSync(join(KORZEN, 'modules/oczko-wzor/index.ts'), 'utf8');
const swift = readFileSync(join(KORZEN, 'modules/oczko-wzor/ios/OczkoWzorModule.swift'), 'utf8');

const blokProps = /export type PropsWidokuNatywnego = \{([\s\S]*?)\n\};/.exec(ts)?.[1] ?? '';
const nazwyTs = [...blokProps.matchAll(/^ {2}(\w+)\??:/gm)].map((m) => m[1] ?? '').filter((n) => n && n !== 'style' && n !== 'testID');
const widokSwift = /View\(WidokWzoru\.self\) \{([\s\S]*?)\n {4}\}/.exec(swift)?.[1] ?? '';
const propySwift = [...widokSwift.matchAll(/Prop\("(\w+)"\)/g)].map((m) => m[1] ?? '');
const zdarzeniaSwift = [...(/Events\(([^)]*)\)/.exec(widokSwift)?.[1] ?? '').matchAll(/"(\w+)"/g)].map((m) => m[1] ?? '');

test('kontrakt widoku wzoru: propsy TS (bez zdarzeń) = Prop(…) w Swift', () => {
  const props = nazwyTs.filter((n) => !/^on[A-Z]/.test(n)).sort();
  expect(props.length).toBeGreaterThan(5);
  expect(propySwift.sort()).toEqual(props);
});
test('kontrakt widoku wzoru: zdarzenia onXxx w TS = Events(…) w Swift', () => {
  const zdarzenia = nazwyTs.filter((n) => /^on[A-Z]/.test(n)).sort();
  expect(zdarzenia.length).toBeGreaterThan(4);
  expect(zdarzeniaSwift.sort()).toEqual(zdarzenia);
});

// Wartości `narzedzie` i `polityka` z TS (src/domena/rysik.ts) są przypadkami enumów Swift, na które mapuje moduł (`NarzedzieWzoru`, `PolitykaPlotna`).
const NARZEDZIA: Narzedzie[] = ['brak', 'zakreslacz', 'pioro', 'gumka'];
const POLITYKI: PolitykaPlotna[] = ['wylaczone', 'dowolne', 'tylkoRysik'];
const przypadki = (nazwa: string): string[] => {
  const polityka = readFileSync(join(KORZEN, 'modules/oczko-wzor/Pakiet/Sources/OczkoWzorLogika/Polityka.swift'), 'utf8');
  const blok = new RegExp(`enum ${nazwa}: String[^{]*\\{\\s*case ([^\\n]+)`).exec(polityka)?.[1] ?? '';
  return blok.split(',').map((x) => x.trim()).sort();
};
test('kontrakt widoku wzoru: wartości narzędzi i polityki z TS = przypadki enumów Swift', () => {
  expect(przypadki('NarzedzieWzoru')).toEqual([...NARZEDZIA].sort());
  expect(przypadki('PolitykaPlotna')).toEqual([...POLITYKI].sort());
});

// 07-jakosc-006: pozycja startowa jedzie w `dokument` (kolejność propsów jest nieokreślona) — pola rekordu Swift `DokumentProp` = pola `dokument` w TS.
test('kontrakt widoku wzoru: pozycja startowa (startStrona, startPowiekszenie) w dokumencie TS i w rekordzie DokumentProp w Swift', () => {
  const dokumentTs = /dokument: \{([\s\S]*?)\};\n {2}katalogRysunkow/.exec(ts)?.[1] ?? '';
  const rekordSwift = /struct DokumentProp: Record \{([\s\S]*?)\n\}/.exec(swift)?.[1] ?? '';
  for (const pole of ['startStrona', 'startPowiekszenie']) {
    expect(dokumentTs).toContain(`${pole}: number`);
    expect(rekordSwift).toMatch(new RegExp(`@Field var ${pole}: (Int|Double) = 0`));
  }
});

// P2-9 (P-360, 10 C): pierwsze pociągnięcie rysikiem nie czeka na JS, więc natywny widok sam wybiera narzędzie — to ustawione propem `narzedzieRysika`
// (compact → Highlighter), nie na sztywno Pen.
test('kontrakt widoku wzoru: pierwszy rysik wybiera narzędzie z propa narzedzieRysika (nie sztywno Pen)', () => {
  const widok = readFileSync(join(KORZEN, 'modules/oczko-wzor/ios/WidokWzoru.swift'), 'utf8');
  const pierwszy = /private func pierwszyRysik\(\) \{([\s\S]*?)\n {2}\}/.exec(widok)?.[1] ?? '';
  expect(pierwszy).toContain('if narzedzie == .brak { ustawNarzedzie(narzedzieRysika) }');
  expect(pierwszy).not.toContain('ustawNarzedzie(.pioro)');
  expect(widok).toMatch(/func ustawNarzedzieRysika\(_ n: NarzedzieWzoru\) \{ narzedzieRysika = n \}/);
  expect(swift).toMatch(/Prop\("narzedzieRysika"\) \{ \(v: WidokWzoru, n: String\) in v\.ustawNarzedzieRysika\(/);
});

// P2-3 (Aneks P2 poz. 2, design-spec „Symbole SF”): chip notatki na stronie ma symbol `note.text` (kontur, 14 pt), nie glif ✎.
test('kontrakt widoku wzoru: chip notatki używa symbolu SF note.text, bez glifu ✎', () => {
  const widok = readFileSync(join(KORZEN, 'modules/oczko-wzor/ios/WidokWzoru.swift'), 'utf8');
  const chip = /private func przebudujChipy\(\) \{([\s\S]*?)\n {2}\}/.exec(widok)?.[1] ?? '';
  expect(chip.length).toBeGreaterThan(100);
  expect(chip).toMatch(/UIImage\(systemName: "note\.text"/);
  expect(chip).toMatch(/pointSize: 14/);
  expect(chip).not.toContain('✎');
  expect(chip).toContain('b.setTitle(n.etykieta, for: .normal)');
});
