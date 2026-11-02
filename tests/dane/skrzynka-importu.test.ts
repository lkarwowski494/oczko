// Skrzynka importu „Udostępnij do Oczka” (ADR-0011 fix-7; moduly.md „Kontrakt partii 6”: cel targets/share, przetworzSkrzynke; P-220 R1a/R2, P-230 Q2a).
// Wyrocznie: kontrakt (manifest zapisany na końcu; katalog bez manifestu usuwany dopiero po SKRZYNKA_PORZUCONE_H; projekt dostępny → dodajWzor i usunięcie
// zlecenia; projekt niedostępny albo brak → do wyboru; błąd importu → zlecenie zostaje, wpis w `blad`, nic nie ginie po cichu), design-spec R2.
import { existsSync, mkdirSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ZlecenieImportu } from '../../src/domena/porty';
import { SKRZYNKA_PORZUCONE_H } from '../../src/konfiguracja';
import { skrzynkaWKatalogu } from '../../src/platforma/skrzynka';
import { pdfTestowy, wlozZlecenieTestowe } from '../../src/kompozycja/e2e/skrzynka';
import { odrzucZlecenie, przetworzSkrzynke, przypiszZlecenie } from '../../src/przypadki-uzycia/skrzynka';
import { usunProjekt } from '../../src/przypadki-uzycia/projekt';
import type { KonwersjaPlatformy } from '../../src/przypadki-uzycia/wzor';
import { projekt } from './pomocnicze/dane-wejsciowe';
import { GODZ, T0, czasWTle, ile, jeden, katalogTymczasowy, przygotuj, wykonaj } from './pomocnicze/srodowisko';

const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n');

/** Zlecenie jak zapisuje je rozszerzenie: plik, potem manifest `zlecenie.json` (ścieżka pliku względna). */
function zlecenie(grupa: string, id: string, o: Partial<ZlecenieImportu> & { plik?: Buffer | null; nazwaPliku?: string; dodatkowe?: string[] } = {}): void {
  const k = join(grupa, 'skrzynka', id);
  mkdirSync(k, { recursive: true });
  const nazwaPliku = o.nazwaPliku ?? 'Harbor.pdf';
  if (o.plik !== null) writeFileSync(join(k, nazwaPliku), o.plik ?? PDF);
  for (const d of o.dodatkowe ?? []) writeFileSync(join(k, d), Buffer.from(d));
  const m = { id, rodzaj: o.rodzaj ?? 'plik', nazwa: o.nazwa ?? 'Harbor.pdf', sciezki: o.rodzaj === 'adres' ? [] : [nazwaPliku, ...(o.dodatkowe ?? [])], adres: o.adres ?? null,
    typ: o.typ ?? 'application/pdf', projektId: o.projektId === undefined ? 'p1' : o.projektId, utworzonoMs: o.utworzonoMs ?? T0 };
  writeFileSync(join(k, 'zlecenie.json'), JSON.stringify(m));
}
const konwersja = (wynik?: 'brak_sieci' | 'przekroczono_czas'): KonwersjaPlatformy => ({
  async naPdf() { return wynik ? { ok: false, powod: wynik } : { ok: false, powod: 'bledne_dane' }; },
  async sprawdzPdf(sciezka) { return sciezka.endsWith('.pdf') && !sciezka.includes('zepsuty') ? { ok: true, wartosc: { strony: 1 } } : { ok: false, powod: 'uszkodzony' }; },
});
async function srodowisko(o: { siec?: 'brak'; konwersja?: 'przekroczono_czas' } = {}) {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Harbor'), projekt('p2', 'Scarf')]);
  const grupa = katalogTymczasowy('oczko-grupa-');
  const skrzynka = skrzynkaWKatalogu(grupa, () => s.zegar.teraz().ms);
  return { s, grupa, skrzynka, z: { ...s.z, konwersja: konwersja(o.siec ? 'brak_sieci' : o.konwersja), czasWTle, skrzynka } };
}

