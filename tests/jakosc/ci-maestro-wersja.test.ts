/* 044 · wersja Maestro przypięta jedną zmienną (DS-07, zasada wspólna 21: wybór wersji narzędzia w CI pada głośno; 07-jakosc-005)
 * i P-626 d (07-reaudit 9.11.2026): paczka przypiętej wersji z GitHub Releases z ponawianiem (`curl --retry 5 --retry-all-errors`) i SHA-256,
 * bez skryptu get.maestro.mobile.dev (pobiera jednym `curl --fail`; przebieg 4, run 42578327316: 504 zatrzymał 3 z 4 części przed 1. scenariuszem).
 * Krok „Maestro” zadania e2e w jakosc-ios.yml uruchamiamy w bashu na Linuksie (jak GitHub: -eo pipefail) z atrapą `curl`, która zamiast sieci
 * kopiuje przygotowaną paczkę: pusta zmienna → błąd przed pobraniem; ustawiona → ta wersja w podsumowaniu; inna wersja w paczce albo inny SHA-256 → błąd. */
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, chmodSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parse, yamlKroki } from './jakosc-ios-pomoc';

const WF = readFileSync(join(__dirname, '../../.github/workflows/jakosc-ios.yml'), 'utf8');
const krok = yamlKroki(parse(WF), 'e2e').find((k) => k.name === 'Maestro');
const WERSJA = /^\d+\.\d+\.\d+$/;

/** Uruchamia `run` kroku z atrapą `curl`. `wersjaWPaczce`: co wypisuje `maestro --version` z paczki; `sha`: przypięty skrót (domyślnie skrót paczki). */
function uruchomKrok(run: string, maestroVersion: string | undefined, o: { wersjaWPaczce?: string; sha?: string; curlPada?: boolean } = {}) {
  const k = mkdtempSync(join(tmpdir(), 'maestro-krok-'));
  for (const d of ['bin', 'tmp', 'paczka/maestro/bin']) mkdirSync(join(k, d), { recursive: true });
  writeFileSync(join(k, 'paczka/maestro/bin/maestro'), `#!/bin/sh\necho ${o.wersjaWPaczce ?? maestroVersion ?? '2.99.0'}\n`);
  chmodSync(join(k, 'paczka/maestro/bin/maestro'), 0o755);
  const z = spawnSync('python3', ['-m', 'zipfile', '-c', join(k, 'maestro.zip'), 'maestro'], { cwd: join(k, 'paczka'), encoding: 'utf8' });
  if (z.status !== 0) throw new Error(`zip: ${z.stderr}`);
  const shaPaczki = createHash('sha256').update(readFileSync(join(k, 'maestro.zip'))).digest('hex');
  writeFileSync(join(k, 'bin/curl'), o.curlPada
    ? `#!/bin/sh\necho "$@" >> "${join(k, 'curl-argumenty')}"\necho "curl: (22) The requested URL returned error: 504" >&2\nexit 22\n`
    : `#!/bin/sh\necho "$@" >> "${join(k, 'curl-argumenty')}"\nout=""\nwhile [ $# -gt 0 ]; do [ "$1" = "-o" ] && out="$2"; shift; done\ncp "${join(k, 'maestro.zip')}" "$out"\n`);
  chmodSync(join(k, 'bin/curl'), 0o755);
  const env: NodeJS.ProcessEnv = { ...process.env, PATH: `${join(k, 'bin')}:${process.env.PATH}`, HOME: k, RUNNER_TEMP: join(k, 'tmp'), GITHUB_PATH: join(k, 'path'), GITHUB_STEP_SUMMARY: join(k, 'podsumowanie') };
  delete env.MAESTRO_VERSION;
  if (maestroVersion !== undefined) env.MAESTRO_VERSION = maestroVersion;
  env.MAESTRO_ZIP_SHA256 = o.sha ?? shaPaczki;
  const w = spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', '-c', run], { env, encoding: 'utf8' });
  const czytaj = (p: string) => (existsSync(join(k, p)) ? readFileSync(join(k, p), 'utf8') : '');
  return { kod: w.status, wyjscie: `${w.stdout}${w.stderr}`, podsumowanie: czytaj('podsumowanie'), curl: czytaj('curl-argumenty'), sciezka: czytaj('path'), zainstalowano: existsSync(join(k, '.maestro/bin/maestro')) };
}

