// Dodanie wzoru z każdego źródła (F-24, F-55; BR-WZR-001, BR-WZR-002, BR-WZR-007; moduly.md „Kontrakt partii 6”, `dodajWzor`; P-218 (1), Q6a).
// Wyrocznie: kontrakt partii 6 (kolejność: konwersja i sprawdzenie PDF poza transakcją, potem magazyn, potem jedna transakcja), schemat v1 (`wzor.zrodlo`),
// BR-WZR-007 S3 (strona pusta / z logowaniem), WZOR_MAKS_MB. Konwersja to atrapa portu KonwersjaWzoru (kod testu): na urządzeniu moduł `oczko-wzor`.
import { readdirSync, truncateSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Wynik } from '../../src/domena/bledy';
import type { SygnalCzasu, ZrodloWzoru } from '../../src/domena/porty';
import { WZOR_MAKS_MB } from '../../src/konfiguracja';
import { dodajWzor, type KonwersjaPlatformy } from '../../src/przypadki-uzycia/wzor';
import { usunProjekt } from '../../src/przypadki-uzycia/projekt';
import { projekt } from './pomocnicze/dane-wejsciowe';
import { czasWTle, ile, jeden, przygotuj, sha256, wykonaj } from './pomocnicze/srodowisko';

const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
const PDF_ZE_STRONY = Buffer.from('%PDF-1.7\n% strona WWW\n%%EOF\n');

type Atrapa = KonwersjaPlatformy & { wywolania: ZrodloWzoru[]; sprawdzone: string[] };
/** Atrapa konwersji: zapisuje PDF do katalogu tymczasowego (jak moduł natywny) albo zwraca błąd; opcjonalne opóźnienie poza bazą. */
function konwersja(katalog: string, o: { wynik?: Wynik<void>; pdf?: Buffer; opoznienieMs?: number; sprawdz?: Wynik<{ strony: number }> } = {}): Atrapa {
  let n = 0;
  const a: Atrapa = {
    wywolania: [],
    sprawdzone: [],
    async naPdf(z: ZrodloWzoru, _s?: SygnalCzasu) {
      a.wywolania.push(z);
      if (o.opoznienieMs) await new Promise((r) => setTimeout(r, o.opoznienieMs));
      if (o.wynik && !o.wynik.ok) return o.wynik;
      const sciezka = join(katalog, `konwersja-${++n}.pdf`);
      writeFileSync(sciezka, o.pdf ?? PDF_ZE_STRONY);
      return { ok: true, wartosc: { sciezka, strony: 2 } };
    },
    async sprawdzPdf(sciezka: string) {
      a.sprawdzone.push(sciezka);
      return o.sprawdz ?? { ok: true, wartosc: { strony: 2 } };
    },
  };
  return a;
}

async function srodowisko(o: Parameters<typeof konwersja>[1] = {}, trybDeweloperski = false) {
  const s = await przygotuj({ trybDeweloperski });
  await wykonaj(s.baza, [projekt('p1', 'Sweter')]);
  const k = konwersja(s.z.katalogi.tymczasowy, o);
  return { s, k, z: { ...s.z, konwersja: k, czasWTle } };
}
const plikWe = (katalog: string, nazwa: string, tresc: Buffer, typ: string) => {
  const sciezka = join(katalog, nazwa);
  writeFileSync(sciezka, tresc);
  return { id: nazwa, nazwa, sciezka, typ };
};

test('PDF z Plików → jeden wzór `pdf` z nazwą, wiersz `plik` i plik w magazynie (BR-WZR-001 S1); PDF sprawdzony przed zapisem, bez konwersji', async () => {
  const { s, k, z } = await srodowisko();
  const p = plikWe(s.katalog, 'Harbor.pdf', PDF, 'application/pdf');
  const w = await dodajWzor(z, { projektId: 'p1', nazwa: 'Harbor', zrodlo: { rodzaj: 'pdf', plik: p } });
  expect(w.ok).toBe(true);
  expect(k.wywolania).toEqual([]);
  expect(k.sprawdzone).toEqual([p.sciezka]);
  expect(await jeden(s.baza, 'SELECT projekt_id, nazwa, zrodlo, pdf_sha256, oryginal_sha256, adres, usunieto_ms, strony FROM wzor'))
    .toEqual({ projekt_id: 'p1', nazwa: 'Harbor', zrodlo: 'pdf', pdf_sha256: sha256(PDF), oryginal_sha256: null, adres: null, usunieto_ms: null, strony: 2 }); // strony: P-252
  expect(await jeden(s.baza, 'SELECT rozszerzenie, bajty FROM plik')).toEqual({ rozszerzenie: 'pdf', bajty: PDF.length });
  expect(readdirSync(s.magazyn.katalog)).toEqual([`${sha256(PDF)}.pdf`]);
});

