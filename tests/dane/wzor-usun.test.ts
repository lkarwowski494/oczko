// Kilka wzorów w projekcie, kosz wzoru i rysunki (P-220 W9b, N4; P-229 kosz; moduly.md „Kontrakt partii 6”: listaWzorow, usunWzor, przywrocWzor,
// zapiszRysunek; ADR-0012 uzupełnienie). Wyrocznie: kontrakt partii 6, KOSZ_DNI (P-026), warunek dwóch startów (P-118 W2), ADR-0001 (pliki po COMMIT).
import { writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { KOSZ_DNI } from '../../src/konfiguracja';
import { elementyKosza } from '../../src/dane/repozytoria/kosz';
import { sprzatnijKosz } from '../../src/przypadki-uzycia/kosz';
import { przywrocProjekt, usunProjekt } from '../../src/przypadki-uzycia/projekt';
import { zapamietajLicznik } from '../../src/przypadki-uzycia/widok-licznika';
import { listaWzorow, przywrocWzor, usunWzor, ustawZnacznik, wzorDoOtwarcia, zapamietajWzor, zapiszRysunek, zmienNazweWzoru } from '../../src/przypadki-uzycia/wzor';
import { dodajNotatkeWzoru } from '../../src/przypadki-uzycia/wzor-notatki';
import { czesc, licznik, plik, projekt, rysunek, wzor, type Instr } from './pomocnicze/dane-wejsciowe';
import { DOBA, T0, ile, jeden, przygotuj, sha256, wlozPlik, wykonaj } from './pomocnicze/srodowisko';

const OK = { ok: true, wartosc: undefined };
const PDF = Buffer.from('%PDF-1.4\n%%EOF\n');
const RYS = Buffer.from('pkdrawing-1');
const nazwany = (id: string, p: string, h: string, nazwa: string): Instr => ["INSERT INTO wzor (id, projekt_id, nazwa, zrodlo, pdf_sha256, zmieniono_ms) VALUES (?, ?, ?, 'pdf', ?, ?)", [id, p, nazwa, h, T0]];
const poprzedniStartTeraz = (s: Awaited<ReturnType<typeof przygotuj>>) =>
  s.baza.run("INSERT INTO ustawienie (klucz, wartosc, zmieniono_ms) VALUES ('ostatni_start_ms', ?, ?) ON CONFLICT (klucz) DO UPDATE SET wartosc = excluded.wartosc", [String(s.zegar.teraz().ms), s.zegar.teraz().ms]);

async function zDwomaWzorami() {
  const s = await przygotuj();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  const r = wlozPlik(s.magazyn, RYS, 'pkdrawing');
  const znacznik = JSON.stringify({ licznik_id: 'l1', strona: 0, y: 0.2, wysokosc_rzedu: 0.02, rzad_bazowy: 1, wartosc_przy_ustawieniu: 0, kierunek: 1 });
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 3), plik(h, 'pdf', PDF.length), plik(r, 'pkdrawing', RYS.length),
    wzor('w1', 'p1', h, znacznik), nazwany('w2', 'p1', h, 'ażurowy brzeg'), rysunek('w1', 0, r)]);
  return { s, h, r };
}

