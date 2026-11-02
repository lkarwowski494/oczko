/* Przebieg „Jakość · iOS” #139 (run 41411580991, SHA cbcb094, 2026-11-02).
 *  S1 · 08 (bramka) i 66: `extendedWaitUntil visible eksport-wynik` po „Export all data” pada po 30 s. Eksport w aplikacji trwa 0,18 s (dziennik symulatora: zadanie „eksport”
 *       08:47:04,395 → 04,576), ale widok `eksport-wynik` leży pod grupą Eksport/Import/Usuń (`src/ekrany/Ustawienia.tsx:84`), a od #139 nad tytułem jest jeden wiersz więcej
 *       (panel `e2e-ocena-stan`, `src/kompozycja/e2e/ocena-stan.tsx`) → widok spada za dolną krawędź ekranu (hierarchia kroku 43: „Delete all data” [816,860], ekran 874 pt, brak
 *       elementów `eksport-*`). Element poza ekranem nie występuje w hierarchii iOS, więc samo czekanie nie dojdzie do skutku (ten sam wzorzec co E2-138-S1, E2-136-S3).
 *       Scenariusz 66 pada identycznie, na szybkiej maszynie (cz. 2: 83 s całość), więc to nie wolny runner. */
import * as fs from 'fs';
import * as path from 'path';
import { kroki, wczytaj } from './maestro-runner';

const KAT = path.join(__dirname, '..', '..', 'e2e/scenariusze');
type Krok = { nazwa: string; arg: any };
const plik = (n: string) => fs.readdirSync(KAT).find((f) => f.startsWith(`${n}-`)) as string;
const lista = (n: string): Krok[] => [...kroki(wczytaj(path.join(KAT, plik(n))).polecenia)].map(({ nazwa, arg }) => ({ nazwa, arg }));
const idy = (k: Krok): string[] => {
  const a = k.arg;
  const id = typeof a === 'object' && a ? (a.id ?? a.element?.id ?? a.visible?.id ?? a.when?.visible?.id ?? a.when?.notVisible?.id) : undefined;
  return typeof id === 'string' ? id.split('|') : [];
};

describe.each(['08', '66'])('E2-139-S1 · %s: wynik eksportu leży poniżej ekranu Ustawień', (n) => {
  test('pierwszy krok z eksport-wynik to scrollUntilVisible w dół, nie samo czekanie', () => {
    const l = lista(n);
    const stuk = l.findIndex((k) => k.nazwa === 'tapOn' && idy(k).includes('ustawienia-eksport'));
    expect(stuk).toBeGreaterThan(-1);
    const pierwszy = l.findIndex((k, i) => i > stuk && idy(k).includes('eksport-wynik'));
    expect(pierwszy).toBeGreaterThan(stuk);
    expect(l[pierwszy].nazwa).toBe('scrollUntilVisible');
    expect(String(l[pierwszy].arg.direction).toUpperCase()).toBe('DOWN');
    expect(l[pierwszy].arg.optional).not.toBe(true);
    expect(l[pierwszy].arg.timeout).toBeGreaterThanOrEqual(30000);
  });
  test('żadne czekanie (extendedWaitUntil) na eksport-wynik bez przewinięcia przed nim', () => {
    const l = lista(n);
    const stuk = l.findIndex((k) => k.nazwa === 'tapOn' && idy(k).includes('ustawienia-eksport'));
    const czekania = l.filter((k, i) => i > stuk && k.nazwa === 'extendedWaitUntil' && idy(k).includes('eksport-wynik'));
    expect(czekania).toHaveLength(0);
  });
});
