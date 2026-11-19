/* Uzupełnianie przebiegu zrzutów sklepu (10-wydanie-002, recenzja AB 10.11.2026): przy `[zrzuty-jezyki:all]` (12 zadań, ≈ 10 h) jedna nieudana scena nie może kosztować kolejnych 10 h.
 * Analogia z Treningiem (trening:.github/workflows/store-screenshots.yml:37-44 wejścia `uzupelnij_z_przebiegu` i `powtorz`, trening:scripts/ci/store-powtorz.mjs, trening:scripts/ci/store-shards.mjs:36-50):
 * plan liczy brakujące sceny z poprzedniego przebiegu, zadania macOS robią TYLKO je (zrzuty-sklepu.sh, zmienna SCENY_PLAN), a zadanie „zbierz” nakłada nowe zrzuty na poprzednie.
 * Skrypty .mjs uruchamiamy jak w workflow (Jest nie ładuje modułów ES). */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { wyzwalacze } from '../jakosc/jakosc-ios-pomoc';
import { YAML } from '../jakosc/maestro-runner';

const korzen = path.join(__dirname, '..', '..');
const modul = (n: string) => path.join(korzen, 'scripts/ci', n);
const node = (args: string[]) => spawnSync(process.execPath, args, { encoding: 'utf8', cwd: korzen });
const tmp: string[] = [];
afterAll(() => tmp.forEach((d) => fs.rmSync(d, { recursive: true, force: true })));
const nowyKat = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'uzup-')); tmp.push(d); return d; };
const plik = (kat: string, rel: string, tresc = 'x') => { const p = path.join(kat, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, tresc); };
const SCENY = ['01-dzis', '02-licznik', '03-wzor', '04-zakreslenie', '05-projekty', '06-historia', '07-kalendarz'];
/** Poprzedni przebieg: iPhone — en komplet (03 i 04 w katalogu warunkowym), pl bez 04 i 06; iPad — tylko en/01-dzis. */
function poprzednie() {
  const d = nowyKat();
  for (const s of SCENY) plik(d, s === '03-wzor' || s === '04-zakreslenie' ? `warunek-og07/6.9/en/${s}.png` : `6.9/en/${s}.png`);
  for (const s of SCENY.filter((x) => !['04-zakreslenie', '06-historia'].includes(x))) plik(d, s === '03-wzor' ? `warunek-og07/6.9/pl/${s}.png` : `6.9/pl/${s}.png`);
  plik(d, 'ipad-13/en/01-dzis.png');
  return d;
}
const plan = (jez: string, zadan: string, urz: string, kat?: string, powtorz = '') => node([modul('zrzuty-jezyki.mjs'), jez, zadan, urz, ...(kat ? [kat, powtorz] : [])]);

describe('zrzuty-uzupelnij.mjs powtorz (wejście powtorz: ekrany robione od nowa mimo gotowego pliku)', () => {
  test('usuwa wskazaną parę język/scena z każdej klasy i z katalogu warunkowego OG-07, resztę zostawia', () => {
    const d = poprzednie(); plik(d, 'ipad-13/pl/04-zakreslenie.png'); plik(d, 'warunek-og07/ipad-13/pl/04-zakreslenie.png');
    const r = node([modul('zrzuty-uzupelnij.mjs'), 'powtorz', d, 'en/04-zakreslenie,pl/04-zakreslenie']);
    expect(r.status).toBe(0);
    for (const f of ['warunek-og07/6.9/en/04-zakreslenie.png', 'ipad-13/pl/04-zakreslenie.png', 'warunek-og07/ipad-13/pl/04-zakreslenie.png']) expect(fs.existsSync(path.join(d, f))).toBe(false);
    expect(fs.existsSync(path.join(d, '6.9/en/01-dzis.png'))).toBe(true);
    expect(fs.existsSync(path.join(d, 'warunek-og07/6.9/en/03-wzor.png'))).toBe(false); // 10-wydanie-025: partner pary 03/04 idzie razem z podaną sceną (jeden build); szczegóły: zrzuty-data-ipada.test.ts
    expect(r.stdout).toMatch(/usunięte z uzupełnienia/);
  });
  test('pusta lista, brak katalogu i wpis en/99-zakup (zrzut zakupu to nie plik w komplecie) niczego nie usuwają', () => {
    const d = poprzednie();
    expect(node([modul('zrzuty-uzupelnij.mjs'), 'powtorz', d, '']).status).toBe(0);
    expect(node([modul('zrzuty-uzupelnij.mjs'), 'powtorz', path.join(d, 'brak'), 'en/01-dzis']).status).toBe(0);
    expect(node([modul('zrzuty-uzupelnij.mjs'), 'powtorz', d, 'en/99-zakup']).status).toBe(0);
    expect(fs.readdirSync(path.join(d, '6.9/en'))).toHaveLength(5);
  });
  test('zły wpis = błąd z komunikatem, nie ciche pominięcie (zły format, nieznana scena, zakup w innym języku niż en)', () => {
    for (const zle of ['en-04', 'en/zakreslenie', 'en/09-nieznana', 'pl/99-zakup', 'en;rm -rf/01-dzis']) {
      const r = node([modul('zrzuty-uzupelnij.mjs'), 'powtorz', poprzednie(), zle]); expect({ zle, kod: r.status }).toEqual({ zle, kod: 2 }); expect(r.stderr).toMatch(/BŁĄD/);
    }
  });
});

