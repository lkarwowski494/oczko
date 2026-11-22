// Model odczytu ekranu projektu (A1 partii 5; F-18 BR-PRJ-005, F-46 BR-LIC-018, F-52 BR-PRJ-014, F-60 RD-14, F-61 RD-15, F-17 RD-11, F-15).
import { widokProjektu, type WidokProjektu } from '../../src/przypadki-uzycia/widok-projektu';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { DOBA, T0, przygotuj, wykonaj } from './pomocnicze/srodowisko';

async function widok(s: Awaited<ReturnType<typeof przygotuj>>, id = 'p1'): Promise<WidokProjektu> {
  const w = await widokProjektu(s.z, { projektId: id });
  if (!w.ok) throw new Error(`widokProjektu: ${w.powod}`);
  return w.wartosc;
}

describe('widokProjektu', () => {
  test('BR-PRJ-005: części w kolejności z licznikami, notatka, drut z US, ostatnia zmiana; usunięte części i liczniki pominięte', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [
      projekt('p1', 'Sweter', T0, { notatka: 'Ściągacz 2×2' }),
      ["UPDATE projekt SET drut_mm = 4 WHERE id = 'p1'", []],
      czesc('c2', 'p1', 'Rękaw', 2), czesc('c1', 'p1', 'Tył', 1, { cel: 96 }), czesc('c3', 'p1', 'Kaptur', 3, { usunieto: T0 }),
      ...licznik('l1', 'c1', 40), ...licznik('l2', 'c2', 10), ...licznik('l3', 'c2', 7, { rodzaj: 'oczka', kolejnosc: 2 }), ...licznik('l4', 'c2', 3, { kolejnosc: 3, usunieto: T0 }),
    ]);
    const w = await widok(s);
    expect([w.nazwa, w.notatka, w.drutMm, w.drutUS, w.stan]).toEqual(['Sweter', 'Ściągacz 2×2', 4, '6', 'w_toku']);
    expect(w.czesci.map((c) => [c.nazwa, c.rzedy, c.cel, c.liczniki.map((l) => [l.id, l.rodzaj, l.wartosc])])).toEqual([
      ['Tył', 40, 96, [['l1', 'rzedy', 40]]],
      ['Rękaw', 10, null, [['l2', 'rzedy', 10], ['l3', 'oczka', 7]]],
    ]);
  });

  test('RD-11-W3: drut 3 mm bez odpowiednika US → drutUS null; bez drutu → oba null', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'A'), ["UPDATE projekt SET drut_mm = 3 WHERE id = 'p1'", []], projekt('p2', 'B')]);
    expect([(await widok(s)).drutMm, (await widok(s)).drutUS]).toEqual([3, null]);
    expect([(await widok(s, 'p2')).drutMm, (await widok(s, 'p2')).drutUS]).toEqual([null, null]);
  });

  test('RD-19-W3 (BR-PRJ-004/S3, P-184): szydełko 6,5 mm → US K-10 ½; domyślnie druty', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Torba'), ["UPDATE projekt SET drut_mm = 6.5, narzedzie = 'szydelko' WHERE id = 'p1'", []], projekt('p2', 'B')]);
    expect([(await widok(s)).narzedzie, (await widok(s)).drutUS]).toEqual(['szydelko', 'K-10 ½']);
    expect((await widok(s, 'p2')).narzedzie).toBe('druty');
  });

  test('RD-14: postęp z części z celem (⌊100 × 70 / 136⌋ = 51); bez celów → brak-celow (RD-14-W6)', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'A'), czesc('c1', 'p1', 'Tył', 1, { cel: 96 }), czesc('c2', 'p1', 'Pas', 2, { cel: 40 }), czesc('c3', 'p1', 'Bez celu', 3),
      ...licznik('l1', 'c1', 60), ...licznik('l2', 'c2', 10), ...licznik('l3', 'c3', 5), projekt('p2', 'B'), czesc('d1', 'p2', 'X'), ...licznik('m1', 'd1', 3)]);
    expect((await widok(s)).postep).toEqual({ rodzaj: 'procent', wartosc: 51 });
    expect((await widok(s, 'p2')).postep).toEqual({ rodzaj: 'brak-celow' });
  });

  test('BR-PRJ-014: część pary bez własnego celu ma cel = rzędy pierwszej (S1); pierwsza bez rzędów → brak celu (S3); własny cel wygrywa', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Skarpety'), czesc('c1', 'p1', 'Pierwsza'), czesc('c2', 'p1', 'Druga', 2, { paraZ: 'c1' }),
      ...licznik('l1', 'c1', 96), ...licznik('l2', 'c2', 12), projekt('p2', 'Rękawy'), czesc('d1', 'p2', 'Lewy'), czesc('d2', 'p2', 'Prawy', 2, { paraZ: 'd1' }),
      ...licznik('m2', 'd2', 0), czesc('d3', 'p2', 'Trzeci', 3, { paraZ: 'd1', cel: 50 })]);
    const druga = (await widok(s)).czesci.find((c) => c.id === 'c2');
    expect([druga?.cel, druga?.celZPary, druga?.paraZ]).toEqual([96, true, 'c1']);
    const p2 = (await widok(s, 'p2')).czesci;
    expect(p2.map((c) => [c.id, c.cel, c.celZPary])).toEqual([['d1', null, false], ['d2', null, false], ['d3', 50, false]]);
  });

  test('BR-LIC-018 (F-46, P-199 Q1a): ≥ 2 liczniki rzędów części → całość = ich suma, bez ustawienia; jeden licznik albo licznik w koszu → null', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Koc'), czesc('c1', 'p1', 'Kwadrat'), ...licznik('l1', 'c1', 12), ...licznik('l2', 'c1', 8, { kolejnosc: 2 }),
      ...licznik('o1', 'c1', 30, { kolejnosc: 3, rodzaj: 'oczka' }), czesc('c2', 'p1', 'Brzeg', 2), ...licznik('l3', 'c2', 4),
      czesc('c3', 'p1', 'Rog', 3), ...licznik('l4', 'c3', 5), ...licznik('l5', 'c3', 6, { kolejnosc: 2 }), ["UPDATE licznik SET usunieto_ms = 1 WHERE id = 'l5'", []]]);
    expect((await widok(s)).czesci.map((c) => [c.id, c.calosc])).toEqual([['c1', 20], ['c2', null], ['c3', null]]);
  });

  test('RD-15: termin z celem na dziś; bez terminu celDnia null', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'A'), czesc('c1', 'p1', 'Tył', 1, { cel: 100 }), ...licznik('l1', 'c1', 0)]);
    expect((await widok(s)).celDnia).toBeNull();
    await wykonaj(s.baza, [["UPDATE projekt SET termin_dzien = '2026-10-31' WHERE id = 'p1'", []]]); // dziś 2026-10-22: d = 10, 100 rzędów → 10 dziennie
    expect((await widok(s)).celDnia).toEqual({ rodzaj: 'cel', rzedy: 10 });
    expect((await widok(s)).terminDzien).toBe('2026-10-31');
  });

  test('projekt w koszu albo nieistniejący → bledne_dane; ukończony widać ze stanem', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'A', T0, { usunieto: T0 }), projekt('p2', 'B', T0, { stan: 'ukonczony', ukonczono: T0 + DOBA })]);
    expect(await widokProjektu(s.z, { projektId: 'p1' })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await widokProjektu(s.z, { projektId: 'brak' })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect((await widok(s, 'p2')).stan).toBe('ukonczony');
  });
});

