/* 07-jakosc-001 (JAK-05, P1; KO-054, P-781; PE1, KO-222, P-1076…P-1078): awaria sterownika XCTest / symulatora w junit części E2E (np. DeviceUnreachableException,
 * „Jakość · iOS” #142, #173, #182) → krok „Scenariusze” powtarza RAZ tylko scenariusze z awarią maszyny i niewykonane w 1. podejściu (zielone i porażki
 * asercji nie biegną drugi raz), także gdy scenariusz ma tag `stan-licznika` (asercja licznika się nie wykonała). Porażka asercji bez ponowienia (P-091 9a/10a). Druga awaria = czerwony.
 * Analogia: trening `.github/workflows/e2e-ios.yml:223-228` (@2d97581). Krok workflowu uruchamiany w bashu z udawanym `maestro`, które
 * zapisuje junit z fikstur `tests/jakosc/dane/e2e-awaria-maszyny/` (wycinki prawdziwych plików, opis w README.md tamże). */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { parse, yamlKroki } from './jakosc-ios-pomoc';

const KORZEN = path.join(__dirname, '..', '..');
const FIKSTURY = path.join(__dirname, 'dane', 'e2e-awaria-maszyny');
const KLASYFIKATOR = path.join(KORZEN, 'scripts', 'ci', 'e2e-awaria-maszyny.mjs');
const wf = parse(fs.readFileSync(path.join(KORZEN, '.github/workflows/jakosc-ios.yml'), 'utf8'));
const krokScenariusze = () => { const k = yamlKroki(wf, 'e2e').find((x) => /^Scenariusze$/.test(x.name ?? '')); if (!k?.run) throw new Error('brak kroku Scenariusze'); return k.run; };

type Wynik = 'zielony' | 'awaria' | 'asercja' | 'limit' | 'bez-junit'; // limit: GitHub przerywa krok (timeout-minutes) w trakcie scenariusza — TERM do powłoki kroku
const S01 = '01-nfr-pie-001-pierwsze-liczenie', S02 = '02-br-lic-001-s1-pierwsze-uruchomienie', S03 = '03-br-lic-001-s2-pierwszy-rzad';

/** Krok „Scenariusze” jak w GitHub (bash -e); `plan[scenariusz]` = wyniki kolejnych wywołań maestro dla tego scenariusza (ostatni się powtarza). */
function uruchom(plan: Record<string, Wynik[]>, env: Record<string, string>, scenariusze = [S01, S02]) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-awaria-'));
  fs.mkdirSync(path.join(d, 'e2e-czesc'));
  for (const f of scenariusze) fs.writeFileSync(path.join(d, 'e2e-czesc', `${f}.yaml`), 'appId: x\n---\n- launchApp\n');
  fs.symlinkSync(path.join(KORZEN, 'scripts'), path.join(d, 'scripts'));
  const bin = path.join(d, 'bin'); fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, 'maestro'), [
    '#!/bin/bash',
    'out=""; prev=""; n=""',
    'for a in "$@"; do case "$a" in *.yaml) n=$(basename "$a" .yaml);; esac; [ "$prev" = --output ] && out="$a"; prev="$a"; done',
    'echo "$n" >> "$WYWOLANIA"; k=$(grep -cx "$n" "$WYWOLANIA")',
    'w=$(node -e \'const p=JSON.parse(process.env.PLAN)[process.argv[1]]||[];console.log(p[Math.min(Number(process.argv[2]),p.length)-1]||"zielony")\' "$n" "$k")',
    'case "$w" in',
    '  awaria) cp "$FIKSTURY/junit-device-unreachable.xml" "$out"; exit 1;;',
    '  asercja) cp "$FIKSTURY/junit-asercja.xml" "$out"; exit 1;;',
    '  limit) kill -TERM $PPID; exit 1;;',
    '  bez-junit) exit 1;;', // porażka bez pliku junit (maestro padło przed zapisem raportu)
    '  *) echo "<testsuites/>" > "$out"; exit 0;;',
    'esac', ''].join('\n'), { mode: 0o755 });
  fs.writeFileSync(path.join(bin, 'python3'), '#!/bin/bash\nexit 0\n', { mode: 0o755 });
  const skrypt = path.join(d, 'krok.sh'), podsumowanie = path.join(d, 'summary.md'), wywolania = path.join(d, 'wywolania.txt');
  fs.writeFileSync(podsumowanie, ''); fs.writeFileSync(wywolania, '');
  fs.writeFileSync(skrypt, krokScenariusze().replace(/\$\{\{ matrix\.czesc \}\}/g, '2').replace(/\$\{\{ matrix\.urzadzenie \}\}/g, 'iphone'));
  const r = spawnSync('bash', ['-e', skrypt], { cwd: d, encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, SIM: 'sim', GITHUB_STEP_SUMMARY: podsumowanie, WYWOLANIA: wywolania, FIKSTURY, PLAN: JSON.stringify(plan), ...env } });
  return { kod: r.status, sygnal: r.signal, wyjscie: r.stdout + r.stderr, podsumowanie: fs.readFileSync(podsumowanie, 'utf8'), wywolania: fs.readFileSync(wywolania, 'utf8').split('\n').filter(Boolean), d };
}

