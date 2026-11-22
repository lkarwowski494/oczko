// kontrola-nz08p304.mjs — czy projekt pokrywa pozycje fixu NZ-08-P3-04 (P-132, P-133).
// node docs/design/narzedzia/kontrola-nz08p304.mjs [katalog docs/design]; kod 1, gdy brak którejkolwiek pozycji.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..');
const czytaj = (p) => (existsSync(join(dir, p)) ? readFileSync(join(dir, p), 'utf8') : '');
const spec = czytaj('design-spec.md');
const ekrany = czytaj('ekrany.html');
const akt = czytaj('aktywnosc.html');
const ekran = (n, z = ekrany) => z.includes(`data-ekran="${n}"`);
const klucz = (k) => spec.includes(`\`${k}\``);
// Sekcje ekranu blokady i Dynamic Island: bez przycisku −1 (P-133 1.1a).
const blokada = [...akt.matchAll(/<section data-ekran="(blokada|wyspa)-[^"]+"[\s\S]*?<\/section>/g)].map((m) => m[0]);
const stanyAkt = ['blokada-typowy', 'blokada-przypomnienie', 'blokada-limit', 'blokada-odblokuj', 'blokada-blad-zapisu', 'blokada-robocza',
  'wyspa-compact', 'wyspa-minimal', 'wyspa-rozwinieta',
  'zegarek-typowy', 'zegarek-przypomnienie', 'zegarek-limit', 'zegarek-bez-telefonu', 'zegarek-bez-stanu', 'zegarek-smart-stack'];
const pozycje = {
  '1 ekran blokady i zegarek (1.1a, 1.2a, teksty)': [
    ...stanyAkt.map((s) => ekran(s, akt)),
    blokada.length >= 9 && blokada.every((s) => !/class="minus"/.test(s)),
    klucz('aktywnosc.plus'), klucz('aktywnosc.minus'), klucz('aktywnosc.limit'), klucz('aktywnosc.limit_wznowienie'),
    klucz('aktywnosc.odblokuj'), klucz('aktywnosc.blad_zapisu'), klucz('aktywnosc.otworz_iphone'), klucz('aktywnosc.bez_telefonu_other'),
    !/left this month/.test(spec + akt),
    /Unlock iPhone/.test(spec) && /P-133/.test(spec),
  ],
  '2.1 notatka wzoru bez znacznika (Q6a)': [ekran('wzor-notatka-bez-znacznika'), klucz('wzor.notatka_bez_znacznika'), klucz('wzor.notatka_zaznacz'), /ADR-0011/.test(spec)],
  '2.2 import przerwany (ADR-0002 (7))': [ekran('import-przerwany'), klucz('import.przerwany_tytul'), klucz('import.ponow'), klucz('import.w_toku')],
  '2.3 data ukończenia (BR-PRJ-013)': [ekran('ukonczenie-data'), klucz('projekt.data_ukonczenia'), /ukonczono_dzien/.test(spec)],
  '3 etykieta robocza (P-126 1b)': [klucz('projekty.nazwa_robocza'), klucz('aktywnosc.nazwa_robocza'), /rok tylko/i.test(spec), /bieżąc\w+ język/.test(spec)],
};
let brak = 0;
for (const [p, w] of Object.entries(pozycje)) {
  const ok = w.every(Boolean);
  if (!ok) brak++;
  console.log(`${ok ? 'OK  ' : 'BRAK'} ${p} (${w.filter(Boolean).length}/${w.length})`);
}
const n = Object.keys(pozycje).length;
console.log(`${n - brak}/${n}`);
process.exit(brak ? 1 : 0);
