/* 10-wydanie-018 (sesja AL, 2026-11-11, KO-041; recenzja AK, przebieg 43035080611; zmiana AQ 2026-11-12, KO-046): pasek stanu iPada pokazywał datę maszyny („Wed 11 Nov”) zamiast daty z danych sceny
 * („Tue 10 Nov” / po polsku), w zestawie pl po angielsku; stderr `simctl status_bar` szedł do /dev/null, a komunikat „kadr bez daty na pasku iPada” był nieprawdziwy (data maszyny zostaje).
 * Linux nie uruchomi simctl: test uruchamia funkcje skryptu z atrapą `xcrun`; właściwy dowód (co przyjmuje simctl na runnerze) to log następnego przebiegu — zob. komentarz przy pasek_stanu. */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

const korzen = path.join(__dirname, '..', '..');
const SKRYPT = 'scripts/ci/zrzuty-sklepu.sh';
const sh = fs.readFileSync(path.join(korzen, SKRYPT), 'utf8');
const funkcja = (nazwa: string): string => {
  const m = new RegExp(`^${nazwa}\\(\\) \\{[\\s\\S]*?^\\}`, 'm').exec(sh);
  if (!m) throw new Error(`brak funkcji ${nazwa} w ${SKRYPT}`);
  return m[0];
};
interface Wynik { status: number | null; out: string; xcrun: string[] }
/** Uruchamia podane funkcje skryptu z atrapą xcrun: zapisuje wywołania, a wywołania pasujące do `odrzuca` kończy kodem 1 z komunikatem na stderr. */
function uruchom(funkcje: string[], wywolanie: string, odrzuca = 'NIGDY'): Wynik {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'oczko-pasek-'));
  const log = path.join(dir, 'xcrun.log');
  const skrypt = `set -uo pipefail; UDID=U; ZRZUTY_TERAZ="2026-11-10T09:41:00"; SKRYPTY="${path.join(korzen, 'scripts/ci')}"
xcrun() { echo "$*" >> "${log}"; case "$*" in *"${odrzuca}"*) echo "Invalid time format (atrapa)" >&2; return 1;; esac; return 0; }
${funkcje.map(funkcja).join('\n')}
${wywolanie}`;
  const r = spawnSync('bash', ['-c', skrypt], { encoding: 'utf8', cwd: korzen });
  return { status: r.status, out: `${r.stdout}${r.stderr}`, xcrun: fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : [] };
}
const czasy = (w: Wynik) => w.xcrun.filter((l) => l.includes('status_bar') && l.includes('override'));