describe('zrzuty-jezyki.mjs: plan uzupełnienia z poprzedniego przebiegu', () => {
  test('zadania dostają tylko języki z brakami i tylko brakujące sceny (03 i 04 w katalogu warunkowym liczą się jako gotowe)', () => {
    const p = JSON.parse(plan('en,pl', '6', 'iphone', poprzednie()).stdout);
    expect(p.jezyki).toEqual(['en', 'pl']);
    expect(p.matrix).toEqual([{ urzadzenie: 'iphone', jezyki: 'pl', nr: 1, zakup: false, sceny: 'pl=04-zakreslenie,06-historia' }]);
    expect(p.zadania).toBe(1);
  });
  test('iPad: język bez żadnej gotowej sceny dostaje wszystkie siedem, język z jedną — sześć', () => {
    const p = JSON.parse(plan('en,pl', '6', 'ipad', poprzednie()).stdout);
    const sceny = Object.fromEntries(p.matrix.map((m: any) => [m.jezyki, m.sceny])); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(sceny).toEqual({ pl: `pl=${SCENY.join(',')}`, en: `en=${SCENY.slice(1).join(',')}` });
  });
  test('komplet w poprzednim przebiegu: zero zadań macOS (zadanie „zbierz” i tak złoży wynik z poprzednich zrzutów)', () => {
    const d = nowyKat(); for (const s of SCENY) plik(d, `6.9/en/${s}.png`);
    const p = JSON.parse(plan('en', '6', 'iphone', d).stdout);
    expect(p.matrix).toEqual([]); expect(p.zadania).toBe(0);
  });
  test('pusty plik z poprzedniego przebiegu nie jest gotowy', () => {
    const d = nowyKat(); for (const s of SCENY) plik(d, `6.9/en/${s}.png`, s === '05-projekty' ? '' : 'x');
    expect(JSON.parse(plan('en', '6', 'iphone', d).stdout).matrix[0].sceny).toBe('en=05-projekty');
  });
  test('podział po brakujących scenach: najcięższy język najpierw, zawsze do najlżejszego zadania (jak trening:store-shards.mjs:46-50)', () => {
    const d = nowyKat(); plik(d, '6.9/de/01-dzis.png'); plik(d, '6.9/fr/01-dzis.png'); plik(d, '6.9/fr/02-licznik.png'); plik(d, '6.9/fr/03-wzor.png');
    const p = JSON.parse(plan('de,fr,it', '2', 'iphone', d).stdout);   // braki: de 6, fr 4, it 7
    expect(p.matrix.map((m: any) => m.jezyki)).toEqual(['it', 'de,fr']); // eslint-disable-line @typescript-eslint/no-explicit-any
  });
  test('powtorz: usunięte pliki wracają do planu; en/99-zakup włącza zakup w pierwszym zadaniu iPhone’a, a gdy iPhone nie ma braków — w osobnym zadaniu bez języków', () => {
    const d = poprzednie(); node([modul('zrzuty-uzupelnij.mjs'), 'powtorz', d, 'en/04-zakreslenie']);
    let p = JSON.parse(plan('en,pl', '6', 'iphone', d, 'en/04-zakreslenie,en/99-zakup').stdout);
    expect(p.matrix.map((m: any) => [m.jezyki, m.zakup])).toEqual([['en,pl', true]]); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(p.matrix[0].sceny).toBe(`en=03-wzor,04-zakreslenie;pl=04-zakreslenie,06-historia`); // 025: powtórka 04 usuwa też 03 (para z jednego buildu)
    const k = nowyKat(); for (const s of SCENY) plik(k, `6.9/en/${s}.png`);
    p = JSON.parse(plan('en', '6', 'iphone', k, 'en/99-zakup').stdout);
    expect(p.matrix).toEqual([{ urzadzenie: 'iphone', jezyki: '', nr: 1, zakup: true, sceny: '' }]);
  });
  test('zakup tylko na iPhonie, powtórka języka spoza listy i zadanie ponad limit czasu (35 scen na zadanie) = kod 2', () => {
    expect(plan('en', '6', 'ipad', poprzednie(), 'en/99-zakup').status).toBe(2);
    expect(plan('en', '6', 'iphone', poprzednie(), 'de/01-dzis').status).toBe(2);
    const r = plan('all', '1', 'iphone', nowyKat());   // 29 × 7 scen w jednym zadaniu
    expect(r.status).toBe(2); expect(r.stderr).toMatch(/BŁĄD.*35/);
  });
  test('bez katalogu poprzednich zachowanie bez zmian: wszystkie języki, bez pola sceny', () => {
    const p = JSON.parse(plan('en,pl', '6', 'iphone').stdout);
    expect(p.matrix).toEqual([{ urzadzenie: 'iphone', jezyki: 'en', nr: 1, zakup: true }, { urzadzenie: 'iphone', jezyki: 'pl', nr: 2, zakup: false }]);
  });
});

