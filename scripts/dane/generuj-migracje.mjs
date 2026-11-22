// Kopia migracji SQL jako moduł TS (Metro nie importuje plików .sql): src/dane/migracje/*.sql → src/dane/migracje/sql.ts.
// Ręcznie nie edytować sql.ts; zgodność pilnuje tests/dane/migracje-kopia.test.ts (jak parametry.ts, P-118 S4).
// Użycie: node scripts/dane/generuj-migracje.mjs [--check]
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const KATALOG = join(import.meta.dirname, '../../src/dane/migracje');
/** Usuwa komentarze `--` poza napisami (treść migracji = same instrukcje; komentarze schematu zostają w .sql). */
function bezKomentarzy(sql) {
  let w = '', napis = null;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (napis) { w += c; if (c === napis) napis = null; continue; }
    if (c === "'" || c === '"') { napis = c; w += c; continue; }
    if (c === '-' && sql[i + 1] === '-') { while (i < sql.length && sql[i] !== '\n') i++; w += '\n'; continue; }
    w += c;
  }
  return w.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim()).join('\n') + '\n';
}
export function tresc() {
  const pliki = readdirSync(KATALOG).filter((n) => /^\d{4}\.sql$/.test(n)).sort();
  const wpisy = pliki.map((n) => `  { wersja: ${Number(n.slice(0, 4))}, sql: ${JSON.stringify(bezKomentarzy(readFileSync(join(KATALOG, n), 'utf8')))} },`);
  return `// Wygenerowane: node scripts/dane/generuj-migracje.mjs — nie edytować (źródło: src/dane/migracje/NNNN.sql bez komentarzy; 0001.sql = docs/architektura/schemat.sql v1).\n` +
    `import type { Migracja } from '../../domena/porty';\n\nexport const MIGRACJE: readonly Migracja[] = [\n${wpisy.join('\n')}\n];\n`;
}
const cel = join(KATALOG, 'sql.ts');
if (process.argv.includes('--check')) {
  if (readFileSync(cel, 'utf8') !== tresc()) { console.error('sql.ts nieaktualny: node scripts/dane/generuj-migracje.mjs'); process.exit(1); }
  console.log('sql.ts zgodny');
} else writeFileSync(cel, tresc());
