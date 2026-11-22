// Karta ukończenia: włóczka projektu z zapasem i poprzednim zużyciem (F-37, BR-ZAP-002, U-9, P-126 (2a)); zapis „Done” przez potwierdzZuzycie.
import { kartaUkonczenia } from '../../src/przypadki-uzycia/widok-ukonczenia';
import { zapiszZuzycie } from '../../src/przypadki-uzycia/zapas';
import { projekt, projektWloczka, wloczka } from './pomocnicze/dane-wejsciowe';
import { przygotuj, wykonaj } from './pomocnicze/srodowisko';

const karta = async (s: Awaited<ReturnType<typeof przygotuj>>) => {
  const w = await kartaUkonczenia(s.z, { projektId: 'p1' });
  if (!w.ok) throw new Error(w.powod);
  return w.wartosc.wloczka;
};

describe('karta ukończenia: zapas', () => {
  // Zmiana 08 (partia 5, sesja 3): było „usunięta pominięta” (F-37, przed P-209). Kontrakt P-209 (dane.md „Usuwanie włóczki i narzędzia przez
  // kosz”): karta ukończenia i historia projektu pokazują nazwę i zużycie włóczki usuniętej (bez filtra usunieto_ms) — ochrona historii.
  test('każda włóczka projektu ma zapas (motki) i poprzednie zużycie (null = nie potwierdzano); usunięta też (P-209)', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), wloczka('y1', 'Merino', 3), wloczka('y2', 'Alpaka', 2), wloczka('y3', 'Stara', 1),
      projektWloczka('p1', 'y1'), projektWloczka('p1', 'y2'), projektWloczka('p1', 'y3'),
      ["UPDATE projekt_wloczka SET zuzyto_motki = 1.5 WHERE wloczka_id = 'y2'", []], ["UPDATE wloczka SET usunieto_ms = 1 WHERE id = 'y3'", []]]);
    expect(await karta(s)).toEqual([
      { id: 'y2', nazwa: 'Alpaka', motki: 2, zuzyto: 1.5 },
      { id: 'y1', nazwa: 'Merino', motki: 3, zuzyto: null },
      { id: 'y3', nazwa: 'Stara', motki: 1, zuzyto: null },
    ]);
  });

  test('zapiszZuzycie: ponad zapas przyjęte, zapas 0; ponowny zapis tej samej liczby nic nie odejmuje; liczności bez zmian', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), wloczka('y1', 'Merino', 2), projektWloczka('p1', 'y1')]);
    expect(await zapiszZuzycie(s.z, { projektId: 'p1', zuzycie: [{ wloczkaId: 'y1', motki: 2.5 }] })).toEqual({ ok: true, wartosc: undefined });
    expect(await karta(s)).toEqual([{ id: 'y1', nazwa: 'Merino', motki: 0, zuzyto: 2.5 }]);
    await zapiszZuzycie(s.z, { projektId: 'p1', zuzycie: [{ wloczkaId: 'y1', motki: 2.5 }] });
    expect(await karta(s)).toEqual([{ id: 'y1', nazwa: 'Merino', motki: 0, zuzyto: 2.5 }]);
    expect(await s.baza.all('SELECT count(*) AS n FROM projekt_wloczka')).toEqual([{ n: 1 }]);
  });

  test('zapiszZuzycie: zła liczba (ujemna, NaN) → bledne_dane, nic nie zapisane', async () => {
    const s = await przygotuj();
    await wykonaj(s.baza, [projekt('p1', 'Sweter'), wloczka('y1', 'Merino', 2), projektWloczka('p1', 'y1')]);
    for (const m of [-1, Number.NaN]) expect(await zapiszZuzycie(s.z, { projektId: 'p1', zuzycie: [{ wloczkaId: 'y1', motki: m }] })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await karta(s)).toEqual([{ id: 'y1', nazwa: 'Merino', motki: 2, zuzyto: null }]);
  });
});
