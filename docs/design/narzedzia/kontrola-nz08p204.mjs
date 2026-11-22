// kontrola-nz08p204.mjs — czy projekt pokrywa pozycje 1–7 fixu NZ-08-P2-04 (P-126).
// node docs/design/narzedzia/kontrola-nz08p204.mjs [katalog docs/design]; kod 1, gdy brak którejkolwiek pozycji.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..');
const spec = readFileSync(join(dir, 'design-spec.md'), 'utf8');
const ekrany = readFileSync(join(dir, 'ekrany.html'), 'utf8');
const ekran = (n) => ekrany.includes(`data-ekran="${n}"`);
const klucz = (k) => spec.includes(`\`${k}\``);
const pozycje = {
  '1 nazwa robocza (1b)': [ekran('projekty-robocze'), klucz('projekty.nazwa_robocza'), klucz('projekt.nazwij'), /nienazwan/.test(spec)],
  '2 zużycie ponad zapas (2a)': [ekran('ukonczenie-ponad-zapas'), klucz('ukonczenie.zuzycie_ponad_zapas_other'), klucz('ukonczenie.edytuj_zapas'), !ekrany.includes('How much is left?')],
  '3 znacznik wzoru (3a)': [ekran('wzor-kierunek'), ekran('wzor-znacznik'), ekran('wzor-koniec-strony'), klucz('wzor.kierunek_pytanie'), klucz('wzor.koniec_strony_gora'), klucz('wzor.zaznacz_rzad')],
  '4 uczciwe zasady': [ekran('uczciwe-zasady'), klucz('uczciwe.tytul'), /poza 1\.0/.test(spec) && /karta planów po imporcie/i.test(spec), /nie nad.*wzor/i.test(spec)],
  '5 źródła wiedzy': [ekran('zrodla-wiedzy'), klucz('zrodla.zdanie'), klucz('zrodla.linia_standardow'), /BR-KAL-008/.test(spec)],
  '6 kreski przez północ (6a, N2)': [ekran('licznik-przez-polnoc'), klucz('licznik.znaczniki_sesji_other'), !/Tonight’s marks/.test(spec + ekrany), /posiedzeni/.test(spec)],
  '7 język (7a)': [ekran('jezyk'), klucz('ustawienia.jezyk_automatyczny'), /P-115/.test(spec)],
};
let brak = 0;
for (const [p, w] of Object.entries(pozycje)) {
  const ok = w.every(Boolean);
  if (!ok) brak++;
  console.log(`${ok ? 'OK  ' : 'BRAK'} ${p} (${w.filter(Boolean).length}/${w.length})`);
}
console.log(`${7 - brak}/7`);
process.exit(brak ? 1 : 0);
