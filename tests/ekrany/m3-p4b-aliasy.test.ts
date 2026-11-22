// M3 p4b (kawałek C, punkt 3 polecenia): z `src/ekrany/motyw.ts` znikają aliasy starych ról, których nic nie używa (grep po src/, tests/, app/, targets/ w dniu usunięcia).
// Aliasy nadal używane przez ekrany innych partii zostają (lista w docs/programista/m3-p4b-stan.md); ich migracja na tokeny jest poza zakresem p4b.
// Test sprawdza eksport (klucza nie ma) i źródło (klucza nikt nie czyta w kodzie aplikacji).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { kolorJasny, systemCzarny } from '../../src/ekrany/motyw';

const K = join(__dirname, '../..');
const KOLORY_USUNIETE = ['kreska', 'przyciskNieaktywnyTlo', 'przyciskNiszczacyTlo', 'przyciskNiszczacyTekst'];
const SYSTEM_CZARNY_USUNIETE = ['grafit', 'olowek', 'przyciskTlo', 'przyciskObrys', 'zakreslacz', 'tekstNaZakreslaczu', 'zakreslaczKrawedz'];

test.each(KOLORY_USUNIETE)('paleta motywu (Kolory) nie ma aliasu %s', (nazwa) => {
  expect(Object.keys(kolorJasny)).not.toContain(nazwa);
});

test.each(SYSTEM_CZARNY_USUNIETE)('systemCzarny nie ma aliasu %s', (nazwa) => {
  expect(Object.keys(systemCzarny)).not.toContain(nazwa);
});

test('systemCzarny zachowuje role z tokenów (tlo, tekst, tekst2, akcent, akcentTekst, przycisk, przyciskTekst, pasPrzypomnienia)', () => {
  for (const n of ['tlo', 'tekst', 'tekst2', 'akcent', 'akcentTekst', 'przycisk', 'przyciskTekst', 'pasPrzypomnienia']) expect(Object.keys(systemCzarny)).toContain(n);
});

function pliki(d: string): string[] {
  return readdirSync(join(K, d)).flatMap((n) => {
    const sc = join(d, n);
    return statSync(join(K, sc)).isDirectory() ? pliki(sc) : /\.(tsx?|js)$/.test(n) ? [sc] : [];
  });
}
test('kod aplikacji (src, app) nie czyta usuniętych aliasów z palety ani z systemCzarny', () => {
  const rx = new RegExp(`\\b(?:k|kolory|paleta)\\.(?:${KOLORY_USUNIETE.join('|')})\\b|\\bsystemCzarny\\.(?:${SYSTEM_CZARNY_USUNIETE.join('|')})\\b`);
  const trafienia = [...pliki('src'), ...pliki('app')].filter((p) => rx.test(readFileSync(join(K, p), 'utf8')));
  expect(trafienia).toEqual([]);
});
