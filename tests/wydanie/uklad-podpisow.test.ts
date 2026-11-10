/* Układ podpisów na ramkach zrzutów sklepu (scripts/ci/uklad-podpisow.mjs; rola 10-wydanie, KO-032, 2026-11-10).
 * Wzór: trening:tests/store-caption-layout.test.ts (przegląd ramek Treningu, przebieg 40942847798: różne rozmiary czcionki w języku, pojedyncze słowo w trzecim wierszu,
 * japoński cięty w środku słowa, chiński wiersz zaczynający się od „、”). Pomiar tekstu w teście zastępczy (szerokość ∝ liczbie znaków, CJK ×2) — ImageMagick tylko w CI i lokalnie
 * w teście ramek. Dlaczego: błąd składu wychodzi dopiero na obrazie po godzinie przebiegu macOS. */
import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';

const korzen = path.join(__dirname, '..', '..');
const modul = path.join(korzen, 'scripts/ci/uklad-podpisow.mjs');
const run = (kod: string) => {
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', `import * as L from ${JSON.stringify(modul)}; ${kod}`], { encoding: 'utf8', cwd: korzen });
  if (r.status !== 0) throw new Error(r.stderr);
  return JSON.parse(r.stdout);
};
/* 100 pt: znak łaciński 55 px, CJK/hangul 100 px; wiersz 120 px. */
const FAKE = `const measure = t => { const ls = t.split('\\n'); const w = l => [...l].reduce((s, c) => s + (/[\\u3000-\\u9fff\\uac00-\\ud7af\\uff00-\\uffef]/.test(c) ? 100 : 55), 0); return { w: Math.max(...ls.map(w)), h: 120 * ls.length }; };`;
const plik = JSON.parse(fs.readFileSync(path.join(korzen, 'docs/wydanie/metadane/podpisy-zrzutow.json'), 'utf8'));
const podpisy = plik.podpisy as Record<string, Record<string, string>>;
/** Błędy pliku podpisów: język ma albo komplet podpisów (wszystkie ekrany, każdy ≤ maxZnakow), albo żaden (czeka na przekład 09). */
function bledyPodpisow(p: Record<string, Record<string, string>>, ekrany: string[], max: number) {
  const w: { l: string; blad: string }[] = [];
  for (const [l, t] of Object.entries(p)) {
    const n = Object.keys(t).length;
    if (n === 0) continue;
    if (n !== ekrany.length || ekrany.some((k) => !(k in t))) { w.push({ l, blad: `niepełny komplet (${n} z ${ekrany.length})` }); continue; }
    for (const k of ekrany) if ([...t[k]].length > max) w.push({ l, blad: `${k} dłuższy niż ${max} znaków` });
  }
  return w;
}
const NO_LINE_START = /^[、。，．,.!?！？:：;；)）\]」』…・ーァィゥェォッャュョヮ]/u;
// Pole podpisu na iPhonie 6.9″: 86% × 15% zrzutu (ramki-sklepu.sh) = 1135 × 430 px.
const POLE = '1135, 430';