describe('zrzuty-uzupelnij.mjs nalozenie (zadanie zbierz: nowe zrzuty na poprzednie)', () => {
  test('poprzednie uzupełniają braki, nowe nie są nadpisywane, puste pliki są pomijane', () => {
    const pop = nowyKat(); const sur = nowyKat();
    plik(pop, '6.9/en/01-dzis.png', 'STARY'); plik(pop, '6.9/en/02-licznik.png', 'STARY'); plik(pop, '6.9/en/05-projekty.png', '');
    plik(sur, '6.9/en/02-licznik.png', 'NOWY');
    const r = node([modul('zrzuty-uzupelnij.mjs'), 'nalozenie', pop, sur, 'false']);
    expect(r.status).toBe(0);
    expect(fs.readFileSync(path.join(sur, '6.9/en/01-dzis.png'), 'utf8')).toBe('STARY');
    expect(fs.readFileSync(path.join(sur, '6.9/en/02-licznik.png'), 'utf8')).toBe('NOWY');
    expect(fs.existsSync(path.join(sur, '6.9/en/05-projekty.png'))).toBe(false);
    expect(r.stdout).toMatch(/Uzupełnienie: 1 /);
  });
  test('OG-07: przy og07=true sceny wzoru z warunek-og07 poprzedniego przebiegu trafiają do kompletu, przy false zostają w katalogu warunkowym', () => {
    const pop = poprzednie();
    const a = nowyKat(); node([modul('zrzuty-uzupelnij.mjs'), 'nalozenie', pop, a, 'true']);
    expect(fs.existsSync(path.join(a, '6.9/en/03-wzor.png'))).toBe(true); expect(fs.existsSync(path.join(a, 'warunek-og07'))).toBe(false);
    const b = nowyKat(); node([modul('zrzuty-uzupelnij.mjs'), 'nalozenie', pop, b, 'false']);
    expect(fs.existsSync(path.join(b, 'warunek-og07/6.9/en/03-wzor.png'))).toBe(true); expect(fs.existsSync(path.join(b, '6.9/en/03-wzor.png'))).toBe(false);
  });
});

