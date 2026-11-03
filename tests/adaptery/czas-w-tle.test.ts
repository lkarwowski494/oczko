// Adapter CzasWTle na module Swift (ADR-0002 (7); test roli 08 na atrapie modułu): sygnał z modułu trafia do transakcji, `koniec` zawsze
// (po sukcesie, błędzie i wygaśnięciu), a import pod wygasającym czasem w tle zostawia bazę jak przed (ROLLBACK).
import { utworzArchiwum } from '../../src/dane/archiwum';
import { migruj } from '../../src/dane/migracje/migruj';
import { czasWTle } from '../../src/platforma/czas-w-tle';
import { importuj } from '../../src/przypadki-uzycia/archiwum';
import { archiwumWzorcowe, czesc, licznik, projekt } from '../dane/pomocnicze/dane-wejsciowe';
import { migawka, przygotuj, wykonaj } from '../dane/pomocnicze/srodowisko';

function atrapa(wygasaPo = Infinity) {
  const zdarzenia: string[] = [];
  let sprawdzenia = 0;
  return {
    zdarzenia,
    start: async (n: string) => { zdarzenia.push(`start ${n}`); return 'z1'; },
    czyWygaslo: (id: string) => { sprawdzenia += 1; return id === 'z1' && sprawdzenia > wygasaPo; },
    koniec: async (id: string) => { zdarzenia.push(`koniec ${id}`); },
  };
}

test('chron: start → fn z sygnałem modułu → koniec; koniec także po błędzie fn', async () => {
  const n = atrapa();
  expect(await czasWTle(n).chron('x', async (s) => s.wygaslo())).toBe(false);
  await expect(czasWTle(n).chron('y', async () => { throw new Error('zapis'); })).rejects.toThrow('zapis');
  expect(n.zdarzenia).toEqual(['start x', 'koniec z1', 'start y', 'koniec z1']);
});

test('import „zastąp” pod czasem w tle, który wygasa po 3 instrukcjach → zapis, baza jak przed, koniec zadania', async () => {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('sw', 'Sweter'), czesc('cs', 'sw', 'Przód'), ...licznik('ls', 'cs', 3)]);
  const n = atrapa(3);
  const archiwum = utworzArchiwum({ baza: s.baza, magazyn: s.magazyn, zegar: s.zegar, katalogi: s.z.katalogi, migruj: (b) => migruj(b), aplikacja: '1.0.0 (test)' });
  const przed = await migawka(s.baza, ['blad']);
  const sciezka = archiwumWzorcowe(s.katalog, 'czapka', [projekt('cz', 'Czapka'), czesc('cc', 'cz', 'Główka'), ...licznik('lc', 'cc', 4)]);
  expect(await importuj({ ...s.z, archiwum, czasWTle: czasWTle(n) }, { sciezka, wybierz: async () => 'zastap' })).toEqual({ ok: false, powod: 'zapis' });
  expect(await migawka(s.baza, ['blad'])).toBe(przed);
  expect(n.zdarzenia).toEqual(['start import-sprawdzenie', 'koniec z1', 'start import', 'koniec z1']); // M1-065: sprawdzenie pod osobnym zadaniem, zakończonym przed dialogiem wyboru
});
