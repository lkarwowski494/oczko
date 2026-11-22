// Kontrole roli 05 nr 2 i 4 (strategia §10), ścieżki utraty danych ŚU-04, ŚU-05, ŚU-07 (dane.md, tabela „Ścieżki utraty danych”),
// BR-DAN-003/S1–S2, NFR-DAN-001. Wyrocznie: docs/architektura/schemat.sql (v1, stan oczekiwany), stany.json, dane.md „Polityka migracji”.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { utworzPortNode } from '../../src/dane/baza/adapter-node';
import { migruj } from '../../src/dane/migracje/migruj';
import { WERSJA_SCHEMATU } from '../../src/konfiguracja';
import { SCHEMAT_V1, STANY_JSON, bazaWzorcowa, czytajBaze, wloczka, zycie } from './pomocnicze/dane-wejsciowe';
import { jeden, katalogTymczasowy, licznosci, migawka, przygotuj, wykonaj } from './pomocnicze/srodowisko';

const PLIKI = { pdf: 'a'.repeat(64), rys: 'b'.repeat(64), jpg: 'c'.repeat(64) };

/** Listy `CHECK (kolumna IN ('…'))` z SQL tabel (odporne na spacje, R-076): klucz `tabela.kolumna`. */
function listyCheck(tabele: { name: string; sql: string }[]): Record<string, string[]> {
  const w: Record<string, string[]> = {};
  for (const { name, sql } of tabele) {
    for (const m of sql.matchAll(/CHECK\s*\(\s*(\w+)\s+IN\s*\(([^)]*)\)\s*\)/gi)) {
      const wartosci = [...m[2].matchAll(/'([^']*)'/g)].map((x) => x[1]);
      if (wartosci.length) w[`${name}.${m[1]}`] = wartosci.sort();
    }
  }
  return w;
}
/** Kolumny każdej tabeli z bazy zbudowanej wprost z dokumentu schemat.sql (inne narzędzie niż runner aplikacji). */
function kolumnyDokumentu(): Record<string, string[]> {
  const db = new DatabaseSync(':memory:');
  db.exec(SCHEMAT_V1);
  const w: Record<string, string[]> = {};
  for (const { name } of db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[])
    w[name] = (db.prepare(`SELECT name, type, "notnull" AS nn, pk FROM pragma_table_info('${name}')`).all() as object[]).map((c) => JSON.stringify(c)).sort();
  db.close();
  return w;
}

describe('kontrola 05-2 (strategia §10, Z07-15): schemat po migracjach aplikacji', () => {
  test('Z07-15 kontrola 05-2: pusta baza → migruj → user_version = WERSJA_SCHEMATU, integrity_check = ok, foreign_key_check pusty (R-077)', async () => {
    const baza = utworzPortNode(join(katalogTymczasowy(), 'oczko.db'));
    const w = await migruj(baza);
    expect(w).toEqual({ ok: true, wartosc: { z: 0, do: WERSJA_SCHEMATU } });
    expect(await baza.all('PRAGMA user_version')).toEqual([{ user_version: WERSJA_SCHEMATU }]);
    expect(await baza.all('PRAGMA integrity_check')).toEqual([{ integrity_check: 'ok' }]);
    expect(await baza.all('PRAGMA foreign_key_check')).toEqual([]);
  });

  test('Z07-15 kontrola 05-2: tabele i kolumny po migracjach aplikacji = docs/architektura/schemat.sql v1', async () => {
    const baza = utworzPortNode(join(katalogTymczasowy(), 'oczko.db'));
    await migruj(baza);
    const tab = await baza.all<{ name: string }>("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
    const oczekiwane = kolumnyDokumentu();
    expect(tab.map((t) => t.name)).toEqual(Object.keys(oczekiwane).sort());
    for (const t of Object.keys(oczekiwane)) {
      const kol = (await baza.all<object>(`SELECT name, type, "notnull" AS nn, pk FROM pragma_table_info('${t}')`)).map((c) => JSON.stringify(c)).sort();
      expect({ t, kol }).toEqual({ t, kol: oczekiwane[t] });
    }
  });

  test('R-076 kontrola 05-2: stany ⊆ CHECK w obie strony — listy CHECK z sqlite_schema po migracjach = docs/architektura/stany.json', async () => {
    const baza = utworzPortNode(join(katalogTymczasowy(), 'oczko.db'));
    await migruj(baza);
    const tab = await baza.all<{ name: string; sql: string }>("SELECT name, sql FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    const zBazy = listyCheck(tab);
    const zJson = Object.fromEntries(Object.entries(STANY_JSON).filter(([k]) => !k.startsWith('_')).map(([k, v]) => [k, [...v].sort()]));
    expect(Object.keys(zJson).length).toBeGreaterThan(0); // pusta lista to błąd testu (zasada 3)
    expect(zBazy).toEqual(zJson);
  });

  test('R-096 P-072 kontrola 05-2: dzien_limitu bez kluczy obcych; każdy klucz obcy do plik ma ON DELETE RESTRICT (R-054)', async () => {
    const baza = utworzPortNode(join(katalogTymczasowy(), 'oczko.db'));
    await migruj(baza);
    expect(await baza.all("SELECT * FROM pragma_foreign_key_list('dzien_limitu')")).toEqual([]);
    const doPliku: { tabela: string; on_delete: string }[] = [];
    for (const { name } of await baza.all<{ name: string }>("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'"))
      for (const fk of await baza.all<{ table: string; on_delete: string }>(`SELECT "table", on_delete FROM pragma_foreign_key_list('${name}')`))
        if (fk.table === 'plik') doPliku.push({ tabela: name, on_delete: fk.on_delete });
    expect(doPliku.length).toBe(4); // wzor ×2, rysunek, zdjecie (schemat.sql v1)
    expect(new Set(doPliku.map((f) => f.on_delete))).toEqual(new Set(['RESTRICT']));
  });

  test('R-072 kontrola 05-2: drugie uruchomienie migracji niczego nie zmienia ({ z: 1, do: 1 }, ta sama migawka danych)', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, zycie(PLIKI));
    const przed = await migawka(s.baza);
    expect(await migruj(s.baza)).toEqual({ ok: true, wartosc: { z: WERSJA_SCHEMATU, do: WERSJA_SCHEMATU } });
    expect(await migawka(s.baza)).toBe(przed);
  });
});

