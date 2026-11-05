// dzianina-tokeny.mjs — z docs/design/dzianina/tokeny.json: (1) tokeny.css dla makiet, (2) pary kontrastu dla kontrast.mjs.
// Użycie: node dzianina-tokeny.mjs <katalog dzianina>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const kat = process.argv[2];
const t = JSON.parse(readFileSync(join(kat, 'tokeny.json'), 'utf8'));
const k = t.kolory;
const css = (o) => Object.entries(o).map(([n, v]) => `--${n}: ${v};`).join(' ');
writeFileSync(join(kat, 'tokeny.css'), `/* wygenerowane z tokeny.json — nie edytuj ręcznie */
:root { ${css(k.jasny)} }
[data-theme="dark"] { ${css(k.ciemny)} }
[data-kontrast="zwiekszony"] { ${css(k.jasnyZwiekszony)} }
[data-theme="dark"][data-kontrast="zwiekszony"] { ${css(k.ciemnyZwiekszony)} }
`);
// Pary sąsiadujące (tekst/tło, element/tło). Próg 3 tylko dla tekstu ≥ 24 pt / 19 pt pogr. i grafiki/UI.
const PARY = [
  ['tekst', 'tlo'], ['tekst2', 'tlo'], ['tekst', 'powierzchnia'], ['tekst2', 'powierzchnia'], ['akcentTekst', 'tlo'], ['akcentTekst', 'powierzchnia'],
  ['kartaTekst', 'karta'], ['kartaTekst2', 'karta'], ['naAkcencie', 'akcent', 3, '„+1” 26 pt pogr.'], ['akcent', 'karta', 3, 'dzianina/karta (grafika)'],
  ['akcentJasny', 'karta', 3, 'rzędy dziś/karta (grafika)'], ['przyciskTekst', 'przycisk'], ['przyciskNaKarcieTekst', 'przyciskNaKarcie'],
  ['przyciskNaKarcie', 'karta', 3, 'przycisk na karcie (UI)'], ['ikona', 'ikonaTlo', 3, 'ikona kafla (UI)'], ['zakladka', 'pasek'], ['zakladkaWybrana', 'pasek'],
  ['akcentTekst', 'dzienPusty', 3, 'obwódka dnia dzierganego/dzień pusty (grafika)'], ['akcentTekst', 'tlo', 3, 'obwódka dnia dzierganego/tło (grafika)'], ['dzienPusty', 'tlo', 1.0, 'dzień pusty — odróżnia go kształt, nie kontrast (informacyjnie)'],
  ['niszczacyTekst', 'niszczacy'], ['niszczacy', 'tlo', 3, 'przycisk niszczący/tło (UI)'], ['linia', 'tlo', 1.0, 'linia podziału — dekoracyjna (informacyjnie)'],
  ['igla', 'karta', 3, 'igła = bieżący rząd (grafika)'], ['tekst', 'wzorRama'],
];
const pary = {};
for (const [nazwa, kolory] of [['jasny', k.jasny], ['ciemny', k.ciemny], ['jasny zwiększony', { ...k.jasny, ...k.jasnyZwiekszony }], ['ciemny zwiększony', { ...k.ciemny, ...k.ciemnyZwiekszony }]])
  for (const [a, b, prog = 4.5, opis] of PARY) pary[`${nazwa}: ${opis || `${a}/${b}`}`] = [kolory[a], kolory[b], prog];
writeFileSync(join(kat, 'kontrast-pary.json'), JSON.stringify(pary, null, 1));
console.log(`tokeny.css + kontrast-pary.json: ${Object.keys(pary).length} par`);
