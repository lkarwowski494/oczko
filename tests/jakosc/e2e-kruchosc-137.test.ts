/* E2-137-S1 · przebieg „Jakość · iOS” #137 (run 41384277056, SHA 706eea4, 2026-11-02): okno „Uczciwe zasady” otwiera się jako trasa modalna NAD listą projektów
 * (`router.push('/uczciwe-zasady')`, app/projekty.tsx:27-31; app/_layout.tsx:93 `presentation: 'modal'`); przy otwartym oknie hierarchia zawiera tylko okno (zrzuty kroków 54/63/75 scenariuszy 20/36/05:
 * `okno-uczciwe-zasady`, `uczciwe-zasady-zamknij`), więc asercja „lista widoczna” PRZED zamknięciem okna nie może się spełnić. Poprawka #136 (c54a222) miała kolejność odwrotną. */
import * as fs from 'fs';
import * as path from 'path';
import { kroki, wczytaj } from './maestro-runner';

const KAT = path.join(__dirname, '..', '..', 'e2e/scenariusze');
type Krok = { nazwa: string; arg: any };
const lista = (plik: string): Krok[] => [...kroki(wczytaj(path.join(KAT, plik)).polecenia)].map(({ nazwa, arg }) => ({ nazwa, arg }));
const idy = (k: Krok): string[] => {
  const id = typeof k.arg === 'object' && k.arg ? (k.arg.id ?? k.arg.element?.id ?? k.arg.visible?.id ?? k.arg.when?.visible?.id ?? k.arg.when?.notVisible?.id) : undefined;
  return typeof id === 'string' ? id.split('|') : [];
};
const jestRestartem = (k: Krok) => k.nazwa === 'runFlow' && String(k.arg?.file ?? '').endsWith('restart.yaml');
const plik = (n: string) => fs.readdirSync(KAT).find((f) => f.startsWith(`${n}-`)) as string;
const LISTA = ['projekty-lista', 'projekty-kosz', 'projekty-dni-darmowe'];

describe('E2-137-S1 · okno „Uczciwe zasady” zasłania listę projektów (BR-ZAK-006/S9)', () => {
  for (const n of ['05', '20', '36']) {
    test(`scenariusz ${n}: po restarcie wejście w Projekty czeka na okno LUB listę, zamyka okno, dopiero potem wymaga listy`, () => {
      const l = lista(plik(n));
      const r = l.findIndex(jestRestartem);
      expect(r).toBeGreaterThan(-1);
      const wej = l.findIndex((k, i) => i > r && k.nazwa === 'tapOn' && idy(k).includes('nav-projekty'));
      expect(wej).toBeGreaterThan(-1);
      const zam = l.findIndex((k, i) => i > wej && k.nazwa === 'tapOn' && idy(k).includes('uczciwe-zasady-zamknij'));
      expect(zam).toBeGreaterThan(wej);
      expect(l[zam].arg.optional).toBe(true);
      // Każda asercja między wejściem a zamknięciem okna, która wymaga listy, musi dopuszczać okno (inaczej czeka na element zasłonięty modalem).
      for (const k of l.slice(wej + 1, zam)) {
        if (!['assertVisible', 'extendedWaitUntil'].includes(k.nazwa) || k.arg?.optional) continue;
        const w = idy(k);
        if (w.some((x) => LISTA.includes(x))) expect(w).toContain('okno-uczciwe-zasady');
      }
      // Przed zamknięciem jest co najmniej jedno czekanie, które widzi okno albo listę (sprzężenie z ekranem po nav-projekty).
      expect(l.slice(wej + 1, zam).some((k) => k.nazwa === 'extendedWaitUntil' && idy(k).includes('okno-uczciwe-zasady') && idy(k).some((x) => LISTA.includes(x)))).toBe(true);
      // Okno bywa otwierane po wyrenderowaniu listy (efekt po odczycie `pokazacOknoUczciweZasady`): opcjonalne czekanie na okno przed zamknięciem.
      expect(l.slice(wej + 1, zam).some((k) => k.nazwa === 'extendedWaitUntil' && k.arg?.optional === true && idy(k).join() === 'okno-uczciwe-zasady')).toBe(true);
      // Po zamknięciu twarda asercja listy.
      const po = l.slice(zam + 1).find((k) => ['assertVisible', 'extendedWaitUntil'].includes(k.nazwa));
      expect(po && idy(po).some((x) => LISTA.includes(x))).toBe(true);
      expect(po && idy(po)).not.toContain('okno-uczciwe-zasady');
    });
  }
});