// Część 2 bramki jak w #182: 01 ma tag stan-licznika (poza PONAWIALNE), 02 jest ponawialny; oba w bramce.
const ENV = { PONAWIALNE: `${S02}.yaml`, BRAMKA: `${S01}.yaml ${S02}.yaml` };

describe('07-jakosc-001 · awaria sterownika w junit → jedno powtórzenie scenariuszy z awarią i niewykonanych (KO-054, PE1)', () => {
  test('awaria sterownika w 01 (stan-licznika, bramka) → 01 i niewykonany 02 powtórzone raz, rozstrzyga 2. podejście; powtórzenie wykazane osobno', () => {
    const r = uruchom({ [S01]: ['awaria', 'zielony'] }, ENV);
    expect(r.wywolania.filter((n) => n === S01)).toHaveLength(2);
    expect(r.wywolania).toEqual([S01, S01, S02]); // 02 w 1. podejściu nie biegł (niewykonany) — biegnie raz, po ponownym 01
    expect(r.kod).toBe(0);
    expect(r.podsumowanie).toMatch(/powtórzenie scenariuszy/i);
    expect(r.podsumowanie).toContain(S01);
    expect(r.podsumowanie).toContain('DeviceUnreachableException');
    expect(r.podsumowanie).toMatch(new RegExp(`wynik 2\\. podejścia[^\\n]*zielony ${S01}`));
    expect(fs.existsSync(path.join(r.d, 'e2e-out', 'podejscie-1'))).toBe(true); // ślad 1. podejścia zostaje w artefakcie
  });

  test('porażka asercji w 01 (stan-licznika) → bez ponowienia, krok czerwony (P-091 9a bez zmian)', () => {
    const r = uruchom({ [S01]: ['asercja', 'zielony'] }, ENV);
    expect(r.wywolania.filter((n) => n === S01)).toHaveLength(1);
    expect(r.kod).not.toBe(0);
    expect(r.podsumowanie).toContain(`czerwony ${S01}`);
    expect(r.podsumowanie).not.toMatch(/powtórzenie scenariuszy/i);
  });

  test('druga awaria sterownika w 2. podejściu → czerwony, bez trzeciego podejścia', () => {
    const r = uruchom({ [S01]: ['awaria', 'awaria', 'zielony'] }, ENV);
    expect(r.wywolania.filter((n) => n === S01)).toHaveLength(2);
    expect(r.kod).not.toBe(0);
    expect(r.podsumowanie).toMatch(/powtórzenie scenariuszy/i);
    expect(r.podsumowanie).toContain(`czerwony ${S01}`);
  });

  test('porażka asercji w 01, potem awaria sterownika w 02 (przegląd ścieżki wrażliwej, P1) → 01 bez ponowienia i czerwony w wyniku końcowym', () => {
    const r = uruchom({ [S01]: ['asercja', 'zielony'], [S02]: ['awaria', 'zielony'] }, ENV);
    expect(r.wywolania.filter((n) => n === S01)).toHaveLength(1); // asercja nie dostaje drugiego podejścia (P-091 9a)
    expect(r.wywolania.filter((n) => n === S02)).toHaveLength(2);
    expect(r.kod).not.toBe(0);
    expect(r.podsumowanie).toMatch(/powtórzenie scenariuszy/i);
    expect(r.podsumowanie).toMatch(new RegExp(`czerwony ${S01}[^\\n]*1\\. podejści`));
    expect(r.podsumowanie).toContain(`zielony ${S02}`);
  });

  test('awaria sterownika w ponawialnym 02 → ponowiony tylko 02; zielony 01 bez drugiego uruchomienia (PE1, DG2)', () => {
    const r = uruchom({ [S02]: ['awaria', 'zielony'] }, ENV);
    expect(r.wywolania).toEqual([S01, S02, S02]);
    expect(r.kod).toBe(0);
    expect(r.podsumowanie).toMatch(new RegExp(`powtórzenie scenariuszy[^\\n]*${S02}`, 'i'));
  });
});

