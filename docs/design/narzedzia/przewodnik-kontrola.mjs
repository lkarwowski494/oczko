// przewodnik-kontrola.mjs — kontrola treści przewodnika po funkcjach (rola 04, sesja O, 2026-11-10; P-685–P-689).
// Użycie (z katalogu repo): node docs/design/narzedzia/przewodnik-kontrola.mjs [--js]
// Sprawdza: (1) klucz nazwy istnieje w en.json i pl.json i jest literałem w app/ albo src/ (poza słownikami);
// (2) każda nazwa w cudzysłowie drukarskim (en “…”, pl „…”) to wartość takiego klucza w tym języku albo literał z `literaly`
//     (reguła tests/wydanie/notatka-nazwy.test.ts); (3) plik trasy istnieje (app/…); (4) każda funkcja MVP z docs/scope-contract.md
//     jest w kroku, w bibliotece albo na liście pominiętych; (5) liczy nowe klucze i teksty. Kod 1 przy błędzie.
// Z --js zapisuje przewodnik-2026-11-10/tresc.js (dane dla makiety z nazwami rozwiązanymi w en i pl).
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const KORZEN = process.cwd();
const KAT = join(KORZEN, 'docs/design/przewodnik-2026-11-10');
const T = JSON.parse(readFileSync(join(KAT, 'tresc.json'), 'utf8'));
const plaski = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' && v ? plaski(v, `${p}${k}.`) : [[`${p}${k}`, String(v)]]));
const slownik = (j) => Object.fromEntries(plaski(JSON.parse(readFileSync(join(KORZEN, `src/i18n/slowniki/${j}.json`), 'utf8'))));
const S = { en: slownik('en'), pl: slownik('pl') };
const pliki = (k) => readdirSync(k).flatMap((n) => { const p = join(k, n); if (statSync(p).isDirectory()) return /i18n/.test(p) ? [] : pliki(p); return /\.(ts|tsx)$/.test(n) ? [p] : []; });
const KOD = ['app', 'src'].flatMap((k) => pliki(join(KORZEN, k))).map((p) => readFileSync(p, 'utf8')).join('\n');
const wKodzie = (k) => KOD.includes(`'${k}'`) || KOD.includes(`"${k}"`) || KOD.includes(`\`${k}\``);
const NOWE = new Set(Object.keys(T.klucze_stale));
const bledy = []; const info = [];

// (1) klucze nazw
const funkcje = T.grupy.flatMap((g) => g.funkcje.map((f) => ({ ...f, grupa: g.id })));
const nazwa = (f, j) => (f.nazwaLiteral ? f.nazwaLiteral : NOWE.has(f.nazwaKlucz) ? T.klucze_stale[f.nazwaKlucz][j] : S[j][f.nazwaKlucz]);
for (const x of [...T.grupy.map((g) => ({ id: `grupa ${g.id}`, nazwaKlucz: g.nazwaKlucz })), ...funkcje.map((f) => ({ id: `funkcja ${f.id}`, ...f }))]) {
  if (x.nazwaLiteral) continue;
  if (NOWE.has(x.nazwaKlucz)) continue;
  for (const j of ['en', 'pl']) if (S[j][x.nazwaKlucz] === undefined) bledy.push(`${x.id}: brak klucza ${x.nazwaKlucz} w ${j}.json`);
  if (!wKodzie(x.nazwaKlucz)) bledy.push(`${x.id}: klucz ${x.nazwaKlucz} nie jest literałem w app/ ani src/`);
}

