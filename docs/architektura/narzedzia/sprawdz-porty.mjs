// sprawdz-porty.mjs — kontrakt portów (Z07-22): blok ```ts w sekcji „Porty domeny” w docs/architektura/moduly.md
// jest równy deklaracjom w src/domena/porty.ts (bez komentarzy na początku pliku i importów). Kod wyjścia 1 przy rozjeździe.
// Użycie: node docs/architektura/narzedzia/sprawdz-porty.mjs [moduly.md] [porty.ts]
import { readFileSync } from 'node:fs';
const [md = 'docs/architektura/moduly.md', ts = 'src/domena/porty.ts'] = process.argv.slice(2);
const tekst = readFileSync(md, 'utf8');
const sekcja = tekst.split(/^## /m).find((s) => s.startsWith('Porty domeny'));
const blok = sekcja?.match(/```ts\n([\s\S]*?)```/)?.[1];
const bledy = [];
if (!blok) bledy.push(`${md}: brak bloku \`\`\`ts w sekcji „Porty domeny”`);
const deklaracje = (s) => s.split('\n').filter((l) => !/^\s*(\/\/|import )/.test(l)).map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
const z = (s) => new Set([...s.matchAll(/^export (?:interface|type) (\w+)/gm)].map((m) => m[1]));
if (blok) {
  const a = deklaracje(blok), b = deklaracje(readFileSync(ts, 'utf8'));
  const na = z(blok), nb = z(readFileSync(ts, 'utf8'));
  for (const n of nb) if (!na.has(n)) bledy.push(`typ ${n} jest w ${ts}, brak w ${md}`);
  for (const n of na) if (!nb.has(n)) bledy.push(`typ ${n} jest w ${md}, brak w ${ts}`);
  if (na.size === 0) bledy.push('0 typów w bloku — kontrola niczego nie sprawdza');
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) if (a[i] !== b[i]) { bledy.push(`pierwsza różnica w linii deklaracji ${i + 1}:\n  md: ${a[i]}\n  ts: ${b[i]}`); break; }
  if (!bledy.length) console.log(`OK: ${na.size} typów, ${a.length} linii deklaracji zgodnych`);
}
for (const b of bledy) console.log('BŁĄD', b);
process.exit(bledy.length ? 1 : 0);
