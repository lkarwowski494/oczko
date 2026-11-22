/* Ciemny motyw w E2E (ustalenie 04-002, P1: żaden scenariusz nie ustawia ciemnego motywu). Krok „Symulator” w jakosc-ios.yml ustawia wygląd
 * symulatora `xcrun simctl ui <sim> appearance dark`, gdy treść commitu (albo wejście `znacznik` ręcznego przebiegu) zawiera „[e2e-ciemny]”;
 * bez znacznika wymusza jasny, żeby bramka była powtarzalna. Fragment kroku uruchamiany tu w bashu z udawanym `xcrun` (Linux). */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { parse, yamlKroki } from './jakosc-ios-pomoc';

const wf = parse(fs.readFileSync(path.join(__dirname, '..', '..', '.github/workflows/jakosc-ios.yml'), 'utf8'));
const symulator = yamlKroki(wf, 'e2e').find((k) => k.name === 'Symulator');
const fragment = (): string => {
  const run = symulator?.run ?? '';
  const a = run.indexOf('# MOTYW-POCZĄTEK'), b = run.indexOf('# MOTYW-KONIEC');
  if (a < 0 || b < a) throw new Error('brak fragmentu MOTYW w kroku Symulator');
  return run.slice(a, b);
};

function uruchom(commitMsg: string): string[] {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-ciemny-'));
  const bin = path.join(d, 'bin'); fs.mkdirSync(bin);
  const log = path.join(d, 'xcrun.log');
  fs.writeFileSync(path.join(bin, 'xcrun'), `#!/bin/bash\necho "$@" >> "${log}"\n`, { mode: 0o755 });
  fs.writeFileSync(path.join(d, 'summary.md'), '');
  const r = spawnSync('bash', ['-e', '-c', fragment()], {
    encoding: 'utf8',
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, DEV: 'SIM-1', COMMIT_MSG: commitMsg, GITHUB_STEP_SUMMARY: path.join(d, 'summary.md') },
  });
  expect(r.status).toBe(0);
  return fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n') : [];
}

describe('jakosc-ios.yml: ciemny motyw w E2E (04-002)', () => {
  test('znacznik [e2e-ciemny] w treści commitu: simctl ui appearance dark', () => {
    expect(uruchom('Zmiana testów [e2e-ciemny]')).toEqual(['simctl ui SIM-1 appearance dark']);
  });
  test('bez znacznika: jasny, powtarzalnie', () => {
    expect(uruchom('Zmiana testów [e2e-pelny]')).toEqual(['simctl ui SIM-1 appearance light']);
  });
  test('krok ustawia wygląd po starcie symulatora, a przed instalacją aplikacji', () => {
    const run = symulator?.run ?? '';
    expect(run.indexOf('bootstatus')).toBeLessThan(run.indexOf('# MOTYW-POCZĄTEK'));
    expect(run.indexOf('# MOTYW-KONIEC')).toBeLessThan(run.indexOf('simctl install'));
    expect(symulator?.env?.COMMIT_MSG).toMatch(/head_commit\.message/);
  });
});
