// 07-jakosc-021 (BR-LIC-003 S2–S4): drugie „Undo” z historii cofa poprzednią zmianę, a nie ponawia cofniętej.
import { cofnijOstatnie, dodajRzad, wpiszWartosc } from '../../src/przypadki-uzycia/licznik';
import { historiaLicznika } from '../../src/przypadki-uzycia/widok-licznika';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { jeden, przygotuj, wykonaj, type Srodowisko } from './pomocnicze/srodowisko';

async function zLicznikiem(n = 0): Promise<Srodowisko> {
  const s = await przygotuj();
  s.pro.wartosc = true;
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', n)]);
  return s;
}
const wartosc = async (s: Srodowisko) => (await jeden<{ wartosc: number }>(s.baza, "SELECT wartosc FROM licznik WHERE id = 'l1'")).wartosc;
const cofa = async (s: Srodowisko) => (await s.baza.all<{ cofa: string }>("SELECT cofa FROM zdarzenie WHERE rodzaj = 'cofniecie' ORDER BY czas_ms, rowid")).map((r) => JSON.parse(r.cofa) as string[]);

describe('cofnijOstatnie: kolejne „Undo” (BR-LIC-003)', () => {
  test('trzy +1, dwa „Undo” pod rząd → 1 (nie 3), cofnięcia wskazują zmiany 3 i 2', async () => {
    const s = await zLicznikiem();
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) { const w = await dodajRzad(s.z, { licznikId: 'l1' }); if (w.ok) ids.push(w.wartosc.zdarzenieId); }
    expect(await cofnijOstatnie(s.z, { licznikId: 'l1' })).toMatchObject({ ok: true, wartosc: { wartosc: 2 } });
    expect(await cofnijOstatnie(s.z, { licznikId: 'l1' })).toMatchObject({ ok: true, wartosc: { wartosc: 1 } });
    expect(await wartosc(s)).toBe(1);
    expect(await cofa(s)).toEqual([[ids[2]], [ids[1]]]);
  });
  test('„Undo” do końca: po zdjęciu wszystkich zmian licznik 0, a następne „Undo” nic nie robi (niedozwolone_przejscie)', async () => {
    const s = await zLicznikiem();
    await dodajRzad(s.z, { licznikId: 'l1' });
    await dodajRzad(s.z, { licznikId: 'l1' });
    expect(await cofnijOstatnie(s.z, { licznikId: 'l1' })).toMatchObject({ ok: true, wartosc: { wartosc: 1 } });
    expect(await cofnijOstatnie(s.z, { licznikId: 'l1' })).toMatchObject({ ok: true, wartosc: { wartosc: 0 } });
    expect(await cofnijOstatnie(s.z, { licznikId: 'l1' })).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
    expect(await wartosc(s)).toBe(0);
  });
  test('+1 po cofnięciu i znów „Undo” → cofa nowe +1; następne „Undo” cofa zmianę sprzed pierwszego cofnięcia', async () => {
    const s = await zLicznikiem();
    for (let i = 0; i < 3; i++) await dodajRzad(s.z, { licznikId: 'l1' });
    await cofnijOstatnie(s.z, { licznikId: 'l1' }); // 2
    await dodajRzad(s.z, { licznikId: 'l1' }); // 3 (nowe +1)
    expect(await cofnijOstatnie(s.z, { licznikId: 'l1' })).toMatchObject({ ok: true, wartosc: { wartosc: 2 } });
    expect(await cofnijOstatnie(s.z, { licznikId: 'l1' })).toMatchObject({ ok: true, wartosc: { wartosc: 1 } });
  });
  test('wpisanie wartości też da się cofnąć dwa razy pod rząd: 30 → wpisano 41 → +1 → Undo (41) → Undo (30)', async () => {
    const s = await zLicznikiem(30);
    await wpiszWartosc(s.z, { licznikId: 'l1', wartosc: 41 });
    await dodajRzad(s.z, { licznikId: 'l1' });
    expect(await cofnijOstatnie(s.z, { licznikId: 'l1' })).toMatchObject({ ok: true, wartosc: { wartosc: 41 } });
    expect(await cofnijOstatnie(s.z, { licznikId: 'l1' })).toMatchObject({ ok: true, wartosc: { wartosc: 30 } });
  });
});

describe('historiaLicznika: który wpis ma „Undo”, które są cofnięte (BR-LIC-003 S3)', () => {
  test('po jednym „Undo”: cofnięty wpis jest oznaczony, „Undo” przechodzi na poprzedni niecofnięty', async () => {
    const s = await zLicznikiem();
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) { const w = await dodajRzad(s.z, { licznikId: 'l1' }); if (w.ok) ids.push(w.wartosc.zdarzenieId); }
    await cofnijOstatnie(s.z, { licznikId: 'l1' });
    const h = await historiaLicznika(s.z, { licznikId: 'l1' });
    if (!h.ok) throw new Error(h.powod);
    const wpis = (id: string) => h.wartosc.find((x) => x.id === id);
    expect(wpis(ids[2])).toMatchObject({ cofniety: true, mozeCofnac: false });
    expect(wpis(ids[1])).toMatchObject({ cofniety: false, mozeCofnac: true });
    expect(wpis(ids[0])).toMatchObject({ cofniety: false, mozeCofnac: false });
    expect(h.wartosc.filter((x) => x.mozeCofnac)).toHaveLength(1); // „Undo” tylko przy jednym wpisie (design-spec 021)
  });
});
