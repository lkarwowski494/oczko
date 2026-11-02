// Start, ścieżki plików, otwarcie bazy i kopia ratunkowa (ADR-0001, ADR-0015, ADR-0019, ADR-0020, P-070): ścieżki ŚU-16, ŚU-18, ŚU-21 (dane.md),
// R-082, R-088, R-089, BR-DAN-010/S3. Wyrocznie: ADR (ścieżki, zasady 1–6 ADR-0020), dane.md, P-070 (stary plik nietknięty: ten sam SHA-256).
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { PortBazy } from '../../src/domena/porty';
import { kopiaBazy } from '../../src/dane/baza/kopia';
import { otworzBaze } from '../../src/dane/baza/polaczenie';
import { sciezkiDanych } from '../../src/dane/baza/sciezki';
import { przywrocZKopii, sprawdzKopie, surowaKopia } from '../../src/dane/kopia-ratunkowa';
import { migruj } from '../../src/dane/migracje/migruj';
import { WERSJA_SCHEMATU } from '../../src/konfiguracja';
import { uruchomDane } from '../../src/przypadki-uzycia/start';
import { przygotujZgloszenie } from '../../src/przypadki-uzycia/zgloszenie';
import { bazaWzorcowa, czytajBaze, wloczka, zycie } from './pomocnicze/dane-wejsciowe';
import { T0, katalogTymczasowy, migawka, przygotuj, sha256Pliku, wlozPlik, wykonaj, zegarTestowy } from './pomocnicze/srodowisko';