describe('listaWzorow i ostatnio oglądany wzór (P-220 W2a, W9b; F-49)', () => {
  test('wzory projektu po nazwie (bez wielkości liter), z rodzajem i znacznikiem; usunięte pominięte', async () => {
    const { s } = await zDwomaWzorami();
    expect(await listaWzorow(s.z, { projektId: 'p1' })).toEqual({ ok: true, wartosc: [
      { wzorId: 'w2', nazwa: 'ażurowy brzeg', zrodlo: 'pdf', maZnacznik: false, strony: null }, // strony: P-252, NULL = nieznana
      { wzorId: 'w1', nazwa: 'Wzór', zrodlo: 'pdf', maZnacznik: true, strony: null },
    ] });
    await usunWzor(s.z, { wzorId: 'w2' });
    expect(await listaWzorow(s.z, { projektId: 'p1' })).toMatchObject({ ok: true, wartosc: [{ wzorId: 'w1' }] });
    expect(await listaWzorow(s.z, { projektId: 'nie-ma' })).toEqual({ ok: true, wartosc: [] });
  });

  test('otwiera się ostatnio oglądany wzór projektu, inaczej pierwszy z listy; zapamiętanie wzoru nie psuje ostatniego licznika (F-49)', async () => {
    const { s } = await zDwomaWzorami();
    expect(await wzorDoOtwarcia(s.z, { projektId: 'p1' })).toEqual({ ok: true, wartosc: 'w2' });
    await zapamietajLicznik(s.z, { licznikId: 'l1' });
    expect(await zapamietajWzor(s.z, { licznikId: 'l1', wzorId: 'w1' })).toEqual(OK);
    expect(await wzorDoOtwarcia(s.z, { projektId: 'p1' })).toEqual({ ok: true, wartosc: 'w1' });
    expect(JSON.parse((await jeden<{ wartosc: string }>(s.baza, "SELECT wartosc FROM ustawienie WHERE klucz = 'ostatnie_miejsce'")).wartosc)).toEqual({ ekran: 'licznik', id: 'l1', wzor: 'w1' });
    await usunWzor(s.z, { wzorId: 'w1' });
    expect(await wzorDoOtwarcia(s.z, { projektId: 'p1' })).toEqual({ ok: true, wartosc: 'w2' });
    await usunWzor(s.z, { wzorId: 'w2' });
    expect(await wzorDoOtwarcia(s.z, { projektId: 'p1' })).toEqual({ ok: true, wartosc: null });
  });
});

