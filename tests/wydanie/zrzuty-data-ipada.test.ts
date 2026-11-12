/* 10-wydanie-018 (AQ, 2026-11-12, KO-046; recenzja AP): daty w komplecie zrzutów. Dowód z AP: pasek iPada 01–07 „Śr. 11 lis”, 03/04 „Czw. 12 lis” (uzupełnienie dzień później),
 * a treść 01-dzis „wtorek, 10 listopada”. Dwie różne rzeczy:
 *  - ZRZUTY_TERAZ = zegar APLIKACJI (treść kadrów). Zostaje stałą 10 XI 2026 9:41: fikstura (00-przygotuj.yaml) ma sesje 3, 5 i 9 XI jako bezwzględne daty względem „dziś”,
 *    więc ruchomy zegar zepsułby Historię, kalendarz i „This week”. Ustala ją plan (zrzuty-jezyki.mjs) raz i niesie w macierzy do każdego zadania zrzutów (`matrix.teraz`).
 *  - data na pasku iPada = data MASZYNY w chwili zrzutu (simctl odrzuca ISO, więc samej daty ustawić się nie da; iPhone daty na pasku nie pokazuje). Plan ustala „dzień przebiegu”
 *    (`date -u +%F`) raz (`matrix.dzien`), zrzut iPada z inną datą maszyny jest odrzucany, a uzupełnienie z przebiegu źródłowego z inną datą paska powtarza CAŁY zestaw iPada
 *    (`zrzuty-uzupelnij.mjs data`), więc wszystkie sceny iPada mają jedną datę na pasku. Skrypty .mjs w procesie potomnym (Jest nie ładuje ESM). */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

const korzen = path.join(__dirname, '..', '..');
const modul = (n: string) => path.join(korzen, 'scripts/ci', n);
const node = (args: string[], env: Record<string, string> = {}) => spawnSync(process.execPath, args, { encoding: 'utf8', cwd: korzen, env: { ...process.env, ...env } });
const tmp: string[] = [];
afterAll(() => tmp.forEach((d) => fs.rmSync(d, { recursive: true, force: true })));
const nowyKat = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'data-ipada-')); tmp.push(d); return d; };
const plik = (kat: string, rel: string, tresc = 'x') => { const p = path.join(kat, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, tresc); };
const jest = (kat: string, rel: string) => fs.existsSync(path.join(kat, rel));
const SCENY = ['01-dzis', '02-licznik', '03-wzor', '04-zakreslenie', '05-projekty', '06-historia', '07-kalendarz'];
const DZIEN_ZRODLA = '2026-11-11';
/** Przebieg źródłowy: iPhone i iPad, en i pl, komplet (03 i 04 w katalogu warunkowym); znacznik dat z dniem źródła (jak zapisuje „zbierz”). */
function zrodlo(opcje: { znacznik?: boolean; jezyki?: string[] } = {}) {
  const d = nowyKat();
  for (const klasa of ['6.9', 'ipad-13']) for (const j of opcje.jezyki ?? ['en', 'pl']) for (const s of SCENY) plik(d, s === '03-wzor' || s === '04-zakreslenie' ? `warunek-og07/${klasa}/${j}/${s}.png` : `${klasa}/${j}/${s}.png`);
  if (opcje.znacznik !== false) plik(d, 'zrzuty-daty.json', JSON.stringify({ teraz: '2026-11-10T09:41:00', dzienIpada: DZIEN_ZRODLA }));
  return d;
}
const data = (kat: string, dzien: string, jezyki = 'en,pl', urz = 'iphone,ipad') => node([modul('zrzuty-uzupelnij.mjs'), 'data', kat, dzien, jezyki, urz]);

