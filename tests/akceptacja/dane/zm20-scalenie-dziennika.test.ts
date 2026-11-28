// PU-Z06, PU-Z07 (katalog: „Oczekujące 1.0.2”). ZM-20 (U2, ADR-0035, P-1096): scalenie dziennika ekranu blokady/zegarka na nieaktualnej
// głowie — linia ±1 dostaje rodzica = bieżąca głowa, gdy zmiany po jej rodzicu są przemienne (suma, bez konfliktu); wpisanie po stuknięciu
// → konflikt pokazany (PU-099), nic nie znika. Wyrocznia: scenariusze SC-01…SC-06 roli 05 (docs/architektura/wektory-1-0-2.json; wartości
// z niezależnego prototypu `scal` z E1). Ścieżka: `scalDziennik` (src/przypadki-uzycia/dziennik.ts) na `node:sqlite`, jak tests/dane/dziennik-poczekalnia-ekranu.test.ts.
import wektory from '../../../docs/architektura/wektory-1-0-2.json';
import type { ZdarzenieWejsciowe } from '../../../src/domena/porty';
import { scalDziennik } from '../../../src/przypadki-uzycia/dziennik';
import { czesc, projekt, zdarzenie, type Instr } from '../../dane/pomocnicze/dane-wejsciowe';
import { T0, ile, jeden, przygotuj, wykonaj } from '../../dane/pomocnicze/srodowisko';

type Ev = { id: string; rodzaj: string; czasMs: number; rodzice: string[]; wartosc?: number; zrodlo: string };
type SC = { id: string; opis: string; baza: Ev[]; linie: Ev[]; oczekiwane: { decyzje: Record<string, string>; rodzice: Record<string, string[]>; stan: 'zgodny' | 'konflikt'; wartosc?: number; kandydaci?: Record<string, number> } };
const SCENARIUSZE = (wektory as unknown as { scenariusze: SC[] }).scenariusze;
const STREFA = 'Europe/Warsaw', DZIEN = '2026-10-22';

/** Baza z historią scenariusza (wartosc_po liczona według rodzajów: wpisanie = wartość, zerowanie = 0, ±1 z dolną granicą 0) i licznik z głową = ostatnie zdarzenie bazy. */
async function zeScenariusza(sc: SC) {
  const s = await przygotuj();
  s.pro.wartosc = true; // limit dni poza tym testem (scalenie na telefonie nie woła strażnika, ADR-0008 (6))
  let w = 0;
  const instr: Instr[] = [];
  for (const e of sc.baza) {
    w = e.rodzaj === 'wpisanie' ? e.wartosc ?? 0 : e.rodzaj === 'zerowanie' ? 0 : e.rodzaj === 'plus' ? w + 1 : Math.max(0, w - 1);
    instr.push(zdarzenie(e.id, 'l1', e.rodzaj, w, e.rodzice, T0 + e.czasMs, { wartosc: e.rodzaj === 'wpisanie' ? e.wartosc : null, zrodlo: e.zrodlo, dzien: DZIEN }));
  }
  const glowa = sc.baza[sc.baza.length - 1].id;
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'),
    ['INSERT INTO licznik (id, czesc_id, rodzaj, zablokowany, wartosc, glowa, kolejnosc, zmieniono_ms) VALUES (?, ?, ?, 0, ?, ?, 1, ?)', ['l1', 'c1', 'rzedy', w, glowa, T0]], ...instr]);
  return s;
}
const linia = (e: Ev): ZdarzenieWejsciowe => ({ id: e.id, licznikId: 'l1', rodzaj: e.rodzaj as ZdarzenieWejsciowe['rodzaj'], rodzice: e.rodzice, czasMs: T0 + e.czasMs, strefa: STREFA, dzien: DZIEN, zrodlo: e.zrodlo as ZdarzenieWejsciowe['zrodlo'], urzadzenie: 'iphone-test', pro: true });
const licznik = (s: Awaited<ReturnType<typeof przygotuj>>) => jeden<{ wartosc: number; konflikt: number }>(s.baza, "SELECT wartosc, konflikt FROM licznik WHERE id = 'l1'");
const rodzice = async (s: Awaited<ReturnType<typeof przygotuj>>, id: string) => JSON.parse((await jeden<{ rodzice: string }>(s.baza, 'SELECT rodzice FROM zdarzenie WHERE id = ?', [id])).rodzice) as string[];

describe('ZM-20 scalenie dziennika na nieaktualnej głowie (ADR-0035)', () => {
  for (const sc of SCENARIUSZE.filter((x) => x.oczekiwane.stan === 'zgodny')) {
    test(`ZM-20 ${sc.id} PU-Z06: ${sc.opis}`, async () => {
      const s = await zeScenariusza(sc);
      s.dziennik.linie.push(...sc.linie.map(linia));
      await scalDziennik(s.z);
      expect(await licznik(s)).toEqual({ wartosc: sc.oczekiwane.wartosc, konflikt: 0 });
      for (const [id, r] of Object.entries(sc.oczekiwane.rodzice)) expect({ id, rodzice: await rodzice(s, id) }).toEqual({ id, rodzice: r });
      expect(await ile(s.baza, 'zdarzenie', 'zrodlo IN (?, ?)', ['ekran_blokady', 'zegarek'])).toBe(sc.linie.length); // żadne stuknięcie nie znika
    });
  }

  const sc02 = SCENARIUSZE.find((x) => x.id === 'SC-02')!;
  test('[ZIELONY-OK: rozwidlenie nieprzemienne już dziś daje konflikt; strażnik, że przesunięcie go nie połknie] ZM-20 SC-02 PU-Z07: wpisanie po stuknięciu → konflikt pokazany, obie wersje zostają', async () => {
    const s = await zeScenariusza(sc02);
    s.dziennik.linie.push(...sc02.linie.map(linia));
    await scalDziennik(s.z);
    expect((await licznik(s)).konflikt).toBe(1);
    for (const [id, w] of Object.entries(sc02.oczekiwane.kandydaci!)) expect({ id, w: (await jeden<{ wartosc_po: number }>(s.baza, 'SELECT wartosc_po FROM zdarzenie WHERE id = ?', [id])).wartosc_po }).toEqual({ id, w });
    expect(await rodzice(s, 'l1')).toEqual(['w']); // rodzic linii bez zmian (ADR-0035 reguła 5)
  });

  test('ZM-20 SC-01 ponowna dostawa przesuniętych linii (ADR-0035 reguła 7): bez `dziennik_kolizja_id`, bez podwójnych rzędów, wartość 14', async () => {
    const sc = SCENARIUSZE.find((x) => x.id === 'SC-01')!;
    const s = await zeScenariusza(sc);
    s.dziennik.linie.push(...sc.linie.map(linia));
    await scalDziennik(s.z);
    s.dziennik.linie.push(...sc.linie.map(linia)); // te same linie z pierwotnym rodzicem (np. zegarek ponawia po braku potwierdzenia)
    await scalDziennik(s.z);
    expect(await ile(s.baza, 'blad', "kod = 'dziennik_kolizja_id'")).toBe(0);
    expect(await ile(s.baza, 'zdarzenie', "zrodlo = 'ekran_blokady'")).toBe(3);
    expect(await licznik(s)).toEqual({ wartosc: 14, konflikt: 0 });
  });
});
