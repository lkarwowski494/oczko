// M1-audytor-generalny-034 (04-studio-projektowe-007, SP-12): ciąg „A · B” to klisza z kalibracji, chyba że ma zapisaną decyzję.
// Decyzja 04 (design-spec „Aneks M2 partia 3a”, „Separator „ · ””): „ · ” tylko jako separator krótkich metadanych w wierszach list, podpisach
// wierszy, nagłówkach dni i na karcie aktywności; zdania stanu na liczniku i na ekranie projektu bez niego. „→” tylko w wierszu historii licznika.
import * as fs from 'node:fs';
import * as path from 'node:path';

const KORZEN = path.join(__dirname, '..', '..');
const en = JSON.parse(fs.readFileSync(path.join(KORZEN, 'src', 'i18n', 'slowniki', 'en.json'), 'utf8')) as Record<string, unknown>;
const plaski = (o: Record<string, unknown>, p = ''): [string, string][] => Object.entries(o).flatMap(([k, v]) =>
  typeof v === 'string' ? [[p + k, v] as [string, string]] : plaski(v as Record<string, unknown>, `${p}${k}.`));
const wpisy = plaski(en);

/** Metadane w wierszach (decyzja 04, opcja b znaleziska); lista ma się nie rozrastać bez wpisu w design-spec. */
const DOZWOLONE_KROPKA = [
  'aktywnosc.przypomnienie',
  'dane.konflikt_wybor_one', 'dane.konflikt_wybor_other',
  'dni.dzien_one', 'dni.dzien_other', 'dni.rzedy_czas', 'dni.suma_czas',
  'historia.wpis', 'historia.wpis_opis',
  'kosz.czesc', 'kosz.licznik', 'kosz.narzedzie', 'kosz.projekt', 'kosz.wloczka', 'kosz.wzor',
  'probka.z_projektu',
  'projekty.po_terminie_one', 'projekty.po_terminie_other', 'projekty.ukonczono_wiersz', 'projekty.wiersz', 'projekty.wiersz_cel',
  'udostepnij.wiersz',
  'ukonczenie.okres',
  'wzor.etykieta_koniec', 'wzor.wiersz_opis',
  'zapas.motek',
].sort();

test('034: „ · ” tylko w kluczach z listy decyzji 04 (metadane w wierszach)', () => {
  expect(wpisy.filter(([, v]) => v.includes(' · ')).map(([k]) => k).sort()).toEqual(DOZWOLONE_KROPKA);
});

test('034: „→” tylko w wierszu historii licznika', () => {
  expect(wpisy.filter(([, v]) => v.includes('→')).map(([k]) => k).sort()).toEqual(['historia.wpis', 'historia.wpis_opis']);
});

test('034: linia powtórzenia na liczniku to jedno zdanie z nazwą powtórzenia w kluczu, nie sklejone w kodzie', () => {
  expect(wpisy.find(([k]) => k === 'licznik.powtorzenie')?.[1]).toContain('{{nazwa}}');
  expect(fs.readFileSync(path.join(KORZEN, 'src', 'ekrany', 'Licznik.tsx'), 'utf8')).not.toMatch(/ · \$\{t\('licznik\.powtorzenie'/);
});

// M1-audytor-generalny-144 (04-studio-projektowe-527, opcja b): test 034 czytał tylko en.json, więc nie widział „ · ” sklejanego w kodzie
// (linia bliźniaka na liczniku: „Paired part, row 12: note · reminder”). Kontrola źródeł `src/ekrany` i `src/kompozycja`: „ · ” w kodzie
// (poza komentarzami) tylko w plikach z listy wyjątków w design-spec („Separator „ · ””) — metadane wierszy; na liczniku nigdzie.
const KATALOGI_KODU = ['src/ekrany', 'src/kompozycja'];
/** Plik → liczba linii z „ · ” w kodzie. Wyjątki nazwane w design-spec; przeniesienie do słownika w fali 09 (opcja a znaleziska). */
const WYJATKI_KROPKI_W_KODZIE: Record<string, number> = {
  'src/ekrany/Historia.tsx': 2,     // wiersz serii i dopisek „undone” w wierszu historii
  'src/ekrany/ObrazKarty.tsx': 1,   // podpis karty ukończenia: włóczki · części
  'src/ekrany/Oferty.tsx': 2,       // wiersz oferty: nazwa · cena (widoczny i etykieta VoiceOver)
  'src/ekrany/Ukonczenie.tsx': 1,   // podsumowanie: czas · części · dni
  'src/ekrany/Zapas.tsx': 1,        // wiersz wyboru kategorii: numer · nazwa
  'src/kompozycja/zapas.ts': 1,     // wiersz włóczki: kategoria · motki
  'src/kompozycja/e2e/ocena-stan.tsx': 1,      // panel diagnostyczny scenariuszy e2e (nie dla użytkownika)
  'src/kompozycja/e2e/panele.tsx': 1,          // jw.
  'src/kompozycja/e2e/pomiar-operacji.tsx': 1, // jw.
};
const plikiKodu = (kat: string): string[] => fs.readdirSync(path.join(KORZEN, kat), { withFileTypes: true }).flatMap((d) =>
  d.isDirectory() ? plikiKodu(`${kat}/${d.name}`) : /\.(ts|tsx)$/.test(d.name) ? [`${kat}/${d.name}`] : []);
/** Linia bez komentarza: pomija linie komentarzy blokowych i ucina `//` poprzedzone spacją albo początkiem linii. */
const kod = (linia: string): string => (/^\s*(\/\*|\*)/.test(linia) ? '' : linia.replace(/(^|\s)\/\/.*$/, ''));

test('144: „ · ” sklejane w kodzie tylko w plikach z listy wyjątków design-spec; licznik bez „ · ”', () => {
  const znalezione: Record<string, number> = {};
  for (const plik of KATALOGI_KODU.flatMap(plikiKodu)) {
    const ile = fs.readFileSync(path.join(KORZEN, plik), 'utf8').split('\n').filter((l) => kod(l).includes(' · ')).length;
    if (ile > 0) znalezione[plik] = ile;
  }
  expect(znalezione).toEqual(WYJATKI_KROPKI_W_KODZIE);
  expect(Object.keys(znalezione).filter((p) => /\/Licznik[^/]*\.tsx?$/.test(p))).toEqual([]);
});

test('144: lista wyjątków z testu jest w design-spec (sekcja „Separator „ · ””)', () => {
  const spec = fs.readFileSync(path.join(KORZEN, 'docs', 'design', 'archiwum', '2026-11-08-kreski', 'design-spec.md'), 'utf8');
  for (const plik of Object.keys(WYJATKI_KROPKI_W_KODZIE)) expect(spec).toContain(`\`${plik}\``);
});
