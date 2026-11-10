/* Zrzuty sklepu na CI (rola 10-wydanie, zadanie E-2, 2026-11-10; plan: docs/wydanie/metadane/zrzuty-plan.md, opcja A).
 * Test pilnuje kontraktu workflowu `zrzuty-sklepu.yml` z `asc-zrzuty.yml` (artefakt `sklep-zrzuty-ramki`: `6.9/<język>/NN-*.png`, `ipad-13/<język>/NN-*.png`,
 * PNG bez alfy), zakazów roli (bez sekretów, bez środowiska `release`, bez przełączników testowych tam, gdzie psują kadr) i tego, że scenariusze zrzutów
 * używają tylko testID, które istnieją w kodzie. Dlaczego: workflow nie biegnie lokalnie (macOS), a pomyłka wychodzi po godzinie budowania.
 */
import * as fs from 'fs';
import * as path from 'path';
import { parse, wyzwalacze } from '../jakosc/jakosc-ios-pomoc';
import { YAML } from '../jakosc/maestro-runner';

const KORZEN = path.join(__dirname, '..', '..');
const czytaj = (p: string) => fs.readFileSync(path.join(KORZEN, p), 'utf8');
const SCIEZKA_WF = '.github/workflows/zrzuty-sklepu.yml';
const SKRYPT = 'scripts/ci/zrzuty-sklepu.sh';
const KAT = 'e2e/zrzuty-sklepu';

