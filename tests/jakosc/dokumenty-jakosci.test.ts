/* Kontrakt dokumentów roli 07 z wykonaniem (JAK-15, JAK-17; zasada wspólna 4: rejestr, nie pamięć). Dokumenty jakości są czytane przez
 * następne sesje 07 i 08 jako lista zadań i definicja ukończenia, więc zapowiedź pracy już wykonanej albo kontrola, której nie ma, to fałszywy sygnał. */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(__dirname, '..', '..');
const czytaj = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');

function plikiKodu(kat: string): string[] {
  const p = path.join(ROOT, kat);
  if (!fs.existsSync(p)) return [];
  return fs.readdirSync(p, { withFileTypes: true }).flatMap((d) => {
    const r = path.join(kat, d.name);
    if (d.isDirectory()) return plikiKodu(r);
    return /\.(ts|tsx)$/.test(d.name) ? [r] : [];
  });
}
const KOD = ['src', 'app'].flatMap(plikiKodu).map(czytaj).join('\n');
/** `wybor-*` → prefiks `wybor-`; `pole-x` → dokładnie; szuka literału w cudzysłowie (testID w propsach). */
const wKodzie = (id: string, kod = KOD): boolean => {
  const glob = id.endsWith('*');
  const rdzen = (glob ? id.slice(0, -1) : id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`['"\`]${rdzen}${glob ? '[a-z0-9-]+' : ''}['"\`]`).test(kod);
};