describe('08-programista-001/002 (recenzja BE) · ślad 1. podejścia w podsumowaniu', () => {
  test('08-programista-001: 2. podejście przerwane limitem kroku → podsumowanie i tak ma powtórzenie, przyczynę i wyniki 1. podejścia (zapisane przed 2. podejściem)', () => {
    const r = uruchom({ [S02]: ['awaria', 'limit'] }, ENV);
    expect(r.sygnal).toBe('SIGTERM'); // krok przerwany w 2. podejściu, blok końcowy się nie wykonał
    expect(r.wywolania).toEqual([S01, S02, S02]);
    expect(r.podsumowanie).toMatch(new RegExp(`powtórzenie scenariuszy[^\\n]*${S02}[^\\n]*DeviceUnreachableException`, 'i'));
    const p1 = r.podsumowanie.split(/wyniki 1\. podejścia/)[1] ?? '';
    expect(p1).toContain(`zielony ${S01}`);
    expect(p1).toContain(`awaria-maszyny ${S02}`);
  });

  test('08-programista-002: ponawialny 02 zielony w ponowieniu w 1. podejściu, potem awaria w 03 → 02 bez trzeciego uruchomienia, „w-ponowieniu” zostaje w wyniku końcowym', () => {
    const r = uruchom({ [S02]: ['asercja', 'zielony', 'zielony'], [S03]: ['awaria', 'zielony'] }, { ...ENV, BRAMKA: `${S01}.yaml ${S02}.yaml ${S03}.yaml` }, [S01, S02, S03]);
    expect(r.wywolania.filter((n) => n === S02)).toHaveLength(2); // 1. podejście: uruchomienie + ponowienie P-091 9a; bez trzeciego w 2. podejściu
    expect(r.wywolania.filter((n) => n === S03)).toHaveLength(2);
    expect(r.kod).toBe(0);
    expect(r.podsumowanie).toMatch(new RegExp(`wyniki 2\\. podejścia[\\s\\S]*w-ponowieniu ${S02}[^\\n]*1\\. podejści`));
  });
});

