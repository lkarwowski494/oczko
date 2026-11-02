// Skrzynka zmian iCloud w schemacie v1 (05 fix-7 NZ-P217-05 F1; P-221 Q5a, Q6a; ADR-0005 uzupełnienie fix-7).
// Wyrocznia: docs/architektura/icloud-tabele.json (tabele synchronizowane i lokalne). Zmiana zapisana w tej samej transakcji co dane,
// tylko przy włączonej synchronizacji i nie przy zapisie z iCloud (flaga `wejscie`); usunięcie, także kaskadą, = wiersz z `usuniete = 1`.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { utworzPortNode, type PortNode } from '../../src/dane/baza/adapter-node';
import { migruj } from '../../src/dane/migracje/migruj';
import { usunWszystkieDane } from '../../src/przypadki-uzycia/projekt';
import { katalogTymczasowy, przygotuj, zArchiwum } from './pomocnicze/srodowisko';

type Kontrakt = { tabele: { tabela: string; klucz: string[]; tylko_klucze?: string[]; pomin?: string[] }[]; lokalne: string[] };
const KONTRAKT: Kontrakt = JSON.parse(readFileSync(join(__dirname, '../../docs/architektura/icloud-tabele.json'), 'utf8'));
const T = 1_793_000_000_000;

async function baza(): Promise<PortNode> {
  const b = utworzPortNode(join(katalogTymczasowy(), 'oczko.db'));
  const w = await migruj(b);
  if (!w.ok) throw new Error(`migruj: ${w.powod}`);
  await schematFix7(b);
  return b;
}
/** Test oczekujący czerwony na asercji, nie na błędzie SQL: tabele i kolumny fix-7 są w schemacie v1 (łatka L1). */
async function schematFix7(b: Pick<PortNode, 'all'>): Promise<void> {
  const nazwy = (await b.all<{ name: string }>("SELECT name FROM sqlite_schema WHERE type = 'table'")).map((r) => r.name);
  expect(['synchronizacja', 'zmiana_icloud'].filter((t) => !nazwy.includes(t))).toEqual([]);
}
const skrzynka = (b: PortNode) => b.all<{ encja: string; klucz: string; usuniete: number }>('SELECT encja, klucz, usuniete FROM zmiana_icloud ORDER BY encja, klucz');
const wlacz = (b: PortNode) => b.run('UPDATE synchronizacja SET wlaczona = 1 WHERE id = 1');
async function projektZLicznikiem(b: PortBazyTx, p: string): Promise<void> {
  await b.run('INSERT INTO projekt (id, nazwa, utworzono_ms, zmieniono_ms, ostatnia_praca_ms) VALUES (?, ?, ?, ?, ?)', [p, 'Sweter', T, T, T]);
  await b.run('INSERT INTO czesc (id, projekt_id, nazwa, kolejnosc, zmieniono_ms) VALUES (?, ?, ?, 0, ?)', [`${p}-c`, p, 'Przód', T]);
  await b.run('INSERT INTO licznik (id, czesc_id, kolejnosc, zmieniono_ms) VALUES (?, ?, 0, ?)', [`${p}-l`, `${p}-c`, T]);
}
type PortBazyTx = Pick<PortNode, 'run' | 'all'>;