/** Pozycje „Czeka:” najnowszego wpisu stanu (pierwsza sekcja `# Stan`), rozbite na `(1) …`, `(2) …`. */
export function pozycjeCzeka(stan: string): string[] {
  const wpis = stan.split(/^# Stan/m)[1] ?? '';
  const linia = wpis.split('\n').find((l) => /\*\*Czeka:\*\*/.test(l)) ?? '';
  return linia.split(/\(\d+\)/).slice(1).map((s) => s.trim());
}
/** Zapowiedzi „08: testID `x`” w pozycjach Czeka, które kod już ma, a pozycja nie mówi „zrobione”. */
export function zapowiedziWykonane(stan: string, kod = KOD): string[] {
  return pozycjeCzeka(stan)
    .filter((p) => /\b08\b/.test(p) && /testID/.test(p) && !/zrobione/i.test(p))
    .flatMap((p) => [...p.matchAll(/`([a-z][a-z0-9-]*\*?)`/g)].map((m) => m[1]).filter((id) => wKodzie(id, kod)).map((id) => `${id} — ${p.slice(0, 80)}`));
}
/** Wiersze README E2E, które twierdzą, że scenariusze „stukają jeszcze po tekście”, choć ich pliki stukają już po `id` z kodu — bez oznaczenia „zastąpione”. */
export function wierszeNieaktualne(readme: string, scenariusz: (n: string) => string): string[] {
  return readme.split('\n').filter((l) => /stukają jeszcze po tekście/.test(l) && !/zastąpion/i.test(l)).filter((l) => {
    const ids = [...l.matchAll(/`([a-z][a-z0-9-]*\*?)`/g)].map((m) => m[1]).filter((id) => wKodzie(id));
    const nry = [...(l.match(/scenariusze ([\d, i]+) stukają/)?.[1] ?? '').matchAll(/\d+/g)].map((m) => m[0]);
    return ids.length > 0 && nry.length > 0 && nry.every((n) => ids.some((id) => scenariusz(n).includes(`id: "${id.replace('*', '')}`) || scenariusz(n).includes(`id: ${id.replace('*', '')}`)));
  });
}
const KAT_E2E = path.join(ROOT, 'e2e/scenariusze');
const scenariusz = (n: string): string => {
  const f = fs.readdirSync(KAT_E2E).find((x) => x.startsWith(`${n}-`));
  return f ? fs.readFileSync(path.join(KAT_E2E, f), 'utf8') : '';
};

describe('097 · stan roli 07 i README E2E nie zapowiadają pracy wykonanej (JAK-15; 07-jakosc-501)', () => {
  test('najnowszy wpis docs/jakosc/stan.md: „Czeka” bez testID dla 08, które kod już ma (albo z dopiskiem „zrobione”)', () => {
    expect(pozycjeCzeka(czytaj('docs/jakosc/stan.md')).length).toBeGreaterThan(0);
    expect(zapowiedziWykonane(czytaj('docs/jakosc/stan.md'))).toEqual([]);
  });
  test('e2e/README.md: wiersz „stukają jeszcze po tekście” oznaczony jako zastąpiony, gdy scenariusze stukają po id', () => {
    expect(wierszeNieaktualne(czytaj('e2e/README.md'), scenariusz)).toEqual([]);
  });
  test('pułapki: zapowiedź istniejącego testID i nieoznaczony wiersz README są wykrywane', () => {
    const stan = '# Stan · x\n- **Czeka:** (1) 08: testID `wybor-*` w `Arkusz.tsx`; (2) przebieg na macOS\n';
    expect(zapowiedziWykonane(stan, "testID: 'wybor-rodzaj-rzedy'")).toHaveLength(1);
    expect(zapowiedziWykonane(stan.replace('(1) 08', '(1) zrobione cb6f1ec: 08'), "testID: 'wybor-rodzaj-rzedy'")).toEqual([]);
    expect(zapowiedziWykonane(stan, "testID: 'inne'")).toEqual([]);
    const readme = '- x: kontrakt `wybor-*`; scenariusze 54, 56 stukają jeszcze po tekście — przejście na `id` po wdrożeniu';
    const scen = () => 'tapOn:\n    id: "wybor-rodzaj-oczka"';
    expect(wierszeNieaktualne(readme, scen)).toHaveLength(1);
    expect(wierszeNieaktualne(`${readme} (zastąpione wierszem niżej)`, scen)).toEqual([]);
    expect(wierszeNieaktualne(readme, () => 'tapOn: "Stitches"')).toEqual([]);
  });
});

/* 045 · strategia §3/§5/§10 opisuje to, co istnieje (JAK-17; 07-jakosc-006). Fragment wiersza tabeli (komórka albo jej część po „;”) z „plan, nie wykonano”
 * musi mieć ID decyzji albo [DO USTALENIA]; każdy inny fragment może wskazywać tylko istniejące pliki, zadania workflowów i narzędzia. */
const PLAN = /plan, nie wykonano/;
const ID_DECYZJI = /\b(P-\d{3}|DS-\d{2}|ADR-\d{4}|07-jakosc-\d{3})\b|\[DO USTALENIA\]/;
export const sekcja = (md: string, nr: number): string => {
  const i = md.search(new RegExp(`^## ${nr}\\. `, 'm'));
  if (i < 0) return '';
  const j = md.slice(i + 1).search(/^## /m);
  return j < 0 ? md.slice(i) : md.slice(i, i + 1 + j);
};
const fragmenty = (wiersz: string): string[] => wiersz.split('|').flatMap((k) => k.split(/;\s/)).map((f) => f.trim()).filter(Boolean);
function skan(kat: string): string[] {
  const p = path.join(ROOT, kat);
  if (!fs.existsSync(p) || !fs.statSync(p).isDirectory()) return [];
  return fs.readdirSync(p, { withFileTypes: true }).flatMap((d) => (d.name === 'node_modules' ? [] : d.isDirectory() ? skan(path.join(kat, d.name)) : [path.join(kat, d.name).split(path.sep).join('/')]));
}
const PLIKI_REPO: string[] = ['scripts', 'docs', '.github', 'tests', 'e2e', 'src', 'app', 'modules', 'targets'].flatMap((k) => skan(k)).concat(fs.readdirSync(ROOT));
type Repo = {
  pliki: string[]; zadania: Map<string, string[]>; skrypty: string[]; zaleznosci: string[]; swift: string; workflowy: string;
};
function repo(): Repo {
  const kat = path.join(ROOT, '.github/workflows');
  const zadania = new Map<string, string[]>();
  let workflowy = '';
  for (const f of fs.readdirSync(kat).filter((x) => /\.ya?ml$/.test(x))) {
    const t = fs.readFileSync(path.join(kat, f), 'utf8');
    workflowy += t;
    const jobs = t.slice(t.search(/^jobs:/m));
    zadania.set(f, [...jobs.matchAll(/^ {2}([a-z0-9][a-z0-9_-]*):\s*$/gm)].map((m) => m[1]));
  }
  const pkg = JSON.parse(czytaj('package.json'));
  const swift = PLIKI_REPO.filter((p) => p.endsWith('.swift')).map(czytaj).join('\n');
  return { pliki: PLIKI_REPO, zadania, skrypty: Object.keys(pkg.scripts ?? {}), zaleznosci: Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }), swift, workflowy };
}
export function rozjazdyStrategii(md: string, r: Repo): string[] {
  const bledy: string[] = [];
  const istnieje = (n: string) => (n.includes('/') ? r.pliki.includes(n) : r.pliki.some((p) => p === n || p.endsWith(`/${n}`)));
  const bazy = new Set(r.pliki.map((p) => path.basename(p).replace(/\.[^.]+$/, '')));
  for (const nr of [3, 5, 10]) {
    for (const wiersz of sekcja(md, nr).split('\n').filter((l) => l.startsWith('| ') && !/^\|\s*-/.test(l))) {
      const komorki = wiersz.split('|').map((k) => k.trim());
      const workflow = nr === 5 ? komorki[1].match(/`([a-z0-9-]+\.yml)`/)?.[1] : undefined;
      // Tabela decyzji DS-nn: kolumny (a)/(b) to opcje, nie twierdzenia o stanie; stan opisuje ostatnia kolumna (rekomendacja i stan).
      const doSprawdzenia = /^\| DS-\d/.test(wiersz) ? fragmenty(`| ${komorki[komorki.length - 2]} |`) : fragmenty(wiersz);
      for (const f of doSprawdzenia) {
        const gdzie = `§${nr} ${f.slice(0, 70)}`;
        if (PLAN.test(f)) { if (!ID_DECYZJI.test(f)) bledy.push(`${gdzie}: „plan, nie wykonano” bez ID decyzji`); continue; }
        for (const m of f.matchAll(/`([^`\s]+\.(?:mjs|cjs|js|ts|tsx|sh|yml|yaml|swift))`/g)) {
          if (/[*<…]/.test(m[1]) || /Trening/.test(f)) continue; // wzorzec z innego repo, nie plik Oczka
          if (!istnieje(m[1]) && !r.zadania.has(m[1])) bledy.push(`${gdzie}: brak pliku ${m[1]}`);
        }
        if (/Stryker/.test(f) && !/Trening ma/.test(f) && !r.zaleznosci.some((z) => z.startsWith('@stryker-mutator/'))) bledy.push(`${gdzie}: Stryker bez @stryker-mutator w package.json`);
        if (/performAccessibilityAudit/.test(f) && !r.swift.includes('performAccessibilityAudit(')) bledy.push(`${gdzie}: performAccessibilityAudit bez pliku Swift z wywołaniem`);
        if (/PROP_NOC/.test(f) && !/PROP_NOC/.test(r.workflowy)) bledy.push(`${gdzie}: PROP_NOC nie ustawia żaden workflow`);
        if (/--coverage|test:coverage/.test(f) && !/--coverage|test:coverage/.test(r.workflowy)) bledy.push(`${gdzie}: pokrycie nie biegnie w żadnym workflowie`);
        if (workflow) {
          const zad = r.zadania.get(workflow);
          if (!zad) { bledy.push(`${gdzie}: brak workflowu ${workflow}`); continue; }
          if (komorki.indexOf(f) === 4 || komorki[4].includes(f)) {
            const m = f.match(/^`([a-z][a-z0-9-]*)`/); // fragment komórki „Zadania” zaczyna się od nazwy zadania
            if (m) {
              const t = m[1];
              if (!(zad.includes(t) || r.skrypty.includes(t) || ['ubuntu-latest', 'macos-26'].includes(t) || bazy.has(t))) bledy.push(`${gdzie}: \`${t}\` nie jest zadaniem ${workflow}, skryptem npm ani plikiem repo`);
            }
          }
        }
      }
      if (nr === 5 && workflow === 'jakosc-linux.yml' && /TZ=/.test(wiersz)) {
        const t = r.workflowy.match(/TZ="\$tz" npx jest ([^\s|]+)/)?.[1];
        if (t && !wiersz.includes(`\`${t}\``)) bledy.push(`§5 jakosc-linux.yml: pętla stref uruchamia \`${t}\`, a wiersz tego nie mówi`);
      }
    }
  }
  return bledy;
}

