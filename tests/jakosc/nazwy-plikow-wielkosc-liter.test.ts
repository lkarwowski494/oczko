// P-632: na macOS (system plików bez rozróżniania wielkości liter) `src/ekrany/Liczba.tsx` i `src/ekrany/liczba.ts` to ten sam plik —
// `tsc` w TestFlight (run 42676305451) padł TS1261/TS2305, choć na Linuksie verify był zielony. Żadne dwie ścieżki w repo nie mogą różnić się tylko wielkością liter — także po odcięciu rozszerzenia modułu (import `./Liczba` bez rozszerzenia).
import { execFileSync } from 'node:child_process';

test('ścieżki w repo nie różnią się tylko wielkością liter (macOS, P-632)', () => {
  const pliki = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean);
  const widziane = new Map<string, string>();
  const kolizje: string[] = [];
  for (const p of pliki) {
    const rdzen = p.replace(/\.(d\.ts|tsx?|jsx?|mjs|cjs)$/, ''); // ścieżka modułu bez rozszerzenia
    const inny = widziane.get(rdzen.toLowerCase());
    if (inny !== undefined && inny !== rdzen) kolizje.push(`${inny} ⇔ ${p}`);
    else widziane.set(rdzen.toLowerCase(), rdzen);
  }
  expect(kolizje).toEqual([]);
});
