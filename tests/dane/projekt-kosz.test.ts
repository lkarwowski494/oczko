// Projekt, części, kosz 30 dni i sprzątanie (moduly.md „Projekt”, ADR-0013, P-026, P-047 (7), P-072): ścieżki ŚU-14, ŚU-15, ŚU-19, ŚU-22 (dane.md),
// BR-DAN-008/S1–S4, BR-DAN-009/S1, BR-PRJ-*. Wyrocznie: BRD (wymagania-dane.md, wymagania-projekt.md), dane.md, P-026, P-072, konfiguracja (KOSZ_DNI, SESJA_MAKS_H).
import { migruj } from '../../src/dane/migracje/migruj';
import { widokProjektu } from '../../src/przypadki-uzycia/widok-projektu';
import { listaProjektow } from '../../src/dane/repozytoria/projekty';
import { KOSZ_DNI, SESJA_MAKS_H } from '../../src/konfiguracja';
import { sprzatnijKosz } from '../../src/przypadki-uzycia/kosz';
import { dodajRzad } from '../../src/przypadki-uzycia/licznik';
import {
  dodajCzescPara, przywrocCzesc, przywrocLicznik, przywrocProjekt, usunCzesc, usunLicznik, usunProjekt, usunWszystkieDane,
  utworzProjekt, zakonczProjekt, zapiszNotatke, zmienDateUkonczenia, zrobPonownie,
} from '../../src/przypadki-uzycia/projekt';
import { uruchomDane } from '../../src/przypadki-uzycia/start';
import { utworzPortNode } from '../../src/dane/baza/adapter-node';
import { join } from 'node:path';
import { czesc, dzienLimitu, licznik, plik, projekt, przypomnienie, sesja, wzor, zycie, type Instr } from './pomocnicze/dane-wejsciowe';
import { DOBA, GODZ, MIN, T0, dzienLokalny, ile, jeden, licznosci, migawka, przygotuj, sierotyPrzyStarcie, wlozPlik, wykonaj, zArchiwum } from './pomocnicze/srodowisko';

const OK = { ok: true, wartosc: undefined };
/** Warunek wstępny W2 (P-118, P-120 Q3a): poprzedni start aplikacji teraz — sprzątanie wymaga dwóch startów po terminie (moduly.md). */
const poprzedniStartTeraz = (s: Awaited<ReturnType<typeof przygotuj>>) =>
  s.baza.run("INSERT INTO ustawienie (klucz, wartosc, zmieniono_ms) VALUES ('ostatni_start_ms', ?, ?) ON CONFLICT (klucz) DO UPDATE SET wartosc = excluded.wartosc", [String(s.zegar.teraz().ms), s.zegar.teraz().ms]);