describe('kontrola 05-4 (strategia §10) i ŚU-07 „Zapis na połączeniu bez kluczy obcych” (dane.md)', () => {
  test('ŚU-07 R-078 kontrola 05-4: PRAGMA foreign_keys = 1 w transakcji przez port i poza nią', async () => {
    const baza = utworzPortNode(join(katalogTymczasowy(), 'oczko.db'));
    await migruj(baza);
    expect(await baza.all('PRAGMA foreign_keys')).toEqual([{ foreign_keys: 1 }]);
    expect(await baza.transakcja((tx) => tx.all('PRAGMA foreign_keys'))).toEqual([{ foreign_keys: 1 }]);
  });

  test('ŚU-07 R-078 kontrola 05-4: drugie połączenie na tym samym pliku też ma foreign_keys = 1, zapis łamiący klucz obcy odrzucony', async () => {
    const k = katalogTymczasowy();
    const a = utworzPortNode(join(k, 'oczko.db'));
    await migruj(a);
    const b = utworzPortNode(join(k, 'oczko.db'));
    expect(await b.transakcja((tx) => tx.all('PRAGMA foreign_keys'))).toEqual([{ foreign_keys: 1 }]);
    await expect(b.transakcja((tx) => tx.run("INSERT INTO czesc (id, projekt_id, nazwa, kolejnosc, zmieniono_ms) VALUES ('c', 'brak', 'x', 1, 0)"))).rejects.toThrow(/FOREIGN KEY/);
    expect(await b.all('SELECT count(*) AS n FROM czesc')).toEqual([{ n: 0 }]);
  });
});

