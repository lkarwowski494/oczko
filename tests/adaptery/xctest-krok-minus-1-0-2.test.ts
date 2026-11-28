// PRZENIESIONY z tests/akceptacja/kontrole/zm22-zm24-xctest.test.ts do głównego zestawu (DS-02, P-1114) w commicie, który zazielenia XCTest (FB1 08-B).
// ZM-22 (U4, ADR-0035 § U4) i ZM-24 (U6, ADR-0036 kontrakt Swift): reguły intencji ekranu blokady/zegarka żyją w Swift (`swift test` w bramce
// „Jakość · iOS”), więc test przed kodem w Jest sprawdza tylko, że XCTest z wektorami IN-01…IN-11 i PS-01…PS-07 jest w pakiecie
// modules/oczko-reguly/Tests/ (P-1114). Szkic: tests/akceptacja/swift/IntencjaKrokMinusTests.swift.szkic — 08-B przenosi go i zielenieje w CI macOS.
// Wynik `swift test` sprawdza bramka iOS, nie ten test (w kontenerze Linux brak Swift).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ZaleznosciEkranuBlokady } from '../../src/przypadki-uzycia/ekran-blokady';

/** Strona TS składa stan v3 dla Live Activity i zegarka — 08-B/08-A dopisują pole `krok` (ADR-0036 kontrakt Swift pkt 1); dla tabeli 07 → 08. */
export type ZaleznosciEkranuBlokadyDzis = ZaleznosciEkranuBlokady;

const KATALOG = join(__dirname, '../../modules/oczko-reguly/Tests/OczkoRegulyTests');
const tresc = () => readdirSync(KATALOG).filter((f) => f.endsWith('.swift')).map((f) => readFileSync(join(KATALOG, f), 'utf8')).join('\n');
const WEKTORY = JSON.parse(readFileSync(join(__dirname, '../../docs/architektura/wektory-1-0-2.json'), 'utf8')) as { intencja: { id: string }[]; przypomnienie_skoku: { id: string }[] };

test('ZM-22 ZM-24: XCTest pakietu czyta wektory-1-0-2.json („intencja”) — wszystkie ID IN-01…IN-11 wykonane przez Wykonane.sprawdz', () => {
  expect(WEKTORY.intencja.map((w) => w.id)).toHaveLength(11);
  const t = tresc();
  expect(t).toContain('wektory-1-0-2.json');
  expect(t).toMatch(/\["intencja"\]/);
});

test('ZM-24: XCTest haptyki zegarka przy skoku czyta „przypomnienie_skoku” (PS-01…PS-07)', () => {
  expect(WEKTORY.przypomnienie_skoku.map((w) => w.id)).toHaveLength(7);
  expect(tresc()).toMatch(/\["przypomnienie_skoku"\]/);
});
