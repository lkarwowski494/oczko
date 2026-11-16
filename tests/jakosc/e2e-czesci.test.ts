/* Podział scenariuszy E2E (e2e/scenariusze) na części — scripts/ci/e2e-czesci.mjs (port tests/e2e-shards.test.ts Treningu @928d0ff).
 * Strategia §5 (DS-07, DS-11a), P-091 (9a: bez ponowień scenariuszy z asercją wartości licznika). Każdy scenariusz w DOKŁADNIE jednej części,
 * podział deterministyczny i zrównoważony, nowy scenariusz bez wagi nie ginie, pusty katalog = błąd (zasada 2 strategii §3). */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'child_process';

const root = path.join(__dirname, '..', '..');
const skrypt = path.join(root, 'scripts/ci/e2e-czesci.mjs');
const cfgPath = path.join(root, 'e2e/czesci.json');
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')) as { czesci: number; czesci_podstawowy: number; narzut_osobnego_kroku_s: number; wagi_s: Record<string, number> };
const katalog = path.join(root, 'e2e/scenariusze');

type Czesc = { czesc: number; files: string[]; osobne: string[]; waga_s: number; bez_ponowien: string[]; ponawialne: string[]; timeout_min: number };
const node = (args: string[], env: Record<string, string> = {}) => execFileSync('node', [skrypt, ...args], { encoding: 'utf8', env: { ...process.env, ONLY: '', PAKIET: '', COMMIT_MSG: '', GITHUB_OUTPUT: '', ...env } });
const plan = (dir = katalog, config = cfgPath): Czesc[] => JSON.parse(node(['plan', '--dir', dir, '--config', config]));
const planPodst = (dir = katalog): Czesc[] => JSON.parse(node(['plan-podstawowy', '--dir', dir]));
const scenariusze = (dir: string) => fs.readdirSync(dir).filter(f => /^\d{2,}-.*\.yaml$/.test(f)).sort();
const naglowek = (f: string, dir = katalog) => fs.readFileSync(path.join(dir, f), 'utf8').split(/^---$/m)[0];
const maTag = (f: string, tag: string, dir = katalog) => new RegExp(`^tags:\\n(?:\\s+- .*\\n)*?\\s+- ${tag}\\s*$`, 'm').test(naglowek(f, dir));
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-czesci-'));
const kopiaKatalogu = () => { const d = tmp(); fs.cpSync(katalog, d, { recursive: true }); return d; };
const wszystkieZ = (p: Czesc[]) => p.flatMap(c => [...c.files, ...c.osobne]);

