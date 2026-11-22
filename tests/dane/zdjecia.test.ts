// Zdjęcia projektu i etykiety włóczki (F-16, BR-PRJ-003; P-191 P9a: grupa „Photos”, zdjęcie etykiety w formularzu włóczki, usuwanie bez kosza).
// Plik do magazynu przed wierszem (ADR-0001, PLIKI_OCHRONA_MIN); wiersz `plik` bez odwołań usuwany w transakcji, plik przy starcie (05-architekt-513).
import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dodajZdjecie, usunZdjecie, zdjecia } from '../../src/przypadki-uzycia/zdjecia';
import { projekt, wloczka } from './pomocnicze/dane-wejsciowe';
import { ile, przygotuj, sha256Pliku, sierotyPrzyStarcie, wykonaj } from './pomocnicze/srodowisko';

const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 0xff, 0xd9]);
const zrodlo = (katalog: string, nazwa = 'a.jpg', tresc = JPG) => { const p = join(katalog, nazwa); writeFileSync(p, tresc); return p; };

describe('zdjęcia', () => {
  test('BR-PRJ-003: zdjęcie etykiety w projekcie — plik w magazynie (bez sieci), wiersz zdjecie i plik; lista od najnowszego', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Sweter')]);
    const a = await dodajZdjecie(s.z, { cel: { projektId: 'p1' }, plik: { sciezka: zrodlo(s.katalog), rozszerzenie: 'jpg' } });
    s.zegar.przesun(1000);
    const b = await dodajZdjecie(s.z, { cel: { projektId: 'p1' }, plik: { sciezka: zrodlo(s.katalog, 'b.jpg', Buffer.concat([JPG, JPG])), rozszerzenie: 'jpg' } });
    expect(a.ok && b.ok).toBe(true);
    const lista = await zdjecia(s.z, { projektId: 'p1' });
    expect(lista.ok && lista.wartosc.map((z) => z.id)).toEqual([b.ok && b.wartosc.zdjecieId, a.ok && a.wartosc.zdjecieId]);
    expect(lista.ok && lista.wartosc[1]?.sha256).toBe(sha256Pliku(zrodlo(s.katalog)));
    expect(await ile(s.baza, 'plik')).toBe(2);
    expect(readdirSync(s.magazyn.katalog)).toHaveLength(2);
  });

  test('zdjęcie etykiety przy włóczce (formularz włóczki); to samo zdjęcie w projekcie i przy włóczce = jeden plik', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), wloczka('y1', 'Merino')]);
    await dodajZdjecie(s.z, { cel: { wloczkaId: 'y1' }, plik: { sciezka: zrodlo(s.katalog), rozszerzenie: 'jpg' } });
    await dodajZdjecie(s.z, { cel: { projektId: 'p1' }, plik: { sciezka: zrodlo(s.katalog), rozszerzenie: 'jpg' } });
    expect(await ile(s.baza, 'zdjecie')).toBe(2);
    expect(await ile(s.baza, 'plik')).toBe(1);
    const w = await zdjecia(s.z, { wloczkaId: 'y1' });
    expect(w.ok && w.wartosc).toHaveLength(1);
  });

  test('usunięcie (P9a, bez kosza): wiersz znika; plik zostaje, gdy odwołuje się do niego inne zdjęcie; ostatnie odwołanie → wiersz `plik` usunięty, plik przy starcie (05-architekt-513)', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), wloczka('y1', 'Merino')]);
    const a = await dodajZdjecie(s.z, { cel: { wloczkaId: 'y1' }, plik: { sciezka: zrodlo(s.katalog), rozszerzenie: 'jpg' } });
    const b = await dodajZdjecie(s.z, { cel: { projektId: 'p1' }, plik: { sciezka: zrodlo(s.katalog), rozszerzenie: 'jpg' } });
    if (!a.ok || !b.ok) throw new Error('dodajZdjecie');
    expect(await usunZdjecie(s.z, { zdjecieId: b.wartosc.zdjecieId })).toEqual({ ok: true, wartosc: undefined });
    expect([await ile(s.baza, 'zdjecie'), await ile(s.baza, 'plik'), s.magazyn.usuniete.length]).toEqual([1, 1, 0]);
    await usunZdjecie(s.z, { zdjecieId: a.wartosc.zdjecieId });
    expect([await ile(s.baza, 'zdjecie'), await ile(s.baza, 'plik'), s.magazyn.usuniete.length]).toEqual([0, 0, 0]); // plik — krok startu (ADR-0001, 05-architekt-513)
    await sierotyPrzyStarcie(s);
    expect(s.magazyn.usuniete.length).toBe(1);
    expect(readdirSync(s.magazyn.katalog)).toEqual([]);
  });

  test('projekt usunięty albo nieistniejący → bez wiersza; złe rozszerzenie → bledne_dane bez zapisu do magazynu', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), ["UPDATE projekt SET usunieto_ms = 1 WHERE id = 'p1'", []]]);
    expect(await dodajZdjecie(s.z, { cel: { projektId: 'p1' }, plik: { sciezka: zrodlo(s.katalog), rozszerzenie: 'jpg' } })).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
    expect(await dodajZdjecie(s.z, { cel: { projektId: 'p9' }, plik: { sciezka: zrodlo(s.katalog), rozszerzenie: 'jpg' } })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await dodajZdjecie(s.z, { cel: { projektId: 'p1' }, plik: { sciezka: zrodlo(s.katalog), rozszerzenie: 'exe' } })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await ile(s.baza, 'zdjecie')).toBe(0);
    expect(await usunZdjecie(s.z, { zdjecieId: 'brak' })).toEqual({ ok: false, powod: 'bledne_dane' });
  });
});
