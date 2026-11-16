/* PU-162 (KO-111, BX14; słowa właściciela 16.11.2026 11:10 UTC: „krok w workflow”): skrypt `scripts/ci/czas-startu.mjs` liczy z `commands.json` Maestro czas od
 * `launchApp` do widoczności `dzis-karta` i wypisuje go jako linie markdown do podsumowania przebiegu — informacyjnie, bez progu, nigdy czerwony (kod 0).
 * Fikstury: `tests/jakosc/dane/czas-startu/` (wycinki artefaktu `e2e-czesc-4-iphone`, przebieg 43828957399; README tamże).
 * Wzór: (timestamp + duration polecenia `dzis-karta`) − timestamp `launchApp`; pola `metadata` w ms (ustalenie BX13, zad. 4.4 część 1). */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { YAML } from './maestro-runner';

const KORZEN = path.join(__dirname, '..', '..');
const SKRYPT = path.join(KORZEN, 'scripts', 'ci', 'czas-startu.mjs');
const FIKSTURY = path.join(__dirname, 'dane', 'czas-startu');
const S30 = '30-nfr-dos-002-duzy-tekst', S31 = '31-nfr-wyd-001-reakcja-licznika';

type Wpis = { command: Record<string, unknown>; metadata: Record<string, unknown> };
const odczytaj = (scen: string): Wpis[] => {
  const dat = fs.readdirSync(path.join(FIKSTURY, scen))[0] as string;
  const nazwa = fs.readdirSync(path.join(FIKSTURY, scen, dat))[0] as string;
  return JSON.parse(fs.readFileSync(path.join(FIKSTURY, scen, dat, nazwa, 'commands.json'), 'utf8')) as Wpis[];
};
const jestDzis = (e: Wpis) => JSON.stringify((e.command.assertConditionCommand as { condition?: unknown } | undefined)?.condition ?? '').includes('"dzis-karta"');
const jestLaunch = (e: Wpis) => 'launchAppCommand' in e.command;

/** Katalog wyników jak e2e-out: `<podkatalog>/<data>/<nazwa>/commands.json` (+ dowolne inne pliki jako szum). */
function katalog(pliki: Record<string, Wpis[] | string>): string {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'czas-startu-'));
  for (const [rel, tresc] of Object.entries(pliki)) {
    const p = path.join(d, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, typeof tresc === 'string' ? tresc : JSON.stringify(tresc));
  }
  return d;
}
const cmd = (d: string, ...arg: string[]) => {
  const r = spawnSync('node', [SKRYPT, d, ...arg], { encoding: 'utf8' });
  return { kod: r.status, out: r.stdout, err: r.stderr };
};
const SC = (n: string) => `${n}/2026-11-16_100216/x/commands.json`;