describe('PE1 (KO-222, P-1076…P-1078) · ponowienie tylko scenariuszy z awarią maszyny i niewykonanych', () => {
  const S04 = '04-br-lic-002-s1-licznik-krok', S05 = '05-br-lic-003-s1-edycja';
  const WSZYSTKIE = [S01, S02, S03, S04, S05];
  const ENV5 = { PONAWIALNE: `${S02}.yaml`, BRAMKA: WSZYSTKIE.map((n) => `${n}.yaml`).join(' ') };

  test('awaria maszyny w OSTATNIM scenariuszu (DG2: PU-180) → ponowiony tylko on; 4 zielone bez drugiego uruchomienia; wynik zielony', () => {
    const r = uruchom({ [S05]: ['awaria', 'zielony'] }, ENV5, WSZYSTKIE);
    expect(r.wywolania).toEqual([S01, S02, S03, S04, S05, S05]);
    expect(r.kod).toBe(0);
    expect(r.podsumowanie).toMatch(new RegExp(`ponowione scenariusze[^\\n]*awaria maszyny: ${S05}`, 'i'));
    expect(r.podsumowanie).toMatch(new RegExp(`wynik 2\\. podejścia dla ${S05}: zielony ${S05}`));
    for (const n of [S01, S02, S03, S04]) expect(r.podsumowanie).toContain(`zielony ${n}`); // wynik 1. podejścia zostaje w wyniku końcowym
  });

  test('awaria maszyny w środku + niewykonane po niej → ponowione te dwa zbiory (awaria i niewykonane), zielone sprzed awarii nie', () => {
    const r = uruchom({ [S03]: ['awaria', 'zielony'] }, ENV5, WSZYSTKIE);
    expect(r.wywolania).toEqual([S01, S02, S03, S03, S04, S05]);
    expect(r.kod).toBe(0);
    expect(r.podsumowanie).toMatch(new RegExp(`ponowione scenariusze[^\\n]*awaria maszyny: ${S03}[^\\n]*niewykonane w 1\\. podejściu: ${S04} ${S05}`, 'i'));
    expect(r.podsumowanie).toMatch(/wyniki 1\. podejścia/);
    expect(r.podsumowanie).toMatch(/wyniki 2\. podejścia/);
  });

  test('porażka asercji w 01 + awaria maszyny w 03 → ponowiony tylko maszynowy (i niewykonane); 01 bez ponowienia; wynik czerwony', () => {
    const r = uruchom({ [S01]: ['asercja', 'zielony'], [S03]: ['awaria', 'zielony'] }, ENV5, WSZYSTKIE);
    expect(r.wywolania.filter((n) => n === S01)).toHaveLength(1);
    expect(r.wywolania.filter((n) => n === S02)).toHaveLength(1);
    expect(r.wywolania).toEqual([S01, S02, S03, S03, S04, S05]);
    expect(r.kod).not.toBe(0);
    expect(r.podsumowanie).toMatch(new RegExp(`czerwony ${S01}[^\\n]*1\\. podejści`));
  });

  test('brak junit po porażce (maestro padło bez raportu) → nie maszyna: bez ponowienia, wynik czerwony, bez cichej zieleni', () => {
    const r = uruchom({ [S02]: ['bez-junit', 'zielony'] }, ENV, [S01, S02]);
    expect(r.wywolania).toEqual([S01, S02, S02]); // S02 jest ponawialny (P-091 9a): jedno ponowienie P-091, nie podejście P-781
    const r2 = uruchom({ [S03]: ['bez-junit', 'zielony'] }, ENV5, WSZYSTKIE);
    expect(r2.wywolania).toEqual([S01, S02, S03, S04, S05]); // S03 poza PONAWIALNE: jedno uruchomienie, żadne podejście 2.
    expect(r2.kod).not.toBe(0);
    expect(r2.podsumowanie).toContain(`czerwony ${S03}`);
    expect(r2.podsumowanie).not.toMatch(/powtórzenie scenariuszy/i);
    expect(r2.podsumowanie).not.toMatch(new RegExp(`zielony ${S03}`));
  });

  test('awaria maszyny w 1. podejściu, scenariusz z asercją licznika zielony w 2. → job zielony; wykaz ponowionych w podsumowaniu przed 2. podejściem (limit kroku go nie gubi)', () => {
    const r = uruchom({ [S05]: ['awaria', 'limit'] }, ENV5, WSZYSTKIE);
    expect(r.sygnal).toBe('SIGTERM');
    expect(r.wywolania).toEqual([S01, S02, S03, S04, S05, S05]);
    expect(r.podsumowanie).toMatch(new RegExp(`ponowione scenariusze[^\\n]*awaria maszyny: ${S05}`, 'i'));
  });

  test('zestaw kontroli bez zmian: krok „Scenariusze” ma ten sam limit czasu z planu i nie ma continue-on-error (PE1: bez luzowania bramki)', () => {
    const tekst = fs.readFileSync(path.join(KORZEN, '.github/workflows/jakosc-ios.yml'), 'utf8');
    const od = tekst.indexOf('      - name: Scenariusze\n');
    const blok = tekst.slice(od, tekst.indexOf('      - name:', od + 10));
    expect(blok).toContain('timeout-minutes: ${{ fromJSON(steps.plan.outputs.timeout_min) }}');
    expect(blok).not.toMatch(/continue-on-error/);
  });
});

