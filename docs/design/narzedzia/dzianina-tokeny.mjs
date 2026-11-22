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
:root { ${Object.entries(k.systemCzarny).filter(([n]) => !n.startsWith('_')).map(([n, v]) => `--sc-${n}: ${v};`).join(' ')} }
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
  // oferty (P-557): obwódka i znacznik wybranego planu, kółko niewybranego, przycisk wyłączony „Czeka na zatwierdzenie”, pasek przycisków
  ['akcentTekst', 'powierzchnia', 3, 'oferty: obwódka wybranego planu (UI)'], ['przycisk', 'powierzchnia', 3, 'oferty: znacznik wybranego planu (UI)'],
  ['tekst2', 'powierzchnia', 3, 'oferty: kółko niewybranego planu (UI)'], ['tekst2', 'powierzchnia', 4.5, 'oferty: tekst przycisku wyłączonego'],
  ['przycisk', 'pasek', 3, 'oferty: przycisk główny/pasek (UI)'], ['akcentTekst', 'pasek', 4.5, 'oferty: Przywróć zakupy, Nie teraz/pasek'], ['tekst', 'pasek', 4.5, 'oferty: komunikat/pasek'],
  // M3-S3-02: przycisk nieaktywny (tekst, przerywana rama do tła przycisku i do paska), rysunki atlasu, miniatura dzianiny w wierszu
  ['przyciskNieaktywnyTekst', 'przyciskNieaktywny', 4.5, 'przycisk nieaktywny: tekst'], ['przyciskNieaktywnyRama', 'przyciskNieaktywny', 3, 'przycisk nieaktywny: rama przerywana (UI)'],
  ['przyciskNieaktywnyRama', 'pasek', 3, 'przycisk nieaktywny: rama/pasek (UI)'],
  ['rysunekNitka', 'rysunekTlo', 3, 'atlas: nitka/tło (grafika)'], ['rysunekDrut', 'rysunekTlo', 3, 'atlas: drut, strzałka/tło (grafika)'],
  ['rysunekNitka', 'rysunekWyroznienie', 3, 'atlas: nitka/wyróżnienie (grafika)'], ['rysunekDrut', 'rysunekWyroznienie', 3, 'atlas: drut/wyróżnienie (grafika)'],
  ['rysunekWyroznienie', 'rysunekTlo', 1.0, 'atlas: wyróżnienie/tło — pole odróżnia kształt i nitka na nim (informacyjnie)'],
  ['akcent', 'karta', 3, 'miniatura: dzianina/karta (grafika)'], ['igla', 'karta', 3, 'miniatura: igła/karta (grafika)'], ['karta', 'tlo', 1.0, 'miniatura: karta/tło — górę skali niesie igła na karcie (para igła/karta), wartość tekst wiersza (informacyjnie)'],
  // M3-S3-06: stany p2 na „Dziś” (limit zawczasu na karcie, baner „Cofnąć?”)
  ['kartaTekst', 'karta', 4.5, 'limit na karcie: komunikat i odnośnik Oczko Pro'], ['kartaTekst2', 'karta', 3, 'limit na karcie: ikona klepsydry (UI)'],
  // M3-MAK-01..03 (2026-11-08): ekran projektu, arkusz formularza, biegnący stoper, kafelek ikony wiersza
  ['niszczacy', 'powierzchnia', 4.5, 'menu projektu: Usuń projekt… (tekst)'], ['niszczacy', 'powierzchnia', 3, 'edycja projektu: znak usunięcia (UI)'],
  ['tekst2', 'tlo', 3, 'projekt: obwódka kropki włóczki (grafika)'], ['przyciskNieaktywnyTekst', 'powierzchnia', 4.5, 'arkusz: Dodaj nieaktywny'],
  ['akcentTekst', 'powierzchnia', 4.5, 'arkusz: Anuluj, Zapisz, Wyczyść'], ['tekst2', 'powierzchnia', 3, 'arkusz: obrys pola (UI)'], ['akcentTekst', 'powierzchnia', 3, 'arkusz: obrys pola z fokusem (UI)'],
  ['przycisk', 'tlo', 3, 'arkusz: znacznik wybranej opcji/tło listy (UI)'], ['tekst2', 'tlo', 3, 'arkusz: kółko niewybranej opcji/tło listy (UI)'],
  ['akcentTekst', 'powierzchnia', 3, 'licznik: rama biegnącego stopera (UI)'], ['ikona', 'ikonaTlo', 3, 'kafelek ikony wiersza 32 pt (UI)'],
  ['tekst', 'powierzchnia', 4.5, 'baner Cofnąć?: tekst'], ['akcentTekst', 'powierzchnia', 4.5, 'baner Cofnąć?: przycisk tekstowy Cofnij'], ['akcentTekst', 'powierzchnia', 3, 'baner Cofnąć?: rama przycisku i ikona (UI)'],
];
const pary = {};
for (const [nazwa, kolory] of [['jasny', k.jasny], ['ciemny', k.ciemny], ['jasny zwiększony', { ...k.jasny, ...k.jasnyZwiekszony }], ['ciemny zwiększony', { ...k.ciemny, ...k.ciemnyZwiekszony }]])
  for (const [a, b, prog = 4.5, opis] of PARY) pary[`${nazwa}: ${opis || `${a}/${b}`}`] = [kolory[a], kolory[b], prog];
