// P-191 P3a: „Stop and start here” — sesja otwarta w innym projekcie kończy się i nowa zaczyna w jednej transakcji (indeks sesja_jedna_otwarta).
import { otwartaSesja, przelaczSesje, startSesji, wstrzymajSesje } from '../../src/przypadki-uzycia/sesja';
import { projekt } from './pomocnicze/dane-wejsciowe';
import { MIN, T0, przygotuj, wykonaj } from './pomocnicze/srodowisko';

test('wstrzymana sesja w A → przełączenie: A zakończona (przerwa do końca), B trwa od teraz, ostatnia praca A = koniec', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('pa', 'A', T0 - 60 * MIN), projekt('pb', 'B', T0 - 60 * MIN)]);
  s.zegar.ustaw(T0);
  const a = await startSesji(s.z, { projektId: 'pa' });
  s.zegar.ustaw(T0 + 10 * MIN);
  if (a.ok) await wstrzymajSesje(s.z, { sesjaId: a.wartosc.sesjaId });
  s.zegar.ustaw(T0 + 20 * MIN);
  expect(await startSesji(s.z, { projektId: 'pb' })).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
  const b = await przelaczSesje(s.z, { projektId: 'pb' });
  expect(b.ok).toBe(true);
  const o = await otwartaSesja(s.z);
  expect(o.ok && o.wartosc && [o.wartosc.projektId, o.wartosc.stan, o.wartosc.startMs]).toEqual(['pb', 'trwa', T0 + 20 * MIN]);
  expect(await s.baza.all('SELECT stan, koniec_ms, przerwy_ms FROM sesja WHERE projekt_id = ?', ['pa'])).toEqual([{ stan: 'zakonczona', koniec_ms: T0 + 20 * MIN, przerwy_ms: 10 * MIN }]);
  expect(await s.baza.all("SELECT ostatnia_praca_ms AS o FROM projekt WHERE id = 'pa'")).toEqual([{ o: T0 + 20 * MIN }]);
});

test('projekt w koszu → niedozwolone_przejscie, sesja A zostaje otwarta (wycofanie całości)', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('pa', 'A'), projekt('pb', 'B', T0, { usunieto: T0 })]);
  await startSesji(s.z, { projektId: 'pa' });
  expect(await przelaczSesje(s.z, { projektId: 'pb' })).toEqual({ ok: false, powod: 'niedozwolone_przejscie' });
  const o = await otwartaSesja(s.z);
  expect(o.ok && o.wartosc?.projektId).toBe('pa');
});
