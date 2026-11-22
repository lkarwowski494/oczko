// Import i przywrócenie jedną transakcją pod ochroną czasu w tle (ADR-0002 (7), ADR-0020 (5′); kontrakt 05 fix-3 pkt 6–7, P-128;
// test roli 08 z kontraktu, do przeglądu 07): wygaśnięcie sygnalizowane przez `CzasWTle` przerywa transakcję między instrukcjami →
// ROLLBACK, baza jak przed, kopia odłączona; ATTACH → transakcja → DETACH w jednej pozycji kolejki (zapis z ekranu nie wchodzi w środek),
// a `blad` i klucze stanu urządzenia po „zastąp” zostają jak przed.
import { utworzArchiwum } from '../../src/dane/archiwum';
import { migruj } from '../../src/dane/migracje/migruj';
import type { CzasWTle } from '../../src/domena/porty';
import { importuj } from '../../src/przypadki-uzycia/archiwum';
import { dodajRzad } from '../../src/przypadki-uzycia/licznik';
import { przywrocKopie } from '../../src/przypadki-uzycia/przywracanie';
import { archiwumWzorcowe, czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { czasWTle, jeden, migawka, przygotuj, wykonaj } from './pomocnicze/srodowisko';

/** Czas w tle, który wygasa po `n` sprawdzeniach sygnału (n = Infinity: nigdy). */
function wygasaPo(n: number): CzasWTle & { sprawdzenia: () => number } {
  let k = 0;
  return { chron: (_nazwa, fn) => fn({ wygaslo: () => ++k > n }), sprawdzenia: () => k };
}
async function srodowisko(cz: CzasWTle = czasWTle) {
  const s = await przygotuj();
  const archiwum = utworzArchiwum({ baza: s.baza, magazyn: s.magazyn, zegar: s.zegar, katalogi: s.z.katalogi, migruj: (b) => migruj(b), aplikacja: '1.0.0 (test)' });
  await wykonaj(s.baza, [projekt('sw', 'Sweter'), czesc('cs', 'sw', 'Przód'), ...licznik('ls', 'cs', 3)]);
  await s.baza.run("INSERT INTO ustawienie (klucz, wartosc, zmieniono_ms) VALUES ('ostatni_start_ms', '123', 1)");
  await s.baza.run("INSERT INTO blad (czas_ms, kod) VALUES (1, 'wpis_przed')");
  return { ...s, za: { ...s.z, archiwum, czasWTle: cz } };
}
const czapka = (katalog: string) => archiwumWzorcowe(katalog, 'czapka', [projekt('cz', 'Czapka'), czesc('cc', 'cz', 'Główka'), ...licznik('lc', 'cc', 4)]);
const dolaczone = async (s: Awaited<ReturnType<typeof przygotuj>>) => (await s.baza.all<{ name: string }>('PRAGMA database_list')).map((d) => d.name);

describe('ADR-0002 (7): wygaśnięcie czasu w tle w środku transakcji importu → ROLLBACK', () => {
  test.each(['zastap', 'scal'] as const)('„%s”: wygaśnięcie po 3 instrukcjach → błąd zapisu, baza jak przed, kopia odłączona', async (tryb) => {
    const cz = wygasaPo(3);
    const s = await srodowisko(cz);
    const przed = await migawka(s.baza, ['blad']);
    const w = await importuj(s.za, { sciezka: czapka(s.katalog), wybierz: async () => tryb });
    expect(w).toEqual({ ok: false, powod: 'zapis' });
    expect(await migawka(s.baza, ['blad'])).toBe(przed);
    expect(await dolaczone(s)).toEqual(['main']);
    expect(cz.sprawdzenia()).toBeGreaterThan(3);
  });

  test('bez wygaśnięcia import przechodzi, a sygnał jest sprawdzany w transakcji (nie raz na całość)', async () => {
    const cz = wygasaPo(Infinity);
    const s = await srodowisko(cz);
    expect(await importuj(s.za, { sciezka: czapka(s.katalog), wybierz: async () => 'zastap' })).toMatchObject({ ok: true });
    expect(cz.sprawdzenia()).toBeGreaterThan(10);
  });
});

describe('ADR-0020 (5′): przywrócenie kopii w jednej pozycji kolejki', () => {
  test('+1 z ekranu wysłane w trakcie przywracania wykonuje się po nim (nie ginie w „zastąp”)', async () => {
    const s = await srodowisko();
    const kopia = `${s.katalog}/kopia.db`;
    await s.baza.run('VACUUM INTO ?', [kopia]); // kopia z licznikiem ls = 3
    const przywrocenie = przywrocKopie(s.za, kopia);
    const plus = dodajRzad(s.z, { licznikId: 'ls' });
    expect(await przywrocenie).toMatchObject({ ok: true });
    expect(await plus).toMatchObject({ ok: true });
    expect(await jeden(s.baza, 'SELECT wartosc FROM licznik WHERE id = ?', ['ls'])).toEqual({ wartosc: 4 });
    expect(await dolaczone(s)).toEqual(['main']);
  });

  test('po „zastąp” blad i klucze stanu urządzenia jak przed (dane z kopii, diagnostyka i stan urządzenia lokalne)', async () => {
    const s = await srodowisko();
    const kopia = `${s.katalog}/kopia.db`;
    await s.baza.run('VACUUM INTO ?', [kopia]);
    await s.baza.run("UPDATE ustawienie SET wartosc = '456' WHERE klucz = 'ostatni_start_ms'");
    await s.baza.run("INSERT INTO blad (czas_ms, kod) VALUES (2, 'wpis_po_kopii')");
    const blad = await s.baza.all('SELECT kod FROM blad ORDER BY id');
    expect(await przywrocKopie(s.za, kopia)).toMatchObject({ ok: true });
    expect(await s.baza.all('SELECT kod FROM blad ORDER BY id')).toEqual(blad);
    expect(await jeden(s.baza, "SELECT wartosc FROM ustawienie WHERE klucz = 'ostatni_start_ms'")).toEqual({ wartosc: '456' });
  });

  test('wygaśnięcie w trakcie przywracania → błąd zapisu, baza jak przed', async () => {
    const s = await srodowisko(wygasaPo(2));
    const kopia = `${s.katalog}/kopia.db`;
    await s.baza.run('VACUUM INTO ?', [kopia]);
    await s.baza.run("UPDATE projekt SET nazwa = 'Sweter 2'");
    const przed = await migawka(s.baza, ['blad']);
    expect(await przywrocKopie(s.za, kopia)).toEqual({ ok: false, powod: 'zapis' });
    expect(await migawka(s.baza, ['blad'])).toBe(przed);
    expect(await dolaczone(s)).toEqual(['main']);
  });
});

/** Czas w tle jak moduł natywny: każde `chron` to osobne zadanie; wygaśnięcie oznacza zadania aktywne w tej chwili i flaga zostaje do końca zadania. */
function zadaniaWTle(): CzasWTle & { wygasAktywne: () => void; nazwy: string[] } {
  const aktywne = new Set<{ wygaslo: boolean }>();
  const nazwy: string[] = [];
  return {
    nazwy,
    wygasAktywne: () => { for (const z of aktywne) z.wygaslo = true; },
    chron: async (nazwa, fn) => {
      const z = { wygaslo: false };
      aktywne.add(z); nazwy.push(nazwa);
      try { return await fn({ wygaslo: () => z.wygaslo }); } finally { aktywne.delete(z); }
    },
  };
}
const licznosci = async (s: Awaited<ReturnType<typeof przygotuj>>) =>
  Object.fromEntries(await Promise.all(['projekt', 'czesc', 'licznik'].map(async (t) => [t, (await jeden<{ n: number }>(s.baza, `SELECT COUNT(*) AS n FROM ${t}`)).n])));

describe('M1-audytor-generalny-065 (05-architekt-004): czas w tle importu zaczyna się po wyborze trybu', () => {
  test.each([
    ['zastap', { projekt: 1, czesc: 1, licznik: 1 }],
    ['scal', { projekt: 2, czesc: 2, licznik: 2 }],
  ] as const)('„%s”: wygaśnięcie w trakcie dialogu wyboru → import po wyborze kończy się powodzeniem', async (tryb, po) => {
    const cz = zadaniaWTle();
    const s = await srodowisko(cz);
    expect(await licznosci(s)).toEqual({ projekt: 1, czesc: 1, licznik: 1 });
    const w = await importuj(s.za, { sciezka: czapka(s.katalog), wybierz: async () => { cz.wygasAktywne(); return tryb; } });
    expect(w).toMatchObject({ ok: true, wartosc: { tryb } });
    expect(await licznosci(s)).toEqual(po);
    expect(await jeden(s.baza, "SELECT nazwa FROM projekt WHERE id = 'cz'")).toEqual({ nazwa: 'Czapka' });
    expect(await dolaczone(s)).toEqual(['main']);
    expect(await s.baza.all('PRAGMA integrity_check')).toEqual([{ integrity_check: 'ok' }]);
    expect(await s.baza.all('PRAGMA foreign_key_check')).toEqual([]);
  });
});
