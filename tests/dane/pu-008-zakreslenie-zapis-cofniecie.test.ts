// PU-008 (katalog przypadków użycia, „Zakreślanie na wzorze”): „drugi pas od razu; jedno stuknięcie cofnięcia → jedno zakreślenie; po restarcie to, co zostało” — strona danych na prawdziwym SQLite
// (node:sqlite) i prawdziwym systemie plików: rysunek strony to CAŁY plik strony (starszy by go cofnął), więc po zapisie dwóch pasów, cofnięciu jednego (widok natywny zapisuje stronę
// bez ostatniej kreski) i „restarcie” (nowy odczyt widoku wzoru) w bazie i w widoku jest dokładnie rysunek po cofnięciu, a nie dwa pasy i nie pierwszy zapis.
// Poza Jest: kreska palcem, liczenie kresek i faktyczne cofnięcie w widoku natywnym PencilKit — scenariusz 100 (oczekujący). Ekran (licznik pasów 1 → 2 → 1, jedno wywołanie „Cofnij”): tests/ekrany/pu-008-zakreslacz-iphone.test.tsx.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { zapiszRysunek } from '../../src/przypadki-uzycia/wzor';
import { widokWzoru } from '../../src/przypadki-uzycia/wzor-widok';
import { plik, projekt, wzor } from './pomocnicze/dane-wejsciowe';
import { ile, przygotuj, sha256, wlozPlik, wykonaj } from './pomocnicze/srodowisko';

const PDF = Buffer.from('%PDF-1.4\n%%EOF\n');
const OK = { ok: true, wartosc: undefined };

test('PU-008: pas 1 → pas 2 → cofnięcie ostatniej kreski → restart: rysunek strony to ostatni zapis (1 pas), jeden wiersz na stronę, starsze pliki rysunku nie wracają', async () => {
  const s = await przygotuj();
  const h = wlozPlik(s.magazyn, PDF, 'pdf');
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h)]);
  const zapisz = async (tresc: string) => {
    const f = join(s.katalog, 'tmp', `${sha256(tresc).slice(0, 8)}.pkdrawing`);
    writeFileSync(f, tresc);
    expect(await zapiszRysunek(s.z, { wzorId: 'w1', strona: 0, plikTymczasowy: f })).toEqual(OK);
  };
  const rysunek = async () => {
    const w = await widokWzoru(s.z, { wzorId: 'w1' });
    if (!w.ok) throw new Error('widokWzoru');
    return w.wartosc.rysunki.map((r) => ({ strona: r.strona, tresc: readFileSync(r.plik, 'utf8') }));
  };

  await zapisz('pas-1');
  expect(await rysunek()).toEqual([{ strona: 0, tresc: 'pas-1' }]); // pierwszy pas widać od razu po zapisie
  await zapisz('pas-1+pas-2');
  expect(await rysunek()).toEqual([{ strona: 0, tresc: 'pas-1+pas-2' }]); // drugi pas: cały rysunek strony, nie dopisek obok
  await zapisz('pas-1'); // „Cofnij ostatnią kreskę”: widok natywny zapisuje stronę bez drugiego pasa
  expect(await rysunek()).toEqual([{ strona: 0, tresc: 'pas-1' }]);
  expect(await ile(s.baza, 'rysunek', "wzor_id = 'w1' AND strona = 0")).toBe(1);

  // „restart”: nowy odczyt widoku z tej samej bazy daje to samo (nic nie czeka w pamięci)
  expect(await rysunek()).toEqual([{ strona: 0, tresc: 'pas-1' }]);
});
