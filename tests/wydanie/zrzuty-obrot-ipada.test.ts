/* Zrzuty sklepu na iPadzie: sceny poziome 03 i 04 padały w run 43017044972 (zrzuty-sklepu.yml, 90840cc), bo po `launchctl kickstart -k SpringBoard`
 * (013, funkcja ustaw_region) SpringBoard nie obracał aplikacji: dziennik jobu iPada en 03-wzor-1 ma „Device orientation is 3” bez „Did set interfaceOrientation[3]”,
 * a zielony C1 (19cbcc4) miał „Did set interfaceOrientation[3]” i zrzut 2752×2064. Drugi, osobny skutek 016: `status_bar override --time <ISO>` dawał ostrzeżenie
 * „Nie udało się ustawić paska stanu” (zrzut z godziną maszyny 12:54), zielony C1 używał „9:41”.
 * Test sprawdza skrypt (Linux nie uruchomi simctl); właściwy dowód to przebieg C3 na macOS. Plan i przyczyna: docs/wydanie/metadane/zrzuty-plan.md, „Stan AI”. */
import * as fs from 'fs';
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
const bezKomentarzy = (kod: string): string => kod.split('\n').map((l) => l.replace(/\s+#.*$/, '')).filter((l) => !l.trimStart().startsWith('#')).join('\n');

describe('zrzuty sklepu: region symulatora nie psuje obrotu iPada (sceny 03, 04)', () => {
  test('skrypt przechodzi `bash -n` (składnia)', () => {
    const r = spawnSync('bash', ['-n', SKRYPT], { encoding: 'utf8', cwd: korzen });
    expect([r.status, r.stderr]).toEqual([0, '']);
  });
  test('ustaw_region nie restartuje SpringBoard (po tym SpringBoard nie obracał aplikacji do poziomu)', () => {
    const kod = bezKomentarzy(sh);
    expect(kod).not.toMatch(/kickstart/);
    expect(kod).not.toMatch(/com\.apple\.SpringBoard/);
  });
  test('ustaw_region zapisuje region i format godziny, potem woła restart_symulatora, który robi pełny rozruch (shutdown, boot, czekanie na bootstatus), wygląd jasny i pasek stanu', () => {
    const r = bezKomentarzy(funkcja('ustaw_region'));
    expect(r.search(/defaults write -g AppleICUForce24HourTime/)).toBeGreaterThanOrEqual(0);
    expect(r.search(/defaults write -g AppleICUForce24HourTime/)).toBeLessThan(r.search(/\brestart_symulatora\b/));
    const f = bezKomentarzy(funkcja('restart_symulatora'));
    const i = (re: RegExp): number => f.search(re);
    const [shutdown, boot, status, jasny, pasek] = [i(/simctl shutdown "\$UDID"/), i(/simctl boot "\$UDID"/), i(/simctl bootstatus "\$UDID" -b/), i(/simctl ui "\$UDID" appearance light/), i(/\bpasek_stanu\b/)];
    for (const [nazwa, poz] of Object.entries({ shutdown, boot, status, jasny, pasek })) expect([nazwa, poz >= 0]).toEqual([nazwa, true]);
    expect(shutdown).toBeLessThan(boot); expect(boot).toBeLessThan(status);
    expect(status).toBeLessThan(jasny); expect(jasny).toBeLessThan(pasek);
  });
  test('pasek stanu: powrót do godziny HH:MM z ZRZUTY_TERAZ jest głośny (::warning:: przed drugą próbą), a nieudana druga próba daje osobne ostrzeżenie; brak cichego zjazdu', () => {
    const f = funkcja('pasek_stanu');
    const iso = f.indexOf('override --time "$iso"');
    const ostrz1 = f.indexOf('::warning::Pasek stanu: forma ISO');
    const hhmm = f.indexOf('override --time "${ZRZUTY_TERAZ:11:5}"');
    const ostrz2 = f.indexOf('::warning::Nie udało się ustawić paska stanu');
    for (const [n, p] of Object.entries({ iso, ostrz1, hhmm, ostrz2 })) expect([n, p >= 0]).toEqual([n, true]);
    expect(iso).toBeLessThan(ostrz1); expect(ostrz1).toBeLessThan(hhmm); expect(hhmm).toBeLessThan(ostrz2);
  });
  test('pasek_stanu (uruchomiony z atrapą xcrun): ISO ok → bez ostrzeżenia; ISO odrzucone → ostrzeżenie i HH:MM; oba odrzucone → dwa ostrzeżenia', () => {
    const wywolaj = (odrzuca: string): string => {
      const skrypt = `set -uo pipefail; UDID=U; ZRZUTY_TERAZ="2026-11-10T09:41:00"
xcrun() { case "$*" in *"--time ${odrzuca}"*) return 1;; esac; return 0; }
${funkcja('pasek_stanu')}
pasek_stanu`;
      const r = spawnSync('bash', ['-c', skrypt], { encoding: 'utf8', cwd: korzen });
      expect(r.status).toBe(0);
      return r.stdout;
    };
    expect(wywolaj('NIGDY')).not.toContain('::warning::');
    expect(wywolaj('2026')).toMatch(/^::warning::Pasek stanu: forma ISO \(2026-11-10T09:41:00Z\) odrzucona[^\n]*ustawiam samą godzinę 09:41/);
    expect(wywolaj('2026')).not.toMatch(/Nie udało się/);
    expect(wywolaj('').match(/::warning::/g)).toHaveLength(2);
  });
  test('zestaw nie jest zmniejszony: iPad i obie orientacje zostają (ORIENT_WZOR iPada poziomo)', () => {
    expect(sh).toMatch(/ipad\)\s+ROZMIAR="ipad-13"; ORIENT_WZOR="LANDSCAPE_LEFT"/);
    expect(sh).toMatch(/iphone\)\s+ROZMIAR="6\.9"; ORIENT_WZOR="PORTRAIT"/);
  });
});
