/* Katalog przypadków użycia (docs/jakosc/przypadki-uzycia.md) — bramka spójności (P-834…P-836, sesja BX 2026-11-15; wzór: Trening
 * tests/przeplywy.test.ts, docs/38-przeplywy-i-luki-e2e.md §2). Katalog jest źródłem prawdy zestawu e2e po każdym buildzie i listy fizycznej
 * właściciela: każdy krok instrukcji testu i każdy ekran z app/ ma przypadek, każdy scenariusz Maestro jest przypisany, klasa A wskazuje
 * istniejącą linię scenariusza w bramce, klasa B — scenariusz oczekujący albo plan, klasa F — powód fizyczny i pozycję listy właściciela. */
import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';

const root = path.join(__dirname, '..', '..');
const KATALOG = path.join(root, 'docs/jakosc/przypadki-uzycia.md');
const INSTRUKCJA = path.join(root, 'docs/wydanie/instrukcja-testu-1171.html');
const LISTA_F = path.join(root, 'docs/wydanie/test-fizyczny.html');
const SCEN = path.join(root, 'e2e/scenariusze');
const NAGLOWEK = '| PU | Cel użytkownika | Kroki | Oczekiwany wynik | Instrukcja | Ekrany | Klasa | Pokrycie |';
const KATEGORIE_F = ['TestFlight', 'zegarek', 'wibracje', 'aparat', 'Pencil', 'wrażenie', 'ekran blokady', 'system iOS', 'sklep Apple', 'sieć prawdziwa', 'inne aplikacje'];

type Pu = { id: string; cel: string; kroki: string; wynik: string; instrukcja: string[]; ekrany: string[]; klasa: string; pokrycie: string; sekcja: string };

export function czytajKatalog(tekst: string): { pu: Pu[]; naglowki: number; podsumowanie: RegExpExecArray | null } {
  const pu: Pu[] = []; let sekcja = ''; let naglowki = 0;
  for (const l of tekst.split('\n')) {
    const s = /^## (.+)$/.exec(l); if (s) { sekcja = s[1].trim(); continue; }
    if (l.trim() === NAGLOWEK) { naglowki++; continue; }
    if (!/^\| PU-\d{3} \|/.test(l)) continue;
    const k = l.split('|').slice(1, -1).map((x) => x.trim());
    if (k.length !== 8) throw new Error(`${k[0]}: ${k.length} kolumn zamiast 8 (znak „|” w komórce?)`);
    const lista = (x: string) => (x === '—' ? [] : x.split(',').map((y) => y.trim()).filter(Boolean));
    pu.push({ id: k[0], cel: k[1], kroki: k[2], wynik: k[3], instrukcja: lista(k[4]), ekrany: lista(k[5]), klasa: k[6], pokrycie: k[7], sekcja });
  }
  return { pu, naglowki, podsumowanie: /^Podsumowanie: A=(\d+), B=(\d+), F=(\d+), razem (\d+)\.$/m.exec(tekst) };
}

function trasy(kat = path.join(root, 'app'), prefiks = ''): string[] {
  return fs.readdirSync(kat, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return trasy(path.join(kat, e.name), `${prefiks}${e.name}/`);
    if (!e.name.endsWith('.tsx') || e.name === '_layout.tsx' || e.name.startsWith('+')) return [];
    return [`${prefiks}${e.name.replace(/\.tsx$/, '')}`];
  }).sort();
}