describe('F1 schemat v1: skrzynka zmian iCloud (P-221 Q5a)', () => {
  test('tabele stanu synchronizacji: jeden wiersz, domyślnie wyłączona, bez stanu silnika; skrzynka pusta', async () => {
    const b = await baza();
    expect(await b.all('SELECT id, wlaczona, wejscie, stan_silnika, nr_zmiany FROM synchronizacja')).toEqual([{ id: 1, wlaczona: 0, wejscie: 0, stan_silnika: null, nr_zmiany: 0 }]);
    expect(await skrzynka(b)).toEqual([]);
    b.zamknij();
  });

  test('każda tabela synchronizowana ma trzy wyzwalacze (INSERT, UPDATE, DELETE), tabele lokalne żadnego; inne tabele nie istnieją', async () => {
    const b = await baza();
    const tabele = (await b.all<{ name: string }>("SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")).map((r) => r.name);
    expect(tabele).toEqual([...KONTRAKT.tabele.map((t) => t.tabela), ...KONTRAKT.lokalne].sort());
    const wyzw = await b.all<{ tbl_name: string; zdarzenie: string }>(
      "SELECT tbl_name, CASE WHEN sql LIKE '%AFTER INSERT%' THEN 'I' WHEN sql LIKE '%AFTER UPDATE%' THEN 'U' WHEN sql LIKE '%AFTER DELETE%' THEN 'D' END AS zdarzenie FROM sqlite_schema WHERE type = 'trigger' ORDER BY tbl_name, zdarzenie");
    const wg = new Map<string, string[]>();
    for (const w of wyzw) wg.set(w.tbl_name, [...(wg.get(w.tbl_name) ?? []), w.zdarzenie]);
    for (const t of KONTRAKT.tabele) expect([t.tabela, wg.get(t.tabela)]).toEqual([t.tabela, ['D', 'I', 'U']]);
    for (const t of KONTRAKT.lokalne) expect([t, wg.get(t)]).toEqual([t, undefined]);
    b.zamknij();
  });

  test('synchronizacja wyłączona: zapis danych nie dopisuje nic do skrzynki (BR-DAN-002/S3 — nic nie wychodzi poza urządzenie)', async () => {
    const b = await baza();
    await projektZLicznikiem(b, 'p1');
    expect(await skrzynka(b)).toEqual([]);
    b.zamknij();
  });

  test('synchronizacja włączona: zmiana w skrzynce w tej samej transakcji co dane; ROLLBACK cofa oba', async () => {
    const b = await baza();
    await wlacz(b);
    await b.transakcja((tx) => projektZLicznikiem(tx, 'p1'));
    await b.run('UPDATE projekt SET nazwa = ?, zmieniono_ms = ? WHERE id = ?', ['Sweter 2', T + 1, 'p1']);
    expect(await skrzynka(b)).toEqual([
      { encja: 'czesc', klucz: 'p1-c', usuniete: 0 }, { encja: 'licznik', klucz: 'p1-l', usuniete: 0 }, { encja: 'projekt', klucz: 'p1', usuniete: 0 },
    ]);
    await expect(b.transakcja(async (tx) => { await projektZLicznikiem(tx, 'p2'); throw new Error('przerwane'); })).rejects.toThrow('przerwane');
    expect((await skrzynka(b)).filter((z) => z.klucz.startsWith('p2'))).toEqual([]);
    b.zamknij();
  });

  test('zapis z iCloud (flaga `wejscie` w transakcji partii) nie wraca do skrzynki; po COMMIT flaga = 0', async () => {
    const b = await baza();
    await wlacz(b);
    await b.transakcja(async (tx) => {
      await tx.run('UPDATE synchronizacja SET wejscie = 1 WHERE id = 1');
      await projektZLicznikiem(tx, 'p1');
      await tx.run('UPDATE synchronizacja SET wejscie = 0 WHERE id = 1');
    });
    expect(await skrzynka(b)).toEqual([]);
    expect(await b.all('SELECT wejscie FROM synchronizacja')).toEqual([{ wejscie: 0 }]);
    b.zamknij();
  });

  test('usunięcie projektu: kaskada zapisuje usunięcie każdego dziecka (nagrobki), zmiana na usunięcie nadpisuje wpis', async () => {
    const b = await baza();
    await wlacz(b);
    await projektZLicznikiem(b, 'p1');
    await b.run("INSERT INTO zdarzenie (id, licznik_id, rodzaj, wartosc_po, zrodlo, urzadzenie, czas_ms, strefa, dzien) VALUES ('z1', 'p1-l', 'plus', 1, 'aplikacja', 'u', ?, 'Europe/Warsaw', '2026-10-26')", [T]);
    await b.run('DELETE FROM projekt WHERE id = ?', ['p1']);
    expect(await skrzynka(b)).toEqual([
      { encja: 'czesc', klucz: 'p1-c', usuniete: 1 }, { encja: 'licznik', klucz: 'p1-l', usuniete: 1 },
      { encja: 'projekt', klucz: 'p1', usuniete: 1 }, { encja: 'zdarzenie', klucz: 'z1', usuniete: 1 },
    ]);
    b.zamknij();
  });

  test('klucz złożony jako json_array (rysunek, projekt_wloczka); ustawienie tylko dla kluczy synchronizowanych', async () => {
    const b = await baza();
    await wlacz(b);
    const sha = 'a'.repeat(64);
    await projektZLicznikiem(b, 'p1');
    await b.run('INSERT INTO plik (sha256, rozszerzenie, bajty, utworzono_ms) VALUES (?, ?, 1, ?)', [sha, 'pdf', T]);
    await b.run("INSERT INTO wzor (id, projekt_id, nazwa, zrodlo, pdf_sha256, zmieniono_ms) VALUES ('w1', 'p1', 'Wzór', 'pdf', ?, ?)", [sha, T]);
    await b.run("INSERT INTO rysunek (wzor_id, strona, plik_sha256, zmieniono_ms) VALUES ('w1', 0, ?, ?)", [sha, T]);
    await b.run("INSERT INTO ustawienie (klucz, wartosc, zmieniono_ms) VALUES ('okno_uczciwe_zasady_widziane', 'true', ?), ('ostatnie_miejsce', '{}', ?)", [T, T]);
    const s = await skrzynka(b);
    expect(s).toContainEqual({ encja: 'rysunek', klucz: '["w1",0]', usuniete: 0 });
    expect(s).toContainEqual({ encja: 'plik', klucz: sha, usuniete: 0 });
    expect(s.filter((z) => z.encja === 'ustawienie')).toEqual([{ encja: 'ustawienie', klucz: 'okno_uczciwe_zasady_widziane', usuniete: 0 }]);
    b.zamknij();
  });
});

