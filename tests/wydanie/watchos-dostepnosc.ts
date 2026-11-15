// Skan źródeł Swift zegarka na API z watchOS 11 (KO-061, BS 2026-11-15). Wzór: Trening `tests/watch-availability.test.ts` (analogia P-087).
// Kompilatora Swift na Linuksie nie ma, więc to prosty skan tekstu; dowodem końcowym jest kompilacja celu z minimum 10.0 w „Jakość · iOS”.
// Użycie API z watchOS 11 musi stać w gałęzi `if #available(watchOS 11, *) { … }` albo w deklaracji z `@available(watchOS 11, *)`.

/** Znane API dostępne dopiero od watchOS 11.0: wersje z dokumentacji Apple (JSON developer.apple.com/tutorials/data/documentation/<ścieżka>.json, `metadata.platforms`), odczyt 2026-11-15;
 * ścieżki w tabeli `OD_WATCHOS_11` w `zegarek-minimum-watchos.test.ts`. Baza: lista Treningu (`tests/watch-availability.test.ts:11`) bez `Previewable` (watchOS 10.0), `ControlWidget` i
 * `RelevanceConfiguration` (watchOS 26.0) + API SwiftUI z recenzji BT (08-programista-001). To lista nazw, nie dane o dostępności: pewność daje kompilacja z minimum 10.0 (`jakosc-ios.yml`).
 * Rozszerzać po sprawdzeniu wersji w dokumentacji Apple. */
export const API_WATCHOS_11 = [
  'handGestureShortcut', 'HandGestureShortcut', 'workoutEffortScore', 'estimatedWorkoutEffortScore',
  'onScrollGeometryChange', 'onScrollVisibilityChange', 'ScrollPosition', 'MeshGradient', 'matchedTransitionSource',
] as const;

const OSLONA = /(?:#available|@available)\s*\(\s*watchOS\s+(?:1[1-9]|[2-9]\d)\b/;

const bezKomentarzy = (src: string): string =>
  src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length));

function koniecNapisu(kod: string, i: number): number {
  if (kod.startsWith('"""', i)) {
    const e = kod.indexOf('"""', i + 3);
    return e < 0 ? kod.length : e + 3;
  }
  let j = i + 1;
  while (j < kod.length && kod[j] !== '"' && kod[j] !== '\n') j += kod[j] === '\\' ? 2 : 1;
  return j + 1;
}

export interface Uzycie { readonly line: number; readonly api: string }

/** Użycia API z watchOS 11 poza osłoną (numer wiersza od 1). Osłona: otaczający blok ma w nagłówku `#available(watchOS 11…` albo `@available(watchOS 11…`; gałąź `else` osłoną nie jest. */
export function nieoslonieteWatchOS11(src: string): Uzycie[] {
  const kod = bezKomentarzy(src);
  const wynik: Uzycie[] = [];
  const stos: boolean[] = [];
  let naglowek = '';
  let line = 1;
  let i = 0;
  const re = new RegExp(`\\b(${API_WATCHOS_11.join('|')})\\b`, 'y');
  while (i < kod.length) {
    const c = kod.charAt(i);
    if (c === '"') {
      const j = koniecNapisu(kod, i);
      line += (kod.slice(i, j).match(/\n/g) ?? []).length;
      naglowek += ' ';
      i = j;
      continue;
    }
    if (c === '{') { stos.push(OSLONA.test(naglowek)); naglowek = ''; i++; continue; }
    if (c === '}') { stos.pop(); naglowek = ''; i++; continue; }
    if (c === ';') { naglowek = ''; i++; continue; }
    if (c === '\n') line++;
    const poprzedni = i === 0 ? '' : kod.charAt(i - 1);
    if (/[A-Za-z_]/.test(c) && (i === 0 || !/[\w.]/.test(poprzedni) || poprzedni === '.')) {
      re.lastIndex = i;
      const m = re.exec(kod);
      if (m?.[1] !== undefined) {
        if (!stos.some(Boolean) && !OSLONA.test(naglowek)) wynik.push({ line, api: m[1] });
        naglowek += m[1];
        i += m[1].length;
        continue;
      }
    }
    naglowek += c;
    i++;
  }
  return wynik;
}
