#!/usr/bin/env node
// Przekład przez agentów (P-309: bez API, 0 USD). Rola 09, plan-prac 2.3. Wspólne funkcje z przeklad-api.mjs.
//   node scripts/i18n/przeklad-agenci.mjs przygotuj <katalog> <kod…>   — zapisuje <katalog>/zadanie-<kod>.md (system + słownik + pozycje)
//   node scripts/i18n/przeklad-agenci.mjs przyjmij <katalog> <kod…>    — czyta <katalog>/wynik-<kod>.json, kontroluje (parametry, kategorie), zapisuje raport-przekladu/<kod>.json
// Dalej: node scripts/i18n/przeklad-api.mjs --zastosuj (po przeglądzie) → src/i18n/slowniki/<kod>.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { zbierz, budujZadanie, parsuj, doSlownika } from './przeklad-api.mjs';

const [, , tryb, katalog, ...kody] = process.argv;
if (!['przygotuj', 'przyjmij'].includes(tryb) || !katalog || !kody.length) { console.log('Użycie: przeklad-agenci.mjs przygotuj|przyjmij <katalog> <kod…>'); process.exit(2); }
const poz = zbierz(), slownik = JSON.parse(readFileSync('docs/lokalizacja/slownik-terminow.json', 'utf8'));
let kodWyjscia = 0;
for (const k of kody) {
  if (tryb === 'przygotuj') {
    const z = budujZadanie(k, poz, slownik);
    mkdirSync(katalog, { recursive: true });
    writeFileSync(join(katalog, `zadanie-${k}.md`), `${z.system}\n\n${z.messages[0].content}\n`);
    console.log(`${k}: zadanie-${k}.md`);
  } else {
    const p = parsuj(readFileSync(join(katalog, `wynik-${k}.json`), 'utf8'), poz, k);
    mkdirSync('raport-przekladu', { recursive: true });
    writeFileSync(join('raport-przekladu', `${k}.json`), JSON.stringify({ jezyk: k, pozycji: poz.length, przyjete: Object.keys(p.tlumaczenia).length, odrzucone: p.odrzucone, blad: p.blad, slownik: doSlownika(poz, p.tlumaczenia) }, null, 1) + '\n');
    console.log(`${k}: przyjęte ${Object.keys(p.tlumaczenia).length}/${poz.length}, odrzucone ${p.odrzucone.length}${p.blad ? `, błąd: ${p.blad}` : ''}`);
    p.odrzucone.slice(0, 15).forEach((o) => console.log(`  - ${o.klucz}: ${o.powod}`));
    if (p.blad || p.odrzucone.length) kodWyjscia = 1;
  }
}
process.exitCode = kodWyjscia;
