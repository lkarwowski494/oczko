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
    expect(r.out).toMatch(/\| 30-nfr-dos-002-duzy-tekst \| 29108 \| AX5 \|/);
    expect(r.out).toMatch(/\| 31-nfr-wyd-001-reakcja-licznika \| 33200 \| czysty start \|/);
    expect(r.out).toMatch(/Czyste starty \(clearState, bez AX5 i powtórek\): n = 1, mediana 33200 ms, maks 33200 ms/); // CM-01: AX5 poza statystyką
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
    expect(r.out).toMatch(/\| podejscie-1\/31-nfr-wyd-001-reakcja-licznika \| 33200 \| powtórka \|/);
    expect(r.out).toMatch(/Czyste starty \(clearState, bez AX5 i powtórek\): n = 1, mediana 33200 ms, maks 33200 ms/); // CM-01: powtórka i AX5 poza statystyką
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

// KO-116 (recenzja niezależna CM, `docs/jakosc/cm-recenzja-pu162.md`): CM-01…CM-04 (P3).
describe('PU-162 CM-01: mediana i maks tylko z czystych startów; restart, AX5 i powtórki osobno nazwane', () => {
  const zLaunch = (scen: string, zmien: (l: Record<string, unknown>) => void): Wpis[] => {
    const w = odczytaj(scen);
    const l = w.find(jestLaunch) as Wpis;
    zmien(l.command.launchAppCommand as Record<string, unknown>);
    return w;
  };
  const przesun = (w: Wpis[], ile: number): Wpis[] => w.map((e) => ({ ...e, metadata: { ...e.metadata, duration: e.metadata.duration === undefined ? undefined : (jestDzis(e) && !('runFlowCommand' in e.command) ? (e.metadata.duration as number) + ile : e.metadata.duration) } }));

  test('PU-162 restart (launchApp bez clearState: true) ma rodzaj „restart” i nie wchodzi do mediany ani maks', () => {
    const r = cmd(katalog({
      [SC(S31)]: odczytaj(S31),
      [SC('91-pu-290-restart')]: zLaunch(S31, (l) => { l.clearState = false; }),
      [SC('92-bez-pola')]: zLaunch(S31, (l) => { delete l.clearState; }),
    }));
    expect(r.out).toMatch(/\| 91-pu-290-restart \| 33200 \| restart \|/);
    expect(r.out).toMatch(/\| 92-bez-pola \| 33200 \| restart \|/); // brak pola clearState = domyślnie false w Maestro
    expect(r.out).toMatch(/Czyste starty \(clearState, bez AX5 i powtórek\): n = 1, mediana 33200 ms, maks 33200 ms/);
  });

  test('PU-162 scenariusze AX5 (nazwa z „ax5” albo „duzy-tekst”) mają rodzaj „AX5”, także z clearState: true', () => {
    const r = cmd(katalog({ [SC(S30)]: odczytaj(S30), [SC('111-pu-138-ax5-przewodnik')]: odczytaj(S30), [SC(S31)]: odczytaj(S31) }));
    expect(r.out).toMatch(/\| 30-nfr-dos-002-duzy-tekst \| 29108 \| AX5 \|/);
    expect(r.out).toMatch(/\| 111-pu-138-ax5-przewodnik \| 29108 \| AX5 \|/);
    expect(r.out).toMatch(/n = 1, mediana 33200 ms, maks 33200 ms/);
  });

  test('PU-162 mediana i maks liczone tylko z czystych startów: powtórka, restart i AX5 o dużych wartościach ich nie zmieniają', () => {
    const wolny = przesun(odczytaj(S31), 50000); // 83200 ms
    const r = cmd(katalog({
      [SC('10-czysty-a')]: odczytaj(S31),
      [SC('11-czysty-b')]: odczytaj(S30),
      ['podejscie-1/' + SC('11-czysty-b')]: wolny,
      ['12.ponowienie/' + '2026-11-16_100216/x/commands.json']: wolny,
      [SC('13-restart')]: ((): Wpis[] => { const w = przesun(odczytaj(S31), 50000); (w.find(jestLaunch) as Wpis).command = { launchAppCommand: { appId: 'x', clearState: false } }; return w; })(),
      [SC('14-ax5-duzy-tekst')]: wolny,
    }));
    expect(r.out).toMatch(/Czyste starty \(clearState, bez AX5 i powtórek\): n = 2, mediana 31154 ms, maks 33200 ms/);
    expect(r.out).not.toMatch(/maks 83200/);
    expect(r.out).toMatch(/\| 12\.ponowienie \| 83200 \| powtórka \|/);
  });

  test('PU-162 brak czystych startów: linia „Czyste starty: brak”, bez mediany i maks', () => {
    const r = cmd(katalog({ [SC(S30)]: odczytaj(S30) }));
    expect(r.out).toMatch(/Czyste starty \(clearState, bez AX5 i powtórek\): brak/);
    expect(r.out).not.toMatch(/n = \d+, mediana/);
  });

  test('PU-162 opis: wiersze nie-czyste nie są porównywalne z czystymi (mediana i maks tylko z czystych startów)', () => {
    const t = cmd(FIKSTURY).out;
    expect(t).toMatch(/restart/i);
    expect(t).toMatch(/AX5/);
    expect(t).toMatch(/powtórk/i);
    expect(t).toMatch(/porównuj wiersz ze swoim wierszem/i);
  });

  test('PU-162 wszystkie scenariusze z tagiem osobny-krok (AX5) w e2e/scenariusze mają w nazwie „ax5” albo „duzy-tekst”', () => {
    const dir = path.join(KORZEN, 'e2e', 'scenariusze');
    const osobne = fs.readdirSync(dir).filter((f) => /^\d+-.*\.yaml$/.test(f) && /^\s*-\s*osobny-krok\s*$/m.test(fs.readFileSync(path.join(dir, f), 'utf8')));
    expect(osobne.length).toBeGreaterThan(0);
    const r = cmd(katalog(Object.fromEntries(osobne.map((f) => [SC(f.replace(/\.yaml$/, '')), odczytaj(S31)]))));
    for (const f of osobne) expect(r.out).toMatch(new RegExp(`\\| ${f.replace(/\.yaml$/, '')} \\| 33200 \\| AX5 \\|`));
  });
});

