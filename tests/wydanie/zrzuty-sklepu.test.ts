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
    for (const z of ['[zrzuty-jezyki:', '[zrzuty-zadan:', '[zrzuty-urzadzenia:']) expect(tekst).toContain(z); // KO-032: języki, podział na zadania i urządzenia też z commita
    expect(Object.keys((on.workflow_dispatch as any).inputs)).toEqual(expect.arrayContaining(['jezyki', 'zadan', 'urzadzenia', 'aplikacja_z_przebiegu', 'og07'])); // eslint-disable-line @typescript-eslint/no-explicit-any
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

  test('zrzuty: macierz z zadania plan (urządzenie × porcja języków), najwyżej 3 naraz, urządzenia 6.9″ (1320×2868) i iPad 13″ (2064×2752)', () => {
    expect(wf.jobs.zrzuty.strategy.matrix.include).toContain('fromJSON(needs.plan.outputs.matrix)');
    expect(wf.jobs.zrzuty.strategy['max-parallel']).toBe(3);
    expect(wf.jobs.zrzuty['timeout-minutes']).toBeGreaterThanOrEqual(240); // ≈ 30 min na język, do 5 języków w zadaniu
    expect(tekst).toContain('scripts/ci/zrzuty-jezyki.mjs');
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

  test('zbierz: kanał alfa usunięty, wymiary i komplet sprawdzone skryptami, ramki i podpisy nałożone, artefakty surowy i końcowy', () => {
    const run = (wf.jobs.zbierz.steps ?? []).map((k: any) => k.run ?? '').join('\n'); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(run).toMatch(/-alpha off/);
    expect(run).toContain('scripts/ci/wymiary-asc.mjs');
    expect(run).toContain('scripts/ci/komplet-zrzutow.mjs');
    expect(run).toContain('scripts/ci/ramki-sklepu.sh');
    expect(run).toContain('fonts-noto-cjk');
    const nazwy = (wf.jobs.zbierz.steps ?? []).filter((k: any) => k.uses?.startsWith('actions/upload-artifact')).map((k: any) => k.with.name); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(nazwy).toEqual(expect.arrayContaining(['sklep-zrzuty-surowe', 'sklep-zrzuty-ramki']));
    const sk = czytaj('scripts/ci/wymiary-asc.mjs');
    expect(sk).toMatch(/1320, 2868/);
    expect(sk).toMatch(/2064, 2752/);
  });
  // 10-wydanie-002 (recenzja AB): jedna brakująca scena w jednym języku kończyła krok „komplet” czerwono i pomijała ramki dla WSZYSTKICH języków (≈ 10 h przebiegu `all` bez wyniku).
  test('zbierz: ramki i podpisy powstają także przy czerwonym komplecie (if: always()), a brak surowych zrzutów nie jest błędem tego kroku', () => {
    const kroki = wf.jobs.zbierz.steps ?? [];
    const komplet = kroki.findIndex((k: any) => /Komplet zrzutów/.test(k.name ?? '')); // eslint-disable-line @typescript-eslint/no-explicit-any
    const ramki = kroki.findIndex((k: any) => /^Ramki i podpisy/.test(k.name ?? '')); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(komplet).toBeGreaterThan(-1);
    expect(ramki).toBeGreaterThan(komplet);
    expect(String(kroki[ramki].if)).toMatch(/always\(\)/);
    expect(kroki[ramki].run).toMatch(/brak surowych zrzutów/); // pusty wynik zrzutów nie zaciemnia przyczyny czerwonego przebiegu drugim błędem
  });

  test('zrzut zakupu dla App Review: artefakt zrzut-zakupu z zadania z zakup=true, scena 99-zakup, skrypt robi go po angielsku', () => {
    const w = (wf.jobs.zrzuty.steps ?? []).find((k: any) => k.with?.name === 'zrzut-zakupu'); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(w).toBeDefined();
    expect(String(w.if)).toContain('matrix.zakup');
    const sh = czytaj(SKRYPT);
    expect(sh).toContain('99-zakup');
    expect(sh).toContain('99-zakup-ceny.png');
    expect(czytaj(`${KAT}/99-zakup.yaml`)).toMatch(/oferty-plan-dozywotni/);
    expect(tekst).toMatch(/EXPO_PUBLIC_STORE_FAKE: '1'/); // atrapa sklepu w buildzie zrzutów (ceny z sklep-sztuczny.ts)
  });

  // 10-wydanie-001 (recenzja AB, 10.11.2026): build zrzutów ma atrapę sklepu, więc ekran ofert kończy się panelem „Test store: expire access” (src/ekrany/Oferty.tsx, panelE2e);
  // zrzut dla App Review nie może go zawierać. Kodu aplikacji nie zmieniamy (P-238) — scena sprawdza brak panelu w kadrze po ostatnim przewinięciu, a zrzut robi skrypt zaraz po scenie.
  test('99-zakup: po ostatnim przewinięciu scena sprawdza, że panel atrapy sklepu (e2e-sklep-wygas) nie jest w kadrze', () => {
    const wiersze = czytaj(`${KAT}/99-zakup.yaml`).split('\n').filter((l) => !l.trim().startsWith('#'));
    const nr = (re: RegExp) => wiersze.findIndex((l) => re.test(l));
    const guard = nr(/^- assertNotVisible:\s*\{\s*id:\s*"e2e-sklep-wygas"\s*\}/);
    expect(guard).toBeGreaterThan(-1);
    const ostatniRuch = Math.max(...wiersze.map((l, i) => (/^- (scrollUntilVisible|scroll|swipe)\b/.test(l) ? i : -1)));
    expect(guard).toBeGreaterThan(ostatniRuch); // przewinięcie po sprawdzeniu mogłoby panel wciągnąć do kadru
    expect(guard).toBeGreaterThan(nr(/id:\s*"oferty-plan-dozywotni"/)); // plany są sprawdzone w tym samym kadrze
    expect(czytaj('src/kompozycja/e2e/panele.tsx')).toContain('testID="e2e-sklep-wygas"'); // id istnieje w kodzie (selektory e2e-* są zwolnione z kontroli id w tym pliku)
  });

  test('warunek OG-07: zrzuty 3 i 4 (wzór) idą do katalogu warunkowego, dopóki nie ma znacznika [og07-ok]', () => {
    const sk = czytaj(SKRYPT) + tekst;
    expect(sk).toMatch(/warunek-og07/);
    expect(sk).toMatch(/og07/i);
  });
});

