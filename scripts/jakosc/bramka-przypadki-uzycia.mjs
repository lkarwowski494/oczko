#!/usr/bin/env node
// Bramka przypadków użycia przed TestFlight i App Review (KO-065; P-837 wariant (a), P-838 wyjątek 1171; sesja BX2 roli 07, 2026-11-15).
// Słowa właściciela (15.11 ok. 18:05 i 18:12 UTC): osobna bramka, której nie da się pominąć; testy nieautomatyzowalne wykonane po buildzie
// w TestFlight albo pominięte z obowiązkowym uzasadnieniem. Testy: tests/jakosc/bramka-przypadki-uzycia.test.ts.
//   node scripts/jakosc/bramka-przypadki-uzycia.mjs bramka          → zadanie `bramka-przypadki` w testflight.yml (env: GH_TOKEN, GITHUB_REPOSITORY,
//                                                                     PRZEBIEG = run „Jakość · iOS” z zadania `bramka`, POMIN = inputs.pomin_bramke_e2e)
//       kontrola 1: w przebiegu PRZEBIEG każda część `e2e (część N, iphone)` (N = 1…czesci z e2e/czesci.json) ma success — skipped to nie zielony;
//                   POMIN=true (awaria maszyny, ścieżka z powodem w zadaniu `bramka`) pomija TYLKO tę kontrolę, z ostrzeżeniem;
//       kontrola 2: katalog docs/jakosc/przypadki-uzycia.md spójny z kodem (jak tests/jakosc/przypadki-uzycia.test.ts) + ekrany bez trasy
//                   + każdy PU klasy B ma istniejący test („do zaprogramowania” = czerwone, P-837 (a));
//       kontrola 3: protokół testu fizycznego poprzedniego wysłanego buildu (najwyższy tag v*-b<N>) w docs/jakosc/test-fizyczny/<N>.md —
//                   każdy PU klasy F katalogu z tagu (albo bieżącego, gdy w tagu go nie ma) ma „zrobione: …” albo „pominięte: <uzasadnienie>”;
//                   jedyny wyjątek: docs/jakosc/test-fizyczny/wyjatki.json (najwyżej wpis 1171, P-838).
//   node scripts/jakosc/bramka-przypadki-uzycia.mjs recenzja <build> → przed „Submit for Review” (docs/wydanie/lista-1-0.md F1/F3): protokół F
//                                                                     dokładnie tego buildu, bez wyjątków.
//   node scripts/jakosc/bramka-przypadki-uzycia.mjs katalog         → tylko kontrola 2 (bez wymogu testów B), np. lokalnie.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const KATALOG = 'docs/jakosc/przypadki-uzycia.md';
const PROTOKOLY = 'docs/jakosc/test-fizyczny';
const NAGLOWEK = '| PU | Cel użytkownika | Kroki | Oczekiwany wynik | Instrukcja | Ekrany | Klasa | Pokrycie |';
const SEKCJA_EKRANOW = 'Ekrany bez własnej trasy';
const ASERCJA = /^\s*-?\s*(assert\w*|extendedWaitUntil|copyTextFrom|scrollUntilVisible)\b|^\s*(visible|notVisible):/;
const KATEGORIE_F = ['TestFlight', 'zegarek', 'wibracje', 'aparat', 'Pencil', 'wrażenie', 'ekran blokady', 'system iOS', 'sklep Apple', 'sieć prawdziwa', 'inne aplikacje'];