describe('07-jakosc-001 · klasyfikator junit (scripts/ci/e2e-awaria-maszyny.mjs)', () => {
  const klasyfikuj = (plik: string) => spawnSync('node', [KLASYFIKATOR, plik], { encoding: 'utf8' });
  test('junit z DeviceUnreachableException (#182) → awaria maszyny (kod 0), przyczyna na wyjściu', () => {
    const r = klasyfikuj(path.join(FIKSTURY, 'junit-device-unreachable.xml'));
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe('maestro.DeviceUnreachableException: Device became unreachable during deviceInfo');
  });
  test('junit z porażką asercji → nie maszyna (kod 1)', () => {
    expect(klasyfikuj(path.join(FIKSTURY, 'junit-asercja.xml')).status).toBe(1);
  });
  test('brak pliku junit → nie maszyna (kod 1; bez junit nie ma dowodu awarii sterownika)', () => {
    expect(klasyfikuj(path.join(FIKSTURY, 'nie-ma.xml')).status).toBe(1);
  });
  test('wzorzec awarii tylko w nazwie testu, porażka asercji w <failure> → nie maszyna', () => {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-klas-'));
    const plik = path.join(d, 'j.xml');
    fs.writeFileSync(plik, fs.readFileSync(path.join(FIKSTURY, 'junit-asercja.xml'), 'utf8').replace(/name="NFR-PIE-001/g, 'name="deviceInfo failed DeviceUnreachableException NFR-PIE-001'));
    expect(klasyfikuj(plik).status).toBe(1);
  });
  test('08-programista-003 (sonda K2): wzorzec w <system-out> w sekcji CDATA z surowym <failure>, asercja w <failure> → nie maszyna (kod 1)', () => {
    expect(klasyfikuj(path.join(FIKSTURY, 'junit-k2-cdata-system-out.xml')).status).toBe(1);
  });
  test('08-programista-003 (sonda K7): porażka asercji na tekście „deviceInfo failed” → nie maszyna (kod 1)', () => {
    expect(klasyfikuj(path.join(FIKSTURY, 'junit-k7-asercja-deviceinfo.xml')).status).toBe(1);
  });
  test('„iOS driver not ready in time” i „deviceInfo failed” (wzorce Treningu, e2e-ios.yml:223; treść komunikatu złożona) → awaria maszyny', () => {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-klas-'));
    for (const komunikat of ['iOS driver not ready in time', 'deviceInfo failed']) {
      const plik = path.join(d, 'j.xml');
      fs.writeFileSync(plik, fs.readFileSync(path.join(FIKSTURY, 'junit-asercja.xml'), 'utf8').replace(/Assertion is false[^<]*/, komunikat));
      const r = klasyfikuj(plik);
      expect(r.status).toBe(0);
      expect(r.stdout.trim()).toBe(komunikat);
    }
  });
});
