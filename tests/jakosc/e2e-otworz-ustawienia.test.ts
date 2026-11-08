/* P-571 (8.11): zębatka Ustawień (`nav-ustawienia`, gearshape) tylko na „Dziś”, jak na makietach (P-554; to-be WD-1); bez drugiego miejsca w zakładce Projekty.
 * Jedno miejsce zmiany drogi do Ustawień w E2E: podprzepływ `subflows/otworz-ustawienia.yaml` (Dziś → zębatka → `ustawienia`).
 * Kontrola mechaniczna (zasada wspólna 21): żaden inny plik scenariusza ani podprzepływu nie stuka `nav-ustawienia` sam — inaczej zmiana miejsca zębatki
 * znów rozjedzie się po 11 plikach (stan sprzed P-571: 06, 08, 09, 32, 39, 63, 65, 66, 68, otworz-stan-danych*). */
import * as fs from 'fs';
import * as path from 'path';
import { kroki, podprzeplywy, wczytaj } from './maestro-runner';

const KAT = path.join(__dirname, '..', '..', 'e2e/scenariusze');
const PODFLOW = path.join(KAT, 'subflows/otworz-ustawienia.yaml');
const pliki = [
  ...fs.readdirSync(KAT).filter((f) => f.endsWith('.yaml') && f !== 'config.yaml'),
  ...fs.readdirSync(path.join(KAT, 'subflows')).filter((f) => f.endsWith('.yaml')).map((f) => `subflows/${f}`),
].map((f) => path.join(KAT, f));
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- struktura YAML scenariusza
const idy = (arg: any): string[] => {
  const id = typeof arg === 'object' && arg ? arg.id : undefined;
  return typeof id === 'string' ? id.split('|') : [];
};
const stuka = (plik: string, id: string) => [...kroki(wczytaj(plik).polecenia)].some((k) => k.nazwa === 'tapOn' && idy(k.arg).includes(id));

describe('P-571 · Ustawienia w E2E tylko przez zębatkę „Dziś” (subflows/otworz-ustawienia.yaml)', () => {
  test('podprzepływ istnieje: nav-dzis → dzis-karta → nav-ustawienia → ustawienia, w tej kolejności', () => {
    expect(fs.existsSync(PODFLOW)).toBe(true);
    const k = [...kroki(wczytaj(PODFLOW).polecenia)].map(({ nazwa, arg }) => `${nazwa}:${idy(arg).join('|')}`);
    const i = (s: string) => k.indexOf(s);
    expect(i('tapOn:nav-dzis')).toBeGreaterThanOrEqual(0);
    expect(i('assertVisible:dzis-karta')).toBeGreaterThan(i('tapOn:nav-dzis'));
    expect(i('tapOn:nav-ustawienia')).toBeGreaterThan(i('assertVisible:dzis-karta'));
    expect(k[k.length - 1]).toBe('assertVisible:ustawienia');
  });

  test('żaden inny scenariusz ani podprzepływ nie stuka nav-ustawienia sam', () => {
    const obce = pliki.filter((p) => p !== PODFLOW && stuka(p, 'nav-ustawienia')).map((p) => path.relative(KAT, p));
    expect(obce).toEqual([]);
  });

  test('11 dawnych wejść z listy projektów woła podprzepływ (regresja P-571)', () => {
    const dawne = ['06', '08', '09', '32', '39', '63', '65', '66', '68']
      .map((n) => fs.readdirSync(KAT).find((f) => f.startsWith(`${n}-`)) as string)
      .concat(['subflows/otworz-stan-danych.yaml', 'subflows/otworz-stan-danych-ze-zrzutem.yaml']);
    const bezPodflow = dawne.filter((f) => !podprzeplywy(wczytaj(path.join(KAT, f))).includes(PODFLOW));
    expect(bezPodflow).toEqual([]);
  });

  test('e2e/README.md: nav-ustawienia to zębatka na „Dziś”, nie lista projektów', () => {
    const wiersz = fs.readFileSync(path.join(KAT, '..', 'README.md'), 'utf8').split('\n').find((l) => l.startsWith('| `nav-ustawienia` |'));
    expect(wiersz).toMatch(/^\| `nav-ustawienia` \| „Dziś”/);
    expect(wiersz).toMatch(/gearshape/);
  });
});