describe('scenariusze zrzutów (e2e/zrzuty-sklepu)', () => {
  const pliki = fs.existsSync(path.join(KORZEN, KAT)) ? fs.readdirSync(path.join(KORZEN, KAT)).filter((f) => f.endsWith('.yaml')).sort() : [];
  const NAZWY = ['00-jezyk', '00-przygotuj', '01-dzis', '02-licznik', '03-wzor', '04-zakreslenie', '05-projekty', '06-historia', '07-kalendarz', '99-zakup'];

  test('jest wybór języka, przygotowanie danych, siedem scen w kolejności z planu i scena zakupu', () => {
    expect(pliki.map((f) => f.replace(/\.yaml$/, ''))).toEqual(NAZWY);
  });

  test('skrypt ma listę scen zgodną z plikami', () => {
    const sk = czytaj(SKRYPT);
    for (const n of NAZWY) expect(sk).toContain(n);
  });

  test('wiele języków (KO-032): sceny 01–07 nie zakładają żadnego napisu interfejsu — tylko id i dane fikcyjne; język wybiera 00-jezyk przez jezyk-<kod>', () => {
    for (const f of pliki.filter((x) => /^0[1-7]-/.test(x))) {
      const t = czytaj(`${KAT}/${f}`).split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');
      const teksty = [...t.matchAll(/text:\s*"([^"]*)"/g)].map((m) => m[1]);
      expect({ f, obce: teksty.filter((x) => !/^(Harbor Sweater|47|\.\*next: 3 knit, then cable\.\*)$/.test(x)) }).toEqual({ f, obce: [] });
      expect({ f, tapNaTekst: /tapOn:\s*"/.test(t) }).toEqual({ f, tapNaTekst: false });
    }
    const j = czytaj(`${KAT}/00-jezyk.yaml`);
    expect(j).toContain('id: "jezyk-${JEZYK}"');
    expect(j).toContain('ustawienia-jezyk');
    const sk = czytaj(SKRYPT);
    expect(sk).toContain('-e "JEZYK=$JEZYK_BIEZACY"');
    expect(sk).toMatch(/for JEZ in \$\{JEZYKI\/\/,\/ \}/);
    expect(sk).toContain('mkdir -p "$OUT/$ROZMIAR/$JEZ"');
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
    const brak = [...idy].filter((id) => !/^e2e-/.test(id) && !(id.includes('${') ? kod.includes(`\`${id.slice(0, id.indexOf('${'))}`) : kod.includes(`'${id}'`) || kod.includes(`"${id}"`) || kod.includes(`\`${id}`) || readme.includes(`\`${id}\``))); // id z parametrem (jezyk-${JEZYK}): prefiks jako szablon w kodzie (jezyk-${o.p})
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
