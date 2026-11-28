// Kontrola wektorów 1.0.2 na prototypie + mutanty (rola 05 fix AR1, 2026-11-28). Użycie: node docs/architektura/eksperymenty/1-0-2/sprawdz.mjs
// Kod wyjścia 0 = wszystkie wektory zgodne z prototypem i każdy mutant zabity przez co najmniej jeden wektor.
// Scenariusze SC liczą wartość istniejącym prototypem scal (eksperymenty/e1/scal.mjs, wyrocznia M-01–M-20), a PS porównuje z kodem
// aplikacji (src/domena/przypomnienia.ts, transpilacja TypeScript w locie) — dwie niezależne wyrocznie poza tym plikiem.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import * as P from './prototyp.mjs';
import { scal } from '../e1/scal.mjs';

const tu = dirname(fileURLToPath(import.meta.url));
const repo = join(tu, '../../../..');
const W = JSON.parse(readFileSync(join(repo, 'docs/architektura/wektory-1-0-2.json'), 'utf8'));
const kan = (x) => Array.isArray(x) ? x.map(kan) : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, kan(x[k])])) : x;
const rowne = (a, b) => JSON.stringify(kan(a)) === JSON.stringify(kan(b)); // kolejność kluczy obiektu bez znaczenia

// Przodkowie głowy po wszystkich rodzicach, bez przodków rodzica linii (BFS, jak 08 w scalLinie).
function poRodzicu(zdarzenia, glowa, rodzic) {
  const mapa = new Map(zdarzenia.map((z) => [z.id, z]));
  const przodkowie = (id) => { const s = new Set(); const q = id ? [id] : []; while (q.length) { const x = q.pop(); if (s.has(x) || !mapa.has(x)) continue; s.add(x); q.push(...mapa.get(x).rodzice); } return s; };
  const odGlowy = przodkowie(glowa);
  if (rodzic !== null && !odGlowy.has(rodzic)) return null;
  const odRodzica = rodzic === null ? new Set() : przodkowie(rodzic);
  return [...odGlowy].filter((id) => !odRodzica.has(id)).map((id) => ({ rodzaj: mapa.get(id).rodzaj, czasMs: mapa.get(id).czasMs }));
}
function scenariusz(sc, f) {
  const baza = sc.baza.map((z) => ({ ...z, licznik: 'L' }));
  const decyzje = {}, rodzice = {};
  for (const l of sc.linie) {
    const s = scal(baza);
    const glowy = s.stan === 'zgodny' ? s.glowy : s.stan === 'konflikt' ? s.glowy : [];
    const rodzic = l.rodzice[0] ?? null;
    const d = f.przesuniecieRodzica({ linia: { rodzaj: l.rodzaj, czasMs: l.czasMs, zrodlo: l.zrodlo, rodzic }, glowy, poRodzicu: glowy.length === 1 ? poRodzicu(baza, glowy[0], rodzic) : [], obcieto: false });
    decyzje[l.id] = d.decyzja;
    const r = d.rodzic === null ? [] : [d.rodzic];
    if (!rowne(r, l.rodzice)) rodzice[l.id] = r;
    baza.push({ ...l, licznik: 'L', rodzice: r });
  }
  const k = scal(baza);
  const wynik = { decyzje, rodzice, stan: k.stan };
  if (k.stan === 'zgodny') wynik.wartosc = k.wartosc;
  if (k.stan === 'konflikt') wynik.kandydaci = Object.fromEntries(k.kandydaci.map((c) => [c.glowa, c.wartosc]));
  return wynik;
}
const podzbior = (ocz, jest) => Object.entries(ocz).every(([k, v]) => rowne(v, jest[k]));

