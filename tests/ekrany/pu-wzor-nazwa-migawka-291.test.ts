// PU-291 (opis poprawiony 16.11.2026, BX10 zad. 2), część „krok Udostępnij (migawka)”: po zmianie nazwy wzoru migawka dla rozszerzenia „Udostępnij do Oczka” niesie tylko LICZBĘ wzorów projektu —
// nie ich nazwy (arkusz mówi „{projekt} already has a pattern”, `udostepnij.kolejny`; wybór klucza: LogikaTests.swift:193). Prawdziwa baza, prawdziwy `zmienNazweWzoru`,
// prawdziwy `odswiezMigawke` i prawdziwy zapis pliku `projekty-migawka.json` w katalogu App Group; atrapy brak. Reszta opisu (tytuł, grupa „Patterns”, pusta nazwa): pu-wzor-przelacz-290.test.tsx
// i scenariusz Maestro 109 — rozszerzenia systemowego Maestro nie widzi.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { plik, projekt, wzor } from '../dane/pomocnicze/dane-wejsciowe';
import { T0, ile, katalogTymczasowy, przygotuj, wlozPlik, wykonaj } from '../dane/pomocnicze/srodowisko';
import { odswiezMigawke } from '../../src/przypadki-uzycia/migawka';
import { zmienNazweWzoru } from '../../src/przypadki-uzycia/wzor';
import { migawkaWKatalogu, PLIK_MIGAWKI } from '../../src/platforma/migawka';

const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');
const SKAN = Buffer.from('%PDF-1.4\n% skan strony\n%%EOF\n');

test('PU-291: po „Rename” migawka „Udostępnij” ma `wzory: 2` i nie zawiera ani nowej, ani starej nazwy wzoru; pusta nazwa nie zmienia nic', async () => {
  const s = await przygotuj();
  const grupa = katalogTymczasowy('oczko-grupa-');
  const h = wlozPlik(s.magazyn, PDF, 'pdf'), hSkan = wlozPlik(s.magazyn, SKAN, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), plik(h, 'pdf', PDF.length), plik(hSkan, 'pdf', SKAN.length), wzor('w1', 'p1', h), ["UPDATE wzor SET nazwa = 'Page photo' WHERE id = 'w1'", []],
    ["INSERT INTO wzor (id, projekt_id, nazwa, zrodlo, pdf_sha256, zmieniono_ms) VALUES ('w2', 'p1', 'Edging chart', 'obraz', ?, ?)", [hSkan, T0]]]);
  const zm = { ...s.z, migawka: migawkaWKatalogu(grupa, () => s.zegar.teraz().ms), jezyk: () => 'en' };
  const migawka = () => readFileSync(join(grupa, PLIK_MIGAWKI), 'utf8');
  const projekty = (): Record<string, unknown>[] => (JSON.parse(migawka()) as { projekty: Record<string, unknown>[] }).projekty;

  expect((await odswiezMigawke(zm)).ok).toBe(true);
  expect(projekty()).toHaveLength(1);
  expect(projekty()[0]).toMatchObject({ id: 'p1', nazwa: 'Sweter', wzory: 2 });

  expect((await zmienNazweWzoru(s.z, { wzorId: 'w1', nazwa: 'Sleeve chart' })).ok).toBe(true);
  expect((await odswiezMigawke(zm)).ok).toBe(true);
  expect(projekty()[0]).toMatchObject({ id: 'p1', nazwa: 'Sweter', wzory: 2 }); // liczba bez zmian po zmianie nazwy
  expect(Object.keys(projekty()[0] ?? {}).sort()).toEqual(['film', 'id', 'nazwa', 'nienazwany', 'ostatniaPracaMs', 'utworzonoMs', 'wzory']); // żadnego pola z nazwami wzorów
  for (const nazwaWzoru of ['Sleeve chart', 'Page photo', 'Edging chart']) expect(migawka()).not.toContain(nazwaWzoru);

  expect((await zmienNazweWzoru(s.z, { wzorId: 'w1', nazwa: '   ' })).ok).toBe(false); // pusta nazwa: odmowa, nazwa w bazie bez zmiany
  expect(await ile(s.baza, 'wzor', "id = 'w1' AND nazwa = 'Sleeve chart'")).toBe(1);
});
