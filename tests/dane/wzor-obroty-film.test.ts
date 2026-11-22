// P-246 (S3a, S4a): obrót strony wzoru w schemacie v1 (`wzor.obroty`, JSON strona → kąt, synchronizowany z wzorem) i link do filmu w projekcie
// (`projekt.film_adres`, `projekt.film_nazwa`; jeden film na projekt, makieta W8; P-218 (4): film poza wzorem). Zlecenie „Video link” z rozszerzenia
// (`ZlecenieImportu.rodzaj = 'film'`) zapisuje film projektu, nie wzór. Wyrocznie: P-246, design-spec W8 i „Obrót strony”, icloud-tabele.json.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { skrzynkaWKatalogu } from '../../src/platforma/skrzynka';
import { przetworzSkrzynke } from '../../src/przypadki-uzycia/skrzynka';
import { usunWzor } from '../../src/przypadki-uzycia/wzor';
import { obrotyWzoru, ustawObrot } from '../../src/przypadki-uzycia/wzor-widok';
import { filmProjektu, projektyZFilmem, ustawFilm, usunFilm } from '../../src/przypadki-uzycia/film';
import { usunProjekt } from '../../src/przypadki-uzycia/projekt';
import { plik, projekt, wzor } from './pomocnicze/dane-wejsciowe';
import { T0, czasWTle, ile, jeden, katalogTymczasowy, przygotuj, wlozPlik, wykonaj } from './pomocnicze/srodowisko';

const OK = { ok: true, wartosc: undefined };
const PDF = Buffer.from('%PDF-1.4\n%%EOF\n');
async function srodowisko() {
  const s = await przygotuj();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Harbor'), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h)]);
  return s;
}

describe('obrót strony (S3a)', () => {
  test('domyślnie bez obrotów; obrót strony 2 o 90° i strony 0 o 270° zapisany jako JSON; 0° usuwa wpis; zmieniono_ms przesunięte', async () => {
    const s = await srodowisko();
    expect(await jeden(s.baza, "SELECT obroty FROM wzor WHERE id = 'w1'")).toEqual({ obroty: '{}' });
    s.zegar.przesun(1000);
    expect(await ustawObrot(s.z, { wzorId: 'w1', strona: 2, kat: 90 })).toEqual(OK);
    expect(await ustawObrot(s.z, { wzorId: 'w1', strona: 0, kat: 270 })).toEqual(OK);
    expect(await obrotyWzoru(s.z, { wzorId: 'w1' })).toEqual({ ok: true, wartosc: { 0: 270, 2: 90 } });
    expect(await jeden(s.baza, "SELECT zmieniono_ms FROM wzor WHERE id = 'w1'")).toEqual({ zmieniono_ms: T0 + 1000 });
    await ustawObrot(s.z, { wzorId: 'w1', strona: 2, kat: 0 });
    expect(await obrotyWzoru(s.z, { wzorId: 'w1' })).toEqual({ ok: true, wartosc: { 0: 270 } });
  });
  test('zły kąt albo strona → bledne_dane; wzór w koszu → niedozwolone_przejscie', async () => {
    const s = await srodowisko();
    expect(await ustawObrot(s.z, { wzorId: 'w1', strona: 0, kat: 45 as 90 })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await ustawObrot(s.z, { wzorId: 'w1', strona: -1, kat: 90 })).toEqual({ ok: false, powod: 'bledne_dane' });
    await usunWzor(s.z, { wzorId: 'w1' });
    expect(await ustawObrot(s.z, { wzorId: 'w1', strona: 0, kat: 90 })).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
  });
  test('synchronizacja włączona: obrót trafia do skrzynki zmian jako zmiana wzoru (kolumna synchronizowana)', async () => {
    const s = await srodowisko();
    await wykonaj(s.baza, [['UPDATE synchronizacja SET wlaczona = 1 WHERE id = 1', []]]);
    await ustawObrot(s.z, { wzorId: 'w1', strona: 1, kat: 180 });
    expect(await ile(s.baza, 'zmiana_icloud', "encja = 'wzor' AND klucz = 'w1'")).toBe(1);
  });
});