describe('podział na części (pełny katalog)', () => {
  test('katalog ma scenariusze (pusta lista to błąd testu, nie zaliczenie)', () => {
    expect(scenariusze(katalog).length).toBeGreaterThanOrEqual(26);
  });

  test('każdy scenariusz w dokładnie jednej części, bez dubli i obcych plików; liczba części = konfiguracji', () => {
    const p = plan(); const all = wszystkieZ(p);
    expect([...all].sort()).toEqual(scenariusze(katalog).filter(f => !maTag(f, 'ipad')));
    expect(new Set(all).size).toBe(all.length);
    expect(p).toHaveLength(cfg.czesci);
    expect(cfg.czesci).toBeGreaterThanOrEqual(2);
  });

  test('deterministyczny (dwa uruchomienia = ten sam wynik) i zrównoważony: największa ≤ 115% średniej, różnica ≤ najdłuższy scenariusz', () => {
    const a = plan(); expect(plan()).toEqual(a);
    const w = a.map(c => c.waga_s); const sr = w.reduce((x, y) => x + y, 0) / w.length;
    expect(Math.max(...w)).toBeLessThanOrEqual(sr * 1.15);
    expect(Math.max(...w) - Math.min(...w)).toBeLessThanOrEqual(Math.max(...Object.values(cfg.wagi_s)) + cfg.narzut_osobnego_kroku_s);
  });

  test('wagi: bez przestarzałych wpisów (plik istnieje) i dodatnie liczby całkowite; suma części = suma wag (+ narzut osobnych kroków)', () => {
    for (const [f, v] of Object.entries(cfg.wagi_s)) expect({ f, istnieje: fs.existsSync(path.join(katalog, f)), calkowita: Number.isInteger(v) && v > 0 }).toEqual({ f, istnieje: true, calkowita: true });
    const p = plan(); const osobne = p.flatMap(c => c.osobne).length;
    const suma = scenariusze(katalog).filter(f => !maTag(f, 'ipad')).reduce((s, f) => s + cfg.wagi_s[f], 0);
    expect(p.reduce((s, c) => s + c.waga_s, 0)).toBe(suma + osobne * cfg.narzut_osobnego_kroku_s);
  });

  test('timeout części = 30 + 4 × liczba scenariuszy części (strategia §5)', () => {
    for (const c of plan()) expect(c.timeout_min).toBe(30 + 4 * (c.files.length + c.osobne.length));
  });

  test('P-091 (9a): scenariusze z tagiem stan-licznika są w bez_ponowien, pozostałe w ponawialne; zbiory rozłączne i pełne', () => {
    const p = plan();
    const bez = p.flatMap(c => c.bez_ponowien).sort(); const pon = p.flatMap(c => c.ponawialne).sort();
    expect(bez).toEqual(scenariusze(katalog).filter(f => !maTag(f, 'ipad') && maTag(f, 'stan-licznika')));
    expect(pon).toEqual(scenariusze(katalog).filter(f => !maTag(f, 'ipad') && !maTag(f, 'stan-licznika')));
    expect(bez.length).toBeGreaterThan(0); expect(pon.length).toBeGreaterThan(0);
    for (const c of p) expect([...c.bez_ponowien, ...c.ponawialne].sort()).toEqual([...c.files, ...c.osobne].sort());
  });

  test('tag osobny-krok trafia do listy osobne swojej części (nie do zwykłych)', () => {
    const p = plan(); const osobne = scenariusze(katalog).filter(f => maTag(f, 'osobny-krok'));
    expect(osobne.length).toBeGreaterThan(0);
    expect(p.flatMap(c => c.osobne).sort()).toEqual(osobne);
    expect(p.flatMap(c => c.files).filter(f => osobne.includes(f))).toEqual([]);
  });

  test('config.yaml Maestro wymienia każdy scenariusz katalogu (inaczej lokalny przebieg go pomija)', () => {
    const lista = [...fs.readFileSync(path.join(katalog, 'config.yaml'), 'utf8').matchAll(/^\s+- (\d{2,}-\S+\.yaml)\s*$/gm)].map(m => m[1]);
    expect(lista).toEqual(scenariusze(katalog));
  });
});

describe('scenariusz bez wagi i katalogi brzegowe', () => {
  test('NOWY scenariusz bez wagi trafia do dokładnie jednej części z wagą szacowaną z kroków (50 s + 1,86 s × krok)', () => {
    const d = kopiaKatalogu();
    fs.writeFileSync(path.join(d, '90-nowy-bez-wagi.yaml'), 'appId: x\nname: Nowy\n---\n- launchApp\n- extendedWaitUntil: { visible: "x", timeout: 1 }\n- tapOn: "a"\n- assertVisible: "b"\n');
    fs.writeFileSync(path.join(d, '91-drugi.yaml'), 'appId: x\nname: Drugi\n---\n- launchApp\n- assertVisible: "b"\n- runFlow: subflows/odstep.yaml\n');
    const p = plan(d); const all = wszystkieZ(p);
    expect([...all].sort()).toEqual(scenariusze(d).filter(f => !maTag(f, 'ipad', d)));
    expect(all.filter(f => /^9[01]-/.test(f))).toHaveLength(2);
    expect(Object.keys(cfg.wagi_s)).not.toContain('90-nowy-bez-wagi.yaml');
    /* suma wag rośnie dokładnie o szacunki: 4 kroki → 57 s; 3 kroki + podprzepływ (1 krok) → 4 kroki → 57 s */
    const przed = plan().reduce((s, c) => s + c.waga_s, 0); const po = p.reduce((s, c) => s + c.waga_s, 0);
    expect(po - przed).toBe(Math.round(50 + 1.86 * 4) * 2);
  });

  test('pusty katalog i brak katalogu kończą się błędem (nie pustym planem)', () => {
    const d = tmp();
    expect(() => execFileSync('node', [skrypt, 'plan', '--dir', d], { stdio: 'pipe' })).toThrow();
    fs.writeFileSync(path.join(d, 'config.yaml'), 'flows: []\n'); fs.mkdirSync(path.join(d, 'subflows'));
    expect(() => execFileSync('node', [skrypt, 'plan', '--dir', d], { stdio: 'pipe' })).toThrow();
    expect(() => execFileSync('node', [skrypt, 'plan', '--dir', path.join(d, 'nie-ma')], { stdio: 'pipe' })).toThrow();
  });

  test('cykl runFlow w podprzepływach to błąd (szacunek kroków nie zapętla się)', () => {
    const d = kopiaKatalogu();
    fs.writeFileSync(path.join(d, 'subflows', 'a.yaml'), 'appId: x\n---\n- runFlow: b.yaml\n');
    fs.writeFileSync(path.join(d, 'subflows', 'b.yaml'), 'appId: x\n---\n- runFlow: a.yaml\n');
    fs.writeFileSync(path.join(d, '92-cykl.yaml'), 'appId: x\nname: C\n---\n- runFlow: subflows/a.yaml\n');
    expect(() => execFileSync('node', [skrypt, 'plan', '--dir', d], { stdio: 'pipe' })).toThrow();
  });
});