const SWETER: Instr[] = [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Rękaw lewy', 1, { cel: 96 }), czesc('c2', 'p1', 'Przód', 2), ...licznik('l1', 'c1', 18, { rodzaj: 'oczka' }), ...licznik('l2', 'c1', 40, { kolejnosc: 2 }), ...licznik('l3', 'c2', 7), przypomnienie('r1', 'l2')];
const daneProjektu = async (b: Parameters<typeof ile>[0]) => ({
  czesc: await ile(b, 'czesc', "projekt_id = 'p1'"),
  licznik: await ile(b, 'licznik l JOIN czesc c ON c.id = l.czesc_id', "c.projekt_id = 'p1'"),
  zdarzenie: await ile(b, 'zdarzenie z JOIN licznik l ON l.id = z.licznik_id JOIN czesc c ON c.id = l.czesc_id', "c.projekt_id = 'p1'"),
});

describe('kosz „Ostatnio usunięte” (F-33, P-026)', () => {
  test.each([
    [KOSZ_DNI - 1, 1],
    [KOSZ_DNI, 0],
    [KOSZ_DNI + 1, 0],
  ])('ŚU-14 BR-DAN-008/S2 P-026: projekt usunięty %i dni temu → po sprzątaniu przy starcie zostaje %i (29 zostaje, ≥ 30 sprzątnięty z kaskadą)', async (dni, zostaje) => {
    const s = await przygotuj();
    await wykonaj(s.baza, SWETER);
    expect(await usunProjekt(s.z, { projektId: 'p1' })).toEqual(OK);
    s.zegar.przesun(dni * DOBA);
    await poprzedniStartTeraz(s);
    const w = await sprzatnijKosz(s.z);
    expect(w).toMatchObject({ ok: true, wartosc: { projekty: 1 - zostaje } });
    expect(await ile(s.baza, 'projekt', "id = 'p1'")).toBe(zostaje);
    expect(await ile(s.baza, 'zdarzenie')).toBe(zostaje ? 65 : 0); // kaskada zdarzeń dopiero przy trwałym usunięciu
  });

  test('ŚU-14 BR-DAN-008/S1: usunięty projekt po 29 dniach przywrócony ze wszystkimi danymi (części, liczniki, historia, przypomnienia)', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, SWETER);
    await poprzedniStartTeraz(s); // przed migawką: porównanie obejmuje tabelę ustawienie
    const przed = await migawka(s.baza, ['projekt', 'blad']);
    const p = await daneProjektu(s.baza);
    await usunProjekt(s.z, { projektId: 'p1' });
    s.zegar.przesun((KOSZ_DNI - 1) * DOBA);
    await sprzatnijKosz(s.z);
    expect(await przywrocProjekt(s.z, { projektId: 'p1' })).toEqual(OK);
    expect(await jeden(s.baza, "SELECT usunieto_ms FROM projekt WHERE id = 'p1'")).toEqual({ usunieto_ms: null });
    expect(await daneProjektu(s.baza)).toEqual(p);
    expect(await migawka(s.baza, ['projekt', 'blad'])).toBe(przed);
  });

  test('P-072 (8a) KP-15: dni limitu zostają po trwałym usunięciu projektu z kosza', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [...SWETER, dzienLimitu('2026-10-01', 'l2-z1'), dzienLimitu('2026-10-02', 'l2-z2')]);
    await usunProjekt(s.z, { projektId: 'p1' });
    s.zegar.przesun(KOSZ_DNI * DOBA);
    await poprzedniStartTeraz(s);
    await sprzatnijKosz(s.z);
    expect(await ile(s.baza, 'projekt')).toBe(0);
    expect(await s.baza.all('SELECT dzien FROM dzien_limitu ORDER BY dzien')).toEqual([{ dzien: '2026-10-01' }, { dzien: '2026-10-02' }]);
  });

  test('BR-DAN-008/S3 P-047 (7): usunięty licznik oczek z 18 w „Swetrze” przywrócony w ciągu 30 dni z wartością 18 i historią', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, SWETER);
    expect(await usunLicznik(s.z, { licznikId: 'l1' })).toEqual(OK);
    s.zegar.przesun(10 * DOBA);
    await poprzedniStartTeraz(s);
    await sprzatnijKosz(s.z);
    expect(await przywrocLicznik(s.z, { licznikId: 'l1' })).toEqual(OK);
    expect(await jeden(s.baza, "SELECT wartosc, rodzaj, usunieto_ms FROM licznik WHERE id = 'l1'")).toEqual({ wartosc: 18, rodzaj: 'oczka', usunieto_ms: null });
    expect(await ile(s.baza, 'zdarzenie', "licznik_id = 'l1'")).toBe(18);
  });

  test('BR-DAN-008/S4 P-047 (7): usunięta część „Rękaw lewy” wraca z licznikami, wartościami i historią', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, SWETER);
    const przed = await s.baza.all("SELECT id, wartosc, glowa FROM licznik WHERE czesc_id = 'c1' ORDER BY id");
    expect(await usunCzesc(s.z, { czescId: 'c1' })).toEqual(OK);
    s.zegar.przesun(KOSZ_DNI * DOBA - MIN);
    await poprzedniStartTeraz(s);
    await sprzatnijKosz(s.z);
    expect(await przywrocCzesc(s.z, { czescId: 'c1' })).toEqual(OK);
    expect(await jeden(s.baza, "SELECT usunieto_ms FROM czesc WHERE id = 'c1'")).toEqual({ usunieto_ms: null });
    expect(await s.baza.all("SELECT id, wartosc, glowa FROM licznik WHERE czesc_id = 'c1' ORDER BY id")).toEqual(przed);
    expect(await ile(s.baza, 'zdarzenie', "licznik_id IN ('l1', 'l2')")).toBe(58);
  });

  test('ŚU-15 R-054 ADR-0001: sprzątanie usuwa tylko pliki bez odwołań — plik wzoru z aktywnego projektu i z projektu w koszu < 30 dni zostaje', async () => {
    const s = await przygotuj();
    const A = wlozPlik(s.magazyn, 'pdf A', 'pdf'), B = wlozPlik(s.magazyn, 'pdf B', 'pdf'), C = wlozPlik(s.magazyn, 'pdf C', 'pdf');
    await wykonaj(s.baza, [
      plik(A, 'pdf', 5), plik(B, 'pdf', 5), plik(C, 'pdf', 5),
      projekt('stary', 'Stary', T0 - 40 * DOBA, { usunieto: T0 - 31 * DOBA }), wzor('w1', 'stary', A), wzor('w2', 'stary', B),
      projekt('aktywny', 'Aktywny'), wzor('w3', 'aktywny', B),
      projekt('kosz', 'W koszu', T0, { usunieto: T0 - 10 * DOBA }), wzor('w4', 'kosz', C),
    ]);
    await poprzedniStartTeraz(s);
    expect(await sprzatnijKosz(s.z)).toMatchObject({ ok: true, wartosc: { projekty: 1, pliki: 1 } });
    expect(s.magazyn.usuniete).toEqual([]); // sprzątanie kosza usuwa wiersze `plik`, pliki — start (ADR-0001, 05-architekt-513)
    expect(await sierotyPrzyStarcie(s)).toEqual({ ok: true, wartosc: 1 });
    expect(s.magazyn.usuniete).toEqual([A]);
    expect((await s.baza.all<{ sha256: string }>('SELECT sha256 FROM plik ORDER BY sha256')).map((r) => r.sha256)).toEqual([B, C].sort());
  });
});