describe('zrzuty-uzupelnij.mjs data: uzupełnienie nie miesza dat na pasku iPada', () => {
  test('inna data niż w źródle → usuwa CAŁY zestaw iPada (wszystkie języki, klasa i warunek-og07), iPhone zostaje', () => {
    const d = zrodlo();
    const r = data(d, '2026-11-12');
    expect(r.status).toBe(0);
    for (const j of ['en', 'pl']) for (const s of SCENY) {
      expect([j, s, jest(d, `ipad-13/${j}/${s}.png`) || jest(d, `warunek-og07/ipad-13/${j}/${s}.png`)]).toEqual([j, s, false]);
      expect([j, s, jest(d, `6.9/${j}/${s}.png`) || jest(d, `warunek-og07/6.9/${j}/${s}.png`)]).toEqual([j, s, true]);
    }
    expect(r.stdout).toMatch(/iPad[^\n]*2026-11-11[^\n]*2026-11-12/);
  });
  test('ta sama data → nic nie usuwa', () => {
    const d = zrodlo();
    const r = data(d, DZIEN_ZRODLA);
    expect(r.status).toBe(0);
    expect(jest(d, 'ipad-13/en/01-dzis.png')).toBe(true);
    expect(jest(d, 'warunek-og07/ipad-13/pl/04-zakreslenie.png')).toBe(true);
  });
  test('źródło bez znacznika dat (sprzed zmiany): data paska nieznana → zestaw iPada powtórzony, głośno', () => {
    const d = zrodlo({ znacznik: false });
    const r = data(d, DZIEN_ZRODLA);
    expect(r.status).toBe(0);
    expect(jest(d, 'ipad-13/en/01-dzis.png')).toBe(false);
    expect(r.stdout).toMatch(/bez znacznika dat/);
  });
  test('przebieg bez iPada (urzadzenia=iphone): zrzuty iPada ze źródła zostają nietknięte mimo innej daty', () => {
    const d = zrodlo();
    const r = data(d, '2026-11-12', 'en,pl', 'iphone');
    expect(r.status).toBe(0);
    expect(jest(d, 'ipad-13/en/01-dzis.png')).toBe(true);
  });
  test('język z iPadem w źródle spoza listy przebiegu → błąd (kod 2), nic nie usunięte; „all” obejmuje wszystkie', () => {
    const d = zrodlo({ jezyki: ['en', 'pl', 'de'] });
    const r = data(d, '2026-11-12', 'en,pl');
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/BŁĄD[^\n]*de/);
    expect(jest(d, 'ipad-13/en/01-dzis.png')).toBe(true);
    expect(data(d, '2026-11-12', 'all').status).toBe(0);
    expect(jest(d, 'ipad-13/de/01-dzis.png')).toBe(false);
  });
  test('zły dzień (nie RRRR-MM-DD) → kod 2', () => {
    expect(data(zrodlo(), '12.11.2026').status).toBe(2);
  });
});

describe('zrzuty-uzupelnij.mjs znacznik: plik dat kompletu (artefakt sklep-zrzuty-surowe)', () => {
  const znacznik = (zrodloKat: string, dzien: string, urz: string, wyjscie: string) => node([modul('zrzuty-uzupelnij.mjs'), 'znacznik', zrodloKat, dzien, urz, wyjscie]);
  const odczyt = (p: string) => JSON.parse(fs.readFileSync(p, 'utf8')) as { teraz: string; dzienIpada: string | null };
  test('przebieg z iPadem: dzienIpada = dzień przebiegu, teraz = stała zegara aplikacji', () => {
    const wyj = path.join(nowyKat(), 'zrzuty-daty.json');
    expect(znacznik('-', '2026-11-12', 'iphone,ipad', wyj).status).toBe(0);
    expect(odczyt(wyj)).toEqual({ teraz: '2026-11-12T09:41:00', dzienIpada: '2026-11-12' }); // 023: zegar aplikacji = dzień przebiegu 9:41
  });
  test('przebieg bez iPada: dzienIpada dziedziczone ze źródła (zrzuty iPada ze źródła zostały), a bez źródła null', () => {
    const wyj = path.join(nowyKat(), 'zrzuty-daty.json');
    expect(znacznik(zrodlo(), '2026-11-12', 'iphone', wyj).status).toBe(0);
    expect(odczyt(wyj).dzienIpada).toBe(DZIEN_ZRODLA);
    expect(znacznik('-', '2026-11-12', 'iphone', wyj).status).toBe(0);
    expect(odczyt(wyj).dzienIpada).toBeNull();
  });
});