describe('ścieżki danych i start nad 0.1.0', () => {
  test('ŚU-16 BR-DAN-004/S1 ADR-0001: baza, pliki, kopie, dziennik i stan startu w Library/Application Support — nic w Caches ani Documents', () => {
    const lib = '/kontener/Library';
    const sc = sciezkiDanych(lib);
    expect(sc.baza).toBe(join(lib, 'Application Support', 'oczko.db'));
    expect(sc.kopiePrzed).toBe('/kontener/Documents/Backup'); // ADR-0028: jedyny wyjątek od ADR-0001 — kopie przed importem i usunięciem mają być widoczne w Plikach
    for (const [nazwa, p] of Object.entries(sc).filter(([n]) => n !== 'kopiePrzed')) {
      expect({ nazwa, wApplicationSupport: p.startsWith(join(lib, 'Application Support') + '/') }).toEqual({ nazwa, wApplicationSupport: true });
      expect(p).not.toMatch(/\/(Caches|Documents|tmp)\//);
    }
  });

  test('ŚU-21 P-070 ADR-0015: stary plik Library/SQLite/oczko.db ma ten sam SHA-256 po starcie nowej wersji, obok nie powstaje nic nowego', async () => {
    const lib = join(katalogTymczasowy(), 'Library');
    const stary = join(lib, 'SQLite', 'oczko.db');
    mkdirSync(dirname(stary), { recursive: true });
    const db = new DatabaseSync(stary); // „0.1.0”: inna, nieznana nowej wersji struktura
    db.exec("CREATE TABLE projects (id INTEGER PRIMARY KEY, name TEXT); INSERT INTO projects (name) VALUES ('Sweter 0.1.0');");
    db.close();
    const shaPrzed = sha256Pliku(stary);
    const sc = sciezkiDanych(lib);
    expect(sc.baza).not.toBe(stary);
    mkdirSync(dirname(sc.baza), { recursive: true });
    const s = await przygotuj({ katalog: dirname(sc.baza) });
    expect(await uruchomDane({ ...s.z, migruj: (b) => migruj(b) })).toMatchObject({ ok: true });
    expect(sha256Pliku(stary)).toBe(shaPrzed);
    expect(readdirSync(dirname(stary))).toEqual(['oczko.db']);
    expect(await s.baza.all('SELECT count(*) AS n FROM projekt')).toEqual([{ n: 0 }]); // czysty start bez migracji 0.1.0 (P-070 (2c))
  });

  test.each([
    ['SQLITE_CANTOPEN: unable to open database file', 'zapis'],
    ['SQLITE_IOERR: disk I/O error', 'zapis'],
    ['SQLITE_NOTADB: file is not a database', 'uszkodzony'],
    ['SQLITE_CORRUPT: database disk image is malformed', 'uszkodzony'],
    ['SQLITE_FULL: database or disk is full', 'brak_miejsca'], // M1-audytor-generalny-100: brak miejsca przy otwarciu (ADR-0020 (4))
    ['ENOSPC: no space left on device', 'brak_miejsca'],
  ])('ŚU-18 R-082 R-089 ADR-0019 Z07-21: otwarcie bazy rzuca „%s” → powod „%s”, bez bazy zastępczej (fabryka wołana raz, z tą samą ścieżką)', async (blad, powod) => {
    const wolania: string[] = [];
    const fabryka = (sciezka: string): PortBazy => { wolania.push(sciezka); throw new Error(blad); };
    const sciezka = join(katalogTymczasowy(), 'Application Support', 'oczko.db');
    expect(await otworzBaze(sciezka, fabryka)).toEqual({ ok: false, powod });
    expect(wolania).toEqual([sciezka]);
  });
});

describe('kopie (VACUUM INTO) i kopia ratunkowa (ADR-0020)', () => {
  test('ŚU-09 P-047 ADR-0004: kopiaBazy przy WAL z wierszami tylko w -wal → kopia ma wszystkie wiersze i integrity_check = ok, bez -wal obok', async () => {
    const s = await przygotuj();
    await s.baza.run('PRAGMA wal_autocheckpoint = 0');
    for (let i = 0; i < 100; i++) await s.baza.run('INSERT INTO wloczka (id, nazwa, zmieniono_ms) VALUES (?, ?, ?)', [`y${i}`, 'Merino', T0]);
    const cel = join(s.z.katalogi.kopie, 'przed-importem.db');
    expect(await kopiaBazy(s.baza, cel)).toMatchObject({ ok: true });
    expect(czytajBaze(cel, 'SELECT count(*) n FROM wloczka')).toEqual([{ n: 100 }]);
    expect(czytajBaze(cel, 'PRAGMA integrity_check')).toEqual([{ integrity_check: 'ok' }]);
    expect(readdirSync(s.z.katalogi.kopie).filter((n) => n.endsWith('-wal'))).toEqual([]);
  });

  test('ADR-0020 (1) P-080: surowa kopia — oczko.db, -wal, -shm skopiowane bajt w bajt do kopie/ratunkowe-<czas>/', async () => {
    const k = katalogTymczasowy();
    for (const [n, t] of [['oczko.db', 'baza'], ['oczko.db-wal', 'wal'], ['oczko.db-shm', 'shm']]) writeFileSync(join(k, n), `${t} ${'x'.repeat(100)}`);
    const w = await surowaKopia(k, join(k, 'kopie'), zegarTestowy());
    if (!w.ok) throw new Error(w.powod);
    expect(w.wartosc.katalog.startsWith(join(k, 'kopie', 'ratunkowe-'))).toBe(true);
    for (const n of ['oczko.db', 'oczko.db-wal', 'oczko.db-shm']) expect(sha256Pliku(join(w.wartosc.katalog, n))).toBe(sha256Pliku(join(k, n)));
  });

  const kopie: [string, 'ok' | 'wersja_nowsza' | 'bledne_dane', (k: string) => string][] = [
    ['kopia bieżącej wersji', 'ok', (k) => { const p = join(k, 'a.db'); bazaWzorcowa(p, [wloczka('y1', 'Merino')]); return p; }],
    ['kopia nowszej wersji', 'wersja_nowsza', (k) => { const p = join(k, 'b.db'); bazaWzorcowa(p, [], { userVersion: WERSJA_SCHEMATU + 1 }); return p; }],
    ['plik obcy (nie SQLite)', 'bledne_dane', (k) => { const p = join(k, 'c.db'); writeFileSync(p, 'to nie jest baza'); return p; }],
    ['pusta baza SQLite bez tabel Oczka', 'bledne_dane', (k) => { const p = join(k, 'd.db'); const db = new DatabaseSync(p); db.exec('CREATE TABLE x (a)'); db.close(); return p; }],
  ];
  test.each(kopie)('ADR-0020 (2), (5) R-088: sprawdzKopie — %s → %s', async (_n, oczek, zrob) => {
    const w = await sprawdzKopie(zrob(katalogTymczasowy()));
    if (oczek === 'ok') expect(w).toEqual({ ok: true, wartosc: { wersjaSchematu: WERSJA_SCHEMATU } });
    else expect(w).toEqual({ ok: false, powod: oczek });
  });

  test('ADR-0020 (5) R-088: przywrócenie z kopii nowszej wersji odrzucone bez zmian w danych', async () => {
    const s = await przygotuj();
    const pliki = { pdf: wlozPlik(s.magazyn, 'a', 'pdf'), rys: wlozPlik(s.magazyn, 'b', 'pkdrawing'), jpg: wlozPlik(s.magazyn, 'c', 'jpg') };
    await wykonaj(s.baza, zycie(pliki));
    const przed = await migawka(s.baza, ['blad']);
    const kopia = join(s.katalog, 'nowsza.db');
    bazaWzorcowa(kopia, [], { userVersion: WERSJA_SCHEMATU + 1 });
    expect(await przywrocZKopii({ baza: s.baza, zegar: s.zegar, katalogi: s.z.katalogi }, kopia)).toEqual({ ok: false, powod: 'wersja_nowsza' });
    expect(await migawka(s.baza, ['blad'])).toBe(przed);
  });
});

describe('„Zgłoś problem” (F-57)', () => {
  test('BR-DAN-010/S3 NFR-PRY-001: przygotowanie i rezygnacja → nic nie zapisane w bazie; treść bez nazw projektów i notatek', async () => {
    const s = await przygotuj();
    const pliki = { pdf: wlozPlik(s.magazyn, 'a', 'pdf'), rys: wlozPlik(s.magazyn, 'b', 'pkdrawing'), jpg: wlozPlik(s.magazyn, 'c', 'jpg') };
    await wykonaj(s.baza, zycie(pliki));
    const przed = await migawka(s.baza);
    const w = await przygotujZgloszenie(s.z);
    if (!w.ok) throw new Error(w.powod);
    expect(w.wartosc.tresc).not.toMatch(/Projekt \d|ujmowanie co 4|warkocz|Merino/);
    expect(await migawka(s.baza)).toBe(przed);
  });
});
