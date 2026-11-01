// Archiwum `.oczko`: eksport i import (ADR-0004, ADR-0020 (5), dane.md „Kopie i eksport”, maszyna importu moduly.md, P-047, P-091 (6a)).
// Ścieżki ŚU-09, ŚU-10, ŚU-11, ŚU-12, ŚU-13, ŚU-17 (dane.md); BR-DAN-005/S1, BR-DAN-006/S1–S5; R-063, R-064, R-066, R-067, R-068, R-088.
// Archiwa wejściowe budowane bez kodu aplikacji (node:sqlite + schemat.sql v1 + własny zapis ZIP); wyjściowe czytane własnym czytnikiem ZIP.
import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { utworzArchiwum } from '../../src/dane/archiwum';
import { przywrocZKopii } from '../../src/dane/kopia-ratunkowa';
import { migruj } from '../../src/dane/migracje/migruj';
import { ROZSZERZENIE_ARCHIWUM, WERSJA_FORMATU_ARCHIWUM, WERSJA_SCHEMATU } from '../../src/konfiguracja';
import { eksportuj, importuj } from '../../src/przypadki-uzycia/archiwum';
import type { Manifest } from '../../src/przypadki-uzycia/porty-propozycja';
import {
  archiwumWzorcowe, czesc, czytajBaze, czytajZip, licznik, licznosciPliku, projekt, ustawGlowe, zapiszZip, zdarzenie, zycie, type Instr,
} from './pomocnicze/dane-wejsciowe';
import { GODZ, MIN, T0, czasWTle, ile, jeden, licznosci, migawka, przygotuj, sha256, sha256Pliku, wlozPlik, wykonaj } from './pomocnicze/srodowisko';

const POMIN = ['blad', 'ustawienie']; // diagnostyka i mały stan nie są danymi użytkownika w porównaniu
const TRESCI = { pdf: Buffer.from('PDF-1.4 abc'), rys: Buffer.from('PKDRAWING'), jpg: Buffer.from('JPEG-DANE!') }; // bajty = zycie(): 11, 9, 10

async function srodowisko(o: Parameters<typeof przygotuj>[0] = {}) {
  const s = await przygotuj(o);
  const archiwum = utworzArchiwum({ baza: s.baza, magazyn: s.magazyn, zegar: s.zegar, katalogi: s.z.katalogi, migruj: (b) => migruj(b), aplikacja: '1.0.0 (test)' });
  return { ...s, za: { ...s.z, archiwum, czasWTle } };
}
async function zZyciem() {
  const s = await srodowisko();
  const pliki = { pdf: wlozPlik(s.magazyn, TRESCI.pdf, 'pdf'), rys: wlozPlik(s.magazyn, TRESCI.rys, 'pkdrawing'), jpg: wlozPlik(s.magazyn, TRESCI.jpg, 'jpg') };
  await wykonaj(s.baza, zycie(pliki));
  return { ...s, pliki };
}
const szpieg = (odp: 'scal' | 'zastap' | 'anuluj') => { const wywolania: Manifest[] = []; return { wywolania, wybierz: async (m: Manifest) => { wywolania.push(m); return odp; } }; };
const doKatalogu = (k: string) => { mkdirSync(k, { recursive: true }); return k; };