describe('adapter skrzynki w App Group (manifest na końcu, porzucone)', () => {
  test('zlecenie z manifestem → pobierz z bezwzględną ścieżką pliku', async () => {
    const { grupa, skrzynka } = await srodowisko();
    zlecenie(grupa, 'z1');
    expect(await skrzynka.pobierz()).toEqual([{ id: 'z1', rodzaj: 'plik', nazwa: 'Harbor.pdf', sciezki: [join(grupa, 'skrzynka', 'z1', 'Harbor.pdf')], adres: null, typ: 'application/pdf', projektId: 'p1', utworzonoMs: T0 }]);
  });

  test('katalog bez manifestu (rozszerzenie jeszcze kopiuje) nie jest zleceniem i zostaje przed SKRZYNKA_PORZUCONE_H; potem usunięty', async () => {
    const { s, grupa, skrzynka } = await srodowisko();
    const k = join(grupa, 'skrzynka', 'niepelne');
    mkdirSync(k, { recursive: true });
    writeFileSync(join(k, 'Harbor.pdf'), PDF.subarray(0, 10));
    const t = new Date(s.zegar.teraz().ms - (SKRZYNKA_PORZUCONE_H * GODZ - 60_000));
    utimesSync(k, t, t);
    expect(await skrzynka.pobierz()).toEqual([]);
    expect(existsSync(k)).toBe(true);
    const stary = new Date(s.zegar.teraz().ms - SKRZYNKA_PORZUCONE_H * GODZ - 1000);
    utimesSync(k, stary, stary);
    expect(await skrzynka.pobierz()).toEqual([]);
    expect(existsSync(k)).toBe(false);
  });

  test('brak katalogu grupy (App Group niedostępna) → pusta skrzynka, bez wyjątku', async () => {
    const s = skrzynkaWKatalogu(null, () => T0);
    expect(await s.pobierz()).toEqual([]);
    await expect(s.usun('x')).resolves.toBeUndefined();
  });

  test('manifest uszkodzony → nie jest zleceniem (jak niepełne)', async () => {
    const { grupa, skrzynka } = await srodowisko();
    const k = join(grupa, 'skrzynka', 'zly');
    mkdirSync(k, { recursive: true });
    writeFileSync(join(k, 'zlecenie.json'), '{"id": "zly", "rodzaj": ');
    expect(await skrzynka.pobierz()).toEqual([]);
  });
});

