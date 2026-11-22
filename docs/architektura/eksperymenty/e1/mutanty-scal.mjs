// mutanty-scal.mjs — generuje mutanty prototypu scal.mjs przy każdym uruchomieniu (fix 05 2026-10-25, Z07-13; zastępuje statyczną
// kopię mutant/) i uruchamia na każdym scal-test.mjs. Mutant przeżywa, gdy test kończy się kodem 0. Kod wyjścia 1, gdy którykolwiek przeżył
// albo gdy mutacja nie trafia w kod (wzorzec nieaktualny = test mutacji nic nie sprawdza).
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path'; import { tmpdir } from 'node:os'; import { fileURLToPath } from 'node:url'; import { spawnSync } from 'node:child_process';
const tu = dirname(fileURLToPath(import.meta.url)); const zrodlo = readFileSync(join(tu, 'scal.mjs'), 'utf8');
const MUTACJE = [
  ['suma gałęzi zamiast konfliktu', "return { stan: 'konflikt', glowy, kandydaci: glowy.map((g) => ({ glowa: g, wartosc: wartosc.get(g) })) };", "return { stan: 'zgodny', wartosc: glowy.reduce((s, g) => s + wartosc.get(g), 0), glowy };"],
  // „ostatni rodzic zamiast pierwszego” (Z07-13) jest od fix 2026-10-25 mutantem równoważnym: zmiana inna niż rozstrzygnięcie ma
  // najwyżej jednego rodzica (inaczej błąd `wiele_rodzicow`, M-09), więc rodzice[0] = rodzice[length − 1]. Zastępuje go mutant kontroli M-09.
  ['cofnięcie nie ustawia wartości', "new Set(['wpisanie', 'cofniecie', 'rozstrzygniecie'])", "new Set(['wpisanie', 'rozstrzygniecie'])"],
  ['−1 poniżej zera', 'w = Math.max(0, (z.rodzice', 'w = ((z.rodzice'],
  ['bez stanu czeka', 'if (brakujacy.size) return', 'if (false) return'],
  ['bez kontroli kolizji id', "if (kolizje.length) return", 'if (false) return'],
  ['bez kontroli wartości (W1)', 'if (zle.length) return', 'if (false) return'],
  ['ujemna wartość ustawienia przechodzi (W1)', 'z.wartosc >= 0', 'z.wartosc >= -1'],
  ['bez kontroli wielu rodziców', "if (wiele.length) return", 'if (false) return'],
  ['bez kontroli cyklu', 'if (kolejka.length < wszystkie.length) return', 'if (false) return'],
  ['bez kontroli rodzaju', 'if (nieznane.length) return', 'if (false) return'],
  ['jedna głowa jako konflikt', 'if (glowy.length <= 1)', 'if (glowy.length < 1)'],
  ['zerowanie jako −1', "else if (z.rodzaj === 'zerowanie') w = 0;", ''],
];
const kat = mkdtempSync(join(tmpdir(), 'mutanty-scal-')); let przezylo = 0, nietrafione = 0;
for (const [nazwa, z, na] of MUTACJE) {
  if (!zrodlo.includes(z)) { console.log(`NIETRAFIONY  ${nazwa}`); nietrafione++; continue; }
  const plik = join(kat, `m${MUTACJE.findIndex((m) => m[0] === nazwa)}.mjs`); writeFileSync(plik, zrodlo.replace(z, na));
  const r = spawnSync(process.execPath, [join(tu, 'scal-test.mjs')], { env: { ...process.env, SCAL_MODUL: plik }, encoding: 'utf8' });
  const wynik = (r.stdout.trim().split('\n').pop() ?? '');
  console.log(`${r.status === 0 ? 'PRZEŻYŁ   ' : 'zabity    '} ${nazwa} (scal-test ${wynik})`); if (r.status === 0) przezylo++;
}
rmSync(kat, { recursive: true, force: true });
console.log(`mutanty: ${MUTACJE.length - nietrafione - przezylo} zabitych, ${przezylo} przeżyło, ${nietrafione} nietrafionych z ${MUTACJE.length}`);
process.exit(przezylo || nietrafione ? 1 : 0);