describe('eksport (BR-DAN-005, ADR-0004)', () => {
  test('07-jakosc-002 (BR-DAN-005, ADR-0004): drugi eksport tego samego dnia do tego samego katalogu dostaje nazwę z sufiksem -2, a pierwszy plik zostaje bez zmian', async () => {
    const s = await zZyciem();
    const cel = doKatalogu(join(s.katalog, 'eksport-dwa-razy'));
    const pierwszy = await eksportuj(s.za, { katalogDocelowy: cel });
    if (!pierwszy.ok) throw new Error(pierwszy.powod);
    const sha = sha256Pliku(pierwszy.wartosc.sciezka);
    const drugi = await eksportuj(s.za, { katalogDocelowy: cel });
    if (!drugi.ok) throw new Error(drugi.powod);
    expect(drugi.wartosc.sciezka).not.toBe(pierwszy.wartosc.sciezka);
    expect(drugi.wartosc.sciezka.endsWith(`-2${ROZSZERZENIE_ARCHIWUM}`)).toBe(true);
    expect(sha256Pliku(pierwszy.wartosc.sciezka)).toBe(sha);
    expect(readdirSync(cel)).toHaveLength(2);
  });
  test('BR-DAN-005/S1: pełny eksport — manifest (format, wersje, liczności, pliki), oczko.db z tymi samymi licznościami, pliki/<sha256> zgodne z bajtami', async () => {
    const s = await zZyciem();
    const cel = doKatalogu(join(s.katalog, 'eksport'));
    const w = await eksportuj(s.za, { katalogDocelowy: cel });
    if (!w.ok) throw new Error(w.powod);
    expect(w.wartosc.sciezka.endsWith(ROZSZERZENIE_ARCHIWUM)).toBe(true);
    const zip = czytajZip(w.wartosc.sciezka);
    const manifest = JSON.parse(zip.get('manifest.json')!.toString('utf8')) as Manifest;
    expect(manifest).toMatchObject({ format: 'oczko', wersja_formatu: WERSJA_FORMATU_ARCHIWUM, wersja_schematu: WERSJA_SCHEMATU, utworzono: s.zegar.teraz().ms });
    const lic = await licznosci(s.baza);
    expect(manifest.licznosci).toEqual(lic);
    const db = join(s.katalog, 'z-archiwum.db');
    writeFileSync(db, zip.get('oczko.db')!);
    expect(licznosciPliku(db)).toEqual(lic);
    expect(czytajBaze(db, 'PRAGMA integrity_check')).toEqual([{ integrity_check: 'ok' }]);
    const wpisyPlikow = [...zip.keys()].filter((k) => k.startsWith('pliki/')).sort();
    expect(wpisyPlikow).toEqual([`pliki/${s.pliki.jpg}.jpg`, `pliki/${s.pliki.pdf}.pdf`, `pliki/${s.pliki.rys}.pkdrawing`].sort());
    for (const k of wpisyPlikow) expect(sha256(zip.get(k)!)).toBe(k.slice(6, 70));
    expect(new Set(manifest.pliki.map((p) => `${p.sha256}:${p.bajty}`))).toEqual(new Set([`${s.pliki.pdf}:11`, `${s.pliki.rys}:9`, `${s.pliki.jpg}:10`]));
  });

  test('ŚU-09 BR-DAN-005/S1 ADR-0001: baza w WAL z 100 wierszami tylko w -wal → archiwum ma 100 wierszy (VACUUM INTO, nie kopia samego .db; wal-kopia.out)', async () => {
    const s = await srodowisko();
    expect(await s.baza.all('PRAGMA journal_mode')).toEqual([{ journal_mode: 'wal' }]);
    await s.baza.run('PRAGMA wal_autocheckpoint = 0'); // jak eksperyment docs/niezawodnosc/eksperymenty/wal-kopia.mjs
    for (let i = 0; i < 100; i++) await s.baza.run('INSERT INTO wloczka (id, nazwa, zmieniono_ms) VALUES (?, ?, ?)', [`y${i}`, `Włóczka ${i}`, T0]);
    expect(statSync(join(s.katalog, 'oczko.db-wal')).size).toBeGreaterThan(0);
    const w = await eksportuj(s.za, { katalogDocelowy: doKatalogu(join(s.katalog, 'eksport')) });
    if (!w.ok) throw new Error(w.powod);
    const zip = czytajZip(w.wartosc.sciezka);
    expect([...zip.keys()].filter((k) => /-wal$|-shm$/.test(k))).toEqual([]);
    const db = join(s.katalog, 'z-archiwum.db');
    writeFileSync(db, zip.get('oczko.db')!);
    expect(czytajBaze(db, 'SELECT count(*) n FROM wloczka')).toEqual([{ n: 100 }]);
    expect(czytajBaze(db, 'PRAGMA integrity_check')).toEqual([{ integrity_check: 'ok' }]);
  });

  test('R-063 ADR-0008: eksport najpierw scala dziennik +1 — trzy nieskalone stuknięcia są w oczko.db archiwum', async () => {
    const s = await srodowisko();
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 5)]);
    const l = (id: string, r: string, i: number) => ({ id, licznikId: 'l1', rodzaj: 'plus' as const, rodzice: [r], czasMs: T0 + i * MIN, strefa: 'Europe/Warsaw', dzien: '2026-10-22', zrodlo: 'ekran_blokady' as const, urzadzenie: 'iphone-test', pro: false });
    s.dziennik.linie.push(l('d1', 'l1-z5', 10), l('d2', 'd1', 11), l('d3', 'd2', 12));
    const w = await eksportuj(s.za, { katalogDocelowy: doKatalogu(join(s.katalog, 'eksport')) });
    if (!w.ok) throw new Error(w.powod);
    const db = join(s.katalog, 'z-archiwum.db');
    writeFileSync(db, czytajZip(w.wartosc.sciezka).get('oczko.db')!);
    expect(czytajBaze(db, "SELECT count(*) n FROM zdarzenie WHERE licznik_id = 'l1'")).toEqual([{ n: 8 }]);
    expect(czytajBaze(db, "SELECT wartosc FROM licznik WHERE id = 'l1'")).toEqual([{ wartosc: 8 }]);
  });

  test('ŚU-17 R-064 ADR-0004: za mało miejsca przed eksportem → powod „brak_miejsca”, w katalogu docelowym nie zostaje żaden plik', async () => {
    const s = await zZyciem();
    s.magazyn.wolne = 10;
    const cel = doKatalogu(join(s.katalog, 'eksport'));
    expect(await eksportuj(s.za, { katalogDocelowy: cel })).toEqual({ ok: false, powod: 'brak_miejsca' });
    expect(readdirSync(cel)).toEqual([]);
  });
});