describe('przetworzSkrzynke (start i powrót na pierwszy plan)', () => {
  test('projekt w toku → wzór dodany, zlecenie usunięte ze skrzynki', async () => {
    const { s, grupa, z } = await srodowisko();
    zlecenie(grupa, 'z1');
    expect(await przetworzSkrzynke(z)).toEqual({ ok: true, wartosc: { zaimportowano: 1, doWyboru: [], czekaSiec: [], bledy: [] } });
    expect(await jeden(s.baza, 'SELECT projekt_id, nazwa, zrodlo FROM wzor')).toEqual({ projekt_id: 'p1', nazwa: 'Harbor', zrodlo: 'pdf' });
    expect(existsSync(join(grupa, 'skrzynka', 'z1'))).toBe(false);
  });

  test('bez projektu albo projekt niedostępny (kosz, ukończony, nie ma) → do wyboru; nic nie dodane, zlecenia zostają', async () => {
    const { s, grupa, z } = await srodowisko();
    await wykonaj(s.baza, [projekt('p3', 'Mittens', T0, { stan: 'ukonczony', ukonczono: T0 })]);
    await usunProjekt(s.z, { projektId: 'p1' });
    zlecenie(grupa, 'a', { projektId: null, utworzonoMs: T0 + 1 });
    zlecenie(grupa, 'b', { projektId: 'p1', utworzonoMs: T0 + 2 });
    zlecenie(grupa, 'c', { projektId: 'p3', utworzonoMs: T0 + 3 });
    zlecenie(grupa, 'd', { projektId: 'nie-ma', utworzonoMs: T0 + 4 });
    const w = await przetworzSkrzynke(z);
    expect(w.ok && w.wartosc.doWyboru.map((x) => x.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(await ile(s.baza, 'wzor')).toBe(0);
    expect(['a', 'b', 'c', 'd'].every((id) => existsSync(join(grupa, 'skrzynka', id)))).toBe(true);
  });

  test('strona bez sieci → czeka w skrzynce bez błędu (`wzor.czeka_siec`), zapis przy następnym przetworzeniu', async () => {
    const { s, grupa, z } = await srodowisko({ siec: 'brak' });
    zlecenie(grupa, 'www', { rodzaj: 'adres', adres: 'https://example.org/czapka', nazwa: 'example.org', typ: 'public.url', plik: null });
    const w = await przetworzSkrzynke(z);
    expect(w.ok && [w.wartosc.zaimportowano, w.wartosc.czekaSiec.map((x) => x.id), w.wartosc.bledy]).toEqual([0, ['www'], []]);
    expect(existsSync(join(grupa, 'skrzynka', 'www'))).toBe(true);
    expect(await ile(s.baza, 'blad')).toBe(0);
  });

  test('E2-A3: Word, którego konwersja przekroczyła czas → błąd z własnym powodem (alert z przyczyną), nie „czeka na sieć”; zlecenie zostaje do potwierdzenia', async () => {
    const { grupa, z } = await srodowisko({ konwersja: 'przekroczono_czas' });
    zlecenie(grupa, 'w1', { nazwaPliku: 'Harbor.docx', nazwa: 'Harbor.docx', typ: 'org.openxmlformats.wordprocessingml.document' });
    const w = await przetworzSkrzynke(z);
    expect(w.ok && [w.wartosc.czekaSiec, w.wartosc.bledy.map((b) => b.powod)]).toEqual([[], ['przekroczono_czas']]);
    expect(existsSync(join(grupa, 'skrzynka', 'w1'))).toBe(true);
  });

  test('błąd importu (plik uszkodzony) → zlecenie zostaje do potwierdzenia, wpis w `blad`, powód dla alertu; odrzucenie usuwa', async () => {
    const { s, grupa, z } = await srodowisko();
    zlecenie(grupa, 'z1', { nazwaPliku: 'zepsuty.pdf', nazwa: 'zepsuty.pdf' });
    const w = await przetworzSkrzynke(z);
    expect(w.ok && w.wartosc.bledy).toEqual([{ zlecenie: expect.objectContaining({ id: 'z1', nazwa: 'zepsuty.pdf' }), powod: 'uszkodzony' }]);
    expect(existsSync(join(grupa, 'skrzynka', 'z1'))).toBe(true);
    expect(await jeden(s.baza, 'SELECT kod FROM blad')).toEqual({ kod: 'skrzynka_import' });
    await odrzucZlecenie(z, { id: 'z1' });
    expect(existsSync(join(grupa, 'skrzynka', 'z1'))).toBe(false);
  });

  test('nieobsługiwany typ pliku → błąd z powodem `bledne_dane` (alert „can’t add this type”), bez konwersji', async () => {
    const { grupa, z } = await srodowisko();
    zlecenie(grupa, 'z1', { nazwaPliku: 'a.zip', nazwa: 'a.zip', typ: 'application/zip' });
    const w = await przetworzSkrzynke(z);
    expect(w.ok && w.wartosc.bledy.map((b) => b.powod)).toEqual(['bledne_dane']);
  });

  // 07-jakosc-017 (K-17h, ADR-0031 pkt 5): Word to wyłącznie .docx — zlecenie .doc (UTI com.microsoft.word.doc, msword) nie trafia do konwersji.
  test.each([
    ['stary.doc', 'application/msword'],
    ['stary.doc', 'com.microsoft.word.doc'],
  ])('K-17h: zlecenie %s (%s) → `bledne_dane` (alert „can’t add this type”), konwersja nie jest wołana, zlecenie zostaje do potwierdzenia', async (nazwa, typ) => {
    const { grupa, z } = await srodowisko();
    const naPdf = jest.fn(async () => ({ ok: false as const, powod: 'bledne_dane' as const }));
    zlecenie(grupa, 'z1', { nazwaPliku: nazwa, nazwa, typ });
    const w = await przetworzSkrzynke({ ...z, konwersja: { ...z.konwersja, naPdf } });
    expect(w.ok && w.wartosc.bledy.map((b) => b.powod)).toEqual(['bledne_dane']);
    expect(naPdf).not.toHaveBeenCalled();
  });
  test('K-17h: zlecenie .docx (UTI org.openxmlformats…) dalej idzie do konwersji jako Word', async () => {
    const { grupa, z } = await srodowisko();
    const naPdf = jest.fn(async () => ({ ok: false as const, powod: 'bledne_dane' as const }));
    zlecenie(grupa, 'z1', { nazwaPliku: 'nowy.docx', nazwa: 'nowy.docx', typ: 'org.openxmlformats.wordprocessingml.document' });
    await przetworzSkrzynke({ ...z, konwersja: { ...z.konwersja, naPdf } });
    expect(naPdf).toHaveBeenCalledTimes(1);
  });

  test('przypiszZlecenie: wybrany projekt → wzór w nim, zlecenie usunięte (arkusz „1 pattern to add”, scenariusz 52)', async () => {
    const { s, grupa, z } = await srodowisko();
    zlecenie(grupa, 'z1', { projektId: null });
    const [zl] = await z.skrzynka.pobierz();
    expect(await przypiszZlecenie(z, { zlecenie: zl, projektId: 'p2' })).toMatchObject({ ok: true });
    expect(await jeden(s.baza, 'SELECT projekt_id FROM wzor')).toEqual({ projekt_id: 'p2' });
    expect(existsSync(join(grupa, 'skrzynka', 'z1'))).toBe(false);
  });
});

test('build E2E (oczkoE2eSkrzynka=pdf, scenariusz 52): zlecenie testowe jak z rozszerzenia — bez projektu, raz na kilka startów, PDF z %%EOF', async () => {
  const { grupa, skrzynka } = await srodowisko();
  wlozZlecenieTestowe(grupa, T0);
  wlozZlecenieTestowe(grupa, T0 + 1000);
  const z = await skrzynka.pobierz();
  expect(z).toEqual([expect.objectContaining({ id: 'e2e-skrzynka-pdf', rodzaj: 'plik', projektId: null, utworzonoMs: T0 })]);
  const pdf = pdfTestowy();
  expect([pdf.startsWith('%PDF-'), pdf.trimEnd().endsWith('%%EOF'), (pdf.match(/\/Type \/Page /g) ?? []).length]).toEqual([true, true, 2]);
});

test('P-248 D1a: kilka zdjęć z jednego udostępnienia = jedno zlecenie ze ścieżkami = jeden wzór `obraz`', async () => {
  const { s, grupa, z } = await srodowisko();
  const naPdf = jest.fn(async (_z: unknown) => { const p = join(s.katalog, 'zdjecia.pdf'); writeFileSync(p, PDF); return { ok: true as const, wartosc: { sciezka: p, strony: 3 } }; });
  zlecenie(grupa, 'z1', { nazwaPliku: 'IMG_1.jpeg', nazwa: 'IMG_1.jpeg', typ: 'public.jpeg', plik: Buffer.from('jpg1'), dodatkowe: ['IMG_2.jpeg', 'IMG_3.jpeg'] });
  const w = await przetworzSkrzynke({ ...z, konwersja: { ...z.konwersja, naPdf, sprawdzPdf: async () => ({ ok: true as const, wartosc: { strony: 3 } }) } });
  expect(w).toMatchObject({ ok: true, wartosc: { zaimportowano: 1, bledy: [] } });
  expect(naPdf).toHaveBeenCalledWith({ rodzaj: 'obrazy', sciezki: ['IMG_1.jpeg', 'IMG_2.jpeg', 'IMG_3.jpeg'].map((n) => join(grupa, 'skrzynka', 'z1', n)) }, expect.anything());
  expect(await ile(s.baza, 'wzor')).toBe(1);
});

test('manifest ze ścieżką spoza katalogu zlecenia albo bez pliku → nie jest zleceniem', async () => {
  const { grupa, skrzynka } = await srodowisko();
  zlecenie(grupa, 'z1', { nazwaPliku: 'a.pdf' });
  const k = join(grupa, 'skrzynka', 'z1');
  writeFileSync(join(k, 'zlecenie.json'), JSON.stringify({ id: 'z1', rodzaj: 'plik', nazwa: 'a', sciezki: ['../../x.pdf'], adres: null, typ: 'application/pdf', projektId: null, utworzonoMs: T0 }));
  expect(await skrzynka.pobierz()).toEqual([]);
  writeFileSync(join(k, 'zlecenie.json'), JSON.stringify({ id: 'z1', rodzaj: 'plik', nazwa: 'a', sciezki: ['a.pdf', 'brak.pdf'], adres: null, typ: 'application/pdf', projektId: null, utworzonoMs: T0 }));
  expect(await skrzynka.pobierz()).toEqual([]);
});

test('przegląd: powód przejściowy (zapis, brak_miejsca) → zlecenie czeka jak bez sieci, bez alertu o typie i bez kasowania pliku', async () => {
  const { grupa, z } = await srodowisko();
  zlecenie(grupa, 'z1');
  const w = await przetworzSkrzynke({ ...z, magazyn: { ...z.magazyn, zapisz: async () => ({ ok: false as const, powod: 'brak_miejsca' as const }) } });
  expect(w.ok && [w.wartosc.czekaSiec.map((x) => x.id), w.wartosc.bledy]).toEqual([['z1'], []]);
  expect(existsSync(join(grupa, 'skrzynka', 'z1'))).toBe(true);
});