describe('podpisy ramek: łamanie wierszy i rozmiar czcionki', () => {
  test('japoński: słowa całe, cząstki i interpunkcja przy poprzednim słowie; chiński: „、” nie zaczyna słowa; niemiecki: słowa bez zmian', () => {
    const ja = run(`console.log(JSON.stringify(L.tokens('ja', '全履歴をアカウントも広告もなしで').map(t => t.w)))`);
    expect(ja).toContain('アカウントも');
    for (const w of ja) expect(w).not.toMatch(/^[をもで]/u);
    for (const w of run(`console.log(JSON.stringify(L.tokens('zh-Hant', '完整紀錄，免帳號、無廣告').map(t => t.w)))`)) expect(w).not.toMatch(NO_LINE_START);
    expect(run(`console.log(JSON.stringify(L.tokens('de', 'Deine Vorlagen in Ordnern').map(t => t.w)))`)).toEqual(['Deine', 'Vorlagen', 'in', 'Ordnern']);
  });

  test('każdy język z podpisami: jeden rozmiar dla wszystkich podpisów, najwyżej 2 wiersze, tekst bez zmian, żaden wiersz nie zaczyna się od interpunkcji ani nie kończy jednoliterowym słowem', () => {
    const jezyki = Object.keys(podpisy).filter((l) => Object.keys(podpisy[l]).length > 0);
    expect(jezyki).toEqual(expect.arrayContaining(['en', 'pl']));
    for (const lang of jezyki) {
      const p = run(`${FAKE} console.log(JSON.stringify(L.plan(${JSON.stringify(lang)}, ${JSON.stringify(podpisy[lang])}, ${POLE}, measure)))`);
      expect({ lang, ok: Number.isInteger(p.pointsize) && p.pointsize > 0 }).toEqual({ lang, ok: true });
      for (const [k, t] of Object.entries(p.podpisy as Record<string, string>)) {
        const wiersze = t.split('\n');
        expect({ lang, k, wiersze: wiersze.length <= 2 }).toEqual({ lang, k, wiersze: true });
        for (const w of wiersze) expect({ lang, k, w, start: NO_LINE_START.test(w) }).toEqual({ lang, k, w, start: false });
        if (wiersze.length === 2) expect({ lang, k, w: wiersze[0], jednaLitera: / \p{L}$/u.test(wiersze[0]) }).toEqual({ lang, k, w: wiersze[0], jednaLitera: false });
        expect(t.replace(/\s+/g, '')).toBe(podpisy[lang][k].replace(/\s+/g, ''));
        for (const w of wiersze) expect({ lang, k, w, wTekscie: podpisy[lang][k].includes(w) }).toEqual({ lang, k, w, wTekscie: true });
      }
    }
  });

  test('długi podpis: dwa wiersze, najrówniejszy podział, rozmiar czcionki nie większy niż dla krótkiego w tym samym języku', () => {
    const p = run(`${FAKE} console.log(JSON.stringify(L.plan('en', { a: 'Every change with its time, one-tap undo', b: 'One tap adds a row' }, ${POLE}, measure)))`);
    expect(p.podpisy.a.split('\n')).toHaveLength(2);
    const [w1, w2] = p.podpisy.a.split('\n'); // podział między słowami, oba wiersze po co najmniej 2 słowa, różnica szerokości najmniejsza z możliwych
    expect(w1.split(' ').length).toBeGreaterThanOrEqual(2);
    expect(w2.split(' ').length).toBeGreaterThanOrEqual(2);
    expect(Math.abs(w1.length - w2.length)).toBeLessThanOrEqual(6);
    const sam = run(`${FAKE} console.log(JSON.stringify(L.plan('en', { b: 'One tap adds a row' }, ${POLE}, measure)))`);
    expect(p.pointsize).toBeLessThanOrEqual(sam.pointsize);
    expect(p.podpisy.b).toBe('One tap adds a row'); // krótki mieści się w jednym wierszu
  });

  test('złamanie wiersza: nie zostaje pojedyncze słowo w drugim wierszu; spójnik „i” (pl) nie kończy pierwszego wiersza', () => {
    const p = run(`${FAKE} console.log(JSON.stringify(L.plan('pl', { a: 'Każda zmiana z godziną i cofnięcie przy każdym rzędzie', b: 'Wzór obok licznika' }, ${POLE}, measure)))`);
    const w = p.podpisy.a.split('\n');
    expect(w.length).toBe(2);
    expect(w[1].split(' ').length).toBeGreaterThanOrEqual(2);
    expect(w[0]).not.toMatch(/ i$/);
  });

  test('bardzo długi podpis nie wychodzi poza pole: rozmiar maleje, aż mieści się w 2 wierszach', () => {
    const dlugi = 'Wszystkie twoje projekty, wzory i notatki w jednym miejscu, zawsze pod ręką';
    const p = run(`${FAKE} console.log(JSON.stringify(L.plan('pl', { a: ${JSON.stringify(dlugi)} }, ${POLE}, measure)))`);
    expect(p.pointsize).toBeGreaterThan(0);
    expect(p.podpisy.a.split('\n').length).toBeLessThanOrEqual(2);
    const t = p.podpisy.a.split('\n'); const szer = Math.max(...t.map((x: string) => x.length * 55 * p.pointsize / 100));
    expect(szer).toBeLessThanOrEqual(1135);
    expect(t.length * 120 * p.pointsize / 100).toBeLessThanOrEqual(430);
  });
});