describe('film projektu (S4a)', () => {
  test('ustawienie, zmiana i usunięcie linku; adres tylko http(s); projekt w koszu → niedozwolone_przejscie', async () => {
    const s = await srodowisko();
    expect(await ustawFilm(s.z, { projektId: 'p1', adres: ' https://video.example/abc ', nazwa: 'Cable cast-on' })).toEqual(OK);
    expect(await jeden(s.baza, "SELECT film_adres, film_nazwa FROM projekt WHERE id = 'p1'")).toEqual({ film_adres: 'https://video.example/abc', film_nazwa: 'Cable cast-on' });
    expect(await ustawFilm(s.z, { projektId: 'p1', adres: 'https://video.example/def', nazwa: '  ' })).toEqual(OK);
    expect(await jeden(s.baza, "SELECT film_adres, film_nazwa FROM projekt WHERE id = 'p1'")).toEqual({ film_adres: 'https://video.example/def', film_nazwa: null });
    expect(await ustawFilm(s.z, { projektId: 'p1', adres: 'javascript:alert(1)', nazwa: '' })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await usunFilm(s.z, { projektId: 'p1' })).toEqual(OK);
    expect(await jeden(s.baza, "SELECT film_adres, film_nazwa FROM projekt WHERE id = 'p1'")).toEqual({ film_adres: null, film_nazwa: null });
    await usunProjekt(s.z, { projektId: 'p1' });
    expect(await ustawFilm(s.z, { projektId: 'p1', adres: 'https://video.example/x', nazwa: '' })).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
  });

  test('P-276: odczyt filmu projektu do wiersza „Video” — brak = null; po ustawieniu adres i nazwa (pusta nazwa = null); po usunięciu null', async () => {
    const s = await srodowisko();
    expect(await filmProjektu(s.z, { projektId: 'p1' })).toEqual({ ok: true, wartosc: null });
    await ustawFilm(s.z, { projektId: 'p1', adres: 'https://video.example/abc', nazwa: 'Cable cast-on' });
    expect(await filmProjektu(s.z, { projektId: 'p1' })).toEqual({ ok: true, wartosc: { adres: 'https://video.example/abc', nazwa: 'Cable cast-on' } });
    await ustawFilm(s.z, { projektId: 'p1', adres: 'https://video.example/def', nazwa: '' });
    expect(await filmProjektu(s.z, { projektId: 'p1' })).toEqual({ ok: true, wartosc: { adres: 'https://video.example/def', nazwa: null } });
    await usunFilm(s.z, { projektId: 'p1' });
    expect(await filmProjektu(s.z, { projektId: 'p1' })).toEqual({ ok: true, wartosc: null });
    expect(await filmProjektu(s.z, { projektId: 'brak' })).toEqual({ ok: false, powod: 'bledne_dane' });
  });

  test('P-283: projekty z filmem (arkusz skrzynki) — tylko z linkiem', async () => {
    const s = await srodowisko();
    expect(await projektyZFilmem(s.z)).toEqual({ ok: true, wartosc: [] });
    await ustawFilm(s.z, { projektId: 'p1', adres: 'https://video.example/abc', nazwa: '' });
    expect(await projektyZFilmem(s.z)).toEqual({ ok: true, wartosc: ['p1'] });
  });

  test('zlecenie „Video link” z rozszerzenia (rodzaj film) → film projektu, bez wzoru i bez konwersji; zlecenie usunięte', async () => {
    const s = await srodowisko();
    const grupa = katalogTymczasowy('oczko-grupa-');
    const k = join(grupa, 'skrzynka', 'f1');
    mkdirSync(k, { recursive: true });
    writeFileSync(join(k, 'zlecenie.json'), JSON.stringify({ id: 'f1', rodzaj: 'film', nazwa: 'Cable cast-on', sciezki: [], adres: 'https://video.example/abc', typ: 'public.url', projektId: 'p1', utworzonoMs: T0 }));
    const konwersja = { naPdf: jest.fn(), sprawdzPdf: jest.fn() };
    const w = await przetworzSkrzynke({ ...s.z, konwersja, czasWTle, skrzynka: skrzynkaWKatalogu(grupa, () => T0) });
    expect(w).toMatchObject({ ok: true, wartosc: { zaimportowano: 1, bledy: [] } });
    expect(konwersja.naPdf).not.toHaveBeenCalled();
    expect(await jeden(s.baza, "SELECT film_adres, film_nazwa FROM projekt WHERE id = 'p1'")).toEqual({ film_adres: 'https://video.example/abc', film_nazwa: 'Cable cast-on' });
    expect(await ile(s.baza, 'wzor')).toBe(1); // tylko wzór z danych wejściowych
    expect(existsSync(k)).toBe(false);
  });
});