describe('PU-162: czas startu z commands.json (wzór: koniec dzis-karta − początek launchApp)', () => {
  test('PU-162 dane prawdziwe: scenariusz 30 = 29108 ms, scenariusz 31 = 33200 ms (z fikstur, dzis-karta zaraz po launchApp)', () => {
    const r = cmd(FIKSTURY);
    expect(r.kod).toBe(0);
    expect(r.out).toMatch(new RegExp(`\\| ${S30} \\| 29108 \\|`));
    expect(r.out).toMatch(new RegExp(`\\| ${S31} \\| 33200 \\|`));
    expect(r.out).toMatch(/n = 2, mediana 31154 ms, maks 33200 ms/);
  });

  test('PU-162 opis: informacyjnie, bez progu, trend a nie czysty start (narzut Maestro)', () => {
    const t = cmd(FIKSTURY).out;
    expect(t).toMatch(/PU-162/);
    expect(t).toMatch(/informacyjnie/i);
    expect(t).toMatch(/bez progu/i);
    expect(t).toMatch(/trend/i);
    expect(t).toMatch(/narzut Maestro/i);
  });

  test('PU-162 brak katalogu, brak argumentu, pusty katalog: linia „brak danych (powód)” i kod 0', () => {
    const bezArgumentu = spawnSync('node', [SKRYPT], { encoding: 'utf8' });
    const wyniki = [
      cmd(path.join(os.tmpdir(), 'nie-ma-takiego-katalogu-czas-startu')),
      { kod: bezArgumentu.status, out: bezArgumentu.stdout },
      cmd(katalog({ 'x/inne.txt': 'nic' })),
    ];
    for (const w of wyniki) {
      expect(w.kod).toBe(0);
      expect(w.out).toMatch(/^PU-162: brak danych \(.+\)$/m);
    }
  });

  test('PU-162 brak pól czasu: bez duration asercji, bez timestamp launchApp, bez metadata → „brak danych”, kod 0, bez liczby ms', () => {
    const baza = odczytaj(S30);
    const bezDuration = baza.map((e) => (jestDzis(e) && !('runFlowCommand' in e.command) ? { ...e, metadata: { ...e.metadata, duration: undefined } } : e));
    const bezTimestamp = baza.map((e) => (jestLaunch(e) ? { ...e, metadata: { ...e.metadata, timestamp: 'x' } } : e));
    const bezMetadata = baza.map((e) => (jestLaunch(e) ? { command: e.command } as Wpis : e));
    for (const w of [bezDuration, bezTimestamp, bezMetadata]) {
      const r = cmd(katalog({ [SC(S30)]: w }));
      expect(r.kod).toBe(0);
      expect(r.out).toMatch(/PU-162: brak danych \(.*30-nfr-dos-002/);
      expect(r.out).not.toMatch(/\| 29108 \|/);
      expect(r.out).not.toMatch(/\| \d+ \|/);
    }
  });

  test('PU-162 brak dzis-karta (asercja na inny element, tylko opakowanie runFlow z dzis-karta w środku, asercja FAILED) → „brak danych”', () => {
    const baza = odczytaj(S30);
    const bezAsercji = baza.filter((e) => !(jestDzis(e) && !('runFlowCommand' in e.command)));
    const nieudana = baza.map((e) => (jestDzis(e) && !('runFlowCommand' in e.command) ? { ...e, metadata: { ...e.metadata, status: 'FAILED' } } : e));
    const tylkoOpakowanie = baza.filter((e) => 'runFlowCommand' in e.command);
    expect(tylkoOpakowanie.some((e) => JSON.stringify(e.command).includes('dzis-karta'))).toBe(true); // opakowanie nosi dzis-karta w środku — to nie jest pomiar
    for (const w of [bezAsercji, nieudana, tylkoOpakowanie]) {
      const r = cmd(katalog({ [SC(S30)]: w }));
      expect(r.kod).toBe(0);
      expect(r.out).toMatch(/PU-162: brak danych/);
      expect(r.out).not.toMatch(/\| \d+ \|/);
    }
  });

  test('PU-162 brak launchApp przed dzis-karta (launchApp dopiero po asercji) → „brak danych”', () => {
    const baza = odczytaj(S30).filter((e) => !('runFlowCommand' in e.command));
    const li = baza.findIndex(jestLaunch), di = baza.findIndex(jestDzis);
    const zamiana = baza.slice(); [zamiana[li], zamiana[di]] = [zamiana[di] as Wpis, zamiana[li] as Wpis];
    const r = cmd(katalog({ [SC(S30)]: zamiana }));
    expect(r.kod).toBe(0);
    expect(r.out).toMatch(/PU-162: brak danych/);
  });

  test('PU-162 uszkodzony JSON i nie-tablica → „brak danych”, kod 0', () => {
    for (const tresc of ['{', '{"command":1}', 'null']) {
      const r = cmd(katalog({ [SC(S30)]: tresc }));
      expect(r.kod).toBe(0);
      expect(r.out).toMatch(/PU-162: brak danych/);
    }
  });

  test('PU-162 kilka plików: dobre w tabeli, zły jako osobna linia „brak danych”, drugie podejście i ponowienie jako osobne wiersze', () => {
    const d = katalog({
      [SC(S30)]: odczytaj(S30),
      [SC(S31)]: odczytaj(S31),
      ['podejscie-1/' + SC(S31)]: odczytaj(S31),
      [SC('40-zepsuty')]: '{',
      ['kosz/e2e-out/obraz.png']: 'x',
    });
    const r = cmd(d);
    expect(r.kod).toBe(0);
    expect(r.out).toMatch(/\| 30-nfr-dos-002-duzy-tekst \| 29108 \|/);
    expect(r.out).toMatch(/\| 31-nfr-wyd-001-reakcja-licznika \| 33200 \|/);
    expect(r.out).toMatch(/\| podejscie-1\/31-nfr-wyd-001-reakcja-licznika \| 33200 \|/);
    expect(r.out).toMatch(/PU-162: brak danych \(40-zepsuty/);
    expect(r.out).toMatch(/n = 3, mediana 33200 ms, maks 33200 ms/);
  });

  test('PU-162 dwa launchApp i dwie asercje: liczy najbliższy launchApp przed pierwszą widocznością dzis-karta', () => {
    const baza = odczytaj(S30).filter((e) => !('runFlowCommand' in e.command));
    const li = baza.findIndex(jestLaunch);
    const wczesny: Wpis = { command: { launchAppCommand: { appId: 'x' } }, metadata: { status: 'COMPLETED', timestamp: 1000, duration: 5 } };
    const r = cmd(katalog({ [SC(S30)]: [...baza.slice(0, li), wczesny, ...baza.slice(li)] }));
    expect(r.out).toMatch(/\| 30-nfr-dos-002-duzy-tekst \| 29108 \|/);
  });

  test('PU-162 nie zmienia plików wejściowych i nie sięga do sieci (tylko odczyt katalogu)', () => {
    const tekst = fs.readFileSync(SKRYPT, 'utf8');
    expect(tekst).not.toMatch(/writeFile|appendFile|unlink|rmSync|rename|fetch\(|https?:\/\/|child_process|\bnet\b|process\.env\.\w*(TOKEN|SECRET|KEY)/i);
  });
});

// Krok workflowu (KO-111: „krok w workflow”): informacyjny, nigdy nie zmienia wyniku zadania, bez sekretów i sieci, tylko odczyt katalogu wyników Maestro.
describe('PU-162: krok „Czas startu (PU-162)” w jakosc-ios.yml, zadanie e2e', () => {
  type K = { name?: string; if?: string; run?: string; uses?: string; env?: Record<string, unknown>; 'continue-on-error'?: unknown; 'timeout-minutes'?: unknown };
  const tekst = fs.readFileSync(path.join(KORZEN, '.github/workflows/jakosc-ios.yml'), 'utf8');
  const kroki = (YAML.parse(tekst) as { jobs: { e2e: { steps: K[] } } }).jobs.e2e.steps;
  const idx = kroki.findIndex((k) => k.name === 'Czas startu (PU-162)');
  const krok = kroki[idx] as K;

  test('PU-162 krok istnieje w zadaniu e2e, po kroku „Scenariusze” i przed spakowaniem wyników', () => {
    expect(idx).toBeGreaterThan(-1);
    expect(idx).toBeGreaterThan(kroki.findIndex((k) => k.name === 'Scenariusze'));
    expect(idx).toBeLessThan(kroki.findIndex((k) => /^Spakowanie wyników/.test(k.name ?? '')));
  });

  test('PU-162 krok biegnie zawsze (if: always()) i nie może zmienić wyniku zadania (continue-on-error: true)', () => {
    expect(krok.if).toBe('always()');
    expect(krok['continue-on-error']).toBe(true);
    expect(typeof krok['timeout-minutes']).toBe('number');
  });

  test('PU-162 krok uruchamia skrypt na katalogu e2e-out i dopisuje do podsumowania; bez sekretów, sieci i innych poleceń', () => {
    expect(krok.run).toMatch(/node scripts\/ci\/czas-startu\.mjs e2e-out >> "\$GITHUB_STEP_SUMMARY"/);
    expect(krok.run).not.toMatch(/curl|wget|\bgh\b|git |npm |secrets\.|GITHUB_TOKEN|maestro|xcrun/);
    expect(krok.uses).toBeUndefined();
    expect(JSON.stringify(krok.env ?? {})).not.toMatch(/secrets\./);
  });
});
