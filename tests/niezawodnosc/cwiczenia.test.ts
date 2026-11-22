// Rola 12 E3 (P-194, P-079 Q2a, P-187): ćwiczenia automatem na Linuksie — prawdziwy kod startu i trybu awaryjnego (`src/kompozycja/start-aplikacji.ts`),
// prawdziwy dysk i SQLite (zastępniki expo-file-system i expo-sqlite z jest.config.js), awarie procesu przez SIGKILL. Wynik z datą: docs/niezawodnosc/runbook.md §6.
// Na symulatorze i telefonie (krok 07/10): scenariusz E2E 09 i lista „Nie sprawdzono” w runbooku.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { PortBazy } from '../../src/domena/porty';
import { kopiaBazy } from '../../src/dane/baza/kopia';
import { przywrocZKopii, surowaKopia } from '../../src/dane/kopia-ratunkowa';
import { migruj } from '../../src/dane/migracje/migruj';
import { rozpocznijStart, trybAwaryjny, zapiszKamien } from '../../src/kompozycja/start-aplikacji';
import { zipSurowejKopii } from '../../src/niezawodnosc/kopie';
import { uruchomDane } from '../../src/przypadki-uzycia/start';
import { czytajBaze, czytajZip, licznosciPliku, zycie } from '../dane/pomocnicze/dane-wejsciowe';
import { katalogTymczasowy, licznosci, migawka, przygotuj, sha256, sha256Pliku, wlozPlik, wykonaj, zegarTestowy } from '../dane/pomocnicze/srodowisko';
import { uszkodzStrone } from './pomocnicze';

let mockBiblioteka = '';
let mockBrakMiejsca: RegExp | null = null; // ścieżki, na których zapis pliku zwraca ENOSPC
jest.mock('../../src/dane/pliki/system', () => {
  const r = jest.requireActual('../../src/dane/pliki/system');
  const enospc = (p: string) => { if (mockBrakMiejsca?.test(p)) throw new Error('ENOSPC: no space left on device'); };
  return {
    ...r,
    katalogBiblioteki: () => mockBiblioteka,
    kopiuj: (z: string, c: string) => { enospc(c); r.kopiuj(z, c); },
    zapiszTekst: (p: string, t: string) => { enospc(p); r.zapiszTekst(p, t); },
  };
});

const PLIKI = ['oczko.db', 'oczko.db-wal', 'oczko.db-shm'];
/** Kontener aplikacji z danymi „życia” użytkownika; proces kończy się bez zamknięcia bazy (jak zabicie), więc zapisy zostają w -wal. */
async function instalacjaZDanymi(): Promise<{ as: string; przed: Record<string, number> }> {
  mockBiblioteka = join(katalogTymczasowy('oczko-cw-'), 'Library');
  const as = join(mockBiblioteka, 'Application Support');
  mkdirSync(as, { recursive: true });
  const s = await przygotuj({ katalog: as });
  await s.baza.run('PRAGMA wal_autocheckpoint = 0');
  const pliki = { pdf: wlozPlik(s.magazyn, 'a', 'pdf'), rys: wlozPlik(s.magazyn, 'b', 'pkdrawing'), jpg: wlozPlik(s.magazyn, 'c', 'jpg') };
  await wykonaj(s.baza, zycie(pliki));
  const przed = await licznosci(s.baza);
  return { as, przed };
}
const shaPlikow = (as: string) => PLIKI.filter((n) => existsSync(join(as, n))).map((n) => `${n}:${sha256Pliku(join(as, n))}`);

beforeEach(() => { mockBrakMiejsca = null; });

