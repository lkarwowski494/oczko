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

/* S2 · 12 (info): `tapOn baner-serii-cofnij` — „Element not found”. Baner serii (RD-17) powstaje, gdy 3 dodania mieszczą się w oknie strażnika (2 s, `STRAZNIK_OKNO_S`, `maSerie`: t3 − t1 ≤ okno).
 *       Dziennik symulatora cz. 3: trzy stuknięcia `licznik-plus` o 08:54:52,405, :53,688, :54,510 → rozpiętość 2,105 s > 2 s → baner nie powstaje (licznik 4, hierarchia bez `baner-serii`).
 *       Ta sama zależność od szybkości maszyny, którą P-358 rozwiązał dla 04 (`oczkoE2eOknoStraznika`); 12 miał start-czysty i odstęp 2,2 s. Odstęp przed trzema stuknięciami musi być
 *       większy niż okno 6 s (inaczej pierwsze +1 wchodzi do serii i „Undo” cofa 4, nie 3). */
describe('E2-139-S2 · 12: baner serii nie zależy od szybkości maszyny', () => {
  test('własny start z oknem strażnika 6 s i odstęp > 6 s przed trzema stuknięciami', () => {
    const l = lista('12');
    const start = l.find((k) => k.nazwa === 'launchApp');
    expect(start).toBeDefined();
    expect(String(start!.arg.arguments?.oczkoE2eOknoStraznika)).toBe('6');
    const seria = l.findIndex((k) => k.nazwa === 'tapOn' && idy(k).includes('licznik-plus') && k.arg.repeat === 3);
    expect(seria).toBeGreaterThan(-1);
    const przed = l.slice(Math.max(0, seria - 3), seria);
    const wait = przed.find((k) => k.nazwa === 'extendedWaitUntil' && idy(k).includes('e2e-nigdy'));
    expect(wait).toBeDefined();
    expect(wait!.arg.timeout).toBeGreaterThanOrEqual(6500);
  });
});

/* S3 · 60 (info): po zapisie formularza narzędzia `extendedWaitUntil projekt-dodaj` pada — ekran projektu jest przewinięty w dół (wcześniejsze `scrollUntilVisible projekt-narzedzie`),
 *       przycisk „Add part or counter” leży nad ekranem i nie ma go w hierarchii iOS (hierarchia kroku 36: pierwszy element `projekt-czas` [16,17]). Aplikacja pokazuje poprawnie
 *       „Needles, 4 mm (US 6)” (`projekt-narzedzie`, ta sama hierarchia) — oracle BRD spełniony, pada scenariusz. */
describe('E2-139-S3 · 60: po zapisie formularza nie czekamy na element nagłówka przewiniętego ekranu', () => {
  test('po każdym tapOn formularz-zapisz następny krok nie dotyczy projekt-dodaj', () => {
    const l = lista('60');
    const zapisy = l.map((k, i) => (k.nazwa === 'tapOn' && idy(k).includes('formularz-zapisz') ? i : -1)).filter((i) => i >= 0);
    expect(zapisy.length).toBeGreaterThanOrEqual(3);
    for (const i of zapisy) {
      expect(idy(l[i + 1])).not.toContain('projekt-dodaj');
      expect(l[i + 1].nazwa).toBe('extendedWaitUntil');
      expect(idy({ nazwa: 'x', arg: { id: l[i + 1].arg.notVisible?.id } })).toContain('formularz-zapisz');
    }
  });
});

/* S4 · 61 (info): etykieta wiersza części to „Back, 2 of 40 rows” (hierarchia kroku 85), a Maestro dopasowuje cały tekst — „2 of 40 rows” bez prefiksu nie pasuje.
 *       Scenariusz sam zostawił to jako [DO USTALENIA: potwierdzi pierwszy przebieg]; przebieg #139 potwierdził: tekst jest w etykiecie z nazwą części. */
describe('E2-139-S4 · 61: „N of 40 rows” dopasowane do etykiety z nazwą części', () => {
  test('każdy wzorzec „of 40 rows” zaczyna się od .*', () => {
    const l = lista('61');
    const wzorce = l.flatMap((k) => [k.arg, k.arg?.visible, k.arg?.notVisible].filter((x) => typeof x === 'string')) as string[];
    const cele = wzorce.filter((w) => /\d of 40 rows/.test(w));
    expect(cele.length).toBeGreaterThanOrEqual(3);
    for (const w of cele) expect(w.startsWith('.*')).toBe(true);
  });
});

/* S5 · 64 (info): `assertVisible { text: "5 rows", index: 1 }` — drugi blok „5 rows” (miesiąc) leży pod dolną krawędzią ekranu (hierarchia kroku 83: jeden „5 rows”,
 *       `historia-tydzien` kończy się na 849 z 874); element poza ekranem nie występuje w hierarchii iOS. Potrzebne przewinięcie do `historia-miesiac`. */
describe('E2-139-S5 · 64: blok miesiąca wymaga przewinięcia', () => {
  test('przed asercją „5 rows” index 1 jest scrollUntilVisible historia-miesiac w dół', () => {
    const l = lista('64');
    const a = l.findIndex((k) => k.nazwa === 'assertVisible' && k.arg?.text === '5 rows' && k.arg?.index === 1);
    expect(a).toBeGreaterThan(-1);
    const s = l.findIndex((k, i) => i < a && k.nazwa === 'scrollUntilVisible' && idy(k).includes('historia-miesiac'));
    expect(s).toBeGreaterThan(-1);
    expect(String(l[s].arg.direction).toUpperCase()).toBe('DOWN');
  });
});
