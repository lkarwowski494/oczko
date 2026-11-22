// Raport testów akceptacyjnych przed kodem (DS-02, zasada roli 07 nr 3): każdy test oczekujący ładuje się i pada
// na znaczniku `NIEZAIMPLEMENTOWANE:` albo na asercji; nigdy na imporcie, składni ani typie. Test zielony przed kodem
// jest błędem (nie może paść), chyba że ma w nazwie `[ZIELONY-OK: powód]` (np. kontrola, która już działa).
// Użycie: node scripts/jakosc/akceptacja-raport.mjs [--wynik plik.md] [--json plik.json] [--katalog tests/akceptacja]  (kod 0 = wszystko czerwone z właściwego powodu)
// Pusty zbiór (F07-16, P-198 Q2a): zaliczenie tylko, gdy w katalogu nie ma żadnego pliku *.test.* (wszystkie kryteria przeniesione przez 08);
// pliki są, a Jest nic nie zebrał (zła konfiguracja testMatch) albo plik bez testów → błąd.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
let wejscie = arg('--json');
if (!wejscie) {
  wejscie = join(mkdtempSync(join(tmpdir(), 'akceptacja-')), 'wynik.json');
  spawnSync('npx', ['jest', '-c', 'jest.akceptacja.config.js', '--json', '--outputFile', wejscie, '--silent'], { stdio: 'ignore' });
}
const raport = JSON.parse(readFileSync(wejscie, 'utf8'));
export const ID = /\b(BR-[A-Z]{3}-\d{3}|NFR-[A-Z]{3}-\d{3}|KP-\d{2}|RD-\d{2}|P-\d{3}|R-\d{3}|TT-\d{2}|ER-\d{2}|Z07-\d{2}|PR-\d{2}|L-\d{2}|W-\d{2}|M-\d{2})\b/;
export function powodCzerwieni(komunikat) {
  if (/NIEZAIMPLEMENTOWANE:/.test(komunikat)) return 'znacznik';
  if (/Cannot find module|SyntaxError|is not a function|is not defined|is not a constructor|TS\d{4}|Unexpected token/.test(komunikat)) return 'zly';
  if (/expect\(|toBe|toEqual|toStrictEqual|toThrow|Expected|Received|Unable to find an element|Found multiple elements|toHaveAccessibleName|toHaveBeenCalled/.test(komunikat)) return 'asercja';
  return 'zly';
}
const wiersze = [], bledy = [];
for (const plik of raport.testResults) {
  const rel = plik.name.replace(process.cwd() + '/', '');
  if (plik.status === 'failed' && plik.assertionResults.length === 0) { bledy.push(`${rel}: zestaw się nie załadował — ${plik.message.split('\n').find((l) => l.trim()) ?? ''}`); continue; }
  for (const t of plik.assertionResults) {
    const nazwa = [...t.ancestorTitles, t.title].join(' › ');
    const komunikat = (t.failureMessages ?? []).join('\n');
    let stan;
    if (t.status === 'passed') stan = /\[ZIELONY-OK: [^\]]+\]/.test(nazwa) ? 'zielony-ok' : 'zielony-przed-kodem';
    else if (t.status === 'failed') stan = powodCzerwieni(komunikat);
    else stan = t.status; // pending, todo
    const fragment = (komunikat.split('\n').find((l) => /NIEZAIMPLEMENTOWANE|Expected|expect\(/.test(l)) ?? '').trim().slice(0, 140);
    if (!ID.test(nazwa)) bledy.push(`${rel}: test bez ID kryterium w nazwie — ${nazwa}`);
    if (stan === 'zly' || stan === 'zielony-przed-kodem' || stan === 'pending' || stan === 'todo') bledy.push(`${rel}: ${stan} — ${nazwa}${fragment ? ` (${fragment})` : ''}`);
    wiersze.push({ plik: rel, nazwa, stan, fragment });
  }
}
const liczby = wiersze.reduce((a, w) => ({ ...a, [w.stan]: (a[w.stan] ?? 0) + 1 }), {});
const wynik = arg('--wynik');
if (wynik) {
  const md = [`# Testy akceptacyjne: stan przed kodem`, `Wygenerowano: ${new Date().toISOString()} · \`node scripts/jakosc/akceptacja-raport.mjs\``, '',
    `Razem ${wiersze.length}: ` + Object.entries(liczby).map(([k, v]) => `${k} ${v}`).join(', ') + `; błędy raportu: ${bledy.length}.`, '',
    '| Plik | Test | Stan | Fragment wyniku |', '|---|---|---|---|',
    ...wiersze.map((w) => `| ${w.plik} | ${w.nazwa.replace(/\|/g, '\\|')} | ${w.stan} | ${w.fragment.replace(/\|/g, '\\|')} |`)];
  mkdirSync(dirname(wynik), { recursive: true });
  writeFileSync(wynik, md.join('\n') + '\n');
}
console.log(`testy: ${wiersze.length}; ` + Object.entries(liczby).map(([k, v]) => `${k}: ${v}`).join(', '));
for (const b of bledy) console.log('BŁĄD ' + b);
const katalog = arg('--katalog') ?? 'tests/akceptacja';
const plikiTestow = existsSync(katalog) ? readdirSync(katalog, { recursive: true }).map(String).filter((f) => /\.test\.[jt]sx?$/.test(f)) : [];
const pustyOk = wiersze.length === 0 && raport.testResults.length === 0 && plikiTestow.length === 0;
if (pustyOk) console.log(`brak testów oczekujących: ${katalog} bez plików *.test.* (kryteria przeniesione do głównego zestawu)`);
else if (wiersze.length === 0) console.log(`BŁĄD brak testów akceptacyjnych przy ${plikiTestow.length} plikach testów w ${katalog} i ${raport.testResults.length} zestawach w wyniku Jest (pusty zbiór to nie zaliczenie)`);
process.exit(bledy.length || (wiersze.length === 0 && !pustyOk) ? 1 : 0);
