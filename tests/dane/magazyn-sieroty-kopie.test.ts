// M1-audytor-generalny-087 (05-architekt-507, regresja od M1-023): sprzątanie sierot magazynu przy starcie usuwało pliki, których potrzebują
// kopie `.db` w `kopie/` (ADR-0020: kopia „przed przywróceniem” to sam plik bazy, bez plików; pliki wzorów nie są kopiowane, bo nie zmieniają się
// w miejscu). Cofnięcie przywrócenia po jednym starcie dawało wiersze `plik` bez plików (projekty bez zdjęć i wzorów).
// Plik bez wiersza zostaje, dopóki w `kopie/` jest kopia `.db` nie starsza niż plik (mogła go zapisać); kopie znikają po KOPIE_RATUNKOWE_DNI
// (ADR-0020 (6)), więc potem plik bez odwołań i bez kopii jest usuwany. Testy na kopii bazy w katalogu tymczasowym, liczności przed i po.
import { readdirSync, utimesSync } from 'node:fs';
import { join } from 'node:path';
import { migruj } from '../../src/dane/migracje/migruj';
import { KOPIE_RATUNKOWE_DNI, PLIKI_OCHRONA_MIN } from '../../src/konfiguracja';
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

/** Sonda B: dane z 3 plikami → przywrócenie kopii sprzed danych (powstaje `kopie/przed-przywroceniem-<ms>.db`); pliki starsze niż ochrona. */
async function poPrzywroceniu() {
  const s = await przygotuj();
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
