// Luki pokrycia E3 (rola 07): zapas — zużycie z projektu odjęte z zapasu (BR-ZAP-002/S1, U-9) i filtr grubości (BR-ZAP-004/S1, RD-10 kategorie).
// Poziom dane-node:sqlite. Wyrocznia: scenariusze docs/brd/wymagania-narzedzia.md:24 (5 − 3 = 2 motki) i :42 (tylko kategoria 4).
// Schemat v1 nie ma kolumny kategorii w `wloczka`: test zapisuje przez repozytorium, nie SQL ([DO USTALENIA] 05, raport luk E3).
import { dodajWloczke, potwierdzZuzycie, zapas } from '../../../src/dane/repozytoria/zapas';
import { zakonczProjekt } from '../../../src/przypadki-uzycia/projekt';
import { czesc, projekt, projektWloczka, wloczka } from '../pomocnicze/dane-wejsciowe';
import { T0, jeden, przygotuj, wykonaj } from '../pomocnicze/srodowisko';

describe('BR-ZAP-002 zużycie z projektu odjęte z zapasu', () => {
  test('BR-ZAP-002/S1 zapas 5 motków, projekt zużył 3 → po zakończeniu i potwierdzeniu zapas 2, zużycie zapisane przy projekcie', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), wloczka('y1', 'Merino', 5), wloczka('y2', 'Alpaka', 4), projektWloczka('p1', 'y1')]);
    expect(await zakonczProjekt(s.z, { projektId: 'p1' })).toEqual({ ok: true, wartosc: undefined });
    expect(await potwierdzZuzycie(s.baza, { projektId: 'p1', zuzycie: [{ wloczkaId: 'y1', motki: 3 }], terazMs: T0 })).toEqual({ ok: true, wartosc: undefined });
    const z = (await zapas(s.baza)).map((w) => ({ id: w.id, motki: w.motki })).sort((a, b) => a.id.localeCompare(b.id));
    expect(z).toEqual([{ id: 'y1', motki: 2 }, { id: 'y2', motki: 4 }]);
    expect(await jeden(s.baza, "SELECT zuzyto_motki FROM projekt_wloczka WHERE projekt_id = 'p1' AND wloczka_id = 'y1'")).toEqual({ zuzyto_motki: 3 });
  });
});

describe('BR-ZAP-004 wyszukiwanie w zapasie', () => {
  test('BR-ZAP-004/S1 włóczki kategorii 3 i 4, filtr 4 → tylko kategoria 4 (zbiór id; bez filtra wszystkie 3)', async () => {
    const s = await przygotuj();
    for (const [id, kategoria] of [['y3', 3], ['y4a', 4], ['y4b', 4]] as const) {
      expect(await dodajWloczke(s.baza, { id, nazwa: `Włóczka ${id}`, motki: 1, kategoria, terazMs: T0 })).toEqual({ ok: true, wartosc: undefined });
    }
    const filtr = await zapas(s.baza, { kategoria: 4 });
    expect(filtr.map((w) => w.id).sort()).toEqual(['y4a', 'y4b']);
    expect(filtr.every((w) => w.kategoria === 4)).toBe(true);
    expect((await zapas(s.baza)).map((w) => w.id).sort()).toEqual(['y3', 'y4a', 'y4b']);
  });
});