describe('zrzuty-sklepu.sh: SCENY_PLAN (zadanie macOS robi tylko brakujące sceny)', () => {
  /** Skrypt na atrapach (maestro zapisuje nazwy scenariuszy, xcrun zapisuje plik zrzutu, sips zwraca rozmiar). */
  function uruchom(sceny: string, jezyki: string, zakup = false) {
    const d = nowyKat(); const bin = path.join(d, 'bin'); fs.mkdirSync(bin);
    const stub = (n: string, body: string) => { fs.writeFileSync(path.join(bin, n), `#!/bin/bash\n${body}\n`); fs.chmodSync(path.join(bin, n), 0o755); };
    stub('sleep', 'exit 0');
    stub('xcrun', 'if [ "$2" = io ]; then echo x > "$6"; fi; exit 0');
    stub('sips', 'echo "  pixelWidth: 1320"; echo "  pixelHeight: 2868"; exit 0');
    stub('node', 'case "$1" in *zrzuty-uzupelnij.mjs) printf "ZRZUTY_SESJA_1=a\\nZRZUTY_SESJA_2=b\\nZRZUTY_SESJA_3=c\\nZRZUTY_DZIEN_KAL=d\\n";; *splaszcz-png.mjs) cp "$2" "$3";; *zrzuty-dane.mjs) case "$2" in klucz) echo en;; env) echo DANE_KLUCZ=en;; pole) echo en_US;; esac;; esac; exit 0'); // 10-wydanie-017: atrapa zrzutu to tekst „x”, nie PNG — spłaszczenie i kontrola pliku zakupu mają własny test (zrzuty-poprawki-ah.test.ts)
    stub('maestro', `echo "$4 $(printf '%s ' "\${@:5}" | grep -o 'JEZYK=[A-Za-z0-9-]*')" >> "${d}/maestro.txt"; exit 0`);
    const env: NodeJS.ProcessEnv = { ...process.env, PATH: `${bin}:${process.env.PATH}`, SCENY_PLAN: sceny, ZRZUTY_TERAZ: '2026-11-10T09:41:00', ZRZUTY_DZIEN: '2026-11-12' }; // AQ: daty z planu (matrix.teraz/dzien)
    const r = spawnSync('bash', [modul('zrzuty-sklepu.sh'), 'UDID', 'iphone', path.join(d, 'out'), path.join(d, 'log'), 'false', jezyki, zakup ? 'true' : 'false', path.join(d, 'zakup')], { encoding: 'utf8', env });
    const uruchomione = fs.existsSync(path.join(d, 'maestro.txt')) ? fs.readFileSync(path.join(d, 'maestro.txt'), 'utf8').trim().split('\n').map((l) => `${path.basename(l.split(' ')[0]).replace('.yaml', '')}:${(/JEZYK=(\S+)/.exec(l) ?? [])[1]}`) : [];
    const pliki = fs.existsSync(path.join(d, 'out')) ? (fs.readdirSync(path.join(d, 'out'), { recursive: true }) as string[]).filter((f) => f.endsWith('.png')).sort() : [];
    return { r, uruchomione, pliki, zakupPlik: fs.existsSync(path.join(d, 'zakup/99-zakup-ceny.png')) };
  }
  test('plan wskazuje scenę wzoru i jedną zwykłą: robi tylko je (w kolejności skryptu), język bez wpisu planu jest pomijany bez 00-jezyk', () => {
    const { r, uruchomione, pliki } = uruchom('pl=04-zakreslenie,01-dzis', 'en,pl');
    expect(r.status).toBe(0);
    expect(uruchomione).toEqual(['00-przygotuj:start', '00-jezyk:pl', '01-dzis:pl', '04-zakreslenie:pl']);
    expect(pliki).toEqual(['6.9/pl/01-dzis.png', 'warunek-og07/6.9/pl/04-zakreslenie.png']);
  });
  test('bez SCENY_PLAN (przebieg zwykły) wszystkie siedem scen każdego języka', () => {
    const { r, uruchomione, pliki } = uruchom('', 'en');
    expect(r.status).toBe(0);
    expect(uruchomione.filter((x) => /^0[1-7]-/.test(x))).toHaveLength(7);
    expect(pliki).toHaveLength(7);
  });
  // 10-wydanie-011 (recenzja AD, 10.11.2026): wpis planu „tylko zakup” ma `jezyki: ''` i `sceny: ''` (zrzuty-jezyki.mjs, planUzupelnienia); skrypt zamieniał pusty argument języków na `en`
  // (`${6:-en}`), a pusty SCENY_PLAN znaczy „wszystkie sceny”, więc uzupełnienie samego zakupu robiło od nowa 7 scen `en` (≈ 35 min macOS i ryzyko nowej porażki). Pusty argument = brak języków.
  test('zadanie „tylko zakup” (pusty argument języków, zakup=true): tylko 00-przygotuj, 00-jezyk (en) i 99-zakup, bez siedmiu scen en', () => {
    const { r, uruchomione, pliki, zakupPlik } = uruchom('', '', true);
    expect(r.status).toBe(0);
    expect(uruchomione).toEqual(['00-przygotuj:start', '00-jezyk:en', '99-zakup:en']);
    expect(pliki).toEqual([]); // żadnego zrzutu stron produktu
    expect(zakupPlik).toBe(true); // zrzut zakupu powstał
  });
  test('bez argumentu języków (wywołanie ręczne) domyślnie en, jak dotąd', () => {
    const d = nowyKat(); const bin = path.join(d, 'bin'); fs.mkdirSync(bin);
    for (const [n, body] of [['sleep', 'exit 0'], ['xcrun', 'if [ "$2" = io ]; then echo x > "$6"; fi; exit 0'], ['sips', 'echo "  pixelWidth: 1320"; echo "  pixelHeight: 2868"; exit 0'], ['node', 'case "$1" in *zrzuty-uzupelnij.mjs) printf "ZRZUTY_SESJA_1=a\\nZRZUTY_SESJA_2=b\\nZRZUTY_SESJA_3=c\\nZRZUTY_DZIEN_KAL=d\\n";; *splaszcz-png.mjs) cp "$2" "$3";; *zrzuty-dane.mjs) case "$2" in klucz) echo en;; env) echo DANE_KLUCZ=en;; pole) echo en_US;; esac;; esac; exit 0'], ['maestro', `echo "$4" >> "${d}/maestro.txt"; exit 0`]]) { fs.writeFileSync(path.join(bin, n), `#!/bin/bash\n${body}\n`); fs.chmodSync(path.join(bin, n), 0o755); }
    const r = spawnSync('bash', [modul('zrzuty-sklepu.sh'), 'UDID', 'iphone', path.join(d, 'out'), path.join(d, 'log')], { encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, SCENY_PLAN: '', ZRZUTY_TERAZ: '2026-11-10T09:41:00', ZRZUTY_DZIEN: '2026-11-12' } });
    expect(r.status).toBe(0);
    expect(fs.readFileSync(path.join(d, 'maestro.txt'), 'utf8').trim().split('\n').filter((l) => /\/0[1-7]-/.test(l))).toHaveLength(7);
  });
});