// F07-11 (P-125): podłączenie warunku dwóch startów w warstwie danych — `uruchomDane` czyta `ostatni_start_ms` POPRZEDNIEGO startu
// przed sprzątaniem i zapisuje bieżący na końcu. Wyrocznia: tabela „Funkcja sprzątania kosza” (moduly.md, P-118 W2, P-110 Q5a);
// testy wyżej ustawiają poprzedni start = teraz, więc nie odróżniają „poprzedni” od „bieżący”.
describe('ŚU-14 P-110 Q5a P-118 W2: sprzątanie kosza dopiero przy dwóch startach potwierdzających datę (uruchomDane)', () => {
  const start = (s: Awaited<ReturnType<typeof przygotuj>>) => uruchomDane({ ...s.z, migruj: (b) => migruj(b) });
  const ostatniStart = async (s: Awaited<ReturnType<typeof przygotuj>>) => (await jeden<{ wartosc: string } | undefined>(s.baza, "SELECT wartosc FROM ustawienie WHERE klucz = 'ostatni_start_ms'"))?.wartosc;

  test('pierwszy start po aktualizacji (brak ostatni_start_ms), 60 dni po usunięciu → projekt zostaje; ostatni_start_ms = teraz', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, SWETER);
    await usunProjekt(s.z, { projektId: 'p1' });
    s.zegar.przesun(60 * DOBA);
    expect(await start(s)).toMatchObject({ ok: true, wartosc: { sprzatnieto: 0 } });
    expect(await ile(s.baza, 'projekt', "id = 'p1'")).toBe(1);
    expect(await ostatniStart(s)).toBe(String(s.zegar.teraz().ms));
  });

  test('jednorazowy skok zegara w przód: start dzień po usunięciu, następny start „60 dni później” → zostaje; kolejny start po terminie → sprzątnięty', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, SWETER);
    await usunProjekt(s.z, { projektId: 'p1' });
    s.zegar.przesun(DOBA);
    await start(s); // ostatni = u + 1 dzień
    s.zegar.przesun(59 * DOBA);
    expect(await start(s)).toMatchObject({ ok: true, wartosc: { sprzatnieto: 0 } }); // teraz = u + 60 dni, ostatni = u + 1 dzień
    expect(await ile(s.baza, 'projekt', "id = 'p1'")).toBe(1);
    s.zegar.przesun(MIN);
    expect(await start(s)).toMatchObject({ ok: true, wartosc: { sprzatnieto: 1 } }); // ostatni = u + 60 dni ≥ u + KOSZ_DNI
    expect(await ile(s.baza, 'projekt', "id = 'p1'")).toBe(0);
  });
});

