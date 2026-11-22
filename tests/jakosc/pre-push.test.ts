/* P-260: hook `pre-push` uruchamia verify przed każdym pushem na gałąź roboczą; gałęzie kopii (P-244, także kod niesprawdzony)
 * są pominięte. Hook włącza `npm ci` (skrypt `prepare` ustawia core.hooksPath). Uruchamiany tu z udawanym `npm`. */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

const KORZEN = path.join(__dirname, '..', '..');
const HOOK = path.join(KORZEN, '.githooks', 'pre-push');
const ZERO = '0000000000000000000000000000000000000000';

function push(refy: string[], kodNpm = 0) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'pre-push-'));
  const log = path.join(d, 'npm.log');
  fs.writeFileSync(path.join(d, 'npm'), `#!/bin/sh\necho "$@" >> "${log}"\nexit ${kodNpm}\n`, { mode: 0o755 });
  const wejscie = refy.map((r) => `refs/heads/x ${'a'.repeat(40)} refs/heads/${r} ${ZERO}`).join('\n') + '\n';
  const w = spawnSync('sh', [HOOK, 'origin', 'url'], { input: wejscie, encoding: 'utf8', env: { ...process.env, PATH: `${d}:${process.env.PATH}` } });
  return { kod: w.status, npm: fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : '' };
}

describe('pre-push (P-260)', () => {
  it('istnieje i jest wykonywalny', () => {
    expect(fs.statSync(HOOK).mode & 0o111).not.toBe(0);
  });
  it('push na gałąź roboczą uruchamia verify; czerwony verify blokuje push', () => {
    expect(push(['claude/jolly-thompson-paz6d8'])).toEqual({ kod: 0, npm: 'run verify\n' });
    expect(push(['claude/jolly-thompson-paz6d8'], 1).kod).not.toBe(0);
  });
  it('push tylko na gałęzie kopii pomija verify', () => {
    expect(push(['claude/kopia-partia-6', 'claude/kopia-partia-7'])).toEqual({ kod: 0, npm: '' });
  });
  it('kopia razem z roboczą nie pomija verify', () => {
    expect(push(['claude/kopia-partia-6', 'claude/jolly-thompson-paz6d8']).npm).toBe('run verify\n');
  });
  it('npm ci włącza hook (prepare ustawia core.hooksPath)', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(KORZEN, 'package.json'), 'utf8'));
    expect(pkg.scripts.prepare).toMatch(/core\.hooksPath \.githooks/);
  });
});
