/* Instalacja ImageMagicka i czcionek w zadaniu „komplet” (scripts/ci/zainstaluj-narzedzia-zrzutow.sh; rola 08-programista, tryb fix, KO-039/KO-040, 2026-11-11).
 * Powód: przebieg zrzuty-sklepu.yml 43035080611 padł 2× w kroku „ImageMagick i czcionki” po ok. 23 min (job 130620719057, 130640933235): na runnerze nie działał DNS dla azure.archive.ubuntu.com,
 * `apt-get update` zakończył się kodem 0 mimo „Some index files failed to download”, a `install` czekał na każdy pakiet aż do kodu 100.
 * Test uruchamia skrypt naprawdę, z atrapami `sudo`, `apt-get` i `getent` w PATH (Linux; bez sieci i bez roota). */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

const korzen = path.join(__dirname, '..', '..');
const SKRYPT = path.join(korzen, 'scripts/ci/zainstaluj-narzedzia-zrzutow.sh');
const WORKFLOW = path.join(korzen, '.github/workflows/zrzuty-sklepu.yml');
const PAKIETY = ['imagemagick', 'fonts-noto-core', 'fonts-noto-cjk'];

interface Wynik { status: number | null; out: string; aptWywolania: string[]; mirrors: string }

// updateOstrzega: 'ubuntu' (mirror Ubuntu z przebiegu 43035080611), 'ubuntu2' (security.ubuntu.com), 'inne' (źródło spoza Ubuntu, np. packages.microsoft.com), 'oba', 'sama-ogolna' (tylko „Some index files…” bez linii „Failed to fetch”); true = 'ubuntu'
function uruchom(opcje: { dnsPada?: string[]; updateOstrzega?: boolean | 'ubuntu' | 'ubuntu2' | 'inne' | 'oba' | 'sama-ogolna'; installPadaRazy?: number } = {}): Wynik {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'oczko-apt-'));
  const bin = path.join(dir, 'bin');
  fs.mkdirSync(bin);
  const log = path.join(dir, 'apt.log');
  const mirrors = path.join(dir, 'apt-mirrors.txt');
  const sources = path.join(dir, 'ubuntu.sources');
  fs.writeFileSync(mirrors, 'http://azure.archive.ubuntu.com/ubuntu/\tpriority:1\n');
  fs.writeFileSync(sources, 'URIs: mirror+file:/etc/apt/apt-mirrors.txt\n');
  const atrapa = (nazwa: string, tresc: string) => fs.writeFileSync(path.join(bin, nazwa), `#!/bin/bash\n${tresc}\n`, { mode: 0o755 });
  atrapa('sudo', 'exec "$@"');
  atrapa('getent', 'for h in $STUB_DNS_PADA; do [ "$2" = "$h" ] && exit 2; done; echo "93.184.216.34 $2"');
  atrapa('apt-get', [
    'echo "$*" >> "$STUB_LOG"',
    'if [[ " $* " == *" update "* ]]; then',
    '  case "$STUB_UPDATE_OSTRZEGA" in',
    '    ubuntu|oba) echo "W: Failed to fetch mirror+file:/etc/apt/apt-mirrors.txt/dists/noble/InRelease  Temporary failure resolving \'azure.archive.ubuntu.com\'" ;;&',
    '    ubuntu2) echo "W: Failed to fetch http://security.ubuntu.com/ubuntu/dists/noble-security/InRelease  Temporary failure resolving \'security.ubuntu.com\'" ;;&',
    '    inne|oba) echo "W: Failed to fetch https://packages.microsoft.com/ubuntu/24.04/prod/dists/noble/InRelease  Could not resolve host: packages.microsoft.com" ;;&',
    '    ubuntu|ubuntu2|inne|oba|sama-ogolna) echo "W: Some index files failed to download. They have been ignored, or old ones used instead." ;;',
    '  esac',
    '  exit 0',
    'fi',
    'n=$(grep -c -e "--download-only" "$STUB_LOG")',
    'if [[ " $* " == *" --download-only "* ]] && [ "$n" -le "${STUB_INSTALL_PADA:-0}" ]; then echo "E: Failed to fetch https://security.ubuntu.com/x.deb  Temporary failure resolving \'azure.archive.ubuntu.com\'"; exit 100; fi',
    'exit 0',
  ].join('\n'));
  atrapa('convert', 'echo "Version: ImageMagick 6.9.12-98 (atrapa)"');
  atrapa('dpkg-query', 'echo "czcionki: $* (atrapa)"');
  const r = spawnSync('bash', [SKRYPT], {
    encoding: 'utf8',
    cwd: korzen,
    timeout: 60000,
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH ?? ''}`,
      STUB_LOG: log,
      STUB_DNS_PADA: (opcje.dnsPada ?? []).join(' '),
      STUB_UPDATE_OSTRZEGA: opcje.updateOstrzega === true ? 'ubuntu' : (opcje.updateOstrzega || ''),
      STUB_INSTALL_PADA: String(opcje.installPadaRazy ?? 0),
      OCZKO_APT_MIRRORS: mirrors,
      OCZKO_APT_SOURCES: sources,
      OCZKO_APT_ZWLOKA_S: '0',
      GITHUB_STEP_SUMMARY: path.join(dir, 'summary.md'),
    },
  });
  const apt = fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : [];
  return { status: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}`, aptWywolania: apt, mirrors: fs.readFileSync(mirrors, 'utf8') };
}
const ile = (w: Wynik, slowo: string) => w.aptWywolania.filter((l) => ` ${l} `.includes(` ${slowo} `)).length;
// `install` składa się z pobrania pod limitem czasu (`--download-only`) i właściwej instalacji z pamięci podręcznej bez limitu: przerwanie dpkg w pół kroku zostawia blokadę (przegląd ścieżki wrażliwej, P1).
const pobrania = (w: Wynik) => w.aptWywolania.filter((l) => ` ${l} `.includes(' install ') && l.includes('--download-only')).length;
const instalacje = (w: Wynik) => w.aptWywolania.filter((l) => ` ${l} `.includes(' install ') && !l.includes('--download-only')).length;
// Atrapy używają GNU `timeout` i `sed -i`; skrypt biegnie tylko na ubuntu-latest, a `npm run verify` w testflight.yml także na macos-26 (bez GNU `timeout`): poza Linuksem część z atrapami jest pominięta GŁOŚNO.
const linux = process.platform === 'linux';
if (!linux) console.warn(`POMINIĘTE: część „zainstaluj-narzedzia-zrzutow.sh na atrapach apt-get” (platforma ${process.platform}; skrypt jest dla ubuntu-latest, kontrola biegnie w jakosc-linux.yml i ci.yml)`);

