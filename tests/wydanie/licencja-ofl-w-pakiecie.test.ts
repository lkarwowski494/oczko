// M1-245 (P-661, kryterium 3): tekst OFL kroju Bree Serif jest w pakiecie aplikacji. Dowód nie opiera się na pliku w assets/ czytanym przez test, tylko na tym, co trafia do pakietu:
// moduł src/domena/licencje.generated.ts (importowany przez ekran licencji) kompilowany hermesc do bajtkodu, tak jak bundle w .ipa, i przeszukany tym samym wzorcem,
// który stosuje scripts/wydanie/kontrola-ipa.sh (grep na main.jsbundle). Kontrola na prawdziwym .ipa działa tylko na macOS w CI.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sciezkaHermesc } from './hermesc-sciezka';

const KORZEN = join(__dirname, '../..');
const WZORCE = ['Reserved Font Names "Bree" and "Bree Serif"', 'SIL OPEN FONT LICENSE Version 1.1'];

test('kontrola-ipa.sh szuka w main.jsbundle tych samych wzorców noty i licencji OFL', () => {
  const skrypt = readFileSync(join(KORZEN, 'scripts/wydanie/kontrola-ipa.sh'), 'utf8');
  for (const w of WZORCE) expect(skrypt).toContain(`grep -aqF '${w}' "$B"`);
  expect(skrypt).toMatch(/blad "main\.jsbundle bez noty i licencji OFL kroju Bree Serif/);
});

test('moduł licencji skompilowany do bajtkodu Hermesa zawiera wzorce noty i licencji OFL (to, co trafia do pakietu)', () => {
  const hermesc = sciezkaHermesc(KORZEN, process.platform); // binarka tej platformy (TF-B3-01); brak = jawny błąd
  const katalog = mkdtempSync(join(tmpdir(), 'ofl-pakiet-'));
  try {
    const dane = spawnSync(process.execPath, ['--experimental-strip-types', '--no-warnings', '--input-type=module', '-e',
      `const m = await import(${JSON.stringify(join(KORZEN, 'src/domena/licencje.generated.ts'))}); process.stdout.write(JSON.stringify(m.KROJE));`], { encoding: 'utf8', cwd: KORZEN });
    expect(dane.status).toBe(0);
    writeFileSync(join(katalog, 'a.js'), `var KROJE = ${dane.stdout}; globalThis.licencje = KROJE;`);
    const k = spawnSync(hermesc, ['-emit-binary', '-out', join(katalog, 'a.hbc'), join(katalog, 'a.js')], { encoding: 'utf8' });
    expect({ kod: k.status, stderr: k.stderr }).toEqual({ kod: 0, stderr: '' });
    const bajty = readFileSync(join(katalog, 'a.hbc'));
    for (const w of WZORCE) expect(bajty.indexOf(w)).toBeGreaterThanOrEqual(0);
  } finally { rmSync(katalog, { recursive: true, force: true }); }
});

test('ekran licencji importuje moduł wygenerowany, a trasa /licencje istnieje (moduł wchodzi do pakietu przez nawigację)', () => {
  expect(readFileSync(join(KORZEN, 'src/ekrany/Licencje.tsx'), 'utf8')).toContain("domena/licencje.generated'");
  expect(readFileSync(join(KORZEN, 'app/licencje.tsx'), 'utf8')).toContain("ekrany/Licencje'");
  expect(readFileSync(join(KORZEN, 'app/ustawienia.tsx'), 'utf8')).toContain("router.push('/licencje')");
});
