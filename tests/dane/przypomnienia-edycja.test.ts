// 07-jakosc-011 (F-06, BR-LIC-009, P-330 wariant A): przypomnienie da się zmienić i usunąć; licznik i historia zostają. Prawdziwa baza (node:sqlite).
import { dodajRzad } from '../../src/przypadki-uzycia/licznik';
import { dodajPrzypomnienie, usunPrzypomnienie, zmienPrzypomnienie } from '../../src/przypadki-uzycia/czesc';
import { widokLicznika } from '../../src/przypadki-uzycia/widok-licznika';
import { czesc, licznik, projekt, przypomnienie } from './pomocnicze/dane-wejsciowe';
import { MIN, T0, ile, przygotuj, wykonaj } from './pomocnicze/srodowisko';

async function start() {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 5), przypomnienie('pr1', 'l1')]);
  s.zegar.ustaw(T0 + 10 * MIN);
  return s;
}
const plany = async (s: Awaited<ReturnType<typeof start>>) => {
  const w = await widokLicznika(s.z, { licznikId: 'l1' });
  if (!w.ok) throw new Error(w.powod);
  return w.wartosc.plany;
};

describe('widok licznika: plany przypomnień mają identyfikator do edycji', () => {
  test('plan niesie id wiersza', async () => {
    const s = await start();
    expect((await plany(s)).map((p) => p.id)).toEqual(['pr1']);
  });
});

describe('zmienPrzypomnienie (F-06)', () => {
  test('zmienia rząd startu, krok, liczbę razy i treść; wiersz ten sam, licznik i historia bez zmian', async () => {
    const s = await start();
    const zdarzenPrzed = await ile(s.baza, 'zdarzenie');
    const r = await zmienPrzypomnienie(s.z, { id: 'pr1', od: 4, co: 2, razy: 3, tekst: ' decrease at both ends ' });
    expect(r.ok).toBe(true);
    expect(await plany(s)).toEqual([{ id: 'pr1', od: 4, co: 2, razy: 3, tekst: 'decrease at both ends' }]);
    expect(await ile(s.baza, 'przypomnienie')).toBe(1);
    expect(await ile(s.baza, 'zdarzenie')).toBe(zdarzenPrzed);
  });
  test('błędny plan (co 0) albo nieznane id → bledne_dane, nic się nie zmienia', async () => {
    const s = await start();
    const przed = await plany(s);
    expect(await zmienPrzypomnienie(s.z, { id: 'pr1', od: 6, co: 0, razy: 5, tekst: 'x' })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await zmienPrzypomnienie(s.z, { id: 'brak', od: 6, co: 6, razy: 5, tekst: 'x' })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await plany(s)).toEqual(przed);
  });
});

describe('usunPrzypomnienie (F-06)', () => {
  test('usuwa przypomnienie; pas znika, licznik i historia zostają', async () => {
    const s = await start();
    expect((await widokLicznika(s.z, { licznikId: 'l1' }))).toMatchObject({ ok: true, wartosc: { przypomnienie: { tekst: 'ujmowanie' } } });
    const zdarzenPrzed = await ile(s.baza, 'zdarzenie');
    expect((await usunPrzypomnienie(s.z, { id: 'pr1' })).ok).toBe(true);
    const w = await widokLicznika(s.z, { licznikId: 'l1' });
    expect(w).toMatchObject({ ok: true, wartosc: { przypomnienie: null, plany: [], wartosc: 5 } });
    expect(await ile(s.baza, 'zdarzenie')).toBe(zdarzenPrzed);
  });
  test('nieznane id → bledne_dane; inne przypomnienia nietknięte', async () => {
    const s = await start();
    const d = await dodajPrzypomnienie(s.z, { licznikId: 'l1', od: 2, co: 2, razy: 2, tekst: 'drugie' });
    expect(d.ok).toBe(true);
    expect(await usunPrzypomnienie(s.z, { id: 'brak' })).toEqual({ ok: false, powod: 'bledne_dane' });
    expect(await ile(s.baza, 'przypomnienie')).toBe(2);
    await dodajRzad(s.z, { licznikId: 'l1' });
  });
});
