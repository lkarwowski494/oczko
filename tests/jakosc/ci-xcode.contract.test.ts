/* Kontrakt runner ↔ narzędzia CI iOS (P-313, JAK-18, zasada wspólna 21): wybór Xcode ma paść głośno, a nie po cichu zjechać do starszej wersji.
 * Dlaczego: SDK 56 wymaga Xcode 26.4+, App Store Connect przyjmuje buildy tylko z Xcode 26+, a obraz `macos-26` ma kilka wersji obok siebie
 * (dowiązania, wersje beta, niewersjonowany `Xcode.app`). Skrypt `.github/scripts/jakosc/select-xcode.sh` przyjmuje `APPS_DIR` i `DRY_RUN=1`,
 * więc jego decyzję sprawdzamy na sztucznym katalogu aplikacji — bez macOS. Pomysł z `main` 91c5d8d (DEC-35), przepisany pod ścieżki i
 * workflowy tej gałęzi; testy workflowów czytają wszystkie pliki `.github/workflows/*.yml`, nie jeden.
 */
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { YAML } from './maestro-runner';

const ROOT = path.join(__dirname, '..', '..');
const SKRYPT = path.join(ROOT, '.github/scripts/jakosc/select-xcode.sh');
const KATALOG_WORKFLOWOW = path.join(ROOT, '.github/workflows');

type Wpis = string | { dowiazanie: string; do: string };
type Wynik = { kod: number; wyjscie: string };