const V = String(krok?.env?.MAESTRO_VERSION);

describe('044 · wersja Maestro w jakosc-ios.yml przypięta, pusta = błąd głośny (DS-07, zasada wspólna 21; 07-jakosc-005)', () => {
  test('krok „Maestro” ma jedną zmienną MAESTRO_VERSION z dokładną wersją (nie zmienną repo, która bywa pusta) i skrót SHA-256 paczki', () => {
    expect(krok?.env?.MAESTRO_VERSION).toMatch(WERSJA);
    expect(WF.match(/MAESTRO_VERSION:/g)).toHaveLength(1);
    expect(krok?.env?.MAESTRO_ZIP_SHA256).toMatch(/^[0-9a-f]{64}$/);
  });
  test('pusta zmienna: krok kończy się błędem przed pobraniem', () => {
    for (const pusta of ['', undefined]) {
      const w = uruchomKrok(krok?.run ?? '', pusta);
      expect(w.kod).not.toBe(0);
      expect(w.wyjscie).toMatch(/::error::.*MAESTRO_VERSION/);
      expect(w.curl).toBe('');
      expect(w.zainstalowano).toBe(false);
    }
  });
  test('ustawiona zmienna: podsumowanie pokazuje tę wersję, bin w PATH, krok przechodzi', () => {
    const w = uruchomKrok(krok?.run ?? '', V);
    expect({ kod: w.kod, wyjscie: w.wyjscie }).toMatchObject({ kod: 0 }); // przy porażce Jest pokazuje wyjście kroku
    expect(w.podsumowanie).toContain(V);
    expect(w.sciezka).toContain('.maestro/bin');
    expect(w.zainstalowano).toBe(true);
  });
  test('paczka z inną wersją niż przypięta: krok kończy się błędem', () => {
    const w = uruchomKrok(krok?.run ?? '', V, { wersjaWPaczce: '9.9.9' });
    expect(w.kod).not.toBe(0);
    expect(w.wyjscie).toMatch(/::error::.*9\.9\.9/);
  });
});

describe('P-626 d · pobranie Maestro odporne na 504 z GitHub Releases (07-reaudit 9.11.2026)', () => {
  test('bez skryptu get.maestro.mobile.dev; jedno pobranie przypiętej paczki z ponawianiem także po błędach HTTP (504)', () => {
    expect(krok?.run).not.toContain('get.maestro.mobile.dev');
    const w = uruchomKrok(krok?.run ?? '', V);
    const wywolania = w.curl.trim().split('\n');
    expect(wywolania).toHaveLength(1);
    expect(wywolania[0]).toContain(`https://github.com/mobile-dev-inc/maestro/releases/download/cli-${V}/maestro.zip`);
    expect(wywolania[0]).toMatch(/--retry [1-9]\d* /);
    expect(wywolania[0]).toContain('--retry-all-errors');
    expect(wywolania[0]).toMatch(/(^| )-[a-zA-Z]*f/); // --fail: 504 to błąd curl (ponawiany), nie strona błędu zapisana jako zip
  });
  test('inny SHA-256 paczki niż przypięty: błąd głośny, nic nie zainstalowano', () => {
    const w = uruchomKrok(krok?.run ?? '', V, { sha: '0'.repeat(64) });
    expect(w.kod).not.toBe(0);
    expect(w.wyjscie).toMatch(/::error::.*SHA-256/);
    expect(w.zainstalowano).toBe(false);
  });
  test('pobranie pada mimo ponowień (curl kod 22): krok kończy się błędem, nic nie zainstalowano', () => {
    const w = uruchomKrok(krok?.run ?? '', V, { curlPada: true });
    expect(w.kod).not.toBe(0);
    expect(w.zainstalowano).toBe(false);
  });
});
