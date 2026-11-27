// WY1 (KO-203, P-1040): „What’s New” wersji 1.0.1 — plik docs/wydanie/metadane/co-nowego-1-0-1.store.json ma komplet 33 lokalizacji ASC (kody z nazwy.store.json),
// mieści się w limicie 4000 znaków, nie obiecuje funkcji i scala się ze źródłami metadanych skryptu asc-metadane (releaseNotes → whatsNew) bez błędów walidacji.
// Test niczego nie wysyła (żadnego połączenia z Apple).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..', '..');
const MET = 'docs/wydanie/metadane';
const json = (f: string) => JSON.parse(readFileSync(join(root, f), 'utf8')) as { apple: { info: Record<string, Record<string, string>> } };
const ANG = ['en-US', 'en-GB', 'en-AU', 'en-CA'];
const plik = json(`${MET}/co-nowego-1-0-1.store.json`).apple.info; // 29 lokalizacji bez en-*
const kody = Object.keys(json(`${MET}/nazwy.store.json`).apple.info);
const notatki: Record<string, Record<string, string>> = { ...plik, ...Object.fromEntries(ANG.map((k) => [k, json(`${MET}/en.store.json`).apple.info[k]])) }; // en-* w en.store.json

describe('co-nowego-1-0-1.store.json (WY1)', () => {
  test('plik ma dokładnie 29 lokalizacji bez en-* (z samym polem releaseNotes); razem z en.store.json komplet nazwy.store.json', () => {
    expect(Object.keys(plik).sort()).toEqual(kody.filter((k) => !ANG.includes(k)).sort());
    for (const k of Object.keys(plik)) expect(Object.keys(plik[k])).toEqual(['releaseNotes']);
    expect(Object.keys(notatki).sort()).toEqual([...kody].sort());
  });
  test('tekst niepusty, ≤ 4000 znaków (limit „What’s New”), bez adresów, cen i obietnic nowych funkcji; angielskie warianty identyczne', () => {
    for (const k of kody) {
      const t = notatki[k].releaseNotes;
      expect(typeof t).toBe('string');
      expect([...t].length).toBeGreaterThan(20);
      expect([...t].length).toBeLessThanOrEqual(4000);
      expect(t).not.toMatch(/https?:|www\.|[$€£]|\d/);
    }
    expect(new Set(ANG.map((k) => notatki[k].releaseNotes)).size).toBe(1);
  });
  test('scala się z pozostałymi plikami skryptu asc-metadane: brak sprzeczności, walidacja bez błędów, whatsNew w każdej lokalizacji (bez sieci)', () => {
    const moduł = JSON.stringify(join(root, 'scripts/asc/metadane.mjs'));
    const kat = JSON.stringify(join(root, MET));
    const kod = `import * as M from ${moduł};
      const { merged, errs } = M.mergeStoreFiles(M.loadStoreFiles(${kat}));
      const wanted = M.buildWanted({ merged });
      const bledy = M.validate({ wanted });
      console.log(JSON.stringify({ errs, bledy, n: Object.keys(wanted).length, bezNotatki: Object.entries(wanted).filter(([, w]) => !w.version.whatsNew).map(([k]) => k) }));`;
    const w = JSON.parse(execFileSync('node', ['--input-type=module', '-e', kod], { encoding: 'utf8' }));
    expect(w.errs).toEqual([]);
    expect(w.bledy).toEqual([]);
    expect(w.n).toBe(kody.length);
    expect(w.bezNotatki).toEqual([]);
  });
});