describe('sesja stopera przy starcie (P-072 (7a), SESJA_MAKS_H)', () => {
  test.each([
    [SESJA_MAKS_H * GODZ - MIN, 'trwa', null],
    [SESJA_MAKS_H * GODZ, 'zakonczona', SESJA_MAKS_H * GODZ],
    [SESJA_MAKS_H * GODZ + GODZ, 'zakonczona', SESJA_MAKS_H * GODZ],
  ])('ŚU-19 P-072: sesja „trwa” od %i ms → start aplikacji → stan %s, koniec = start + SESJA_MAKS_H', async (od, stan, koniec) => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), sesja('s1', 'p1', T0 - od)]);
    const w = await uruchomDane({ ...s.z, migruj: (b) => migruj(b) });
    expect(w).toMatchObject({ ok: true, wartosc: { domknieteSesje: koniec === null ? 0 : 1 } });
    expect(await jeden(s.baza, "SELECT stan, koniec_ms FROM sesja WHERE id = 's1'")).toEqual({ stan, koniec_ms: koniec === null ? null : T0 - od + koniec });
    // „oznaczona do sprawdzenia” (P-072 (7a)): schemat.sql v1 nie ma kolumny — [DO USTALENIA] Z07-22
  });
});

describe('„Usuń wszystkie dane” (F-34)', () => {
  test('ŚU-22 BR-DAN-009/S1: po potwierdzeniu brak projektów, zapasu, plików i dni limitu (dane.md: dni limitu usuwa tylko „usuń wszystko”)', async () => {
    const s = await przygotuj();
    const pliki = { pdf: wlozPlik(s.magazyn, 'pdf', 'pdf'), rys: wlozPlik(s.magazyn, 'rys', 'pkdrawing'), jpg: wlozPlik(s.magazyn, 'jpg', 'jpg') };
    await wykonaj(s.baza, zycie(pliki));
    expect(await usunWszystkieDane(zArchiwum(s.z))).toEqual(OK);
    const po = await licznosci(s.baza);
    for (const t of ['projekt', 'czesc', 'licznik', 'zdarzenie', 'wzor', 'rysunek', 'zdjecie', 'plik', 'wloczka', 'projekt_wloczka', 'notatka_rzedu', 'przypomnienie', 'dzien_limitu', 'sesja', 'obliczenie', 'narzedzie'])
      expect({ t, n: po[t] }).toEqual({ t, n: 0 });
    expect(new Set(s.magazyn.usuniete)).toEqual(new Set(Object.values(pliki)));
  });
});

