// Kontrola ADR (definicja ukończenia roli 05): data, status, ≥2 opcje, konsekwencje, potwierdzenie; ADR o przechowywaniu z wariantem bez bazy.
// Użycie: node kontrola-adr.mjs <katalog> [--min N]. Brak katalogu, 0 plików albo mniej niż N ADR = błąd (fix 05 2026-10-25, Z07-16:
// kontrola nie może być zielona na pustym wejściu); numeracja ciągła od 0001 bez luk i powtórzeń.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
const arg = process.argv.slice(2); const dir = arg[0]; const min = Number(arg.includes('--min') ? arg[arg.indexOf('--min') + 1] : 1);
let bledy = 0;
if (!dir || !existsSync(dir)) { console.log(`BŁĄD brak katalogu ADR: ${dir}`); process.exit(1); }
const pliki = readdirSync(dir).filter((f) => /^\d{4}-.*\.md$/.test(f)).sort();
if (pliki.length < Math.max(1, min)) { console.log(`BŁĄD ${pliki.length} ADR w ${dir}, wymagane co najmniej ${Math.max(1, min)}`); bledy++; }
pliki.forEach((f, i) => { if (Number(f.slice(0, 4)) !== i + 1) { console.log(`BŁĄD numeracja: ${f} na pozycji ${i + 1}`); bledy++; } });
for (const f of pliki) {
  const t = readFileSync(`${dir}/${f}`, 'utf8'); const b = [];
  if (!/^Data: \d{4}-\d{2}-\d{2}/m.test(t)) b.push('data');
  if (!/Status: (\*\*)?(proponowana|przyjęta|odrzucona|zastąpiona)/.test(t)) b.push('status');
  const opcje = (t.split('## Opcje: zalety i wady')[1] || '').match(/^### /gm) || [];
  if (opcje.length < 2) b.push(`opcje ${opcje.length}`);
  if (!/^### Konsekwencje/m.test(t)) b.push('konsekwencje');
  if (!/^### Potwierdzenie/m.test(t)) b.push('potwierdzenie');
  if (/przechowywanie/.test(f) && !/JSON|klucz-wartość/.test(t)) b.push('brak wariantu bez relacyjnej bazy');
  console.log(`${f}: ${b.length ? 'BŁĄD ' + b.join(', ') : 'OK'} (opcje: ${opcje.length})`); bledy += b.length;
}
console.log(`ADR: ${pliki.length}, błędy: ${bledy}`); process.exit(bledy ? 1 : 0);
