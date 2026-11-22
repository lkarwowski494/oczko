// Łatka L2 (05 fix-7 NZ-P217-05, P-221 Q6a): każde przejście sesji stopera zapisuje `zmieniono_ms` = teraz, a import „scal” i iCloud
// scalają sesję jak inne encje (nowsza `zmieniono_ms` wygrywa) — korekta sesji z drugiego urządzenia nie ginie (BR-PRJ-013).
import { join } from 'node:path';
import { scalZKopia } from '../../src/dane/baza/przeniesienie';
import { migruj } from '../../src/dane/migracje/migruj';
import { uruchomDane } from '../../src/przypadki-uzycia/start';
import { korygujSesje, przelaczSesje, startSesji, wstrzymajSesje, wznowSesje, zakonczSesje } from '../../src/przypadki-uzycia/sesja';
import { SESJA_MAKS_H } from '../../src/konfiguracja';
import { projekt } from './pomocnicze/dane-wejsciowe';
import { GODZ, MIN, przygotuj, wykonaj } from './pomocnicze/srodowisko';

const zmieniono = async (s: Awaited<ReturnType<typeof przygotuj>>, id: string) =>
  (await s.baza.all<{ zmieniono_ms: number }>('SELECT zmieniono_ms FROM sesja WHERE id = ?', [id]))[0]?.zmieniono_ms;

test('L2: start, pauza, wznowienie, koniec, korekta i przełączenie zapisują zmieniono_ms = teraz', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), projekt('p2', 'Czapka')]);
  const st = await startSesji(s.z, { projektId: 'p1' });
  if (!st.ok) throw new Error(st.powod);
  const id = st.wartosc.sesjaId;
  expect(await zmieniono(s, id)).toBe(s.zegar.teraz().ms);
  for (const krok of [() => wstrzymajSesje(s.z, { sesjaId: id }), () => wznowSesje(s.z, { sesjaId: id }), () => zakonczSesje(s.z, { sesjaId: id })]) {
    s.zegar.przesun(MIN);
    expect((await krok()).ok).toBe(true);
    expect(await zmieniono(s, id)).toBe(s.zegar.teraz().ms);
  }
  s.zegar.przesun(MIN);
  const t = s.zegar.teraz().ms;
  expect((await korygujSesje(s.z, { sesjaId: id, startMs: t - GODZ, koniecMs: t - MIN })).ok).toBe(true);
  expect(await zmieniono(s, id)).toBe(t);
  const druga = await startSesji(s.z, { projektId: 'p1' });
  if (!druga.ok) throw new Error(druga.powod);
  s.zegar.przesun(MIN);
  expect((await przelaczSesje(s.z, { projektId: 'p2' })).ok).toBe(true);
  expect(await zmieniono(s, druga.wartosc.sesjaId)).toBe(s.zegar.teraz().ms);
});

test('L2: zapomniany stoper zamknięty przy starcie ma zmieniono_ms = chwila startu', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter')]);
  const st = await startSesji(s.z, { projektId: 'p1' });
  if (!st.ok) throw new Error(st.powod);
  s.zegar.przesun(SESJA_MAKS_H * GODZ + MIN);
  await uruchomDane({ ...s.z, migruj: (b) => migruj(b) });
  expect(await zmieniono(s, st.wartosc.sesjaId)).toBe(s.zegar.teraz().ms);
});

test('L2: import „scal” — sesja z nowszym zmieniono_ms (korekta na drugim urządzeniu) wygrywa, starsza nie nadpisuje', async () => {
  const a = await przygotuj();
  await wykonaj(a.baza, [projekt('p1', 'Sweter')]);
  const st = await startSesji(a.z, { projektId: 'p1' });
  if (!st.ok) throw new Error(st.powod);
  const id = st.wartosc.sesjaId;
  a.zegar.przesun(GODZ);
  await zakonczSesje(a.z, { sesjaId: id });
  const b = await przygotuj({ katalog: undefined });
  await b.baza.run(`ATTACH DATABASE ? AS a`, [join(a.katalog, 'oczko.db')]);
  await b.baza.run('INSERT INTO projekt SELECT * FROM a.projekt');
  await b.baza.run('INSERT INTO sesja SELECT * FROM a.sesja');
  await b.baza.run('DETACH DATABASE a');
  const t = a.zegar.teraz().ms;
  a.zegar.przesun(MIN);
  await korygujSesje(a.z, { sesjaId: id, startMs: t - 2 * GODZ, koniecMs: t - GODZ }); // korekta na A, nowsza
  await scalZKopia(b.baza, join(a.katalog, 'oczko.db'), t + 2 * MIN);
  expect(await b.baza.all('SELECT start_ms, koniec_ms, skorygowano FROM sesja WHERE id = ?', [id])).toEqual([{ start_ms: t - 2 * GODZ, koniec_ms: t - GODZ, skorygowano: 1 }]);
  await b.baza.run('UPDATE sesja SET koniec_ms = koniec_ms + 1, zmieniono_ms = zmieniono_ms + 1 WHERE id = ?', [id]); // B nowsza
  await scalZKopia(b.baza, join(a.katalog, 'oczko.db'), t + 3 * MIN);
  expect(await b.baza.all('SELECT koniec_ms FROM sesja WHERE id = ?', [id])).toEqual([{ koniec_ms: t - GODZ + 1 }]);
});
