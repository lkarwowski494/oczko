// Dziennik +1 z ekranu blokady (ADR-0008, ADR-0005): ścieżki ŚU-02 i ŚU-03 (dane.md), Z07-11, R-020, R-021.
// Wyrocznie: ADR-0008 „Potwierdzenie” (M-02, M-04; uszkodzona ostatnia linia pomijana i raportowana), wektory scal-wektory.json, dane.md.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ZdarzenieWejsciowe } from '../../src/domena/porty';
import { parsujDziennik, utworzDziennikNode } from '../../src/dane/dziennik';
import { scalDziennik } from '../../src/przypadki-uzycia/dziennik';
import { dodajRzad } from '../../src/przypadki-uzycia/licznik';
import { naPierwszyPlan } from '../../src/przypadki-uzycia/start';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { MIN, T0, ile, jeden, przygotuj, wykonaj } from './pomocnicze/srodowisko';

const linia = (id: string, rodzice: string[], licznikId = 'l1', i = 0): ZdarzenieWejsciowe => ({
  id, licznikId, rodzaj: 'plus', rodzice, czasMs: T0 + (i + 1) * MIN, strefa: 'Europe/Warsaw', dzien: '2026-10-22', zrodlo: 'ekran_blokady', urzadzenie: 'iphone-test', pro: false,
});
/** Trzy stuknięcia z ekranu blokady łańcuchem od głowy licznika `l1-z<n>` (Live Activity zna głowę z ostatniego stanu, Z07-11). */
const trzy = (glowa: string) => [linia('d1', [glowa], 'l1', 0), linia('d2', ['d1'], 'l1', 1), linia('d3', ['d2'], 'l1', 2)];
async function zLicznikiem(n: number) {
  const s = await przygotuj();
  s.pro.wartosc = true;
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', n)]);
  return s;
}
const stan = (s: Awaited<ReturnType<typeof zLicznikiem>>) => jeden<{ wartosc: number; glowa: string; konflikt: number }>(s.baza, "SELECT wartosc, glowa, konflikt FROM licznik WHERE id = 'l1'");

describe('dziennik +1 (ADR-0008)', () => {
  test('ŚU-02 M-02: trzy linie dziennika → +3, skrócenie do ostatniej; ponowne scalenie tych samych linii nie dubluje', async () => {
    const s = await zLicznikiem(20);
    s.dziennik.linie.push(...trzy('l1-z20'));
    expect(await scalDziennik(s.z)).toEqual({ ok: true, wartosc: { scalono: 3, pominieto: 0, potwierdzone: [] } });
    expect(await stan(s)).toEqual({ wartosc: 23, glowa: 'd3', konflikt: 0 });
    expect(s.dziennik.skrocono).toEqual(['d3']);
    s.dziennik.linie.push(...trzy('l1-z20')); // skrócenie nie doszło (zabicie procesu po COMMIT) — te same linie drugi raz
    await scalDziennik(s.z);
    expect(await ile(s.baza, 'zdarzenie', "zrodlo = 'ekran_blokady'")).toBe(3);
    expect(await stan(s)).toEqual({ wartosc: 23, glowa: 'd3', konflikt: 0 });
  });

  test('ŚU-03 Z07-11: przerwany zapis linii — uszkodzona ostatnia linia pominięta, poprzednie scalone, wpis w blad', async () => {
    const s = await zLicznikiem(5);
    const plik = join(s.katalog, 'dziennik-plus.jsonl');
    const [a, b] = trzy('l1-z5');
    writeFileSync(plik, `${JSON.stringify(a)}\n${JSON.stringify(b)}\n{"id":"d3","licznikId":"l1","rodz`);
    const parsowany = parsujDziennik(`${JSON.stringify(a)}\n${JSON.stringify(b)}\n{"id":"d3","licznikId":"l1","rodz`);
    expect(parsowany).toEqual({ zdarzenia: [a, b], uszkodzone: [3] });
    const bladPrzed = await ile(s.baza, 'blad');
    const z = { ...s.z, dziennik: utworzDziennikNode(plik, s.baza) };
    expect(await scalDziennik(z)).toEqual({ ok: true, wartosc: { scalono: 2, pominieto: 0, potwierdzone: [] } });
    expect(await stan(s)).toMatchObject({ wartosc: 7, glowa: 'd2' });
    expect(await ile(s.baza, 'blad')).toBe(bladPrzed + 1);
    expect(await ile(s.baza, 'blad', "kod LIKE '%dziennik%'")).toBe(1);
  });

  test('R-021 Z07-11: zatruta linia (licznik spoza bazy) pominięta i zgłoszona; pozostałe linie scalone, dziennik skrócony do końca', async () => {
    const s = await zLicznikiem(10);
    s.dziennik.linie.push(linia('d1', ['l1-z10']), linia('x1', [], 'licznik-usuniety'), linia('d2', ['d1'], 'l1', 1));
    expect(await scalDziennik(s.z)).toEqual({ ok: true, wartosc: { scalono: 2, pominieto: 1, potwierdzone: [] } });
    expect(await stan(s)).toMatchObject({ wartosc: 12, glowa: 'd2' });
    expect(await ile(s.baza, 'blad')).toBeGreaterThanOrEqual(1);
    expect(s.dziennik.skrocono).toEqual(['d2']);
    expect(s.dziennik.linie).toEqual([]);
  });

  test('Z07-11 R-020: scalenie dziennika przed pierwszym zapisem po powrocie — naPierwszyPlan i +1 w tej samej chwili → 20 + 3 + 1, bez konfliktu', async () => {
    const s = await zLicznikiem(20);
    s.dziennik.linie.push(...trzy('l1-z20'));
    const [scal, plus] = await Promise.all([naPierwszyPlan(s.z), dodajRzad(s.z, { licznikId: 'l1' })]);
    expect(scal).toEqual({ ok: true, wartosc: { scalono: 3, potwierdzone: [] } });
    expect(plus).toMatchObject({ ok: true, wartosc: { wartosc: 24 } });
    expect(await stan(s)).toMatchObject({ wartosc: 24, konflikt: 0 });
    if (plus.ok) expect(await jeden(s.baza, 'SELECT rodzice FROM zdarzenie WHERE id = ?', [plus.wartosc.zdarzenieId])).toEqual({ rodzice: '["d3"]' });
  });

  test('M-04 NFR-DAN-003 ADR-0008: +1 z dziennika i +1 w aplikacji od tej samej głowy → konflikt pokazany (konflikt = 1), żadne zdarzenie nie zgubione', async () => {
    const s = await zLicznikiem(10);
    await dodajRzad(s.z, { licznikId: 'l1' }); // aplikacja: 11, rodzic l1-z10
    s.dziennik.linie.push(linia('d1', ['l1-z10'])); // ekran blokady: też od l1-z10
    await scalDziennik(s.z);
    expect(await stan(s)).toMatchObject({ konflikt: 1 });
    expect(await ile(s.baza, 'zdarzenie', "licznik_id = 'l1'")).toBe(12);
  });
});