describe('usunWzor i przywrocWzor — kosz (P-229, P-233 (6), N4)', () => {
  test('usunięcie: znika z listy od razu, jest w „Ostatnio usuniętych” z terminem, nazwą wzoru i projektu; rysunki i znacznik zostają', async () => {
    const { s } = await zDwomaWzorami();
    s.zegar.przesun(DOBA);
    const teraz = s.zegar.teraz().ms;
    expect(await usunWzor(s.z, { wzorId: 'w1' })).toEqual(OK);
    expect(await jeden(s.baza, "SELECT usunieto_ms, zmieniono_ms FROM wzor WHERE id = 'w1'")).toEqual({ usunieto_ms: teraz, zmieniono_ms: teraz });
    const k = await elementyKosza(s.baza, 'Europe/Warsaw', teraz);
    expect(k).toEqual([expect.objectContaining({ rodzaj: 'wzor', id: 'w1', nazwa: 'Wzór', projekt: 'Sweter', usunietoMs: teraz, doDnia: '2026-11-22' })]);
    expect(await ile(s.baza, 'rysunek', "wzor_id = 'w1'")).toBe(1);
  });

  test('ponowne usunięcie → niedozwolone_przejscie, termin się nie przesuwa; nieistniejący → bledne_dane', async () => {
    const { s } = await zDwomaWzorami();
    await usunWzor(s.z, { wzorId: 'w1' });
    const przed = await jeden(s.baza, "SELECT usunieto_ms FROM wzor WHERE id = 'w1'");
    s.zegar.przesun(DOBA);
    expect(await usunWzor(s.z, { wzorId: 'w1' })).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
    expect(await jeden(s.baza, "SELECT usunieto_ms FROM wzor WHERE id = 'w1'")).toEqual(przed);
    expect(await usunWzor(s.z, { wzorId: 'nie-ma' })).toEqual({ ok: false, powod: 'bledne_dane' });
  });

  test('przywrócenie z rysunkami i znacznikiem; przywrócenie wzoru spoza kosza → niedozwolone_przejscie', async () => {
    const { s } = await zDwomaWzorami();
    const przed = await jeden<{ znacznik: string }>(s.baza, "SELECT znacznik FROM wzor WHERE id = 'w1'");
    await usunWzor(s.z, { wzorId: 'w1' });
    expect(await przywrocWzor(s.z, { wzorId: 'w1' })).toEqual(OK);
    expect(await jeden(s.baza, "SELECT usunieto_ms, znacznik FROM wzor WHERE id = 'w1'")).toEqual({ usunieto_ms: null, ...przed });
    expect(await ile(s.baza, 'rysunek', "wzor_id = 'w1'")).toBe(1);
    expect(await przywrocWzor(s.z, { wzorId: 'w1' })).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
  });

  test('wzór projektu w koszu idzie z projektem: nie ma go osobno w koszu, przywrócenie projektu przywraca wzór bez zmiany jego usunieto_ms', async () => {
    const { s } = await zDwomaWzorami();
    await usunWzor(s.z, { wzorId: 'w2' });
    const w2 = await jeden(s.baza, "SELECT usunieto_ms FROM wzor WHERE id = 'w2'");
    await usunProjekt(s.z, { projektId: 'p1' });
    expect((await elementyKosza(s.baza, 'Europe/Warsaw', s.zegar.teraz().ms)).map((e) => e.rodzaj)).toEqual(['projekt']);
    expect(await usunWzor(s.z, { wzorId: 'w1' })).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
    await przywrocProjekt(s.z, { projektId: 'p1' });
    expect(await listaWzorow(s.z, { projektId: 'p1' })).toMatchObject({ ok: true, wartosc: [{ wzorId: 'w1' }] });
    expect(await jeden(s.baza, "SELECT usunieto_ms FROM wzor WHERE id = 'w2'")).toEqual(w2);
  });

  test.each([[KOSZ_DNI - 1, 1], [KOSZ_DNI, 0]])('sprzątanie po %i dniach i dwóch startach → zostaje %i (kaskada rysunków, pliki bez odwołań po COMMIT)', async (dni, zostaje) => {
    const { s, h, r } = await zDwomaWzorami();
    await usunWzor(s.z, { wzorId: 'w1' });
    s.zegar.przesun(dni * DOBA + 60_000);
    await poprzedniStartTeraz(s);
    const w = await sprzatnijKosz(s.z);
    expect(w).toMatchObject({ ok: true, wartosc: { wzory: 1 - zostaje } });
    expect(await ile(s.baza, 'wzor', "id = 'w1'")).toBe(zostaje);
    expect(await ile(s.baza, 'rysunek')).toBe(zostaje);
    expect(s.magazyn.usuniete.includes(r)).toBe(!zostaje); // rysunek bez odwołań
    expect(s.magazyn.usuniete.includes(h)).toBe(false); // PDF nadal w w2
  });

  test('na usuniętym wzorze nie ma zapisu: znacznik, notatka i rysunek → niedozwolone_przejscie (plik tymczasowy rysunku czeka na przywrócenie, M1-104)', async () => {
    const { s } = await zDwomaWzorami();
    await usunWzor(s.z, { wzorId: 'w1' });
    expect(await ustawZnacznik(s.z, { wzorId: 'w1', licznikId: 'l1', strona: 0, y: 0.5, wysokoscRzedu: 0.02, rzadBazowy: 4, kierunek: 1 })).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
    expect(await dodajNotatkeWzoru(s.z, { wzorId: 'w1', rzad: 4, tekst: 'x' })).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
    const tmp = join(s.katalog, 'tmp', 'r.pkdrawing');
    writeFileSync(tmp, 'nowy');
    expect(await zapiszRysunek(s.z, { wzorId: 'w1', strona: 0, plikTymczasowy: tmp })).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
    expect(existsSync(tmp)).toBe(true); // M1-104 (DEC-29 (a)): kosz da się cofnąć, więc kreski czekają (tests/dane/wzor-rysunki-kosz.test.ts)
  });
});