// (2) nazwy w cudzysłowach
const UZYWANE = { en: new Set(), pl: new Set() };
for (const j of ['en', 'pl']) for (const [k, v] of Object.entries(S[j])) if (wKodzie(k)) UZYWANE[j].add(v);
const wzor = { en: /“([^”]+)”/g, pl: /„([^”]+)”/g };
const teksty = [
  ...Object.entries(T.klucze_stale).map(([k, v]) => ({ id: k, en: v.en, pl: v.pl })),
  ...T.kroki.map((k) => ({ id: `krok ${k.id}`, en: k.en, pl: k.pl })),
  ...funkcje.map((f) => ({ id: `funkcja ${f.id}`, en: f.en, pl: f.pl })),
];
let cytatow = 0;
for (const t of teksty) for (const j of ['en', 'pl']) for (const m of t[j].matchAll(wzor[j])) {
  cytatow++;
  const n = m[1];
  if (T.literaly.includes(n) || UZYWANE[j].has(n) || [...NOWE].some((k) => T.klucze_stale[k][j] === n)) continue;
  bledy.push(`${t.id} (${j}): „${n}” nie jest wartością klucza używanego w interfejsie ani literałem`);
}
info.push(`nazwy w cudzysłowach: ${cytatow} (en + pl), sprawdzone`);

// (3) pliki tras
const plikTrasy = (r) => {
  if (r === '/') return 'app/(zakladki)/index.tsx';
  const z = `app/(zakladki)${r}.tsx`; if (existsSync(join(KORZEN, z))) return z;
  return `app${r}.tsx`;
};
const trasy = new Map();
for (const x of [...T.kroki.map((k) => ({ id: `krok ${k.id}`, ...k })), ...funkcje.map((f) => ({ id: `funkcja ${f.id}`, ...f }))]) {
  for (const r of [x.trasa, x.zapas].filter(Boolean)) {
    const p = plikTrasy(r);
    if (!existsSync(join(KORZEN, p))) bledy.push(`${x.id}: brak pliku trasy ${p}`);
    trasy.set(r, p);
  }
  if (x.trasa === null && !x.bezTrasy) bledy.push(`${x.id}: brak trasy bez uzasadnienia`);
}
info.push(`trasy docelowe: ${[...trasy].map(([r, p]) => `${r} → ${p}`).join('; ')}`);
info.push(`funkcje bez trasy (z uzasadnieniem): ${funkcje.filter((f) => f.trasa === null).map((f) => `${f.id} — ${f.bezTrasy}`).join('; ') || 'brak'}`);

// (4) pokrycie kontraktu zakresu
const kontrakt = readFileSync(join(KORZEN, 'docs/scope-contract.md'), 'utf8');
const mvp = [...kontrakt.matchAll(/^\| (F-\d+) \|[^|]*\|[^|]*\| MVP \|/gm)].map((m) => m[1]);
const pokryte = new Set([...T.kroki, ...funkcje].flatMap((x) => x.F));
const pominiete = new Set(T.pominiete.flatMap((p) => p.F.split(/,\s*/)));
const brak = mvp.filter((f) => !pokryte.has(f) && !pominiete.has(f));
if (brak.length) bledy.push(`funkcje MVP bez miejsca w przewodniku ani na liście pominiętych: ${brak.join(', ')}`);
info.push(`kontrakt zakresu: ${mvp.length} funkcji MVP; w przewodniku ${mvp.filter((f) => pokryte.has(f)).length}; pominięte z powodem ${mvp.filter((f) => pominiete.has(f) && !pokryte.has(f)).length}`);

// (5) liczby
const nowe = { stale: NOWE.size, kroki: T.kroki.length, opisy: funkcje.length };
const razem = nowe.stale + nowe.kroki + nowe.opisy;
const znaki = (j) => teksty.reduce((s, t) => s + t[j].length, 0);
info.push(`grupy: ${T.grupy.length}; funkcje w bibliotece: ${funkcje.length}; kroki: ${T.kroki.length}`);
info.push(`nowe klucze: ${razem} (stałe ${nowe.stale} + kroki ${nowe.kroki} + opisy funkcji ${nowe.opisy}); nazwy funkcji i grup z istniejących kluczy: ${new Set([...T.grupy, ...funkcje].map((x) => x.nazwaKlucz).filter((k) => k && !NOWE.has(k))).size}`);
info.push(`teksty do tłumaczenia (rola 09): ${razem} × 34 języki = ${razem * 34}; znaki en: ${znaki('en')}, pl: ${znaki('pl')}`);
const najdl = teksty.map((t) => ({ id: t.id, n: Math.max(t.en.length, t.pl.length) })).sort((a, b) => b.n - a.n)[0];
info.push(`najdłuższy tekst: ${najdl.id}, ${najdl.n} znaków`);

