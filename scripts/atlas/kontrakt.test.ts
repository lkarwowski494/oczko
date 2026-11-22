// Testy kontraktu katalogu (ADR-0023), manifestu (ADR-0025, moduł `pakiety-tresci`) i strony statycznej (ADR-0025, P-095).
// Każdy kod błędu walidatora i każda reguła strony ma przypadek negatywny.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { FORMAT_KARTY, SCHEMAT, walidujKarte, walidujSchemat } from './silnik/kontrakt.ts';
import { FORMAT_KATALOGU, jezykKarty, wczytajKatalog, zbudujManifest, type PortyKatalogu } from './silnik/katalog.ts';
import { zbudujStrone } from './silnik/strona.ts';
import { paletaZTokenow, straznikLiter } from './silnik/svg.ts';
import { sprawdzKrok } from './silnik/sprawdz.ts';
import type { Karta } from './silnik/typy.ts';

const KORZEN = join(__dirname, '..', '..');
const KARTY = join(KORZEN, 'docs/atlas/prototyp/karty');
const tokeny = JSON.parse(readFileSync(join(KORZEN, 'docs/design/tokeny.json'), 'utf8'));
const palety = { jasny: paletaZTokenow(tokeny, 'jasny'), ciemny: paletaZTokenow(tokeny, 'ciemny') };
const karty: Karta[] = readdirSync(KARTY).filter((f) => f.endsWith('.json')).sort().map((f) => JSON.parse(readFileSync(join(KARTY, f), 'utf8')));
const k2tog = () => JSON.parse(JSON.stringify(karty.find((k) => k.id === 'druty.ujecie.k2tog'))) as Karta;
const kody = (k: unknown, bezRysunku = false) => walidujKarte(k, bezRysunku ? {} : { sprawdzKrok: sprawdzKrok([palety.jasny, palety.ciemny]) }).map((b) => b.kod);

describe('schemat w repo', () => {
  test('docs/atlas/katalog.schema.json = SCHEMAT z kontraktu (scripts/atlas/waliduj.mjs --schema --write)', () => {
    expect(readFileSync(join(KORZEN, 'docs/atlas/katalog.schema.json'), 'utf8')).toBe(JSON.stringify(SCHEMAT, null, 2) + '\n');
  });
});