describe('zapiszRysunek (ADR-0012 uzupełnienie: UPSERT strony, stary plik po COMMIT)', () => {
  test('nowa strona → wiersz rysunku i plik w magazynie; plik tymczasowy usunięty', async () => {
    const { s } = await zDwomaWzorami();
    const tmp = join(s.katalog, 'tmp', 'r.pkdrawing');
    writeFileSync(tmp, 'strona-3');
    expect(await zapiszRysunek(s.z, { wzorId: 'w2', strona: 3, plikTymczasowy: tmp })).toEqual(OK);
    expect(await jeden(s.baza, "SELECT plik_sha256, zmieniono_ms FROM rysunek WHERE wzor_id = 'w2' AND strona = 3")).toEqual({ plik_sha256: sha256('strona-3'), zmieniono_ms: T0 });
    expect(await jeden(s.baza, 'SELECT rozszerzenie FROM plik WHERE sha256 = ?', [sha256('strona-3')])).toEqual({ rozszerzenie: 'pkdrawing' });
    expect(existsSync(tmp)).toBe(false);
  });

  test('ta sama strona drugi raz → jeden wiersz z nowym plikiem; stary plik bez odwołań usunięty z bazy i magazynu po COMMIT', async () => {
    const { s, r } = await zDwomaWzorami();
    s.zegar.przesun(5_000);
    const tmp = join(s.katalog, 'tmp', 'r.pkdrawing');
    writeFileSync(tmp, 'strona-0-v2');
    expect(await zapiszRysunek(s.z, { wzorId: 'w1', strona: 0, plikTymczasowy: tmp })).toEqual(OK);
    expect(await jeden(s.baza, "SELECT plik_sha256, zmieniono_ms FROM rysunek WHERE wzor_id = 'w1' AND strona = 0")).toEqual({ plik_sha256: sha256('strona-0-v2'), zmieniono_ms: T0 + 5_000 });
    expect(await ile(s.baza, 'plik', 'sha256 = ?', [r])).toBe(0);
    expect(s.magazyn.usuniete).toEqual([r]);
  });

  test('stary plik wciąż używany przez inną stronę zostaje', async () => {
    const { s, r } = await zDwomaWzorami();
    await wykonaj(s.baza, [rysunek('w2', 0, r)]);
    const tmp = join(s.katalog, 'tmp', 'r.pkdrawing');
    writeFileSync(tmp, 'inny');
    await zapiszRysunek(s.z, { wzorId: 'w1', strona: 0, plikTymczasowy: tmp });
    expect(await ile(s.baza, 'plik', 'sha256 = ?', [r])).toBe(1);
    expect(s.magazyn.usuniete).toEqual([]);
  });

  test('zła strona → bledne_dane; brak wzoru → bledne_dane', async () => {
    const { s } = await zDwomaWzorami();
    const tmp = join(s.katalog, 'tmp', 'r.pkdrawing');
    writeFileSync(tmp, 'x');
    expect(await zapiszRysunek(s.z, { wzorId: 'w1', strona: -1, plikTymczasowy: tmp })).toEqual({ ok: false, powod: 'bledne_dane' });
    writeFileSync(tmp, 'x');
    expect(await zapiszRysunek(s.z, { wzorId: 'nie-ma', strona: 0, plikTymczasowy: tmp })).toEqual({ ok: false, powod: 'bledne_dane' });
  });
});

test('przegląd: powrót do licznika nie gubi ostatniego wzoru (zapamietajLicznik zachowuje `wzor`)', async () => {
  const { s } = await zDwomaWzorami();
  await zapamietajWzor(s.z, { licznikId: 'l1', wzorId: 'w1' });
  await zapamietajLicznik(s.z, { licznikId: 'l1' });
  expect(await wzorDoOtwarcia(s.z, { projektId: 'p1' })).toEqual({ ok: true, wartosc: 'w1' });
});

describe('zmiana nazwy wzoru (design-spec W1a ••• „Rename”, plan 1.1 pkt 1)', () => {
  test('nazwa przycięta; pusta = bledne_dane bez zmiany; wzór w koszu = niedozwolone_przejscie; nieznany = bledne_dane', async () => {
    const { s } = await zDwomaWzorami();
    expect(await zmienNazweWzoru(s.z, { wzorId: 'w2', nazwa: '  Edging chart ' })).toEqual(OK);
    expect(await jeden(s.baza, "SELECT nazwa, zmieniono_ms FROM wzor WHERE id = 'w2'")).toEqual({ nazwa: 'Edging chart', zmieniono_ms: s.zegar.teraz().ms });
    expect(await zmienNazweWzoru(s.z, { wzorId: 'w2', nazwa: '   ' })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await jeden(s.baza, "SELECT nazwa FROM wzor WHERE id = 'w2'")).toEqual({ nazwa: 'Edging chart' });
    await usunWzor(s.z, { wzorId: 'w2' });
    expect(await zmienNazweWzoru(s.z, { wzorId: 'w2', nazwa: 'X' })).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
    expect(await zmienNazweWzoru(s.z, { wzorId: 'brak', nazwa: 'X' })).toEqual({ ok: false, powod: 'bledne_dane' });
  });
});
