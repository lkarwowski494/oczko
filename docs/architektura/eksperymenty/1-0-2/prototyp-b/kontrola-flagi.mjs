// Kontrola PB1: flaga prototypu OCZKO_PROTOTYP_B (a) występuje w workflowach tylko w prototyp-b.yml, (b) w źródłach tylko pod `#if OCZKO_PROTOTYP_B`
// (plik PrototypB.swift w całości), (c) nie występuje w src/, app/, e2e/, app.json, package.json ani w testflight.yml / jakosc-ios.yml.
// Użycie: node kontrola-flagi.mjs (z korzenia repo). Kod wyjścia ≠ 0 = naruszenie.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const FLAGA = 'OCZKO_PROTOTYP_B';
const blad = [];
const pliki = (kat) => readdirSync(kat).flatMap((n) => { const p = join(kat, n); return statSync(p).isDirectory() ? (n === 'node_modules' || n === '.git' ? [] : pliki(p)) : [p]; });
for (const kat of ['src', 'app', 'e2e', 'assets', 'plugins', 'targets', 'modules', '.github/workflows']) {
  let lista = []; try { lista = pliki(kat); } catch { continue; }
  for (const p of lista) {
    if (!/\.(swift|ts|tsx|js|mjs|json|ya?ml|md|sh|podspec|rb)$/.test(p)) continue;
    const t = readFileSync(p, 'utf8');
    if (!t.includes(FLAGA)) continue;
    if (kat === '.github/workflows') { if (!p.endsWith('prototyp-b.yml')) blad.push(`${p}: flaga poza prototyp-b.yml`); continue; }
    if (!p.endsWith('.swift')) { blad.push(`${p}: flaga w pliku innym niż Swift`); continue; }
    if (p.endsWith('/PrototypB.swift')) { if (!t.trimStart().split('\n').find((l) => !l.startsWith('//'))?.startsWith(`#if ${FLAGA}`) || !t.trimEnd().endsWith('#endif')) blad.push(`${p}: plik nie jest w całości pod #if`); continue; }
    // Każde użycie poza PrototypB.swift ma stać w bloku #if … #endif z flagą.
    let wBloku = 0; const linie = t.split('\n');
    for (const [i, l] of linie.entries()) {
      if (new RegExp(`^\\s*#if ${FLAGA}\\b`).test(l)) wBloku++;
      else if (wBloku && /^\s*#endif\b/.test(l)) wBloku--;
      else if (!wBloku && /PrototypB|ZnacznikPrototypuB/.test(l) && !l.trim().startsWith('//')) blad.push(`${p}:${i + 1}: odwołanie do prototypu poza #if ${FLAGA}`);
    }
  }
}
for (const p of ['app.json', 'package.json', '.github/workflows/testflight.yml', '.github/workflows/jakosc-ios.yml']) {
  try { if (readFileSync(p, 'utf8').includes(FLAGA)) blad.push(`${p}: flaga niedozwolona`); } catch { /* brak pliku */ }
}
if (blad.length) { console.log(blad.join('\n')); process.exit(1); }
console.log(`OK: ${FLAGA} tylko w prototyp-b.yml i pod #if w źródłach Swift`);
