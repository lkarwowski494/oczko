// Kompozycja partii 6 (moduly.md „Kontrakt partii 6”, P-246 odstępstwo: krok skrzynki po danych startu, poza kolejką `uruchomDane`): po starcie
// zlecenie testowe E2E (oczkoE2eSkrzynka), przetworzenie skrzynki, migawka projektów; stan arkusza skrzynki dla listy projektów (scenariusz 52).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { kompozycjaWzoru } from '../../src/kompozycja/wzor';
import { migawkaWKatalogu } from '../../src/platforma/migawka';
import { skrzynkaWKatalogu } from '../../src/platforma/skrzynka';
import { pdfTestowy, wlozZlecenieTestowe } from '../../src/kompozycja/e2e/skrzynka';
import { projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { czasWTle, ile, jeden, katalogTymczasowy, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';

async function srodowisko(o: { e2e?: boolean } = {}) {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Harbor Sweater')]);
  const grupa = katalogTymczasowy('oczko-grupa-');
  const konwersja = { naPdf: jest.fn(), sprawdzPdf: jest.fn(async () => ({ ok: true as const, wartosc: { strony: 2 } })) };
  const z = { ...s.z, konwersja, czasWTle, skrzynka: skrzynkaWKatalogu(grupa, () => s.zegar.teraz().ms), migawka: migawkaWKatalogu(grupa, () => s.zegar.teraz().ms), jezyk: () => 'en' };
  const k = kompozycjaWzoru(z, { grupa, zlecenieE2e: o.e2e ? wlozZlecenieTestowe : null });
  return { s, grupa, k, z };
}

test('start z oczkoE2eSkrzynka=pdf: zlecenie bez projektu czeka na wybór (arkusz), migawka zapisana; wybór projektu dodaje wzór i zamyka arkusz', async () => {
  const { s, grupa, k } = await srodowisko({ e2e: true });
  const zmiany = jest.fn();
  k.naZmiane(zmiany);
  await k.poStarcie();
  expect(k.stan().doWyboru.map((x) => x.nazwa)).toEqual(['Harbor test pattern.pdf']);
  expect(zmiany).toHaveBeenCalled();
  expect(JSON.parse(readFileSync(join(grupa, 'projekty-migawka.json'), 'utf8')).projekty.map((p: { nazwa: string }) => p.nazwa)).toEqual(['Harbor Sweater']);
  expect(await k.wybierzProjekt('p1')).toEqual({ ok: true, wartosc: 1 });
  expect(k.stan().doWyboru).toEqual([]);
  expect(await jeden(s.baza, 'SELECT projekt_id, zrodlo FROM wzor')).toEqual({ projekt_id: 'p1', zrodlo: 'pdf' });
  expect(JSON.parse(readFileSync(join(grupa, 'projekty-migawka.json'), 'utf8')).projekty[0].wzory).toBe(1);
});

test('„Not now” zostawia zlecenia w skrzynce i chowa arkusz do następnego startu; bez E2E skrzynka pusta', async () => {
  const { s, k } = await srodowisko({ e2e: true });
  await k.poStarcie();
  k.nieTeraz();
  expect(k.stan().doWyboru).toEqual([]);
  expect(await ile(s.baza, 'wzor')).toBe(0);
  await k.poStarcie();
  expect(k.stan().doWyboru).toHaveLength(1);
  const b = await srodowisko();
  await b.k.poStarcie();
  expect(b.k.stan().doWyboru).toEqual([]);
});

test('„New project” w arkuszu: projekt powstaje z nazwą pliku i dostaje wzór', async () => {
  const { s, k } = await srodowisko({ e2e: true });
  await k.poStarcie();
  expect(await k.wybierzProjekt(null)).toEqual({ ok: true, wartosc: 1 });
  expect(await jeden(s.baza, "SELECT p.nazwa FROM wzor w JOIN projekt p ON p.id = w.projekt_id")).toEqual({ nazwa: 'Harbor test pattern' });
  expect(pdfTestowy().length).toBeGreaterThan(100);
});

describe('poprawki po przeglądzie (2026-10-26)', () => {
  test('dwa stuknięcia w projekt arkusza skrzynki → jeden import (bez duplikatu wzoru); arkusz chowa się od razu', async () => {
    const { s, k } = await srodowisko({ e2e: true });
    await k.poStarcie();
    const [a, b] = [k.wybierzProjekt('p1'), k.wybierzProjekt('p1')];
    expect(k.stan().doWyboru).toEqual([]);
    await Promise.all([a, b]);
    expect(await ile(s.baza, 'wzor')).toBe(1);
  });
  test('usunięcie pozycji „czeka na sieć” znika też z listy oczekujących', async () => {
    const { k } = await srodowisko();
    const zl = { id: 'x', rodzaj: 'adres' as const, nazwa: 'example.org', sciezki: [], adres: 'https://example.org/', typ: 'public.url', projektId: 'p1', utworzonoMs: 0 };
    k.ustawStanTestowy({ doWyboru: [], czekaSiec: [zl], bledy: [] });
    await k.potwierdzBlad('x');
    expect(k.stan().czekaSiec).toEqual([]);
  });
  test('zlecenie testowe E2E wkładane raz na proces (po imporcie nie wraca przy powrocie na pierwszy plan)', async () => {
    const { k } = await srodowisko({ e2e: true });
    await k.poStarcie();
    await k.wybierzProjekt('p1');
    await k.poStarcie();
    expect(k.stan().doWyboru).toEqual([]);
  });
});

test('P-276: zapis i usunięcie filmu z ekranu projektu odświeżają migawkę — flaga film dla rozszerzenia (linia udostepnij.film_zastapi)', async () => {
  const { grupa, k } = await srodowisko();
  const film = () => JSON.parse(readFileSync(join(grupa, 'projekty-migawka.json'), 'utf8')).projekty[0].film;
  expect(await k.zapiszFilm('p1', { adres: 'https://video.example/a', nazwa: 'Seaming' })).toEqual({ ok: true, wartosc: undefined });
  expect(film()).toBe(true);
  expect(await k.usunFilm('p1')).toEqual({ ok: true, wartosc: undefined });
  expect(film()).toBe(false);
  expect((await k.zapiszFilm('p1', { adres: 'javascript:alert(1)', nazwa: '' })).ok).toBe(false);
});