describe('zrzuty-jezyki.mjs: plan niesie jedną datę zegara i jeden dzień przebiegu do każdego zadania zrzutów', () => {
  const plan = (jez: string, urz: string, env: Record<string, string>) => node([modul('zrzuty-jezyki.mjs'), jez, '2', urz], env);
  test('z ZRZUTY_DZIEN: każdy wpis macierzy (iPhone i iPad) ma dzien = ZRZUTY_DZIEN i teraz = ten dzień o 9:41 (023: jedna prawda w kadrze iPada)', () => {
    const p = JSON.parse(plan('en,pl', 'iphone,ipad', { ZRZUTY_DZIEN: '2026-11-12' }).stdout);
    expect(p.matrix.length).toBeGreaterThanOrEqual(2);
    for (const m of p.matrix) expect({ teraz: m.teraz, dzien: m.dzien }).toEqual({ teraz: '2026-11-12T09:41:00', dzien: '2026-11-12' });
  });
  test('uzupełnienie: wpisy też niosą teraz i dzien (także wpis „tylko zakup”)', () => {
    const d = zrodlo(); fs.rmSync(path.join(d, '6.9/en/05-projekty.png'));
    const r = node([modul('zrzuty-jezyki.mjs'), 'en', '1', 'iphone,ipad', d, 'en/99-zakup'], { ZRZUTY_DZIEN: '2026-11-11' });
    expect(r.status).toBe(0);
    for (const m of JSON.parse(r.stdout).matrix) expect({ teraz: m.teraz, dzien: m.dzien }).toEqual({ teraz: '2026-11-11T09:41:00', dzien: '2026-11-11' });
  });
  test('zły ZRZUTY_DZIEN → kod 2 (nie cichy brak pola)', () => {
    expect(plan('en', 'iphone', { ZRZUTY_DZIEN: 'dziś' }).status).toBe(2);
  });
});

