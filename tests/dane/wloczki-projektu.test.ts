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

  test('P-333: odznaczenie włóczki z zapisanym zużyciem zwraca motki do zapasu (zużycie 2 z 3 → zapas 3), zmieniono_ms zapasu rośnie; bez zużycia zapas nietknięty', async () => {
    const s = await start();
    await wykonaj(s.baza, [projektWloczka('p1', 'y1'), projektWloczka('p1', 'y2')]);
    expect((await zapiszZuzycie(s.z, { projektId: 'p1', zuzycie: [{ wloczkaId: 'y1', motki: 2 }] })).ok).toBe(true);
    const przed = await s.baza.all<{ motki: number; zmieniono_ms: number }>('SELECT motki, zmieniono_ms FROM wloczka WHERE id IN (?, ?) ORDER BY id', ['y1', 'y2']);
    expect(przed.map((x) => x.motki)).toEqual([1, 2]);
    s.zegar.ustaw(s.zegar.teraz().ms + 60_000);
    expect((await przypiszWloczki(s.z, { projektId: 'p1', wloczkaIds: [] })).ok).toBe(true);
    const po = await s.baza.all<{ motki: number; zmieniono_ms: number }>('SELECT motki, zmieniono_ms FROM wloczka WHERE id IN (?, ?) ORDER BY id', ['y1', 'y2']);
    expect(po.map((x) => x.motki)).toEqual([3, 2]);
    expect(po[0]!.zmieniono_ms).toBeGreaterThan(przed[0]!.zmieniono_ms);
    expect(po[1]!.zmieniono_ms).toBe(przed[1]!.zmieniono_ms); // y2 bez zużycia: zapas i znacznik czasu bez zmian
  });

  test('P-333 (iCloud): odznaczenie trafia do skrzynki zmian jako usunięcie powiązania, a zwrot motków jako zmiana włóczki', async () => {
    const s = await start();
    await wykonaj(s.baza, [projektWloczka('p1', 'y1')]);
    expect((await zapiszZuzycie(s.z, { projektId: 'p1', zuzycie: [{ wloczkaId: 'y1', motki: 2 }] })).ok).toBe(true);
    await wykonaj(s.baza, [['UPDATE synchronizacja SET wlaczona = 1, wejscie = 0 WHERE id = 1', []], ['DELETE FROM zmiana_icloud', []]]);
    expect((await przypiszWloczki(s.z, { projektId: 'p1', wloczkaIds: [] })).ok).toBe(true);
    const zm = await s.baza.all<{ encja: string; usuniete: number }>('SELECT encja, usuniete FROM zmiana_icloud ORDER BY encja');
    expect(zm).toEqual(expect.arrayContaining([{ encja: 'projekt_wloczka', usuniete: 1 }, { encja: 'wloczka', usuniete: 0 }]));
  });

  test('P-334 (przegląd P1): zużycie ponad zapas (zapas 1, zużycie 3 → zapas 0) i odznaczenie zwraca tyle, ile faktycznie odjęto (1), nie 3', async () => {
    const s = await start();
    await wykonaj(s.baza, [wloczka('y9', 'Mała', 1), projektWloczka('p1', 'y9')]);
    expect((await zapiszZuzycie(s.z, { projektId: 'p1', zuzycie: [{ wloczkaId: 'y9', motki: 3 }] })).ok).toBe(true);
    expect((await s.baza.all<{ motki: number }>('SELECT motki FROM wloczka WHERE id = ?', ['y9']))[0]?.motki).toBe(0);
    expect((await przypiszWloczki(s.z, { projektId: 'p1', wloczkaIds: [] })).ok).toBe(true);
    expect((await s.baza.all<{ motki: number }>('SELECT motki FROM wloczka WHERE id = ?', ['y9']))[0]?.motki).toBe(1);
  });

  test('P-334: ponowne potwierdzenie z inną liczbą liczy odjęcie łącznie (2, potem 3 z zapasu 3 → odjęto 3; potem 1 → odjęto 1); zwrot = odjeto_motki', async () => {
    const s = await start();
    await wykonaj(s.baza, [projektWloczka('p1', 'y1')]); // zapas 3
    for (const [zuzycie, zapas, odjeto] of [[2, 1, 2], [3, 0, 3], [1, 2, 1]] as const) {
      expect((await zapiszZuzycie(s.z, { projektId: 'p1', zuzycie: [{ wloczkaId: 'y1', motki: zuzycie }] })).ok).toBe(true);
      expect(await s.baza.all('SELECT w.motki, pw.odjeto_motki FROM wloczka w JOIN projekt_wloczka pw ON pw.wloczka_id = w.id WHERE w.id = ?', ['y1'])).toEqual([{ motki: zapas, odjeto_motki: odjeto }]);
    }
    expect((await przypiszWloczki(s.z, { projektId: 'p1', wloczkaIds: [] })).ok).toBe(true);
    expect((await s.baza.all<{ motki: number }>('SELECT motki FROM wloczka WHERE id = ?', ['y1']))[0]?.motki).toBe(3);
  });

  test('P-334: wiersz bez odjeto_motki (NULL, np. ze starego archiwum) przy odznaczeniu nie zmienia zapasu', async () => {
    const s = await start();
    await wykonaj(s.baza, [projektWloczka('p1', 'y1'), ["UPDATE projekt_wloczka SET zuzyto_motki = 2 WHERE wloczka_id = 'y1'", []]]);
    expect((await przypiszWloczki(s.z, { projektId: 'p1', wloczkaIds: [] })).ok).toBe(true);
    expect((await s.baza.all<{ motki: number }>('SELECT motki FROM wloczka WHERE id = ?', ['y1']))[0]?.motki).toBe(3);
  });

  test('P-334 (przegląd 2): zmniejszenie zużycia zwraca najwyżej tyle, ile odjęto (zapas 1, zużycie 3, potem 0 → zapas 1, nie 3); wariant ułamkowy', async () => {
    const s = await start();
    await wykonaj(s.baza, [wloczka('y8', 'Mała', 1), wloczka('y7', 'Ułamek', 0.5), projektWloczka('p1', 'y8'), projektWloczka('p1', 'y7')]);
    const stan = async (id: string) => (await s.baza.all<{ motki: number; odjeto_motki: number }>('SELECT w.motki, pw.odjeto_motki FROM wloczka w JOIN projekt_wloczka pw ON pw.wloczka_id = w.id WHERE w.id = ?', [id]))[0];
    expect((await zapiszZuzycie(s.z, { projektId: 'p1', zuzycie: [{ wloczkaId: 'y8', motki: 3 }, { wloczkaId: 'y7', motki: 2 }] })).ok).toBe(true);
    expect([await stan('y8'), await stan('y7')]).toEqual([{ motki: 0, odjeto_motki: 1 }, { motki: 0, odjeto_motki: 0.5 }]);
    expect((await zapiszZuzycie(s.z, { projektId: 'p1', zuzycie: [{ wloczkaId: 'y8', motki: 0 }, { wloczkaId: 'y7', motki: 0 }] })).ok).toBe(true);
    expect([await stan('y8'), await stan('y7')]).toEqual([{ motki: 1, odjeto_motki: 0 }, { motki: 0.5, odjeto_motki: 0 }]);
  });
});
