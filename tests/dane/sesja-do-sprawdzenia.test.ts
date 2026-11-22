// P-191 P5a (design-spec „Zapomniany stoper”, P-072 (7a)): licznik projektu pokazuje raz linię o sesji zamkniętej automatycznie po SESJA_MAKS_H.
// Reguła danych: sesja projektu z `do_korekty = 1`, po której końcu nie było jeszcze +1 na licznikach projektu; korekta zdejmuje znacznik.
import { SESJA_MAKS_H } from '../../src/konfiguracja';
import { dodajRzad } from '../../src/przypadki-uzycia/licznik';
import { korygujSesje, sesjaDoSprawdzenia } from '../../src/przypadki-uzycia/sesja';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { GODZ, T0, przygotuj, wykonaj } from './pomocnicze/srodowisko';

async function srodowisko() {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 2), projekt('p2', 'Czapka'), czesc('c2', 'p2', 'Całość'),
    ["INSERT INTO sesja (id, projekt_id, stan, start_ms, koniec_ms, do_korekty, strefa, dzien) VALUES ('s1', 'p1', 'zakonczona', ?, ?, 1, 'Europe/Warsaw', '2026-10-22')",
      [T0 + GODZ, T0 + GODZ + SESJA_MAKS_H * GODZ]]]);
  s.zegar.ustaw(T0 + 30 * GODZ);
  return s;
}

test('sesja zamknięta automatycznie, bez +1 po jej końcu → linia z liczbą godzin; inny projekt → brak', async () => {
  const s = await srodowisko();
  expect(await sesjaDoSprawdzenia(s.z, { projektId: 'p1' })).toEqual({ ok: true, wartosc: { sesjaId: 's1', godziny: SESJA_MAKS_H } });
  expect(await sesjaDoSprawdzenia(s.z, { projektId: 'p2' })).toEqual({ ok: true, wartosc: null });
});

test('następne +1 na liczniku projektu → linia znika (znacznik zostaje w sesji)', async () => {
  const s = await srodowisko();
  expect((await dodajRzad(s.z, { licznikId: 'l1' })).ok).toBe(true);
  expect(await sesjaDoSprawdzenia(s.z, { projektId: 'p1' })).toEqual({ ok: true, wartosc: null });
  expect(await s.baza.all("SELECT do_korekty FROM sesja WHERE id = 's1'")).toEqual([{ do_korekty: 1 }]);
});

test('korekta sesji zdejmuje znacznik → brak linii', async () => {
  const s = await srodowisko();
  expect((await korygujSesje(s.z, { sesjaId: 's1', startMs: T0 + GODZ, koniecMs: T0 + 3 * GODZ })).ok).toBe(true);
  expect(await sesjaDoSprawdzenia(s.z, { projektId: 'p1' })).toEqual({ ok: true, wartosc: null });
});
