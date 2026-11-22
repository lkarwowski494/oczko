// M1-audytor-generalny-131 (P-447 wariant a, jak Trening: jednorazowe flagi wyświetlenia w ustawieniach jadą z kopią): flaga wskazówki znacznika
// `wskazowka_znacznika_widziana` to zwykły klucz `ustawienie`, nie stan urządzenia — przywrócenie z kopii („zastąp”) ją przenosi, więc po przywróceniu
// na nowym urządzeniu wskazówki nie ma (osoba zna już znacznik). Kopia w katalogu tymczasowym; liczności tabel i kontrole bazy po przeniesieniu.
import { join } from 'node:path';
import { odczytajUstawienie, zapiszUstawienie, type KluczUstawienia } from '../../src/dane/repozytoria/ustawienia';
import { zastapZKopii } from '../../src/dane/baza/przeniesienie';
import { przyTle } from '../../src/przypadki-uzycia/start';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { przygotuj, wykonaj } from './pomocnicze/srodowisko';

const FLAGA = 'wskazowka_znacznika_widziana' as KluczUstawienia;
const licznosci = async (s: Awaited<ReturnType<typeof przygotuj>>) => {
  const w: Record<string, unknown> = {};
  for (const t of ['projekt', 'czesc', 'licznik', 'zdarzenie', 'ustawienie']) w[t] = (await s.baza.all(`SELECT COUNT(*) AS n FROM ${t}`))[0];
  return w;
};

test('131 (P-447): przywrócenie z kopii przenosi flagę wskazówki znacznika; baza po przeniesieniu bez błędów integralności i kluczy obcych', async () => {
  const zrodlo = await przygotuj();
  await wykonaj(zrodlo.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 12)]);
  await zapiszUstawienie(zrodlo.baza, FLAGA, true, 1);
  await przyTle(zrodlo.z);
  const cel = await przygotuj();
  const przed = await licznosci(cel);
  await zastapZKopii(cel.baza, join(zrodlo.katalog, 'oczko.db'));
  expect(await odczytajUstawienie(cel.baza, FLAGA)).toBe(true);
  const po = await licznosci(cel);
  expect(po).toEqual(await licznosci(zrodlo));
  expect(przed).not.toEqual(po);
  expect(await cel.baza.all('PRAGMA integrity_check')).toEqual([{ integrity_check: 'ok' }]);
  expect(await cel.baza.all('PRAGMA foreign_key_check')).toEqual([]);
  console.log(JSON.stringify({ przed, po, integrity_check: 'ok', foreign_key_check: [] })); // dowód M2 (dane-uzytkownika)
});