test('Word → PDF z konwersji i oryginał .docx (dwa pliki), `zrodlo = word` (BR-WZR-007 S2, P-221 Q2a)', async () => {
  const { s, k, z } = await srodowisko();
  const docx = Buffer.from('PK\u0003\u0004 word/document.xml');
  const p = plikWe(s.katalog, 'Skarpety.docx', docx, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  const w = await dodajWzor(z, { projektId: 'p1', nazwa: 'Skarpety', zrodlo: { rodzaj: 'word', plik: p } });
  expect(w.ok).toBe(true);
  expect(k.wywolania).toEqual([{ rodzaj: 'word', sciezka: p.sciezka }]);
  expect(await jeden(s.baza, 'SELECT zrodlo, pdf_sha256, oryginal_sha256 FROM wzor')).toEqual({ zrodlo: 'word', pdf_sha256: sha256(PDF_ZE_STRONY), oryginal_sha256: sha256(docx) });
  expect(await ile(s.baza, 'plik')).toBe(2);
});

test('kilka zdjęć → jedna konwersja i dokładnie jeden wzór `obraz` (P-218 (1), Q6a: jeden import = jeden wzór)', async () => {
  const { s, k, z } = await srodowisko();
  const sciezki = ['a.jpg', 'b.jpg', 'c.jpg'].map((n) => plikWe(s.katalog, n, Buffer.from(n), 'image/jpeg').sciezka);
  expect((await dodajWzor(z, { projektId: 'p1', nazwa: 'Zdjęcia', zrodlo: { rodzaj: 'obrazy', sciezki } })).ok).toBe(true);
  expect(k.wywolania).toEqual([{ rodzaj: 'obrazy', sciezki }]);
  expect(await jeden(s.baza, 'SELECT count(*) AS n, min(zrodlo) AS zrodlo FROM wzor')).toEqual({ n: 1, zrodlo: 'obraz' });
});

test('adres strony → PDF strony, `zrodlo = www` z adresem źródła (BR-WZR-007 S1)', async () => {
  const { s, k, z } = await srodowisko();
  const adres = 'https://example.org/wzory/czapka';
  expect((await dodajWzor(z, { projektId: 'p1', nazwa: 'Czapka', zrodlo: { rodzaj: 'adres', adres } })).ok).toBe(true);
  expect(k.wywolania).toEqual([{ rodzaj: 'adres', adres }]);
  expect(await jeden(s.baza, 'SELECT zrodlo, adres, pdf_sha256 FROM wzor')).toEqual({ zrodlo: 'www', adres, pdf_sha256: sha256(PDF_ZE_STRONY) });
});

test.each([
  ['brak_sieci', { wynik: { ok: false, powod: 'brak_sieci' } }],
  ['odmowa', { wynik: { ok: false, powod: 'odmowa' } }],
  ['pusty', { sprawdz: { ok: false, powod: 'pusty' } }],
  ['uszkodzony', { sprawdz: { ok: false, powod: 'uszkodzony' } }],
] as const)('strona: %s → ten powód, nic nie dodane (bez wiersza wzoru, pliku i wpisu w magazynie; BR-WZR-007 S3)', async (powod, o) => {
  const { s, z } = await srodowisko(o);
  expect(await dodajWzor(z, { projektId: 'p1', nazwa: 'Strona', zrodlo: { rodzaj: 'adres', adres: 'https://example.org/x' } })).toEqual({ ok: false, powod });
  expect(await ile(s.baza, 'wzor')).toBe(0);
  expect(await ile(s.baza, 'plik')).toBe(0);
  expect(readdirSync(s.magazyn.katalog)).toEqual([]);
});

test.each(['', 'wzór na czapkę', 'ftp://example.org/a.pdf', 'javascript:alert(1)', 'file:///etc/passwd'])('zły adres „%s” → bledne_dane, bez konwersji', async (adres) => {
  const { k, z } = await srodowisko();
  expect(await dodajWzor(z, { projektId: 'p1', nazwa: 'Strona', zrodlo: { rodzaj: 'adres', adres } })).toEqual({ ok: false, powod: 'bledne_dane' });
  expect(k.wywolania).toEqual([]);
});

test('plik większy niż WZOR_MAKS_MB → za_duze przed konwersją i zapisem (ADR-0011)', async () => {
  const { s, k, z } = await srodowisko();
  const sciezka = join(s.katalog, 'duzy.docx');
  writeFileSync(sciezka, '');
  truncateSync(sciezka, WZOR_MAKS_MB * 1024 * 1024 + 1); // plik rzadki: bez zapisu 200 MB na dysk
  expect(await dodajWzor(z, { projektId: 'p1', nazwa: 'Duży', zrodlo: { rodzaj: 'word', plik: { id: 'd', nazwa: 'duzy.docx', sciezka, typ: 'application/msword' } } })).toEqual({ ok: false, powod: 'za_duze' });
  expect(k.wywolania).toEqual([]);
  expect(await ile(s.baza, 'wzor')).toBe(0);
});

test('projekt w koszu → niedozwolone_przejscie, bez wzoru; nieistniejący projekt → bledne_dane; pusta nazwa → bledne_dane', async () => {
  const { s, z } = await srodowisko();
  const p = plikWe(s.katalog, 'a.pdf', PDF, 'application/pdf');
  expect(await dodajWzor(z, { projektId: 'nie-ma', nazwa: 'A', zrodlo: { rodzaj: 'pdf', plik: p } })).toEqual({ ok: false, powod: 'bledne_dane' });
  expect(await dodajWzor(z, { projektId: 'p1', nazwa: '  ', zrodlo: { rodzaj: 'pdf', plik: p } })).toEqual({ ok: false, powod: 'bledne_dane' });
  await usunProjekt(s.z, { projektId: 'p1' });
  expect(await dodajWzor(z, { projektId: 'p1', nazwa: 'A', zrodlo: { rodzaj: 'pdf', plik: p } })).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
  expect(await ile(s.baza, 'wzor')).toBe(0);
});

test('ARCH-13, ADR-0002: konwersja czekająca na sieć (timer) idzie poza transakcją — tryb deweloperski portu nie zgłasza błędu', async () => {
  const { s, z } = await srodowisko({ opoznienieMs: 20 }, true);
  expect((await dodajWzor(z, { projektId: 'p1', nazwa: 'Wolna strona', zrodlo: { rodzaj: 'adres', adres: 'https://example.org/wolna' } })).ok).toBe(true);
  expect(await ile(s.baza, 'wzor')).toBe(1);
  expect(await ile(s.baza, 'blad')).toBe(0);
});

test('drugi import tego samego PDF do projektu = drugi wzór (osobny wiersz), plik w magazynie raz (UPSERT DO NOTHING)', async () => {
  const { s, z } = await srodowisko();
  const p = plikWe(s.katalog, 'a.pdf', PDF, 'application/pdf');
  await dodajWzor(z, { projektId: 'p1', nazwa: 'A', zrodlo: { rodzaj: 'pdf', plik: p } });
  await dodajWzor(z, { projektId: 'p1', nazwa: 'A', zrodlo: { rodzaj: 'pdf', plik: p } });
  expect(await ile(s.baza, 'wzor')).toBe(2);
  expect(await ile(s.baza, 'plik')).toBe(1);
});

// P-353 (b), ADR-0031 pkt 5: Word to wyłącznie .docx — .doc odsiewa `rodzajPliku` przed dodajWzor, więc gałąź „oryginał .doc” była nieosiągalna i usunięto ją
// razem z dawnym testem („przegląd 2026-10-26”). Oryginał Worda trafia do magazynu zawsze jako docx.
test('oryginał Word zapisany zawsze z rozszerzeniem docx (bez gałęzi .doc)', async () => {
  const { s, z } = await srodowisko();
  const p = plikWe(s.katalog, 'Stary.doc', Buffer.from('ÐÏ doc'), 'application/msword');
  expect((await dodajWzor(z, { projektId: 'p1', nazwa: 'Stary', zrodlo: { rodzaj: 'word', plik: p } })).ok).toBe(true);
  expect(await ile(s.baza, 'plik', "rozszerzenie = 'doc'")).toBe(0);
  expect(await ile(s.baza, 'plik', "rozszerzenie = 'docx'")).toBe(1);
});