/** Uruchamia skrypt na tymczasowym katalogu aplikacji: wpis tekstowy = katalog `<nazwa>`, obiekt = dowiązanie symboliczne. */
function uruchom(wpisy: Wpis[], major?: string): Wynik {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xcode-kontrakt-'));
  try {
    for (const w of wpisy) {
      if (typeof w === 'string') fs.mkdirSync(path.join(dir, w));
      else fs.symlinkSync(w.do, path.join(dir, w.dowiazanie)); // względny cel, jak /Applications/Xcode_26.6.0.app → Xcode_26.6.app
    }
    const argumenty = major === undefined ? [SKRYPT] : [SKRYPT, major];
    try {
      const wyjscie = execFileSync('bash', argumenty, {
        env: { ...process.env, APPS_DIR: dir, DRY_RUN: '1' },
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      return { kod: 0, wyjscie };
    } catch (e) {
      const b = e as { status?: number; stdout?: string; stderr?: string };
      return { kod: b.status ?? -1, wyjscie: `${b.stdout ?? ''}${b.stderr ?? ''}` };
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
const wybrany = (w: Wynik): string | null => /Wybrany Xcode: (\S+) \(/.exec(w.wyjscie)?.[1] ?? null;

describe('P-313 · select-xcode.sh · wybór wersji', () => {
  test('wybiera najnowszy zainstalowany 26.x i ignoruje inne wersje główne', () => {
    const w = uruchom(['Xcode_26.4.1.app', 'Xcode_26.6.app', 'Xcode_26.5.app', 'Xcode_16.4.app', 'Xcode_27.0.app']);
    expect(w.kod).toBe(0);
    expect(wybrany(w)).toBe('26.6');
  });

  test('porównuje wersje liczbowo, nie alfabetycznie (26.10 jest nowszy niż 26.9)', () => {
    const w = uruchom(['Xcode_26.9.app', 'Xcode_26.10.app', 'Xcode_26.2.app']);
    expect(w.kod).toBe(0);
    expect(wybrany(w)).toBe('26.10');
  });

  test('wersja z trzecią liczbą wygrywa z krótszą o tym samym początku (26.6.1 > 26.6)', () => {
    const w = uruchom(['Xcode_26.6.app', 'Xcode_26.6.1.app']);
    expect(wybrany(w)).toBe('26.6.1');
  });

  test('pomija dowiązania symboliczne (obraz runnera: Xcode_26.6.0.app → Xcode_26.6.app), więc wybiera katalog docelowy', () => {
    const w = uruchom(['Xcode_26.4.1.app', 'Xcode_26.6.app', { dowiazanie: 'Xcode_26.7.0.app', do: 'Xcode_26.6.app' }, { dowiazanie: 'Xcode_26.4.app', do: 'Xcode_26.4.1.app' }]);
    expect(w.kod).toBe(0);
    expect(wybrany(w)).toBe('26.6'); // 26.7.0 to tylko dowiązanie — gdyby je wziąć, wybór wskazywałby nieistniejącą wersję 26.7.0
  });

  test('pomija wersje beta i RC (nazwa z sufiksem), nawet gdy są nowsze', () => {
    const w = uruchom(['Xcode_26.6.app', 'Xcode_26.7_beta.app', 'Xcode_26.7_RC.app', 'Xcode_26.8_beta_2.app']);
    expect(w.kod).toBe(0);
    expect(wybrany(w)).toBe('26.6');
  });

  test('wersja główna 26 nie łapie 260 ani 2.6 (dopasowanie całej liczby głównej)', () => {
    const w = uruchom(['Xcode_260.app', 'Xcode_2.6.app', 'Xcode_26.1.app']);
    expect(wybrany(w)).toBe('26.1');
  });

  test('argument skryptu zmienia wersję główną (27 wybiera 27.x, nie 26.x)', () => {
    const w = uruchom(['Xcode_26.6.app', 'Xcode_27.0.app', 'Xcode_27.1.app'], '27');
    expect(wybrany(w)).toBe('27.1');
  });

  test('bez argumentu domyślnie 26', () => {
    const w = uruchom(['Xcode_26.3.app', 'Xcode_27.0.app']);
    expect(wybrany(w)).toBe('26.3');
  });
});

describe('P-313 · select-xcode.sh · pada głośno, bez cichego zjazdu', () => {
  test('sam niewersjonowany Xcode.app (+ starszy) → kod 1, komunikat błędu i lista dostępnych, bez „Wybrany Xcode”', () => {
    const w = uruchom(['Xcode.app', 'Xcode_15.4.app']);
    expect(w.kod).toBe(1);
    expect(w.wyjscie).toContain('Brak Xcode 26.x');
    expect(w.wyjscie).toContain('Xcode_15.4.app'); // lista dostępnych pomaga w diagnozie
    expect(w.wyjscie).not.toContain('Wybrany Xcode');
  });

  test('pusty katalog aplikacji → kod 1 z komunikatem „żadnego”', () => {
    const w = uruchom([]);
    expect(w.kod).toBe(1);
    expect(w.wyjscie).toContain('Brak Xcode 26.x');
    expect(w.wyjscie).toContain('(żadnego)');
  });

  test('tylko dowiązania i bety wersji 26 (żadnej prawdziwej) → kod 1', () => {
    const w = uruchom(['Xcode-poza-wzorcem', 'Xcode_26.7_beta.app', { dowiazanie: 'Xcode_26.4.app', do: 'Xcode-poza-wzorcem' }], '26');
    expect(w.kod).toBe(1);
    expect(w.wyjscie).toContain('Brak Xcode 26.x');
  });

  test('prośba o wersję główną, której nie ma na obrazie (28), pada zamiast wybrać najbliższą', () => {
    const w = uruchom(['Xcode_26.6.app', 'Xcode_27.0.app'], '28');
    expect(w.kod).toBe(1);
    expect(w.wyjscie).toContain('Brak Xcode 28.x');
  });
});

// --- workflowy ---------------------------------------------------------------------------------------------------------------------------

type Zadanie = { 'runs-on'?: unknown; 'continue-on-error'?: unknown; steps?: { name?: string; run?: string; 'continue-on-error'?: unknown }[] };
const pliki = fs.readdirSync(KATALOG_WORKFLOWOW).filter((f) => /\.ya?ml$/.test(f)).sort();
const tekstWorkflowu = (f: string): string => fs.readFileSync(path.join(KATALOG_WORKFLOWOW, f), 'utf8');
function zadania(f: string): Record<string, Zadanie> {
  const w: unknown = YAML.parse(tekstWorkflowu(f));
  if (typeof w !== 'object' || w === null || !('jobs' in w)) throw new Error(`${f}: workflow bez jobs`);
  return (w as { jobs: Record<string, Zadanie> }).jobs; // dane z repo, nie z zewnątrz
}
/** Zadania na macOS: `runs-on` zaczyna się od `macos` (napis albo pierwszy element listy). */
const naMacos = (z: Zadanie): boolean => {
  const r = Array.isArray(z['runs-on']) ? z['runs-on'][0] : z['runs-on'];
  return typeof r === 'string' && /^macos/.test(r);
};
const zadaniaMacos = pliki.flatMap((f) => Object.entries(zadania(f)).filter(([, z]) => naMacos(z)).map(([id, z]) => ({ f, id, z })));

describe('P-313 · workflowy · runner macOS', () => {
  test('istnieją zadania na macOS (kontrola nie jest pusta)', () => {
    expect(zadaniaMacos.length).toBeGreaterThanOrEqual(5); // jakosc-ios: swift-test, eksperymenty, build, e2e; testflight: build
    expect(pliki.length).toBeGreaterThanOrEqual(5);
  });

  test('każde `runs-on: macos*` we wszystkich workflowach to dokładnie `macos-26`', () => {
    const zle = zadaniaMacos.filter(({ z }) => (Array.isArray(z['runs-on']) ? z['runs-on'][0] : z['runs-on']) !== 'macos-26').map(({ f, id }) => `${f}:${id}`);
    expect(zle).toEqual([]);
  });

  test.each(pliki)('%s: żadna wersja macOS poza `macos-26` nie występuje nigdzie w pliku (macierze, zmienne, latest)', (f) => {
    const bezKomentarzy = tekstWorkflowu(f).split('\n').filter((l) => !/^\s*#/.test(l)).map((l) => l.replace(/\s#\s.*$/, '')).join('\n');
    const obce = [...bezKomentarzy.matchAll(/\bmacos-(?!26\b)[\w.]+/g)].map((m) => m[0]);
    expect(obce).toEqual([]);
  });

  test.each(zadaniaMacos.map((x) => [`${x.f}:${x.id}`, x] as const))('%s: zadanie macOS wybiera Xcode 26 skryptem (`select-xcode.sh 26`) bez `|| true` i bez `continue-on-error`', (_nazwa, { z }) => {
    const wybory = (z.steps ?? []).filter((s) => typeof s.run === 'string' && /select-xcode\.sh/.test(s.run));
    expect(wybory.length).toBeGreaterThanOrEqual(1);
    for (const s of wybory) {
      expect(s.run).toMatch(/select-xcode\.sh 26\b/);
      expect(s.run).not.toMatch(/select-xcode\.sh\s+(1\d|2[0-5])\b/);
      expect(s.run).not.toMatch(/select-xcode\.sh[^\n&|;]*\|\|/); // brak fallbacku: `… || true`, `… || xcode-select …`
      expect(s['continue-on-error']).toBeUndefined();
    }
  });

  // Nazwany wyjątek (zasada wspólna 7): `eksperymenty-wzoru` (W1–W3) jest INFORMACYJNE z założenia — komentarz w workflowie, wynik w podsumowaniu.
  // Każde inne zadanie macOS z `continue-on-error: true` zasłaniałoby cichą porażkę wyboru Xcode, więc lista jest zamknięta: nowe wymaga zmiany tego testu.
  const INFORMACYJNE = ['jakosc-ios.yml:eksperymenty-wzoru'];
  test('zadania macOS z `continue-on-error: true` to dokładnie lista informacyjnych (nowe zadanie nie wycisza siatki bezpieczeństwa po cichu)', () => {
    const ciche = zadaniaMacos.filter(({ z }) => z['continue-on-error'] === true).map(({ f, id }) => `${f}:${id}`).sort();
    expect(ciche).toEqual(INFORMACYJNE);
  });

  test('wszystkie wywołania skryptu w workflowach wskazują ten sam plik, który testujemy', () => {
    const wywolania = pliki.flatMap((f) => tekstWorkflowu(f).split('\n').filter((l) => !/^\s*#/.test(l) && /select-xcode\.sh/.test(l)).map((l) => `${f}: ${l.trim()}`));
    expect(wywolania.length).toBeGreaterThanOrEqual(5);
    expect(wywolania.filter((l) => !l.includes('bash .github/scripts/jakosc/select-xcode.sh 26'))).toEqual([]);
    expect(fs.existsSync(SKRYPT)).toBe(true);
  });
});