describe('10-wydanie-018: pasek stanu — tylko godzina „9:41” jak Trening (AQ, KO-046), uczciwe komunikaty', () => {
  // AQ (opcja b z P-744, rekomendacja P-750): simctl na runnerze odrzucił każdą formę ISO (`+00:00`, `Z`; joby 130695677975, 130796899562, 130811471544: code=22),
  // więc pasek dostaje samą godzinę jak trening:scripts/ci/store-screenshots.sh:26 (`--time "9:41"`). Data na pasku iPada to data maszyny (spójność dat: zrzuty-data-ipada.test.ts).
  test('jedyny override ma `--time 9:41` (bez próby ISO, bez zera wiodącego jak w Treningu), bez ostrzeżeń, z odczytem `status_bar list` w logu', () => {
    const w = uruchom(['pasek_stanu'], 'pasek_stanu');
    expect(w.status).toBe(0);
    expect(czasy(w)).toHaveLength(1);
    expect(czasy(w)[0]).toMatch(/--time 9:41\s/);
    expect(w.xcrun.join('\n')).not.toMatch(/\d{4}-\d{2}-\d{2}T|\+00:00|09:41/); // żadnej formy ISO ani HH:MM z zerem
    expect(w.out).not.toContain('::warning::');
    expect(w.xcrun.some((l) => /status_bar U list/.test(l))).toBe(true);
  });

  test('godzina pochodzi z ZRZUTY_TERAZ (jedno źródło): 14:05 → `--time 14:05`, 09:41 → `9:41`', () => {
    const w = uruchom(['pasek_stanu'], 'ZRZUTY_TERAZ="2026-11-12T14:05:00"; pasek_stanu');
    expect(czasy(w)[0]).toMatch(/--time 14:05\s/);
  });

  test('simctl odrzuca override: ostrzeżenie niesie stderr simctl i mówi, że godzina i data są z maszyny; bez drugiej próby i bez cichego zjazdu', () => {
    const w = uruchom(['pasek_stanu'], 'pasek_stanu', '--time');
    expect(w.status).toBe(0);
    const ostrz = w.out.split('\n').filter((l) => l.startsWith('::warning::'));
    expect(ostrz).toHaveLength(1);
    expect(ostrz[0]).toMatch(/Invalid time format \(atrapa\)/);
    expect(ostrz[0]).toMatch(/godzin[ęa] i dat[ęa] z maszyny/);
    expect(czasy(w)).toHaveLength(1);
    expect(w.out).not.toContain('kadr bez daty');
  });

  test('język systemu = język danych: pl → defaults write AppleLanguages pl, potem pełny rozruch symulatora i pasek stanu; en → bez zmian i bez rozruchu', () => {
    const pl = uruchom(['pasek_stanu', 'restart_symulatora', 'ustaw_jezyk_systemu'], 'ustaw_jezyk_systemu pl');
    expect(pl.status).toBe(0);
    const i = (re: RegExp) => pl.xcrun.findIndex((l) => re.test(l));
    const [jezyk, shutdown, boot, bootstatus, pasek] = [i(/defaults write -g AppleLanguages -array pl/), i(/simctl shutdown U/), i(/simctl boot U/), i(/simctl bootstatus U -b/), i(/status_bar U override/)];
    for (const [n, p] of Object.entries({ jezyk, shutdown, boot, bootstatus, pasek })) expect([n, p >= 0]).toEqual([n, true]);
    expect(jezyk).toBeLessThan(shutdown); expect(shutdown).toBeLessThan(boot); expect(boot).toBeLessThan(bootstatus); expect(bootstatus).toBeLessThan(pasek);
    const en = uruchom(['pasek_stanu', 'restart_symulatora', 'ustaw_jezyk_systemu'], 'ustaw_jezyk_systemu en');
    expect(en.status).toBe(0);
    expect(en.xcrun).toEqual([]);
  });

  test('nieudany zapis języka systemu: głośne ostrzeżenie (pasek po angielsku), bez rozruchu', () => {
    const w = uruchom(['pasek_stanu', 'restart_symulatora', 'ustaw_jezyk_systemu'], 'ustaw_jezyk_systemu pl', 'AppleLanguages');
    expect(w.status).toBe(0);
    expect(w.out).toMatch(/::warning::[^\n]*pasek stanu iPada będzie miał datę po angielsku/);
    expect(w.xcrun.some((l) => /simctl shutdown/.test(l))).toBe(false);
  });

  test('ustaw_region zostawia fiksturę po angielsku (AppleLanguages en: teksty 00-przygotuj), a pętla woła ustaw_jezyk_systemu po przygotuj_dane i przed 00-jezyk', () => {
    expect(funkcja('ustaw_region')).toMatch(/AppleLanguages -array en/);
    const petla = sh.slice(sh.indexOf('for JEZ in'));
    const [dane, jezykSys, jezykApp] = [petla.indexOf('przygotuj_dane "$KLUCZ"'), petla.indexOf('ustaw_jezyk_systemu "$KLUCZ"'), petla.indexOf('maestro_run 00-jezyk')];
    for (const [n, p] of Object.entries({ dane, jezykSys, jezykApp })) expect([n, p >= 0]).toEqual([n, true]);
    expect(dane).toBeLessThan(jezykSys); expect(jezykSys).toBeLessThan(jezykApp);
  });

  test('każdy plik danych zrzutów ma pole „jezyk” zgodne z regionem (pl_PL → pl, en_US → en)', () => {
    const kat = path.join(korzen, 'e2e/zrzuty-sklepu/dane');
    for (const f of fs.readdirSync(kat).filter((x) => x.endsWith('.json'))) {
      const d = JSON.parse(fs.readFileSync(path.join(kat, f), 'utf8')) as { region?: string; jezyk?: string };
      expect([f, d.jezyk]).toEqual([f, String(d.region).split('_')[0]]);
    }
  });
});
