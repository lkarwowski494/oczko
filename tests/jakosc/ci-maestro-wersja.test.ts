/* 044 · wersja Maestro przypięta jedną zmienną (DS-07, zasada wspólna 21: wybór wersji narzędzia w CI pada głośno; 07-jakosc-005).
 * Krok „Maestro” zadania e2e w jakosc-ios.yml uruchamiamy w bashu na Linuksie z atrapą `curl` (instalator nie idzie do sieci):
 * pusta zmienna → błąd przed instalacją; ustawiona → ta wersja w podsumowaniu; instalator, który zignorował zmienną → błąd. */
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, chmodSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parse, yamlKroki } from './jakosc-ios-pomoc';

const WF = readFileSync(join(__dirname, '../../.github/workflows/jakosc-ios.yml'), 'utf8');
const krok = yamlKroki(parse(WF), 'e2e').find((k) => k.name === 'Maestro');
const WERSJA = /^\d+\.\d+\.\d+$/;

/** Uruchamia `run` kroku z atrapą instalatora. `wersjaInstalatora`: co instaluje atrapa (domyślnie: zmienną albo „najnowszą” 2.99.0, jak get.maestro.mobile.dev). */
function uruchomKrok(run: string, maestroVersion: string | undefined, instalator = 'echo "${MAESTRO_VERSION:-2.99.0}"') {
  const k = mkdtempSync(join(tmpdir(), 'maestro-krok-'));
  mkdirSync(join(k, 'bin'));
  writeFileSync(join(k, 'instalator.sh'), `mkdir -p "$HOME/.maestro/bin"\nv=$(${instalator})\nprintf '#!/bin/sh\\necho %s\\n' "$v" > "$HOME/.maestro/bin/maestro"\nchmod +x "$HOME/.maestro/bin/maestro"\n`);
  writeFileSync(join(k, 'bin/curl'), `#!/bin/sh\ncat "${join(k, 'instalator.sh')}"\n`);
  chmodSync(join(k, 'bin/curl'), 0o755);
  const env: NodeJS.ProcessEnv = { ...process.env, PATH: `${join(k, 'bin')}:${process.env.PATH}`, HOME: k, GITHUB_PATH: join(k, 'path'), GITHUB_STEP_SUMMARY: join(k, 'podsumowanie') };
  delete env.MAESTRO_VERSION;
  if (maestroVersion !== undefined) env.MAESTRO_VERSION = maestroVersion;
  const w = spawnSync('bash', ['-e', '-c', run], { env, encoding: 'utf8' });
  const podsumowanie = existsSync(join(k, 'podsumowanie')) ? readFileSync(join(k, 'podsumowanie'), 'utf8') : '';
  return { kod: w.status, wyjscie: `${w.stdout}${w.stderr}`, podsumowanie, zainstalowano: existsSync(join(k, '.maestro/bin/maestro')) };
}

describe('044 · wersja Maestro w jakosc-ios.yml przypięta, pusta = błąd głośny (DS-07, zasada wspólna 21; 07-jakosc-005)', () => {
  test('krok „Maestro” ma jedną zmienną MAESTRO_VERSION z dokładną wersją (nie zmienną repo, która bywa pusta)', () => {
    expect(krok?.run).toContain('get.maestro.mobile.dev');
    expect(krok?.env?.MAESTRO_VERSION).toMatch(WERSJA);
    expect(WF.match(/MAESTRO_VERSION:/g)).toHaveLength(1);
  });
  test('pusta zmienna: krok kończy się błędem przed instalacją', () => {
    for (const pusta of ['', undefined]) {
      const w = uruchomKrok(krok?.run ?? '', pusta);
      expect(w.kod).not.toBe(0);
      expect(w.wyjscie).toMatch(/::error::.*MAESTRO_VERSION/);
      expect(w.zainstalowano).toBe(false);
    }
  });
  test('ustawiona zmienna: podsumowanie pokazuje tę wersję, krok przechodzi', () => {
    const v = String(krok?.env?.MAESTRO_VERSION);
    const w = uruchomKrok(krok?.run ?? '', v);
    expect(w.kod).toBe(0);
    expect(w.podsumowanie).toContain(v);
  });
  test('instalator zignorował zmienną (inna wersja): krok kończy się błędem', () => {
    const w = uruchomKrok(krok?.run ?? '', String(krok?.env?.MAESTRO_VERSION), 'echo 9.9.9');
    expect(w.kod).not.toBe(0);
    expect(w.wyjscie).toMatch(/::error::/);
  });
});
