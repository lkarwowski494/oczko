/* 10-wydanie-003 (recenzja AB, 10.11.2026): `ramki-sklepu.test.ts` pomijał część „działa na PNG w wymiarach ASC” po cichu, gdy na maszynie nie było ImageMagicka (`convert`);
 * `jakosc-linux.yml` i `ci.yml` uruchamiają `npm run verify` bez instalacji ImageMagicka, więc brak narzędzia zniknąłby z wyniku bez porażki (zasada wspólna 21: pominięcie kontroli głośno).
 * Ten test uruchamia tamten plik w osobnym Jest na PATH bez `convert`: w CI (CI=true) ma być czerwony z komunikatem, lokalnie (bez CI) zostaje pominięcie. */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

const korzen = path.join(__dirname, '..', '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bez-convert-'));
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));
fs.symlinkSync(process.execPath, path.join(tmp, 'node')); // PATH tylko z node: ani `convert`, ani `identify`

function jestBezConvert(ci: string | undefined) {
  const env: NodeJS.ProcessEnv = { PATH: tmp, HOME: process.env.HOME, TMPDIR: process.env.TMPDIR };
  if (ci !== undefined) env.CI = ci;
  return spawnSync(process.execPath, [path.join(korzen, 'node_modules/jest/bin/jest.js'), 'tests/wydanie/ramki-sklepu.test.ts', '--no-cache'], { encoding: 'utf8', cwd: korzen, env, timeout: 120000 });
}

describe('ramki-sklepu.test.ts bez ImageMagicka', () => {
  test('w CI (CI=true) brak `convert` = test czerwony z komunikatem o ImageMagick, nie pominięcie', () => {
    const r = jestBezConvert('true');
    expect(r.status).toBe(1);
    expect(r.stdout + r.stderr).toMatch(/ImageMagick/);
  }, 150000);
  test('lokalnie (bez CI) brak `convert` zostaje pominięciem, jak dotąd', () => {
    const r = jestBezConvert(undefined);
    expect(r.status).toBe(0);
    expect(r.stdout + r.stderr).toMatch(/skipped/);
  }, 150000);
});
