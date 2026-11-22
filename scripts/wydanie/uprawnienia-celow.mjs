#!/usr/bin/env node
// Mapa „nazwa produktu → plik uprawnień” z projektu Xcode po `expo prebuild` (rola 10; P-233): CODE_SIGN_ENTITLEMENTS konfiguracji Release
// każdego celu (PBXNativeTarget). testflight.yml podpisuje ad hoc każdy pakiet z archiwum (Watch/*.app, PlugIns/*.appex, aplikacja)
// plikiem SWOJEGO celu; cel bez wpisu dostaje podpis ad hoc bez uprawnień. Test: tests/wydanie/uprawnienia-celow.test.ts.
// Użycie: node scripts/wydanie/uprawnienia-celow.mjs <ios/X.xcodeproj/project.pbxproj> [--json]
//   wyjście: „<nazwa produktu>\t<ścieżka względem ios/>” na linię (albo obiekt JSON); kod 2 przy złym argumencie.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const bezCudzyslowu = (s) => s.trim().replace(/^"(.*)"$/, '$1');
/** Obiekt `<id> /* … *\/ = { … };` od pozycji startu (nawiasy klamrowe zrównoważone). */
function blok(tekst, id) {
  const start = tekst.search(new RegExp(`\\n\\s*${id}(?: /\\*[^*]*\\*/)? = \\{`));
  if (start < 0) return null;
  let i = tekst.indexOf('{', start), glebokosc = 0;
  for (let j = i; j < tekst.length; j++) {
    if (tekst[j] === '{') glebokosc++;
    else if (tekst[j] === '}' && --glebokosc === 0) return tekst.slice(i, j + 1);
  }
  return null;
}
const pole = (b, klucz) => { const m = new RegExp(`\\b${klucz} = ("[^"]*"|[^;]+);`).exec(b); return m ? bezCudzyslowu(m[1]) : undefined; };

export function mapaUprawnien(tekst) {
  const wynik = {};
  for (const m of tekst.matchAll(/\n\s*([0-9A-Za-z]{24}) \/\*[^*]*\*\/ = \{\s*isa = PBXNativeTarget;/g)) {
    const cel = blok(tekst, m[1]);
    const nazwa = pole(cel, 'name');
    const lista = blok(tekst, pole(cel, 'buildConfigurationList').split(' ')[0]);
    const ids = [...(/buildConfigurations = \(([\s\S]*?)\);/.exec(lista)?.[1] ?? '').matchAll(/([0-9A-Za-z]{24})/g)].map((x) => x[1]);
    for (const id of ids) {
      const konf = blok(tekst, id);
      if (pole(konf, 'name') !== 'Release') continue;
      const ustawienia = /buildSettings = \{([\s\S]*?)\n\s*\};/.exec(konf)?.[1] ?? '';
      const produkt = (pole(ustawienia, 'PRODUCT_NAME') ?? nazwa).replace('$(TARGET_NAME)', nazwa);
      const plik = pole(ustawienia, 'CODE_SIGN_ENTITLEMENTS');
      if (plik) wynik[produkt] = plik;
    }
  }
  return wynik;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [plik, ...fl] = process.argv.slice(2);
  if (!plik) { console.error('użycie: w nagłówku pliku'); process.exit(2); }
  const m = mapaUprawnien(readFileSync(plik, 'utf8'));
  if (fl.includes('--json')) console.log(JSON.stringify(m));
  else for (const [k, v] of Object.entries(m)) console.log(`${k}\t${v}`);
}
