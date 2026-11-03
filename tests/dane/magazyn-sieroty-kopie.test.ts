// M1-audytor-generalny-087 (05-architekt-507, regresja od M1-023): sprzątanie sierot magazynu przy starcie usuwało pliki, których potrzebują
// kopie `.db` w `kopie/` (ADR-0020: kopia „przed przywróceniem” to sam plik bazy, bez plików; pliki wzorów nie są kopiowane, bo nie zmieniają się
// w miejscu). Cofnięcie przywrócenia po jednym starcie dawało wiersze `plik` bez plików (projekty bez zdjęć i wzorów).
// Plik bez wiersza zostaje, dopóki w `kopie/` jest kopia `.db` nie starsza niż plik (mogła go zapisać); kopie znikają po KOPIE_RATUNKOWE_DNI
// (ADR-0020 (6)), więc potem plik bez odwołań i bez kopii jest usuwany. Testy na kopii bazy w katalogu tymczasowym, liczności przed i po.
import { mkdirSync, readdirSync, utimesSync } from 'node:fs';
import { join } from 'node:path';
import { migruj } from '../../src/dane/migracje/migruj';
import { KOPIE_RATUNKOWE_DNI, KOSZ_DNI, PLIKI_OCHRONA_MIN } from '../../src/konfiguracja';
import { sprzatnijKopie } from '../../src/niezawodnosc/kopie';
import { przywrocKopie } from '../../src/przypadki-uzycia/przywracanie';
import { uruchomDane } from '../../src/przypadki-uzycia/start';
import { zycie } from './pomocnicze/dane-wejsciowe';
import { czasWTle, ile, licznosci, przygotuj, wlozPlik, wykonaj } from './pomocnicze/srodowisko';

const DOBA_MS = 86_400_000;
type S = Awaited<ReturnType<typeof przygotuj>>;
const start = (s: S) => uruchomDane({ ...s.z, migruj: (b) => migruj(b) });
const postarz = (s: S, ms: number) => { for (const n of readdirSync(s.magazyn.katalog)) utimesSync(join(s.magazyn.katalog, n), ms / 1000, ms / 1000); };
async function brakujacePliki(s: S): Promise<number> {
  const w = await s.baza.all<{ sha256: string; rozszerzenie: string }>('SELECT sha256, rozszerzenie FROM plik');
  const jest = new Set(readdirSync(s.magazyn.katalog));
  return w.filter((r) => !jest.has(`${r.sha256}.${r.rozszerzenie}`)).length;
}
const stan = async (s: S) => ({ wiersze_plik: await ile(s.baza, 'plik'), projekty: await ile(s.baza, 'projekt'), pliki: readdirSync(s.magazyn.katalog).length, bez_pliku: await brakujacePliki(s) });

/**
 * Sonda B: dane z 3 plikami → przywrócenie kopii sprzed danych (powstaje `kopie/przed-przywroceniem-<ms>.db`); pliki starsze niż ochrona.
 * `przedDanymi`: co leży w `kopie/` przed danymi (M1-115: starsza kopia `przed-migracja-*` po aktualizacji aplikacji).
 */
async function poPrzywroceniu(przedDanymi?: (s: S) => Promise<void>) {
  const s = await przygotuj();
  await przedDanymi?.(s);
  const pusta = join(s.katalog, 'kopia-bez-danych.db');
  await s.baza.run('VACUUM INTO ?', [pusta]); // kopia sprzed danych (schemat, bez plików)
  const pliki = { pdf: wlozPlik(s.magazyn, Buffer.from('PDF-1.4 abc'), 'pdf'), rys: wlozPlik(s.magazyn, Buffer.from('PKDRAWING'), 'pkdrawing'), jpg: wlozPlik(s.magazyn, Buffer.from('JPEG-DANE!'), 'jpg') };
  await wykonaj(s.baza, zycie(pliki));
  const przed = await licznosci(s.baza);
  postarz(s, s.zegar.teraz().ms - (PLIKI_OCHRONA_MIN + 1) * 60_000);
  s.zegar.przesun(1000);
  const p = await przywrocKopie({ ...s.z, czasWTle }, pusta);
  if (!p.ok) throw new Error(p.powod);
  expect(await stan(s)).toEqual({ wiersze_plik: 0, projekty: 0, pliki: 3, bez_pliku: 0 });
  return { s, przed, kopiaPrzed: p.wartosc.kopiaPrzed };
}

