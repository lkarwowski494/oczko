// Tabela przekazania roli 07 → 08 (E4): plik testów akceptacyjnych → kryteria (ID z nazw testów) → pliki src do wdrożenia (importy zaślepek)
// → kolejność (moduly.md / e4-przekazanie roli 05: domena → dane → platforma → ekrany) → zależność od poprawek 01/02/05 (ER-/Z07- w pliku).
// Katalogi: tests/akceptacja (oczekujące, czerwone do wdrożenia), tests/domena i tests/dane (przeniesione przez 08 do głównego zestawu, zielone) — F07-04, F07-10.
// Pułapka (F07-10, P-125 Q1a): plik testów w tests/ importujący src/{domena,dane,przypadki-uzycia,ekrany} poza katalogami tabeli i WYLACZONE → błąd,
// żeby przeniesienie do nowego katalogu nie usuwało wierszy po cichu (--check porównuje tylko z regeneracją).
// Użycie: node docs/jakosc/narzedzia/tabela-08.mjs [--wynik docs/jakosc/e4/tabela-08.md] [--check docs/jakosc/e4/tabela-08.md] [--korzen <katalog>]
//   (kod 1, gdy jakiś plik testów nie wskazuje pliku src, leży poza katalogami tabeli albo gdy --check: plik różni się od regeneracji)
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';

const ik = process.argv.indexOf('--korzen');
const KORZEN = ik > 0 ? resolve(process.argv[ik + 1]) : resolve(dirname(new URL(import.meta.url).pathname), '../../..');
const KATALOGI = [['tests/akceptacja', 'oczekuje'], ['tests/domena', 'zielony (główny zestaw)'], ['tests/dane', 'zielony (główny zestaw)'], ['tests/adaptery', 'zielony (główny zestaw)'], ['tests/ekrany', 'zielony (główny zestaw)']]; // tests/adaptery: 08 partia 3 (P-127); tests/ekrany: 08 partia 4 (DS-02, ekrany warstwy 4)
const WYLACZONE = ['tests/i18n', 'tests/niezawodnosc']; // rola 09 (i18n E0–E1) i rola 12 (E2–E3, ADR-0019/0020, testy własne roli 12) — poza przekazaniem 07 → 08
const w = (rel, k) => rel.startsWith(k + '/');
const wszystkie = [];
function skan(d) { if (!existsSync(d)) return; for (const n of readdirSync(d)) { if (n === 'node_modules') continue; const p = join(d, n); if (statSync(p).isDirectory()) skan(p); else if (/\.test\.tsx?$/.test(n)) wszystkie.push(p); } }
skan(join(KORZEN, 'tests'));
const pliki = wszystkie.filter((p) => KATALOGI.some(([k]) => w(relative(KORZEN, p), k)));
const stan = (rel) => KATALOGI.find(([k]) => w(rel, k))[1];