describe('workflow zrzuty-sklepu.yml: ścieżka uzupełnienia', () => {
  const tekst = fs.readFileSync(path.join(korzen, '.github/workflows/zrzuty-sklepu.yml'), 'utf8');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wf: any = YAML.parse(tekst);
  const krok = (job: string, re: RegExp) => (wf.jobs[job].steps ?? []).find((k: any) => re.test(k.name ?? '')); // eslint-disable-line @typescript-eslint/no-explicit-any

  test('wejścia uzupelnij_z_przebiegu i powtorz (jak trening:store-screenshots.yml:37-44) oraz znaczniki [zrzuty-uzupelnij:N] i [zrzuty-powtorz:lista] w komunikacie commita', () => {
    const wejscia = Object.keys((wyzwalacze(tekst) as any).workflow_dispatch.inputs); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(wejscia).toEqual(expect.arrayContaining(['uzupelnij_z_przebiegu', 'powtorz']));
    expect(tekst).toContain('[zrzuty-uzupelnij:'); expect(tekst).toContain('[zrzuty-powtorz:');
  });
  test('plan: poprzednie surowe zrzuty z przebiegu (artefakt sklep-zrzuty-surowe), powtórki usunięte przed planem, plan z katalogiem poprzednich; numer przebiegu tylko cyfry', () => {
    const pobranie = krok('plan', /Poprzednie surowe zrzuty/);
    expect(pobranie.uses).toMatch(/^actions\/download-artifact@v4/);
    expect(pobranie.with['run-id']).toContain('steps.wejscie.outputs.uzup');
    expect(pobranie.with.name).toBe('sklep-zrzuty-surowe'); // komplet po nałożeniu uzupełnień poprzedniego przebiegu (14 dni), nie same zrzuty jego zadań: uzupełnienia się łańcuchują
    expect(String(pobranie.if)).toContain("steps.wejscie.outputs.uzup != ''");
    const run = (wf.jobs.plan.steps ?? []).map((k: any) => k.run ?? '').join('\n'); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(run).toContain('zrzuty-uzupelnij.mjs powtorz');
    expect(run).toMatch(/zrzuty-jezyki\.mjs .*poprzednie/);
    expect(run).toMatch(/\*\[!0-9\]\*/); // walidacja: numer przebiegu to same cyfry
    expect(run).toMatch(/artefakt sklep-zrzuty-surowe bez zrzutów/); // pusty artefakt = czerwony plan, nie cichy przebieg od zera
  });
  test('zrzuty: sceny z planu trafiają do skryptu (SCENY_PLAN), zadania macOS nie pobierają poprzednich zrzutów; zakres planu 0 zadań pomija build i zrzuty', () => {
    const z = krok('zrzuty', /^Zrzuty$/);
    expect(z.env.SCENY_PLAN).toContain('matrix.sceny');
    expect(JSON.stringify(wf.jobs.zrzuty.steps)).not.toMatch(/poprzednie/);
    expect(String(wf.jobs.zrzuty.if)).toContain("needs.plan.outputs.zadania != '0'");
    expect(String(wf.jobs.build.if)).toContain("needs.plan.outputs.zadania != '0'");
  });
  test('zbierz: poprzednie zrzuty pobrane, powtórki usunięte, nałożenie przed kontrolą kompletu; zbierz działa także gdy plan nie ma zadań macOS', () => {
    const nazwy = (wf.jobs.zbierz.steps ?? []).map((k: any) => k.name ?? ''); // eslint-disable-line @typescript-eslint/no-explicit-any
    const iPob = nazwy.findIndex((n: string) => /Poprzednie surowe zrzuty/.test(n));
    const iNal = nazwy.findIndex((n: string) => /Nałożenie poprzednich/.test(n));
    const iKomplet = nazwy.findIndex((n: string) => /^Komplet zrzutów/.test(n));
    expect(iPob).toBeGreaterThan(-1); expect(iNal).toBeGreaterThan(iPob); expect(iKomplet).toBeGreaterThan(iNal);
    const nal = (wf.jobs.zbierz.steps ?? [])[iNal];
    expect(nal.run).toContain('zrzuty-uzupelnij.mjs powtorz'); expect(nal.run).toContain('zrzuty-uzupelnij.mjs nalozenie');
    expect(String(wf.jobs.zbierz.if)).toContain("needs.plan.outputs.zadania == '0'");
  });
  test('powtórka i numer przebiegu idą do skryptów przez env, nie przez interpolację w skrypcie (wstrzyknięcie z wejścia ręcznego)', () => {
    for (const [id, z] of Object.entries<any>(wf.jobs)) { // eslint-disable-line @typescript-eslint/no-explicit-any
      for (const k of z.steps ?? []) if (typeof k.run === 'string') expect({ id, krok: k.name, interpolacja: /\$\{\{\s*(inputs\.|steps\.wejscie\.outputs\.(powtorz|uzup)|needs\.plan\.outputs\.(powtorz|uzup))/.test(k.run) }).toEqual({ id, krok: k.name, interpolacja: false });
    }
  });
});

describe('ZR1 (KO-176): zrzuty_z_przebiegu — komplet z gotowych zrzutów przebiegu źródłowego, bez macOS', () => {
  const tekst = fs.readFileSync(path.join(korzen, '.github/workflows/zrzuty-sklepu.yml'), 'utf8');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wf: any = YAML.parse(tekst);
  const kroki = (job: string) => (wf.jobs[job].steps ?? []) as any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  const krok = (job: string, re: RegExp) => kroki(job).find((k) => re.test(k.name ?? '') || re.test(k.id ?? ''));
  /** Uruchamia `run` kroku workflowu w katalogu tymczasowym (skrypty przez dowiązanie `scripts`); zwraca wynik, zawartość $GITHUB_OUTPUT i katalog. */
  function uruchomKrok(job: string, re: RegExp, env: Record<string, string>, przygotuj: (kat: string) => void = () => undefined) {
    const k = krok(job, re); expect(k?.run).toBeTruthy();
    const kat = nowyKat(); fs.symlinkSync(path.join(korzen, 'scripts'), path.join(kat, 'scripts'));
    przygotuj(kat);
    const wyjscie = path.join(kat, 'gh-output'); const podsumowanie = path.join(kat, 'gh-summary');
    fs.writeFileSync(wyjscie, ''); fs.writeFileSync(podsumowanie, '');
    const r = spawnSync('bash', ['-e', '-c', k.run], { encoding: 'utf8', cwd: kat, env: { ...process.env, NODE_OPTIONS: '--preserve-symlinks --preserve-symlinks-main', ...env, GITHUB_OUTPUT: wyjscie, GITHUB_STEP_SUMMARY: podsumowanie } });
    return { r, wyjscie: fs.readFileSync(wyjscie, 'utf8'), kat };
  }
  const wejscie = { ZDARZENIE: 'workflow_dispatch', KOMUNIKAT: '', WE_APP: '', WE_OG07: 'false', WE_JEZYKI: 'en,pl', WE_ZADAN: '6', WE_URZADZENIA: 'iphone,ipad', WE_UZUP: '', WE_ZRZ: '', WE_POWTORZ: '' };
  const planEnv = { URUCHOM: 'true', APP: '', OG07: 'false', JEZ: 'en,pl', ZADAN: '6', URZ: 'iphone,ipad', UZUP: '', ZRZ: '', POWTORZ: '' };

  test('wejście zrzuty_z_przebiegu jest w workflow_dispatch; numer to same cyfry; wyjście zrz niesie plan dalej', () => {
    const wejscia = Object.keys((wyzwalacze(tekst) as any).workflow_dispatch.inputs); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(wejscia).toContain('zrzuty_z_przebiegu');
    expect(wf.jobs.plan.outputs.zrz).toContain('steps.wejscie.outputs.zrz');
    const dobre = uruchomKrok('plan', /^wejscie$/, { ...wejscie, WE_ZRZ: '44505569101' });
    expect(dobre.r.status).toBe(0); expect(dobre.wyjscie).toMatch(/^zrz=44505569101$/m);
    const zle = uruchomKrok('plan', /^wejscie$/, { ...wejscie, WE_ZRZ: '12;rm' });
    expect(zle.r.status).toBe(2); expect(zle.r.stdout).toMatch(/zrzuty_z_przebiegu ma niedozwolone znaki/);
  });
  test('zrzuty_z_przebiegu wyklucza się z uzupelnij_z_przebiegu i powtorz (czerwony plan, kod 2); bez niego zrz jest pusty', () => {
    for (const dodatek of [{ WE_UZUP: '123' }, { WE_POWTORZ: 'ja/04-zakreslenie' }]) {
      const w = uruchomKrok('plan', /^wejscie$/, { ...wejscie, WE_ZRZ: '44505569101', ...dodatek });
      expect(w.r.status).toBe(2); expect(w.r.stdout).toMatch(/::error::zrzuty_z_przebiegu wyklucza się/);
    }
    expect(uruchomKrok('plan', /^wejscie$/, wejscie).wyjscie).toMatch(/^zrz=$/m);
    // znacznik w komunikacie commita nie uruchamia tej drogi (tylko workflow_dispatch)
    expect(uruchomKrok('plan', /^wejscie$/, { ...wejscie, ZDARZENIE: 'push', KOMUNIKAT: '[zrzuty-sklepu] [zrzuty-z-przebiegu:44505569101]' }).wyjscie).toMatch(/^zrz=$/m);
  });
  test('plan: pobiera zrzuty-surowe-* z przebiegu źródłowego (merge-multiple, run-id, token); pusty artefakt źródłowy = czerwony plan z ::error::', () => {
    const pob = krok('plan', /Surowe zrzuty zadań z przebiegu źródłowego/);
    expect(pob.uses).toMatch(/^actions\/download-artifact@v4/);
    expect(pob.with.pattern).toBe('zrzuty-surowe-*'); expect(pob.with['merge-multiple']).toBe(true);
    expect(pob.with['run-id']).toContain('steps.wejscie.outputs.zrz'); expect(pob.with['github-token']).toContain('secrets.GITHUB_TOKEN');
    expect(String(pob.if)).toContain("steps.wejscie.outputs.zrz != ''");
    // pusty katalog (download-artifact z wzorcem bez trafień kończy się sukcesem i pustym katalogiem) i katalog bez PNG (np. sam znacznik 195 B)
    for (const przygotuj of [(k: string) => fs.mkdirSync(path.join(k, 'zrodlo-zrzutow')), (k: string) => plik(path.join(k, 'zrodlo-zrzutow'), 'zrzuty-daty.json', '{}')]) {
      const w = uruchomKrok('plan', /^plan$/, { ...planEnv, ZRZ: '44505569101' }, przygotuj);
      expect(w.r.status).toBe(1); expect(w.r.stdout).toMatch(/::error::przebieg 44505569101: artefakty zrzuty-surowe-\* bez zrzutów/);
    }
  });
  test('plan: z zrzutami w źródle zero zadań macOS (także gdy brakuje scen), języki z planu; zły język = czerwony plan; bez zrz plan bez zmian (zadania macOS)', () => {
    const zrodlo = (k: string) => { plik(path.join(k, 'zrodlo-zrzutow'), '6.9/en/01-dzis.png'); plik(path.join(k, 'zrodlo-zrzutow'), '6.9/pl/01-dzis.png'); };
    const w = uruchomKrok('plan', /^plan$/, { ...planEnv, ZRZ: '44505569101' }, zrodlo);
    expect(w.r.status).toBe(0);
    expect(w.wyjscie).toMatch(/^zadania=0$/m); expect(w.wyjscie).toMatch(/^jezyki=en,pl$/m);
    expect(w.wyjscie).toMatch(/^matrix=\[\{"urzadzenie":"iphone","jezyki":"en","nr":1,"zakup":false\}\]$/m); // tylko wpis zastępczy macierzy (jej zadanie i tak pomija zadania=0)
    expect(w.r.stdout + w.r.stderr).not.toMatch(/::error::/);
    const zlyJezyk = uruchomKrok('plan', /^plan$/, { ...planEnv, ZRZ: '44505569101', JEZ: 'xx' }, zrodlo);
    expect(zlyJezyk.r.status).not.toBe(0);
    const zwykly = uruchomKrok('plan', /^plan$/, { ...planEnv, ZRZ: '' }); // przebieg zwykły: zadania macOS jak dotąd
    expect(zwykly.r.status).toBe(0); expect(zwykly.wyjscie).not.toMatch(/^zadania=0$/m);
  });
  test('build i zrzuty (macOS) pomijane przy zadania=0, a zbierz biegnie wtedy mimo braku zadań zrzutów', () => {
    expect(String(wf.jobs.build.if)).toContain("needs.plan.outputs.zadania != '0'");
    expect(String(wf.jobs.zrzuty.if)).toContain("needs.plan.outputs.zadania != '0'");
    expect(String(wf.jobs.zbierz.if)).toContain("needs.plan.outputs.zadania == '0'");
  });
  test('zbierz: surowe z przebiegu źródłowego (zrzuty-surowe-*, run-id) zamiast bieżącego, przed kontrolą; bieżące pobranie tylko przy zadaniach macOS', () => {
    const nazwy = kroki('zbierz').map((k) => k.name ?? '');
    const iZrz = nazwy.findIndex((n: string) => /Surowe zrzuty z przebiegu źródłowego/.test(n));
    const iAlfa = nazwy.findIndex((n: string) => /^Kanał alfa/.test(n));
    expect(iZrz).toBeGreaterThan(-1); expect(iAlfa).toBeGreaterThan(iZrz);
    const z = kroki('zbierz')[iZrz];
    expect(z.uses).toMatch(/^actions\/download-artifact@v4/); expect(z.with.pattern).toBe('zrzuty-surowe-*'); expect(z.with.path).toBe('surowe'); expect(z.with['merge-multiple']).toBe(true);
    expect(z.with['run-id']).toContain('needs.plan.outputs.zrz'); expect(z.with['github-token']).toContain('secrets.GITHUB_TOKEN');
    expect(String(z.if)).toContain("needs.plan.outputs.zrz != ''");
    const biezace = kroki('zbierz').find((k) => k.with?.pattern === 'zrzuty-surowe-*' && !k.with['run-id']);
    expect(String(biezace.if)).toContain("needs.plan.outputs.zadania != '0'"); // przy zrz plan daje zadania=0, więc bieżące (puste) artefakty nie są pobierane
  });
  test('zbierz: znacznik dat dziedziczony z przebiegu źródłowego (nie dzień bieżący); brak znacznika = data iPada nieznana, nie awaria', () => {
    const pob = krok('zbierz', /Znacznik dat przebiegu źródłowego/);
    expect(pob.with.name).toBe('sklep-zrzuty-surowe'); expect(pob['continue-on-error']).toBe(true); expect(pob.with['run-id']).toContain('needs.plan.outputs.zrz');
    const zn = krok('zbierz', /^Znacznik dat kompletu/);
    expect(zn.run).toContain('zrzuty-uzupelnij.mjs przepisz-znacznik zrodlo-dat sklep-zrzuty-surowe/zrzuty-daty.json');
    const ze = nowyKat(); plik(ze, 'zrzuty-daty.json', JSON.stringify({ teraz: '2026-11-19T09:41', dzienIpada: '2026-11-19' }));
    const wy = path.join(nowyKat(), 'zrzuty-daty.json');
    expect(node([modul('zrzuty-uzupelnij.mjs'), 'przepisz-znacznik', ze, wy]).status).toBe(0);
    expect(JSON.parse(fs.readFileSync(wy, 'utf8'))).toEqual({ teraz: '2026-11-19T09:41', dzienIpada: '2026-11-19' });
    const wyBrak = path.join(nowyKat(), 'zrzuty-daty.json');
    expect(node([modul('zrzuty-uzupelnij.mjs'), 'przepisz-znacznik', path.join(ze, 'nie-ma'), wyBrak]).status).toBe(0);
    expect(JSON.parse(fs.readFileSync(wyBrak, 'utf8'))).toEqual({ teraz: '', dzienIpada: null });
    // wynik kroku: sklep-zrzuty-surowe/zrzuty-daty.json z datami źródła, mimo że dzień bieżącego przebiegu jest inny
    const k = uruchomKrok('zbierz', /^Znacznik dat kompletu/, { DZIEN: '2026-11-25', URZADZENIA: 'iphone,ipad', UZUP: '', ZRZ: '44505569101' }, (kat) => plik(path.join(kat, 'zrodlo-dat'), 'zrzuty-daty.json', JSON.stringify({ teraz: '2026-11-19T09:41', dzienIpada: '2026-11-19' })));
    expect(k.r.status).toBe(0);
    expect(JSON.parse(fs.readFileSync(path.join(k.kat, 'sklep-zrzuty-surowe/zrzuty-daty.json'), 'utf8')).dzienIpada).toBe('2026-11-19');
    // przebieg zwykły: dzień bieżący, jak dotąd
    const zwykly = uruchomKrok('zbierz', /^Znacznik dat kompletu/, { DZIEN: '2026-11-25', URZADZENIA: 'iphone,ipad', UZUP: '', ZRZ: '' });
    expect(JSON.parse(fs.readFileSync(path.join(zwykly.kat, 'sklep-zrzuty-surowe/zrzuty-daty.json'), 'utf8')).dzienIpada).toBe('2026-11-25');
  });
});
