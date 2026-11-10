// Stan przeczytania przewodnika (P-688, P-690): lista id w `ustawienie.przewodnik_przeczytane` (JSON), stan urządzenia — bez iCloud, przy imporcie
// pomijany („zastąp” i „scal” zostawiają lokalną listę, jak `uklad_miar`, K-04f), „Usuń wszystkie dane” czyści; nieznane id pomijane przy odczycie.
import { importuj } from '../../src/przypadki-uzycia/archiwum';
import { oznaczPrzeczytana, przeczytanePrzewodnika } from '../../src/przypadki-uzycia/przewodnik';
import { usunWszystkieDane } from '../../src/przypadki-uzycia/projekt';
import { archiwumWzorcowe, projekt } from './pomocnicze/dane-wejsciowe';
import { jeden, przygotuj, zArchiwum } from './pomocnicze/srodowisko';

const odczyt = async (s: Awaited<ReturnType<typeof przygotuj>>) => {
  const w = await przeczytanePrzewodnika(s.z);
  if (!w.ok) throw new Error(w.powod);
  return w.wartosc;
};

describe('przewodnik: zapis przeczytanych', () => {
  test('pusta baza → []; pierwsze rozwinięcie zapisuje id; drugie bez powtórzenia; nieznane id bez zapisu', async () => {
    const s = await przygotuj();
    expect(await odczyt(s)).toEqual([]);
    expect(await oznaczPrzeczytana(s.z, 'cel')).toEqual({ ok: true, wartosc: ['cel'] });
    expect(await oznaczPrzeczytana(s.z, 'kosz')).toEqual({ ok: true, wartosc: ['cel', 'kosz'] });
    expect(await oznaczPrzeczytana(s.z, 'cel')).toEqual({ ok: true, wartosc: ['cel', 'kosz'] });
    expect(await oznaczPrzeczytana(s.z, 'nie-ma-takiej')).toEqual({ ok: true, wartosc: ['cel', 'kosz'] });
    expect(await odczyt(s)).toEqual(['cel', 'kosz']);
    expect(await jeden<{ wartosc: string }>(s.baza, "SELECT wartosc FROM ustawienie WHERE klucz = 'przewodnik_przeczytane'")).toEqual({ wartosc: '["cel","kosz"]' });
  });

  test('zapis złego typu albo z nieznanymi id → odczyt pomija, nie zgaduje; następne rozwinięcie zapisuje czystą listę', async () => {
    const s = await przygotuj();
    await s.baza.run("INSERT INTO ustawienie (klucz, wartosc, zmieniono_ms) VALUES ('przewodnik_przeczytane', '{\"cel\":true}', 1)");
    expect(await odczyt(s)).toEqual([]);
    await s.baza.run("UPDATE ustawienie SET wartosc = '[\"stara-funkcja\",7,\"cel\",\"cel\"]' WHERE klucz = 'przewodnik_przeczytane'");
    expect(await odczyt(s)).toEqual(['cel']);
    expect(await oznaczPrzeczytana(s.z, 'kosz')).toEqual({ ok: true, wartosc: ['cel', 'kosz'] });
    expect(await jeden<{ wartosc: string }>(s.baza, "SELECT wartosc FROM ustawienie WHERE klucz = 'przewodnik_przeczytane'")).toEqual({ wartosc: '["cel","kosz"]' });
  });

  test.each(['zastap', 'scal'] as const)('import „%s” archiwum z obcą listą zostawia lokalną (stan urządzenia)', async (tryb) => {
    const s = await przygotuj();
    await oznaczPrzeczytana(s.z, 'cel');
    const sciezka = archiwumWzorcowe(s.katalog, 'obce', [projekt('cz', 'Czapka'),
      ['INSERT INTO ustawienie (klucz, wartosc, zmieniono_ms) VALUES (?, ?, ?)', ['przewodnik_przeczytane', '["kosz","zegarek"]', 1]]]);
    expect(await importuj(zArchiwum(s.z), { sciezka, wybierz: async () => tryb })).toMatchObject({ ok: true });
    expect(await odczyt(s)).toEqual(['cel']);
  });

  test('„Usuń wszystkie dane” czyści listę', async () => {
    const s = await przygotuj();
    await oznaczPrzeczytana(s.z, 'cel');
    expect(await odczyt(s)).toEqual(['cel']);
    expect(await usunWszystkieDane(zArchiwum(s.z))).toMatchObject({ ok: true });
    expect(await odczyt(s)).toEqual([]);
  });
});