test('M1-087 (sonda B): przywrócenie → start (+11 min) → cofnięcie przywrócenia: 0 wierszy `plik` bez pliku, liczności jak przed', async () => {
  const { s, przed, kopiaPrzed } = await poPrzywroceniu();
  s.zegar.przesun((PLIKI_OCHRONA_MIN + 1) * 60_000);
  expect(await start(s)).toMatchObject({ ok: true });
  expect(await stan(s)).toEqual({ wiersze_plik: 0, projekty: 0, pliki: 3, bez_pliku: 0 }); // pliki czekają na kopię `przed-przywroceniem`
  s.zegar.przesun(60_000);
  const c = await przywrocKopie({ ...s.z, czasWTle }, kopiaPrzed);
  if (!c.ok) throw new Error(c.powod);
  expect(await stan(s)).toEqual({ wiersze_plik: 3, projekty: przed.projekt, pliki: 3, bez_pliku: 0 });
  expect({ ...(await licznosci(s.baza)), ustawienie: 0 }).toEqual({ ...przed, ustawienie: 0 }); // przywrócenie i start zapisują tylko ustawienia
});

// M1-audytor-generalny-115 (07-jakosc-515): w powyższych testach `kopie/` ma jedną kopię, więc wybór najstarszej zamiast najnowszej i pominięcie
// kopii ratunkowej (katalog `ratunkowe-<ms>`, ADR-0020 (1)) nie zmieniały wyniku. Kopia `przed-migracja-*` zostaje po każdej aktualizacji do
// KOPIE_RATUNKOWE_DNI (ADR-0020 (5), (6)), więc dwie kopie to zwykły stan.
const PIEC_DNI = 5 * DOBA_MS;
const kopiaPrzedMigracja = async (s: S) => { await s.baza.run('VACUUM INTO ?', [join(s.z.katalogi.kopie, `przed-migracja-7-${s.zegar.teraz().ms - PIEC_DNI}.db`)]); }; // teraz − 5 dni

test('M1-115: starsza kopia `przed-migracja-*` (teraz − 5 dni) + przywrócenie → start (+11 min) → cofnięcie: liczy się najnowsza kopia, 0 wierszy `plik` bez pliku', async () => {
  const { s, przed, kopiaPrzed } = await poPrzywroceniu(kopiaPrzedMigracja);
  expect(readdirSync(s.z.katalogi.kopie).filter((n) => n.endsWith('.db'))).toHaveLength(2);
  s.zegar.przesun((PLIKI_OCHRONA_MIN + 1) * 60_000);
  expect(await start(s)).toMatchObject({ ok: true });
  expect(await stan(s)).toEqual({ wiersze_plik: 0, projekty: 0, pliki: 3, bez_pliku: 0 }); // pliki młodsze niż starsza kopia, ale nie niż najnowsza
  s.zegar.przesun(60_000);
  const c = await przywrocKopie({ ...s.z, czasWTle }, kopiaPrzed);
  if (!c.ok) throw new Error(c.powod);
  expect(await stan(s)).toEqual({ wiersze_plik: 3, projekty: przed.projekt, pliki: 3, bez_pliku: 0 });
  expect({ ...(await licznosci(s.baza)), ustawienie: 0 }).toEqual({ ...przed, ustawienie: 0 });
});

test('M1-115: najnowsza jest kopia ratunkowa (katalog `ratunkowe-<ms>`): pliki bez wiersza sprzed niej zostają; po KOPIE_RATUNKOWE_DNI + 1 dzień znikają z kopiami', async () => {
  const s = await przygotuj();
  const teraz = s.zegar.teraz().ms;
  await kopiaPrzedMigracja(s);
  for (const t of ['A', 'B', 'C']) wlozPlik(s.magazyn, Buffer.from(`SIEROTA-${t}`), 'jpg');
  postarz(s, teraz - (PLIKI_OCHRONA_MIN + 1) * 60_000); // młodsze niż kopia `.db`, starsze niż kopia ratunkowa
  const ratunkowa = join(s.z.katalogi.kopie, `ratunkowe-${teraz}`);
  mkdirSync(ratunkowa);
  await s.baza.run('VACUUM INTO ?', [join(ratunkowa, 'oczko.db')]); // ADR-0020 (1): surowa kopia bazy w katalogu
  const przed = await licznosci(s.baza);
  s.zegar.przesun(60_000);
  expect(await start(s)).toMatchObject({ ok: true });
  expect({ pliki: readdirSync(s.magazyn.katalog).length, kopie: readdirSync(s.z.katalogi.kopie).length }).toEqual({ pliki: 3, kopie: 2 });
  s.zegar.przesun((KOPIE_RATUNKOWE_DNI + 1) * DOBA_MS);
  const k = sprzatnijKopie(s.z.katalogi.kopie, s.zegar.teraz().ms);
  expect(k.ok ? [...k.wartosc].sort() : null).toEqual([`przed-migracja-7-${teraz - PIEC_DNI}.db`, `ratunkowe-${teraz}`]);
  expect(await start(s)).toMatchObject({ ok: true });
  expect({ pliki: readdirSync(s.magazyn.katalog).length, kopie: readdirSync(s.z.katalogi.kopie).length }).toEqual({ pliki: 0, kopie: 0 });
  expect({ ...(await licznosci(s.baza)), ustawienie: 0 }).toEqual({ ...przed, ustawienie: 0 }); // start zapisuje tylko ustawienia
});

