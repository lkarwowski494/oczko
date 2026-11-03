// M1-audytor-generalny-062 (01-odkrywanie-002; P-456): budżet NFR-WYD-001 = p95 ≤ 100 ms z 20 stuknięć +1 w stanie ustalonym; pierwsze stuknięcie
// (zimna ścieżka) tylko informacyjnie. Ten sam próg w BRD (OP-17 zamknięte), w budżetach roli 05 i w twardej asercji scenariusza 31 (07).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repo = join(__dirname, '../..');
const czytaj = (p: string) => readFileSync(join(repo, p), 'utf8');
const scenariusz = czytaj('e2e/scenariusze/31-nfr-wyd-001-reakcja-licznika.yaml');

describe('scenariusz 31: twarda asercja budżetu na panelu e2e-pomiar-plus', () => {
  const m = /- assertVisible: \{ id: "e2e-pomiar-plus", text: "([^"]+)" \}/.exec(scenariusz);
  const budzet = new RegExp(`^(?:${m?.[1] ?? '$^'})$`); // Maestro: tekst to wyrażenie dopasowane do całości
  test.each(['p95 100 ms, n = 20 · first 350 ms', 'p95 7 ms, n = 20 · first 1200 ms', 'p95 99 ms, n = 20 · first 0 ms'])('„%s” mieści się w budżecie', (t) => {
    expect(budzet.test(t)).toBe(true);
  });
  test.each(['p95 101 ms, n = 20 · first 5 ms', 'p95 250 ms, n = 20 · first 5 ms', 'p95 50 ms, n = 19 · first 5 ms', 'p95 50 ms, n = 20'])('„%s” poza budżetem albo bez 20 próbek stanu ustalonego', (t) => {
    expect(budzet.test(t)).toBe(false);
  });
  test('21 stuknięć: pierwsze informacyjne, potem 20 do p95 (licznik kończy na 21)', () => {
    expect(scenariusz).toContain('- assertVisible: { id: "licznik-wartosc", text: "21" }');
    expect(scenariusz).not.toMatch(/informacyjnie\)"/);
  });
});

describe('ten sam budżet w dokumentach (P-456)', () => {
  test('BRD NFR-WYD-001: próg liczbowy z ID decyzji; OP-17 zamknięte', () => {
    const nfr = czytaj('docs/brd/wymagania.md').split('### NFR-WYD-001')[1].split('\n### ')[0];
    expect(nfr).toMatch(/- Próg: .*100 ms.*P-456/);
    expect(nfr).not.toContain('[DO USTALENIA]');
    const op = czytaj('docs/brd/README.md').split('\n').find((l) => l.startsWith('| OP-17 |'));
    expect(op).toMatch(/zamknięte.*P-456/);
  });
  test('budżet roli 05 (e3, „Reakcja +1”) = 100 ms z P-456', () => {
    const w = czytaj('docs/architektura/e3-tlo-bledy-prywatnosc-wydajnosc.md').split('\n').find((l) => l.startsWith('| Reakcja +1'));
    expect(w).toMatch(/\| p95 ≤ 100 ms .*P-456/);
  });
});
