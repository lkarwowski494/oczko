/* 07-jakosc-002 (JAK-17, P2; KO-054): `.github/scripts/jakosc/maestro-failures.py` przy kroku przerwanym awarią sterownika (status RUNNING
 * w commands.json, junit z DeviceUnreachableException; „Jakość · iOS” #173 i #182) wypisywał „brak nieudanych kroków”. Ma wypisać nazwę
 * przerwanego kroku i przyczynę z junit (`<katalog>.xml` obok katalogu --test-output-dir). Fikstury: tests/jakosc/dane/e2e-awaria-maszyny/. */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

const KORZEN = path.join(__dirname, '..', '..');
const SKRYPT = path.join(KORZEN, '.github', 'scripts', 'jakosc', 'maestro-failures.py');
const FIKSTURY = path.join(__dirname, 'dane', 'e2e-awaria-maszyny');
const N = '01-nfr-pie-001-pierwsze-liczenie';

/** Układ jak w jakosc-ios.yml: e2e-out/<n>/<data>/<przepływ>/commands-*.json i e2e-out/<n>.xml. */
function uklad(polecenia: unknown, junit?: string) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'maestro-failures-'));
  const przeplyw = path.join(d, 'e2e-out', N, '2026-11-12_103341', 'NFR-PIE-001');
  fs.mkdirSync(przeplyw, { recursive: true });
  fs.writeFileSync(path.join(przeplyw, 'commands-NFR-PIE-001.json'), JSON.stringify(polecenia));
  if (junit) fs.copyFileSync(path.join(FIKSTURY, junit), path.join(d, 'e2e-out', `${N}.xml`));
  const r = spawnSync('python3', [SKRYPT, path.join('e2e-out', N)], { cwd: d, encoding: 'utf8' });
  return { kod: r.status, wyjscie: r.stdout + r.stderr };
}
const przerwany = () => JSON.parse(fs.readFileSync(path.join(FIKSTURY, 'commands-przerwany.json'), 'utf8')) as { command: unknown; metadata: { status: string; error?: unknown } }[];

describe('07-jakosc-002 · maestro-failures.py: krok przerwany awarią sterownika', () => {
  test('krok RUNNING + junit z DeviceUnreachableException (#182) → nazwa przerwanego kroku i przyczyna, bez „brak nieudanych kroków”', () => {
    const r = uklad(przerwany(), 'junit-device-unreachable.xml');
    expect(r.kod).toBe(0);
    expect(r.wyjscie).not.toMatch(/brak nieudanych kroków/);
    expect(r.wyjscie).toMatch(/krok 3\/3 przerwany/);
    expect(r.wyjscie).toMatch(/PRZERWANY: [^\n]*tapOnElement[^\n]*dzis-plus/);
    expect(r.wyjscie).toContain('przyczyna (junit): maestro.DeviceUnreachableException: Device became unreachable during deviceInfo');
  });

  test('krok RUNNING bez pliku junit → nazwa przerwanego kroku i informacja o braku junit', () => {
    const r = uklad(przerwany());
    expect(r.wyjscie).not.toMatch(/brak nieudanych kroków/);
    expect(r.wyjscie).toMatch(/PRZERWANY: [^\n]*dzis-plus/);
    expect(r.wyjscie).toMatch(/przyczyna \(junit\): brak pliku/);
  });

  test('regresja: krok FAILED nadal wypisany z błędem; same COMPLETED bez junit → „brak nieudanych kroków”', () => {
    const p = przerwany(); p[2].metadata = { status: 'FAILED', error: { message: 'Assertion is false: "2", id: licznik-wartosc is visible' } };
    const r = uklad(p, 'junit-asercja.xml');
    expect(r.wyjscie).toMatch(/FAILED: [^\n]*dzis-plus/);
    expect(r.wyjscie).toContain('błąd: Assertion is false');
    const z = przerwany(); z[2].metadata = { status: 'COMPLETED' };
    expect(uklad(z).wyjscie).toMatch(/brak nieudanych kroków/);
  });
});