if (process.argv.includes('--js')) {
  const dane = {
    stale: T.klucze_stale,
    kroki: T.kroki.map((k) => ({ id: k.id, en: k.en, pl: k.pl, trasa: k.trasa })),
    grupy: T.grupy.map((g) => ({ id: g.id, en: nazwa(g, 'en'), pl: nazwa(g, 'pl'),
      funkcje: g.funkcje.map((f) => ({ id: f.id, en: nazwa(f, 'en'), pl: nazwa(f, 'pl'), opisEn: f.en.replace('{{limit}}', '5'), opisPl: f.pl.replace('{{limit}}', '5'), trasa: f.trasa })) })),
  };
  writeFileSync(join(KAT, 'tresc.js'), `// wygenerowane przez narzedzia/przewodnik-kontrola.mjs --js z tresc.json — nie edytuj ręcznie\nwindow.PRZEWODNIK = ${JSON.stringify(dane, null, 1)};\n`);
  info.push('zapisano tresc.js (limit w makiecie: 5 [PRZYKŁAD])');
}
if (process.argv.includes('--md')) {
  const w = (s) => s.replace(/\|/g, '\\|');
  const r = ['# Przewodnik — klucze i18n (wygenerowane z tresc.json: `node docs/design/narzedzia/przewodnik-kontrola.mjs --md`)', '',
    '## Nowe klucze', '', '| Klucz | en | pl | Gdzie / trasa „Pokaż” |', '|---|---|---|---|',
    ...Object.entries(T.klucze_stale).map(([k, v]) => `| \`${k}\` | ${w(v.en)} | ${w(v.pl)} | ${w(v._gdzie)} |`),
    ...T.kroki.map((k) => `| \`przewodnik.krok_${k.id}\` | ${w(k.en)} | ${w(k.pl)} | \`${k.trasa}\`${k.zapas ? ` (bez miejsca: \`${k.zapas}\`)` : ''} |`),
    ...funkcje.map((f) => `| \`przewodnik.f_${f.id.replace(/-/g, '_')}\` | ${w(f.en)} | ${w(f.pl)} | ${f.trasa ? `\`${f.trasa}\` → \`${plikTrasy(f.trasa)}\`${f.zapas ? ` (bez miejsca: \`${f.zapas}\`)` : ''}` : `bez „Pokaż”: ${f.bezTrasy}`} |`),
    '', '## Biblioteka: nazwy z istniejących kluczy', '', '| Grupa | Funkcja (id) | Klucz nazwy | en | pl | Kontrakt |', '|---|---|---|---|---|---|',
    ...funkcje.map((f) => `| ${nazwa(T.grupy.find((g) => g.id === f.grupa), 'pl')} | \`${f.id}\` | ${f.nazwaKlucz ? `\`${f.nazwaKlucz}\`` : 'literał'} | ${w(nazwa(f, 'en'))} | ${w(nazwa(f, 'pl'))} | ${f.F.join(', ') || '—'} |`), ''];
  writeFileSync(join(KAT, 'klucze.md'), r.join('\n'));
  info.push('zapisano klucze.md');
}
for (const x of info) console.log('INFO', x);
for (const x of bledy) console.log('BŁĄD', x);
console.log(bledy.length ? `${bledy.length} błędów` : 'OK');
process.exit(bledy.length ? 1 : 0);