describe('Ćwiczenie 1 — pętla awarii przy starcie (ADR-0019, P-080 próg 2)', () => {
  test('P-080: dwa starty bez kamienia → trzeci awaryjny; „Zapisz kopię danych” = archiwum z licznościami bazy; pliki bazy przed kopią bez zmian', async () => {
    const { as, przed } = await instalacjaZDanymi();
    expect((await rozpocznijStart()).tryb).toBe('normalny'); // start 1: awaria przed kamieniem (brak zapiszKamien)
    expect((await rozpocznijStart()).tryb).toBe('normalny'); // start 2: znów awaria
    expect(await rozpocznijStart()).toEqual({ tryb: 'awaryjny', powod: 'petla-startow' }); // start 3
    expect(await rozpocznijStart()).toEqual({ tryb: 'awaryjny', powod: 'petla-startow' }); // zamknięcie ekranu awaryjnego → znów awaryjny

    const sha = shaPlikow(as);
    const a = trybAwaryjny();
    const k = await a.kopia;
    if (!k.ok) throw new Error(k.powod);
    expect(k.wartosc.pliki.sort()).toEqual([...PLIKI].sort());
    expect(shaPlikow(join(k.wartosc.katalog))).toEqual(sha); // surowa kopia = bajty oryginału
    const arch = await a.zapiszKopie();
    if (!arch) throw new Error('archiwum = null');
    expect(arch.licznosci).toMatchObject({ projekt: przed.projekt, licznik: przed.licznik, zdarzenie: przed.zdarzenie });
    const zip = czytajZip(arch.sciezka);
    expect(zip.has('oczko.db')).toBe(true);
    // Obserwacja N12-11: zamknięcie połączenia trybu awaryjnego robi checkpoint — .db zmienia bajty, -wal znika; dane logicznie te same (surowa kopia zrobiona wcześniej).
    const po = join(as, 'oczko.db');
    expect(licznosciPliku(po)).toEqual(przed);
  });

  test('P-080: „Spróbuj normalnie” i kamień → licznik zero, następny start normalny', async () => {
    await instalacjaZDanymi();
    await rozpocznijStart(); await rozpocznijStart();
    expect((await rozpocznijStart()).tryb).toBe('awaryjny');
    const { sprobujNormalnieTeraz } = jest.requireActual('../../src/kompozycja/start-aplikacji') as typeof import('../../src/kompozycja/start-aplikacji');
    await sprobujNormalnieTeraz();
    await zapiszKamien();
    expect((await rozpocznijStart()).tryb).toBe('normalny');
  });
});

describe('Ćwiczenie 2 — zepsuty plik bazy (ADR-0019 „dane wymagają naprawy”, ADR-0020 (3))', () => {
  test('P-080 (3b): uszkodzona strona 2 → start danych zwraca błąd (ekran awaryjny); surowa kopia + ZIP z SHA-256 jak oryginał; oryginał nietknięty', async () => {
    const { as } = await instalacjaZDanymi();
    // checkpoint do .db w osobnym procesie, potem uszkodzenie strony 2 (jak błąd nośnika)
    const w = spawnSync(process.execPath, ['--no-warnings', '-e', `const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync(${JSON.stringify(join(as, 'oczko.db'))});d.exec('PRAGMA wal_checkpoint(TRUNCATE)');d.close();`]);
    expect(w.status).toBe(0);
    uszkodzStrone(join(as, 'oczko.db'), 2);
    const shaPrzed = shaPlikow(as);

    // Start normalny jak w aplikacji: otwarcie, migracje, dziennik, sesje, kosz (uruchomDane) → błąd → ekran awaryjny „dane wymagają naprawy”.
    const p = await przygotuj({ katalog: as });
    expect(await uruchomDane({ ...p.z, migruj: (b) => migruj(b) })).toEqual({ ok: false, powod: 'zapis' }); // powodAwaryjny('zapis') = 'uszkodzony'
    p.baza.zamknij();

    const a = trybAwaryjny();
    const k = await a.kopia;
    if (!k.ok) throw new Error(k.powod);
    expect(await a.zapiszKopie()).toBeNull(); // archiwum z uszkodzonej bazy się nie tworzy → droga ZIP (N12-03)
    const cel = join(katalogTymczasowy(), 'ratunkowa.zip');
    const z = await zipSurowejKopii(k.wartosc.katalog, k.wartosc.pliki, cel, { aplikacja: '1.0.0', build: '1', terazMs: zegarTestowy().teraz().ms });
    if (!z.ok) throw new Error(z.powod);
    const zip = czytajZip(cel);
    for (const p of z.wartosc.pliki) expect(sha256(zip.get(p.nazwa)!)).toBe(p.sha256);
    expect(z.wartosc.pliki.find((p) => p.nazwa === 'oczko.db')?.sha256).toBe(sha256Pliku(join(k.wartosc.katalog, 'oczko.db')));
    expect(shaPlikow(as).filter((x) => x.startsWith('oczko.db:'))).toEqual(shaPrzed.filter((x) => x.startsWith('oczko.db:')));
  });
});

