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