describe('F1 schemat v1: numer zmiany (potwierdzenie wysyłki nie kasuje nowszej zmiany)', () => {
  test('każda zmiana dostaje kolejny nr; potwierdzenie starego nr (DELETE … AND nr <= ?) zostawia wpis zmieniony po wysłaniu', async () => {
    const b = await baza();
    await wlacz(b);
    await b.run('INSERT INTO projekt (id, nazwa, utworzono_ms, zmieniono_ms, ostatnia_praca_ms) VALUES (?, ?, ?, ?, ?)', ['p1', 'A', T, T, T]);
    const [wyslany] = await b.all<{ nr: number }>("SELECT nr FROM zmiana_icloud WHERE encja = 'projekt' AND klucz = 'p1'");
    await b.run('UPDATE projekt SET nazwa = ?, zmieniono_ms = ? WHERE id = ?', ['B', T + 1, 'p1']); // zmiana po wysłaniu, przed potwierdzeniem
    const [nowy] = await b.all<{ nr: number }>("SELECT nr FROM zmiana_icloud WHERE encja = 'projekt' AND klucz = 'p1'");
    expect(nowy.nr).toBeGreaterThan(wyslany.nr);
    await b.run("DELETE FROM zmiana_icloud WHERE encja = 'projekt' AND klucz = 'p1' AND nr <= ?", [wyslany.nr]); // potwierdzenie starej wersji
    expect(await skrzynka(b)).toEqual([{ encja: 'projekt', klucz: 'p1', usuniete: 0 }]);
    expect(await b.all('SELECT nr_zmiany FROM synchronizacja')).toEqual([{ nr_zmiany: nowy.nr }]);
    b.zamknij();
  });
});

describe('F1 schemat v1: kolumny scalenia (P-221 Q6a)', () => {
  test('sesja.zmieniono_ms NOT NULL (domyślnie 0 do łatki repozytoriów partii 5), wzor.usunieto_ms (usunięcie wzoru bez kosza, P-220 N4)', async () => {
    const b = await baza();
    const kol = async (t: string) => b.all<{ name: string; notnull: number; dflt_value: string | null }>(`SELECT name, "notnull", dflt_value FROM pragma_table_info('${t}')`);
    expect((await kol('sesja')).find((c) => c.name === 'zmieniono_ms')).toEqual({ name: 'zmieniono_ms', notnull: 1, dflt_value: '0' });
    expect((await kol('wzor')).find((c) => c.name === 'usunieto_ms')).toEqual({ name: 'usunieto_ms', notnull: 0, dflt_value: null });
    b.zamknij();
  });
});