describe('Ćwiczenie 3 — brak miejsca (ADR-0020 (4): niczego nie usuwamy)', () => {
  test('P-080 (3b): ENOSPC przy surowej kopii → powod brak_miejsca, oryginał bez zmian, nic nie usunięte', async () => {
    const { as } = await instalacjaZDanymi();
    const sha = shaPlikow(as);
    mockBrakMiejsca = /\/kopie\/ratunkowe-/;
    const k = await surowaKopia(as, join(as, 'kopie'), zegarTestowy());
    expect(k).toEqual({ ok: false, powod: 'brak_miejsca' });
    expect(shaPlikow(as)).toEqual(sha);
  });

  test('P-080 (3b): SQLITE_FULL przy VACUUM INTO → brak_miejsca, niepełny plik kopii usunięty', async () => {
    const pelny: PortBazy = { run: async () => { throw new Error('SQLITE_FULL: database or disk is full'); }, all: async () => [], transakcja: (f) => f(pelny) };
    const cel = join(katalogTymczasowy(), 'kopia.db');
    expect(await kopiaBazy(pelny, cel)).toEqual({ ok: false, powod: 'brak_miejsca' });
    expect(existsSync(cel)).toBe(false);
  });

  test('P-080 N12-09: ENOSPC przy zapisie stanu startu → start trwa normalnie (bez awarii), ale pętla nie jest liczona — ryzyko szczątkowe w runbooku', async () => {
    await instalacjaZDanymi();
    mockBrakMiejsca = /stan-startu\.json$/;
    for (let i = 0; i < 3; i++) expect((await rozpocznijStart()).tryb).toBe('normalny');
  });
});

describe('Ćwiczenie 4 — przerwane przywracanie (ADR-0020 (5′))', () => {
  test('P-080 (3b): proces zabity SIGKILL w środku transakcji przenoszenia → baza bez zmian, integrity_check ok, ponowne przywrócenie udane', async () => {
    const s = await przygotuj();
    const pliki = { pdf: wlozPlik(s.magazyn, 'a', 'pdf'), rys: wlozPlik(s.magazyn, 'b', 'pkdrawing'), jpg: wlozPlik(s.magazyn, 'c', 'jpg') };
    await wykonaj(s.baza, zycie(pliki));
    const kopia = join(s.katalog, 'kopia.db');
    expect(await kopiaBazy(s.baza, kopia)).toMatchObject({ ok: true });
    await s.baza.run("INSERT INTO wloczka (id, nazwa, zmieniono_ms) VALUES ('po-kopii', 'Jedwab', 1)");
    const przed = await migawka(s.baza);
    s.baza.zamknij();

    // Ten sam przebieg co zastapZKopii (ATTACH → BEGIN IMMEDIATE → defer_foreign_keys → DELETE dzieci→rodzice → część INSERT), potem SIGKILL.
    const skrypt = `const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync(${JSON.stringify(join(s.katalog, 'oczko.db'))});
      d.exec('PRAGMA foreign_keys = ON');d.prepare('ATTACH DATABASE ? AS kopia').run(${JSON.stringify(kopia)});d.exec('BEGIN IMMEDIATE');d.exec('PRAGMA defer_foreign_keys = ON');
      const t=d.prepare("SELECT name FROM main.sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name<>'blad'").all().map(r=>r.name);
      for(const n of t) d.exec('DELETE FROM main.'+n);
      d.exec('INSERT INTO main.projekt SELECT * FROM kopia.projekt');
      process.kill(process.pid,'SIGKILL');`;
    const w = spawnSync(process.execPath, ['--no-warnings', '-e', skrypt]);
    expect(w.signal).toBe('SIGKILL');
    expect(readdirSync(s.katalog).filter((n) => /-journal$/.test(n))).toEqual([]); // WAL, bez dziennika rollback

    const po = await przygotuj({ katalog: s.katalog }); // ponowne otwarcie = następny start aplikacji
    expect(await migawka(po.baza)).toBe(przed);
    expect(await po.baza.all('PRAGMA integrity_check')).toEqual([{ integrity_check: 'ok' }]);
    const r = await przywrocZKopii({ baza: po.baza, zegar: po.zegar, katalogi: po.z.katalogi }, kopia);
    if (!r.ok) throw new Error(r.powod);
    expect(czytajBaze(join(s.katalog, 'oczko.db'), "SELECT count(*) AS n FROM wloczka WHERE id = 'po-kopii'")).toEqual([{ n: 0 }]);
  });
});
