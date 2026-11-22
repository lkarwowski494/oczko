// Odwołania `plik:linia` w inwentarzu kryteriów (docs/jakosc/e0/kryteria.json i kryteria.md) — F07-20, P-203 Q7a.
// Linię wyznacza treść dokumentu źródłowego, nie zapisany numer: BR-XXX-NNN/Sn → n-ty wiersz „- Scenariusz:” w sekcji „### BR-XXX-NNN”;
// NFR-* → nagłówek „### NFR-…”; KP-nn → pierwszy wiersz tabeli „| KP-nn”; TT-n → nota o zastąpieniu tabeli modelu B (Z07-01; tabela TT-1–TT-9
// już nie istnieje, lista telefonu jest w strategia.md §8). Sekcję szuka najpierw w pliku z inwentarza, potem w docs/brd/*.md (BR przeniesione).
// Treść inwentarza (nowe scenariusze BR po 2026-10-25) zostaje do 07 audit (P-203 Q7a) — narzędzie zmienia tylko numery linii.
// Użycie: node docs/jakosc/narzedzia/linie-kryteriow.mjs [--check | --zapisz] [--korzen <katalog>]   (kod 1: rozjazd przy --check albo ID bez miejsca)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';

const ik = process.argv.indexOf('--korzen');
const KORZEN = ik > 0 ? resolve(process.argv[ik + 1]) : resolve(dirname(new URL(import.meta.url).pathname), '../../..');
const JSON_P = join(KORZEN, 'docs/jakosc/e0/kryteria.json'), MD_P = join(KORZEN, 'docs/jakosc/e0/kryteria.md');
const linie = new Map();
const czytaj = (rel) => { if (!linie.has(rel)) linie.set(rel, readFileSync(join(KORZEN, rel), 'utf8').split('\n')); return linie.get(rel); };
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Numer linii (1…) dla ID w pliku albo null. */
export function znajdz(id, L) {
  const br = /^(BR-[A-Z]{3}-\d{3})\/S(\d+)$/.exec(id);
  if (br) {
    const h = L.findIndex((l) => new RegExp(`^### ${esc(br[1])}\\b`).test(l));
    if (h < 0) return null;
    let n = 0;
    for (let i = h + 1; i < L.length && !/^### /.test(L[i]); i++) if (/^\s+- Scenariusz\b/.test(L[i]) && ++n === Number(br[2])) return i + 1;
    return null;
  }
  if (/^NFR-/.test(id)) { const h = L.findIndex((l) => new RegExp(`^### ${esc(id)}\\b`).test(l)); return h < 0 ? null : h + 1; }
  if (/^KP-\d+$/.test(id)) { const h = L.findIndex((l) => new RegExp(`^\\| ${esc(id)}\\b`).test(l)); return h < 0 ? null : h + 1; }
  if (/^TT-\d$/.test(id)) { const h = L.findIndex((l) => /tabela modelu B \(P-029\) zastąpiona/.test(l)); return h < 0 ? null : h + 1; }
  return null;
}

export function przelicz() {
  const kryteria = JSON.parse(readFileSync(JSON_P, 'utf8'));
  const brd = readdirSync(join(KORZEN, 'docs/brd')).filter((f) => /^wymagania.*\.md$/.test(f)).sort().map((f) => `docs/brd/${f}`);
  const wyniki = [];
  for (const k of kryteria) {
    const [plik, stara] = k.plik.split(':');
    let nowy = null;
    for (const p of [plik, ...brd.filter((x) => x !== plik)]) { const n = znajdz(k.id, czytaj(p)); if (n) { nowy = `${p}:${n}`; break; } }
    wyniki.push({ id: k.id, stary: k.plik, nowy, zmiana: nowy !== null && nowy !== `${plik}:${stara}` });
  }
  return { kryteria, wyniki };
}

function main() {
  const { kryteria, wyniki } = przelicz();
  const brak = wyniki.filter((w) => !w.nowy), zmiany = wyniki.filter((w) => w.zmiana);
  for (const w of brak) console.log(`BŁĄD ${w.id}: brak miejsca w dokumencie źródłowym (było ${w.stary})`);
  if (process.argv.includes('--zapisz')) {
    const wg = new Map(wyniki.map((w) => [w.id, w]));
    // Zmiana tylko pól „plik” w miejscu (format pliku z generatora Pythona zostaje: wcięcie, \u-ucieczki, brak końcowego \n).
    let id = null;
    const json = readFileSync(JSON_P, 'utf8').split('\n').map((l) => {
      const mi = /^\s*"id": "([^"]+)",?$/.exec(l); if (mi) id = mi[1];
      const w = id && wg.get(id); const mp = /^(\s*"plik": ")([^"]*)(".*)$/.exec(l);
      return mp && w && w.zmiana ? mp[1] + w.nowy + mp[3] : l;
    });
    writeFileSync(JSON_P, json.join('\n'));
    const md = readFileSync(MD_P, 'utf8').split('\n').map((l) => {
      const m = /^\| ([A-Z]+-[A-Z0-9/-]+) \|/.exec(l); const w = m && wg.get(m[1]);
      return w && w.zmiana ? l.split(w.stary).join(w.nowy) : l;
    });
    writeFileSync(MD_P, md.join('\n'));
    console.log(`zapisano: ${zmiany.length} zmian z ${wyniki.length}`);
  } else {
    for (const w of zmiany) console.log(`ROZJAZD ${w.id}: ${w.stary} → ${w.nowy}`);
    console.log(`kryteria: ${wyniki.length}, rozjazdów: ${zmiany.length}, bez miejsca: ${brak.length}${zmiany.length ? ' — popraw: node docs/jakosc/narzedzia/linie-kryteriow.mjs --zapisz' : ''}`);
  }
  process.exit(brak.length || (process.argv.includes('--check') && zmiany.length) ? 1 : 0);
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) main();