import { podgladTerminu } from '../../src/przypadki-uzycia/widok-projektu';
describe('podgladTerminu (arkusz „Done by”, RD-15)', () => {
  test('cel na dziś dla wybranej daty bez zapisu; bez celów części → null', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'A'), czesc('c1', 'p1', 'Tył', 1, { cel: 100 }), ...licznik('l1', 'c1', 0), projekt('p2', 'B'), czesc('d1', 'p2', 'X'), ...licznik('m1', 'd1', 0)]);
    expect(await podgladTerminu(s.z, { projektId: 'p1', terminDzien: '2026-10-31' })).toEqual({ ok: true, wartosc: { rodzaj: 'cel', rzedy: 10 } });
    expect(await podgladTerminu(s.z, { projektId: 'p2', terminDzien: '2026-10-31' })).toEqual({ ok: true, wartosc: null });
    expect((await widokProjektu(s.z, { projektId: 'p1' })).ok && (await widokProjektu(s.z, { projektId: 'p1' }))).toMatchObject({ wartosc: { terminDzien: null } });
    expect(await podgladTerminu(s.z, { projektId: 'p1', terminDzien: '31.10' })).toEqual({ ok: false, powod: 'bledne_dane' });
  });
});
test('widokProjektu: ukonczonoDzien ukończonego projektu (F-51), w toku null', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'A', T0, { stan: 'ukonczony', ukonczono: T0 }), projekt('p2', 'B')]);
  const a = await widokProjektu(s.z, { projektId: 'p1' }), b = await widokProjektu(s.z, { projektId: 'p2' });
  expect([a.ok && a.wartosc.ukonczonoDzien, b.ok && b.wartosc.ukonczonoDzien]).toEqual(['2026-10-22', null]);
});