describe('pakiet podstawowy (tag podstawowy; bramka TestFlight, P-091 9a)', () => {
  const PRZEPLYWY = ['NFR-PIE-001', 'BR-LIC-002-S1', 'BR-ZAK-006-S1', 'BR-ZAK-001-S1', 'P-089-3a', 'BR-DAN-006-S1', 'ADR-0019'];
  test('pakiet obejmuje główny przepływ strategii (pierwsze +1 offline, +1/−1/cofnij, limit zawczasu, zakup i przywrócenie, „Uczciwe zasady”, eksport/import, start awaryjny)', () => {
    const podst = scenariusze(katalog).filter(f => maTag(f, 'podstawowy'));
    for (const id of PRZEPLYWY) expect({ id, pliki: podst.filter(f => maTag(f, id)).length > 0 }).toEqual({ id, pliki: true });
  });
  test('plan podstawowy = dokładnie scenariusze z tagiem, na czesci_podstawowy maszynach, zrównoważony ≤ 115% średniej', () => {
    const p = planPodst();
    expect(wszystkieZ(p).sort()).toEqual(scenariusze(katalog).filter(f => maTag(f, 'podstawowy')));
    expect(p).toHaveLength(cfg.czesci_podstawowy);
    const w = p.map(c => c.waga_s); const sr = w.reduce((x, y) => x + y, 0) / w.length;
    expect(Math.max(...w)).toBeLessThanOrEqual(sr * 1.15);
  });
});