test('M1-087: po KOPIE_RATUNKOWE_DNI + 1 dzień kopia znika (ADR-0020 (6)), a plik bez odwołań i bez kopii jest usuwany przy starcie (M1-023)', async () => {
  const { s } = await poPrzywroceniu();
  s.zegar.przesun((KOPIE_RATUNKOWE_DNI + 1) * DOBA_MS);
  const k = sprzatnijKopie(s.z.katalogi.kopie, s.zegar.teraz().ms);
  expect(k.ok && k.wartosc.some((n) => n.startsWith('przed-przywroceniem-'))).toBe(true);
  expect(await start(s)).toMatchObject({ ok: true });
  expect(await stan(s)).toEqual({ wiersze_plik: 0, projekty: 0, pliki: 0, bez_pliku: 0 });
});

test('M1-087: kopia `.db` starsza niż plik nie chroni go — plik powstały po ostatniej kopii i bez wiersza jest usuwany', async () => {
  const { s } = await poPrzywroceniu();
  s.zegar.przesun(2 * DOBA_MS);
  const nowy = wlozPlik(s.magazyn, Buffer.from('NOWY-PLIK'), 'jpg'); // np. nieudany import po kopii
  const nazwa = readdirSync(s.magazyn.katalog).find((n) => n.startsWith(nowy)) as string;
  const ms = s.zegar.teraz().ms - (PLIKI_OCHRONA_MIN + 1) * 60_000;
  utimesSync(join(s.magazyn.katalog, nazwa), ms / 1000, ms / 1000);
  expect(await start(s)).toMatchObject({ ok: true });
  expect(readdirSync(s.magazyn.katalog).some((n) => n.startsWith(nowy))).toBe(false);
  expect(readdirSync(s.magazyn.katalog)).toHaveLength(3); // pliki sprzed kopii zostają
});

// M1-audytor-generalny-128 (12-niezawodnosc-503, P-428): wyjątek nazwany w ADR-0020 (6), uzupełnienie 2026-11-03. Kopia `.db` z czasem z przyszłości
// w nazwie (zegar urządzenia przestawiony do przodu, gdy powstała) zostaje do czasu z nazwy + KOPIE_RATUNKOWE_DNI i do tej chwili wstrzymuje
// sprzątanie sierot magazynu (M1-087). Skutek: miejsce zajęte dłużej, bez utraty danych. Test utrwala to zachowanie jako oczekiwane; zmiana
// (np. opcja (a) z 12-niezawodnosc-503: czas kopii ograniczony do teraz) wymaga najpierw zmiany ADR-0020 i tego wektora.
test('M1-128 (ADR-0020 (6), wyjątek nazwany): kopia z czasem teraz+365 dni wstrzymuje sprzątanie 3 sierot do czasu z nazwy + KOPIE_RATUNKOWE_DNI, potem kopia i sieroty znikają', async () => {
  const s = await przygotuj();
  const teraz = s.zegar.teraz().ms;
  const zNazwy = teraz + 365 * DOBA_MS;
  const kopia = join(s.z.katalogi.kopie, `przed-migracja-2-${zNazwy}.db`);
  await s.baza.run('VACUUM INTO ?', [kopia]);
  utimesSync(kopia, zNazwy / 1000, zNazwy / 1000); // zegar do przodu przy zapisie: czas zmiany pliku kopii też z przyszłości (sonda M2, wariant 1)
  for (const t of ['A', 'B', 'C']) wlozPlik(s.magazyn, Buffer.from(`SIEROTA-${t}`), 'jpg');
  postarz(s, teraz - (PLIKI_OCHRONA_MIN + 1) * 60_000);
  const przed = await licznosci(s.baza);
  const przebieg = async (ms: number) => {
    s.zegar.ustaw(ms);
    const k = sprzatnijKopie(s.z.katalogi.kopie, ms);
    expect(await start(s)).toMatchObject({ ok: true });
    return { usuniete_kopie: k.ok ? k.wartosc.length : -1, kopie: readdirSync(s.z.katalogi.kopie).length, pliki: readdirSync(s.magazyn.katalog).length };
  };
  for (const ms of [teraz + DOBA_MS, teraz + (KOPIE_RATUNKOWE_DNI + 1) * DOBA_MS, teraz + 340 * DOBA_MS, zNazwy + KOPIE_RATUNKOWE_DNI * DOBA_MS]) {
    expect(await przebieg(ms)).toEqual({ usuniete_kopie: 0, kopie: 1, pliki: 3 }); // wyjątek: sieroty czekają na kopię z przyszłości
  }
  expect(await przebieg(zNazwy + (KOPIE_RATUNKOWE_DNI + 1) * DOBA_MS)).toEqual({ usuniete_kopie: 1, kopie: 0, pliki: 0 });
  expect({ ...(await licznosci(s.baza)), ustawienie: 0 }).toEqual({ ...przed, ustawienie: 0 }); // start zapisuje tylko ustawienia; wiersze bez zmian
});