const ID = /\b(BR-[A-Z]{3}-\d{3}(?:\/S\d+)?|NFR-[A-Z]{3}-\d{3}|KP-\d{2}|RD-\d{2}|P-\d{3}|R-\d{3}|PR-\d{2})\b/g;
const POPRAWKI = /\b(ER-\d{2}|Z07-\d{2})\b/g;
const KOLEJNOSC = [
  [/domena\/zakup/, 1, 'domena: limit, dostęp, informacje o Pro'],
  [/domena\/licznik/, 1, 'domena: licznik, scal, strażnik, przypomnienia'],
  [/domena\/(dni|obliczenia)/, 1, 'domena: dni, postęp, obliczenia'],
  [/domena\/maszyny/, 1, 'domena: maszyny stanów'],
  [/domena\/luki/, 1, 'domena: funkcje dodane w E3 (Z07-22)'],
  [/dane\//, 2, 'dane: port bazy, migracje, repozytoria, archiwum, kopie'],
  [/ekrany\//, 4, 'ekrany (po adapterach platformy, krok 3)'],
];
const wiersze = [];
let bledy = 0;
for (const p of wszystkie.sort()) {
  const rel = relative(KORZEN, p);
  if (pliki.includes(p) || WYLACZONE.some((k) => w(rel, k))) continue;
  if (/from\s+['"](?:\.\.\/)+src\/(?:domena|dane|przypadki-uzycia|ekrany)\//.test(readFileSync(p, 'utf8'))) { bledy++; console.log(`BŁĄD ${rel}: importuje src, a leży poza katalogami tabeli (${KATALOGI.map(([k]) => k).join(', ')}) — dopisz katalog w KATALOGI albo WYLACZONE`); }
}
for (const p of pliki.sort()) {
  const t = readFileSync(p, 'utf8');
  const rel = relative(KORZEN, p);
  const src = [...new Set([...t.matchAll(/from\s+['"]((?:\.\.\/)+src\/[^'"]+)['"]/g)].map((m) => relative(KORZEN, resolve(dirname(p), m[1]))))].sort();
  // M1-127 (07-jakosc-519): deklaracja = `test(`/`it(` albo `test.each`/`it.each` (z nawiasem w danych przypadków, z typem `<…>`, z tablicą `\`…\``), każda raz;
  // `.test(` metody (np. `/re/.test(s)`) to nie test. Zgodne z AST TypeScript dla wszystkich plików tabeli (dowód M1-127).
  const testy = (t.match(/(?<![.\w$])(?:test|it)(?:\.each\b|\s*\()/g) ?? []).length;
  const ids = [...new Set(t.match(ID) ?? [])].sort();
  const plikSrc = (s) => ['.ts', '.tsx', '/index.ts'].map((e) => join(KORZEN, s + e)).find((x) => existsSync(x));
  const zPropozycji = src.some((s) => { const f = plikSrc(s); return f && /Z07-22/.test(readFileSync(f, 'utf8')); });
  const pop = [...new Set([...(t.match(POPRAWKI) ?? []), ...(zPropozycji ? ['Z07-22'] : [])])].sort();
  const [, nr, opis] = KOLEJNOSC.find(([re]) => re.test(rel)) ?? [null, 9, '?'];
  if (!src.length) { bledy++; console.log(`BŁĄD ${rel}: nie importuje żadnego pliku src`); }
  wiersze.push({ rel, src, testy, ids, pop, nr, opis, stan: stan(rel) });
}
wiersze.sort((a, b) => a.nr - b.nr || a.rel.localeCompare(b.rel));
const md = [
  '# Przekazanie 07 → 08: testy akceptacyjne → kryteria → pliki do wdrożenia',
  `Wygenerowano: \`node docs/jakosc/narzedzia/tabela-08.mjs --wynik docs/jakosc/e4/tabela-08.md\` (data: historia git pliku; bez daty w treści, żeby \`--check\` dawał pusty diff). Kolejność według \`docs/architektura/e4-przekazanie.md\` („Co czyta każda rola: 08”): 1 domena, 2 dane, 3 adaptery i Swift (testy natywne: \`tests/wspolne/xctest-specyfikacja.md\`, scenariusze \`e2e/\`), 4 ekrany. Kolumna „Zależy od poprawek” = zgłoszenia wymienione w pliku testów: test może się zmienić w sesji fix 01/02/05 (P-090 Q3a, P-091 11a, P-096).`,
  '',
  '| Kolejność | Plik testów | Stan | Testy (wywołania) | Kryteria i ryzyka (ID) | Pliki src do wdrożenia | Zależy od poprawek |',
  '|---|---|---|---|---|---|---|',
  ...wiersze.map((w) => `| ${w.nr} ${w.opis} | \`${w.rel}\` | ${w.stan} | ${w.testy} | ${w.ids.join(', ') || '—'} | ${w.src.map((s) => `\`${s}\``).join('<br>')} | ${w.pop.join(', ') || '—'} |`),
  '',
  `Razem plików testów: ${wiersze.length}; zależnych od poprawek: ${wiersze.filter((w) => w.pop.length).length}.`,
];
const tekst = md.join('\n') + '\n';
const i = process.argv.indexOf('--wynik');
if (i > 0) { mkdirSync(dirname(process.argv[i + 1]), { recursive: true }); writeFileSync(process.argv[i + 1], tekst); }
const c = process.argv.indexOf('--check');
if (c > 0) {
  const plik = process.argv[c + 1];
  if (!existsSync(plik) || readFileSync(plik, 'utf8') !== tekst) { bledy++; console.log(`BŁĄD ${plik}: nieaktualna — uruchom: node docs/jakosc/narzedzia/tabela-08.mjs --wynik ${plik}`); }
}
console.log(`plików testów: ${wiersze.length}, zależnych od poprawek: ${wiersze.filter((w) => w.pop.length).length}, błędów: ${bledy}`);
process.exit(bledy ? 1 : 0);
