#!/usr/bin/env node
// Komplet surowych zrzutów sklepu: dla każdego zaplanowanego języka i urządzenia są sceny wymagane (rola 10-wydanie, KO-032; zastępuje pętlę bash z zrzuty-sklepu.yml, zadanie „zbierz”).
// Sceny 01, 02, 05, 06, 07 zawsze w `<klasa>/<język>/`; 03 i 04 (wzór; warunek OG-07) w `<klasa>/<język>/` albo w `warunek-og07/<klasa>/<język>/`.
// Użycie: node scripts/ci/komplet-zrzutow.mjs <katalog_surowych> <języki po przecinku> <urządzenia po przecinku: iphone,ipad>  → lista braków, kod 1; komplet = kod 0.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const KLASY = { iphone: '6.9', ipad: 'ipad-13' };
export const ZAWSZE = ['01-dzis', '02-licznik', '05-projekty', '06-historia', '07-kalendarz'];
export const WARUNKOWE = ['03-wzor', '04-zakreslenie'];

export function braki(katalog, jezyki, urzadzenia) {
  const wynik = [];
  for (const u of [...new Set(urzadzenia)]) {
    const klasa = KLASY[u];
    if (!klasa) { wynik.push(`nieznane urządzenie: ${u}`); continue; }
    for (const j of jezyki) {
      for (const n of ZAWSZE) if (!existsSync(join(katalog, klasa, j, `${n}.png`))) wynik.push(`brak ${klasa}/${j}/${n}.png`);
      for (const n of WARUNKOWE) if (!existsSync(join(katalog, klasa, j, `${n}.png`)) && !existsSync(join(katalog, 'warunek-og07', klasa, j, `${n}.png`))) wynik.push(`brak ${klasa}/${j}/${n}.png (ani w warunek-og07)`);
    }
  }
  return wynik;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [kat, jez, urz] = process.argv.slice(2);
  if (!kat || !jez || !urz) { console.error('użycie: node scripts/ci/komplet-zrzutow.mjs <katalog> <języki> <urządzenia>'); process.exit(2); }
  const b = braki(kat, jez.split(',').filter(Boolean), urz.split(',').filter(Boolean));
  for (const x of b) console.log(`BŁĄD ${x}`);
  console.log(b.length ? `BRAKI: ${b.length}` : 'KOMPLET');
  process.exit(b.length ? 1 : 0);
}
