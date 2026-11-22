// Nazwy aplikacji i serwisów konkurencji w plikach repo (F07-05; P-105, P-107 (2), P-117 Q2a). W publicznym repo są tylko skróty SHA-256
// znormalizowanych nazw (`tests/jakosc/marki-skroty.json`); lista nazw i generator skrótów są w oczko-warsztat (07-jakosc/2026-10-25-fix/marki/).
// Normalizacja: NFKC, małe litery, słowa = ciągi liter i cyfr (\p{L}\p{N}), nazwa = 1–N kolejnych słów złączonych spacją.
// Zapadka (P-107 (1): sprzątanie `docs/` przed zgłoszeniem do Apple): `tests/jakosc/marki-stan.json` = plik → liczba trafień. Nowy plik z trafieniem
// albo wzrost liczby = naruszenie; spadek też (stan zmniejsza się w tym samym commicie: --stan). Kod, teksty aplikacji i metadane: zawsze 0.
// Użycie: node scripts/jakosc/marki.mjs [--katalog <korzeń>] [--stan]   (kod 0 = zgodne ze stanem, 1 = naruszenia; --stan zapisuje bieżący stan)
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

export const SKROTY = 'tests/jakosc/marki-skroty.json';
export const STAN = 'tests/jakosc/marki-stan.json';
const TEKST = /\.(ts|tsx|js|mjs|cjs|json|md|ya?ml|html|txt|swift|strings|csv)$/i;
// P-107: „w kodzie, tekstach aplikacji i metadanych — brak”; tu stan musi być 0, zapadka nie dopuszcza wyjątku.
export const ZAWSZE_ZERO = /^(src|app|modules|targets|site|e2e|assets)\/|^app\.json$|^package\.json$/;
const POMIN = new Set([SKROTY, STAN]);

export const skrot = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);
export const slowa = (tekst) => tekst.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

/** Liczba trafień w tekście: od każdego słowa najdłuższa pasująca nazwa, potem skok za nią (nazwa w nazwie liczy się raz). */
export function trafienia(tekst, { pierwsze, nazwy, maxSlow }, pamiec = new Map()) {
  const s = slowa(tekst);
  const h = (x) => { let v = pamiec.get(x); if (v === undefined) pamiec.set(x, v = skrot(x)); return v; };
  let ile = 0;
  for (let i = 0; i < s.length; i++) {
    if (!pierwsze.has(h(s[i]))) continue;
    for (let n = Math.min(maxSlow, s.length - i); n >= 1; n--) {
      if (nazwy.has(n === 1 ? h(s[i]) : skrot(s.slice(i, i + n).join(' ')))) { ile++; i += n - 1; break; }
    }
  }
  return ile;
}

export function wczytajSkroty(korzen) {
  const j = JSON.parse(readFileSync(join(korzen, SKROTY), 'utf8'));
  return { pierwsze: new Set(j.pierwsze), nazwy: new Set(j.nazwy), maxSlow: j.maxSlow, liczba: j.nazwy.length };
}

function pliki(korzen) {
  let lista;
  try { lista = execFileSync('git', ['ls-files'], { cwd: korzen, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\n').filter(Boolean); } catch { lista = null; }
  if (!lista) {
    lista = [];
    (function skan(d) { for (const n of readdirSync(d)) { if (n === 'node_modules' || n === '.git') continue; const p = join(d, n); if (statSync(p).isDirectory()) skan(p); else lista.push(relative(korzen, p).split(sep).join('/')); } })(korzen);
  }
  return lista.filter((r) => TEKST.test(r) && !POMIN.has(r) && existsSync(join(korzen, r)));
}

export function policz(korzen) {
  const sk = wczytajSkroty(korzen), pamiec = new Map(), wynik = {};
  for (const r of pliki(korzen)) { const n = trafienia(readFileSync(join(korzen, r), 'utf8'), sk, pamiec); if (n) wynik[r] = n; }
  return wynik;
}

export function porownaj(biezacy, stan) {
  const naruszenia = [];
  for (const [r, n] of Object.entries(biezacy)) {
    if (ZAWSZE_ZERO.test(r)) naruszenia.push(`MARKA-W-PRODUKCIE ${r}: ${n} — nazwy konkurencji w kodzie, tekstach aplikacji i metadanych zabronione (P-107)`);
    else if (!(r in stan)) naruszenia.push(`MARKA-NOWY-PLIK ${r}: ${n} — nowy dokument bez nazw konkurencji (P-107 (3)); opis zamiast nazwy, cytat w oczko-warsztat`);
    else if (n > stan[r]) naruszenia.push(`MARKA-WZROST ${r}: ${stan[r]} → ${n} (P-107 (3))`);
  }
  for (const [r, n] of Object.entries(stan)) {
    const b = biezacy[r] ?? 0;
    if (b < n) naruszenia.push(`MARKA-STAN-DO-ZMNIEJSZENIA ${r}: ${n} → ${b} — uruchom: node scripts/jakosc/marki.mjs --stan`);
    if (ZAWSZE_ZERO.test(r)) naruszenia.push(`MARKA-W-PRODUKCIE ${r} w stanie — kod i metadane nie mają wyjątku`);
  }
  return naruszenia;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const i = process.argv.indexOf('--katalog');
  const korzen = i > 0 ? process.argv[i + 1] : process.cwd();
  const biezacy = policz(korzen);
  const suma = Object.values(biezacy).reduce((a, b) => a + b, 0);
  if (process.argv.includes('--stan')) {
    const posort = Object.fromEntries(Object.entries(biezacy).sort(([a], [b]) => a.localeCompare(b)));
    writeFileSync(join(korzen, STAN), JSON.stringify({ _opis: 'Zapadka nazw konkurencji (scripts/jakosc/marki.mjs, P-107, P-117 Q2a): plik → liczba trafień; tylko maleje. Cel: {} przed zgłoszeniem do Apple.', pliki: posort }, null, 1) + '\n');
    console.log(`marki: stan zapisany — ${Object.keys(biezacy).length} plików, ${suma} trafień`);
    process.exit(0);
  }
  const stan = existsSync(join(korzen, STAN)) ? JSON.parse(readFileSync(join(korzen, STAN), 'utf8')).pliki : {};
  const naruszenia = porownaj(biezacy, stan);
  for (const n of naruszenia) console.log(n);
  console.log(`marki: ${Object.keys(biezacy).length} plików, ${suma} trafień; naruszeń ${naruszenia.length}`);
  process.exit(naruszenia.length ? 1 : 0);
}