(linux ? describe : describe.skip)('zainstaluj-narzedzia-zrzutow.sh: instalacja z jawną awarią zamiast 23 minut ciszy', () => {
  test('DNS działa: ten sam zestaw pakietów, ograniczone czasy i ponowienia apt, mirror bez zmian, bez ostrzeżeń', () => {
    const w = uruchom();
    expect(w.status).toBe(0);
    const install = w.aptWywolania.find((l) => ` ${l} `.includes(' install ') && !l.includes('--download-only')) ?? '';
    for (const p of PAKIETY) expect(install).toContain(p);
    expect(install).toContain('Acquire::Retries=3');
    expect(install).toMatch(/Acquire::https?::Timeout=\d+/);
    expect(w.aptWywolania.find((l) => ` ${l} `.includes(' update ')) ?? '').toContain('Acquire::Retries=3');
    expect(w.mirrors).toContain('azure.archive.ubuntu.com');
    expect(w.out).not.toContain('::warning::');
  });

  test('brak DNS dla azure.archive.ubuntu.com, archive.ubuntu.com działa: ostrzeżenie w logu i przełączenie mirrora, instalacja kończy się sukcesem', () => {
    const w = uruchom({ dnsPada: ['azure.archive.ubuntu.com'] });
    expect(w.status).toBe(0);
    expect(w.out).toContain('::warning::');
    expect(w.out).toContain('archive.ubuntu.com');
    expect(w.mirrors).not.toContain('azure.archive.ubuntu.com');
    expect(w.mirrors).toContain('archive.ubuntu.com');
    expect(pobrania(w)).toBe(1);
    expect(instalacje(w)).toBe(1);
  });

  test('brak DNS dla obu mirrorów: jawny ::error:: i kod ≠ 0 od razu, bez wywołania apt-get', () => {
    const w = uruchom({ dnsPada: ['azure.archive.ubuntu.com', 'archive.ubuntu.com'] });
    expect(w.status).not.toBe(0);
    expect(w.status).not.toBeNull();
    expect(w.out).toContain('::error::');
    expect(w.aptWywolania).toEqual([]);
  });

  test('`apt-get update` kończy się kodem 0, ale pisze „Failed to fetch” (tak było w przebiegu 43035080611): to błąd, 3 próby, jawny ::error::, bez install', () => {
    const w = uruchom({ updateOstrzega: true });
    expect(w.status).not.toBe(0);
    expect(w.status).not.toBeNull();
    expect(w.out).toContain('::error::');
    expect(ile(w, 'update')).toBe(3);
    expect(pobrania(w)).toBe(0);
    expect(instalacje(w)).toBe(0);
  });

  // 10-wydanie-021 (sesja AL, KO-041; recenzja AK): „Failed to fetch” z KAŻDEGO źródła zatrzymywało zadanie, także gdy padło źródło spoza Ubuntu (np. packages.microsoft.com), od którego pakiety zestawu nie zależą.
  test('10-wydanie-021: „Failed to fetch” tylko ze źródła spoza Ubuntu: ostrzeżenie ::warning:: z nazwą hosta, bez ::error::, jedna próba update i instalacja', () => {
    const w = uruchom({ updateOstrzega: 'inne' });
    expect(w.status).toBe(0);
    expect(w.out).toContain('::warning::');
    expect(w.out).toMatch(/::warning::[^\n]*packages\.microsoft\.com/);
    expect(w.out).not.toContain('::error::');
    expect(ile(w, 'update')).toBe(1);
    expect(pobrania(w)).toBe(1);
    expect(instalacje(w)).toBe(1);
  });

  test('10-wydanie-021: „Failed to fetch” z mirrora Ubuntu i z innego źródła naraz: nadal błąd (3 próby, ::error::), ostrzeżenie tylko dla innego źródła', () => {
    const w = uruchom({ updateOstrzega: 'oba' });
    expect(w.status).not.toBe(0);
    expect(w.out).toContain('::error::');
    expect(ile(w, 'update')).toBe(3);
    expect(instalacje(w)).toBe(0);
  });

  test('10-wydanie-021: host security.ubuntu.com to źródło Ubuntu: błąd', () => {
    const w = uruchom({ updateOstrzega: 'ubuntu2' });
    expect(w.status).not.toBe(0);
    expect(w.out).toContain('::error::');
    expect(instalacje(w)).toBe(0);
  });

  test('10-wydanie-021: „Some index files failed to download” bez linii z adresem: nie wiadomo, które źródło, więc błąd (ostrożnie)', () => {
    const w = uruchom({ updateOstrzega: 'sama-ogolna' });
    expect(w.status).not.toBe(0);
    expect(w.out).toContain('::error::');
    expect(ile(w, 'update')).toBe(3);
  });

  test('pobranie pada raz, drugie podejście przechodzi: kod 0, dwa pobrania i jedna instalacja', () => {
    const w = uruchom({ installPadaRazy: 1 });
    expect(w.status).toBe(0);
    expect(pobrania(w)).toBe(2);
    expect(instalacje(w)).toBe(1);
  });

  test('pobranie pada za każdym razem: kod ≠ 0 po 3 próbach i jawny ::error::, bez właściwej instalacji', () => {
    const w = uruchom({ installPadaRazy: 99 });
    expect(w.status).not.toBe(0);
    expect(w.status).not.toBeNull();
    expect(w.out).toContain('::error::');
    expect(pobrania(w)).toBe(3);
    expect(instalacje(w)).toBe(0);
  });
});