describe('ŚU-04 „Aktualizacja aplikacji ze zmianą schematu” i ŚU-05 „Migracja łamiąca CHECK” (dane.md)', () => {
  // Migracja 2 z przebudową tabeli wloczka (12 kroków sqlite.org, dane.md): bez foreign_keys = OFF przed BEGIN DROP kasuje projekt_wloczka kaskadą.
  const PRZEBUDOWA = `
    CREATE TABLE wloczka_nowa (id TEXT PRIMARY KEY NOT NULL, nazwa TEXT NOT NULL CHECK (length(nazwa) > 0), producent TEXT NOT NULL DEFAULT '',
      sklad TEXT NOT NULL DEFAULT '', kolor TEXT NOT NULL DEFAULT '', waga_motka_g REAL CHECK (waga_motka_g IS NULL OR waga_motka_g > 0),
      dlugosc_motka_m REAL CHECK (dlugosc_motka_m IS NULL OR dlugosc_motka_m > 0), motki REAL NOT NULL DEFAULT 0 CHECK (motki >= 0),
      pielegnacja TEXT NOT NULL DEFAULT '', notatka TEXT NOT NULL DEFAULT '', gramatura TEXT NOT NULL DEFAULT '', zmieniono_ms INTEGER NOT NULL, usunieto_ms INTEGER) STRICT;
    INSERT INTO wloczka_nowa (id, nazwa, producent, sklad, kolor, waga_motka_g, dlugosc_motka_m, motki, pielegnacja, notatka, zmieniono_ms, usunieto_ms)
      SELECT id, nazwa, producent, sklad, kolor, waga_motka_g, dlugosc_motka_m, motki, pielegnacja, notatka, zmieniono_ms, usunieto_ms FROM wloczka;
    DROP TABLE wloczka;
    ALTER TABLE wloczka_nowa RENAME TO wloczka;
    CREATE INDEX wloczka_nazwa ON wloczka(nazwa COLLATE NOCASE) WHERE usunieto_ms IS NULL;`;

  test('ŚU-04 NFR-DAN-001 BR-DAN-003/S1: 12 projektów, historia i zapas → migracja z przebudową → te same liczności, foreign_key_check pusty', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, zycie(PLIKI));
    const przed = await licznosci(s.baza);
    expect(przed.projekt).toBe(12);
    const w = await migruj(s.baza, { dodatkowe: [{ wersja: WERSJA_SCHEMATU + 1, sql: PRZEBUDOWA, przebudowa: true }], katalogKopii: s.z.katalogi.kopie });
    expect(w).toEqual({ ok: true, wartosc: { z: WERSJA_SCHEMATU, do: WERSJA_SCHEMATU + 1 } });
    expect(await licznosci(s.baza)).toEqual(przed);
    expect(await s.baza.all('PRAGMA foreign_key_check')).toEqual([]);
    expect(await s.baza.all('PRAGMA foreign_keys')).toEqual([{ foreign_keys: 1 }]); // włączone z powrotem po przebudowie
  });

  test('ŚU-04 NFR-DAN-001: przed migracją z przebudową kopia VACUUM INTO kopie/przed-migracja-<wersja>.db z danymi sprzed migracji', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, zycie(PLIKI));
    const przed = await licznosci(s.baza);
    const v = WERSJA_SCHEMATU + 1;
    await migruj(s.baza, { dodatkowe: [{ wersja: v, sql: PRZEBUDOWA, przebudowa: true }], katalogKopii: s.z.katalogi.kopie });
    const [nazwa] = readdirSync(s.z.katalogi.kopie).filter((n) => /^przed-migracja-\d+-\d{10,}\.db$/.test(n)); // rola 12 E2: czas w nazwie
    const kopia = join(s.z.katalogi.kopie, nazwa);
    expect(nazwa.startsWith(`przed-migracja-${v}-`)).toBe(true);
    expect(existsSync(kopia)).toBe(true);
    expect(czytajBaze(kopia, 'PRAGMA user_version')).toEqual([{ user_version: WERSJA_SCHEMATU }]);
    expect(czytajBaze<{ n: number }>(kopia, 'SELECT count(*) n FROM projekt_wloczka')[0].n).toBe(przed.projekt_wloczka);
  });

  test('ŚU-05 BR-DAN-003/S2 R-072: migracja łamiąca CHECK → ROLLBACK całości, powod „zapis”, user_version i dane bez zmian', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, zycie(PLIKI));
    const przed = await migawka(s.baza);
    const zla = { wersja: WERSJA_SCHEMATU + 1, sql: "ALTER TABLE wloczka ADD COLUMN gramatura TEXT NOT NULL DEFAULT ''; UPDATE licznik SET wartosc = -1;" };
    expect(await migruj(s.baza, { dodatkowe: [zla] })).toEqual({ ok: false, powod: 'zapis' });
    expect(await jeden(s.baza, 'PRAGMA user_version')).toEqual({ user_version: WERSJA_SCHEMATU });
    expect((await s.baza.all<{ name: string }>("SELECT name FROM pragma_table_info('wloczka')")).map((c) => c.name)).not.toContain('gramatura');
    expect(await migawka(s.baza)).toBe(przed);
  });

  test('R-079 dane.md: baza nowsza niż aplikacja (user_version = WERSJA_SCHEMATU + 1) → powod „wersja_nowsza”, bez zmian w pliku', async () => {
    const k = katalogTymczasowy();
    const plik = join(k, 'oczko.db');
    bazaWzorcowa(plik, [wloczka('y1', 'Merino')], { userVersion: WERSJA_SCHEMATU + 1 });
    const przed = czytajBaze(plik, 'SELECT * FROM wloczka');
    const baza = utworzPortNode(plik);
    expect(await migruj(baza)).toEqual({ ok: false, powod: 'wersja_nowsza' });
    expect(await baza.all('PRAGMA user_version')).toEqual([{ user_version: WERSJA_SCHEMATU + 1 }]);
    expect(await baza.all('SELECT * FROM wloczka')).toEqual(przed);
  });
});