// M1-audytor-generalny-118 (05-architekt-512): trwałe usunięcie projektu z kosza kasowało od razu pliki, których potrzebuje młodsza kopia `.db`
// w `kopie/`, więc przywrócenie kopii dawało projekt bez zdjęć, wzorów i rysunków. Po ADR-0001 (uzupełnienie 2026-11-03) `sprzatnijKosz` usuwa
// tylko wiersze `plik`, a pliki — `sprzatnijSierotyMagazynu` z regułą M1-087 (plik nie młodszy niż najnowsza kopia zostaje).
async function koszZKopia() {
  const s = await przygotuj();
  const pliki = { pdf: wlozPlik(s.magazyn, Buffer.from('PDF-1.4 abc'), 'pdf'), rys: wlozPlik(s.magazyn, Buffer.from('PKDRAWING'), 'pkdrawing'), jpg: wlozPlik(s.magazyn, Buffer.from('JPEG-DANE!'), 'jpg') };
  await wykonaj(s.baza, zycie(pliki));
  postarz(s, s.zegar.teraz().ms - (PLIKI_OCHRONA_MIN + 1) * 60_000);
  const teraz = s.zegar.teraz().ms;
  await s.baza.run("UPDATE projekt SET usunieto_ms = ?, zmieniono_ms = ? WHERE id = 'p1'", [teraz, teraz]); // projekt ze wzorem, rysunkiem i zdjęciem do kosza
  const przed = await licznosci(s.baza);
  s.zegar.przesun(DOBA_MS);
  const kopia = join(s.z.katalogi.kopie, `przed-migracja-2-${s.zegar.teraz().ms}.db`);
  await s.baza.run('VACUUM INTO ?', [kopia]); // kopia z ADR-0020 (np. przed migracją): projekt w koszu z wierszami `plik`
  s.zegar.przesun(KOSZ_DNI * DOBA_MS);
  expect(await start(s)).toMatchObject({ ok: true });
  s.zegar.przesun(DOBA_MS);
  expect(await start(s)).toMatchObject({ ok: true, wartosc: { sprzatnieto: 1 } }); // drugi start po terminie: p1 trwale usunięty
  return { s, przed, kopia };
}

test('M1-118 (05-architekt-512): kosz → kopia `.db` → po KOSZ_DNI dwa starty: 0 wierszy `plik`, 3 pliki zostają → przywrócenie kopii: 0 wierszy `plik` bez pliku', async () => {
  const { s, przed, kopia } = await koszZKopia();
  expect(await stan(s)).toEqual({ wiersze_plik: 0, projekty: przed.projekt - 1, pliki: 3, bez_pliku: 0 }); // pliki czekają na kopię (reguła M1-087)
  const r = await przywrocKopie({ ...s.z, czasWTle }, kopia);
  if (!r.ok) throw new Error(r.powod);
  expect(await stan(s)).toEqual({ wiersze_plik: 3, projekty: przed.projekt, pliki: 3, bez_pliku: 0 });
  expect({ ...(await licznosci(s.baza)), ustawienie: 0 }).toEqual({ ...przed, ustawienie: 0 }); // projekt, czesc, licznik, zdarzenie, plik, … jak przed
  expect(await s.baza.all('SELECT count(*) AS n FROM projekt WHERE usunieto_ms IS NOT NULL')).toEqual([{ n: 1 }]); // wraca do kosza
  expect(await s.baza.all('PRAGMA integrity_check')).toEqual([{ integrity_check: 'ok' }]);
  expect(await s.baza.all('PRAGMA foreign_key_check')).toEqual([]);
});

test('M1-118: bez przywrócenia — po KOPIE_RATUNKOWE_DNI + 1 dzień kopia znika, a 3 pliki trwale usuniętego projektu są usuwane przy starcie', async () => {
  const { s } = await koszZKopia();
  s.zegar.przesun((KOPIE_RATUNKOWE_DNI + 1) * DOBA_MS);
  const k = sprzatnijKopie(s.z.katalogi.kopie, s.zegar.teraz().ms);
  expect(k.ok && k.wartosc.some((n) => n.startsWith('przed-migracja-2-'))).toBe(true);
  expect(await start(s)).toMatchObject({ ok: true });
  expect(await stan(s)).toEqual({ wiersze_plik: 0, projekty: 11, pliki: 0, bez_pliku: 0 });
});
