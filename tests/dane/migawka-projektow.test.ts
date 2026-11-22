// Migawka projektów w App Group dla arkusza „Udostępnij do Oczka” (P-220 R1a/N2, P-243 S1a; moduly.md „Kontrakt partii 6”: MigawkaProjektow.zapisz).
// Wyrocznie: kontrakt (koperta `{ format: 'oczko-migawka', wersja: MIGAWKA_WERSJA, utworzono, projekty }`, zapis atomowy: plik tymczasowy → odczyt
// kontrolny → rename; tylko projekty w toku poza koszem; „Usuń wszystkie dane” → pusta lista; błąd zapisu nie cofa operacji — wpis `blad`).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ProjektMigawki } from '../../src/domena/porty';
import { MIGAWKA_WERSJA } from '../../src/konfiguracja';
import { migawkaWKatalogu } from '../../src/platforma/migawka';
import { odswiezMigawke } from '../../src/przypadki-uzycia/migawka';
import { usunProjekt, usunWszystkieDane } from '../../src/przypadki-uzycia/projekt';
import { plik, projekt, wzor } from './pomocnicze/dane-wejsciowe';
import { DOBA, T0, jeden, katalogTymczasowy, przygotuj, wlozPlik, wykonaj, zArchiwum } from './pomocnicze/srodowisko';

const PDF = Buffer.from('%PDF-1.4\n%%EOF\n');
const czytaj = (k: string) => JSON.parse(readFileSync(join(k, 'projekty-migawka.json'), 'utf8'));

describe('adapter migawki (zapis atomowy, koperta)', () => {
  test('zapisz → koperta z wersją i chwilą; drugi zapis zastępuje plik; bez plików tymczasowych', async () => {
    const k = katalogTymczasowy('oczko-grupa-');
    const m = migawkaWKatalogu(k, () => T0);
    const a: ProjektMigawki = { id: 'p1', nazwa: 'Harbor', nienazwany: false, utworzonoMs: T0, ostatniaPracaMs: T0, wzory: 1, film: false };
    await m.zapisz([a], 'pl');
    expect(czytaj(k)).toEqual({ format: 'oczko-migawka', wersja: MIGAWKA_WERSJA, utworzono: T0, jezyk: 'pl', projekty: [a] }); // jezyk: P-248 D2a
    await m.zapisz([], 'pl');
    expect(czytaj(k).projekty).toEqual([]);
    expect(readdirSync(k)).toEqual(['projekty-migawka.json']);
  });

  test('stary plik tymczasowy po przerwanym zapisie nie przeszkadza; brak katalogu grupy → zapis nic nie robi', async () => {
    const k = katalogTymczasowy('oczko-grupa-');
    writeFileSync(join(k, 'projekty-migawka.json.tmp'), 'ucięty');
    await migawkaWKatalogu(k, () => T0).zapisz([], 'en');
    expect(czytaj(k).projekty).toEqual([]);
    expect(readdirSync(k)).toEqual(['projekty-migawka.json']);
    await expect(migawkaWKatalogu(null, () => T0).zapisz([], 'en')).resolves.toBeUndefined();
  });
});

describe('odswiezMigawke', () => {
  async function srodowisko() {
    const s = await przygotuj();
    const h = wlozPlik(s.magazyn, PDF, 'pdf');
    await wykonaj(s.baza, [
      projekt('p1', 'Harbor', T0, { ostatnia: T0 + DOBA }), projekt('p2', 'Scarf', T0, { ostatnia: T0 + 2 * DOBA }),
      projekt('p3', 'Mittens', T0, { stan: 'ukonczony', ukonczono: T0 }), projekt('p4', 'Usunięty', T0, { usunieto: T0 }),
      plik(h, 'pdf', PDF.length), wzor('w1', 'p1', h), wzor('w2', 'p1', h), wzor('w3', 'p2', h),
      ["UPDATE wzor SET usunieto_ms = ? WHERE id = 'w3'", [T0]],
      ["UPDATE projekt SET film_adres = ?, film_nazwa = ? WHERE id = 'p1'", ['https://example.org/video', 'Cast-on']], // P-276: flaga film
    ]);
    const k = katalogTymczasowy('oczko-grupa-');
    return { s, k, z: { ...s.z, migawka: migawkaWKatalogu(k, () => s.zegar.teraz().ms), jezyk: () => 'de' } };
  }

  test('projekty w toku poza koszem, kolejność jak lista projektów (ostatnia praca), liczba wzorów poza koszem; P-276: film = projekt ma link do filmu', async () => {
    const { k, z } = await srodowisko();
    expect(await odswiezMigawke(z)).toEqual({ ok: true, wartosc: undefined });
    expect(czytaj(k).jezyk).toBe('de'); // język aplikacji (P-190), nie systemu (P-248 D2a)
    expect(czytaj(k).projekty).toEqual([
      { id: 'p2', nazwa: 'Scarf', nienazwany: false, utworzonoMs: T0, ostatniaPracaMs: T0 + 2 * DOBA, wzory: 0, film: false },
      { id: 'p1', nazwa: 'Harbor', nienazwany: false, utworzonoMs: T0, ostatniaPracaMs: T0 + DOBA, wzory: 2, film: true },
    ]);
  });

  test('po usunięciu projektu i po „Usuń wszystkie dane” migawka odświeżona (pusta lista na końcu)', async () => {
    const { s, k, z } = await srodowisko();
    await usunProjekt(s.z, { projektId: 'p2' });
    await odswiezMigawke(z);
    expect(czytaj(k).projekty.map((p: ProjektMigawki) => p.id)).toEqual(['p1']);
    await usunWszystkieDane(zArchiwum(s.z));
    await odswiezMigawke(z);
    expect(czytaj(k).projekty).toEqual([]);
  });

  test('błąd zapisu migawki nie jest błędem operacji: wynik ok, wpis `blad` z kodem migawka_zapis', async () => {
    const { s, z } = await srodowisko();
    const w = await odswiezMigawke({ ...z, migawka: { zapisz: async () => { throw new Error('dysk'); } } });
    expect(w).toEqual({ ok: true, wartosc: undefined });
    expect(await jeden(s.baza, 'SELECT kod FROM blad')).toEqual({ kod: 'migawka_zapis' });
  });
});