describe('F1 łatka L1: operacje na całej bazie a skrzynka (zero utraty danych na innych urządzeniach, ADR-0005 P-110 Q3a)', () => {
  test('„Usuń wszystkie dane” przy włączonej synchronizacji: skrzynka pusta, synchronizacja wyłączona, stan silnika usunięty (usunięcia nie idą do iCloud)', async () => {
    const s = await przygotuj();
    await schematFix7(s.baza);
    await s.baza.run('UPDATE synchronizacja SET wlaczona = 1, stan_silnika = ? WHERE id = 1', [new Uint8Array([1, 2, 3])]);
    await projektZLicznikiem(s.baza as PortNode, 'p1');
    expect((await s.baza.all('SELECT count(*) AS n FROM zmiana_icloud'))[0]).toEqual({ n: 3 });
    expect(await usunWszystkieDane(zArchiwum(s.z))).toEqual({ ok: true, wartosc: undefined });
    expect(await s.baza.all('SELECT encja FROM zmiana_icloud')).toEqual([]);
    expect(await s.baza.all('SELECT id, wlaczona, wejscie, stan_silnika FROM synchronizacja')).toEqual([{ id: 1, wlaczona: 0, wejscie: 0, stan_silnika: null }]);
    expect((await s.baza.all('SELECT count(*) AS n FROM projekt'))[0]).toEqual({ n: 0 });
  });

  // P-245 U3 → P-274 Q1a: wyzwalacz UPDATE licznika tylko na kolumnach synchronizowanych (tabela minus `pomin` z kontraktu);
  // +1 zmienia samą pamięć podręczną (wartosc, glowa — liczniki.ts), która w rekordzie i tak nie jedzie.
  const ZMIANA_KOLUMNY: Record<string, (b: PortBazyTx) => Promise<unknown>> = {
    czesc_id: async (b) => { await b.run("INSERT INTO czesc (id, projekt_id, nazwa, kolejnosc, zmieniono_ms) VALUES ('p1-c2', 'p1', 'Tył', 1, ?)", [T]); return 'p1-c2'; },
    nazwa: async () => 'Raglan', rodzaj: async () => 'oczka', znaczenie: async () => 'w_trakcie', dlugosc_powtorzenia: async () => 4,
    zablokowany: async () => 1, kolejnosc: async () => 3, zmieniono_ms: async () => T + 1, usunieto_ms: async () => T + 2,
  };
  test('P-274 Q1a: +1 (wartosc, glowa, konflikt) nie dopisuje licznika do skrzynki', async () => {
    const b = await baza();
    await projektZLicznikiem(b, 'p1');
    await wlacz(b);
    await b.run("UPDATE licznik SET wartosc = 1, glowa = 'z1' WHERE id = 'p1-l'");
    await b.run("UPDATE licznik SET wartosc = 2, glowa = 'z2', konflikt = 1 WHERE id = 'p1-l'");
    expect(await skrzynka(b)).toEqual([]);
    b.zamknij();
  });
  test('P-274 Q1a: zmiana każdej kolumny synchronizowanej licznika dopisuje go do skrzynki (literówka w UPDATE OF nie przejdzie)', async () => {
    const t = KONTRAKT.tabele.find((x) => x.tabela === 'licznik');
    const b = await baza();
    const kolumny = (await b.all<{ name: string }>("SELECT name FROM pragma_table_info('licznik')")).map((r) => r.name)
      .filter((k) => !(t?.pomin ?? []).includes(k) && !(t?.klucz ?? []).includes(k));
    expect(kolumny.filter((k) => !(k in ZMIANA_KOLUMNY))).toEqual([]); // nowa kolumna = nowa wartość w teście
    for (const k of kolumny) {
      await projektZLicznikiem(b, 'p1');
      await wlacz(b);
      const nowa = await ZMIANA_KOLUMNY[k](b);
      await b.run(`UPDATE licznik SET ${k} = ? WHERE id = 'p1-l'`, [nowa as string | number]); // nazwa kolumny z pragma, nie z wejścia
      expect([k, (await skrzynka(b)).filter((w) => w.encja === 'licznik')]).toEqual([k, [{ encja: 'licznik', klucz: 'p1-l', usuniete: 0 }]]); // czesc_id: nowa część też wchodzi do skrzynki
      await b.run('UPDATE synchronizacja SET wlaczona = 0 WHERE id = 1');
      await b.run("DELETE FROM projekt WHERE id = 'p1'");
      await b.run('DELETE FROM zmiana_icloud');
    }
    b.zamknij();
  });
});
