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
    expect(odczyt(wyj)).toEqual({ teraz: '2026-11-10T09:41:00', dzienIpada: '2026-11-12' });
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
  test('z ZRZUTY_DZIEN: każdy wpis macierzy (iPhone i iPad) ma teraz = 2026-11-10T09:41:00 i dzien = ZRZUTY_DZIEN', () => {
    const p = JSON.parse(plan('en,pl', 'iphone,ipad', { ZRZUTY_DZIEN: '2026-11-12' }).stdout);
    expect(p.matrix.length).toBeGreaterThanOrEqual(2);
    for (const m of p.matrix) expect({ teraz: m.teraz, dzien: m.dzien }).toEqual({ teraz: '2026-11-10T09:41:00', dzien: '2026-11-12' });
  });
  test('uzupełnienie: wpisy też niosą teraz i dzien (także wpis „tylko zakup”)', () => {
    const d = zrodlo(); fs.rmSync(path.join(d, '6.9/en/05-projekty.png'));
    const r = node([modul('zrzuty-jezyki.mjs'), 'en', '1', 'iphone,ipad', d, 'en/99-zakup'], { ZRZUTY_DZIEN: '2026-11-11' });
    expect(r.status).toBe(0);
    for (const m of JSON.parse(r.stdout).matrix) expect({ teraz: m.teraz, dzien: m.dzien }).toEqual({ teraz: '2026-11-10T09:41:00', dzien: '2026-11-11' });
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
