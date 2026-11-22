// Rola 12 E2: kopia ratunkowa, sprawdzenie kopii i przywrócenie (ADR-0020 (1), (2′), (5′), P-080 (3b)) — przypadki „Potwierdzenia” ADR-0020,
// których nie ma w tests/dane/start-kopie.test.ts: prawdziwy proces zabity z otwartą bazą WAL, uszkodzona strona, user_version 0, obcy
// application_id, przywrócenie z licznościami, błąd w trakcie, `blad` i klucze urządzenia. Wyrocznia: osobne połączenie node:sqlite.
import { closeSync, copyFileSync, existsSync, mkdirSync, openSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { kopiaBazy } from '../../src/dane/baza/kopia';
import { przywrocZKopii, sprawdzKopie, surowaKopia } from '../../src/dane/kopia-ratunkowa';
import { WERSJA_SCHEMATU } from '../../src/konfiguracja';
import { bazaWzorcowa, czytajBaze, licznosciPliku, wloczka, zycie } from '../dane/pomocnicze/dane-wejsciowe';
import { procesZabityZOtwartaBaza, uszkodzStrone } from './pomocnicze';
import { katalogTymczasowy, licznosci, migawka, przygotuj, sha256Pliku, wlozPlik, wykonaj, zegarTestowy } from '../dane/pomocnicze/srodowisko';

const PLIKI = ['oczko.db', 'oczko.db-wal', 'oczko.db-shm'];

describe('ADR-0020 (1) surowa kopia po awarii procesu', () => {
  test('P-080 (3b) zasada wspólna 10: proces zabity z otwartą bazą WAL → surowa kopia ma 100 ze 100 wierszy, oryginał bajt w bajt bez zmian', async () => {
    const dane = katalogTymczasowy();
    procesZabityZOtwartaBaza(dane, 100);
    expect(PLIKI.map((n) => existsSync(join(dane, n)))).toEqual([true, true, true]);
    expect(statSync(join(dane, 'oczko.db-wal')).size).toBeGreaterThan(0); // zapisy są w -wal, nie w .db
    const sha = PLIKI.map((n) => sha256Pliku(join(dane, n)));

    const w = await surowaKopia(dane, join(dane, 'kopie'), zegarTestowy());
    if (!w.ok) throw new Error(w.powod);
    expect(w.wartosc.pliki.sort()).toEqual([...PLIKI].sort());
    expect(PLIKI.map((n) => sha256Pliku(join(dane, n)))).toEqual(sha);
    // Odczyt kopii osobnym połączeniem (z jej -wal obok): komplet wierszy.
    expect(czytajBaze(join(w.wartosc.katalog, 'oczko.db'), 'SELECT count(*) AS n FROM t')).toEqual([{ n: 100 }]);
  });

  test('P-080 (3b) kontrola wzorca 12: kopia samego oczko.db po tej samej awarii gubi zatwierdzone zapisy (dlatego trzy pliki)', () => {
    const dane = katalogTymczasowy();
    procesZabityZOtwartaBaza(dane, 100);
    const sam = join(katalogTymczasowy(), 'oczko.db');
    copyFileSync(join(dane, 'oczko.db'), sam); // bez -wal i -shm
    const n = (() => { try { return czytajBaze<{ n: number }>(sam, 'SELECT count(*) AS n FROM t')[0].n; } catch { return 0; } })(); // brak tabeli = 0
    expect(n).toBeLessThan(100);
  });
});

describe('ADR-0020 (2), (2′), (5′) sprawdzKopie — przypadki uzupełniające', () => {
  test('P-080 (3b): uszkodzona strona w środku poprawnej bazy → odrzucona (ok: false), plik kopii nietknięty', async () => {
    const k = katalogTymczasowy();
    const p = join(k, 'uszkodzona.db');
    bazaWzorcowa(p, Array.from({ length: 400 }, (_, i) => wloczka(`y${i}`, `Merino ${'x'.repeat(200)} ${i}`)));
    uszkodzStrone(p, 7); // strona z danymi wloczka
    const sha = sha256Pliku(p);
    const w = await sprawdzKopie(p);
    expect(w.ok).toBe(false);
    expect(sha256Pliku(p)).toBe(sha);
  });

  test('P-080 (3b): baza z tabelami Oczka, ale user_version 0 (starsza niż najstarsza wydana) → bledne_dane', async () => {
    const p = join(katalogTymczasowy(), 'v0.db');
    bazaWzorcowa(p, [wloczka('y1', 'Merino')], { userVersion: 0 });
    expect(await sprawdzKopie(p)).toEqual({ ok: false, powod: 'bledne_dane' });
  });

  test('P-124 (2′): tabele Oczka, user_version bieżący, inny application_id → bledne_dane (obca baza)', async () => {
    const p = join(katalogTymczasowy(), 'obca.db');
    bazaWzorcowa(p, [wloczka('y1', 'Merino')], { dodatkowySql: 'PRAGMA application_id = 42;' });
    expect(czytajBaze(p, 'PRAGMA application_id')).toEqual([{ application_id: 42 }]);
    expect(await sprawdzKopie(p)).toEqual({ ok: false, powod: 'bledne_dane' });
  });

  test('P-080 (3b): plik zerowej długości → bledne_dane, bez utworzenia bazy w jego miejscu', async () => {
    const p = join(katalogTymczasowy(), 'zero.db');
    closeSync(openSync(p, 'w'));
    expect(await sprawdzKopie(p)).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(statSync(p).size).toBe(0);
  });

  test('P-080 (3b): surowa kopia po awarii (z -wal obok) przechodzi sprawdzenie, gdy pochodzi z bazy Oczka', async () => {
    const s = await przygotuj();
    await s.baza.run('PRAGMA wal_autocheckpoint = 0');
    await wykonaj(s.baza, [wloczka('y1', 'Merino'), wloczka('y2', 'Alpaka')]);
    const w = await surowaKopia(s.katalog, join(s.katalog, 'kopie'), zegarTestowy());
    if (!w.ok) throw new Error(w.powod);
    expect(await sprawdzKopie(join(w.wartosc.katalog, 'oczko.db'))).toEqual({ ok: true, wartosc: { wersjaSchematu: WERSJA_SCHEMATU } });
    expect(czytajBaze(join(w.wartosc.katalog, 'oczko.db'), 'SELECT count(*) AS n FROM wloczka')).toEqual([{ n: 2 }]);
  });
});

describe('ADR-0020 (5′) przywrócenie z kopii', () => {
  async function stanZKopia() {
    const s = await przygotuj();
    const pliki = { pdf: wlozPlik(s.magazyn, 'a', 'pdf'), rys: wlozPlik(s.magazyn, 'b', 'pkdrawing'), jpg: wlozPlik(s.magazyn, 'c', 'jpg') };
    await wykonaj(s.baza, zycie(pliki)); // stan A
    const kopia = join(s.katalog, 'kopia-uzytkownika.db');
    expect(await kopiaBazy(s.baza, kopia)).toMatchObject({ ok: true });
    const a = await licznosci(s.baza);
    // stan B: nowe dane po kopii, wpis diagnostyki i klucz stanu urządzenia
    await wykonaj(s.baza, [wloczka('y9', 'Jedwab'), ["INSERT INTO blad (czas_ms, kod) VALUES (1, 'test')", []], ["INSERT INTO ustawienie (klucz, wartosc, zmieniono_ms) VALUES ('ostatni_start_ms', '123', 1)", []]]);
    return { s, kopia, a };
  }

  test('P-080 (3b) BR-DAN-006/S3: poprawna kopia → dane jak w kopii (liczności), kopia „przed” ma stan sprzed przywrócenia, integrity_check = ok', async () => {
    const { s, kopia, a } = await stanZKopia();
    const b = await licznosci(s.baza);
    const w = await przywrocZKopii({ baza: s.baza, zegar: s.zegar, katalogi: s.z.katalogi }, kopia);
    if (!w.ok) throw new Error(w.powod);
    const po = await licznosci(s.baza);
    expect({ ...po, blad: undefined, ustawienie: undefined }).toEqual({ ...a, blad: undefined, ustawienie: undefined });
    expect(licznosciPliku(w.wartosc.kopiaPrzed)).toEqual(b);
    expect(await s.baza.all('PRAGMA integrity_check')).toEqual([{ integrity_check: 'ok' }]);
    expect(await s.baza.all('PRAGMA foreign_key_check')).toEqual([]);
  });

  test('P-124 (5′): `blad` i klucze stanu urządzenia po „zastąp” takie jak przed', async () => {
    const { s, kopia } = await stanZKopia();
    const przed = { blad: await s.baza.all('SELECT * FROM blad'), klucz: await s.baza.all("SELECT * FROM ustawienie WHERE klucz = 'ostatni_start_ms'") };
    expect(await przywrocZKopii({ baza: s.baza, zegar: s.zegar, katalogi: s.z.katalogi }, kopia)).toMatchObject({ ok: true });
    expect({ blad: await s.baza.all('SELECT * FROM blad'), klucz: await s.baza.all("SELECT * FROM ustawienie WHERE klucz = 'ostatni_start_ms'") }).toEqual(przed);
  });

  test('P-080 (3b) ADR-0002 (7): błąd w trakcie przenoszenia (czas w tle wygasł) → bieżąca baza bez zmian, kopia „przed” istnieje', async () => {
    const { s, kopia } = await stanZKopia();
    const przed = await migawka(s.baza);
    let wywolan = 0;
    const sygnal = { wygaslo: () => ++wywolan > 25 }; // w połowie usuwania i wstawiania
    const w = await przywrocZKopii({ baza: s.baza, zegar: s.zegar, katalogi: s.z.katalogi }, kopia, sygnal);
    expect(w.ok).toBe(false);
    expect(wywolan).toBeGreaterThan(25);
    expect(await migawka(s.baza)).toBe(przed);
    expect(readdirSync(s.z.katalogi.kopie).filter((n) => n.startsWith('przed-przywroceniem-'))).toHaveLength(1);
  });

  test('P-080 (3b): kopia uszkodzona → odrzucona przed czymkolwiek: baza bez zmian, bez kopii „przed”', async () => {
    const { s, kopia } = await stanZKopia();
    uszkodzStrone(kopia, 5);
    const przed = await migawka(s.baza);
    expect((await przywrocZKopii({ baza: s.baza, zegar: s.zegar, katalogi: s.z.katalogi }, kopia)).ok).toBe(false);
    expect(await migawka(s.baza)).toBe(przed);
    mkdirSync(s.z.katalogi.kopie, { recursive: true });
    expect(readdirSync(s.z.katalogi.kopie).filter((n) => n.startsWith('przed-przywroceniem-'))).toEqual([]);
  });
});
