#!/usr/bin/env node
// Generator cloudkit/schemat.ckdb (moduly.md „Kontrakt partii 7” → „Schemat CloudKit”; ADR-0005, P-091): z docs/architektura/icloud-tabele.json
// (tabele synchronizowane, typ rekordu, `pomin`, `zasob`) i docs/architektura/schemat.sql (kolumny i typy przez SQLite w pamięci).
// Każda kolumna poza `pomin` = pole; zasób pliku = pole `dane` typu ASSET. Zmiany w CloudKit tylko dodające; wgranie do Development
// i wdrożenie do Production to krok właściciela (P-217). Składnia jak eksport `cktool export-schema` [DO USTALENIA: `cktool validate-schema` w oknie maszyn].
// Drugi wynik: modules/oczko-icloud/Pakiet/Sources/OczkoIcloudLogika/Pola.swift (typ rekordu i pola DOUBLE/ASSET dla odwzorowania w Swift; tylko gdy moduł istnieje).
// Użycie: node scripts/icloud/generuj-schemat-ckdb.mjs [--check | --stdout]   (bez opcji: zapis plików)
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const KORZEN = join(dirname(fileURLToPath(import.meta.url)), '../..');
const CEL = join(KORZEN, 'cloudkit/schemat.ckdb');
const SWIFT = join(KORZEN, 'modules/oczko-icloud/Pakiet/Sources/OczkoIcloudLogika/Pola.swift');
const kontrakt = JSON.parse(readFileSync(join(KORZEN, 'docs/architektura/icloud-tabele.json'), 'utf8'));
const db = new DatabaseSync(':memory:');
db.exec(readFileSync(join(KORZEN, 'docs/architektura/schemat.sql'), 'utf8'));

/** Typ kolumny SQLite (STRICT) → typ pola CloudKit. */
function typPola(t) {
  const u = t.toUpperCase();
  if (u === 'TEXT') return 'STRING';
  if (u === 'INTEGER') return 'INT64';
  if (u === 'REAL') return 'DOUBLE';
  if (u === 'BLOB') return 'BYTES';
  throw new Error(`generuj-schemat-ckdb: nieznany typ kolumny ${t}`); // nowy typ = decyzja, nie zgadywanie
}
const SYSTEMOWE = [
  ['"___createTime"', 'TIMESTAMP'], ['"___createdBy"', 'REFERENCE'], ['"___etag"', 'STRING'], ['"___modTime"', 'TIMESTAMP'],
  ['"___modifiedBy"', 'REFERENCE'], ['"___recordID"', 'REFERENCE QUERYABLE'],
];
const wiersze = ['DEFINE SCHEMA', ''];
const swift = [
  '// Wygenerowane: node scripts/icloud/generuj-schemat-ckdb.mjs — nie edytować (źródło: docs/architektura/icloud-tabele.json, schemat.sql).',
  '// Typ rekordu CloudKit dla encji i pola zapisywane jako Double (REAL); reszta liczb INT64, tekst STRING, zasób pliku `dane` (ASSET).',
  '',
  'enum Pola {',
];
const typy = [], double = [];
for (const t of kontrakt.tabele) {
  const kolumny = db.prepare(`SELECT name, type FROM pragma_table_info('${t.tabela}')`).all();
  if (!kolumny.length) throw new Error(`generuj-schemat-ckdb: brak tabeli ${t.tabela} w schemat.sql`);
  const pola = kolumny.filter((k) => !(t.pomin ?? []).includes(k.name)).map((k) => [k.name, typPola(k.type)]);
  if (t.zasob) pola.push(['dane', 'ASSET']);
  typy.push(`    "${t.tabela}": "${t.typ}",`);
  const d = pola.filter(([, typ]) => typ === 'DOUBLE').map(([n]) => `"${n}"`);
  if (d.length) double.push(`    "${t.tabela}": [${d.join(', ')}],`);
  const szer = Math.max(...[...SYSTEMOWE, ...pola].map(([n]) => n.length));
  wiersze.push(`    RECORD TYPE ${t.typ} (`);
  for (const [n, typ] of [...SYSTEMOWE, ...pola]) wiersze.push(`        ${n.padEnd(szer)} ${typ},`);
  wiersze.push('        GRANT WRITE TO "_creator",', '        GRANT CREATE TO "_icloud",', '        GRANT READ TO "_world"', '    );', '');
}
const tekst = wiersze.join('\n');
swift.push('  static let typ: [String: String] = [', ...typy, '  ]', '  static let double: [String: Set<String>] = [', ...double, '  ]', '  static let zasob = "dane"', '}', '');
const tekstSwift = swift.join('\n');
const zModulem = existsSync(dirname(SWIFT));

const arg = process.argv[2];
if (arg === '--stdout') process.stdout.write(tekst);
else if (arg === '--check') {
  let jest = null;
  try { jest = readFileSync(CEL, 'utf8'); } catch { /* brak pliku */ }
  if (jest !== tekst) { console.error('cloudkit/schemat.ckdb nieaktualny — uruchom: node scripts/icloud/generuj-schemat-ckdb.mjs'); process.exit(1); }
  if (zModulem && (!existsSync(SWIFT) || readFileSync(SWIFT, 'utf8') !== tekstSwift)) { console.error('Pola.swift nieaktualny — uruchom generator'); process.exit(1); }
} else {
  mkdirSync(dirname(CEL), { recursive: true });
  writeFileSync(CEL, tekst);
  if (zModulem) writeFileSync(SWIFT, tekstSwift);
  console.log(`zapisano ${CEL} (${kontrakt.tabele.length} typów rekordów)`);
}