describe('polecenie „czesc” (krok „Plan części” w jakosc-ios.yml)', () => {
  const run = (n: number, env: Record<string, string> = {}) => {
    const out = path.join(tmp(), 'czesc'); const gh = path.join(tmp(), 'out.txt'); fs.writeFileSync(gh, '');
    const log = node(['czesc', String(n), '--out', out], { GITHUB_OUTPUT: gh, ...env });
    const o = Object.fromEntries(fs.readFileSync(gh, 'utf8').trim().split('\n').map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })) as Record<string, string>;
    const pliki = fs.existsSync(out) ? scenariusze(out) : []; const osobne = fs.existsSync(path.join(out, 'osobne')) ? scenariusze(path.join(out, 'osobne')) : [];
    return { log, o, pliki, osobne, sub: fs.existsSync(path.join(out, 'subflows')) };
  };

  test('PAKIET=pelny: katalog części = jej scenariusze + subflows; razem wszystkie; wyjścia ponawialne/bez_ponowien/timeout zgodne z planem', () => {
    const p = plan(); const rs = p.map(c => run(c.czesc, { PAKIET: 'pelny' }));
    rs.forEach((r, i) => {
      expect(r.pliki).toEqual(p[i].files); expect(r.osobne).toEqual(p[i].osobne); expect(r.sub).toBe(true);
      expect(r.o.any).toBe('true'); expect(r.o.timeout_min).toBe(String(p[i].timeout_min));
      expect(r.o.bez_ponowien.split(' ').filter(Boolean).sort()).toEqual(p[i].bez_ponowien);
      expect(r.o.ponawialne.split(' ').filter(Boolean).sort()).toEqual(p[i].ponawialne);
    });
    expect(rs.flatMap(r => [...r.pliki, ...r.osobne]).sort()).toEqual(scenariusze(katalog).filter(f => !maTag(f, 'ipad')));
  });

  test('P-834: domyślnie (bez PAKIET i bez znacznika) pakiet przypadków użycia = wszystkie scenariusze telefonu, jak pełny', () => {
    const rs = Array.from({ length: cfg.czesci }, (_, i) => run(i + 1));
    expect(rs.flatMap(r => [...r.pliki, ...r.osobne]).sort()).toEqual(scenariusze(katalog).filter(f => !maTag(f, 'ipad')));
    expect(rs[0].log).toMatch(/^Pakiet: przypadki\./);
    const pelny = plan().map(c => run(c.czesc, { PAKIET: 'pelny' }));
    rs.forEach((r, i) => { expect(r.pliki).toEqual(pelny[i].pliki); expect(r.o.bramka).toBe(pelny[i].o.bramka); });
  });

  test('PAKIET=podstawowy (jawnie): dokładnie scenariusze z tagiem; nadmiarowa część kończy bez pracy (any=false)', () => {
    const p = planPodst(); const rs = Array.from({ length: cfg.czesci }, (_, i) => run(i + 1, { PAKIET: 'podstawowy' }));
    expect(rs.flatMap(r => r.pliki).sort()).toEqual(wszystkieZ(p).sort());
    expect(rs.slice(cfg.czesci_podstawowy).every(r => r.o.any === 'false' && r.pliki.length === 0)).toBe(true);
    expect(rs[0].log).toMatch(/^Pakiet: podstawowy\./);
  });

  test('DS-11a: „[e2e-pelny]” w treści commitu włącza pełny katalog; jawny PAKIET ma pierwszeństwo; zły PAKIET to błąd', () => {
    const rs = plan().map(c => run(c.czesc, { COMMIT_MSG: '08 build: licznik [e2e-pelny]' }));
    expect(rs.flatMap(r => [...r.pliki, ...r.osobne]).sort()).toEqual(scenariusze(katalog).filter(f => !maTag(f, 'ipad')));
    expect(run(1, { COMMIT_MSG: '[e2e-pelny]', PAKIET: 'podstawowy' }).log).toMatch(/^Pakiet: podstawowy\./);
    expect(() => execFileSync('node', [skrypt, 'czesc', '1', '--out', path.join(tmp(), 'x')], { stdio: 'pipe', env: { ...process.env, PAKIET: 'wszystko' } })).toThrow();
  });

  test('ONLY="04 10": tylko te dwa, każdy w swojej stałej części pełnego planu; „0” nie wybiera 01–09 (całe numery)', () => {
    const p = plan(); const rs = p.map(c => run(c.czesc, { ONLY: '04 10' }));
    expect(rs.flatMap(r => r.pliki).sort()).toEqual(scenariusze(katalog).filter(f => /^(04|10)-/.test(f)));
    rs.forEach((r, i) => { expect(r.pliki).toEqual(p[i].files.filter(f => /^(04|10)-/.test(f))); expect(r.o.any).toBe(String(r.pliki.length > 0)); });
    expect(p.flatMap(c => run(c.czesc, { ONLY: '0' }).pliki)).toEqual([]);
    expect(rs.flatMap(r => r.o.bez_ponowien.split(' ').filter(Boolean)).sort()).toEqual(scenariusze(katalog).filter(f => /^(04|10)-/.test(f))); /* oba mają asercję wartości licznika */
  });

  test('F07-15 (P-198 Q1a) + P-834: wyjście bramka — przypadki/pełny: każdy scenariusz części poza tagiem oczekujacy (pakiet podstawowy w całości); podstawowy: wszystkie; ONLY: tag podstawowy', () => {
    const lista = (s: string) => s.split(' ').filter(Boolean).sort();
    const podst = scenariusze(katalog).filter(f => maTag(f, 'podstawowy'));
    const oczek = scenariusze(katalog).filter(f => maTag(f, 'oczekujacy'));
    expect(podst.filter(f => oczek.includes(f))).toEqual([]); /* scenariusz bramki TestFlight nie może być oczekujący */
    for (const env of [{ PAKIET: 'pelny' }, {}] as Record<string, string>[]) {
      const rs = plan().map(c => run(c.czesc, env));
      rs.forEach(r => expect(lista(r.o.bramka)).toEqual([...r.pliki, ...r.osobne].filter(f => !oczek.includes(f)).sort()));
      expect(rs.flatMap(r => lista(r.o.bramka)).filter(f => podst.includes(f)).sort()).toEqual(podst);
    }
    const podstawowy = Array.from({ length: cfg.czesci }, (_, i) => run(i + 1, { PAKIET: 'podstawowy' }));
    podstawowy.forEach(r => expect(lista(r.o.bramka)).toEqual([...r.pliki, ...r.osobne].sort()));
    expect(plan().flatMap(c => lista(run(c.czesc, { ONLY: '04 14' }).o.bramka))).toEqual(scenariusze(katalog).filter(f => /^04-/.test(f))); /* 14 bez tagu podstawowy */
    expect(podst.length).toBeGreaterThan(0);
  });

  test('P-834: scenariusz z tagiem oczekujacy biegnie w pakiecie przypadków, ale poza bramką (katalog tymczasowy)', () => {
    const d = tmp(); fs.cpSync(katalog, d, { recursive: true });
    const f = scenariusze(d).find(x => !maTag(x, 'ipad', d) && !maTag(x, 'podstawowy', d) && !maTag(x, 'osobny-krok', d))!;
    const t = fs.readFileSync(path.join(d, f), 'utf8'); expect(t).toMatch(/^tags:\n/m);
    fs.writeFileSync(path.join(d, f), t.replace(/^tags:\n/m, 'tags:\n  - oczekujacy\n'));
    const out = path.join(tmp(), 'czesc'); const gh = path.join(tmp(), 'out.txt');
    const wyniki = Array.from({ length: cfg.czesci }, (_, i) => {
      fs.writeFileSync(gh, ''); const log = node(['czesc', String(i + 1), '--out', out, '--dir', d], { GITHUB_OUTPUT: gh });
      return { log, bramka: /^bramka=(.*)$/m.exec(fs.readFileSync(gh, 'utf8'))![1].split(' '), pliki: scenariusze(out) };
    });
    expect(wyniki.flatMap(w => w.pliki)).toContain(f);
    expect(wyniki.flatMap(w => w.bramka)).not.toContain(f);
    expect(wyniki.map(w => w.log).join('\n')).toMatch(new RegExp(`${f.replace(/[.]/g, '\\.')}.*\\(oczekujący: informacyjnie\\)`));
  });

  test('P-225 Q1a: tag ipad — poza pakietem podstawowym i pełnym; PAKIET=ipad daje tylko je na czesci_ipad maszynach; od P-834 przy każdym przebiegu (wcześniej tylko [e2e-pelny]/[e2e-ipad])', () => {
    const ipad = scenariusze(katalog).filter(f => maTag(f, 'ipad'));
    expect(ipad.length).toBeGreaterThan(0);
    const pelny = plan().map(c => run(c.czesc, { PAKIET: 'pelny' }));
    expect(pelny.flatMap(r => [...r.pliki, ...r.osobne]).filter(f => ipad.includes(f))).toEqual([]);
    expect(wszystkieZ(planPodst()).filter(f => ipad.includes(f))).toEqual([]);
    const r = run(1, { PAKIET: 'ipad', COMMIT_MSG: '08: wzory [e2e-pelny]' });
    expect([...r.pliki, ...r.osobne].sort()).toEqual(ipad);
    expect(r.o.bramka).toBe(''); /* iPad bez bramki do pierwszego zielonego (P-225 Q1a) */
    expect(run(1, { PAKIET: 'ipad', COMMIT_MSG: 'x [e2e-ipad]' }).o.any).toBe('true');
    expect(run(1, { PAKIET: 'ipad', COMMIT_MSG: '08: zwykły push' }).o.any).toBe('true'); /* P-834 */
    expect(run(2, { PAKIET: 'ipad', COMMIT_MSG: '[e2e-pelny]' }).o.any).toBe('false');
  });

  test('zły numer części kończy się błędem', () => {
    expect(() => execFileSync('node', [skrypt, 'czesc', String(cfg.czesci + 1)], { stdio: 'pipe' })).toThrow();
    expect(() => execFileSync('node', [skrypt, 'czesc', '0'], { stdio: 'pipe' })).toThrow();
  });
});