// systemCzarny (Dynamic Island, Smart Stack, zegarek): tekst i akcent na czarnym tle i na karcie Smart Stack
const sc = k.systemCzarny;
for (const tlo of ['tlo', 'kartaStack']) {
  pary[`systemCzarny: tekst/${tlo}`] = [sc.tekst, sc[tlo], 4.5]; pary[`systemCzarny: tekst2/${tlo}`] = [sc.tekst2, sc[tlo], 4.5];
  pary[`systemCzarny: akcentTekst/${tlo}`] = [sc.akcentTekst, sc[tlo], 4.5]; pary[`systemCzarny: przycisk/${tlo} (UI)`] = [sc.przycisk, sc[tlo], 3];
  pary[`systemCzarny: znak kresek/${tlo} (grafika)`] = [sc.tekst, sc[tlo], 3];
}
pary['systemCzarny: przyciskTekst/przycisk'] = [sc.przyciskTekst, sc.przycisk, 4.5];
// P-579: pas przypomnienia na ekranie blokady (systemCzarny) i podgląd zdjęć (M3-MAK-02)
for (const n of ['tekst', 'tekst2', 'akcentTekst']) pary[`systemCzarny: ${n}/pasPrzypomnienia`] = [sc[n], sc.pasPrzypomnienia, 4.5];
pary['systemCzarny: pasPrzypomnienia/tlo — pas odróżnia kształt i tekst na nim (informacyjnie)'] = [sc.pasPrzypomnienia, sc.tlo, 1.0];
pary['podgląd zdjęcia: akcja akcentTekst/tlo'] = [sc.akcentTekst, sc.tlo, 4.5]; pary['podgląd zdjęcia: licznik tekst2/tlo'] = [sc.tekst2, sc.tlo, 4.5];
// strona wzoru (stałe, oba motywy): znacznik rzędu na białej stronie, etykieta znacznika
pary['wzor: znacznik/strona (grafika)'] = [t.wzor.znacznik, t.wzor.strona, 3]; pary['wzor: etykietaTekst/etykietaTlo'] = [t.wzor.etykietaTekst, t.wzor.etykietaTlo, 4.5];
pary['wzor: etykietaTlo/strona (UI)'] = [t.wzor.etykietaTlo, t.wzor.strona, 3];
writeFileSync(join(kat, 'kontrast-pary.json'), JSON.stringify(pary, null, 1));
console.log(`tokeny.css + kontrast-pary.json: ${Object.keys(pary).length} par`);