describe('projekty i części (BR-PRJ-*)', () => {
  test('BR-PRJ-001/S1: „Sweter” z częściami przód, tył, rękaw lewy, rękaw prawy → 30 rzędów w rękawie lewym, pozostałe 0', async () => {
    const s = await przygotuj();
    const p = await utworzProjekt(s.z, { nazwa: 'Sweter', czesci: ['Przód', 'Tył', 'Rękaw lewy', 'Rękaw prawy'] });
    if (!p.ok) throw new Error(p.powod);
    const lewy = p.wartosc.czesci.find((c) => c.nazwa === 'Rękaw lewy')!;
    for (let i = 0; i < 30; i++) await dodajRzad(s.z, { licznikId: lewy.licznikId });
    expect(await s.baza.all('SELECT c.nazwa, l.wartosc FROM czesc c JOIN licznik l ON l.czesc_id = c.id WHERE c.projekt_id = ? ORDER BY c.kolejnosc', [p.wartosc.projektId]))
      .toEqual([{ nazwa: 'Przód', wartosc: 0 }, { nazwa: 'Tył', wartosc: 0 }, { nazwa: 'Rękaw lewy', wartosc: 30 }, { nazwa: 'Rękaw prawy', wartosc: 0 }]);
  });

  test('BR-PRJ-002/S2 P-047 (8): notatka ok. 5000 znaków zapisana i odczytana po ponownym otwarciu bazy bez obcięcia', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Sweter')]);
    const tekst = Array.from({ length: 100 }, (_, i) => `Rząd ${i + 1}: 2 p., 2 l., ujmowanie — żółć „wzór”;\n`).join('').padEnd(5000, 'ą').slice(0, 5000);
    expect(tekst.length).toBe(5000);
    expect(await zapiszNotatke(s.z, { projektId: 'p1', tekst })).toEqual(OK);
    s.baza.zamknij();
    const ponownie = utworzPortNode(join(s.katalog, 'oczko.db'));
    expect(await jeden(ponownie, "SELECT notatka FROM projekt WHERE id = 'p1'")).toEqual({ notatka: tekst });
  });

  test('BR-PRJ-006/S1: ukończenie → projekt znika z „W toku”, jest w „Ukończone” z datą i czasem pracy (suma sesji)', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), projekt('p2', 'Czapka'),
      ["INSERT INTO sesja (id, projekt_id, stan, start_ms, koniec_ms, strefa, dzien) VALUES ('s1', 'p1', 'zakonczona', ?, ?, 'Europe/Warsaw', '2026-10-21')", [T0 - DOBA, T0 - DOBA + 2 * GODZ]]]);
    expect(await zakonczProjekt(s.z, { projektId: 'p1' })).toEqual(OK);
    const l = await listaProjektow(s.baza);
    expect(l.wToku.map((p) => p.id)).toEqual(['p2']);
    expect(l.ukonczone).toEqual([expect.objectContaining({ id: 'p1', stan: 'ukonczony', ukonczonoMs: T0, czasPracyMs: 2 * GODZ })]);
  });

  test('BR-PRJ-007/S1: „zrób ponownie” Skarpety → nowy projekt z tymi samymi częściami i przypomnieniami, liczniki 0, oryginał bez zmian', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Skarpeta'), czesc('c1', 'p1', 'Cholewka', 1), czesc('c2', 'p1', 'Pięta', 2), ...licznik('l1', 'c1', 40), ...licznik('l2', 'c2', 12), przypomnienie('r1', 'l1')]);
    const przed = await migawka(s.baza);
    const w = await zrobPonownie(s.z, { projektId: 'p1', szablonNazwy: '{{nazwa}} {{n}}' });
    if (!w.ok) throw new Error(w.powod);
    const nowy = w.wartosc.projektId;
    expect(await jeden(s.baza, 'SELECT kopia_z FROM projekt WHERE id = ?', [nowy])).toEqual({ kopia_z: 'p1' });
    expect(await s.baza.all('SELECT c.nazwa, l.wartosc FROM czesc c JOIN licznik l ON l.czesc_id = c.id WHERE c.projekt_id = ? ORDER BY c.kolejnosc', [nowy])).toEqual([{ nazwa: 'Cholewka', wartosc: 0 }, { nazwa: 'Pięta', wartosc: 0 }]);
    expect(await ile(s.baza, 'przypomnienie r JOIN licznik l ON l.id = r.licznik_id JOIN czesc c ON c.id = l.czesc_id', 'c.projekt_id = ?', [nowy])).toBe(1);
    const poOryginal = await migawka(s.baza); // oryginał: te same wiersze co przed (nowe wiersze tylko dodane)
    for (const wiersz of JSON.parse(przed).projekt as string[]) expect(JSON.parse(poOryginal).projekt).toContain(wiersz);
  });

  test('BR-PRJ-012/S1: „Skarpeta” zmieniana wczoraj nad „Swetrem” sprzed 3 tygodni; ukończone osobno; +1 w Swetrze przenosi go na górę', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('sk', 'Skarpeta', T0, { ostatnia: T0 - DOBA }), projekt('sw', 'Sweter', T0, { ostatnia: T0 - 21 * DOBA }), czesc('c1', 'sw', 'Przód'), ...licznik('l1', 'c1', 3),
      projekt('cz', 'Czapka', T0, { stan: 'ukonczony', ukonczono: T0 - 2 * DOBA })]);
    let l = await listaProjektow(s.baza);
    expect({ wToku: l.wToku.map((p) => p.nazwa), ukonczone: l.ukonczone.map((p) => p.nazwa) }).toEqual({ wToku: ['Skarpeta', 'Sweter'], ukonczone: ['Czapka'] });
    await dodajRzad(s.z, { licznikId: 'l1' }); // moduly.md krok 3: UPDATE projekt SET ostatnia_praca_ms
    l = await listaProjektow(s.baza);
    expect(l.wToku.map((p) => p.nazwa)).toEqual(['Sweter', 'Skarpeta']);
  });

  test('BR-PRJ-012/S2: 80 projektów, wyszukiwanie „warkocz” → tylko ukończony „Sweter w warkocze” z oznaczeniem stanu', async () => {
    const s = await przygotuj();
    const w: Instr[] = Array.from({ length: 79 }, (_, i) => projekt(`p${i}`, `Projekt ${i}`));
    w.push(projekt('wk', 'Sweter w warkocze', T0, { stan: 'ukonczony', ukonczono: T0 - DOBA }));
    await wykonaj(s.baza, w);
    const l = await listaProjektow(s.baza, { szukaj: 'warkocz' });
    expect(l.wToku).toEqual([]);
    expect(l.ukonczone.map((p) => ({ nazwa: p.nazwa, stan: p.stan }))).toEqual([{ nazwa: 'Sweter w warkocze', stan: 'ukonczony' }]);
  });

  test('BR-PRJ-013/S2: data ukończenia zmieniona na 3 dni wcześniej → lista ukończonych pokazuje tę datę', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Sweter', T0, { stan: 'ukonczony', ukonczono: T0 })]);
    // 08 partia 4 (P-137): bez ukonczonoMs — ta sama pora co ukończenie (T0), więc chwila = T0 − 3 doby (bez zmiany czasu w tym okresie).
    expect(await zmienDateUkonczenia(s.z, { projektId: 'p1', ukonczonoDzien: dzienLokalny(T0 - 3 * DOBA, 'Europe/Warsaw') })).toEqual(OK);
    expect((await listaProjektow(s.baza)).ukonczone.map((p) => p.ukonczonoMs)).toEqual([T0 - 3 * DOBA]);
  });

  // P-199 Q2a (05 fix-6): para bez kopii celu — cel drugiej liczą widoki z rzędów pierwszej (celZPary), więc S1 i S3 sprawdza widok projektu.
  test('BR-PRJ-014/S1: drugi rękaw jako para pierwszego (96 rzędów, ukończony) → cel 96 z rzędów, para_z = pierwszy, bez kopii celu', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Rękaw lewy', 1, { cel: 96 }), ...licznik('l1', 'c1', 96)]);
    const w = await dodajCzescPara(s.z, { czescId: 'c1', nazwa: 'Rękaw prawy' });
    if (!w.ok) throw new Error(w.powod);
    expect(await jeden(s.baza, 'SELECT cel_rzedow, para_z, projekt_id FROM czesc WHERE id = ?', [w.wartosc.czescId])).toEqual({ cel_rzedow: null, para_z: 'c1', projekt_id: 'p1' });
    const v = await widokProjektu(s.z, { projektId: 'p1' });
    expect(v.ok && v.wartosc.czesci.map((c) => [c.nazwa, c.cel, c.celZPary])).toEqual([['Rękaw lewy', 96, false], ['Rękaw prawy', 96, true]]);
  });

  test('BR-PRJ-014/S1: pierwszy skończony na 98 rzędach przy celu 96 → cel drugiego 98 (rzędy pierwszej, nie jej cel)', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Rękaw lewy', 1, { cel: 96 }), ...licznik('l1', 'c1', 98)]);
    const w = await dodajCzescPara(s.z, { czescId: 'c1', nazwa: 'Rękaw prawy' });
    if (!w.ok) throw new Error(w.powod);
    const v = await widokProjektu(s.z, { projektId: 'p1' });
    expect(v.ok && v.wartosc.czesci.find((c) => c.id === w.wartosc.czescId)?.cel).toBe(98);
  });

  test('BR-PRJ-014/S3: pierwsza z celem 100 i 0 rzędów → druga bez celu; po 10 rzędach pierwszej cel drugiej 10', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Skarpety'), czesc('c1', 'p1', 'Pierwsza', 1, { cel: 100 }), ...licznik('l1', 'c1', 0)]);
    const w = await dodajCzescPara(s.z, { czescId: 'c1', nazwa: 'Druga' });
    if (!w.ok) throw new Error(w.powod);
    const cel = async () => { const v = await widokProjektu(s.z, { projektId: 'p1' }); return v.ok ? v.wartosc.czesci.find((c) => c.id === w.wartosc.czescId)?.cel : 'blad'; };
    expect(await cel()).toBeNull();
    await wykonaj(s.baza, [["UPDATE licznik SET wartosc = 10 WHERE id = 'l1'", []]]);
    expect(await cel()).toBe(10);
  });

  test('BR-PRJ-007 + BR-PRJ-014 (F-20, F-52, P-199 Q2a): „zrób ponownie” zachowuje parę — para_z kopii wskazuje część kopii', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Skarpety'), czesc('c1', 'p1', 'Lewa', 1), czesc('c2', 'p1', 'Prawa', 2, { paraZ: 'c1' }), ...licznik('l1', 'c1', 72), ...licznik('l2', 'c2', 72)]);
    const w = await zrobPonownie(s.z, { projektId: 'p1', szablonNazwy: '{{nazwa}} {{n}}' });
    if (!w.ok) throw new Error(w.powod);
    const c = await s.baza.all<{ id: string; nazwa: string; para_z: string | null }>('SELECT id, nazwa, para_z FROM czesc WHERE projekt_id = ? ORDER BY kolejnosc', [w.wartosc.projektId]);
    expect(c.map((x) => [x.nazwa, x.para_z])).toEqual([['Lewa', null], ['Prawa', c[0].id]]);
    expect(await jeden(s.baza, "SELECT para_z FROM czesc WHERE id = 'c2'", [])).toEqual({ para_z: 'c1' }); // oryginał bez zmian
  });

  test('BR-PRJ-016/S1: ostatnia zmiana „Swetra” 47 dni temu → na liście ostatnia praca = teraz − 47 dni i niżej niż nowsze', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('sw', 'Sweter', T0 - 60 * DOBA, { ostatnia: T0 - 47 * DOBA }), projekt('sk', 'Skarpeta', T0 - 2 * DOBA, { ostatnia: T0 - 2 * DOBA })]);
    const l = await listaProjektow(s.baza);
    expect(l.wToku.map((p) => [p.nazwa, Math.round((T0 - p.ostatniaPracaMs) / DOBA)])).toEqual([['Skarpeta', 2], ['Sweter', 47]]);
  });
});