describe('045 · strategia §3/§5/§10: tylko istniejące zadania i kontrole albo „plan, nie wykonano” z ID (JAK-17; 07-jakosc-006)', () => {
  test('docs/jakosc/strategia.md zgodna z workflowami, skryptami i package.json', () => {
    const md = czytaj('docs/jakosc/strategia.md');
    for (const nr of [3, 5, 10]) expect(sekcja(md, nr).length).toBeGreaterThan(100);
    expect(rozjazdyStrategii(md, repo())).toEqual([]);
  });
  test('pułapki: brak skryptu, zadania, Strykera i plan bez ID są wykrywane', () => {
    const r: Repo = { pliki: ['scripts/a.mjs'], zadania: new Map([['w.yml', ['build']]]), skrypty: ['test'], zaleznosci: [], swift: '', workflowy: 'TZ="$tz" npx jest tests/narzedzia' };
    const md = (s3: string, s5 = '| x |', s10 = '| x |') => `## 3. A\n${s3}\n## 5. B\n${s5}\n## 10. C\n${s10}\n`;
    expect(rozjazdyStrategii(md('| Artefakt | `scripts/b.mjs` |'), r)).toHaveLength(1);
    expect(rozjazdyStrategii(md('| Artefakt | `scripts/a.mjs` |'), r)).toEqual([]);
    expect(rozjazdyStrategii(md('| Mutacje | Stryker na `src/domena` |'), r)).toHaveLength(1);
    expect(rozjazdyStrategii(md('| Mutacje | Stryker: **plan, nie wykonano** (P-305) |'), r)).toEqual([]);
    expect(rozjazdyStrategii(md('| Mutacje | Stryker: **plan, nie wykonano** |'), r)).toHaveLength(1);
    expect(rozjazdyStrategii(md('| x |', '| `w.yml` | push | `macos-26` | `build`; `xctest` (cele) | bramka |'), r)).toHaveLength(1);
    expect(rozjazdyStrategii(md('| x |', '| `w.yml` | push | `macos-26` | `build`; `xctest`: **plan, nie wykonano** ([DO USTALENIA]) | bramka |'), r)).toEqual([]);
    expect(rozjazdyStrategii(md('| x |', '| `brak.yml` | push | x | y | z |'), r).length).toBeGreaterThan(0);
    expect(rozjazdyStrategii(md('| x |', '| `jakosc-linux.yml` | push | x | pętla `TZ=…` | z |'), { ...r, zadania: new Map([['jakosc-linux.yml', []]]) })).toHaveLength(1);
    expect(rozjazdyStrategii(md('| x |', '| x |', '| 11 | `performAccessibilityAudit` | XCTest |'), r)).toHaveLength(1);
    expect(rozjazdyStrategii(md('| DS-05 | Mutacje | **Stryker 9.6.1** | ręcznie | **(a)** |'), r)).toEqual([]);
    expect(rozjazdyStrategii(md('| DS-05 | Mutacje | **Stryker 9.6.1** | ręcznie | **(a)**: Stryker nocą |'), r)).toHaveLength(1);
  });
});

