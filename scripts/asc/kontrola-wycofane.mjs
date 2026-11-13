// Kontrola repo (KO-056): wycofane ścieżki ASC API dla IAP/subskrypcji nie wracają do scripts/asc ani workflowów asc-*.yml.
// Wzorce: scripts/asc/wycofane-endpointy.mjs (źródło Apple i data odczytu w nagłówku tego pliku). Wpięta w `npm run jakosc:kontrole`;
// test: tests/wydanie/asc-iap-v2.test.ts (plik-pułapka). Użycie: node scripts/asc/kontrola-wycofane.mjs [--katalog <korzeń>]  (kod 0 = brak, 1 = naruszenia)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WYCOFANE } from './wycofane-endpointy.mjs';

const i = process.argv.indexOf('--katalog');
const korzen = i > 0 ? process.argv[i + 1] : join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const lista = (d, ok) => (existsSync(join(korzen, d)) ? readdirSync(join(korzen, d)).filter(ok).map(f => `${d}/${f}`) : []);
const pliki = [...lista('scripts/asc', f => /\.(mjs|js|ts)$/.test(f) && f !== 'wycofane-endpointy.mjs' && f !== 'kontrola-wycofane.mjs'), ...lista('.github/workflows', f => /^asc-.*\.ya?ml$/.test(f))];
const naruszenia = [];
for (const p of pliki) readFileSync(join(korzen, p), 'utf8').split('\n').forEach((l, n) => {
  const w = WYCOFANE.find(x => x.re.test(l));
  if (w) naruszenia.push(`WYCOFANY-ENDPOINT ${p}:${n + 1} — zasób wycofany przez Apple (KO-056); zastępstwo: ${w.zastepstwo}`);
});
for (const n of naruszenia) console.log(n);
console.log(naruszenia.length ? `Naruszeń: ${naruszenia.length}` : `OK (${pliki.length} plików)`);
process.exit(naruszenia.length ? 1 : 0);