describe('zrzuty-sklepu.sh: zegar i dzień z planu, kontrola daty zrzutu iPada', () => {
  const sh = fs.readFileSync(path.join(korzen, 'scripts/ci/zrzuty-sklepu.sh'), 'utf8');
  const funkcja = (nazwa: string): string => {
    const m = new RegExp(`^${nazwa}\\(\\) \\{[\\s\\S]*?^\\}`, 'm').exec(sh);
    if (!m) throw new Error(`brak funkcji ${nazwa}`);
    return m[0];
  };
  const bezKomentarzy = (t: string) => t.split('\n').filter((l) => !l.trimStart().startsWith('#')).join('\n');
  test('skrypt nie ma własnej stałej ZRZUTY_TERAZ ani własnego dnia: bierze je ze środowiska (matrix) i bez nich staje głośno', () => {
    expect(sh).not.toMatch(/^ZRZUTY_TERAZ="\d{4}/m);
    expect(sh).toMatch(/^: "\$\{ZRZUTY_TERAZ:\?/m);
    expect(sh).toMatch(/^: "\$\{ZRZUTY_DZIEN:\?/m);
    const r = spawnSync('bash', [path.join(korzen, 'scripts/ci/zrzuty-sklepu.sh'), 'U', 'iphone', '/nie/ma/out', '/nie/ma/logi', 'false'], { encoding: 'utf8', cwd: korzen, env: { PATH: process.env.PATH ?? '' } });
    expect(r.status).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toMatch(/ZRZUTY_TERAZ/);
  });
  const uruchom = (urz: string, dzienMaszyny: string, dzien = '2026-11-12') => spawnSync('bash', ['-c', `set -uo pipefail; URZ=${urz}; ZRZUTY_DZIEN=${dzien}
data_maszyny() { echo ${dzienMaszyny}; }
${funkcja('data_zrzutu_zgodna')}
data_zrzutu_zgodna "$(data_maszyny)"; echo "kod=$?"`], { encoding: 'utf8', cwd: korzen });
  test('iPad: data maszyny w chwili zrzutu = dzień przebiegu → zgoda; po północy UTC → odrzucenie z ::error:: o dacie na pasku', () => {
    expect(uruchom('ipad', '2026-11-12').stdout).toContain('kod=0');
    const zle = uruchom('ipad', '2026-11-13');
    expect(zle.stdout).toContain('kod=1');
    expect(zle.stdout).toMatch(/::error::[^\n]*2026-11-13[^\n]*2026-11-12/);
  });
  test('iPhone: bez kontroli (pasek nie pokazuje daty)', () => {
    expect(uruchom('iphone', '2026-11-13').stdout).toContain('kod=0');
  });
  test('przegląd AQ (P1): pierwsza niezgodność daty iPada przerywa zadanie (exit 1, scena w nieudanych) — reszta płatnego macOS nie pracuje na zrzuty do skasowania', () => {
    const petla = bezKomentarzy(sh.slice(sh.indexOf('for JEZ in')));
    const blok = petla.slice(petla.indexOf('if ! data_zrzutu_zgodna'), petla.indexOf('if ! data_zrzutu_zgodna') + 400);
    expect(blok).toMatch(/rm -f "\$CEL\/\$scena\.png"/);
    expect(blok).toMatch(/echo "\$JEZ\/\$scena" >> "\$NIEUDANE"/);
    expect(blok).toMatch(/exit 1/);
    expect(funkcja('data_zrzutu_zgodna')).toMatch(/nowym przebiegu[^\n]*nie ponawiaj/); // ponowienie zadania dostaje ten sam dzień z planu
  });
  test('pętla scen: zrzut z niezgodną datą jest usuwany i liczony jako nieudany scena (czerwony przebieg), bez ponawiania', () => {
    const petla = bezKomentarzy(sh.slice(sh.indexOf('for JEZ in')));
    expect(petla).toMatch(/data_zrzutu_zgodna "\$DATA_ZRZUTU"/);
    expect(petla.indexOf('data_zrzutu_zgodna')).toBeGreaterThan(petla.indexOf('zrob_zrzut "$scena"'));
    expect(petla).toMatch(/rm -f "\$CEL\/\$scena\.png"/);
    expect(bezKomentarzy(funkcja('zrob_zrzut'))).toMatch(/DATA_ZRZUTU="\$\(data_maszyny\)"/);
  });
});

describe('zrzuty-sklepu.yml: plan ustala dzień raz, zadania i „zbierz” dostają go z planu', () => {
  const yml = fs.readFileSync(path.join(korzen, '.github/workflows/zrzuty-sklepu.yml'), 'utf8');
  const kod = yml.split('\n').filter((l) => !l.trimStart().startsWith('#')).join('\n');
  test('plan: `date -u +%F` dokładnie raz w workflow, wyjście `dzien`, ZRZUTY_DZIEN do skryptu planu', () => {
    expect(kod.match(/date -u \+%F/g)).toHaveLength(1);
    expect(kod).toMatch(/dzien: \$\{\{ steps\.plan\.outputs\.dzien \}\}/);
    expect(kod).toMatch(/ZRZUTY_DZIEN="\$dzien" node scripts\/ci\/zrzuty-jezyki\.mjs/);
  });
  test('przegląd AQ (P1): krok bez pipefail (domyślne `bash -e`): kod wyjścia `powtorz`/`data`/`znacznik` przed `| tee` nie ginie — PIPESTATUS[0] sprawdzany', () => {
    for (const polecenie of ['zrzuty-uzupelnij.mjs powtorz poprzednie "\\$POWTORZ" \\| tee', 'zrzuty-uzupelnij.mjs data poprzednie "\\$dzien" "\\$JEZ" "\\$URZ" \\| tee', 'zrzuty-uzupelnij.mjs znacznik "\\$zrodlo" "\\$DZIEN" "\\$URZADZENIA" sklep-zrzuty-surowe/zrzuty-daty.json \\| tee']) {
      expect([polecenie, new RegExp(`${polecenie}[^\\n]*\\n\\s*\\[ "\\$\\{PIPESTATUS\\[0\\]\\}" -eq 0 \\] \\|\\| exit 1`).test(kod)]).toEqual([polecenie, true]);
    }
  });
  test('zadanie zrzutów: ZRZUTY_TERAZ i ZRZUTY_DZIEN z macierzy (jeden plan na wszystkie zadania)', () => {
    expect(kod).toMatch(/ZRZUTY_TERAZ: \$\{\{ matrix\.teraz \}\}/);
    expect(kod).toMatch(/ZRZUTY_DZIEN: \$\{\{ matrix\.dzien \}\}/);
  });
  test('uzupełnienie: `data` w planie (przed planem) i ponownie w „zbierz” (przed nałożeniem), z dniem z planu; znacznik dat trafia do artefaktu surowych po ramkach', () => {
    const wPlanie = kod.indexOf('zrzuty-uzupelnij.mjs data poprzednie');
    expect(wPlanie).toBeGreaterThan(0);
    expect(wPlanie).toBeLessThan(kod.indexOf('node scripts/ci/zrzuty-jezyki.mjs'));
    const wZbierz = kod.indexOf('zrzuty-uzupelnij.mjs data poprzednie', wPlanie + 10);
    expect(wZbierz).toBeGreaterThan(wPlanie);
    expect(wZbierz).toBeLessThan(kod.indexOf('zrzuty-uzupelnij.mjs nalozenie'));
    expect(kod).toMatch(/zrzuty-uzupelnij\.mjs znacznik "\$zrodlo" "\$DZIEN" "\$URZADZENIA" sklep-zrzuty-surowe\/zrzuty-daty\.json/);
    expect(kod).toMatch(/zrodlo=-; \[ -z "\$UZUP" \] \|\| zrodlo=poprzednie/); // źródło = katalog poprzednich tylko przy uzupełnieniu (nie wartość numeru przebiegu)
    expect(kod.indexOf('zrzuty-uzupelnij.mjs znacznik')).toBeGreaterThan(kod.indexOf('scripts/ci/ramki-sklepu.sh'));
    expect(kod.indexOf('zrzuty-uzupelnij.mjs znacznik')).toBeLessThan(kod.lastIndexOf('name: sklep-zrzuty-surowe')); // ostatnie wystąpienie = upload artefaktu (wcześniejsze: pobranie źródła w planie)
  });
});

/* 10-wydanie-022 … -026 (AU, 2026-11-12, KO-050; recenzja AS): poprawki workflowu zrzutów po audycie. Wynik na runnerze macOS: niesprawdzone (potwierdzi pierwszy przebieg zrzutów na kandydacie, C1). */
import { YAML } from '../jakosc/maestro-runner';

describe('10-wydanie-023: pasek iPada i treść kadru pokazują ten sam dzień (fikstura względna od dnia przebiegu)', () => {
  const dni = (dzien: string) => node([modul('zrzuty-uzupelnij.mjs'), 'dni', dzien]);
  test('dzień przebiegu czwartek 2026-11-12: sesje −7, −5 i −1 dnia (18:00, 19:30, 20:00), kalendarz = dzień drugiej sesji', () => {
    const r = dni('2026-11-12');
    expect(r.status).toBe(0);
    expect(r.stdout.trim().split('\n')).toEqual(['ZRZUTY_SESJA_1=2026-11-05T18:00:00', 'ZRZUTY_SESJA_2=2026-11-07T19:30:00', 'ZRZUTY_SESJA_3=2026-11-11T20:00:00', 'ZRZUTY_DZIEN_KAL=2026-11-07']);
  });
  test('poniedziałek (−1 = poprzedni tydzień, „This week” pusty) i dzień miesiąca < 8 (−7 i −5 w poprzednim miesiącu, kalendarz bez dni pracy) → kod 2 z powodem, bez cichych kadrów', () => {
    for (const [dzien, powod] of [['2026-11-16', /poniedzia/], ['2026-12-03', /miesi/], ['2026-11-07', /miesi/]] as const) {
      const r = dni(dzien); expect({ dzien, kod: r.status }).toEqual({ dzien, kod: 2 }); expect(r.stderr).toMatch(powod);
    }
    expect(dni('2026-11-08').status).toBe(0); // niedziela, 8. dnia: najmniejszy dozwolony dzień miesiąca; −7 = 1 XI
  });
  test('plan odrzuca niedozwolony dzień przed kolejką macOS (zrzuty-jezyki.mjs, kod 2), dozwolony niesie teraz o dniu = dzien', () => {
    const plan = (dzien: string) => node([modul('zrzuty-jezyki.mjs'), 'en', '2', 'iphone,ipad'], { ZRZUTY_DZIEN: dzien });
    expect(plan('2026-11-16').status).toBe(2);
    for (const m of JSON.parse(plan('2026-11-13').stdout).matrix) expect(m.teraz.slice(0, 10)).toBe(m.dzien);
  });
  test('fikstura nie ma bezwzględnych dat dni pracy: 00-przygotuj używa ${ZRZUTY_SESJA_1..3}, 07-kalendarz ${ZRZUTY_DZIEN_KAL}', () => {
    const kod = (f: string) => fs.readFileSync(path.join(korzen, 'e2e/zrzuty-sklepu', f), 'utf8').split('\n').filter((l) => !l.trimStart().startsWith('#')).join('\n');
    const przyg = kod('00-przygotuj.yaml');
    expect(przyg).not.toMatch(/2026-\d{2}-\d{2}/);
    for (const n of [1, 2, 3]) expect([n, przyg.includes(`\${ZRZUTY_SESJA_${n}}`)]).toEqual([n, true]);
    const kal = kod('07-kalendarz.yaml');
    expect(kal).not.toMatch(/2026-\d{2}-\d{2}/);
    expect(kal).toContain('historia-dzien-${ZRZUTY_DZIEN_KAL}');
  });
  test('zrzuty-sklepu.sh liczy dni z dnia przebiegu (node … dni) i przekazuje je do scenariuszy przez -e (próba na atrapach maestro, prawdziwy node)', () => {
    const d = nowyKat(); const bin = path.join(d, 'bin'); fs.mkdirSync(bin);
    const stub = (n: string, body: string) => { fs.writeFileSync(path.join(bin, n), `#!/bin/bash\n${body}\n`); fs.chmodSync(path.join(bin, n), 0o755); };
    stub('sleep', 'exit 0'); stub('xcrun', 'if [ "$2" = io ]; then echo x > "$6"; fi; exit 0'); stub('sips', 'echo "  pixelWidth: 1320"; echo "  pixelHeight: 2868"');
    stub('node', `case "$1" in *zrzuty-uzupelnij.mjs) exec "${process.execPath}" "$@";; *zrzuty-dane.mjs) case "$2" in klucz) echo en;; env) echo DANE_KLUCZ=en;; pole) echo en_US;; esac;; esac; exit 0`);
    stub('maestro', `echo "$*" >> "${d}/maestro.txt"; exit 0`);
    const r = spawnSync('bash', [modul('zrzuty-sklepu.sh'), 'UDID', 'iphone', path.join(d, 'out'), path.join(d, 'log'), 'false', 'en'], { encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, SCENY_PLAN: 'en=01-dzis', ZRZUTY_TERAZ: '2026-11-12T09:41:00', ZRZUTY_DZIEN: '2026-11-12' } });
    expect(r.status).toBe(0);
    const wiersz = fs.readFileSync(path.join(d, 'maestro.txt'), 'utf8').split('\n').find((l) => /00-przygotuj/.test(l)) ?? '';
    for (const e of ['ZRZUTY_SESJA_1=2026-11-05T18:00:00', 'ZRZUTY_SESJA_2=2026-11-07T19:30:00', 'ZRZUTY_SESJA_3=2026-11-11T20:00:00', 'ZRZUTY_DZIEN_KAL=2026-11-07']) expect([e, wiersz.includes(`-e ${e}`)]).toEqual([e, true]);
  });
});

describe('10-wydanie-022: zadanie iPada kończy się na starcie, gdy data maszyny ≠ dzień przebiegu (przed 00-przygotuj)', () => {
  function ipad(dzienMaszyny: string, urz = 'ipad') {
    const d = nowyKat(); const bin = path.join(d, 'bin'); fs.mkdirSync(bin);
    const stub = (n: string, body: string) => { fs.writeFileSync(path.join(bin, n), `#!/bin/bash\n${body}\n`); fs.chmodSync(path.join(bin, n), 0o755); };
    stub('date', `echo ${dzienMaszyny}`); stub('sleep', 'exit 0'); stub('xcrun', 'if [ "$2" = io ]; then echo x > "$6"; fi; exit 0'); stub('sips', 'echo "  pixelWidth: 2064"; echo "  pixelHeight: 2752"');
    stub('node', `case "$1" in *zrzuty-uzupelnij.mjs) exec "${process.execPath}" "$@";; *zrzuty-dane.mjs) case "$2" in klucz) echo en;; env) echo DANE_KLUCZ=en;; pole) echo en_US;; esac;; esac; exit 0`);
    stub('maestro', `echo "$*" >> "${d}/maestro.txt"; exit 0`);
    const r = spawnSync('bash', [modul('zrzuty-sklepu.sh'), 'UDID', urz, path.join(d, 'out'), path.join(d, 'log'), 'false', 'en'], { encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, SCENY_PLAN: 'en=01-dzis', ZRZUTY_TERAZ: '2026-11-12T09:41:00', ZRZUTY_DZIEN: '2026-11-12' } });
    return { r, maestro: fs.existsSync(path.join(d, 'maestro.txt')) };
  }
  test('iPad, data maszyny 2026-11-13 ≠ dzień 2026-11-12: kod 1, komunikat o dniu przebiegu, żaden scenariusz Maestro nie ruszył', () => {
    const { r, maestro } = ipad('2026-11-13');
    expect(r.status).toBe(1);
    expect(`${r.stdout}${r.stderr}`).toMatch(/dzień przebiegu \(2026-11-12\)/);
    expect(maestro).toBe(false);
  });
  test('iPad, ta sama data: zadanie idzie dalej; iPhone przy innej dacie nie jest sprawdzany (pasek bez daty)', () => {
    expect(ipad('2026-11-12').maestro).toBe(true);
    const { r, maestro } = ipad('2026-11-13', 'iphone');
    expect([r.status, maestro]).toEqual([0, true]);
  });
  test('opis wejścia `urzadzenia` w workflowie mówi, żeby iPad skończył przed 00:00 UTC (data paska), i wskazuje kontrolę na starcie', () => {
    const wf = YAML.parse(fs.readFileSync(path.join(korzen, '.github/workflows/zrzuty-sklepu.yml'), 'utf8'));
    const opis: string = wf.on.workflow_dispatch.inputs.urzadzenia.description;
    expect(opis).toMatch(/przed 00:00 UTC/);
  });
});

describe('10-wydanie-024: każdy potok `zrzuty-uzupelnij.mjs … | tee` w workflowie pilnuje kodu wyjścia skryptu', () => {
  test('po każdym takim potoku PIPESTATUS[0] albo krok ma `set -o pipefail`', () => {
    const wf = YAML.parse(fs.readFileSync(path.join(korzen, '.github/workflows/zrzuty-sklepu.yml'), 'utf8'));
    const zle: string[] = []; let potokow = 0;
    for (const [job, j] of Object.entries<any>(wf.jobs)) for (const k of j.steps ?? []) { // eslint-disable-line @typescript-eslint/no-explicit-any
      const linie = String(k.run ?? '').split('\n'); const pipefail = /set -[a-z]*o pipefail|set -o pipefail/.test(String(k.run ?? '')) || /pwsh|powershell/.test(String(k.shell ?? '')) === false && /pipefail/.test(String(k.shell ?? ''));
      linie.forEach((l, i) => {
        if (!/zrzuty-uzupelnij\.mjs[^|]*\|\s*tee/.test(l)) return;
        potokow++;
        if (!pipefail && !/PIPESTATUS\[0\]/.test(linie[i + 1] ?? '')) zle.push(`${job}/${k.name}: ${l.trim().slice(0, 80)}`);
      });
    }
    expect(potokow).toBeGreaterThanOrEqual(4); // powtorz, data (plan), nalozenie (zbierz), znacznik
    expect(zle).toEqual([]);
  });
});

describe('10-wydanie-025: powtórka jednej sceny pary 03/04 usuwa obie (para pochodzi z jednego buildu)', () => {
  const pow = (kat: string, lista: string) => node([modul('zrzuty-uzupelnij.mjs'), 'powtorz', kat, lista]);
  test.each([['en/04-zakreslenie', 'en/03-wzor'], ['en/03-wzor', 'en/04-zakreslenie']])('powtorz %s usuwa też %s (klasy i katalog warunkowy), sceny innego języka i inne sceny zostają', (podana, partner) => {
    const d = zrodlo(); const [j, s] = partner.split('/');
    const r = pow(d, podana);
    expect(r.status).toBe(0);
    for (const k of ['6.9', 'ipad-13']) expect([k, jest(d, `warunek-og07/${k}/${j}/${s}.png`) || jest(d, `${k}/${j}/${s}.png`)]).toEqual([k, false]);
    expect(jest(d, 'warunek-og07/6.9/pl/03-wzor.png')).toBe(true);
    expect(jest(d, '6.9/en/01-dzis.png')).toBe(true);
    expect(r.stdout).toContain(`${s}.png`);
  });
});

describe('10-wydanie-026: drobne', () => {
  test('sprawdzDzien: zły dzień kalendarzowy (2026-13-01, 2026-02-30) → komunikat „zły dzień przebiegu”, nie RangeError z toISOString', () => {
    for (const zly of ['2026-13-01', '2026-02-30', '2026-00-10']) {
      const r = data(nowyKat(), zly);
      expect({ zly, kod: r.status }).toEqual({ zly, kod: 2 });
      expect(r.stderr).toMatch(/zły dzień przebiegu/); expect(r.stderr).not.toMatch(/RangeError|Invalid time value/);
    }
  });
  test('zrzuty-sklepu.sh: DATA_ZRZUTU czyszczone przed simctl (nieudany simctl przy istniejącym pliku nie zostawia daty poprzedniej sceny)', () => {
    const sh = fs.readFileSync(path.join(korzen, 'scripts/ci/zrzuty-sklepu.sh'), 'utf8');
    const f = /^zrob_zrzut\(\) \{[\s\S]*?^\}/m.exec(sh)?.[0] ?? '';
    expect(f.indexOf('DATA_ZRZUTU=""')).toBeGreaterThan(-1);
    expect(f.indexOf('DATA_ZRZUTU=""')).toBeLessThan(f.indexOf('simctl io'));
  });
  test('scenariusz 47: komentarz o dwóch szybkich pociągnięciach nie przeczy sam sobie (nie ma „bez asercji między nimi” obok „tylko szybka asercja”)', () => {
    const t = fs.readFileSync(path.join(korzen, 'e2e/scenariusze/47-br-wzr-008-s4-ipad-bez-rysika.yaml'), 'utf8');
    expect(t).toMatch(/Między pociągnięciami tylko szybka asercja/);
    expect(t).not.toMatch(/bez asercji między nimi/);
  });
});
