// 05-architekt-513 (P-436): dwa zapisy w locie z tym samym plikiem (ten sam SHA-256) — jeden zwalnia plik, drugi wstawia go na nowo.
// Plik trafia do magazynu przed kolejką bazy, a magazyn nie zapisuje pliku, który już istnieje; usunięcie pliku po COMMIT pierwszego zapisu
// zostawiało wiersz `plik` drugiego bez pliku, więc każdy eksport, „Replace” i „Delete all data” kończył się błędem zapisu.
// ADR-0001 (uzupełnienie 2026-11-03): zapisy i kasowania usuwają tylko wiersze `plik`; pliki bez wierszy usuwa `sprzatnijSierotyMagazynu`
// przy starcie (w kolejce, nic nie jest w locie), z regułą kopii M1-087. Testy na kopii bazy w katalogu tymczasowym, liczności przed i po.
import { existsSync, mkdirSync, readdirSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { migruj } from '../../src/dane/migracje/migruj';
import { PLIKI_OCHRONA_MIN } from '../../src/konfiguracja';
import { uruchomDane } from '../../src/przypadki-uzycia/start';
import { zapiszRysunek } from '../../src/przypadki-uzycia/wzor';
import { dodajZdjecie, usunZdjecie } from '../../src/przypadki-uzycia/zdjecia';
import { plik, projekt, wzor } from './pomocnicze/dane-wejsciowe';
import { licznosci, przygotuj, sha256, wlozPlik, wykonaj, zArchiwum } from './pomocnicze/srodowisko';

type S = Awaited<ReturnType<typeof przygotuj>>;
const start = (s: S) => uruchomDane({ ...s.z, migruj: (b) => migruj(b) });
const postarz = (s: S, ms: number) => { for (const n of readdirSync(s.magazyn.katalog)) utimesSync(join(s.magazyn.katalog, n), ms / 1000, ms / 1000); };
async function wierszeBezPliku(s: S): Promise<string[]> {
  const w = await s.baza.all<{ sha256: string; rozszerzenie: string }>('SELECT sha256, rozszerzenie FROM plik ORDER BY sha256');
  return w.filter((r) => !existsSync(join(s.magazyn.katalog, `${r.sha256}.${r.rozszerzenie}`))).map((r) => r.sha256);
}
async function spojnosc(s: S) {
  return { integrity: await s.baza.all('PRAGMA integrity_check'), klucze: await s.baza.all('PRAGMA foreign_key_check') };
}
const SPOJNA = { integrity: [{ integrity_check: 'ok' }], klucze: [] };

/** Wzór z PDF i rysunkiem strony 0 = X (np. pusty rysunek); zwraca katalog plików tymczasowych widoku. */
async function wzorZRysunkiem(s: S, tresc: string): Promise<string> {
  const h = wlozPlik(s.magazyn, Buffer.from('%PDF-1.4\n%%EOF\n'), 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Harbor'), plik(h, 'pdf', 15), wzor('w1', 'p1', h)]);
  const k = join(s.katalog, 'tmp', 'rysunki-wzoru');
  mkdirSync(k, { recursive: true });
  const f0 = join(k, 'w1__0__a.pkdrawing');
  writeFileSync(f0, tresc);
  expect((await zapiszRysunek(s.z, { wzorId: 'w1', strona: 0, plikTymczasowy: f0 })).ok).toBe(true);
  return k;
}

test('05-513: zapisy rysunku w locie na stronach 0 (X → Z) i 1 (→ X) — 0 wierszy `plik` bez pliku, eksport ok, po starcie X zostaje', async () => {
  const s = await przygotuj();
  const k = await wzorZRysunkiem(s, 'PUSTY');
  const X = sha256('PUSTY');
  const przed = await licznosci(s.baza);
  expect({ plik: przed.plik, rysunek: przed.rysunek }).toEqual({ plik: 2, rysunek: 1 });
  const a = join(k, 'w1__0__b.pkdrawing'); writeFileSync(a, 'NOWE');
  const b = join(k, 'w1__1__c.pkdrawing'); writeFileSync(b, 'PUSTY');
  const [ra, rb] = await Promise.all([
    zapiszRysunek(s.z, { wzorId: 'w1', strona: 0, plikTymczasowy: a }),
    zapiszRysunek(s.z, { wzorId: 'w1', strona: 1, plikTymczasowy: b }),
  ]);
  expect([ra.ok, rb.ok]).toEqual([true, true]);
  const po = await licznosci(s.baza);
  expect({ plik: po.plik, rysunek: po.rysunek }).toEqual({ plik: 3, rysunek: 2 });
  expect(await wierszeBezPliku(s)).toEqual([]);
  expect(await spojnosc(s)).toEqual(SPOJNA);
  const e = await zArchiwum(s.z).archiwum.zapisz(join(s.katalog, 'Documents', 'Backup'));
  expect(e.ok).toBe(true);
  postarz(s, s.zegar.teraz().ms - (PLIKI_OCHRONA_MIN + 1) * 60_000);
  s.zegar.przesun((PLIKI_OCHRONA_MIN + 1) * 60_000);
  expect(await start(s)).toMatchObject({ ok: true });
  expect(existsSync(join(s.magazyn.katalog, `${X}.pkdrawing`))).toBe(true); // strona 1 się do niego odwołuje
  expect(await wierszeBezPliku(s)).toEqual([]);
  expect({ ...(await licznosci(s.baza)), ustawienie: 0 }).toEqual({ ...po, ustawienie: 0 }); // start zapisuje tylko ustawienia
});

test('05-513: plik zwolniony przez zapis rysunku (bez innych odwołań) znika przy następnym starcie, nie w locie', async () => {
  const s = await przygotuj();
  const k = await wzorZRysunkiem(s, 'STARY');
  const stary = sha256('STARY');
  const a = join(k, 'w1__0__b.pkdrawing'); writeFileSync(a, 'NOWY');
  expect((await zapiszRysunek(s.z, { wzorId: 'w1', strona: 0, plikTymczasowy: a })).ok).toBe(true);
  expect(await s.baza.all('SELECT sha256 FROM plik WHERE sha256 = ?', [stary])).toEqual([]); // wiersz usunięty w transakcji
  postarz(s, s.zegar.teraz().ms - (PLIKI_OCHRONA_MIN + 1) * 60_000);
  s.zegar.przesun((PLIKI_OCHRONA_MIN + 1) * 60_000);
  expect(await start(s)).toMatchObject({ ok: true });
  expect(existsSync(join(s.magazyn.katalog, `${stary}.pkdrawing`))).toBe(false);
  expect(readdirSync(s.magazyn.katalog)).toHaveLength(2); // PDF i nowy rysunek
  expect(await wierszeBezPliku(s)).toEqual([]);
});

test('05-513 (wariant zdjęcia): usunięcie i dodanie tego samego zdjęcia w locie — 0 wierszy `plik` bez pliku, eksport ok', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter')]);
  const zrodlo = join(s.katalog, 'a.jpg');
  writeFileSync(zrodlo, Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 0xff, 0xd9]));
  const d = await dodajZdjecie(s.z, { cel: { projektId: 'p1' }, plik: { sciezka: zrodlo, rozszerzenie: 'jpg' } });
  if (!d.ok) throw new Error(d.powod);
  const przed = await licznosci(s.baza);
  const [ru, rd] = await Promise.all([
    usunZdjecie(s.z, { zdjecieId: d.wartosc.zdjecieId }),
    dodajZdjecie(s.z, { cel: { projektId: 'p1' }, plik: { sciezka: zrodlo, rozszerzenie: 'jpg' } }),
  ]);
  expect([ru.ok, rd.ok]).toEqual([true, true]);
  expect(await licznosci(s.baza)).toEqual(przed); // jedno zdjęcie, jeden wiersz `plik`
  expect(await wierszeBezPliku(s)).toEqual([]);
  expect(await spojnosc(s)).toEqual(SPOJNA);
  expect((await zArchiwum(s.z).archiwum.zapisz(join(s.katalog, 'Documents', 'Backup'))).ok).toBe(true);
});
