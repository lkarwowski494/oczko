// Blokada licznika w stanie Live Activity i zegarka (N1 z P-133; NZ-08-P3-05, P-135 Q7a; F-03, BR-LIC-004): stan wersja 3 z polem `zablokowany`,
// czytanym z licznika w chwili odświeżenia. Test oczekujący roli 05 (fix-4): czerwony na asercji do wdrożenia przez 08 (partia 4, przed ekranami;
// razem z WERSJA_STANU = 3, generatorem złotych plików i dekoderem Swift); sygnatura: „Kontrakt partii 4” w docs/architektura/moduly.md.
import type { LiveActivity, StanEkranuBlokady, Zegarek } from '../../src/domena/porty';
import { odswiezEkranBlokady } from '../../src/przypadki-uzycia/ekran-blokady';
import { WERSJA_STANU } from '../../src/konfiguracja';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { przygotuj, wykonaj } from './pomocnicze/srodowisko';

async function stan(zablokowany: 0 | 1) {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 3, { zablokowany })]);
  const wyslane: StanEkranuBlokady[] = [];
  const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async (x) => { wyslane.push(x); }, zakoncz: async () => undefined };
  const zegarek: Zegarek = { potwierdz: () => undefined, wyslijStan: async (x) => { wyslane.push(x); }, odbieraj: () => () => undefined };
  const w = await odswiezEkranBlokady({ ...s.z, liveActivity, zegarek }, { licznikId: 'l1', nazwa: 'Sweter', dostep: { pro: false, wygasa: null } });
  return { w, wyslane };
}
const pole = (x: unknown) => (x as Record<string, unknown>).zablokowany;

describe('P-135 Q7a stan v3: zablokowany z licznika (ADR-0008, 2026-10-26)', () => {
  test('P-135 BR-LIC-004: licznik zablokowany → stan wersja 3 z zablokowany: true, ten sam ładunek do Live Activity i zegarka', async () => {
    const { w, wyslane } = await stan(1);
    expect(w.ok && [w.wartosc.wersja, pole(w.wartosc)]).toEqual([3, true]);
    expect(wyslane.map(pole)).toEqual([true, true]);
  });

  test('P-135 BR-LIC-004: licznik odblokowany → zablokowany: false (pole zawsze obecne, bez wartości domyślnej po stronie Swift, X-ST-01)', async () => {
    const { w } = await stan(0);
    expect(w.ok && pole(w.wartosc)).toBe(false);
  });

  test('P-135: WERSJA_STANU = 3 (pliki wersji 2 zostają jako *-v2.json)', () => {
    expect(WERSJA_STANU).toBe(3);
  });
});
