// Odwzorowanie wiersz ↔ rekord iCloud (moduly.md „Kontrakt partii 7”, testy oczekujące „domena/icloud-odwzorowanie”; P-221 Q5a).
// Wyrocznia: docs/architektura/icloud-tabele.json (jedno źródło dla schematu, odwzorowania i schemat.ckdb) — kopia w domenie musi być równa.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import fc from 'fast-check';
import { TABELE_ICLOUD, tabelaIcloud } from '../../../src/domena/icloud/kontrakt';
import { kluczWiersza, kluczeZJson, nazwaRekordu, potwierdzeniaZJson, rekordZWiersza, rekordyZJson, rozbierzNazwe, wierszZRekordu, wartosciKlucza } from '../../../src/domena/icloud/odwzorowanie';

type Wpis = { tabela: string; typ: string; klucz: string[]; scalanie: string; pomin?: string[]; zasob?: boolean; tylko_klucze?: string[] };
const KONTRAKT: { tabele: Wpis[] } = JSON.parse(readFileSync(join(__dirname, '../../../docs/architektura/icloud-tabele.json'), 'utf8'));

describe('kontrakt tabel iCloud w domenie = docs/architektura/icloud-tabele.json', () => {
  test('ta sama lista, kolejność (rodzice przed dziećmi), typy, klucze, scalanie, pominięte kolumny i zasoby', () => {
    const z = (t: Wpis) => ({ tabela: t.tabela, typ: t.typ, klucz: t.klucz, scalanie: t.scalanie, pomin: t.pomin ?? [], zasob: t.zasob ?? false, tylkoKlucze: t.tylko_klucze ?? null });
    expect(TABELE_ICLOUD.map((t) => ({ ...t, klucz: [...t.klucz], pomin: [...t.pomin], tylkoKlucze: t.tylkoKlucze ? [...t.tylkoKlucze] : null }))).toEqual(KONTRAKT.tabele.map(z));
  });
  test('tabela spoza kontraktu → null (np. tabele lokalne)', () => {
    expect(tabelaIcloud('poczekalnia')).toBeNull();
    expect(tabelaIcloud('zmiana_icloud')).toBeNull();
    expect(tabelaIcloud('projekt')?.typ).toBe('Projekt');
  });
});

describe('klucz i nazwa rekordu', () => {
  test('klucz pojedynczy = wartość tekstem; złożony = json_array jak w wyzwalaczach (["w1",0])', () => {
    expect(kluczWiersza(tabelaIcloud('projekt')!, { id: 'p1', nazwa: 'A' })).toBe('p1');
    expect(kluczWiersza(tabelaIcloud('rysunek')!, { wzor_id: 'w1', strona: 0 })).toBe('["w1",0]');
    expect(kluczWiersza(tabelaIcloud('projekt_wloczka')!, { projekt_id: 'p1', wloczka_id: 'y1' })).toBe('["p1","y1"]');
    expect(wartosciKlucza(tabelaIcloud('rysunek')!, '["w1",0]')).toEqual({ ok: true, wartosc: ['w1', 0] });
    expect(wartosciKlucza(tabelaIcloud('projekt')!, 'p1')).toEqual({ ok: true, wartosc: ['p1'] });
    expect(wartosciKlucza(tabelaIcloud('rysunek')!, 'zły')).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(wartosciKlucza(tabelaIcloud('rysunek')!, '["w1"]')).toEqual({ ok: false, powod: 'bledne_dane' });
  });
  test('recordName = "<encja>:<klucz>" i z powrotem (dwukropek w kluczu złożonym nie psuje rozbioru)', () => {
    expect(nazwaRekordu('rysunek', '["w:1",0]')).toBe('rysunek:["w:1",0]');
    expect(rozbierzNazwe('rysunek:["w:1",0]')).toEqual({ encja: 'rysunek', klucz: '["w:1",0]' });
    expect(rozbierzNazwe('bez-dwukropka')).toBeNull();
  });
});

