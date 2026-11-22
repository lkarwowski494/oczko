// 07-jakosc-005 (F-12, ADR-0030 pkt 4, K-05g): Swift nie kompiluje się na Linuksie, więc spójność tokenu 04, czystej funkcji wzorca i adaptera zegarka
// sprawdza tańsza kontrola tekstowa (zasada 7: ryzykowną część zastąp tańszą kontrolą); `swift test` (HaptykaZegarkaTests) i urządzenie (K-05h) — macOS / P-316.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const K = join(__dirname, '../..');
const czytaj = (p: string) => readFileSync(join(K, p), 'utf8');
const tokeny = JSON.parse(czytaj('docs/design/tokeny.json')) as { haptykaZegarek: Record<string, string> };
const adapter = czytaj('targets/watch/Aplikacja.swift');
const funkcja = czytaj('modules/oczko-reguly/Sources/OczkoDziennik/Haptyka.swift');
const testySwift = czytaj('modules/oczko-reguly/Tests/OczkoRegulyTests/HaptykaZegarkaTests.swift');

/** Typ WKHapticType zapisany na początku opisu tokenu („WKHapticType.notification — …”). */
// M3 p1: Dzianina nazywa wzorzec blokady `blokada` (adapter Swift zostaje przy `blokadaStukniecie` do partii p8).
const TOKEN = (klucz: string): string => (klucz === 'blokadaStukniecie' ? 'blokada' : klucz);
const typTokenu = (klucz: string): string | undefined => /^WKHapticType\.(\w+)/.exec(tokeny.haptykaZegarek[TOKEN(klucz)] ?? '')?.[1] ?? tokeny.haptykaZegarek[TOKEN(klucz)];

describe('haptyka zegarka: token 04 ↔ czysta funkcja ↔ adapter', () => {
  test.each([
    ['przypomnienie', 'notification'], // K-05g: HIG „Tells the person that something significant … requires their attention”
    ['bladZapisu', 'retry'],
    ['blokadaStukniecie', 'failure'],
  ])('token haptykaZegarek.%s = WKHapticType.%s i adapter mapuje wzorzec na ten sam typ', (wzorzec, typ) => {
    expect(typTokenu(wzorzec)).toBe(typ);
    expect(adapter).toContain(`case .${wzorzec}: typ = .${typ}`);
  });
  test('zwykły rząd zostaje „click” (jak dotąd), a przypomnienie jest inne niż click i inne niż błąd zapisu', () => {
    expect(adapter).toContain('case .plus: typ = .click');
    expect(new Set(['przypomnienie', 'bladZapisu', 'blokadaStukniecie'].map(typTokenu)).size).toBe(3);
  });
  test('adapter nie gra haptyki na sztywno — każdy sygnał idzie przez czystą funkcję wzorca (jedno `play`)', () => {
    expect(adapter.match(/\.play\(/g)).toHaveLength(1);
    expect(adapter).toContain('wzorzecHaptykiZegarka(rodzaj, przebieg)');
    expect(adapter).toMatch(/zagraj\(rodzaj, \.wynik\(w\)\)/);
    expect(adapter).toMatch(/zagraj\(rodzaj, \.zapisNieudany\)/);
  });
  test('funkcja wzorca w pakiecie reguł ma cztery wyniki i regułę pasa przypomnienia; testy Swift pokrywają każdy z nich', () => {
    for (const w of ['plus', 'przypomnienie', 'bladZapisu', 'blokadaStukniecie']) {
      expect(funkcja).toContain(w);
      expect(testySwift).toMatch(new RegExp(`\\.${w}\\b`));
    }
    expect(funkcja).toContain('pasPrzypomnienia(nowy)'); // ta sama reguła co pas przypomnienia (RD-13)
  });
});
