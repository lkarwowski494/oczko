/* Przebieg nocny 2/3.11.2026 (polecenie 07 noc, P-400; zadania NOC-1…NOC-6). Struktura jak e2e-kruchosc-139.test.ts: czytamy scenariusze Maestro
 * jako listę kroków (maestro-runner) i pilnujemy kolejności kroków, których brak pada dopiero na symulatorze (macOS). */
import * as fs from 'fs';
import * as path from 'path';
import { kroki, wczytaj } from './maestro-runner';

const KAT = path.join(__dirname, '..', '..', 'e2e/scenariusze');
type Krok = { nazwa: string; arg: any };
const plik = (n: string) => fs.readdirSync(KAT).find((f) => f.startsWith(`${n}-`)) as string;
const lista = (n: string): Krok[] => [...kroki(wczytaj(path.join(KAT, plik(n))).polecenia)].map(({ nazwa, arg }) => ({ nazwa, arg }));
const idy = (k: Krok): string[] => {
  const a = k.arg;
  const id = typeof a === 'object' && a ? (a.id ?? a.element?.id ?? a.visible?.id ?? a.when?.visible?.id ?? a.when?.notVisible?.id) : undefined;
  return typeof id === 'string' ? id.split('|') : [];
};

/* NOC-1 · 66 (P-393, raport M1): po „Replace what’s here” ekran Ustawień jest przewinięty w dół (kroki `scrollUntilVisible import-wynik`), więc „Back” leży nad ekranem
 *       i nie ma go w hierarchii iOS — ten sam wzorzec co scenariusz 08 (E2-138-S1, 08:95). Przed `tapOn nav-wstecz` po `import-wynik` musi stać
 *       `scrollUntilVisible nav-wstecz` w górę (bez `optional`, timeout ≥ 30 s). */
describe('NOC-1 · 66 i 08: „Back” po imporcie wymaga przewinięcia w górę', () => {
  test.each(['08', '66'])('%s: tapOn nav-wstecz po import-wynik poprzedza scrollUntilVisible nav-wstecz w górę', (n) => {
    const l = lista(n);
    const wynik = l.map((k, i) => (k.nazwa === 'scrollUntilVisible' && idy(k).includes('import-wynik') ? i : -1)).filter((i) => i >= 0);
    expect(wynik.length).toBeGreaterThan(0);
    const wstecz = l.findIndex((k, i) => i > wynik[wynik.length - 1] && k.nazwa === 'tapOn' && idy(k).includes('nav-wstecz'));
    expect(wstecz).toBeGreaterThan(-1);
    const przed = l[wstecz - 1];
    expect(przed.nazwa).toBe('scrollUntilVisible');
    expect(idy(przed)).toContain('nav-wstecz');
    expect(String(przed.arg.direction).toUpperCase()).toBe('UP');
    expect(przed.arg.optional).not.toBe(true);
    expect(przed.arg.timeout).toBeGreaterThanOrEqual(30000);
  });
});