describe('rekordZWiersza / wierszZRekordu', () => {
  test('licznik: kolumny pomin (wartosc, glowa, konflikt) nie jadą; reszta bez zmian', () => {
    const t = tabelaIcloud('licznik')!;
    const w = { id: 'l1', czesc_id: 'c1', nazwa: '', wartosc: 7, glowa: 'z7', konflikt: 1, kolejnosc: 0, zmieniono_ms: 5 };
    const r = rekordZWiersza(t, w, null);
    expect(r).toEqual({ encja: 'licznik', klucz: 'l1', pola: { id: 'l1', czesc_id: 'c1', nazwa: '', kolejnosc: 0, zmieniono_ms: 5 }, plik: null });
    expect(wierszZRekordu(r)).toEqual({ ok: true, wartosc: { tabela: t, wiersz: { id: 'l1', czesc_id: 'c1', nazwa: '', kolejnosc: 0, zmieniono_ms: 5 } } });
  });
  test('plik: zasób jako ścieżka w polu plik', () => {
    const r = rekordZWiersza(tabelaIcloud('plik')!, { sha256: 'a'.repeat(64), rozszerzenie: 'pdf', bajty: 3, utworzono_ms: 1 }, '/p/aaa.pdf');
    expect(r.plik).toBe('/p/aaa.pdf');
    expect(r.klucz).toBe('a'.repeat(64));
  });
  test('rekord z obcą encją, kluczem niezgodnym z polami albo polem złego typu → bledne_dane (rekord z sieci nie jest zaufany)', () => {
    const ok = { encja: 'projekt', klucz: 'p1', pola: { id: 'p1', nazwa: 'A' }, plik: null };
    expect(wierszZRekordu({ ...ok, encja: 'poczekalnia' })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(wierszZRekordu({ ...ok, klucz: 'p2' })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(wierszZRekordu({ ...ok, pola: { id: 'p1', nazwa: { x: 1 } as unknown as string } })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(wierszZRekordu({ ...ok, pola: { id: 'p1', 'nazwa; DROP TABLE projekt': 'x' } })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(wierszZRekordu({ encja: 'ustawienie', klucz: 'jezyk', pola: { klucz: 'jezyk', wartosc: '"pl"', zmieniono_ms: 1 }, plik: null })).toEqual({ ok: false, powod: 'bledne_dane' });
  });
  test('P-274 Q3a: kolumna pomin w rekordzie z sieci pominięta jak nieznana, rekord przyjęty (nowsza wersja może ją synchronizować; ADR-0005 tylko dodające)', () => {
    const t = tabelaIcloud('licznik')!;
    expect(wierszZRekordu({ encja: 'licznik', klucz: 'l1', pola: { id: 'l1', nazwa: 'Rękaw', wartosc: 3, glowa: 'z3', konflikt: 1 }, plik: null }))
      .toEqual({ ok: true, wartosc: { tabela: t, wiersz: { id: 'l1', nazwa: 'Rękaw' } } });
    expect(wierszZRekordu({ encja: 'licznik', klucz: 'l1', pola: { id: 'l1', wartosc: { x: 1 } as unknown as number }, plik: null })).toEqual({ ok: true, wartosc: { tabela: t, wiersz: { id: 'l1' } } }); // wartość pominiętej kolumny nie trafia do bazy
  });
  test('własność: dla każdej tabeli wiersz → rekord → wiersz bez zmian (poza kolumnami pomin)', () => {
    const wartosc = fc.oneof(fc.string(), fc.integer(), fc.constant(null));
    for (const t of TABELE_ICLOUD) {
      fc.assert(fc.property(fc.dictionary(fc.constantFrom('a', 'b_c', 'zmieniono_ms', ...t.pomin), wartosc), fc.array(fc.oneof(fc.string(), fc.integer()), { minLength: t.klucz.length, maxLength: t.klucz.length }), (inne, klucz) => {
        const wiersz: Record<string, string | number | null> = { ...inne };
        t.klucz.forEach((k, i) => { wiersz[k] = klucz[i]; });
        if (t.tylkoKlucze) wiersz[t.klucz[0]] = t.tylkoKlucze[0];
        const r = rekordZWiersza(t, wiersz, null);
        const bez = Object.fromEntries(Object.entries(wiersz).filter(([k]) => !t.pomin.includes(k)));
        expect(wierszZRekordu(r)).toEqual({ ok: true, wartosc: { tabela: t, wiersz: bez } });
      }), { numRuns: 30 });
    }
  });
});

describe('rekordy z granicy (JSON z modułu Swift, poczekalnia) parsowane z unknown', () => {
  test('rekordyZJson: tylko dobrze zbudowane rekordy; reszta odrzucona i policzona', () => {
    const dobry = { encja: 'projekt', klucz: 'p1', pola: { id: 'p1', n: 1, x: null }, plik: null };
    expect(rekordyZJson([dobry, { encja: 'projekt' }, 'x', null, { ...dobry, pola: { a: {} } }, { ...dobry, plik: 5 }])).toEqual({ rekordy: [dobry], odrzucone: 5 });
    expect(rekordyZJson('nie-tablica')).toEqual({ rekordy: [], odrzucone: 1 });
  });
  test('kluczeZJson i potwierdzeniaZJson: encja, klucz (i nr całkowity)', () => {
    expect(kluczeZJson([{ encja: 'projekt', klucz: 'p1' }, { encja: 1 }])).toEqual([{ encja: 'projekt', klucz: 'p1' }]);
    expect(potwierdzeniaZJson([{ encja: 'projekt', klucz: 'p1', nr: 3 }, { encja: 'projekt', klucz: 'p2', nr: 1.5 }, { encja: 'x' }])).toEqual([{ encja: 'projekt', klucz: 'p1', nr: 3 }]);
  });
});