describe('workflow zrzuty-sklepu.yml', () => {
  const tekst = fs.existsSync(path.join(KORZEN, SCIEZKA_WF)) ? czytaj(SCIEZKA_WF) : '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wf: any = tekst ? { ...YAML.parse(tekst), ...parse(tekst) } : {};

  test('istnieje i ma zadania: plan, build, zrzuty, zbierz', () => {
    expect(tekst).not.toBe('');
    expect(Object.keys(wf.jobs ?? {})).toEqual(expect.arrayContaining(['plan', 'build', 'zrzuty', 'zbierz']));
  });

  test('wyzwalacze: push z gałęzi roboczej gated znacznikiem w komunikacie commita oraz workflow_dispatch', () => {
    const on = wyzwalacze(tekst) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(Object.keys(on)).toEqual(expect.arrayContaining(['push', 'workflow_dispatch']));
    expect(on.push.branches).toContain('claude/e-zrzuty-sklepu-2026-11-10');
    expect(on.push.branches).toContain('claude/youthful-pasteur-kx83sn'); // build 3: powtórka zrzutów na gałęzi integracji (sklep.md §3e)
    expect(tekst).toContain('[zrzuty-sklepu]');
    expect(tekst).toMatch(/\[zrzuty-app:/); // ponowne użycie aplikacji z poprzedniego przebiegu tego workflowu
    expect(tekst).toMatch(/\[og07-ok\]/);
  });

  test('bez sekretów, bez środowiska release, bez zapisu do ASC (zakazy roli 10)', () => {
    expect(tekst).not.toMatch(/secrets\.(?!GITHUB_TOKEN)/);
    expect(tekst).not.toMatch(/environment:/);
    expect(tekst).not.toMatch(/ASC_(KEY|ISSUER)|scripts\/asc\//);
    expect(wf.permissions).toEqual({ contents: 'read', actions: 'read' });
  });

  test('komunikat commita trafia do kroków przez env, nie przez interpolację w skrypcie', () => {
    for (const [id, z] of Object.entries<any>(wf.jobs)) { // eslint-disable-line @typescript-eslint/no-explicit-any
      for (const k of z.steps ?? []) if (typeof k.run === 'string') expect({ id, krok: k.name, interpolacja: /\$\{\{\s*github\.event\.head_commit\.message/.test(k.run) }).toEqual({ id, krok: k.name, interpolacja: false });
    }
  });

  test('build: build E2E bez udawanego zegarka (panel „Watch state” psułby kadr licznika), z podpisem wyłączonym', () => {
    const budowa = (wf.jobs?.build?.steps ?? []).find((k: any) => /Build \(Release/.test(k.name ?? '')); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(budowa?.env?.EXPO_PUBLIC_E2E).toBe('1');
    expect(budowa?.env?.EXPO_PUBLIC_WATCH_FAKE).toBeUndefined();
    expect(budowa?.run).toContain('CODE_SIGNING_ALLOWED=NO');
    expect(wf.jobs.build['runs-on']).toBe('macos-26');
  });

  test('Xcode przez select-xcode.sh, Maestro przypięty (wersja + SHA-256 + ponowienia), jak w jakosc-ios.yml', () => {
    expect(tekst).toContain('.github/scripts/jakosc/select-xcode.sh 26');
    const maestro = (wf.jobs?.zrzuty?.steps ?? []).find((k: any) => k.name === 'Maestro'); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(maestro?.if).toBeUndefined(); // krok skopiowany z jakosc-ios.yml miał `if: steps.plan…` — tu zawsze fałszywy (przebieg 1: „maestro: command not found”)
    expect(maestro?.env?.MAESTRO_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(maestro?.env?.MAESTRO_ZIP_SHA256).toMatch(/^[0-9a-f]{64}$/);
    const jakosc = parse(czytaj('.github/workflows/jakosc-ios.yml'));
    const wzor = jakosc.jobs.e2e.steps.find((k: any) => k.name === 'Maestro'); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(maestro.env.MAESTRO_VERSION).toBe(wzor.env.MAESTRO_VERSION); // jedna wersja w repo (zasada wspólna 21)
    expect(maestro.env.MAESTRO_ZIP_SHA256).toBe(wzor.env.MAESTRO_ZIP_SHA256);
  });

  test('zrzuty: macierz iphone + ipad, urządzenia 6.9″ (1320×2868) i iPad 13″ (2064×2752)', () => {
    expect(wf.jobs.zrzuty.strategy.matrix.urzadzenie).toEqual(['iphone', 'ipad']);
    expect(tekst).toMatch(/iPhone 17 Pro Max/);
    expect(tekst).toMatch(/iPad (Pro|Air) 13-inch/);
  });

  test('artefakt końcowy ma nazwę z kontraktu asc-zrzuty.yml i układ katalogów 6.9 / ipad-13', () => {
    const asc = czytaj('.github/workflows/asc-zrzuty.yml');
    expect(asc).toContain('sklep-zrzuty-ramki');
    const wynik = (wf.jobs.zbierz.steps ?? []).find((k: any) => k.uses?.startsWith('actions/upload-artifact') && k.with?.name === 'sklep-zrzuty-ramki'); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(wynik).toBeDefined();
    expect(wynik.with['retention-days']).toBeGreaterThanOrEqual(7);
    const sk = czytaj(SKRYPT);
    expect(tekst + sk).toMatch(/6\.9/);
    expect(tekst + sk).toMatch(/ipad-13/);
  });

  test('zbierz: kanał alfa usunięty i sprawdzony, wymiary sprawdzone', () => {
    const run = (wf.jobs.zbierz.steps ?? []).map((k: any) => k.run ?? '').join('\n'); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(run).toMatch(/-alpha off/);
    expect(run).toMatch(/1320x2868|1320 ?× ?2868/);
    expect(run).toMatch(/2064x2752|2064 ?× ?2752/);
  });

  test('warunek OG-07: zrzuty 3 i 4 (wzór) idą do katalogu warunkowego, dopóki nie ma znacznika [og07-ok]', () => {
    const sk = czytaj(SKRYPT) + tekst;
    expect(sk).toMatch(/warunek-og07/);
    expect(sk).toMatch(/og07/i);
  });
});

describe('scenariusze zrzutów (e2e/zrzuty-sklepu)', () => {
  const pliki = fs.existsSync(path.join(KORZEN, KAT)) ? fs.readdirSync(path.join(KORZEN, KAT)).filter((f) => f.endsWith('.yaml')).sort() : [];
  const NAZWY = ['00-przygotuj', '01-dzis', '02-licznik', '03-wzor', '04-zakreslenie', '05-projekty', '06-historia', '07-kalendarz'];

  test('jest przygotowanie danych i siedem scen w kolejności z planu', () => {
    expect(pliki.map((f) => f.replace(/\.yaml$/, ''))).toEqual(NAZWY);
  });

  test('skrypt ma listę scen zgodną z plikami', () => {
    const sk = czytaj(SKRYPT);
    for (const n of NAZWY.slice(1)) expect(sk).toContain(n);
  });

  const kod = ['app', 'src'].flatMap(function skan(k: string): string[] {
    return fs.readdirSync(path.join(KORZEN, k), { withFileTypes: true }).flatMap((e) => {
      const p = path.join(k, e.name);
      if (e.isDirectory()) return /i18n/.test(p) ? [] : skan(p);
      return /\.(ts|tsx)$/.test(e.name) ? [fs.readFileSync(path.join(KORZEN, p), 'utf8')] : [];
    });
  }).join('\n');
  const readme = czytaj('e2e/README.md');

  test.each(pliki)('%s: każdy id: z selektora istnieje w kodzie aplikacji albo w README testID', (plik) => {
    const t = czytaj(`${KAT}/${plik}`);
    const idy = new Set([...t.matchAll(/id:\s*"([^"]+)"/g)].flatMap((m) => m[1].split('|')).map((id) => id.replace(/-\d{4}-\d{2}-\d{2}$/, '-'))); // historia-dzien-RRRR-MM-DD: wzorzec
    const brak = [...idy].filter((id) => !/^e2e-/.test(id) && !kod.includes(`'${id}'`) && !kod.includes(`"${id}"`) && !kod.includes(`\`${id}`) && !readme.includes(`\`${id}\``));
    expect(brak).toEqual([]);
  });

  test.each(pliki)('%s: appId aplikacji, nazwa pliku w nazwie scenariusza', (plik) => {
    const t = czytaj(`${KAT}/${plik}`);
    expect(t).toContain('appId: com.apps4brew.knitting');
    expect(t).toMatch(/^name: ".+"/m);
  });

  test('sceny nie wciskają +1 na ekranie licznika (panel pomiaru E2E „p95 … ms” zostałby w kadrze)', () => {
    for (const f of pliki.filter((x) => /^0[1-7]/.test(x))) expect({ f, plus: /id:\s*"licznik-plus"\s*\}\s*$/m.test(czytaj(`${KAT}/${f}`)) && /tapOn:\s*\{\s*id:\s*"licznik-plus"/.test(czytaj(`${KAT}/${f}`)) }).toEqual({ f, plus: false });
  });
  // Run 42777145130 (iPhone i iPad, te same porażki): zrzuty porażek pokazały stronę wzoru po „Kontynuuj ›” (04, 06) i okno „Uczciwe zasady” nad Projektami (05, 07).
  test('05 i 07 zamykają jednorazowe okno „Uczciwe zasady” przed czekaniem na listę projektów', () => {
    for (const f of ['05-projekty.yaml', '07-kalendarz.yaml']) {
      const t = czytaj(`${KAT}/${f}`);
      expect(t.indexOf('okno-uczciwe-zasady|projekty-lista')).toBeGreaterThan(-1);
      expect(t.indexOf('uczciwe-zasady-zamknij')).toBeGreaterThan(t.indexOf('okno-uczciwe-zasady|projekty-lista'));
      expect(t.indexOf('uczciwe-zasady-zamknij')).toBeLessThan(t.lastIndexOf('projekty-lista|projekty-dni-darmowe'));
    }
  });

  test('04 działa po restarcie na stronie wzoru i na liczniku; 06 (licznik) idzie w skrypcie przed 03 (po 03 „Kontynuuj ›” prowadzi do wzoru)', () => {
    const t04 = czytaj(`${KAT}/04-zakreslenie.yaml`);
    expect(t04).toMatch(/when:\s*\{\s*notVisible:\s*\{\s*id:\s*"wzor-widok"/);
    const sceny = /^SCENY="([^"]+)"/m.exec(czytaj('scripts/ci/zrzuty-sklepu.sh'))![1].split(' ');
    expect(sceny.indexOf('06-historia')).toBeLessThan(sceny.indexOf('03-wzor'));
    expect(sceny.indexOf('04-zakreslenie')).toBeGreaterThan(sceny.indexOf('03-wzor'));
  });
  test('iPad poziomo: zrzut z simctl (bufor pionowy, treść bokiem) jest obracany o 90° w lewo dla scen 03 i 04', () => {
    const sh = czytaj('scripts/ci/zrzuty-sklepu.sh');
    expect(sh).toMatch(/ORIENT_WZOR" = "LANDSCAPE_LEFT" \]\] ?&&|ORIENT_WZOR" = "LANDSCAPE_LEFT" \]/);
    expect(sh).toContain('sips -r 270 "$CEL/$scena.png"');
    expect(sh.indexOf('sips -r 270')).toBeGreaterThan(sh.indexOf('simctl io "$UDID" screenshot'));
    expect(sh.indexOf('sips -r 270')).toBeLessThan(sh.indexOf('pomiar "$CEL/$scena.png"'));
  });
});