// ---------- kontrola 1 ----------
/** Każda część iPhone'a 1…czesci ma success (skipped i brak zadania to błędy). Zadania iPada i eksperymentów są informacyjne (P-225). */
export function ocenZestawu(zadania, czesci, sha) {
  const bledy = [];
  // BX3 P1-3: brak albo zła liczba części nie wyłącza kontroli po cichu (literówka w kluczu `czesci`, 0, NaN).
  if (!Number.isInteger(czesci) || czesci < 1) return [`e2e/czesci.json: „czesci” musi być liczbą całkowitą ≥ 1 (jest ${JSON.stringify(czesci)})`];
  for (let n = 1; n <= czesci; n++) {
    const nazwa = `e2e (część ${n}, iphone)`;
    const z = zadania.filter((j) => j.name === nazwa);
    if (!z.length) bledy.push(`${nazwa}: brak zadania`);
    // BX4 (K1-1): zadanie z przebiegu innego commita nie dowodzi niczego o budowanym SHA (gdy API podaje head_sha, a SHA budowanego jest znany)
    else if (sha && z.some((j) => typeof j.head_sha === 'string' && j.head_sha !== sha)) bledy.push(`${nazwa}: zadanie z innego SHA (${z.map((j) => String(j.head_sha).slice(0, 8)).join(', ')}) niż budowany ${sha.slice(0, 8)}`);
    else if (!z.some((j) => j.conclusion === 'success')) bledy.push(`${nazwa}: ${z.map((j) => j.conclusion ?? j.status).join(', ')}`);
    // KO-071 (BX3 P1-4): część bez scenariuszy też kończy success (plan any=false) — wymagany krok „Scenariusze” = success w zadaniu, które przeszło.
    else if (!z.some((j) => j.conclusion === 'success' && Array.isArray(j.steps) && j.steps.some((k) => k.name === 'Scenariusze' && k.conclusion === 'success'))) bledy.push(`${nazwa}: krok „Scenariusze” nie jest success — scenariusze nie biegły (KO-071)`);
  }
  return bledy;
}
/** BX4 (K1-2, BX3 P2-14): API zwraca zadania stronami; mniej zebranych niż `total_count` to błąd, nie cicho niepełna lista. */
export function kompletnoscZadan(total, zebrane) {
  return Number.isInteger(total) && zebrane >= total ? [] : [`API zadań: total_count=${total}, zebrano ${zebrane} — lista niepełna`];
}

// ---------- kontrola 2 ----------
export function czytajKatalog(tekst) {
  const pu = []; const ekranyBez = []; let sekcja = ''; let naglowki = 0;
  for (const l of tekst.split('\n')) {
    const s = /^## (.+)$/.exec(l); if (s) { sekcja = s[1].trim(); continue; }
    if (l.trim() === NAGLOWEK) { naglowki++; continue; }
    if (sekcja === SEKCJA_EKRANOW) {
      const m = /^\| ([A-Z][A-Za-z]+) \| (.+) \|$/.exec(l.trim());
      if (m && m[1] !== 'Komponent') ekranyBez.push({ komponent: m[1], pu: [...m[2].matchAll(/PU-\d{3,}/g)].map((x) => x[0]) });
      continue;
    }
    if (!/^\| PU-\d{3,} \|/.test(l)) continue;
    const k = l.split('|').slice(1, -1).map((x) => x.trim());
    if (k.length !== 8) throw new Error(`${k[0]}: ${k.length} kolumn zamiast 8 (znak „|” w komórce?)`);
    const lista = (x) => (x === '—' ? [] : x.split(',').map((y) => y.trim()).filter(Boolean));
    pu.push({ id: k[0], cel: k[1], kroki: k[2], wynik: k[3], instrukcja: lista(k[4]), ekrany: lista(k[5]), klasa: k[6], pokrycie: k[7], sekcja });
  }
  return { pu, ekranyBez, naglowki, podsumowanie: /^Podsumowanie: A=(\d+), B=(\d+), F=(\d+), razem (\d+)\.$/m.exec(tekst) };
}
export const wymaganeF = (tekst) => czytajKatalog(tekst).pu.filter((p) => p.klasa === 'F').map((p) => p.id);

function trasy(root, kat = path.join(root, 'app'), prefiks = '') {
  return fs.readdirSync(kat, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return trasy(root, path.join(kat, e.name), `${prefiks}${e.name}/`);
    if (!e.name.endsWith('.tsx') || e.name === '_layout.tsx' || e.name.startsWith('+')) return [];
    return [`${prefiks}${e.name.replace(/\.tsx$/, '')}`];
  }).sort();
}
/**
 * Tagi z nagłówka scenariusza Maestro (przed pierwszym `---`). BX-012 (KO-078): odporny na CRLF, linie komentarza i puste w bloku `tags:`,
 * zapis w linii `tags: [a, "b"]` i listę bez wcięcia; komentarz po tagu (` # …`) jest odcinany, tag w linii komentarza się nie liczy.
 * Tylko zaostrzenie względem wersji sprzed BX-012: wszystko, co ta wersja zwracała, zwraca też ta (test na scenariuszach z repo).
 */