function bledy(f) {
  const b = [];
  for (const v of W.przesuniecie) { const r = f.przesuniecieRodzica(v.wejscie); if (!rowne(r, v.oczekiwane)) b.push(`${v.id}: ${JSON.stringify(r)}`); }
  for (const v of W.scenariusze) { const r = scenariusz(v, f); if (!podzbior(v.oczekiwane, r)) b.push(`${v.id}: ${JSON.stringify(r)}`); }
  for (const v of W.stukniecia) { const r = f.stukniecia(v.zdarzenia).map((s) => s.ids); if (!rowne(r, v.oczekiwane.ids)) b.push(`${v.id}: ${JSON.stringify(r)}`); }
  for (const v of W.serie) {
    let n = 0; const st = v.stukniecia.map((s) => ({ ids: Array.from({ length: s.krok }, () => `e${n++}`), krok: s.krok, czasMs: s.czasMs, zrodlo: 'aplikacja', rodzaj: 'plus' }));
    const r = f.serieStukniec(st, v.konf).map((s) => ({ stukniecia: s.stukniecia, rzedy: s.rzedy, ids: s.ids.length }));
    if (!rowne(r, v.oczekiwane)) b.push(`${v.id}: ${JSON.stringify(r)}`);
  }
  for (const v of W.cofniecie) { const r = f.celCofnieciaStukniecia(v.odNajnowszego, v.stukniecia.map((ids) => ({ ids }))); if (!rowne(r, v.oczekiwane)) b.push(`${v.id}: ${JSON.stringify(r)}`); }
  for (const v of W.skok) { const r = f.sygnalySkoku(v.przed, v.po, { cel: v.cel, dlugosc: v.dlugosc }); if (!rowne(r, v.oczekiwane)) b.push(`${v.id}: ${JSON.stringify(r)}`); }
  for (const v of W.przypomnienie_skoku) { const r = f.przypomnienieSkoku(v.przed, v.po, v.plan); if (r !== v.oczekiwane.rzad) b.push(`${v.id}: ${r}`); }
  for (const v of W.intencja) {
    const r = f.stuknijKrok(v.rodzaj, v.krok, v.stan, v.opcje);
    const ok = r.wynik === v.oczekiwane.wynik && rowne(r.linie.map((l) => l.rodzice), v.oczekiwane.rodziceLinii) && podzbior(v.oczekiwane.stan, r.stan)
      && r.linie.every((l) => l.czasMs === v.opcje.teraz);
    if (!ok) b.push(`${v.id}: ${JSON.stringify({ wynik: r.wynik, rodzice: r.linie.map((l) => l.rodzice), stan: r.stan })}`);
  }
  return b;
}

const MUTANTY = {
  'nieprzemienne zawsze przesuwane': { przesuniecieRodzica: (w) => { const r = P.przesuniecieRodzica({ ...w, poRodzicu: w.poRodzicu && w.poRodzicu.map((e) => ({ ...e, rodzaj: 'plus' })) }); return r; } },
  'czas: < zamiast <=': { przesuniecieRodzica: (w) => P.przesuniecieRodzica({ ...w, poRodzicu: w.poRodzicu && w.poRodzicu.map((e) => ({ ...e, czasMs: e.czasMs === w.linia.czasMs ? e.czasMs + 1 : e.czasMs })) }) },
  'konflikt: pierwsza głowa': { przesuniecieRodzica: (w) => P.przesuniecieRodzica({ ...w, glowy: w.glowy.slice(0, 1), poRodzicu: w.poRodzicu ?? [] }) },
  'zegarek nieprzesuwany': { przesuniecieRodzica: (w) => w.linia.zrodlo === 'zegarek' ? { decyzja: 'bez_zmian', rodzic: w.linia.rodzic } : P.przesuniecieRodzica(w) },
  'stuknięcie bez limitu kroku': { stukniecia: (z) => { const r = P.stukniecia(z); for (let i = r.length - 1; i > 0; i -= 1) if (r[i].czasMs === r[i - 1].czasMs && r[i].zrodlo === r[i - 1].zrodlo && r[i].rodzaj === 'plus' && r[i - 1].rodzaj === 'plus' && z.find((x) => x.id === r[i].ids[0]).urzadzenie === z.find((x) => x.id === r[i - 1].ids[0]).urzadzenie) { r[i - 1].ids.push(...r[i].ids); r.splice(i, 1); } return r; } },
  'stuknięcie bez źródła': { stukniecia: (z) => P.stukniecia(z.map((x) => ({ ...x, zrodlo: 'aplikacja' }))) },
  'seria na zdarzeniach': { serieStukniec: (st, k) => P.serieStukniec(st.flatMap((s) => s.ids.map((id) => ({ ...s, ids: [id], krok: 1 }))), k) },
  'cofnięcie pojedynczego zdarzenia': { celCofnieciaStukniecia: (h) => P.celCofnieciaStukniecia(h, []) },
  'cel części: równość': { sygnalySkoku: (a, b, k) => ({ ...P.sygnalySkoku(a, b, k), celCzesci: k.cel !== null && b === k.cel }) },
  'powtórzenie: modulo po': { sygnalySkoku: (a, b, k) => ({ ...P.sygnalySkoku(a, b, k), koniecPowtorzenia: k.dlugosc !== null && b > 0 && b % k.dlugosc === 0 }) },
  'przypomnienie: tylko pas po': { przypomnienieSkoku: (a, b, p) => { const w = b + 1; return b > a && w >= p.od && (w - p.od) % p.co === 0 && (w - p.od) / p.co < p.razy ? w : null; } },
  '−1 przestawia dzień (stan sprzed U4)': { stuknijKrok: (r, k, s, o) => { const x = P.stuknijKrok(r, k, s, o); return r === 'minus' && x.wynik === 'zapisz' ? { ...x, stan: { ...x.stan, dzien: o.dzis, dzienDozwolony: true } } : x; } },
  'krok: limit sprawdzany per zdarzenie (drugie odrzucone)': { stuknijKrok: (r, k, s, o) => { const x = P.stuknijKrok(r, k, s, o); return x.linie.length > 1 ? { ...x, linie: x.linie.slice(0, 1), stan: { ...x.stan, wartosc: s.wartosc + 1, glowa: x.linie[0].id } } : x; } },
  'krok: wspólny rodzic linii': { stuknijKrok: (r, k, s, o) => { const x = P.stuknijKrok(r, k, s, o); return { ...x, linie: x.linie.map((l) => ({ ...l, rodzice: s.glowa ? [s.glowa] : [] })) }; } },
};