describe('import (BR-DAN-006, ADR-0004, maszyna importu)', () => {
  test('BR-DAN-006/S1: pełny obieg — eksport z A, import na czystej instalacji B → te same projekty, liczniki, historia, notatki, zapas, wzory, zdjęcia', async () => {
    const a = await zZyciem();
    const w = await eksportuj(a.za, { katalogDocelowy: doKatalogu(join(a.katalog, 'eksport')) });
    if (!w.ok) throw new Error(w.powod);
    const b = await srodowisko({ prefiksId: '1' });
    const wynik = await importuj(b.za, { sciezka: w.wartosc.sciezka, wybierz: szpieg('scal').wybierz });
    expect(wynik).toMatchObject({ ok: true });
    expect(await migawka(b.baza, POMIN)).toBe(await migawka(a.baza, POMIN));
    for (const h of Object.values(a.pliki)) expect(sha256Pliku(b.magazyn.sciezka(h))).toBe(h);
  });

  const obce: [string, (k: string) => string][] = [
    ['plik tekstowy z rozszerzeniem .oczko', (k) => { const p = join(k, 'notatki.oczko'); writeFileSync(p, 'to nie jest archiwum'); return p; }],
    ['ZIP z manifestem innej aplikacji', (k) => { const p = join(k, 'inny.oczko'); zapiszZip(p, [{ nazwa: 'manifest.json', dane: Buffer.from('{"format":"inna-aplikacja","wersja_formatu":1}') }]); return p; }],
    ['ZIP bez manifestu', (k) => { const p = join(k, 'pusty.oczko'); zapiszZip(p, [{ nazwa: 'dane.csv', dane: Buffer.from('a,b\n1,2') }]); return p; }],
  ];
  test.each(obce)('BR-DAN-006/S2 R-067: %s → powod „bledne_dane”, dane bez zmian, bez pytania o tryb', async (_n, zrob) => {
    const s = await zZyciem();
    const przed = await migawka(s.baza, POMIN);
    const sz = szpieg('scal');
    expect(await importuj(s.za, { sciezka: zrob(s.katalog), wybierz: sz.wybierz })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await migawka(s.baza, POMIN)).toBe(przed);
    expect(sz.wywolania).toEqual([]);
  });

  test('ŚU-10 R-067 ADR-0004: archiwum z wersja_schematu = WERSJA_SCHEMATU + 1 → powod „wersja_nowsza”, baza bez zmian, bez kopii przed importem', async () => {
    const s = await zZyciem();
    const przed = await migawka(s.baza, POMIN);
    const sciezka = archiwumWzorcowe(s.katalog, 'nowsze', [projekt('cz', 'Czapka')], { wersjaSchematu: WERSJA_SCHEMATU + 1 });
    const sz = szpieg('zastap');
    expect(await importuj(s.za, { sciezka, wybierz: sz.wybierz })).toEqual({ ok: false, powod: 'wersja_nowsza' });
    expect(await migawka(s.baza, POMIN)).toBe(przed);
    expect(sz.wywolania).toEqual([]);
    expect(readdirSync(s.z.katalogi.kopie)).toEqual([]);
  });

  test('R-067 ADR-0004: zły SHA-256 pliku w manifeście → powod „uszkodzony”, baza i magazyn bez zmian', async () => {
    const s = await zZyciem();
    const przed = await migawka(s.baza, POMIN);
    const plikiPrzed = readdirSync(s.magazyn.katalog).sort();
    const sciezka = archiwumWzorcowe(s.katalog, 'zly-sha', [projekt('cz', 'Czapka')], { pliki: [{ dane: Buffer.from('zdjęcie'), rozszerzenie: 'jpg' }], zepsujSha: true });
    expect(await importuj(s.za, { sciezka, wybierz: szpieg('scal').wybierz })).toEqual({ ok: false, powod: 'uszkodzony' });
    expect(await migawka(s.baza, POMIN)).toBe(przed);
    expect(readdirSync(s.magazyn.katalog).sort()).toEqual(plikiPrzed);
  });

  test('ŚU-17 ADR-0004: za mało miejsca na import → powod „brak_miejsca”, baza bez zmian', async () => {
    const s = await zZyciem();
    const przed = await migawka(s.baza, POMIN);
    const sciezka = archiwumWzorcowe(s.katalog, 'duze', [projekt('cz', 'Czapka')]);
    s.magazyn.wolne = 10;
    expect(await importuj(s.za, { sciezka, wybierz: szpieg('scal').wybierz })).toEqual({ ok: false, powod: 'brak_miejsca' });
    expect(await migawka(s.baza, POMIN)).toBe(przed);
  });

  test('ŚU-11 BR-DAN-006/S3 P-047 R-068: „zastąp” → najpierw kopia przed importem (ścieżka zwrócona), potem dane z pliku; przywrócenie kopii → liczności jak przed', async () => {
    const s = await zZyciem();
    const przed = await licznosci(s.baza);
    const migPrzed = await migawka(s.baza, POMIN);
    const ino = statSync(join(s.katalog, 'oczko.db')).ino;
    const sciezka = archiwumWzorcowe(s.katalog, 'czapka', [projekt('cz', 'Czapka'), czesc('cc', 'cz', 'Główka'), ...licznik('lc', 'cc', 4)]);
    const w = await importuj(s.za, { sciezka, wybierz: szpieg('zastap').wybierz });
    if (!w.ok) throw new Error(w.powod);
    expect(w.wartosc.tryb).toBe('zastap');
    expect(w.wartosc.kopiaPrzed).toEqual(expect.stringContaining(s.z.katalogi.kopie));
    expect(licznosciPliku(w.wartosc.kopiaPrzed!)).toEqual(przed); // kopia zrobiona przed zastąpieniem
    expect(await s.baza.all('SELECT nazwa FROM projekt')).toEqual([{ nazwa: 'Czapka' }]);
    expect(statSync(join(s.katalog, 'oczko.db')).ino).toBe(ino); // ADR-0020 (5), R-088: bez podmiany pliku bazy
    expect(await przywrocZKopii({ baza: s.baza, zegar: s.zegar, katalogi: s.z.katalogi }, w.wartosc.kopiaPrzed!)).toMatchObject({ ok: true });
    expect(await licznosci(s.baza)).toEqual(przed);
    expect(await migawka(s.baza, POMIN)).toBe(migPrzed);
  });

  test('BR-DAN-006/S5: rezygnacja przy wyborze „zastąp”/„scal” → dane bez zmian, bez kopii przed importem', async () => {
    const s = await zZyciem();
    const przed = await migawka(s.baza, POMIN);
    const sz = szpieg('anuluj');
    const w = await importuj(s.za, { sciezka: archiwumWzorcowe(s.katalog, 'czapka', [projekt('cz', 'Czapka')]), wybierz: sz.wybierz });
    expect(w).toMatchObject({ ok: true, wartosc: { tryb: 'anulowano', kopiaPrzed: null } });
    expect(sz.wywolania).toHaveLength(1);
    expect(await migawka(s.baza, POMIN)).toBe(przed);
    expect(readdirSync(s.z.katalogi.kopie)).toEqual([]);
  });

  // P-091 (6a): „scal” po UUID, idempotentnie (BR-DAN-006/S4 do przepisania, ER-42); wyrocznia: ADR-0004, dane.md „Import”.
  const SKARPETA = (n: number): Instr[] => [projekt('sk', 'Skarpeta'), czesc('csk', 'sk', 'Cholewka'), ...licznik('lsk', 'csk', n)];
  test('ŚU-12 P-091 BR-DAN-006/S4 R-066: „scal” — ta sama Skarpeta (UUID) z 25 w pliku i 40 w aplikacji → jeden projekt z 40, „Czapka” dodana', async () => {
    const s = await srodowisko();
    await wykonaj(s.baza, SKARPETA(40));
    const sciezka = archiwumWzorcowe(s.katalog, 'z-ipada', [...SKARPETA(25), projekt('cz', 'Czapka'), czesc('cc', 'cz', 'Główka'), ...licznik('lc', 'cc', 4)]);
    expect(await importuj(s.za, { sciezka, wybierz: szpieg('scal').wybierz })).toMatchObject({ ok: true, wartosc: { tryb: 'scal', kopiaPrzed: null } });
    expect(await s.baza.all('SELECT id, nazwa FROM projekt ORDER BY id')).toEqual([{ id: 'cz', nazwa: 'Czapka' }, { id: 'sk', nazwa: 'Skarpeta' }]);
    expect(await jeden(s.baza, "SELECT wartosc, glowa, konflikt FROM licznik WHERE id = 'lsk'")).toEqual({ wartosc: 40, glowa: 'lsk-z40', konflikt: 0 });
    expect(await ile(s.baza, 'zdarzenie', "licznik_id = 'lsk'")).toBe(40);
  });

  test('ŚU-12 P-091 M-02: ten sam plik zaimportowany drugi raz („scal”) niczego nie zmienia', async () => {
    const s = await srodowisko();
    await wykonaj(s.baza, SKARPETA(40));
    const sciezka = archiwumWzorcowe(s.katalog, 'z-ipada', [...SKARPETA(25), projekt('cz', 'Czapka')]);
    await importuj(s.za, { sciezka, wybierz: szpieg('scal').wybierz });
    const po1 = await migawka(s.baza, POMIN);
    expect(await importuj(s.za, { sciezka, wybierz: szpieg('scal').wybierz })).toMatchObject({ ok: true });
    expect(await migawka(s.baza, POMIN)).toBe(po1);
  });

  test('ŚU-13 NFR-DAN-003 BR-DAN-002/S2 M-04: iPhone ustawił 20, iPad 18 od tej samej głowy → po „scal” konflikt = 1, obie zmiany z urządzeniem i godziną', async () => {
    const s = await srodowisko();
    const wspolne = [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 10)];
    await wykonaj(s.baza, [...wspolne, zdarzenie('iphone-w', 'l1', 'wpisanie', 20, ['l1-z10'], T0 + GODZ, { wartosc: 20, urzadzenie: 'iphone' }), ustawGlowe('l1', 20, 'iphone-w')]);
    const sciezka = archiwumWzorcowe(s.katalog, 'ipad', [...wspolne, zdarzenie('ipad-w', 'l1', 'wpisanie', 18, ['l1-z10'], T0 + 2 * GODZ, { wartosc: 18, urzadzenie: 'ipad' }), ustawGlowe('l1', 18, 'ipad-w')]);
    expect(await importuj(s.za, { sciezka, wybierz: szpieg('scal').wybierz })).toMatchObject({ ok: true });
    expect(await jeden(s.baza, "SELECT konflikt FROM licznik WHERE id = 'l1'")).toEqual({ konflikt: 1 });
    expect(await s.baza.all("SELECT id, wartosc, urzadzenie, czas_ms FROM zdarzenie WHERE rodzaj = 'wpisanie' ORDER BY czas_ms")).toEqual([
      { id: 'iphone-w', wartosc: 20, urzadzenie: 'iphone', czas_ms: T0 + GODZ },
      { id: 'ipad-w', wartosc: 18, urzadzenie: 'ipad', czas_ms: T0 + 2 * GODZ },
    ]);
  });
});