describe('PU-162 CM-02: etykieta i status z pliku nie rozbijają tabeli ani nie wprowadzają HTML', () => {
  test('PU-162 etykieta z „|”, „<” i „&” jest neutralizowana w wierszu tabeli', () => {
    const r = cmd(katalog({ [SC('x|<b>y&z')]: odczytaj(S31) }));
    expect(r.out).toMatch(/^\| x\\\|&lt;b>y&amp;z \| 33200 \| czysty start \|$/m);
    expect(r.out).not.toMatch(/<b>/);
    expect(r.out.split('\n').filter((l) => l.startsWith('| x')).every((l) => l.split(/(?<!\\)\|/).length === 5)).toBe(true); // 3 komórki + brzegi
  });

  test('PU-162 status asercji z „<” i „|” trafia do linii „brak danych” zneutralizowany i obcięty', () => {
    const w = odczytaj(S31);
    const i = w.findIndex((e) => jestDzis(e) && !('runFlowCommand' in e.command));
    (w[i] as Wpis).metadata.status = '<img src=x onerror=1>|' + 'z'.repeat(200);
    const r = cmd(katalog({ [SC('x<i>')]: w }));
    expect(r.out).not.toMatch(/<img|<i>/);
    expect(r.out).toMatch(/PU-162: brak danych \(x&lt;i>: asercja dzis-karta nie zakończona \(status &lt;img src=x onerror=1>\\\|z+/);
    const linia = r.out.split('\n').find((l) => l.startsWith('PU-162: brak danych')) as string;
    expect(linia.length).toBeLessThan(200);
  });
});

describe('PU-162 CM-03: zewnętrzny try/catch CLI (wyjątek poza zbieraniem wyników → kod 0 i linia „brak danych”)', () => {
  test('PU-162 wyjątek w odczycie katalogu (podmienione fs.readdirSync) → kod 0, linia „brak danych (błąd skryptu: …)”, bez śladu stosu', () => {
    const wstep = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'czas-startu-wstep-')), 'wstep.cjs');
    fs.writeFileSync(wstep, "require('fs').readdirSync = () => { throw new Error('EACCES: brak dostępu do katalogu (test)'); };\n");
    const d = katalog({ [SC(S31)]: odczytaj(S31) });
    const r = spawnSync('node', ['--require', wstep, SKRYPT, d], { encoding: 'utf8' });
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/^PU-162: brak danych \(błąd skryptu: EACCES: brak dostępu do katalogu \(test\)\)$/m);
    expect(r.stderr).not.toMatch(/at .*czas-startu/);
  });
});

describe('PU-162 CM-04: katalog przypadków użycia mówi to samo co skrypt i fikstury — plik `commands.json`', () => {
  test('PU-162 kolumna Pokrycie w katalogu nazywa plik commands.json (nie commands-*.json)', () => {
    const wiersz = fs.readFileSync(path.join(KORZEN, 'docs', 'jakosc', 'przypadki-uzycia.md'), 'utf8').split('\n').find((l) => l.startsWith('| PU-162 |')) as string;
    expect(wiersz).toMatch(/`commands\.json`/);
    expect(wiersz).not.toMatch(/commands-\*\.json/);
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