// Druga wyrocznia dla PS: przypomnienieWpisania z kodu aplikacji (te same reguły RD-13 W20–W25).
const require = createRequire(join(repo, 'package.json'));
const ts = require('typescript');
const kat = mkdtempSync(join(tmpdir(), 'ar1-'));
const js = ts.transpileModule(readFileSync(join(repo, 'src/domena/przypomnienia.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
writeFileSync(join(kat, 'p.mjs'), js);
const app = await import(pathToFileURL(join(kat, 'p.mjs')).href);
const zKodem = W.przypomnienie_skoku.filter((v) => { const r = app.przypomnienieWpisania(v.przed + 1, v.po + 1, v.plan); return !(r.ok && r.wartosc === v.oczekiwane.rzad); }).map((v) => v.id);

const linie = [];
const b0 = bledy(P);
const liczba = Object.entries(W).filter(([, v]) => Array.isArray(v)).reduce((s, [, v]) => s + v.length, 0);
linie.push(`wektory: ${liczba}; niezgodne z prototypem: ${b0.length}${b0.length ? ' → ' + b0.join(' | ') : ''}`);
linie.push(`PS wobec src/domena/przypomnienia.ts (przypomnienieWpisania(przed+1, po+1)): ${zKodem.length ? 'NIEZGODNE ' + zKodem.join(', ') : 'zgodne ' + W.przypomnienie_skoku.length + '/' + W.przypomnienie_skoku.length}`);
let zywe = 0;
for (const [nazwa, nadpisanie] of Object.entries(MUTANTY)) {
  const b = bledy({ ...P, ...nadpisanie });
  if (!b.length) zywe += 1;
  linie.push(`mutant „${nazwa}”: ${b.length ? 'zabity przez ' + b.map((x) => x.split(':')[0]).join(', ') : 'ŻYWY'}`);
}
linie.push(`wynik: ${b0.length === 0 && zywe === 0 && zKodem.length === 0 ? 'OK' : 'BŁĄD'} (mutanty: ${Object.keys(MUTANTY).length}, żywe: ${zywe})`);
console.log(linie.join('\n'));
process.exit(b0.length === 0 && zywe === 0 && zKodem.length === 0 ? 0 : 1);
