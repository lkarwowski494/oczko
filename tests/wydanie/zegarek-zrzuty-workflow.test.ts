/* Workflow `zrzuty-zegarka.yml` i jego kontrakt z `asc-zrzuty.yml` (ZW1, KO-197, 2026-11-22; rola 10-wydanie, tryb fix).
 * Powód: App Store Connect odmawia „Add for Review” dla wersji 1.0 (build 1221): „Your binary indicates support for Apple Watch. You must provide an Apple Watch screenshot.”
 * Workflow nie biegnie lokalnie (macOS, ≥ 1 h z kolejką), a pomyłka w nazwie artefaktu albo w układzie katalogów wyszłaby dopiero przy wgrywaniu do App Store Connect.
 * Kontrakt wgrania (scripts/asc/zrzuty.mjs, readShots + `--zegarek <katalog>`): <katalog>/<język>/*.png, nazwa artefaktu `zegarek-zrzuty`. */
import * as fs from 'fs';
import * as path from 'path';
import { YAML } from '../jakosc/maestro-runner';
import { parse, wyzwalacze, type Krok } from '../jakosc/jakosc-ios-pomoc';

const KORZEN = path.join(__dirname, '..', '..');
const czytaj = (p: string) => fs.readFileSync(path.join(KORZEN, p), 'utf8');
const SCIEZKA = '.github/workflows/zrzuty-zegarka.yml';
const tekst = fs.existsSync(path.join(KORZEN, SCIEZKA)) ? czytaj(SCIEZKA) : '';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const wf: any = tekst ? { ...YAML.parse(tekst), ...parse(tekst) } : {};
const kroki = (zadanie: string): Krok[] => wf.jobs?.[zadanie]?.steps ?? [];
const asc = czytaj('.github/workflows/asc-zrzuty.yml');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ascWf: any = YAML.parse(asc);

