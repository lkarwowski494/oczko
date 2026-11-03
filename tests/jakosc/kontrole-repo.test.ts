// Kontrole repo roli 07 (strategia §10): każda reguła pada na pliku-pułapce i przechodzi na przypadku dobrym (zasada sceptyka 2).
import { mkdtempSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const KONTROLE = join(__dirname, '../../scripts/jakosc/kontrole-repo.mjs');
const WORKFLOWY = join(__dirname, '../../scripts/jakosc/sprawdz-workflowy.mjs');
const LICENCJE = join(__dirname, '../../scripts/jakosc/licencje.mjs');

function repo(pliki: Record<string, string>): string {
  const k = mkdtempSync(join(tmpdir(), 'kontrole-'));
  const wszystkie = { 'package.json': '{"dependencies":{}}', ...pliki };
  for (const [p, t] of Object.entries(wszystkie)) { mkdirSync(dirname(join(k, p)), { recursive: true }); writeFileSync(join(k, p), t); }
  return k;
}
const uruchom = (skrypt: string, k: string) => spawnSync('node', [skrypt, '--katalog', k], { encoding: 'utf8' });

const PULAPKI: [string, string, string][] = [
  ['OR-REPLACE', 'src/dane/repozytoria/licznik.ts', "export const q = `INSERT  OR\n REPLACE INTO licznik VALUES (?)`;"],
  ['EXCLUSIVE-TX', 'src/dane/baza/kolejka.ts', 'db.withExclusiveTransactionAsync(async () => {});'],
  ['BAZA-W-PAMIECI', 'src/dane/baza/polaczenie.ts', "open(':memory:');"],
  ['KOPIA-SAMEGO-DB', 'src/dane/archiwum.ts', "await FileSystem.copyAsync({ from: 'app.db', to: kopia });"],
  ['VACUUM-RATUNEK', 'src/dane/kopia-ratunkowa.ts', "await port.run('VACUUM');"],
  ['STARY-PLIK-0-1-0', 'src/dane/baza/sciezki.ts', "const s = 'Library/SQLite/oczko.db';"],
  ['SQLITE3-SWIFT', 'targets/widget/Intencja.swift', 'import Foundation\nimport SQLite3\n'],
  ['SZTUCZNY-SKLEP', 'src/ekrany/Oferty.tsx', "if (process.env.EXPO_PUBLIC_STORE_FAKE === '1') {}"],
  ['TRYB-E2E', 'src/ekrany/Licznik.tsx', "const e2e = process.env.EXPO_PUBLIC_E2E === '1';"],
  ['ATRAPA-ICLOUD', 'src/przypadki-uzycia/synchronizacja.ts', "const atrapa = process.env.EXPO_PUBLIC_ICLOUD_FAKE === '1';"],
  ['ATRAPA-ICLOUD', 'src/ekrany/StanDanych.tsx', "if (process.env.EXPO_PUBLIC_ICLOUD_FAKE) {}"],
  ['WYMUSZONA-AWARIA', 'src/ekrany/Start.tsx', "if (process.env.EXPO_PUBLIC_WYMUS_AWARIE) throw new Error('x');"],
  ['CENY-W-KODZIE', 'src/ekrany/Oferty.tsx', "const cena = '14,99 zł';"],
  ['CENY-W-KODZIE', 'src/komponenty/Plan.tsx', "const c = '$0.99';"],
  // M1-audytor-generalny-148 (07-jakosc-522, M2-koordynator-napraw-019): kod kopii awaryjnej, niezawodności, i18n i kompozycji w zakresie.
  ['VACUUM-RATUNEK', 'src/kompozycja/kopia-awaryjna.ts', "await port.run('VACUUM');"],
  ['KOPIA-SAMEGO-DB', 'src/kompozycja/kopia-awaryjna.ts', "await FileSystem.copyAsync({ from: 'app.db', to: kopia });"],
  ['OR-REPLACE', 'src/niezawodnosc/kopie.ts', "export const q = 'INSERT OR REPLACE INTO kopie VALUES (?)';"],
  ['CENY-W-KODZIE', 'src/i18n/i18n.ts', "const cena = '$4.99';"],
  ['WYMUSZONA-AWARIA', 'src/kompozycja/licznik.ts', "if (process.env.EXPO_PUBLIC_WYMUS_AWARIE) throw new Error('x');"],
];

describe('kontrole-repo.mjs (strategia §10, kontrola 05-8, P-089)', () => {
  test.each(PULAPKI)('R-171 pułapka %s w %s pada (kod 1)', (regula, plik, tekst) => {
    const w = uruchom(KONTROLE, repo({ [plik]: tekst }));
    expect(w.status).toBe(1);
    expect(w.stdout).toContain(regula);
  });
  test('R-171 dobre pliki (UPSERT, VACUUM INTO, przełącznik w adapterze sklepu, ceny ze StoreKit) przechodzą (kod 0)', () => {
    const w = uruchom(KONTROLE, repo({
      'src/dane/repozytoria/licznik.ts': "export const q = 'INSERT INTO licznik (id) VALUES (?) ON CONFLICT (id) DO UPDATE SET wartosc = excluded.wartosc';",
      'src/dane/kopia-ratunkowa.ts': "await port.run('VACUUM INTO ?', [cel]);",
      'src/platforma/sklep.ts': "export const sztuczny = process.env.EXPO_PUBLIC_STORE_FAKE === '1';",
      'src/platforma/icloud.ts': "export const atrapa = process.env.EXPO_PUBLIC_ICLOUD_FAKE === '1';", // F07-23 (P-230, moduly.md „Atrapa silnika w E2E”)
      'src/platforma/icloud-atrapa.ts': "export const wlaczona = process.env.EXPO_PUBLIC_ICLOUD_FAKE === '1';",
      'src/platforma/tryb-e2e.ts': "export const icloud = process.env.EXPO_PUBLIC_ICLOUD_FAKE === '1';",
      'src/dane/baza/adapter-node.ts': "new DatabaseSync(':memory:');",
      'src/ekrany/Oferty.tsx': 'export const Cena = ({ p }: { p: { cenaWyswietlana: string } }) => p.cenaWyswietlana;',
    }));
    expect(w.stdout).toContain('naruszeń 0');
    expect(w.status).toBe(0);
  });
  // M1-audytor-generalny-148 (zasada wspólna 21): zakres to cały kod aplikacji, nie lista ręczna — każdy wpis `src/*` repo (i nowy katalog) jest sprawdzany.
  test('M1-148 każdy katalog i plik src/* repo jest w zakresie kontroli (pułapka OR-REPLACE w każdym pada)', () => {
    const src = join(__dirname, '../../src');
    const wpisy = readdirSync(src).filter((n) => !n.startsWith('.')).map((n) => (statSync(join(src, n)).isDirectory() ? `src/${n}/pulapka.ts` : `src/${n}`));
    wpisy.push('src/nowy-katalog/pulapka.ts');
    const tekst = "export const q = 'INSERT OR REPLACE INTO t VALUES (?)';";
    const w = uruchom(KONTROLE, repo(Object.fromEntries(wpisy.map((p) => [p, tekst]))));
    expect(w.status).toBe(1);
    expect(wpisy.filter((p) => !w.stdout.includes(`OR-REPLACE ${p}:`))).toEqual([]);
  });
  test('R-171 testy są poza zakresem nowego kodu', () => {
    const w = uruchom(KONTROLE, repo({ 'src/dane/__tests__/x.test.ts': "open(':memory:')" }));
    expect(w.status).toBe(0);
  });
  // F07-08 (P-117 Q5a): kod 0.1.0 usunięty (P-099 D1a) nie wraca; wcześniej był poza zakresem (wyjątek DS-13) i tryb --stary go raportował.
  test.each(['src/core/database.ts', 'src/components/Przycisk.tsx', 'src/screens/Start.tsx', 'lib/i18n.ts'])('R-171 F07-08 pułapka: plik 0.1.0 %s pada (STARY-KOD-WRACA)', (plik) => {
    const w = uruchom(KONTROLE, repo({ [plik]: 'export const x = 1;' }));
    expect(w.status).toBe(1);
    expect(w.stdout).toContain('STARY-KOD-WRACA');
  });
  test('R-171 package.json: expo-updates, SDK awarii i nieprzypięta wersja padają', () => {
    const w = uruchom(KONTROLE, repo({ 'package.json': JSON.stringify({ dependencies: { 'expo-updates': '1.0.0', '@sentry/react-native': '6.0.0', 'expo-iap': '^5.8.1', 'expo-av': '1.0.0' } }) }));
    expect(w.status).toBe(1);
    for (const r of ['EXPO-UPDATES', 'SDK-AWARII', 'PRZYPIECIE', 'DZWIEK']) expect(w.stdout).toContain(r);
  });
  test.each(['@react-native-firebase/analytics', 'mixpanel-react-native', 'react-native-google-mobile-ads', 'react-native-appsflyer', 'expo-tracking-transparency'])('BR-ZAK-002/S1 KP-11 NFR-KOS-001 SDK analityki, reklam albo śledzenia %s pada', (pakiet) => {
    const w = uruchom(KONTROLE, repo({ 'package.json': JSON.stringify({ dependencies: { [pakiet]: '1.0.0' } }) }));
    expect(w.status).toBe(1);
    expect(w.stdout).toContain('SDK-SLEDZENIA');
  });
  test('BR-ZAK-002/S1 KP-11 app.json bez NSPrivacyTracking = false pada; z false przechodzi', () => {
    expect(uruchom(KONTROLE, repo({ 'app.json': JSON.stringify({ expo: { ios: { privacyManifests: { NSPrivacyTracking: true } } } }) })).stdout).toContain('SLEDZENIE app.json');
    expect(uruchom(KONTROLE, repo({ 'app.json': JSON.stringify({ expo: { ios: {} } }) })).stdout).toContain('SLEDZENIE app.json');
    expect(uruchom(KONTROLE, repo({ 'app.json': JSON.stringify({ expo: { ios: { privacyManifests: { NSPrivacyTracking: false } } } }) })).status).toBe(0);
  });
  test('R-171 app.json z włączoną sekcją updates pada (ADR-0021)', () => {
    const w = uruchom(KONTROLE, repo({ 'app.json': JSON.stringify({ expo: { ios: { privacyManifests: { NSPrivacyTracking: false } }, updates: { url: 'https://u.expo.dev/x' } } }) }));
    expect(w.stdout).toContain('EXPO-UPDATES app.json');
  });
  test('R-130 wydana migracja zmieniona po wydaniu pada (Z07-15)', () => {
    const w = uruchom(KONTROLE, repo({
      'src/dane/migracje/0001.sql': 'CREATE TABLE a (id TEXT);',
      'docs/jakosc/migracje-wydane.json': JSON.stringify({ migracje: [{ plik: 'src/dane/migracje/0001.sql', sha256: '0'.repeat(64) }] }),
    }));
    expect(w.status).toBe(1);
    expect(w.stdout).toContain('MIGRACJA-WYDANA');
  });
  // F07-07 (P-099, P-117 Q4a): każda zależność runtime ma wiersz w tabeli „Decyzja” ADR-0016; pierwsza kolumna, nazwy w `…`.
  const ADR16 = '# 0016. Zależności\n## Decyzja\n| Pakiet (wersja) | Przepływ | Alternatywa |\n|---|---|---|\n| `expo` 57.0.31, `react` 19.2.3 | podstawa | — |\n| `expo-router` z wymaganymi `react-native-screens` | nawigacja | `inny-router` |\n## Opcje\n| `poza-tabela` | — | — |\n';
  const zal = (d: string[]) => JSON.stringify({ dependencies: Object.fromEntries(d.map((n) => [n, '1.0.0'])) });
  test('R-171 F07-07 zależność z wierszem ADR-0016 (także wymagana w tym samym wierszu) przechodzi', () => {
    const w = uruchom(KONTROLE, repo({ 'docs/adr/0016-zaleznosci.md': ADR16, 'package.json': zal(['expo', 'react', 'expo-router', 'react-native-screens']) }));
    expect(w.stdout).toContain('naruszeń 0');
    expect(w.status).toBe(0);
  });
  test.each([['qrcode'], ['inny-router'], ['poza-tabela']])('R-171 F07-07 pułapka: zależność %s bez wiersza ADR-0016 (także tylko w kolumnie alternatyw lub poza sekcją Decyzja) pada', (pakiet) => {
    const w = uruchom(KONTROLE, repo({ 'docs/adr/0016-zaleznosci.md': ADR16, 'package.json': zal(['expo', pakiet]) }));
    expect(w.status).toBe(1);
    expect(w.stdout).toContain(`ZALEZNOSC-BEZ-ADR package.json: ${pakiet}`);
  });
  test('R-171 F07-07 zależności bez pliku ADR-0016 to błąd, nie zaliczenie', () => {
    const w = uruchom(KONTROLE, repo({ 'package.json': zal(['expo']) }));
    expect(w.status).toBe(1);
    expect(w.stdout).toContain('brak docs/adr/0016');
  });
  // F07-09 (P-117 Q6a): pliki sekretów z tests/public-repo.test.ts 0.1.0; bez .git kontrola przegląda wszystkie pliki katalogu.
  const KLUCZ = '-----BEGIN ' + 'PRIVATE KEY-----'; // sklejone, żeby ten plik nie zawierał bloku
  test.each([['AuthKey_X.p8', 'x'], ['cert/dist.p12', 'x'], ['ios/App.mobileprovision', 'x'], ['.env', 'K=1'], ['config/.env.production', 'K=1'], ['build/App.ipa', 'x'], ['docs/notatka.md', `a\n${KLUCZ}\nb`]])('R-171 F07-09 pułapka: %s pada (PLIK-SEKRETU)', (plik, tekst) => {
    const w = uruchom(KONTROLE, repo({ [plik]: tekst }));
    expect(w.status).toBe(1);
    expect(w.stdout).toContain(`PLIK-SEKRETU ${plik}`);
  });
  test('R-171 F07-09 dokument, który tylko wspomina o kluczu (bez bloku), przechodzi', () => {
    expect(uruchom(KONTROLE, repo({ 'docs/podpis.md': 'Klucz .p8 trzyma tylko sekret środowiska release.' })).status).toBe(0);
  });
  test('R-171 zły korzeń (bez package.json) to błąd, nie zaliczenie', () => {
    const k = mkdtempSync(join(tmpdir(), 'pusty-'));
    expect(uruchom(KONTROLE, k).status).toBe(2);
  });
});

describe('sprawdz-workflowy.mjs (ADR-0014, kontrola 05-9)', () => {
  const wf = (nazwa: string, tekst: string) => repo({ [`.github/workflows/${nazwa}`]: tekst });
  test('R-173 sekret poza środowiskiem release pada', () => {
    const w = uruchom(WORKFLOWY, wf('a.yml', 'on: push\njobs:\n  b:\n    runs-on: macos-26\n    steps:\n      - run: echo ${{ secrets.ASC_KEY_ID }}\n'));
    expect(w.status).toBe(1);
    expect(w.stdout).toContain('SEKRET-BEZ-SRODOWISKA');
  });
  test('R-173 dowolna nazwa sekretu (nie tylko ASC_*) też pada', () => {
    const w = uruchom(WORKFLOWY, wf('a.yml', 'on: push\njobs:\n  b:\n    runs-on: ubuntu-latest\n    env:\n      K: ${{ secrets.KLUCZ_PODPISU }}\n    steps:\n      - run: true\n'));
    expect(w.stdout).toContain('KLUCZ_PODPISU');
  });
  test.each(['pull_request', 'pull_request_target', 'workflow_run'])('R-173 wyzwalacz %s w workflowie z sekretami pada', (wyz) => {
    const w = uruchom(WORKFLOWY, wf('t.yml', `on:\n  ${wyz}:\n  push:\n    tags: ['v*']\njobs:\n  b:\n    runs-on: macos-26\n    environment: release\n    steps:\n      - run: echo \${{ secrets.ASC_KEY_ID }}\n`));
    expect(w.stdout).toContain('WYZWALACZ-Z-SEKRETAMI');
  });
  test('R-173 sekret w zadaniu z environment: release i wyzwalaczem tag przechodzi', () => {
    // F07-09: przypadek dobry spełnia też reguły JAK-10 (permissions, timeout-minutes).
    const w = uruchom(WORKFLOWY, wf('t.yml', "on:\n  push:\n    tags: ['v*']\n  workflow_dispatch:\npermissions:\n  contents: read\njobs:\n  b:\n    runs-on: macos-26\n    timeout-minutes: 30\n    environment: release\n    steps:\n      - run: echo ${{ secrets.ASC_KEY_ID }} ${{ secrets.GITHUB_TOKEN }}\n"));
    expect(w.status).toBe(0);
  });
  test.each(['WATCH_FAKE', 'E2E', 'PSEUDO'])('P-089 przełącznik EXPO_PUBLIC_%s w workflowie wydania pada', (p) => {
    const w = uruchom(WORKFLOWY, wf('t.yml', `on: workflow_dispatch\njobs:\n  b:\n    runs-on: macos-26\n    environment: release\n    env:\n      EXPO_PUBLIC_${p}: '1'\n    steps:\n      - run: true\n`));
    expect(w.stdout).toContain(`EXPO_PUBLIC_${p}`);
  });
  test('P-089 sztuczny sklep w workflowie wydania pada', () => {
    const w = uruchom(WORKFLOWY, wf('t.yml', "on: workflow_dispatch\njobs:\n  b:\n    runs-on: macos-26\n    environment: release\n    env:\n      EXPO_PUBLIC_STORE_FAKE: '1'\n    steps:\n      - run: true\n"));
    expect(w.stdout).toContain('SZTUCZNY-SKLEP-W-WYDANIU');
    // F07-23 (P-230): atrapa iCloud w workflowie wydania — ta sama reguła
    const i = uruchom(WORKFLOWY, wf('t.yml', "on: workflow_dispatch\njobs:\n  b:\n    runs-on: macos-26\n    environment: release\n    env:\n      EXPO_PUBLIC_ICLOUD_FAKE: '1'\n    steps:\n      - run: true\n"));
    expect(i.stdout).toContain('SZTUCZNY-SKLEP-W-WYDANIU');
    expect(i.stdout).toContain('EXPO_PUBLIC_ICLOUD_FAKE');
  });
  // F07-09 (P-117 Q6a, JAK-10): reguły z tests/public-repo.test.ts 0.1.0.
  const DOBRY = "on: push\npermissions:\n  contents: read\njobs:\n  b:\n    runs-on: ubuntu-latest\n    timeout-minutes: 10\n    steps:\n      - uses: actions/checkout@v5\n      - uses: org/akcja@0123456789abcdef0123456789abcdef01234567\n      - run: echo \"$T\"\n        env:\n          T: ${{ github.event.pull_request.title }}\n";
  test('R-173 F07-09 dobry workflow (permissions, timeout, akcja przypięta, dane zdarzenia przez env) przechodzi', () => {
    const w = uruchom(WORKFLOWY, wf('a.yml', DOBRY));
    expect(w.stdout).toContain('naruszeń 0');
    expect(w.status).toBe(0);
  });
  test.each([
    ['PULL-REQUEST-TARGET', DOBRY.replace('on: push', 'on: pull_request_target')],
    ['PERMISSIONS-KORZEN', DOBRY.replace('permissions:\n  contents: read\n', '')],
    ['PERMISSIONS-KORZEN', DOBRY.replace('contents: read', 'contents: write')],
    ['TIMEOUT', DOBRY.replace('    timeout-minutes: 10\n', '')],
    ['AKCJA-NIEPRZYPIETA', DOBRY.replace('org/akcja@0123456789abcdef0123456789abcdef01234567', 'org/akcja@v2')],
    ['DANE-ZDARZEN-W-RUN', DOBRY.replace('echo \"$T\"', 'echo \"${{ github.event.pull_request.title }}\"')],
    ['DANE-ZDARZEN-W-RUN', DOBRY.replace('echo \"$T\"', 'git checkout ${{ github.head_ref }}')],
  ])('R-173 F07-09 pułapka %s pada', (regula, tekst) => {
    const w = uruchom(WORKFLOWY, wf('a.yml', tekst));
    expect(w.status).toBe(1);
    expect(w.stdout).toContain(regula);
  });
  // 044 (07-jakosc-005, DS-07, zasada wspólna 21): instalacja Maestro tylko z przypiętą wersją, z błędem przy pustej i porównaniem z zainstalowaną.
  const MAESTRO = (env: string, run: string) => `on: push\npermissions:\n  contents: read\njobs:\n  e2e:\n    runs-on: macos-26\n    timeout-minutes: 10\n    steps:\n      - name: Maestro\n${env}        run: |\n${run.split('\n').map((l) => `          ${l}`).join('\n')}\n`;
  const RUN_DOBRY = '[ -n "$MAESTRO_VERSION" ] || { echo "::error::MAESTRO_VERSION pusta"; exit 1; }\ncurl -fsSL "https://get.maestro.mobile.dev" | bash\nv=$(maestro --version)\nprintf \'%s\\n\' "$v" | grep -qF "$MAESTRO_VERSION" || exit 1';
  test('044 instalacja Maestro z przypiętą wersją, strażnikiem pustej i porównaniem przechodzi', () => {
    const w = uruchom(WORKFLOWY, wf('a.yml', MAESTRO("        env:\n          MAESTRO_VERSION: '2.12.1'\n", RUN_DOBRY)));
    expect(w.stdout).toContain('naruszeń 0');
  });
  test.each([
    ['zmienna repo (bywa pusta)', MAESTRO('        env:\n          MAESTRO_VERSION: ${{ vars.MAESTRO_VERSION }}\n', RUN_DOBRY)],
    ['brak zmiennej', MAESTRO('', RUN_DOBRY)],
    ['cichy zjazd do najnowszej (unset)', MAESTRO("        env:\n          MAESTRO_VERSION: '2.12.1'\n", RUN_DOBRY.replace(/^\[[^\n]*/, '[ -n "$MAESTRO_VERSION" ] || unset MAESTRO_VERSION'))],
    ['bez porównania wersji', MAESTRO("        env:\n          MAESTRO_VERSION: '2.12.1'\n", RUN_DOBRY.replace(/\nv=.*$/s, ''))],
  ])('044 pułapka MAESTRO-WERSJA: %s pada', (_n, tekst) => {
    const w = uruchom(WORKFLOWY, wf('a.yml', tekst));
    expect(w.status).toBe(1);
    expect(w.stdout).toContain('MAESTRO-WERSJA');
  });
  test('R-173 brak workflowów to błąd, nie zaliczenie', () => {
    expect(uruchom(WORKFLOWY, repo({})).status).toBe(1);
  });
});

describe('ESLint src/dane (DS-12, kontrola 05-8)', () => {
  // ESLint przez CLI (konfiguracja płaska ładuje się dynamicznym importem, którego Jest nie obsługuje bez flag).
  const bledy = async (kod: string): Promise<string[]> => {
    const w = spawnSync('npx', ['eslint', '--format', 'json', '--stdin', '--stdin-filename', 'src/dane/pulapka.ts'], { input: kod, encoding: 'utf8', cwd: join(__dirname, '../..') });
    return JSON.parse(w.stdout)[0].messages.map((m: { ruleId: string }) => m.ruleId);
  };
  test('R-171 pusty catch pada', async () => {
    expect(await bledy('try { f(); } catch (e) {}')).toContain('no-empty');
  });
  test('R-171 withExclusiveTransactionAsync i OR REPLACE (także w szablonie) padają', async () => {
    expect(await bledy("db.withExclusiveTransactionAsync(async () => {}); const a = 'INSERT OR REPLACE INTO x'; const b = `insert or replace into ${'x'}`;")).toEqual(['no-restricted-syntax', 'no-restricted-syntax', 'no-restricted-syntax']);
  });
  test('R-171 catch z obsługą błędu przechodzi', async () => {
    expect(await bledy("try { f(); } catch (e) { zapiszBlad(e); throw e; }")).toEqual([]);
  });
});

describe('licencje.mjs (F07-09, P-117 Q6a; zastępuje scripts/licenses.mjs 0.1.0)', () => {
  const lock = (pakiety: Record<string, { license?: string; dev?: boolean; dependencies?: Record<string, string> }>) => JSON.stringify({
    packages: { '': { dependencies: Object.fromEntries(Object.keys(pakiety).filter((n) => !pakiety[n].dev && !n.includes('/node_modules/')).map((n) => [n, '1.0.0'])) },
      ...Object.fromEntries(Object.entries(pakiety).map(([n, e]) => [`node_modules/${n}`, { version: '1.0.0', ...e }])) },
  });
  const sprawdz = (p: Parameters<typeof lock>[0]) => uruchom(LICENCJE, repo({ 'package-lock.json': lock(p) }));
  test('R-171 F07-09 licencje permisywne, „A OR B” z permisywną, „A AND B” obu dozwolonych i wyjątek lightningcss przechodzą', () => {
    const w = sprawdz({ a: { license: 'MIT' }, b: { license: '(GPL-3.0 OR MIT)' }, c: { license: 'MIT AND Apache-2.0', dependencies: { lightningcss: '1.0.0' } }, lightningcss: { license: 'MPL-2.0' } });
    expect(w.stdout).toContain('naruszeń 0');
    expect(w.status).toBe(0);
  });
  test.each([['GPL-3.0'], ['AGPL-3.0'], ['LGPL-2.1'], ['MPL-2.0'], ['UNKNOWN'], ['SEE LICENSE IN LICENSE'], ['MIT AND GPL-2.0']])('R-171 F07-09 pułapka: pakiet produkcyjny z licencją %s pada', (lic) => {
    const w = sprawdz({ zly: { license: lic } });
    expect(w.status).toBe(1);
    expect(w.stdout).toContain('LICENCJA zly@1.0.0');
  });
  test('R-171 F07-09 zależność przechodnia też jest sprawdzana; pakiet dev nie', () => {
    expect(sprawdz({ a: { license: 'MIT', dependencies: { b: '1.0.0' } }, b: { license: 'GPL-3.0' } }).status).toBe(1);
    expect(sprawdz({ a: { license: 'MIT' }, d: { license: 'GPL-3.0', dev: true } }).status).toBe(0);
  });
  test('R-171 F07-09 brak package-lock.json to błąd, nie zaliczenie', () => {
    expect(uruchom(LICENCJE, repo({})).status).toBe(2);
  });
});
