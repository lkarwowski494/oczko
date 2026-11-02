// M1-audytor-generalny-022 (źródło 08-programista-004; P-396): odczyt sklepu na ścieżce pierwszego ekranu ma limit czasu. Sklep, który nie
// odpowiada w `limitMs`, nie wstrzymuje decyzji: po limicie dostęp z pamięci offline (KP-06, gałąź „błąd odczytu”), a wynik sklepu, który
// przyjdzie później, ustawia stan i trafia do słuchaczy `naZmiane` (nasłuch). Sklep szybszy niż limit — bez zmian (decyzja ze sklepu).
import { dostepPro } from '../../src/kompozycja/dostep';
import { sklepSztuczny } from '../../src/platforma/sklep-sztuczny';
import { SKLEP_LIMIT_MS } from '../../src/konfiguracja';
import type { StanDostepu } from '../../src/kompozycja/dostep';

function srodowisko() {
  const teraz = Date.UTC(2026, 10, 10);
  const plik = { tekst: null as string | null };
  const sklep = sklepSztuczny(() => teraz);
  const magazyn = { czytaj: async () => plik.tekst, zapisz: async (t: string) => { plik.tekst = t; } };
  return { sklep, plik, d: dostepPro(sklep, magazyn, () => teraz) };
}
/** Sklep, którego `transakcje()` rozstrzyga się dopiero na wywołanie `odpowiedz` (albo nigdy). */
function wiszacy(s: ReturnType<typeof srodowisko>) {
  const prawdziwe = s.sklep.transakcje.bind(s.sklep);
  let odpowiedz: () => void = () => undefined;
  s.sklep.transakcje = () => new Promise((ok, zle) => { odpowiedz = () => { prawdziwe().then(ok, zle); }; });
  return { odpowiedz: () => odpowiedz() };
}
const chwila = (ms: number) => new Promise((r) => setTimeout(r, ms));

test('P-396: limit 1500 ms w konfiguracji', () => {
  expect(SKLEP_LIMIT_MS).toBe(1500);
});

test('sklep wiszący, pamięć Pro → po limicie Pro z pamięci, bez czekania na sklep', async () => {
  const s = srodowisko();
  await s.sklep.kup('oczko.pro.yearly');
  await s.d.odswiez(); // pamięć Pro zapisana po udanym odczycie
  wiszacy(s);
  const start = Date.now();
  const wynik = await Promise.race([s.d.odswiez(50), chwila(1000).then(() => 'wisi' as const)]);
  expect(wynik).not.toBe('wisi');
  expect(Date.now() - start).toBeLessThan(900);
  expect(wynik).toMatchObject({ pro: true, poziom: 'pro' });
});

test('sklep wiszący, bez pamięci → po limicie „niepewny” bez Pro; Pro ze sklepu po limicie → stan i słuchacze', async () => {
  const s = srodowisko();
  await s.sklep.kup('oczko.pro.monthly'); // zakup jest w sklepie, ale pamięci jeszcze nie ma (np. nowa instalacja)
  const sklep = wiszacy(s);
  const zmiany: StanDostepu[] = [];
  s.d.naZmiane((st) => zmiany.push(st));
  const wynik = await Promise.race([s.d.odswiez(50), chwila(1000).then(() => 'wisi' as const)]);
  expect(wynik).toMatchObject({ pro: false, poziom: 'niepewny' });
  sklep.odpowiedz();
  await chwila(20);
  expect(s.d.stan()).toMatchObject({ pro: true, poziom: 'pro' });
  expect(zmiany.at(-1)).toMatchObject({ pro: true, poziom: 'pro' });
  expect(JSON.parse(s.plik.tekst ?? 'null')).toMatchObject({ produkty: ['oczko.pro.monthly'] }); // pamięć zapisana jak po zwykłym odczycie
});

test('sklep szybszy niż limit → decyzja ze sklepu (pewna darmowa), jak bez limitu', async () => {
  const s = srodowisko();
  expect(await s.d.odswiez(1000)).toMatchObject({ pro: false, poziom: 'darmowa' });
});

test('późny wynik starszego odczytu nie nadpisuje nowszego (nowszy odczyt po limicie już rozstrzygnięty)', async () => {
  const s = srodowisko();
  const stary = wiszacy(s);
  expect(await Promise.race([s.d.odswiez(30), chwila(1000).then(() => 'wisi' as const)])).toMatchObject({ poziom: 'niepewny' }); // po limicie
  s.sklep.transakcje = async () => []; // nowszy odczyt: pewna darmowa
  await s.d.odswiez();
  await s.sklep.kup('oczko.pro.yearly'); // stary odczyt odpowie stanem sklepu z Pro
  stary.odpowiedz();
  await chwila(20);
  expect(s.d.stan()).toMatchObject({ pro: false, poziom: 'darmowa' });
});
