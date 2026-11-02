// Stany importu W11 (design-spec „Stany importu”): powód z dodajWzor → alert (tytuł, opis); `anulowano` i strona bez sieci (czeka w skrzynce) bez alertu.
import { alertImportu, alertSkanu, nazwaDomyslna } from '../../src/kompozycja/wzor-dodawanie';
import type { Tlumacz } from '../../src/ekrany/wspolne';
import { tEn } from './pomoc';

let t: Tlumacz;
beforeAll(async () => { t = await tEn(); });

test.each([
  ['uszkodzony', 'Oczko can’t open this file', '“a.pdf” may be damaged.'],
  ['bledne_dane', 'Oczko can’t add this type of file', 'Patterns can be PDFs'],
  ['za_duze', 'This file is too large', 'A pattern can be up to 200 MB.'],
  ['odmowa', 'Oczko can’t save this page', 'The page asks you to sign in'],
  ['pusty', 'Oczko can’t save this page', 'The page asks you to sign in'],
  // E2-A3: plik Word, którego konwersja przekroczyła limit czasu, to nie brak sieci (osobny komunikat, nic po cichu)
  ['przekroczono_czas', 'Oczko couldn’t finish converting this file', '“a.pdf” took too long to convert. Nothing was added. Try again, or save it as a PDF and add the PDF.'],
] as const)('%s → %s', (powod, tytul, opis) => {
  const a = alertImportu(powod, 'a.pdf', t);
  expect(a?.tytul).toBe(tytul);
  expect(a?.opis).toContain(opis);
});
test('anulowano i brak_sieci → bez alertu; inny powód → błąd zapisu wzoru z aneksu 04 (nic po cichu; poprawki 04 D1, P-353 c)', () => {
  expect(alertImportu('anulowano', 'x', t)).toBeNull();
  expect(alertImportu('brak_sieci', 'x', t)).toBeNull();
  const zapis = { tytul: 'Oczko can’t save this pattern', opis: 'Your device may be out of space. Nothing was added. Free some space and try again.' };
  expect(alertImportu('zapis', 'x', t)).toEqual(zapis);
  expect(alertImportu('brak_miejsca', 'x', t)).toEqual(zapis);
  expect(alertImportu('zapis', 'x', t)?.tytul).not.toContain('row'); // nie tekst o liczniku (licznik.blad_zapisu)
});
test('nazwa domyślna: plik bez rozszerzenia, host strony, „Scan …” / „Photos …” z datą', () => {
  expect(nazwaDomyslna({ rodzaj: 'plik', nazwa: 'Harbor Sweater.PDF' }, t, 'Nov 10')).toBe('Harbor Sweater');
  expect(nazwaDomyslna({ rodzaj: 'adres', adres: 'https://www.example.org/wzory/czapka' }, t, 'Nov 10')).toBe('www.example.org');
  expect(nazwaDomyslna({ rodzaj: 'skan' }, t, 'Nov 10')).toBe('Scan Nov 10');
  expect(nazwaDomyslna({ rodzaj: 'zdjecia' }, t, 'Nov 10')).toBe('Photos Nov 10');
});

// W11 „Brak dostępu do aparatu (skaner)” (design-spec :664): skaner zwraca `odmowa` (Skaner.swift), a alert ma mówić o aparacie, nie o stronie WWW.
test('skaner: odmowa → alert braku aparatu z „Open Settings” i „Cancel”; inne powody jak przy imporcie', () => {
  expect(alertSkanu('odmowa', t)).toEqual({ tytul: t('zdjecia.brak_aparatu_tytul'), opis: t('wzor.brak_aparatu_opis'), ustawienia: true });
  expect(alertSkanu('anulowano', t)).toBeNull();
  expect(alertSkanu('zapis', t)).toEqual({ ...alertImportu('zapis', '', t), ustawienia: false });
});
