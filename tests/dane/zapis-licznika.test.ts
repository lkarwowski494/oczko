// Ścieżka zapisu +1 (moduly.md:69–76, ADR-0002, ADR-0005) i zapisy licznika (BR-LIC-*), ścieżki ŚU-01, ŚU-06, ŚU-08, ŚU-17, ŚU-20 (dane.md).
// Wyrocznie: moduly.md (kroki 1–4, powody), wektory limitu docs/monetyzacja/wektory-limitu.json (L-01–L-04), BRD wymagania-licznik.md, P-091 (3a).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PortBazy } from '../../src/domena/porty';
import { dodajLicznik, cofnijOstatnie, cofnijSerie, dodajRzad, utworzSzybkiLicznik, wpiszWartosc, wyzeruj } from '../../src/przypadki-uzycia/licznik';
import { nazwijProjekt, usunProjekt } from '../../src/przypadki-uzycia/projekt';
import { wykonanieDnia } from '../../src/dane/repozytoria/dni';
import { KORZEN, czesc, czytajBaze, dzienLimitu, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { DOBA, T0, ile, jeden, migawka, przygotuj, wykonaj, type Srodowisko } from './pomocnicze/srodowisko';

const PODSTAWA = [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód')];
async function zLicznikiem(n = 0, o: Parameters<typeof licznik>[3] = {}, s?: Srodowisko): Promise<Srodowisko> {
  const sr = s ?? (await przygotuj());
  await wykonaj(sr.baza, [...PODSTAWA, ...licznik('l1', 'c1', n, o)]);
  return sr;
}
const stanLicznika = (b: PortBazy) => jeden<{ wartosc: number; glowa: string | null; konflikt: number }>(b, "SELECT wartosc, glowa, konflikt FROM licznik WHERE id = 'l1'");

/** Port z wstrzykniętym błędem: w transakcji instrukcja pasująca do `wzorzec` rzuca `blad` (atrapa SQLITE_FULL / przerwanego kroku 3). */
function zBledem(baza: PortBazy, wzorzec: RegExp, blad: string, ile = Infinity): PortBazy & { wlaczony: { n: number } } {
  const wlaczony = { n: ile };
  const owin = (tx: PortBazy): PortBazy => ({
    run: (sql, p) => { if (wzorzec.test(sql) && wlaczony.n-- > 0) return Promise.reject(new Error(blad)); return tx.run(sql, p); },
    all: (sql, p) => { if (wzorzec.test(sql) && wlaczony.n-- > 0) return Promise.reject(new Error(blad)); return tx.all(sql, p); },
    transakcja: (fn) => tx.transakcja(fn),
  });
  return { ...baza, wlaczony, run: baza.run.bind(baza), all: baza.all.bind(baza), transakcja: (fn) => baza.transakcja((tx) => fn(owin(tx))) };
}

describe('ścieżka zapisu +1 (moduly.md „Ścieżka zapisu +1”)', () => {
  test('ŚU-01 NFR-DAN-002 BR-DAN-001/S1: 5× +1 → po każdym wyniku zapis widoczny z osobnego połączenia (COMMIT przed potwierdzeniem)', async () => {
    const s = await zLicznikiem(0);
    for (let i = 1; i <= 5; i++) {
      const w = await dodajRzad(s.z, { licznikId: 'l1' });
      expect(w).toMatchObject({ ok: true, wartosc: { wartosc: i } });
      // „zabicie procesu”: nie zamykamy portu, czytamy plik drugim połączeniem node:sqlite
      expect(czytajBaze(join(s.katalog, 'oczko.db'), "SELECT count(*) n, max(wartosc_po) m FROM zdarzenie WHERE licznik_id = 'l1'")).toEqual([{ n: i, m: i }]);
    }
    expect(czytajBaze(join(s.katalog, 'oczko.db'), "SELECT wartosc FROM licznik WHERE id = 'l1'")).toEqual([{ wartosc: 5 }]);
  });

  test('R-004 NFR-DAN-002 moduly.md:76: błąd w kroku 3 (UPDATE projekt) → ROLLBACK, { ok:false, powod:"zapis" }, liczba zdarzeń bez zmian, wpis w blad', async () => {
    const s = await zLicznikiem(3);
    const przed = await migawka(s.baza, ['blad']);
    const bladPrzed = await ile(s.baza, 'blad');
    const z = { ...s.z, baza: zBledem(s.baza, /^\s*UPDATE\s+projekt\b/i, 'SQLITE_IOERR: disk I/O error') };
    expect(await dodajRzad(z, { licznikId: 'l1' })).toEqual({ ok: false, powod: 'zapis' });
    expect(await migawka(s.baza, ['blad'])).toBe(przed); // zdarzenie, licznik, dzien_limitu wycofane razem
    expect(await ile(s.baza, 'zdarzenie')).toBe(3);
    expect(await ile(s.baza, 'blad')).toBe(bladPrzed + 1);
  });

  test('ŚU-17 R-004: SQLITE_FULL przy INSERT zdarzenia → powod „zapis”, nic nie zapisane; ponowienie po zwolnieniu miejsca dodaje dokładnie 1', async () => {
    const s = await zLicznikiem(41);
    const zly = zBledem(s.baza, /^\s*INSERT\s+INTO\s+zdarzenie\b/i, 'SQLITE_FULL: database or disk is full', 1);
    expect(await dodajRzad({ ...s.z, baza: zly }, { licznikId: 'l1' })).toEqual({ ok: false, powod: 'zapis' });
    expect(await stanLicznika(s.baza)).toMatchObject({ wartosc: 41 });
    expect(await dodajRzad({ ...s.z, baza: zly }, { licznikId: 'l1' })).toMatchObject({ ok: true, wartosc: { wartosc: 42 } });
    expect(await ile(s.baza, 'zdarzenie')).toBe(42);
  });

  test('BR-LIC-003 F-03 moduly.md:72: +1 na liczniku zablokowanym → { ok:false, powod:"zablokowany" }, baza bez zmian', async () => {
    const s = await zLicznikiem(7, { zablokowany: 1 });
    const przed = await migawka(s.baza);
    expect(await dodajRzad(s.z, { licznikId: 'l1' })).toEqual({ ok: false, powod: 'zablokowany' });
    expect(await migawka(s.baza)).toBe(przed);
  });

  const WEKTORY = JSON.parse(readFileSync(join(KORZEN, 'docs/monetyzacja/wektory-limitu.json'), 'utf8')).startDnia as {
    id: string; wejscie: { dni: { data: string; pro: boolean }[]; dzis: string; teraz: number; ostatniPlus: number | null; pro: boolean };
    oczekiwane: { dozwolone: boolean; zapis: { data: string; pro: boolean } | null };
  }[];
  test.each(WEKTORY.filter((w) => ['L-01', 'L-02', 'L-03', 'L-04'].includes(w.id)).map((w) => [w.id, w] as const))(
    '%s KP-12 moduly.md:72: +1 przez dodajRzad na bazie z dniami limitu z wektora → dozwolone / powod „limit”, dzien_limitu zgodny z „zapis”',
    async (_id, w) => {
      const s = await przygotuj();
      await wykonaj(s.baza, [...PODSTAWA, ...licznik('l1', 'c1', w.wejscie.ostatniPlus === null ? 0 : 1, { t: w.wejscie.ostatniPlus ?? T0 }), ...w.wejscie.dni.map((d, i) => dzienLimitu(d.data, `z-dzien-${i}`, d.pro ? 1 : 0))]);
      s.zegar.ustaw(w.wejscie.teraz, 'Europe/Warsaw', w.wejscie.dzis); // dzis i teraz wprost z wektora (R-101: wektory mają niezgodne dzis/teraz)
      s.pro.wartosc = w.wejscie.pro;
      const dniPrzed = await s.baza.all('SELECT dzien, pro FROM dzien_limitu ORDER BY dzien');
      const zdarzPrzed = await ile(s.baza, 'zdarzenie');
      const wynik = await dodajRzad(s.z, { licznikId: 'l1' });
      const dniPo = await s.baza.all<{ dzien: string; pro: number }>('SELECT dzien, pro FROM dzien_limitu ORDER BY dzien');
      if (!w.oczekiwane.dozwolone) {
        expect(wynik).toEqual({ ok: false, powod: 'limit' });
        expect(await ile(s.baza, 'zdarzenie')).toBe(zdarzPrzed);
        expect(dniPo).toEqual(dniPrzed);
      } else {
        expect(wynik).toMatchObject({ ok: true });
        const oczek = w.oczekiwane.zapis ? [...dniPrzed, { dzien: w.oczekiwane.zapis.data, pro: w.oczekiwane.zapis.pro ? 1 : 0 }] : dniPrzed;
        expect(dniPo).toEqual(oczek);
        if (w.oczekiwane.zapis && wynik.ok) expect(await jeden(s.baza, 'SELECT zdarzenie_id FROM dzien_limitu WHERE dzien = ?', [w.oczekiwane.zapis.data])).toEqual({ zdarzenie_id: wynik.wartosc.zdarzenieId });
      }
    },
  );

  test('R-003 ADR-0002: 50 równoległych +1 (Promise.all) → wartość 50, bez konfliktu, historia liniowa (rodzic = poprzednia głowa)', async () => {
    const s = await zLicznikiem(0);
    s.pro.wartosc = true;
    const w = await Promise.all(Array.from({ length: 50 }, () => dodajRzad(s.z, { licznikId: 'l1' })));
    expect(w.every((x) => x.ok)).toBe(true);
    expect(await stanLicznika(s.baza)).toMatchObject({ wartosc: 50, konflikt: 0 });
    const z = await s.baza.all<{ id: string; rodzice: string; wartosc_po: number }>("SELECT id, rodzice, wartosc_po FROM zdarzenie WHERE licznik_id = 'l1' ORDER BY wartosc_po");
    expect(z.map((x) => x.wartosc_po)).toEqual(Array.from({ length: 50 }, (_, i) => i + 1));
    for (let i = 1; i < z.length; i++) expect(JSON.parse(z[i].rodzice)).toEqual([z[i - 1].id]);
  });

  test('ŚU-20 RD-16: zdarzenie zapisuje strefę i dzień z chwili zmiany; po zmianie strefy stare zdarzenie nie jest przeliczane', async () => {
    const s = await zLicznikiem(0);
    s.zegar.ustaw(Date.UTC(2026, 9, 22, 11), 'Pacific/Kiritimati'); // UTC+14 → już 2026-10-23
    const a = await dodajRzad(s.z, { licznikId: 'l1' });
    s.zegar.ustaw(Date.UTC(2026, 9, 22, 12), 'America/Los_Angeles'); // UTC−7 → 2026-10-22
    await dodajRzad(s.z, { licznikId: 'l1' });
    const z = await s.baza.all("SELECT czas_ms, strefa, dzien FROM zdarzenie WHERE licznik_id = 'l1' ORDER BY czas_ms");
    expect(z).toEqual([
      { czas_ms: Date.UTC(2026, 9, 22, 11), strefa: 'Pacific/Kiritimati', dzien: '2026-10-23' },
      { czas_ms: Date.UTC(2026, 9, 22, 12), strefa: 'America/Los_Angeles', dzien: '2026-10-22' },
    ]);
    expect(a.ok).toBe(true);
  });

  test('ŚU-08 P-041 ADR-0002: transakcja czekająca na timer (await poza bazą) odrzucona przez port w trybie deweloperskim, nic nie zapisane', async () => {
    const s = await przygotuj({ trybDeweloperski: true });
    await expect(
      s.baza.transakcja(async (tx) => {
        await tx.run("INSERT INTO wloczka (id, nazwa, zmieniono_ms) VALUES ('y1', 'Merino', 0)");
        await new Promise((r) => setTimeout(r, 20));
        await tx.run("INSERT INTO wloczka (id, nazwa, zmieniono_ms) VALUES ('y2', 'Alpaka', 0)");
      }),
    ).rejects.toThrow(/ADR-0002/);
    expect(await ile(s.baza, 'wloczka')).toBe(0);
  });

  test('ADR-0013 P-026 moduly.md:89: +1 na liczniku w projekcie usuniętym → powod „niedozwolone_przejscie”, bez zdarzenia', async () => {
    const s = await zLicznikiem(4);
    expect(await usunProjekt(s.z, { projektId: 'p1' })).toEqual({ ok: true, wartosc: undefined });
    expect(await dodajRzad(s.z, { licznikId: 'l1' })).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
    expect(await ile(s.baza, 'zdarzenie')).toBe(4);
  });
});

describe('zapisy licznika (BR-LIC-*)', () => {
  test('ŚU-06 R-185 ADR-0002: zmiana nazwy projektu (UPSERT) zachowuje części, liczniki i zdarzenia (REPLACE skasowałby je kaskadą)', async () => {
    const s = await zLicznikiem(12);
    const przed = { czesc: await ile(s.baza, 'czesc'), licznik: await ile(s.baza, 'licznik'), zdarzenie: await ile(s.baza, 'zdarzenie') };
    expect(await nazwijProjekt(s.z, { projektId: 'p1', nazwa: 'Sweter raglan' })).toEqual({ ok: true, wartosc: undefined });
    expect(await jeden(s.baza, "SELECT nazwa FROM projekt WHERE id = 'p1'")).toEqual({ nazwa: 'Sweter raglan' });
    expect({ czesc: await ile(s.baza, 'czesc'), licznik: await ile(s.baza, 'licznik'), zdarzenie: await ile(s.baza, 'zdarzenie') }).toEqual(przed);
  });

  test('BR-LIC-001/S3: 12 rzędów w liczniku bez nazwy → nadanie nazwy projektu → projekt „Szal” ma licznik z wartością 12', async () => {
    const s = await przygotuj();
    const l = await utworzSzybkiLicznik(s.z);
    if (!l.ok) throw new Error(l.powod);
    for (let i = 0; i < 12; i++) await dodajRzad(s.z, { licznikId: l.wartosc.licznikId });
    expect(await nazwijProjekt(s.z, { projektId: l.wartosc.projektId, nazwa: 'Szal' })).toEqual({ ok: true, wartosc: undefined });
    expect(await s.baza.all('SELECT p.nazwa, l.wartosc FROM projekt p JOIN czesc c ON c.projekt_id = p.id JOIN licznik l ON l.czesc_id = c.id')).toEqual([{ nazwa: 'Szal', wartosc: 12 }]);
  });

  test('BR-LIC-006/S1: projekt z licznikiem rzędów 20 → drugi licznik oczek z 5 → oba w projekcie, 20 i 5', async () => {
    const s = await zLicznikiem(20);
    const l2 = await dodajLicznik(s.z, { czescId: 'c1', rodzaj: 'oczka' });
    if (!l2.ok) throw new Error(l2.powod);
    for (let i = 0; i < 5; i++) await dodajRzad(s.z, { licznikId: l2.wartosc.licznikId });
    expect(await s.baza.all("SELECT rodzaj, wartosc FROM licznik WHERE czesc_id = 'c1' ORDER BY rodzaj DESC")).toEqual([{ rodzaj: 'rzedy', wartosc: 20 }, { rodzaj: 'oczka', wartosc: 5 }]);
  });

  test('BR-LIC-017/S2: licznik 30 → wpisanie 35 (historia: rodzaj, godzina, przed 30 i po 35) → cofnięcie → 30', async () => {
    const s = await zLicznikiem(30);
    s.zegar.ustaw(T0 + DOBA);
    const w = await wpiszWartosc(s.z, { licznikId: 'l1', wartosc: 35 });
    if (!w.ok) throw new Error(w.powod);
    const wp = await jeden<{ rodzaj: string; wartosc: number; wartosc_po: number; czas_ms: number; rodzice: string }>(s.baza, 'SELECT rodzaj, wartosc, wartosc_po, czas_ms, rodzice FROM zdarzenie WHERE id = ?', [w.wartosc.zdarzenieId]);
    expect(wp).toMatchObject({ rodzaj: 'wpisanie', wartosc: 35, wartosc_po: 35, czas_ms: T0 + DOBA });
    expect(await jeden(s.baza, 'SELECT wartosc_po FROM zdarzenie WHERE id = ?', [JSON.parse(wp.rodzice)[0]])).toEqual({ wartosc_po: 30 }); // wartość przed
    expect(await cofnijOstatnie(s.z, { licznikId: 'l1' })).toMatchObject({ ok: true, wartosc: { wartosc: 30 } });
    expect(await jeden(s.baza, "SELECT rodzaj, cofa FROM zdarzenie WHERE licznik_id = 'l1' ORDER BY czas_ms DESC, rowid DESC LIMIT 1")).toEqual({ rodzaj: 'cofniecie', cofa: JSON.stringify([w.wartosc.zdarzenieId]) });
  });

  test('BR-LIC-017/S3 RD-15: wpisanie 57 przy przeniesieniu robótki nie jest rzędami zrobionymi tego dnia; +2 potem to 2 rzędy', async () => {
    const s = await zLicznikiem(0);
    s.pro.wartosc = true;
    await wpiszWartosc(s.z, { licznikId: 'l1', wartosc: 57 });
    expect(await wykonanieDnia(s.baza, s.zegar.teraz().dzien)).toEqual({ rzedy: 0 });
    await dodajRzad(s.z, { licznikId: 'l1' });
    await dodajRzad(s.z, { licznikId: 'l1' });
    expect(await wykonanieDnia(s.baza, s.zegar.teraz().dzien)).toEqual({ rzedy: 2 });
  });

  test('BR-LIC-003/S2 P-091: licznik 30 → przypadkowe 100 rzędów → cofnięcie serii z końca → 30, dzień bez cofniętych rzędów (RD-15)', async () => {
    const s = await zLicznikiem(30, { t: T0 - 2 * DOBA });
    s.pro.wartosc = true;
    const pierwszy = await dodajRzad(s.z, { licznikId: 'l1' });
    if (!pierwszy.ok) throw new Error(pierwszy.powod);
    for (let i = 1; i < 100; i++) await dodajRzad(s.z, { licznikId: 'l1' });
    expect(await stanLicznika(s.baza)).toMatchObject({ wartosc: 130 });
    expect(await cofnijSerie(s.z, { licznikId: 'l1', odZdarzeniaId: pierwszy.wartosc.zdarzenieId, zrodlo: 'pytanie-serii' })).toMatchObject({ ok: true, wartosc: { wartosc: 30 } });
    expect(await stanLicznika(s.baza)).toMatchObject({ wartosc: 30 });
    expect(await wykonanieDnia(s.baza, s.zegar.teraz().dzien)).toEqual({ rzedy: 0 });
    expect(await ile(s.baza, 'zdarzenie', "licznik_id = 'l1'")).toBe(131); // historia tylko dopisywana (ADR-0005)
  });

  test('P-091 (3a) cofnijOstatnie: trzy +1 → cofnięcie → 2; cofnięcie dotyczy tylko ostatniej zmiany (cofa = [głowa sprzed cofnięcia])', async () => {
    const s = await zLicznikiem(0);
    s.pro.wartosc = true;
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) { const w = await dodajRzad(s.z, { licznikId: 'l1' }); if (w.ok) ids.push(w.wartosc.zdarzenieId); }
    expect(await cofnijOstatnie(s.z, { licznikId: 'l1' })).toMatchObject({ ok: true, wartosc: { wartosc: 2 } });
    const c = await jeden<{ cofa: string; wartosc: number }>(s.baza, "SELECT cofa, wartosc FROM zdarzenie WHERE rodzaj = 'cofniecie'");
    expect({ cofa: JSON.parse(c.cofa), wartosc: c.wartosc }).toEqual({ cofa: [ids[2]], wartosc: 2 });
  });

  test('BR-LIC-017 wyzeruj: licznik 30 → 0, historia zachowana (31 zdarzeń, ostatnie „zerowanie”)', async () => {
    const s = await zLicznikiem(30);
    s.pro.wartosc = true;
    expect(await wyzeruj(s.z, { licznikId: 'l1' })).toMatchObject({ ok: true, wartosc: { wartosc: 0 } });
    expect(await ile(s.baza, 'zdarzenie', "licznik_id = 'l1'")).toBe(31);
    expect(await ile(s.baza, 'zdarzenie', "licznik_id = 'l1' AND rodzaj = 'zerowanie' AND wartosc_po = 0")).toBe(1);
  });
});
