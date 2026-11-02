// Przegląd 2026-10-26 (realny): kreska zapisana przy zamykaniu ekranu wzoru trafia do pliku w katalogu oczekujących, a zdarzenie nie ma odbiorcy.
// Przy następnym otwarciu wzoru JS odzyskuje takie pliki (nazwa: <wzorId>__<strona>__<uuid>.pkdrawing) i zapisuje je zapiszRysunek; obce pliki zostają.
import { existsSync, mkdirSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PortBazy } from '../../src/domena/porty';
import { zapiszRysunek } from '../../src/przypadki-uzycia/wzor';
import { odzyskajRysunki } from '../../src/przypadki-uzycia/wzor-widok';
import { plik, projekt, wzor } from './pomocnicze/dane-wejsciowe';
import { ile, jeden, przygotuj, sha256, wlozPlik, wykonaj } from './pomocnicze/srodowisko';

test('pliki oczekujące → rysunki stron we właściwych wzorach; pliki usunięte; obce i uszkodzone nazwy zostają', async () => {
  const s = await przygotuj();
  const h = wlozPlik(s.magazyn, Buffer.from('%PDF-1.4\n%%EOF\n'), 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Harbor'), plik(h, 'pdf', 15), wzor('w1', 'p1', h), wzor('w2', 'p1', h)]);
  const k = join(s.katalog, 'tmp', 'rysunki');
  mkdirSync(k, { recursive: true });
  writeFileSync(join(k, 'w1__0__a.pkdrawing'), 'r-w1-0');
  writeFileSync(join(k, 'w2__3__b.pkdrawing'), 'r-w2-3');
  writeFileSync(join(k, 'inny.txt'), 'x');
  expect(await odzyskajRysunki(s.z, { katalog: k })).toEqual({ ok: true, wartosc: 2 });
  expect(await jeden(s.baza, "SELECT plik_sha256 FROM rysunek WHERE wzor_id = 'w1' AND strona = 0")).toEqual({ plik_sha256: sha256('r-w1-0') });
  expect(await jeden(s.baza, "SELECT plik_sha256 FROM rysunek WHERE wzor_id = 'w2' AND strona = 3")).toEqual({ plik_sha256: sha256('r-w2-3') });
  expect([existsSync(join(k, 'w1__0__a.pkdrawing')), existsSync(join(k, 'inny.txt'))]).toEqual([false, true]);
  expect(await odzyskajRysunki(s.z, { katalog: join(s.katalog, 'nie-ma') })).toEqual({ ok: true, wartosc: 0 });
});

// M1-audytor-generalny-084 (08-programista-501, P0): nieudany zapis rysunku (SQLITE_FULL, brak miejsca w magazynie) nie kasuje pliku oczekującego.
// Plik zostaje do ponowienia, a `odzyskajRysunki` przy następnym otwarciu zapisuje go i dopiero wtedy kasuje. Widok wysyła zawsze cały rysunek
// strony, więc nowszy plik tej samej strony zastępuje starszy: po udanym zapisie starsze pliki oczekujące tej strony znikają, odzysk bierze najnowszy.
describe('M1-084: plik oczekujący rysunku przeżywa nieudany zapis', () => {
  /** Port z wstrzykniętym błędem w transakcji (atrapa SQLITE_FULL, jak zapis-licznika.test.ts). */
  function zBledem(baza: PortBazy, wzorzec: RegExp, blad: string, ile = Infinity): PortBazy {
    const licznik = { n: ile };
    const owin = (tx: PortBazy): PortBazy => ({
      run: (sql, p) => (wzorzec.test(sql) && licznik.n-- > 0 ? Promise.reject(new Error(blad)) : tx.run(sql, p)),
      all: (sql, p) => (wzorzec.test(sql) && licznik.n-- > 0 ? Promise.reject(new Error(blad)) : tx.all(sql, p)),
      transakcja: (fn) => tx.transakcja(fn),
    });
    return { ...baza, run: baza.run.bind(baza), all: baza.all.bind(baza), transakcja: (fn) => baza.transakcja((tx) => fn(owin(tx))) };
  }
  const PELNY = 'SQLITE_FULL: database or disk is full';
  async function zWzorem() {
    const s = await przygotuj();
    const h = wlozPlik(s.magazyn, Buffer.from('%PDF-1.4\n%%EOF\n'), 'pdf');
    await wykonaj(s.baza, [projekt('p1', 'Harbor'), plik(h, 'pdf', 15), wzor('w1', 'p1', h)]);
    const k = join(s.katalog, 'tmp', 'rysunki-wzoru');
    mkdirSync(k, { recursive: true });
    return { s, k };
  }
  const rysunekStrony = (s: Awaited<ReturnType<typeof przygotuj>>) => jeden<{ plik_sha256: string }>(s.baza, "SELECT plik_sha256 FROM rysunek WHERE wzor_id = 'w1' AND strona = 0");

  test('SQLITE_FULL przy zapisie → wynik błędu, plik zostaje; po ponownym otwarciu (odzysk) kreski są w bazie, plik usunięty', async () => {
    const { s, k } = await zWzorem();
    const f = join(k, 'w1__0__a.pkdrawing');
    writeFileSync(f, 'kreski-po-pelnym-dysku');
    const wynik = await zapiszRysunek({ ...s.z, baza: zBledem(s.baza, /INSERT\s+INTO\s+rysunek/i, PELNY) }, { wzorId: 'w1', strona: 0, plikTymczasowy: f });
    expect(wynik.ok).toBe(false);
    expect(existsSync(f)).toBe(true);
    expect(await ile(s.baza, 'rysunek', "wzor_id = 'w1' AND strona = 0")).toBe(0);
    expect(await odzyskajRysunki(s.z, { katalog: k })).toEqual({ ok: true, wartosc: 1 });
    expect(await rysunekStrony(s)).toEqual({ plik_sha256: sha256('kreski-po-pelnym-dysku') });
    expect(existsSync(f)).toBe(false);
  });

  test('brak miejsca w magazynie plików → plik zostaje; odzysk przy wciąż pełnym dysku zwraca błąd i nie kasuje pliku', async () => {
    const { s, k } = await zWzorem();
    const f = join(k, 'w1__0__a.pkdrawing');
    writeFileSync(f, 'kreski');
    const pelnyMagazyn = { ...s.magazyn, zapisz: async () => ({ ok: false as const, powod: 'brak_miejsca' as const }) };
    expect(await zapiszRysunek({ ...s.z, magazyn: pelnyMagazyn }, { wzorId: 'w1', strona: 0, plikTymczasowy: f })).toEqual({ ok: false, powod: 'brak_miejsca' });
    expect(existsSync(f)).toBe(true);
    expect(await odzyskajRysunki({ ...s.z, magazyn: pelnyMagazyn }, { katalog: k })).toEqual({ ok: false, powod: 'brak_miejsca' });
    expect(existsSync(f)).toBe(true);
    expect(await odzyskajRysunki(s.z, { katalog: k })).toEqual({ ok: true, wartosc: 1 });
    expect(existsSync(f)).toBe(false);
  });

  test('nowszy udany zapis strony usuwa starszy plik oczekujący tej strony (odzysk nie cofa rysunku); inne strony i wzory zostają', async () => {
    const { s, k } = await zWzorem();
    const stary = join(k, 'w1__0__a.pkdrawing');
    const innaStrona = join(k, 'w1__1__c.pkdrawing');
    writeFileSync(stary, 'v1');
    writeFileSync(innaStrona, 'strona-1');
    utimesSync(stary, 1000, 1000);
    utimesSync(innaStrona, 1000, 1000);
    expect((await zapiszRysunek({ ...s.z, baza: zBledem(s.baza, /INSERT\s+INTO\s+rysunek/i, PELNY) }, { wzorId: 'w1', strona: 0, plikTymczasowy: stary })).ok).toBe(false);
    const nowy = join(k, 'w1__0__b.pkdrawing');
    writeFileSync(nowy, 'v2');
    expect(await zapiszRysunek(s.z, { wzorId: 'w1', strona: 0, plikTymczasowy: nowy })).toEqual({ ok: true, wartosc: undefined });
    expect([existsSync(stary), existsSync(nowy), existsSync(innaStrona)]).toEqual([false, false, true]);
    expect(await odzyskajRysunki(s.z, { katalog: k })).toEqual({ ok: true, wartosc: 1 }); // tylko strona 1
    expect(await rysunekStrony(s)).toEqual({ plik_sha256: sha256('v2') });
  });

  test('dwa pliki oczekujące tej samej strony → odzysk zapisuje najnowszy i usuwa oba', async () => {
    const { s, k } = await zWzorem();
    const starszy = join(k, 'w1__0__z.pkdrawing');
    const nowszy = join(k, 'w1__0__a.pkdrawing');
    writeFileSync(starszy, 'v1');
    writeFileSync(nowszy, 'v2');
    utimesSync(starszy, 1000, 1000);
    utimesSync(nowszy, 2000, 2000);
    expect(await odzyskajRysunki(s.z, { katalog: k })).toEqual({ ok: true, wartosc: 1 });
    expect(await rysunekStrony(s)).toEqual({ plik_sha256: sha256('v2') });
    expect([existsSync(starszy), existsSync(nowszy)]).toEqual([false, false]);
  });

  test('odrzucenie trwałe (wzór w koszu) nadal usuwa plik — nie ma czego ponawiać', async () => {
    const { s, k } = await zWzorem();
    await wykonaj(s.baza, [["UPDATE wzor SET usunieto_ms = 1 WHERE id = 'w1'", []]]);
    const f = join(k, 'w1__0__a.pkdrawing');
    writeFileSync(f, 'x');
    expect(await zapiszRysunek(s.z, { wzorId: 'w1', strona: 0, plikTymczasowy: f })).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
    expect(existsSync(f)).toBe(false);
  });
});