export function tagiScenariusza(tekst) {
  const linie = tekst.replace(/\r\n?/g, '\n').split(/^---[ \t]*$/m)[0].split('\n');
  const czysty = (x) => x.replace(/\s+#.*$/, '').trim().replace(/^["']|["']$/g, '');
  const start = linie.findIndex((l) => /^tags:/.test(l));
  if (start < 0) return [];
  const wLinii = /^tags:[ \t]*\[(.*)\][ \t]*(?:#.*)?$/.exec(linie[start]);
  if (wLinii) return wLinii[1].split(',').map(czysty).filter(Boolean);
  const wynik = [];
  for (const l of linie.slice(start + 1)) {
    if (!l.trim() || /^[ \t]*#/.test(l)) continue; // pusta linia i komentarz nie kończą bloku
    const pozycja = /^[ \t]*-[ \t]+(.*)$/.exec(l);
    if (!pozycja) break; // następny klucz kończy blok
    wynik.push(czysty(pozycja[1]));
  }
  return wynik.filter(Boolean);
}
const odnosniki = (p) => [...p.matchAll(/((?:e2e\/scenariusze|tests)\/[A-Za-z0-9_./-]+\.(?:yaml|tsx?|mjs)):(\d+)/g)].map((m) => ({ plik: m[1], linia: Number(m[2]) }));

/** Pliki osiągalne importami względnymi (statyczne, dynamiczne, require) od podanych plików startowych. */
function osiagalne(start) {
  const widziane = new Set();
  const stos = [...start];
  while (stos.length) {
    const plik = stos.pop();
    if (widziane.has(plik)) continue;
    widziane.add(plik);
    const kod = fs.readFileSync(plik, 'utf8');
    for (const m of kod.matchAll(/(?:from\s+|import\s*\(\s*|require\s*\(\s*|import\s+)['"](\.[^'"]+)['"]/g)) {
      const baza = path.resolve(path.dirname(plik), m[1]);
      const cel = [baza, `${baza}.tsx`, `${baza}.ts`, path.join(baza, 'index.tsx'), path.join(baza, 'index.ts')].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
      if (cel && /\.tsx?$/.test(cel)) stos.push(cel);
    }
  }
  return widziane;
}
/** Komponenty src/ekrany/*.tsx nieosiągalne z tras app/ (poza _layout i plikami „+”) i nieopisane w tabeli „Ekrany bez własnej trasy”. */
export function ekranyBezTrasy(root) {
  const app = path.join(root, 'app');
  const wejscia = trasy(root).map((t) => path.join(app, `${t}.tsx`));
  const zasieg = osiagalne(wejscia);
  const { pu, ekranyBez } = czytajKatalog(fs.readFileSync(path.join(root, KATALOG), 'utf8'));
  const ids = new Set(pu.map((p) => p.id));
  const opisane = new Map(ekranyBez.map((e) => [e.komponent, e.pu]));
  const ekrany = fs.readdirSync(path.join(root, 'src/ekrany')).filter((f) => f.endsWith('.tsx')).map((f) => f.replace(/\.tsx$/, ''));
  const bledy = [];
  for (const e of ekrany) {
    const wZasiegu = zasieg.has(path.join(root, 'src/ekrany', `${e}.tsx`));
    if (opisane.has(e)) {
      if (wZasiegu) bledy.push(`${e}: w tabeli „${SEKCJA_EKRANOW}”, ale jest osiągalny z trasy — usuń wiersz`);
      const p = opisane.get(e);
      if (!p.length) bledy.push(`${e}: wiersz bez PU`);
      for (const id of p) if (!ids.has(id)) bledy.push(`${e}: ${id} nie istnieje`);
    } else if (!wZasiegu) bledy.push(`${e}: nieosiągalny z żadnej trasy app/ (poza _layout) i brak go w tabeli „${SEKCJA_EKRANOW}”`);
  }
  for (const k of opisane.keys()) if (!ekrany.includes(k)) bledy.push(`${k}: w tabeli „${SEKCJA_EKRANOW}”, ale nie ma src/ekrany/${k}.tsx`);
  return bledy;
}

/** BX4 (recenzja runda 2, K2-1): odnośnik „plik:linia” do testu musi wskazywać plik, który uruchamia `npm test`, bez skip/todo, z PU-NNN (cały wyraz)
 *  w pobliżu wskazanej linii (tytuł testu albo komentarz nad nim). Zwraca opis błędu albo null. */
const SKIP = /\b(?:describe|it|test)\.(?:skip|todo)\b|\b(?:xit|xtest|xdescribe)\(/;
const ODLEGLOSC_PU = 40;
export function bladTestuPU(root, x, id) {
  if (!/\.(?:test|spec)\.[jt]sx?$/.test(x.plik) || x.plik.startsWith('tests/akceptacja/')) return `${x.plik} nie jest plikiem uruchamianym przez npm test (*.test.ts[x]/*.spec.ts[x] poza tests/akceptacja/)`;
  const linie = fs.readFileSync(path.join(root, x.plik), 'utf8').split('\n');
  if (SKIP.test(linie.join('\n'))) return `${x.plik} zawiera skip/todo`;
  const wyraz = new RegExp(`\\b${id}(?!\\d)`);
  const gdzie = linie.flatMap((l, i) => (wyraz.test(l) ? [i + 1] : []));
  if (!gdzie.length) return `${x.plik} nie wymienia ${id}`;
  if (!gdzie.some((n) => Math.abs(n - x.linia) <= ODLEGLOSC_PU)) return `${x.plik}:${x.linia} leży dalej niż ${ODLEGLOSC_PU} linii od wzmianki o ${id}`;
  return null;
}

/** Spójność katalogu z kodem (te same reguły co tests/jakosc/przypadki-uzycia.test.ts) + ekrany bez trasy; z wymagajTestowB — P-837 (a). */
export function kontrolaKatalogu(root, { wymagajTestowB = false } = {}) {
  const bledy = [];
  const { pu, naglowki, podsumowanie } = czytajKatalog(fs.readFileSync(path.join(root, KATALOG), 'utf8'));
  const SCEN = path.join(root, 'e2e/scenariusze');
  const scenariusze = fs.readdirSync(SCEN).filter((f) => /^\d\d-.*\.yaml$/.test(f)).sort();
  const tagi = (f) => tagiScenariusza(fs.readFileSync(path.join(SCEN, f), 'utf8'));
  const istnieje = (o) => {
    const p = path.join(root, o.plik); if (!fs.existsSync(p)) return false;
    const l = fs.readFileSync(p, 'utf8').split('\n')[o.linia - 1];
    return l !== undefined && l.trim() !== '' && !l.trim().startsWith('#') && !l.trim().startsWith('//');
  };
  if (!naglowki) bledy.push('katalog: brak tabeli z ustalonym nagłówkiem');
  const ids = pu.map((p) => p.id).sort(); // P-847: unikalne, zbiór PU-001…PU-N, kolejność w pliku według sekcji
  ids.forEach((id, i) => { if (id !== `PU-${String(i + 1).padStart(3, '0')}`) bledy.push(`${id}: numeracja (oczekiwano PU-${String(i + 1).padStart(3, '0')}; duplikat albo dziura)`); });
  const licz = (k) => pu.filter((p) => p.klasa === k).length;
  if (podsumowanie?.slice(1).map(Number).join() !== [licz('A'), licz('B'), licz('F'), pu.length].join()) bledy.push('katalog: linia „Podsumowanie” niezgodna z tabelami');
  for (const p of pu) {
    if (!['A', 'B', 'F'].includes(p.klasa)) bledy.push(`${p.id}: klasa „${p.klasa}”`);
    if ([p.cel, p.kroki, p.wynik].some((x) => x.length < 5)) bledy.push(`${p.id}: pusty cel, kroki albo wynik`);
  }
  const t = trasy(root); const nawigacja = new Set(pu.filter((p) => p.sekcja === 'Nawigacja').flatMap((p) => p.ekrany));
  for (const x of t) if (!nawigacja.has(x)) bledy.push(`trasa ${x}: brak PU w „Nawigacja”`);
  for (const x of new Set(pu.flatMap((p) => p.ekrany))) if (!t.includes(x)) bledy.push(`ekran ${x}: nie ma takiej trasy`);
  const uzyte = new Set(pu.flatMap((p) => odnosniki(p.pokrycie)).map((o) => path.basename(o.plik)));
  for (const f of scenariusze) if (!uzyte.has(f)) bledy.push(`${f}: nieprzypisany do PU`);
  for (const p of pu) {
    const o = odnosniki(p.pokrycie);
    if (p.klasa === 'A') {
      if (!o.length) { bledy.push(`${p.id}: klasa A bez plik:linia`); continue; }
      // BX4 (K3-1, KO-072): klasa A = scenariusz E2E (Maestro) — odnośniki do tests/ są tylko dodatkiem
      if (!o.some((x) => scenariusze.includes(x.plik.replace('e2e/scenariusze/', '')))) bledy.push(`${p.id}: klasa A wymaga scenariusza E2E (e2e/scenariusze/NN-….yaml, nie sam podprzepływ ani tests/)`);
      for (const x of o) {
        if (!istnieje(x)) bledy.push(`${p.id}: ${x.plik}:${x.linia} nie istnieje`);
        else if (x.plik.startsWith('e2e/scenariusze/subflows/')) continue;
        else if (x.plik.startsWith('e2e/') && tagi(path.basename(x.plik)).includes('oczekujacy')) bledy.push(`${p.id}: ${x.plik} ma tag oczekujacy (to klasa B)`);
        else if (x.plik.startsWith('tests/')) { const e = bladTestuPU(root, x, p.id); if (e) bledy.push(`${p.id}: ${e}`); }
      }
      // recenzja BX2 R-A-26: linia scenariusza to asercja (albo runFlow podprzepływu wskazanego obok); nie same scenariusze iPada (informacyjne, P-225)
      const yaml = o.filter((x) => x.plik.endsWith('.yaml') && istnieje(x));
      const maPodprzeplyw = yaml.some((x) => x.plik.includes('/subflows/'));
      for (const x of yaml) {
        const l = fs.readFileSync(path.join(root, x.plik), 'utf8').split('\n')[x.linia - 1];
        if (!ASERCJA.test(l) && !(maPodprzeplyw && /^\s*-\s*runFlow\b/.test(l))) bledy.push(`${p.id}: ${x.plik}:${x.linia} nie jest asercją`);
      }
      const scen = yaml.filter((x) => !x.plik.includes('/subflows/')).map((x) => path.basename(x.plik));
      if (scen.length && !o.some((x) => x.plik.startsWith('tests/')) && scen.every((f) => tagi(f).includes('ipad'))) bledy.push(`${p.id}: tylko scenariusze z tagiem ipad (poza bramką)`);
      // BX6 (K3-2, recenzja BX4): klasa A jest związana z konkretnym scenariuszem — co najmniej jeden scenariusz E2E z Pokrycia niesie tag `PU-NNN` tego PU (dokładne dopasowanie: PU-0050 nie zalicza PU-005)
      if (scen.length && !scen.some((f) => tagi(f).includes(p.id))) bledy.push(`${p.id}: scenariusze E2E z Pokrycia (${[...new Set(scen)].join(', ')}) bez tagu ${p.id} (K3-2)`);
    } else if (p.klasa === 'B') {
      if (/^do zaprogramowania: (Maestro iPhone|Maestro iPad|jednostkowy|komponentowy) — .{10,}/.test(p.pokrycie)) {
        if (wymagajTestowB) bledy.push(`${p.id}: klasa B bez testu („do zaprogramowania”, P-837)`);
        continue;
      }
      // KO-071: B „z testem” = test jednostkowy albo komponentowy w tests/ (plik:linia istnieje i wymienia PU) — liczy się jako test dla P-837, klasa zostaje B
      if (/^z testem: /.test(p.pokrycie)) {
        if (!o.some((x) => x.plik.startsWith('tests/'))) bledy.push(`${p.id}: „z testem:” wymaga co najmniej jednego odnośnika plik:linia w tests/ (odnośniki e2e/ tylko jako „częściowo:”)`);
        for (const x of o) {
          if (!istnieje(x)) bledy.push(`${p.id}: ${x.plik}:${x.linia} nie istnieje`);
          else if (x.plik.startsWith('tests/')) { const e = bladTestuPU(root, x, p.id); if (e) bledy.push(`${p.id}: ${e}`); }
        }
        continue;
      }
      const oo = /^oczekujący: /.test(p.pokrycie) ? o.filter((x) => x.plik.startsWith('e2e/')) : [];
      if (!oo.length) { bledy.push(`${p.id}: Pokrycie klasy B ani „do zaprogramowania: <poziom> — …”, ani „oczekujący: plik:linia”`); continue; }
      for (const x of oo) {
        if (!istnieje(x)) { bledy.push(`${p.id}: ${x.plik}:${x.linia} nie istnieje`); continue; }
        // BX4 (K2-2, część tania): linia „oczekującego” to asercja, nie nagłówek YAML
        if (!ASERCJA.test(fs.readFileSync(path.join(root, x.plik), 'utf8').split('\n')[x.linia - 1])) bledy.push(`${p.id}: ${x.plik}:${x.linia} nie jest asercją`);
        const tt = tagi(path.basename(x.plik));
        for (const w of ['oczekujacy', 'przypadki-uzycia', p.id]) if (!tt.includes(w)) bledy.push(`${p.id}: ${x.plik} bez tagu ${w}`);
      }
      // P-855 (KO-073): scenariusz z tagiem oczekujacy nie biegnie (poza bramką Jakość iOS), więc niczego nie sprawdza — PU liczy się po zielonym przebiegu i zdjęciu tagu (klasa A)
      if (wymagajTestowB) bledy.push(`${p.id}: klasa B „oczekujący” nie liczy się jako test (scenariusz z tagiem oczekujacy nie biegnie; do zielonego przebiegu na SHA i zdjęcia tagu, P-855)`);
    } else if (p.klasa === 'F') {
      const m = /^F: ([^—]+) — (.+)$/.exec(p.pokrycie);
      if (!m || !KATEGORIE_F.includes(m[1].trim()) || m[2].trim().length < 30) bledy.push(`${p.id}: Pokrycie klasy F nie jest „F: <kategoria> — <powód ≥ 30 znaków>”`);
    }
  }
  return [...bledy, ...ekranyBezTrasy(root), ...kontrolaFunkcji(root, new Set(pu.map((p) => p.id)))];
}

/** Sekcja „## Funkcje” (kryterium właściciela 15.11 18:16, inwentarz BX2): każdy wiersz `| Grupa | Funkcja | `kod` | PU… |` ma istniejące PU,
 *  a każdy plik src/przypadki-uzycia/*.ts (poza testami) jest wymieniony w kolumnie Kod — nowa funkcja domeny bez PU czerwieni verify. */
export function kontrolaFunkcji(root, ids) {
  const tekst = fs.readFileSync(path.join(root, KATALOG), 'utf8');
  const i = tekst.indexOf('\n## Funkcje\n');
  if (i < 0) return ['katalog: brak sekcji „## Funkcje” (inwentarz funkcji z kodu → PU)'];
  const sekcja = tekst.slice(i + 1, tekst.indexOf('\n## ', i + 1) >>> 0);
  const wiersze = sekcja.split('\n').filter((l) => /^\| (?!Grupa \||---)/.test(l)).map((l) => l.split('|').slice(1, -1).map((x) => x.trim()));
  const bledy = [];
  const kody = [];
  for (const k of wiersze) {
    if (k.length !== 4) { bledy.push(`Funkcje: wiersz „${k.join(' | ').slice(0, 50)}” nie ma 4 kolumn`); continue; }
    kody.push(k[2]);
    const p = [...k[3].matchAll(/PU-\d{3,}/g)].map((m) => m[0]);
    if (!p.length) bledy.push(`Funkcje: „${k[1].slice(0, 50)}” bez PU`);
    for (const id of p) if (!ids.has(id)) bledy.push(`Funkcje: „${k[1].slice(0, 50)}” wskazuje nieistniejący ${id}`);
  }
  const pliki = fs.readdirSync(path.join(root, 'src/przypadki-uzycia')).filter((f) => f.endsWith('.ts') && !/\.test\.ts$/.test(f));
  for (const f of pliki) if (!kody.some((k) => new RegExp(`(^|[\\s\`/,])${f.replace(/[.-]/g, '\\$&')}`).test(k))) bledy.push(`Funkcje: src/przypadki-uzycia/${f} bez wiersza (funkcja domeny bez PU)`);
  return bledy;
}

// ---------- kontrola 3 ----------
export function poprzedniBuild(tagi) {
  const n = tagi.map((t) => /^v[^\s]*-b(\d+)$/.exec(t)).filter(Boolean).map((m) => Number(m[1]));
  return n.length ? Math.max(...n) : null;
}
/** Treść bez bloków kodu (```) i komentarzy HTML — wiersz tam nie jest wynikiem testu (BX3 P1-1). */
const bezBlokowKodu = (tekst) => tekst.replace(/```[\s\S]*?(```|$)/g, '').replace(/<!--[\s\S]*?(-->|$)/g, '');
/** Wiersze `| PU-NNN | <wynik> |` → [[id, wynik], …] w kolejności pliku (duplikaty zostają widoczne). */
export function wierszeProtokolu(tekst) {
  const w = [];
  for (const l of bezBlokowKodu(tekst).split('\n')) { const m = /^\| (PU-\d{3,}) \|(.*)\|\s*$/.exec(l.trim()); if (m) w.push([m[1], m[2].trim()]); }
  return w;
}
/** Wiersze `| PU-NNN | <wynik> |` → { 'PU-NNN': '<wynik>' } (ostatni wygrywa; duplikaty wykrywa kontrolaProtokolu). */
export function czytajProtokol(tekst) {
  return Object.fromEntries(wierszeProtokolu(tekst));
}
/** Znaki informacyjne uzasadnienia: litery i cyfry (znaki zerowej szerokości, spacje i interpunkcja nie liczą się). */
const znaki = (x) => (x.match(/[\p{L}\p{N}]/gu) ?? []).length;
const MIN_ZNAKOW_POMINIECIA = 8; // „brak iPada” (9) przechodzi; „x”, „n/a”, „-” nie. Treść uzasadnienia ocenia człowiek, bramka tylko wyklucza puste formy.
export function kontrolaProtokolu({ build, wymagane, tekst, wyjatki = {} }) {
  if (tekst === null || tekst === undefined) return wyjatki[String(build)] ? [] : [`brak ${PROTOKOLY}/${build}.md`];
  const bledy = [];
  if (!wymagane.length) bledy.push('brak PU klasy F w katalogu (pusty zbiór wymaganych — błąd katalogu albo parsowania, nie „nic do sprawdzenia”)');
  const wiersze = wierszeProtokolu(tekst);
  const licz = new Map();
  for (const [id] of wiersze) licz.set(id, (licz.get(id) ?? 0) + 1);
  for (const [id, n] of licz) if (n > 1) bledy.push(`${id}: ${n} wiersze w protokole (jeden wynik na PU)`);
  const w = czytajProtokol(tekst);
  for (const id of wymagane) {
    const x = w[id];
    if (x === undefined) bledy.push(`${id}: brak w protokole`);
    else if (/^pominięte:\s*$/.test(x)) bledy.push(`${id}: „pominięte:” bez uzasadnienia`);
    else if (/^zrobione:\s*$/.test(x)) bledy.push(`${id}: „zrobione:” bez wyniku`);
    else if (!/^(zrobione|pominięte): \S/.test(x)) bledy.push(`${id}: wynik „${x}” nie jest „zrobione: …” ani „pominięte: …”`);
    else if (/<[^>]*>/.test(x)) bledy.push(`${id}: wynik „${x}” zawiera niewypełniony znacznik <…>`);
    else if (x.startsWith('pominięte:') && znaki(x.slice('pominięte:'.length)) < MIN_ZNAKOW_POMINIECIA) bledy.push(`${id}: uzasadnienie pominięcia za krótkie (min. ${MIN_ZNAKOW_POMINIECIA} liter lub cyfr)`);
    else if (x.startsWith('zrobione:') && znaki(x.slice('zrobione:'.length)) < 2) bledy.push(`${id}: „zrobione:” bez wyniku (litery lub cyfry)`);
  }
  return bledy;
}
export function kontrolaWyjatkow(wyjatki) {
  const bledy = [];
  for (const [build, w] of Object.entries(wyjatki)) {
    if (build !== '1171') { bledy.push(`wyjątek dla ${build}: dozwolony tylko 1171 (P-838)`); continue; }
    if (w?.decyzja !== 'P-838') bledy.push(`wyjątek 1171: decyzja ${w?.decyzja} zamiast P-838`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(w?.data ?? '')) bledy.push('wyjątek 1171: brak daty');
    if (!(w?.powod ?? '').trim()) bledy.push('wyjątek 1171: brak powodu');
  }
  return bledy;
}

// ---------- polecenia ----------
const git = (root, ...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
function protokolBuildu(root, build, { wyjatki }) {
  const tag = git(root, 'tag', '-l', `v*-b${build}`).split('\n').filter(Boolean)[0];
  let katalog = null;
  if (tag) try { katalog = git(root, 'show', `${tag}:${KATALOG}`); } catch { katalog = null; }
  const zrodlo = katalog ? `katalog z tagu ${tag}` : 'katalog bieżący (w tagu go nie ma)';
  katalog ??= fs.readFileSync(path.join(root, KATALOG), 'utf8');
  const plik = path.join(root, PROTOKOLY, `${build}.md`);
  const tekst = fs.existsSync(plik) ? fs.readFileSync(plik, 'utf8') : null;
  const wymagane = wymaganeF(katalog);
  const bledy = kontrolaProtokolu({ build, wymagane, tekst, wyjatki });
  const opis = tekst === null && wyjatki[String(build)] ? `wyjątek ${wyjatki[String(build)].decyzja} (${wyjatki[String(build)].powod})` : `${wymagane.length} PU klasy F, ${zrodlo}`;
  return { bledy, opis };
}
const wypisz = (naglowek, bledy) => {
  console.log(`${naglowek}: ${bledy.length ? `CZERWONA (${bledy.length})` : 'zielona'}`);
  for (const b of bledy.slice(0, 200)) console.log(`::error::${naglowek}: ${b}`);
  if (bledy.length > 200) console.log(`… i ${bledy.length - 200} więcej`);
};

async function main([cmd, ...a]) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const env = process.env;
  const podsumowanie = (t) => { if (env.GITHUB_STEP_SUMMARY) fs.appendFileSync(env.GITHUB_STEP_SUMMARY, `${t}\n`); };
  const wyjatkiPlik = JSON.parse(fs.readFileSync(path.join(root, PROTOKOLY, 'wyjatki.json'), 'utf8'));
  if (cmd === 'katalog') {
    const b = kontrolaKatalogu(root, { wymagajTestowB: false });
    wypisz('Kontrola 2', b);
    return b.length ? 1 : 0;
  }
  if (cmd === 'recenzja') {
    const build = Number(a[0]);
    if (!Number.isInteger(build) || build <= 0) { console.log('użycie: recenzja <build>'); return 2; }
    const { bledy, opis } = protokolBuildu(root, build, { wyjatki: {} }); // przed App Review bez wyjątków
    wypisz(`Protokół F buildu ${build} przed App Review (${opis})`, bledy);
    return bledy.length ? 1 : 0;
  }
  if (cmd !== 'bramka') { console.error('użycie: w nagłówku pliku'); return 2; }
  let czerwone = 0;
  podsumowanie('## Bramka przypadków użycia (KO-065)');
  // 1
  if (env.POMIN === 'true') {
    console.log('::warning::Kontrola 1: pominięta (pomin_bramke_e2e z powodem w zadaniu bramka — awaria maszyny); kontrole 2 i 3 biegną');
    podsumowanie('- Kontrola 1: **pominięta** (pomin_bramke_e2e)');
  } else {
    let b;
    if (!env.PRZEBIEG || !env.GH_TOKEN || !env.GITHUB_REPOSITORY) b = ['brak PRZEBIEG, GH_TOKEN albo GITHUB_REPOSITORY (wynik zadania bramka)'];
    else {
      // BX4 (K1-2): strony po 100 do `total_count`; SHA zadań porównywany z GITHUB_SHA (K1-1)
      const zadania = []; let total; let blad = null;
      for (let strona = 1; strona <= 10 && !blad; strona++) {
        const odp = await fetch(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}/actions/runs/${env.PRZEBIEG}/jobs?per_page=100&page=${strona}`, { headers: { Authorization: `Bearer ${env.GH_TOKEN}`, Accept: 'application/vnd.github+json' } });
        if (!odp.ok) { blad = [`API zadań przebiegu ${env.PRZEBIEG}: HTTP ${odp.status}`]; break; }
        const dane = await odp.json();
        total = dane.total_count; zadania.push(...(dane.jobs ?? []));
        if ((dane.jobs ?? []).length === 0 || zadania.length >= total) break;
      }
      b = blad ?? [...kompletnoscZadan(total, zadania.length), ...ocenZestawu(zadania, JSON.parse(fs.readFileSync(path.join(root, 'e2e/czesci.json'), 'utf8')).czesci, env.GITHUB_SHA)];
    }
    wypisz(`Kontrola 1: zestaw PU w przebiegu „Jakość · iOS” #${env.PRZEBIEG || '?'}`, b);
    podsumowanie(`- Kontrola 1 (zestaw PU, przebieg ${env.PRZEBIEG || '?'}): ${b.length ? `czerwona (${b.length})` : 'zielona'}`);
    czerwone += b.length;
  }
  // 2
  const b2 = kontrolaKatalogu(root, { wymagajTestowB: true });
  wypisz('Kontrola 2: katalog spójny z kodem, każdy PU klasy B z testem (P-837)', b2);
  podsumowanie(`- Kontrola 2 (katalog, B z testem): ${b2.length ? `czerwona (${b2.length}; w tym B bez testu: ${b2.filter((x) => /klasa B bez testu/.test(x)).length})` : 'zielona'}`);
  czerwone += b2.length;
  // 3
  const bw = kontrolaWyjatkow(wyjatkiPlik);
  let tagi = [];
  try { tagi = git(root, 'tag', '-l', 'v*-b*').split('\n').filter(Boolean); } catch { /* brak repo git */ }
  const poprz = poprzedniBuild(tagi);
  let b3; let opis = '';
  if (poprz === null) b3 = ['brak tagów v*-b<N> (checkout bez tagów? fetch-depth: 0)'];
  else ({ bledy: b3, opis } = protokolBuildu(root, poprz, { wyjatki: wyjatkiPlik }));
  b3 = [...bw, ...b3];
  wypisz(`Kontrola 3: protokół testu fizycznego buildu ${poprz ?? '?'}${opis ? ` (${opis})` : ''}`, b3);
  podsumowanie(`- Kontrola 3 (protokół F buildu ${poprz ?? '?'}): ${b3.length ? `czerwona (${b3.length})` : `zielona — ${opis}`}`);
  czerwone += b3.length;
  return czerwone ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // exitCode zamiast process.exit(): przy wyjściu do potoku (CI, jest) exit() ucina niewypisane linie (178 błędów kontroli 2 gubiło „Kontrola 3”)
  main(process.argv.slice(2)).then((k) => { process.exitCode = k; }, (e) => { console.log(`::error::${e.message}`); process.exitCode = 1; });
}