const krokiInstrukcji = (): string[] => {
  const html = fs.readFileSync(INSTRUKCJA, 'utf8'); const i = html.indexOf('var DANE = ');
  const linia = html.slice(i + 'var DANE = '.length, html.indexOf('\n', i)).replace(/;\s*$/, '');
  return (JSON.parse(linia) as { kroki: { id: string }[] }).kroki.map((k) => k.id);
};
const scenariusze = fs.readdirSync(SCEN).filter((f) => /^\d\d-.*\.yaml$/.test(f)).sort();
/** Tagi z nagłówka scenariusza (pierwszy dokument YAML: blok `tags:` z pozycjami `  - tag`), bez parsera YAML — jak maTag w e2e-czesci.test.ts. */
const tagi = (f: string): string[] => {
  const naglowek = fs.readFileSync(path.join(SCEN, f), 'utf8').split(/^---\s*$/m)[0];
  const blok = /^tags:\n((?:[ \t]+- .*\n?)*)/m.exec(naglowek);
  return blok ? blok[1].split('\n').map((l) => l.replace(/^[ \t]+- /, '').replace(/\s+#.*$/, '').trim().replace(/^["']|["']$/g, '')).filter(Boolean) : [];
};
const odnosniki = (p: string) => [...p.matchAll(/((?:e2e\/scenariusze|tests)\/[A-Za-z0-9_./-]+\.(?:yaml|tsx?|mjs)):(\d+)/g)].map((m) => ({ plik: m[1], linia: Number(m[2]) }));

const { pu, naglowki, podsumowanie } = czytajKatalog(fs.readFileSync(KATALOG, 'utf8'));
const poId = new Map(pu.map((p) => [p.id, p]));

describe('katalog przypadków użycia: budowa', () => {
  test('tabele mają ustalony nagłówek; ID PU-NNN unikalne, bez dziur (zbiór PU-001…PU-N; nowe PU dopisuje się w swojej sekcji z kolejnym numerem, P-847); klasy A/B/F; podsumowanie zgodne z tabelami', () => {
    expect(naglowki).toBeGreaterThan(0);
    expect(pu.length).toBeGreaterThanOrEqual(121);
    expect(pu.map((p) => p.id).sort()).toEqual(pu.map((_, i) => `PU-${String(i + 1).padStart(3, '0')}`));
    expect(pu.filter((p) => !['A', 'B', 'F'].includes(p.klasa)).map((p) => p.id)).toEqual([]);
    const licz = (k: string) => pu.filter((p) => p.klasa === k).length;
    expect(podsumowanie?.slice(1).map(Number)).toEqual([licz('A'), licz('B'), licz('F'), pu.length]);
  });

  test('każdy PU ma cel, kroki i oczekiwany wynik (nie puste, nie „—”)', () => {
    expect(pu.filter((p) => [p.cel, p.kroki, p.wynik].some((x) => x.length < 5)).map((p) => p.id)).toEqual([]);
  });
});

describe('katalog przypadków użycia: zupełność', () => {
  test('każdy krok instrukcji testu (T-, Z-, G-) jest przypisany do PU; PU nie wskazuje nieistniejącego kroku', () => {
    const kroki = krokiInstrukcji(); const uzyte = new Set(pu.flatMap((p) => p.instrukcja));
    expect(kroki.length).toBe(121);
    expect(kroki.filter((k) => !uzyte.has(k))).toEqual([]);
    expect([...uzyte].filter((k) => !kroki.includes(k))).toEqual([]);
  });

  test('każdy ekran z app/ ma PU wejścia i powrotu w sekcji „Nawigacja”; PU nie wskazuje nieistniejącego ekranu', () => {
    const t = trasy(); const nawigacja = new Set(pu.filter((p) => p.sekcja === 'Nawigacja').flatMap((p) => p.ekrany));
    expect(t.length).toBeGreaterThanOrEqual(30);
    expect(t.filter((x) => !nawigacja.has(x))).toEqual([]);
    expect([...new Set(pu.flatMap((p) => p.ekrany))].filter((x) => !t.includes(x))).toEqual([]);
  });

  test('każdy scenariusz Maestro jest przypisany do co najmniej jednego PU (zestaw po buildzie = katalog)', () => {
    const uzyte = new Set(pu.flatMap((p) => odnosniki(p.pokrycie)).map((o) => path.basename(o.plik)));
    expect(scenariusze.filter((f) => !uzyte.has(f))).toEqual([]);
  });
});

describe('katalog przypadków użycia: pokrycie według klasy', () => {
  const istnieje = (o: { plik: string; linia: number }) => {
    const p = path.join(root, o.plik); if (!fs.existsSync(p)) return false;
    const l = fs.readFileSync(p, 'utf8').split('\n')[o.linia - 1];
    return l !== undefined && l.trim() !== '' && !l.trim().startsWith('#') && !l.trim().startsWith('//');
  };

  test('klasa A: co najmniej jedno miejsce plik:linia; linia istnieje i nie jest komentarzem; scenariusz jest w bramce (bez tagu oczekujacy); test z tests/ wymienia ID PU', () => {
    const zle: string[] = [];
    for (const p of pu.filter((x) => x.klasa === 'A')) {
      const o = odnosniki(p.pokrycie);
      if (!o.length) { zle.push(`${p.id}: brak plik:linia`); continue; }
      /* sam podprzepływ (subflows/) nie jest testem — obok musi stać scenariusz NN-*.yaml albo test z tests/ */
      if (!o.some((x) => x.plik.startsWith('tests/') || scenariusze.includes(x.plik.replace('e2e/scenariusze/', '')))) zle.push(`${p.id}: tylko podprzepływ, brak scenariusza albo testu`);
      for (const x of o) {
        if (!istnieje(x)) zle.push(`${p.id}: ${x.plik}:${x.linia} nie istnieje albo jest pustą linią/komentarzem`);
        else if (x.plik.startsWith('e2e/scenariusze/subflows/')) continue;
        else if (x.plik.startsWith('e2e/') && tagi(path.basename(x.plik)).includes('oczekujacy')) zle.push(`${p.id}: ${x.plik} ma tag oczekujacy (to klasa B)`);
        else if (x.plik.startsWith('tests/') && !fs.readFileSync(path.join(root, x.plik), 'utf8').includes(p.id)) zle.push(`${p.id}: ${x.plik} nie wymienia ${p.id}`);
      }
    }
    expect(zle).toEqual([]);
  });

  test('klasa A (recenzja BX2 R-A-26): wskazana linia scenariusza to asercja (assert*, extendedWaitUntil, scrollUntilVisible, copyTextFrom) albo runFlow podprzepływu wskazanego w tym samym wierszu; nie same scenariusze iPada (pakiet informacyjny, P-225)', () => {
    const zle: string[] = [];
    const ASERCJA = /^\s*-?\s*(assert\w*|extendedWaitUntil|copyTextFrom|scrollUntilVisible)\b|^\s*(visible|notVisible):/;
    for (const p of pu.filter((x) => x.klasa === 'A')) {
      const o = odnosniki(p.pokrycie).filter((x) => x.plik.endsWith('.yaml'));
      const maPodprzeplyw = o.some((x) => x.plik.includes('/subflows/'));
      for (const x of o) {
        const l = fs.readFileSync(path.join(root, x.plik), 'utf8').split('\n')[x.linia - 1] ?? '';
        if (!ASERCJA.test(l) && !(maPodprzeplyw && /^\s*-\s*runFlow\b/.test(l))) zle.push(`${p.id}: ${x.plik}:${x.linia} nie jest asercją („${l.trim().slice(0, 40)}”)`);
      }
      const scen = o.filter((x) => !x.plik.includes('/subflows/')).map((x) => path.basename(x.plik));
      if (scen.length && !o.some((x) => x.plik.startsWith('tests/')) && scen.every((f) => tagi(f).includes('ipad'))) zle.push(`${p.id}: tylko scenariusze z tagiem ipad (poza bramką)`);
    }
    expect(zle).toEqual([]);
  });

  test('klasa B: „do zaprogramowania: …” albo scenariusz z tagami oczekujacy, przypadki-uzycia i ID PU', () => {
    const zle: string[] = [];
    for (const p of pu.filter((x) => x.klasa === 'B')) {
      const o = odnosniki(p.pokrycie).filter((x) => /^oczekujący: /.test(p.pokrycie) && x.plik.startsWith('e2e/'));
      if (/^do zaprogramowania: (Maestro iPhone|Maestro iPad|jednostkowy|komponentowy) — .{10,}/.test(p.pokrycie)) continue;
      if (!o.length) { zle.push(`${p.id}: Pokrycie nie zaczyna się od „do zaprogramowania: <poziom> — …” ani „oczekujący: plik:linia”`); continue; }
      for (const x of o) {
        if (!istnieje(x)) { zle.push(`${p.id}: ${x.plik}:${x.linia} nie istnieje`); continue; }
        const t = tagi(path.basename(x.plik));
        for (const wymagany of ['oczekujacy', 'przypadki-uzycia', p.id]) if (!t.includes(wymagany)) zle.push(`${p.id}: ${x.plik} bez tagu ${wymagany}`);
      }
    }
    expect(zle).toEqual([]);
  });

  test('klasa F: „F: <kategoria> — <powód ≥ 30 znaków>”, kategoria z ustalonej listy', () => {
    const zle = pu.filter((p) => p.klasa === 'F').filter((p) => { const m = /^F: ([^—]+) — (.+)$/.exec(p.pokrycie); return !m || !KATEGORIE_F.includes(m[1].trim()) || m[2].trim().length < 30; }).map((p) => `${p.id}: ${p.pokrycie.slice(0, 60)}`);
    expect(zle).toEqual([]);
  });

  test('scenariusz z tagiem przypadki-uzycia niesie tag PU-NNN istniejącego przypadku, który go wskazuje; tag oczekujacy tylko razem z przypadki-uzycia i nigdy z podstawowy', () => {
    const zle: string[] = [];
    for (const f of scenariusze) {
      const t = tagi(f);
      if (t.includes('oczekujacy') && (!t.includes('przypadki-uzycia') || t.includes('podstawowy'))) zle.push(`${f}: tag oczekujacy bez przypadki-uzycia albo razem z podstawowy`);
      if (!t.includes('przypadki-uzycia')) continue;
      const ids = t.filter((x) => /^PU-\d{3}$/.test(x));
      if (!ids.length) zle.push(`${f}: brak tagu PU-NNN`);
      for (const id of ids) if (!poId.get(id)?.pokrycie.includes(f)) zle.push(`${f}: ${id} nie wskazuje tego pliku w kolumnie Pokrycie`);
    }
    expect(zle).toEqual([]);
  });
});

describe('lista fizyczna właściciela (docs/wydanie/test-fizyczny.html)', () => {
  test('zawiera dokładnie przypadki klasy F (ID w danych strony) i nic poza nimi', () => {
    const html = fs.readFileSync(LISTA_F, 'utf8');
    const naLiscie = [...new Set([...html.matchAll(/"pu":"(PU-\d{3})"/g)].map((m) => m[1]))].sort();
    expect(naLiscie).toEqual(pu.filter((p) => p.klasa === 'F').map((p) => p.id).sort());
  });

  test('strona jest wynikiem generatora z katalogu (scripts/wydanie/test-fizyczny.mjs --check): ręczna zmiana strony albo katalogu bez generatora pada', () => {
    const r = spawnSync('node', [path.join(root, 'scripts/wydanie/test-fizyczny.mjs'), '--check'], { encoding: 'utf8' });
    expect({ kod: r.status, wyjscie: (r.stdout + r.stderr).trim().split('\n').pop() }).toEqual({ kod: 0, wyjscie: expect.stringMatching(/zgodny z katalogiem/) });
  });
});

describe('skrypt bramki KO-065 (scripts/jakosc/bramka-przypadki-uzycia.mjs) na tym samym katalogu', () => {
  test('`katalog` (kontrola 2 bez wymogu testów B: te reguły + ekrany src/ekrany bez trasy) kończy się kodem 0', () => {
    const r = spawnSync('node', [path.join(root, 'scripts/jakosc/bramka-przypadki-uzycia.mjs'), 'katalog'], { encoding: 'utf8' });
    expect({ kod: r.status, wyjscie: (r.stdout + r.stderr).trim() }).toEqual({ kod: 0, wyjscie: 'Kontrola 2: zielona' });
  });
});

describe('czytajKatalog (parser)', () => {
  test('wiersz z nadmiarowym „|” jest błędem, nie cichym przesunięciem kolumn', () => {
    expect(() => czytajKatalog(`## X\n${NAGLOWEK}\n| PU-001 | a | b | c | — | — | A | x | y |`)).toThrow(/kolumn/);
  });
  test('sekcja, listy i „—” są czytane', () => {
    const r = czytajKatalog(`Podsumowanie: A=0, B=1, F=0, razem 1.\n## Nawigacja\n${NAGLOWEK}\n|---|---|---|---|---|---|---|---|\n| PU-001 | Chcę x | krok | wynik | T-10, T-11 | licznik | B | do zaprogramowania: Maestro iPhone — asercja |`);
    expect(r.pu).toEqual([{ id: 'PU-001', cel: 'Chcę x', kroki: 'krok', wynik: 'wynik', instrukcja: ['T-10', 'T-11'], ekrany: ['licznik'], klasa: 'B', pokrycie: 'do zaprogramowania: Maestro iPhone — asercja', sekcja: 'Nawigacja' }]);
    expect(r.podsumowanie?.[4]).toBe('1');
  });
});