describe('zainstaluj-narzedzia-zrzutow.sh: kontrakt statyczny (każda platforma)', () => {
  const sh = fs.existsSync(SKRYPT) ? fs.readFileSync(SKRYPT, 'utf8') : '';
  test('limit czasu obejmuje tylko pobieranie: `timeout` nie owija właściwej instalacji (SIGTERM w dpkg zostawia blokadę)', () => {
    expect(sh).not.toBe('');
    const zTimeoutem = sh.split('\n').filter((l) => /^\s*timeout\b/.test(l) && /\binstall\b/.test(l));
    expect(zTimeoutem.length).toBeGreaterThan(0);
    for (const l of zTimeoutem) expect(l).toContain('--download-only');
  });
});

describe('zrzuty-sklepu.yml, krok „ImageMagick i czcionki”: woła skrypt, bez obejść (KO-040)', () => {
  const yml = fs.readFileSync(WORKFLOW, 'utf8');
  const poczatek = yml.indexOf('- name: ImageMagick i czcionki');
  const koniec = yml.indexOf('\n      - name:', poczatek + 1);
  const krok = poczatek >= 0 ? yml.slice(poczatek, koniec) : '';
  test('krok istnieje i uruchamia scripts/ci/zainstaluj-narzedzia-zrzutow.sh', () => {
    expect(krok).not.toBe('');
    expect(krok).toContain('scripts/ci/zainstaluj-narzedzia-zrzutow.sh');
  });
  test('bez continue-on-error i timeout-minutes w tym kroku; zestaw pakietów w skrypcie bez zmian', () => {
    expect(krok).not.toMatch(/continue-on-error|timeout-minutes/);
    const sh = fs.existsSync(SKRYPT) ? fs.readFileSync(SKRYPT, 'utf8') : '';
    for (const p of PAKIETY) expect(sh).toContain(p);
  });
});
