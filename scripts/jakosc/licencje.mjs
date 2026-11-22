// Kontrola licencji drzewa zależności produkcyjnych (F07-09, P-117 Q6a; zastępuje scripts/licenses.mjs z 0.1.0, który zapisywał
// nieistniejący src/core/licenses.generated.ts i nie był nigdzie wołany). Bez pliku generowanego: tylko sprawdzenie.
// Reguły: każda licencja (po wyborze permisywnej z „A OR B”, wszystkie części „A AND B”) z listy DOZWOLONE; inaczej kod 1.
// Wyjątek nazwany: MPL-2.0 dla lightningcss* (narzędzie budowania CSS ciągnięte przez expo, poza pakietem aplikacji iOS) — do potwierdzenia przez 05.
// Użycie: node scripts/jakosc/licencje.mjs [--katalog <korzeń>]   (kod 0 = wszystkie dozwolone, 1 = naruszenia, 2 = brak package-lock.json)
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
export const DOZWOLONE = new Set(['MIT', 'ISC', '0BSD', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', 'BSL-1.0', 'OFL-1.1', 'CC0-1.0', 'CC-BY-4.0', 'Unlicense', 'BlueOak-1.0.0', 'Python-2.0', 'blessing']);
export const WYJATKI = [{ licencja: 'MPL-2.0', pakiet: /^lightningcss(-[\w-]+)?$/, powod: 'narzędzie budowania CSS (expo), poza pakietem iOS; do potwierdzenia przez 05' }];

/** Graf zależności produkcyjnych z package-lock.json (jak Node: najbliższy node_modules w górę, bez dev). Zwraca { P, widziane: Map<klucz, wpis> } albo null bez locka (M1-245: wspólne dla kontroli i generatora). */
export function grafProdukcyjny(korzen) {
  const lockPlik = join(korzen, 'package-lock.json');
  if (!existsSync(lockPlik)) return null;
  const P = JSON.parse(readFileSync(lockPlik, 'utf8')).packages ?? {};
  const znajdz = (od, dep) => { // rozwiązywanie jak Node: najbliższy node_modules w górę, tylko pakiety produkcyjne
    for (let p = od; ; ) {
      const k = (p ? p + '/' : '') + 'node_modules/' + dep;
      if (P[k] && !P[k].dev && !P[k].devOptional) return k;
      if (!p) return null;
      const i = p.lastIndexOf('/node_modules/');
      p = i < 0 ? '' : p.slice(0, i);
    }
  };
  const widziane = new Map();
  const kolejka = Object.keys(P['']?.dependencies ?? {}).map((d) => znajdz('', d)).filter(Boolean);
  while (kolejka.length) {
    const k = kolejka.pop();
    if (widziane.has(k)) continue;
    const e = P[k];
    widziane.set(k, e);
    for (const d of Object.keys({ ...e.dependencies, ...e.optionalDependencies, ...e.peerDependencies })) {
      if (e.peerDependenciesMeta?.[d]?.optional && !e.dependencies?.[d] && !e.optionalDependencies?.[d]) continue;
      const r = znajdz(k, d);
      if (r && !widziane.has(r)) kolejka.push(r);
    }
  }
  return { P, widziane };
}

export function sprawdzLicencje(korzen) {
  const graf = grafProdukcyjny(korzen);
  if (!graf) return null;
  const { widziane } = graf;
  const naruszenia = [], wyjatki = [];
  for (const [k, e] of widziane) {
    const nazwa = k.slice(k.lastIndexOf('node_modules/') + 'node_modules/'.length);
    let pj = null;
    try { pj = JSON.parse(readFileSync(join(korzen, k, 'package.json'), 'utf8')); } catch { /* licencja z package-lock.json */ }
    const surowa = e.license ?? (typeof pj?.license === 'string' ? pj.license : Array.isArray(pj?.licenses) ? pj.licenses.map((x) => x.type ?? x).join(' OR ') : 'UNKNOWN');
    const czesci = surowa.replace(/[()]/g, '').split(/\s+OR\s+/).map((c) => c.split(/\s+AND\s+/).map((x) => x.trim()));
    if (czesci.some((c) => c.every((x) => DOZWOLONE.has(x)))) continue;
    const w = WYJATKI.find((x) => x.pakiet.test(nazwa) && surowa === x.licencja);
    if (w) { wyjatki.push(`${nazwa}@${e.version} ${surowa}`); continue; }
    naruszenia.push(`LICENCJA ${nazwa}@${e.version ?? pj?.version ?? '?'}: ${surowa} — spoza listy dozwolonych (scripts/jakosc/licencje.mjs)`);
  }
  return { pakiety: widziane.size, naruszenia, wyjatki };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const korzen = arg('--katalog') ?? process.cwd();
  const w = sprawdzLicencje(korzen);
  if (!w) { console.log(`BŁĄD ${korzen}: brak package-lock.json`); process.exit(2); }
  for (const n of w.naruszenia) console.log(n);
  console.log(`licencje: ${w.pakiety} pakietów produkcyjnych, naruszeń ${w.naruszenia.length}, wyjątków nazwanych ${w.wyjatki.length}`);
  process.exit(w.naruszenia.length ? 1 : 0);
}