describe('walidator karty', () => {
  test('karty próbne przechodzą (schemat, semantyka, rysunek)', () => {
    for (const k of karty) expect(walidujKarte(k, { sprawdzKrok: sprawdzKrok([palety.jasny, palety.ciemny]) })).toEqual([]);
  });
  test.each<[string, (k: Karta & Record<string, unknown>) => void, string]>([
    ['format nowszy', (k) => { k.format = FORMAT_KARTY + 1; }, 'schemat'],
    ['pole spoza kontraktu', (k) => { k.tekst = 'Knit two together'; }, 'schemat'],
    ['brak kluczy', (k) => { delete (k as Partial<Karta>).klucze; }, 'schemat'],
    ['zły tag języka', (k) => { k.terminy.en_us = [{ skrot: 'k', twierdzenie: 'TRM-EN-001' }]; }, 'schemat'],
    ['ID twierdzenia małymi literami', (k) => { k.twierdzenia[0].id = 'atl-k-040'; }, 'schemat'],
    ['nieznana faza', (k) => { (k.kroki![0] as { faza: string }).faza = 'odwrocenie'; }, 'schemat'],
    ['ujęcie bez na_wierzchu', (k) => { k.rysunek!.operacja = { typ: 'scal', zuzywa: 2, strona: 'prawe' } as never; }, 'schemat'],
    ['glif cudzego pochodzenia', (k) => { (k as Record<string, unknown>).glif = { id: 'glif.a', origin: 'CYC', rs: 'a', ws: 'b' }; }, 'schemat'],
    ['kotwica strzałki poza zakresem', (k) => { k.kroki![0].strzalka = { ruch: 'nitka', od: 'glowa:9:1', do: 'drut_prawy' }; }, 'schemat'],
    ['id nie od rzemiosła', (k) => { k.rzemioslo = 'szydelko'; }, 'id'],
    ['rysunek operacji bez twierdzenia z wartością', (k) => { k.twierdzenia = []; }, 'twierdzenie'],
    ['pozycje poza tabelą', (k) => { k.pozycje = ['druty.oczko.k']; }, 'pozycje'],
    ['technika bez terminu en-US', (k) => { k.terminy = { sv: [{ skrot: null, twierdzenie: 'TRM-SV-001' }] }; k.jezyki_gotowe = ['sv']; }, 'jezyk'],
    ['rysunek bez opis_alt', (k) => { delete k.klucze.opis_alt; }, 'klucz'],
    ['klucz dodatkowy spoza id', (k) => { k.klucze_dodatkowe = ['atlas.inna.karta.uwaga']; }, 'klucz'],
    ['wkłucie bez grotu', (k) => { k.kroki![1].drut = { ktory: 'prawy' }; }, 'krok'],
    ['ujęcie środkowe przy 2 oczkach', (k) => { k.rysunek!.operacja = { typ: 'scal', zuzywa: 2, strona: 'prawe', na_wierzchu: 'srodkowe' }; }, 'rysunek'],
    ['hasło skrótu z rysunkiem', (k) => { k.rodzaj = 'skrot'; k.id = 'skrot.druty.k2tog'; }, 'rysunek'],
    ['faza null poza nabieraniem', (k) => { k.kroki![0].faza = null; k.kroki![0].faza_opis = 'opis'; }, 'krok'],
    ['operacja, której rodzina nie rysuje (warkocz)', (k) => { k.rysunek!.operacja = { typ: 'warkocz', zuzywa: 4, przekladane: 2, pomocniczy: 'przod' }; }, 'rysunek-nieobslugiwany'],
    ['klucz nazwy niezgodny z id', (k) => { k.klucze.nazwa = 'atlas.k2tog.nazwa'; }, 'klucz'],
    ['klucz kroku nie po kolei', (k) => { k.kroki![0].klucz = 'atlas.druty.ujecie.k2tog.krok7'; }, 'klucz'],
    ['powtórzone ID twierdzenia', (k) => { k.twierdzenia.push({ ...k.twierdzenia[0] }); }, 'twierdzenie'],
    ['język gotowy bez terminu', (k) => { k.jezyki_gotowe.push('sv'); }, 'jezyk'],
    ['rysunek bez kroków', (k) => { delete k.kroki; }, 'rysunek'],
    ['wkłucie bez drutu', (k) => { delete k.kroki![1].drut; }, 'krok'],
    ['wkłucie drutem lewym (silnik rysuje prawy)', (k) => { k.kroki![1].drut = { ktory: 'lewy', grot: 'w_lewo' }; }, 'rysunek-nieobslugiwany'],
    ['faza, której rodzina nie rysuje', (k) => { k.kroki![1].faza = 'narzut'; delete k.kroki![1].drut; }, 'faza-nieobslugiwana'],
    ['rysunek przeczy twierdzeniu', (k) => { k.twierdzenia[0].wartosc.pochylenie = 'lewo'; }, 'rysunek:twierdzenie'],
  ])('oblewa: %s', (_, zmien, kod) => {
    const k = k2tog() as Karta & Record<string, unknown>;
    zmien(k);
    expect(kody(k)).toContain(kod);
  });
  test('komunikat schematu ma ścieżkę pola', () => {
    const k = k2tog();
    k.rysunek!.probka!.kolumny = 12;
    expect(walidujSchemat(k, SCHEMAT)).toEqual([{ kod: 'schemat', sciezka: '$.rysunek.probka.kolumny', szczegol: '12 > maksimum 8' }]);
  });
  test('--bez-rysunku pomija tylko rysunek', () => {
    const k = k2tog();
    k.twierdzenia[0].wartosc.pochylenie = 'lewo';
    expect(kody(k, true)).toEqual([]);
  });
});

