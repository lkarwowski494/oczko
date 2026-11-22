// mutanty-schematu.mjs — kontrola negatywna sprawdz-schemat.mjs (fix 05 2026-10-25, Z07-15): każda mutacja schemat.sql albo stany.json
// w katalogu tymczasowym musi dać kod ≠ 0. Mutant „przeżywa”, gdy sprawdz-schemat mówi „OK”. Mutacja, która nie trafia w plik = błąd (wzorzec nieaktualny).
import { readFileSync, writeFileSync, mkdtempSync, rmSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path'; import { tmpdir } from 'node:os'; import { fileURLToPath } from 'node:url'; import { spawnSync } from 'node:child_process';
const arch = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MUTACJE = [
  ['bez indeksu zdarzenie_dzien (plan idzie innym indeksem, Z07-15)', 'schemat.sql', 'CREATE INDEX zdarzenie_dzien ON zdarzenie(dzien, licznik_id);', ''],
  ['bez indeksu wloczka_kategoria', 'schemat.sql', 'CREATE INDEX wloczka_kategoria ON wloczka(kategoria, nazwa COLLATE NOCASE) WHERE usunieto_ms IS NULL;', ''],
  ['lista CHECK bez wpisu w stany.json (wzor.zrodlo usunięte ze stany.json, Z07-15)', 'stany.json', '  "wzor.zrodlo": ["pdf", "obraz", "www", "word"],\n', ''],
  ['stan w stany.json spoza CHECK (sesja.stan + anulowana)', 'stany.json', '"sesja.stan": ["trwa", "wstrzymana", "zakonczona"]', '"sesja.stan": ["trwa", "wstrzymana", "zakonczona", "anulowana"]'],
  ['stan w CHECK spoza stany.json (sesja.stan + anulowana tylko w schemacie)', 'schemat.sql', "stan TEXT NOT NULL CHECK (stan IN ('trwa', 'wstrzymana', 'zakonczona'))", "stan TEXT NOT NULL CHECK (stan IN ('trwa', 'wstrzymana', 'zakonczona', 'anulowana'))"],
  ['zdarzenie bez ON DELETE CASCADE', 'schemat.sql', 'licznik_id TEXT NOT NULL REFERENCES licznik(id) ON DELETE CASCADE,\n  rodzaj TEXT NOT NULL CHECK (rodzaj IN (\'plus\'', 'licznik_id TEXT NOT NULL REFERENCES licznik(id),\n  rodzaj TEXT NOT NULL CHECK (rodzaj IN (\'plus\''],
  ['poczekalnia z kluczem obcym do licznika', 'schemat.sql', "  id TEXT PRIMARY KEY NOT NULL,                                     -- id rekordu (zdarzenia albo encji)", "  id TEXT PRIMARY KEY NOT NULL, licznik_id TEXT REFERENCES licznik(id), -- id rekordu (zdarzenia albo encji)"],
];
let przezylo = 0, nietrafione = 0;
for (const [nazwa, plik, z, na] of MUTACJE) {
  const kat = mkdtempSync(join(tmpdir(), 'mut-schemat-'));
  for (const f of ['schemat.sql', 'stany.json', 'dane.md']) copyFileSync(join(arch, f), join(kat, f));
  const tekst = readFileSync(join(kat, plik), 'utf8');
  if (!tekst.includes(z)) { console.log(`NIETRAFIONY  ${nazwa}`); nietrafione++; rmSync(kat, { recursive: true }); continue; }
  writeFileSync(join(kat, plik), tekst.replace(z, na));
  const r = spawnSync(process.execPath, ['--no-warnings', join(arch, 'narzedzia', 'sprawdz-schemat.mjs'), kat], { encoding: 'utf8' });
  const bledy = (r.stdout.match(/^BŁĄD .*/gm) ?? []).map((b) => b.slice(5, 90));
  console.log(`${r.status === 0 ? 'PRZEŻYŁ   ' : 'zabity    '} ${nazwa}${r.status === 0 ? '' : ` — ${bledy[0] ?? (r.stderr.split('\n').find((l) => l.startsWith('Error')) ?? 'wyjątek')}`}`);
  if (r.status === 0) przezylo++;
  rmSync(kat, { recursive: true, force: true });
}
console.log(`mutanty schematu: ${MUTACJE.length - przezylo - nietrafione} zabitych, ${przezylo} przeżyło, ${nietrafione} nietrafionych z ${MUTACJE.length}`);
process.exit(przezylo || nietrafione ? 1 : 0);
