// Kompletność inwentarza kryteriów względem BRD (07-jakosc-003, JAK-03): każdy scenariusz „- Scenariusz:” z docs/brd/wymagania*.md ma wpis w
// docs/jakosc/e0/kryteria.json (inwentarz E0) albo w docs/jakosc/e0/kryteria-uzupelnienie.json (scenariusze dopisane w BRD po 2026-10-25).
// Wpis uzupełnienia ma `pokrycie`: {typ:'id-w-tescie', pliki} — ID scenariusza występuje w każdym z plików; {typ:'poziom-br', pliki} — scenariusz
// jest sprawdzany na poziomie reguły BR (ID BR w każdym pliku, scenariuszowego ID w testach jeszcze nie ma); {typ:'poza-zakresem', status} — PÓŹNIEJ/NIE
// w kontrakcie zakresu, test nie jest wymagany. Użycie: node docs/jakosc/narzedzia/kompletnosc-kryteriow.mjs [--korzen <katalog>]   (kod 1: luka)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';

const ik = process.argv.indexOf('--korzen');
const KORZEN = ik > 0 ? resolve(process.argv[ik + 1]) : resolve(dirname(new URL(import.meta.url).pathname), '../../..');
const czytaj = (rel) => readFileSync(join(KORZEN, rel), 'utf8');

/** Identyfikatory scenariuszy BRD w kolejności dokumentu: BR-XXX-NNN/Sn (n-ty wiersz „- Scenariusz” pod nagłówkiem „### BR-…”). */
export function scenariuszeBrd(korzen = KORZEN) {
  const wynik = [];
  const pliki = readdirSync(join(korzen, 'docs/brd')).filter((f) => /^wymagania.*\.md$/.test(f)).sort();
  for (const f of pliki) {
    let br = null, n = 0;
    for (const l of readFileSync(join(korzen, 'docs/brd', f), 'utf8').split('\n')) {
      const h = /^### (BR-[A-Z]{3}-\d{3})\b/.exec(l);
      if (h) { br = h[1]; n = 0; continue; }
      if (/^### /.test(l)) { br = null; continue; }
      if (br && /^\s+- Scenariusz\b/.test(l)) wynik.push(`${br}/S${++n}`);
    }
  }
  return wynik;
}

export function sprawdz() {
  const bledy = [];
  const glowny = new Set(JSON.parse(czytaj('docs/jakosc/e0/kryteria.json')).map((k) => k.id));
  const sciezkaU = 'docs/jakosc/e0/kryteria-uzupelnienie.json';
  const uzup = existsSync(join(KORZEN, sciezkaU)) ? JSON.parse(czytaj(sciezkaU)) : [];
  const mapaU = new Map(uzup.map((k) => [k.id, k]));
  const brd = scenariuszeBrd();
  const brdSet = new Set(brd);
  for (const id of brd) if (!glowny.has(id) && !mapaU.has(id)) bledy.push(`${id}: scenariusz BRD bez wpisu w inwentarzu (kryteria.json ani kryteria-uzupelnienie.json)`);
  for (const k of uzup) {
    if (!brdSet.has(k.id)) { bledy.push(`${k.id}: wpis uzupełnienia bez scenariusza w BRD`); continue; }
    if (glowny.has(k.id)) bledy.push(`${k.id}: wpis w obu plikach inwentarza`);
    const p = k.pokrycie;
    if (!p || !['id-w-tescie', 'poziom-br', 'poza-zakresem'].includes(p.typ)) { bledy.push(`${k.id}: brak albo zły typ pokrycia`); continue; }
    if (p.typ === 'poza-zakresem') { if (!p.status) bledy.push(`${k.id}: poza zakresem bez statusu`); continue; }
    if (!Array.isArray(p.pliki) || !p.pliki.length) { bledy.push(`${k.id}: pokrycie ${p.typ} bez plików`); continue; }
    const szukane = p.typ === 'id-w-tescie' ? new RegExp(`${k.id.replace('/', '\\/')}(?![0-9])`) : new RegExp(`${k.br}\\b`);
    for (const f of p.pliki) {
      if (!existsSync(join(KORZEN, f))) bledy.push(`${k.id}: brak pliku ${f}`);
      else if (!szukane.test(czytaj(f))) bledy.push(`${k.id}: ${f} nie zawiera ${p.typ === 'id-w-tescie' ? k.id : k.br}`);
    }
  }
  return { brd: brd.length, glowny: glowny.size, uzup: uzup.length, bledy };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  const w = sprawdz();
  for (const b of w.bledy) console.log(`BŁĄD ${b}`);
  console.log(`scenariusze BRD: ${w.brd}, inwentarz: ${w.glowny} + uzupełnienie: ${w.uzup}, błędów: ${w.bledy.length}`);
  process.exit(w.bledy.length ? 1 : 0);
}