describe('plik podpisów (docs/wydanie/metadane/podpisy-zrzutow.json)', () => {
  const scena = fs.readdirSync(path.join(korzen, 'e2e/zrzuty-sklepu')).filter((f) => /^0[1-7]-.+\.yaml$/.test(f)).map((f) => f.replace(/\.yaml$/, ''));
  const jezykiAplikacji = ((): string[] => {
    const t = fs.readFileSync(path.join(korzen, 'src/i18n/jezyki.ts'), 'utf8');
    return [...t.slice(t.indexOf('['), t.indexOf(']') + 1).matchAll(/'([A-Za-z0-9-]+)'/g)].map((m) => m[1]);
  })();

  test('ma wszystkie 35 języków aplikacji (struktura gotowa) i ekrany = sceny 01–07', () => {
    expect(Object.keys(podpisy).sort()).toEqual([...jezykiAplikacji].sort());
    expect(plik.ekrany).toEqual(scena);
    expect(Object.keys(plik.status).sort()).toEqual([...jezykiAplikacji].sort());
  });

  test('en i pl: komplet 7 podpisów, najwyżej maxZnakow, oznaczone [DO AKCEPTACJI]; pozostałe języki: komplet albo nic (przekład 09)', () => {
    for (const l of ['en', 'pl']) {
      expect(Object.keys(podpisy[l])).toEqual(plik.ekrany);
      for (const t of Object.values(podpisy[l])) expect([...t].length).toBeLessThanOrEqual(plik.maxZnakow);
      expect(plik.status[l]).toContain('[DO AKCEPTACJI]');
    }
    // 10-wydanie-008: wcześniej „reszta pusta” (== 0 podpisów), więc przekład 09 dla JEDNEGO języka zaczerwieniłby ten test; teraz język ma albo komplet, albo nic.
    expect(bledyPodpisow(podpisy, plik.ekrany, plik.maxZnakow)).toEqual([]);
  });

  test('10-wydanie-008: walidator podpisów przyjmuje język z kompletem 7 podpisów (przekład 09) i odrzuca niepełny albo za długi', () => {
    const komplet = Object.fromEntries(plik.ekrany.map((k: string) => [k, 'Krótki podpis']));
    expect(bledyPodpisow({ ...podpisy, de: komplet }, plik.ekrany, plik.maxZnakow)).toEqual([]);
    expect(bledyPodpisow({ ...podpisy, de: { '01-dzis': 'x' } }, plik.ekrany, plik.maxZnakow)).toEqual([{ l: 'de', blad: 'niepełny komplet (1 z 7)' }]);
    expect(bledyPodpisow({ ...podpisy, de: { ...komplet, '01-dzis': 'x'.repeat(plik.maxZnakow + 1) } }, plik.ekrany, plik.maxZnakow)).toEqual([{ l: 'de', blad: `01-dzis dłuższy niż ${plik.maxZnakow} znaków` }]);
  });

  test('10-wydanie-008: dokumenty podają 27 języków do przekładu podpisów (29 ze sklepową lokalizacją bez en i pl), nie 33 (35 języków aplikacji bez en i pl)', () => {
    const czytaj = (p: string) => fs.readFileSync(path.join(korzen, p), 'utf8');
    for (const p of ['docs/wydanie/lista-1-0.md', 'docs/wydanie/zrzuty-ramki.md', 'docs/wydanie/metadane/podpisy-zrzutow.json']) {
      expect({ p, stare: /\b33 (języki|języków|poza en)/.test(czytaj(p)) }).toEqual({ p, stare: false });
    }
    expect(czytaj('docs/wydanie/lista-1-0.md')).toMatch(/C6 · Przekład podpisów na (pozostałe )?27 języków/);
    expect(czytaj('docs/wydanie/zrzuty-ramki.md')).toMatch(/przekład 27 języków/);
  });

  test('podpisy bez cen, bez „free”, bez Apple Pencil w podpisie (2.3.7; nazwy konkurencji w repo pilnuje scripts/jakosc/marki.mjs)', () => {
    for (const [l, p] of Object.entries(podpisy)) for (const [k, t] of Object.entries(p)) {
      expect({ l, k, zle: /\$|€|zł|USD|\bfree\b|\bdarmow|Pencil|Trening/i.test(t) }).toEqual({ l, k, zle: false });
    }
  });

  test('kolory i krój tylko z systemu 04: tokeny istnieją w docs/design/tokeny.json, plik kroju w repo', () => {
    const tok = JSON.parse(fs.readFileSync(path.join(korzen, 'docs/design/tokeny.json'), 'utf8')).kolory;
    for (const k of ['tlo', 'tekst', 'obwodka']) expect(tok[plik.ramka.tryb][plik.ramka[k]]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(fs.existsSync(path.join(korzen, plik.kroj.plik))).toBe(true);
  });
});