describe('manifest katalogu', () => {
  const enc = new TextEncoder();
  const sha256 = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
  const pliki = karty.map((k) => ({ plik: `${k.id}.json`, bajty: enc.encode(JSON.stringify(k)) }));
  const porty = (zmiana: Record<string, Uint8Array | null> = {}): PortyKatalogu => ({
    czytaj: (p) => (p in zmiana ? zmiana[p] : pliki.find((x) => x.plik === p)?.bajty ?? null),
    sha256,
    dekoduj: (b) => new TextDecoder().decode(b),
  });
  const manifest = () => zbudujManifest(pliki, '2026-10-26.1', sha256);

  test('poprawny katalog: wszystkie karty, bez błędów', () => {
    const w = wczytajKatalog(JSON.stringify(manifest()), porty());
    expect(w).toMatchObject({ odrzucony: false, bledy: [] });
    expect(w.karty.map((k) => k.id)).toEqual(karty.map((k) => k.id));
  });
  test('manifest nowszego formatu → cały katalog odrzucony, bez kart', () => {
    const m = { ...manifest(), format: FORMAT_KATALOGU + 1 };
    expect(wczytajKatalog(JSON.stringify(m), porty())).toMatchObject({ odrzucony: true, karty: [], bledy: [{ kod: 'format-nowszy' }] });
  });
  test('uszkodzony manifest → odrzucony', () => {
    expect(wczytajKatalog('{"format":1', porty()).bledy[0].kod).toBe('manifest');
  });
  test.each([
    ['brak pliku', { 'druty.oczko.p.json': null }, 'brak-pliku'],
    ['inny rozmiar', { 'druty.oczko.p.json': enc.encode('{}') }, 'rozmiar'],
  ])('zła karta (%s) pominięta, reszta działa', (_, zmiana, kod) => {
    const w = wczytajKatalog(JSON.stringify(manifest()), porty(zmiana as Record<string, Uint8Array | null>));
    expect(w.odrzucony).toBe(false);
    expect(w.bledy.map((b) => b.kod)).toEqual([kod]);
    expect(w.karty).toHaveLength(karty.length - 1);
  });
  test('ta sama długość, inne bajty → skrot (SHA-256 z bajtów pliku, nie z ponownej serializacji)', () => {
    const b = pliki[0].bajty.slice();
    b[b.length - 2] ^= 0x01; // ta sama długość, inny bajt: SHA-256 sprawdzany przed parsowaniem
    const w = wczytajKatalog(JSON.stringify(manifest()), porty({ [pliki[0].plik]: b }));
    expect(w.bledy.map((x) => x.kod)).toEqual(['skrot']);
  });
  test('karta nowszego formatu pominięta', () => {
    const k = { ...karty[0], format: FORMAT_KARTY + 1 };
    const b = enc.encode(JSON.stringify(k));
    const m = zbudujManifest([{ plik: pliki[0].plik, bajty: b }, ...pliki.slice(1)], 'x', sha256);
    const w = wczytajKatalog(JSON.stringify(m), porty({ [pliki[0].plik]: b }));
    expect(w.bledy.map((x) => x.kod)).toEqual(['format-nowszy']);
    expect(w.karty).toHaveLength(karty.length - 1);
  });
  test('nazwa pliku z ukośnikiem odrzucona (bez wyjścia poza katalog)', () => {
    const m = manifest();
    m.karty[0].plik = '../dane.json';
    expect(wczytajKatalog(JSON.stringify(m), porty()).bledy.map((x) => x.kod)).toEqual(['manifest']);
  });
});