describe('zrzuty-zegarka.yml: wyzwalacze i wejścia', () => {
  test('opis workflowu: 2 kadry na język (licznik, przypomnienie), bez kadru blokady (ZW2, P-1025: ucięty tekst)', () => {
    const naglowek = tekst.split('\n').slice(0, 12).join('\n');
    expect(naglowek).toMatch(/2 kadry na język: licznik rzędów, pas przypomnienia/);
    expect(naglowek).not.toMatch(/blokad|3 kadry/i);
  });

  test('istnieje; zadania plan (ubuntu) i zegarek (macos-26 jak jakosc-ios.yml, z limitem czasu)', () => {
    expect(tekst).not.toBe('');
    expect(Object.keys(wf.jobs ?? {})).toEqual(['plan', 'zegarek']);
    expect(wf.jobs.plan['runs-on']).toBe('ubuntu-latest');
    expect(wf.jobs.zegarek['runs-on']).toBe('macos-26');
    expect(wf.jobs.zegarek.needs).toBe('plan');
    expect(wf.jobs.zegarek.if).toBe("needs.plan.outputs.uruchom == 'true'");
    for (const z of ['plan', 'zegarek']) expect(typeof wf.jobs[z]['timeout-minutes']).toBe('number');
  });

  test('workflow_dispatch z wejściami jezyki (domyślnie en,pl) i urzadzenie (domyślnie pusty = Series 10/11/12, 416 × 496)', () => {
    const on = wyzwalacze(tekst) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(Object.keys(on.workflow_dispatch.inputs).sort()).toEqual(['jezyki', 'urzadzenie']);
    expect(on.workflow_dispatch.inputs.jezyki.default).toBe('en,pl');
    expect(on.workflow_dispatch.inputs.jezyki.description).toMatch(/"all"/);
    expect(on.workflow_dispatch.inputs.urzadzenie.default).toBe('');
    expect(on.workflow_dispatch.inputs.urzadzenie.description).toContain('416 × 496');
    expect(on.workflow_dispatch.inputs.jezyki.required).toBe(false);
    expect(on.workflow_dispatch.inputs.urzadzenie.required).toBe(false);
  });

  test('push ograniczony `paths` (nie zajmuje macOS przy każdym pushu, jak watch-sim.yml Treningu) i znacznikiem [zrzuty-zegarka] w pierwszej linii komunikatu', () => {
    const on = wyzwalacze(tekst) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(on.push.branches).toEqual(['claude/zw1-zegarek-zrzuty-2026-11-22', 'claude/youthful-pasteur-kx83sn']);
    expect(on.push.paths.length).toBeGreaterThan(0);
    expect(on.push.paths).toEqual(expect.arrayContaining(['.github/workflows/zrzuty-zegarka.yml', 'scripts/ci/zegarek-*', 'targets/watch/**']));
    for (const p of on.push.paths) expect(p).not.toMatch(/^\*\*?$|^\*\*\/\*$/); // żaden wzorzec nie obejmuje całego repo
    expect(tekst).toContain('[zrzuty-zegarka]');
    expect(tekst).toContain('[zegarek-jezyki:');
    expect(tekst).toMatch(/KOMUNIKAT=\$\(printf '%s\\n' "\$KOMUNIKAT" \| head -1\)/); // znaczniki tylko z pierwszej linii
    // push bez znacznika kończy się na planie: zadanie macOS ma warunek uruchom == 'true', a push bez [zrzuty-zegarka] ustawia uruchom=false
    expect(tekst).toMatch(/uruchom=false/);
    expect(tekst).toMatch(/case "\$KOMUNIKAT" in \*'\[zrzuty-zegarka\]'\*\) uruchom=true/);
  });

  test('plik wyzwalacza scripts/ci/zegarek-uruchomienie.txt istnieje i jest objęty `paths` (push bez zmiany pliku z paths nie uruchamia workflowu, więc pusty commit by nie wystarczył)', () => {
    const on = wyzwalacze(tekst) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const plik = 'scripts/ci/zegarek-uruchomienie.txt';
    expect(fs.existsSync(path.join(KORZEN, plik))).toBe(true);
    const wzorzec = (g: string) => new RegExp(`^${g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*')}$`);
    expect((on.push.paths as string[]).some((g) => wzorzec(g).test(plik))).toBe(true);
    expect(czytaj(plik)).toContain('[zrzuty-zegarka]');
    expect(tekst).toContain('scripts/ci/zegarek-uruchomienie.txt');
  });

  test('wejścia i komunikat commita trafiają do kroków przez env, nie przez interpolację w skrypcie; kody znaków sprawdzone przed zapisem do GITHUB_OUTPUT', () => {
    for (const [id, z] of Object.entries<any>(wf.jobs)) { // eslint-disable-line @typescript-eslint/no-explicit-any
      for (const k of z.steps ?? []) if (typeof k.run === 'string') expect({ id, krok: k.name, interpolacja: /\$\{\{\s*(github\.event\.|inputs\.)/.test(k.run) }).toEqual({ id, krok: k.name, interpolacja: false });
    }
    expect(tekst).toMatch(/case "\$jez" in \*\[!A-Za-z0-9,-\]\*\)/);
    expect(tekst).toMatch(/case "\$urz" in \*\[!/);
  });

  test('bez sekretów, bez środowiska release, bez zapisu do ASC i bez przełączników testowych aplikacji (kod aplikacji i celu zegarka bez zmian: kadry = build 1221)', () => {
    expect(tekst).not.toMatch(/secrets\.(?!GITHUB_TOKEN)/);
    expect(tekst).not.toMatch(/environment:/);
    // tylko wykonywalne części (run, env, with) — komentarze nagłówka opisują kontrakt z asc-zrzuty.yml i wolno w nich nazwać scripts/asc/zrzuty.mjs
    const wykonywalne = JSON.stringify(Object.values<any>(wf.jobs).flatMap((z) => (z.steps ?? []).map((k: Krok) => [k.run, k.env, (k as { with?: unknown }).with]))); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(wykonywalne).not.toMatch(/ASC_(KEY|ISSUER)|scripts\/asc\//);
    expect(tekst).not.toMatch(/EXPO_PUBLIC_(E2E|ZRZUTY|WATCH_FAKE|STORE_FAKE|ICLOUD_FAKE|WYMUS_AWARIE|PSEUDO)/);
    expect(wf.permissions).toEqual({ contents: 'read' }); // nie pobiera artefaktów z innych przebiegów, więc bez `actions: read` (najmniejsze uprawnienia)
  });
});

describe('zrzuty-zegarka.yml: budowa i zrzuty', () => {
  const run = (nazwa: RegExp) => kroki('zegarek').find((k) => nazwa.test(k.name ?? ''))?.run ?? '';
  const indeks = (nazwa: RegExp) => kroki('zegarek').findIndex((k) => nazwa.test(k.name ?? ''));

  test('Xcode przez select-xcode.sh 26; cel OczkoZegarek, Release, SDK watchsimulator, bez podpisu (jak archiwum w jakosc-ios.yml, ale dla symulatora)', () => {
    expect(tekst).toContain('.github/scripts/jakosc/select-xcode.sh 26');
    const b = run(/^Budowa celu zegarka/);
    expect(b).toContain('-target OczkoZegarek');
    expect(b).toContain('-configuration Release');
    expect(b).toContain('-sdk watchsimulator');
    expect(b).toContain('CODE_SIGNING_ALLOWED=NO');
    expect(b).toContain('set -o pipefail');
    expect(run(/^expo prebuild/)).toContain('npx expo prebuild --platform ios --no-install --clean');
    expect(fs.existsSync(path.join(KORZEN, '.github/scripts/jakosc/select-xcode.sh'))).toBe(true);
    expect(fs.existsSync(path.join(KORZEN, '.github/scripts/jakosc/ensure-ios-platform.sh'))).toBe(true);
    expect(tekst).toContain('.github/scripts/jakosc/ensure-ios-platform.sh');
  });

  test('kolejność: budowa → symulator → PARA z iPhone’em → zrzuty → komplet (para przed instalacją aplikacji: lekcja L-064 Treningu)', () => {
    const i = [/^Budowa celu zegarka/, /^Symulator zegarka/, /^Para z symulatorem iPhone/, /^Zrzuty ekranu/, /^Komplet/].map(indeks);
    expect(i.every((x) => x >= 0)).toBe(true);
    expect([...i].sort((a, b) => a - b)).toEqual(i);
  });

  test('skrypty wołane przez workflow istnieją, a zrzuty dostają katalog wyjściowy zegarek-zrzuty i dzień z planu', () => {
    for (const s of ['zegarek-symulator.sh', 'zegarek-para.sh', 'zegarek-zrzuty.sh', 'zegarek-kadry.mjs', 'splaszcz-png.mjs']) {
      expect(fs.existsSync(path.join(KORZEN, 'scripts/ci', s))).toBe(true);
    }
    expect(run(/^Symulator zegarka/)).toContain('scripts/ci/zegarek-symulator.sh');
    expect(run(/^Para z symulatorem/)).toContain('scripts/ci/zegarek-para.sh');
    expect(run(/^Zrzuty ekranu/)).toContain('bash scripts/ci/zegarek-zrzuty.sh "$UDID" "$APP" zegarek-zrzuty "$JEZYKI" "$DZIEN"');
    const env = kroki('zegarek').find((k) => /^Zrzuty ekranu/.test(k.name ?? ''))?.env ?? {};
    expect(env.JEZYKI).toBe('${{ needs.plan.outputs.jezyki }}');
    expect(env.DZIEN).toBe('${{ needs.plan.outputs.dzien }}');
  });

  test('komplet: kontrola języków × kadrów, rozmiaru (416x496 dla domyślnego zegarka) i alfy na tym samym katalogu, który idzie do artefaktu', () => {
    const r = run(/^Komplet/);
    expect(r).toContain('scripts/ci/zegarek-kadry.mjs komplet zegarek-zrzuty "$JEZYKI"');
    expect(r).toContain('ROZMIAR=416x496');
    expect(r).toMatch(/set -o pipefail/); // kod skryptu nie ginie w potoku do tee
  });
});

describe('zrzuty-zegarka.yml ↔ asc-zrzuty.yml: nazwa artefaktu, układ i wejście', () => {
  const wgraj = (): Krok & { with?: Record<string, string> } => (ascWf.jobs.zrzuty.steps as Array<Krok & { with?: Record<string, string> }>).find((k) => k.with?.name === 'zegarek-zrzuty') as Krok & { with?: Record<string, string> };
  const upload = () => (kroki('zegarek') as Array<Krok & { with?: Record<string, string> }>).find((k) => /^actions\/upload-artifact/.test(k.uses ?? '') && k.with?.name === 'zegarek-zrzuty');

  test('asc-zrzuty.yml pobiera artefakt `zegarek-zrzuty` do katalogu `zegarek-zrzuty` z wejścia `zegarek_z_przebiegu`', () => {
    expect(ascWf.on.workflow_dispatch.inputs.zegarek_z_przebiegu).toBeDefined();
    const d = wgraj();
    expect(d.uses).toMatch(/^actions\/download-artifact/);
    expect(d.with?.path).toBe('zegarek-zrzuty');
    expect(d.with?.['run-id']).toBe('${{ inputs.zegarek_z_przebiegu }}');
  });

  test('nazwa artefaktu i ścieżka z nowego workflowu = to, co pobiera asc-zrzuty.yml; artefakt zawsze (if: always) i z retencją > 3 dni (kolejka macOS + zatwierdzenie release)', () => {
    const u = upload();
    expect(u).toBeDefined();
    expect(u?.with?.name).toBe(wgraj().with?.name);
    expect(u?.with?.path).toBe('zegarek-zrzuty'); // korzeń artefaktu = katalogi języków (readShots czyta <katalog>/<język>/*.png)
    expect((u as { if?: string }).if).toBe('always()');
    expect(Number((u?.with as Record<string, unknown>)['retention-days'])).toBeGreaterThanOrEqual(7);
  });

  test('asc-zrzuty.yml przekazuje zegarek do skryptu (--zegarek zegarek-zrzuty) w planie i w zapisie, tylko gdy katalog istnieje', () => {
    const wystapienia = asc.match(/\[ -d zegarek-zrzuty \] && ARGS\+=\(--zegarek zegarek-zrzuty\)/g) ?? [];
    expect(wystapienia).toHaveLength(2);
  });

  test('artefakt nie zawiera katalogów roboczych: stany i obraz „bez stanu” leżą obok (zegarek-zrzuty.stany), nie w katalogu wgrywanym', () => {
    const skrypt = czytaj('scripts/ci/zegarek-zrzuty.sh');
    expect(skrypt).toContain('STANY="$OUT.stany"');
    expect(upload()?.with?.path).not.toContain('stany');
  });

  test('układ NN-<kadr>.png w katalogu języka kodem języka aplikacji = kody, które zna scripts/asc/zrzuty.mjs (SHOT_LOCALES)', () => {
    const zrzuty = czytaj('scripts/asc/zrzuty.mjs');
    expect(zrzuty).toContain('<katalog>/<język>/<stan>.png (zegarek)');
    expect(zrzuty).toMatch(/zegarek: opt\('--zegarek'\)/);
    expect(zrzuty).toMatch(/Źródła: 'iphone', 'ipad' i 'zegarek'/);
  });
});
