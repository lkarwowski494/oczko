// 07-jakosc-001 (F-37, BR-ZAP-002, P-330 1B): przypisanie włóczek do projektu — zbiór wierszy `projekt_wloczka` (zapas nietknięty, zużycie zapisuje dopiero karta).
// Prawdziwy SQLite (node:sqlite); ścieżka kończy się kartą ukończenia i zapisem zużycia, czyli tym, czego brakowało (grupa zużycia nigdy się nie pojawiała).
import { przypiszWloczki, wyborWloczek, zapiszZuzycie } from '../../src/przypadki-uzycia/zapas';
import { kartaUkonczenia } from '../../src/przypadki-uzycia/widok-ukonczenia';
import { projekt, projektWloczka, wloczka } from './pomocnicze/dane-wejsciowe';
import { ile, przygotuj, wykonaj } from './pomocnicze/srodowisko';

const start = async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), projekt('p2', 'Szal'), wloczka('y1', 'Merino', 3), wloczka('y2', 'Alpaka', 2), wloczka('y3', 'Stara', 1), ["UPDATE wloczka SET usunieto_ms = 1 WHERE id = 'y3'", []]]);
  return s;
};
const przypisane = async (s: Awaited<ReturnType<typeof start>>, p = 'p1') => (await s.baza.all<{ wloczka_id: string; zuzyto_motki: number | null }>('SELECT wloczka_id, zuzyto_motki FROM projekt_wloczka WHERE projekt_id = ? ORDER BY wloczka_id', [p]));

describe('wyborWloczek: zapas do wyboru i zaznaczenia', () => {
  test('zapas bez usuniętych po nazwie; wybrane = przypisane do tego projektu (inny projekt nie wpływa)', async () => {
    const s = await start();
    await wykonaj(s.baza, [projektWloczka('p1', 'y2'), projektWloczka('p2', 'y1')]);
    const w = await wyborWloczek(s.z, { projektId: 'p1' });
    expect(w).toEqual({ ok: true, wartosc: { zapas: [{ id: 'y2', nazwa: 'Alpaka', motki: 2 }, { id: 'y1', nazwa: 'Merino', motki: 3 }], wybrane: ['y2'] } });
  });
});

describe('przypiszWloczki: zbiór wierszy projekt_wloczka', () => {
  test('dodaje zaznaczone (zużycie brak = NULL), zapas bez zmian; ponowny zapis tego samego zbioru niczego nie zmienia', async () => {
    const s = await start();
    expect((await przypiszWloczki(s.z, { projektId: 'p1', wloczkaIds: ['y1', 'y2'] })).ok).toBe(true);
    expect(await przypisane(s)).toEqual([{ wloczka_id: 'y1', zuzyto_motki: null }, { wloczka_id: 'y2', zuzyto_motki: null }]);
    expect((await s.baza.all<{ motki: number }>('SELECT motki FROM wloczka WHERE id IN (?, ?) ORDER BY id', ['y1', 'y2'])).map((x) => x.motki)).toEqual([3, 2]);
    expect((await przypiszWloczki(s.z, { projektId: 'p1', wloczkaIds: ['y2', 'y1'] })).ok).toBe(true);
    expect(await ile(s.baza, 'projekt_wloczka')).toBe(2);
  });

  test('odznaczona włóczka znika z projektu, zostająca zachowuje zapisane zużycie; wiersze innych projektów nietknięte', async () => {
    const s = await start();
    await wykonaj(s.baza, [projektWloczka('p1', 'y1'), projektWloczka('p1', 'y2'), projektWloczka('p2', 'y1'), ["UPDATE projekt_wloczka SET zuzyto_motki = 1.5 WHERE projekt_id = 'p1' AND wloczka_id = 'y2'", []]]);
    expect((await przypiszWloczki(s.z, { projektId: 'p1', wloczkaIds: ['y2'] })).ok).toBe(true);
    expect(await przypisane(s)).toEqual([{ wloczka_id: 'y2', zuzyto_motki: 1.5 }]);
    expect(await przypisane(s, 'p2')).toEqual([{ wloczka_id: 'y1', zuzyto_motki: null }]);
    expect((await przypiszWloczki(s.z, { projektId: 'p1', wloczkaIds: [] })).ok).toBe(true);
    expect(await przypisane(s)).toEqual([]);
  });

  test('nieznana albo usunięta włóczka → bledne_dane i nic się nie zmienia (jedna transakcja)', async () => {
    const s = await start();
    await wykonaj(s.baza, [projektWloczka('p1', 'y1')]);
    expect(await przypiszWloczki(s.z, { projektId: 'p1', wloczkaIds: ['y2', 'brak'] })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await przypiszWloczki(s.z, { projektId: 'p1', wloczkaIds: ['y2', 'y3'] })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await przypisane(s)).toEqual([{ wloczka_id: 'y1', zuzyto_motki: null }]);
  });

  test('projekt w koszu albo nieistniejący → bledne_dane', async () => {
    const s = await start();
    expect(await przypiszWloczki(s.z, { projektId: 'nie-ma', wloczkaIds: ['y1'] })).toEqual({ ok: false, powod: 'bledne_dane' });
  });

  test('BR-ZAP-002 od końca do końca: przypisanie → karta ukończenia pokazuje włóczkę → zapis zużycia zmniejsza zapas', async () => {
    const s = await start();
    expect((await przypiszWloczki(s.z, { projektId: 'p1', wloczkaIds: ['y1'] })).ok).toBe(true);
    const k = await kartaUkonczenia(s.z, { projektId: 'p1' });
    expect(k.ok && k.wartosc.wloczka).toEqual([{ id: 'y1', nazwa: 'Merino', motki: 3, zuzyto: null }]);
    expect((await zapiszZuzycie(s.z, { projektId: 'p1', zuzycie: [{ wloczkaId: 'y1', motki: 2 }] })).ok).toBe(true);
    expect((await s.baza.all<{ motki: number }>('SELECT motki FROM wloczka WHERE id = ?', ['y1']))[0]?.motki).toBe(1);
  });
});