describe('język karty (przełącznik Q3, ADR-0025)', () => {
  const k = k2tog();
  k.terminy.sv = [{ skrot: null, twierdzenie: 'TRM-SV-001' }];
  k.jezyki_gotowe = ['en-US', 'sv'];
  test.each([
    ['sv', 'angielski', 'sv'], ['sv', 'ukryj', 'sv'],
    ['pl', 'angielski', 'en-US'], ['pl', 'ukryj', null],
    ['en-GB', 'angielski', 'en-US'], ['en-GB', 'ukryj', null],
  ] as const)('%s, polityka %s → %s', (j, p, wynik) => expect(jezykKarty(k, j, p)).toBe(wynik));
  test.each([
    ['en-US', 'angielski', 'en-US'], ['en-GB', 'angielski', null], ['pl', 'angielski', null], ['pl', 'ukryj', null],
  ] as const)('szydełko (P-213, E2-Q1a): %s, polityka %s → %s', (j, p, wynik) => expect(jezykKarty({ ...k, rzemioslo: 'szydelko' }, j, p)).toBe(wynik));
});

describe('strona statyczna', () => {
  const ADRES = 'https://atlas.example.invalid/';
  const dwuj = karty.map((k) => {
    const c = JSON.parse(JSON.stringify(k)) as Karta;
    if (c.id === 'druty.ujecie.k2tog') { c.terminy.sv = [{ skrot: null, twierdzenie: 'TRM-SV-001' }]; c.jezyki_gotowe = ['en-US', 'sv']; }
    return c;
  });
  const teksty = (jezyki: string[]) => Object.fromEntries(jezyki.map((j) => {
    const t: Record<string, string> = { 'atlas.strona.tytul': `[${j}] Atlas`, 'atlas.strona.spis': `[${j}] index`, 'atlas.strona.jezyk': `[${j}]`, 'atlas.strona.sklep': `[${j}] app` };
    for (const k of dwuj) for (const klucz of [...Object.values(k.klucze), ...(k.kroki ?? []).map((x) => x.klucz)]) t[klucz] = `[${j}] ${klucz}`;
    return [j, t];
  }));
  const w = zbudujStrone({ adres: ADRES, karty: dwuj, teksty: teksty(['en-US', 'sv']), palety });
  const hreflang = (html: string) => [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map((m) => [m[1], m[2]] as const);

  test('bez błędów; strony: korzeń, spis per język, karta per język gotowy, mapa strony', () => {
    expect(w.bledy).toEqual([]);
    expect(Object.keys(w.pliki).sort()).toEqual([
      'en-US/druty-oczko-k/index.html', 'en-US/druty-oczko-p/index.html', 'en-US/druty-ujecie-k2tog/index.html', 'en-US/index.html',
      'index.html', 'sitemap.xml', 'sv/druty-ujecie-k2tog/index.html', 'sv/index.html',
    ]);
  });
  test('brak strony dla języka spoza jezyki_gotowe karty; hasło skrótu nie ma strony, pokazuje je tabela (P-095)', () => {
    expect(w.pliki['sv/druty-oczko-k/index.html']).toBeUndefined();
    const skrot: Karta = { format: 1, id: 'skrot.druty.sl', rzemioslo: 'druty', rodzaj: 'skrot', klucze: { nazwa: 'atlas.skrot.druty.sl.nazwa', podpis: 'atlas.skrot.druty.sl.podpis', opis_alt: 'atlas.skrot.druty.sl.opis_alt' }, terminy: { 'en-US': [{ skrot: 'sl', twierdzenie: 'TRM-EN-099' }] }, twierdzenia: [{ id: 'TRM-EN-099', wartosc: { bilans: 0 } }], jezyki_gotowe: ['en-US'] };
    const tabela: Karta = { ...skrot, id: 'tabela.skroty.druty', rodzaj: 'tabela', pozycje: ['skrot.druty.sl', 'druty.oczko.k'], klucze: { nazwa: 'atlas.tabela.skroty.druty.nazwa', podpis: 'atlas.tabela.skroty.druty.podpis', opis_alt: 'atlas.tabela.skroty.druty.opis_alt' } };
    expect(walidujKarte(skrot, {})).toEqual([]);
    expect(walidujKarte(tabela, {})).toEqual([]);
    const t = teksty(['en-US', 'sv']);
    for (const x of [skrot, tabela]) for (const klucz of Object.values(x.klucze)) t['en-US'][klucz] = `[en-US] ${klucz}`;
    const z = zbudujStrone({ adres: ADRES, karty: [...dwuj, skrot, tabela], teksty: t, palety });
    expect(z.bledy).toEqual([]);
    expect(Object.keys(z.pliki).filter((p) => /\/skrot-/.test(p))).toEqual([]);
    expect(z.pliki['en-US/tabela-skroty-druty/index.html']).toMatch(/<td>sl<\/td><td>\[en-US\] atlas.skrot.druty.sl.nazwa<\/td>/);
  });
  test('hreflang: każda wersja wymienia siebie i pozostałe (symetria) + x-default; adresy bezwzględne', () => {
    for (const [p, html] of Object.entries(w.pliki)) {
      if (!p.endsWith('.html')) continue;
      const alt = hreflang(html);
      expect(alt.filter(([j]) => j === 'x-default')).toHaveLength(1);
      for (const [, u] of alt) expect(u.startsWith(ADRES)).toBe(true);
      const wlasny = `${ADRES}${p.replace(/index\.html$/, '')}`;
      if (p !== 'index.html') expect(alt.map(([, u]) => u)).toContain(wlasny);
      for (const [j, u] of alt) {
        if (j === 'x-default') continue;
        const inny = w.pliki[`${u.slice(ADRES.length)}index.html`];
        expect(inny).toBeDefined();
        if (p !== 'index.html') expect(hreflang(inny).map(([, x]) => x)).toContain(wlasny);
      }
    }
    expect(hreflang(w.pliki['sv/druty-ujecie-k2tog/index.html']).map(([j]) => j)).toEqual(['en-US', 'sv', 'x-default']);
    expect(hreflang(w.pliki['en-US/druty-oczko-k/index.html']).map(([j]) => j)).toEqual(['en-US', 'x-default']);
  });
  test('każdy SVG na stronach przechodzi strażnika liter; atrybut lang = język strony', () => {
    for (const [p, html] of Object.entries(w.pliki)) {
      for (const m of html.matchAll(/<svg[\s\S]*?<\/svg>/g)) expect(straznikLiter(m[0])).toEqual([]);
      if (p.includes('/')) expect(html).toContain(`<html lang="${p.split('/')[0]}">`);
      expect(html).not.toMatch(/<script|faza_opis|onload=/i); // bez skryptów (prywatność, E3 §3) i bez opisów roboczych 06
    }
  });
  test('mapa strony zawiera każdą stronę HTML', () => {
    for (const p of Object.keys(w.pliki).filter((x) => x.endsWith('.html'))) expect(w.pliki['sitemap.xml']).toContain(`<loc>${ADRES}${p.replace(/index\.html$/, '')}</loc>`);
  });
  test('brak tekstu w języku → błąd i żadnych plików (bez stron z samym szablonem)', () => {
    const t = teksty(['en-US', 'sv']);
    delete t.sv['atlas.druty.ujecie.k2tog.krok2'];
    const z = zbudujStrone({ adres: ADRES, karty: dwuj, teksty: t, palety });
    expect(z.pliki).toEqual({});
    expect(z.bledy).toEqual(['brak tekstu „atlas.druty.ujecie.k2tog.krok2” w języku sv']);
  });
  test('karta „po-generatorze” (P-200) nie ma strony', () => {
    const z = zbudujStrone({ adres: ADRES, karty: dwuj.map((k) => (k.id === 'druty.oczko.p' ? { ...k, publikacja: 'po-generatorze' as const } : k)), teksty: teksty(['en-US', 'sv']), palety });
    expect(z.bledy).toEqual([]);
    expect(Object.keys(z.pliki).some((p) => p.includes('druty-oczko-p'))).toBe(false);
  });
  test('brak adresu (domena niekupiona) → błąd', () => {
    expect(zbudujStrone({ adres: '', karty: dwuj, teksty: teksty(['en-US', 'sv']), palety }).bledy[0]).toMatch(/ATLAS_ADRES/);
  });
});