/* 046 · cel dotyku ≥ 44 pt: render testowy nie liczy układu (moduł e2e-mobilne, „Dostępność: co sprawdza które narzędzie”), więc test Jest może sprawdzić
 * tylko deklarację stylu. Nazwa testu nie twierdzi o celu dotyku; cel dotyku ma pozycję audytu w strategii §10 z decyzją (JAK-13; 07-jakosc-007). */
const TWIERDZENIE_DOTYKU = /cel\w* dotyku|obszar\w* (?:dotyku|trafienia)|hit ?region|\b44\s*pt\b|min\. 44/i;
export function nazwyTestow(zrodlo: string): string[] {
  return [...zrodlo.matchAll(/\b(?:test|it|describe)(?:\.(?:each|only|skip)\b[^\n]*?\))?\(\s*(['"`])((?:(?!\1).)*)\1/g)].map((m) => m[2]);
}
const nazwyZDotykiem = (zrodlo: string) => nazwyTestow(zrodlo).filter((n) => TWIERDZENIE_DOTYKU.test(n));
const PLIKI_TESTOW = skan('tests').filter((p) => /\.test\.tsx?$/.test(p) && !p.endsWith('tests/jakosc/dokumenty-jakosci.test.ts'));

describe('046 · nazwy testów Jest bez twierdzenia o celu dotyku; cel dotyku jako pozycja audytu (JAK-13; 07-jakosc-007)', () => {
  test('żaden test Jest nie nazywa sprawdzenia stylu „celem dotyku” ani „44 pt”', () => {
    expect(PLIKI_TESTOW.length).toBeGreaterThan(100);
    expect(PLIKI_TESTOW.flatMap((p) => nazwyZDotykiem(czytaj(p)).map((n) => `${p}: ${n}`))).toEqual([]);
  });
  test('strategia §10: pozycja audytu celu dotyku z podjętą decyzją (XCTest po prebuild albo przejście ręczne), bez [DO USTALENIA]', () => {
    const strategia = czytaj('docs/jakosc/strategia.md');
    const wiersze = sekcja(strategia, 10).split('\n').filter((l) => l.startsWith('| ') && /cel dotyku/.test(l));
    expect(wiersze).toHaveLength(1);
    expect(wiersze[0]).toMatch(/XCTest/);
    expect(wiersze[0]).toMatch(/przejście ręczne/);
    expect(wiersze[0]).not.toMatch(/\[DO USTALENIA/);
    expect(wiersze[0]).toMatch(/\bP-\d{3}\b/);
    // przejście ręczne ma pozycję na liście kandydata wydania (§8, „Pozycja bez wyniku na kandydacie = nie sprawdzono”)
    expect(sekcja(strategia, 8).split('\n').filter((l) => /^\| TT-\d{2} \|/.test(l) && /cel dotyku/.test(l))).toHaveLength(1);
  });
  test('pułapki: nazwy z twierdzeniem o dotyku są wykrywane, deklaracja stylu nie', () => {
    expect(nazwyZDotykiem("test('cel dotyku strzałki ≥ 44 pt', () => {")).toHaveLength(1);
    expect(nazwyZDotykiem("test('wiersz ma przycisk menu, min. 44 pt', () => {")).toHaveLength(1);
    expect(nazwyZDotykiem("  test.each([['a', 1]] as const)('motyw %s: obrys, tło, 44 pt', (_n) => {")).toHaveLength(1);
    expect(nazwyZDotykiem("test('strzałka: styl minHeight 44 (deklaracja)', () => {")).toEqual([]);
  });
});

/* 048 · rejestr kwarantanny (strategia §7; wzorce roli 07 „Polityka niestabilnych testów” pkt 4; JAK-05; 07-jakosc-009): każdy wpis ma ID testu, który
 * istnieje w repo, właściciela (rola), termin (data albo wersja wydania) i kontrolę zastępczą wskazującą istniejące pliki. */
type WpisKwarantanny = { id: string; wlasciciel: string; termin: string; zastepcza: string };
export function wpisyKwarantanny(md: string): WpisKwarantanny[] {
  const wiersze = md.split('\n').filter((l) => l.startsWith('| ') && !/^\|\s*-/.test(l));
  const [naglowek, ...dane] = wiersze;
  const kol = (naglowek ?? '').split('|').map((k) => k.trim().toLowerCase());
  const i = (n: string) => kol.findIndex((k) => k.startsWith(n));
  return dane.map((l) => l.split('|').map((k) => k.trim())).map((k) => ({ id: k[i('id')] ?? '', wlasciciel: k[i('właściciel')] ?? '', termin: k[i('termin')] ?? '', zastepcza: k[i('kontrola zastępcza')] ?? '' }));
}
export function bledyKwarantanny(md: string, kodTestow: string, istnieje: (p: string) => boolean): string[] {
  const kol = (md.split('\n').find((l) => l.startsWith('| ')) ?? '').toLowerCase();
  if (!['id', 'właściciel', 'termin', 'kontrola zastępcza'].every((n) => kol.includes(n))) return ['brak tabeli z kolumnami ID, Właściciel, Termin, Kontrola zastępcza'];
  return wpisyKwarantanny(md).flatMap((w) => {
    const b: string[] = [];
    const nazwa = w.id.match(/`([^`]+)`/)?.[1] ?? '';
    if (!nazwa || !kodTestow.includes(nazwa)) b.push(`${w.id}: ID testu nie występuje w kodzie testów`);
    if (!/\b(0[1-9]|1[0-2])-[a-z]/.test(w.wlasciciel)) b.push(`${w.id}: właściciel bez roli (np. 08-programista)`);
    if (!/\b\d{4}-\d{2}-\d{2}\b|\b\d+\.\d+\.\d+\b/.test(w.termin)) b.push(`${w.id}: termin bez daty ani wersji wydania`);
    const pliki = [...w.zastepcza.matchAll(/`([^`\s]+\.(?:ya?ml|tsx?|swift|mjs))`/g)].map((m) => m[1]);
    if (!pliki.length || pliki.some((p) => !istnieje(p))) b.push(`${w.id}: kontrola zastępcza bez istniejącego pliku`);
    return b;
  });
}

describe('048 · rejestr kwarantanny docs/jakosc/kwarantanna.md (JAK-05; 07-jakosc-009)', () => {
  const KOD_TESTOW = PLIKI_REPO.filter((p) => /\.(swift|tsx?|ya?ml)$/.test(p) && /(^tests\/|^e2e\/|Tests?\/)/.test(p)).map(czytaj).join('\n');
  const istnieje = (p: string) => PLIKI_REPO.some((x) => x === p || x.endsWith(`/${p}`));
  test('plik istnieje, wpisy mają ID testu z repo, właściciela, termin i kontrolę zastępczą', () => {
    expect(fs.existsSync(path.join(ROOT, 'docs/jakosc/kwarantanna.md'))).toBe(true);
    const md = czytaj('docs/jakosc/kwarantanna.md');
    expect(bledyKwarantanny(md, KOD_TESTOW, istnieje)).toEqual([]);
  });
  test('pułapki: wpis bez właściciela, terminu, z nieistniejącym testem albo bez kontroli zastępczej pada', () => {
    const tab = (w: string) => `| ID testu | Właściciel | Termin | Kontrola zastępcza |\n|---|---|---|---|\n${w}\n`;
    const kod = 'func testW1WordNaPdf()';
    const dobry = '| `testW1WordNaPdf` | 08-programista | 1.0.0 | scenariusz `25-word.yaml` |';
    expect(bledyKwarantanny(tab(dobry), kod, () => true)).toEqual([]);
    expect(bledyKwarantanny(tab(dobry.replace('08-programista', 'ktoś')), kod, () => true)).toHaveLength(1);
    expect(bledyKwarantanny(tab(dobry.replace('1.0.0', 'kiedyś')), kod, () => true)).toHaveLength(1);
    expect(bledyKwarantanny(tab(dobry.replace('testW1WordNaPdf', 'testNieMa')), kod, () => true)).toHaveLength(1);
    expect(bledyKwarantanny(tab(dobry), kod, () => false)).toHaveLength(1);
    expect(bledyKwarantanny('# Kwarantanna\n', kod, () => true)).toHaveLength(1);
  });
});
