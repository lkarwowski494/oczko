import { readFileSync, writeFileSync, copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
// Mutanty ręczne wzorców 02 (limit, dostęp) i 05 (scal) — JAK-04. Skrypt sam kopiuje pliki do katalogu tymczasowego (repo nietknięte).
// Kod 1: brak wzorca w bieżącym kodzie (wzorzec do aktualizacji w tym samym commicie co zmiana kodu) albo mutant przeżył.
// Historia: E1 roli 07 (2026-10-25) 7 z 18 przeżywało; F07-06 (P-109, P-117 Q3a) — 7 wzorców sprzed fixów 02 i 05 zastąpionych
// odpowiednikami z bieżącego kodu, dopisane mutanty karencji (P-103 (2a)) i okna offline (P-103 (3a)). Użycie: node docs/jakosc/narzedzia/mutanty-e1.mjs
const KORZEN = resolve(dirname(new URL(import.meta.url).pathname), '../../..');
const PLIKI = ['docs/monetyzacja/limit.mjs', 'docs/monetyzacja/limit-test.mjs', 'docs/monetyzacja/dostep.mjs', 'docs/monetyzacja/dostep-test.mjs',
  'docs/monetyzacja/wektory-limitu.json', 'docs/monetyzacja/wektory-dostepu.json',
  'docs/architektura/eksperymenty/e1/scal.mjs', 'docs/architektura/eksperymenty/e1/scal-test.mjs', 'docs/architektura/eksperymenty/e1/scal-wektory.json'];
const M = {
 'limit.mjs': [
  ['teraz - ostatniPlus < przerwa', 'teraz - ostatniPlus <= przerwa'],
  ['teraz - ostatniPlus >= 0 &&', ''],
  ['darmowe(dni) < limit', 'darmowe(dni) <= limit'],
  ['!pro && zostalo === 1', '!pro && zostalo <= 1'],
  ['!pro && zostalo === 1', 'zostalo === 1'],
  ['d.data.startsWith(miesiac) && !zPro.has(d.data)', 'd.data.startsWith(miesiac)'], // dni z Pro liczą się do limitu (P-057 D5, P-103 (1a))
  ['if (pro) return wynik(true, { data: dzis, pro: true });', 'if (pro) return wynik(true, null);'],
  ['Math.max(0, limit - darmowe(po))', 'limit - darmowe(po)'],
  ['dzis.slice(0, 7)', 'dzis.slice(0, 4)'],
 ],
 'dostep.mjs': [
  ['koniec(u) === null || koniec(u) > teraz', 'koniec(u) === null || koniec(u) >= teraz'], // styk sklepu (W-20)
  ['teraz < wygasa + LASKA_OFFLINE_MS', 'teraz <= wygasa + LASKA_OFFLINE_MS'], // styk okna offline (W-20b)
  ['teraz < wygasa + LASKA_OFFLINE_MS', 'teraz < wygasa'], // bez okna offline (P-103 (3a), W-21b)
  ['Math.max(...wazne.map(koniec))', 'Math.min(...wazne.map(koniec))'],
  ['wazne.some((u) => koniec(u) === null) ? null :', ''],
  ["typeof u.karencjaDo === 'number' ? u.karencjaDo : -Infinity", '-Infinity'], // karencja pominięta (P-103 (2a), W-23)
  ['pamiec.produkty.length > 0 &&', ''],
  ['!u.odebrane && ', ''],
 ],
 'scal.mjs': [
  ['w = Math.max(0, (z.rodzice.length', 'w = ((z.rodzice.length'],
  ['.sort();', ';'],
  // `rodzice[0]` → ostatni rodzic: mutant równoważny (plus/minus z > 1 rodzicem odpada wcześniej jako wiele_rodzicow) — zastąpiony granicą M-09.
  ["z.rodzaj !== 'rozstrzygniecie' && z.rodzice.length > 1", "z.rodzaj !== 'rozstrzygniecie' && z.rodzice.length > 2"],
 ],
};
const testy = { 'limit.mjs': 'limit-test.mjs', 'dostep.mjs': 'dostep-test.mjs', 'scal.mjs': 'scal-test.mjs' };
const dir = mkdtempSync(join(tmpdir(), 'mutanty-e1-'));
for (const p of PLIKI) copyFileSync(join(KORZEN, p), join(dir, p.split('/').pop()));
let zle = 0;
for (const [plik, lista] of Object.entries(M)) {
  const oryg = readFileSync(`${dir}/${plik}`, 'utf8');
  for (const [a, b] of lista) {
    if (!oryg.includes(a)) { zle++; console.log('BRAK WZORCA', plik, JSON.stringify(a)); continue; }
    writeFileSync(`${dir}/${plik}`, oryg.replace(a, b));
    let kod = 0; try { execFileSync('node', [`${dir}/${testy[plik]}`], { stdio: 'pipe' }); } catch (e) { kod = e.status; }
    if (!kod) zle++;
    console.log(kod ? 'ZABITY ' : 'PRZEŻYŁ', plik, JSON.stringify(a).slice(0, 60), '→', JSON.stringify(b).slice(0, 60));
  }
  writeFileSync(`${dir}/${plik}`, oryg);
}
rmSync(dir, { recursive: true, force: true });
const ile = Object.values(M).flat().length;
console.log(`mutanty-e1: ${ile - zle}/${ile} zabitych${zle ? `, problemów: ${zle}` : ''}`);
process.exit(zle ? 1 : 0);
