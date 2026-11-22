// Potwierdzenia dla kolejki zegarka po stronie telefonu (ADR-0009, uzupełnienie 2026-10-26 pkt 3; NZ-08-P3-05 (e1), (e5); P-135 Q2a).
// Test oczekujący roli 05 (fix-4): czerwony na asercji do wdrożenia przez 08 (partia 4, przed ekranami); 08 przenosi go do tests/dane
// w commicie, który go zazielenia (DS-02). Wyrocznia: kontrakt ADR-0009 (pkt 3) — id linii `zrodlo: 'zegarek'` z partii scalenia, które po
// COMMIT są w `zdarzenie` (nowe albo powtórzone) albo odrzucone na stałe (brak licznika, R-021); poczekalnia i ekran blokady — nie.
// Sygnatury: „Kontrakt partii 4” w docs/architektura/moduly.md (P-135: porty.ts zmienia 08 razem z adapterem).
import type { StanZegarka, ZdarzenieWejsciowe } from '../../src/domena/porty';
import { ZEGAREK_POTWIERDZENIA_MAKS } from '../../src/konfiguracja';
import { scalDziennik } from '../../src/przypadki-uzycia/dziennik';
import { zegarek } from '../../src/platforma/zegarek';
import { czesc, licznik, projekt } from './pomocnicze/dane-wejsciowe';
import { przygotuj, wykonaj } from './pomocnicze/srodowisko';

const T = Date.UTC(2026, 10, 10, 20); // 2026-11-10 21:00 Europe/Warsaw
const linia = (id: string, licznikId: string, rodzice: string[], zrodlo: ZdarzenieWejsciowe['zrodlo'] = 'zegarek'): ZdarzenieWejsciowe => ({
  id, licznikId, rodzaj: 'plus', rodzice, czasMs: T, strefa: 'Europe/Warsaw', dzien: '2026-11-10', zrodlo, urzadzenie: zrodlo === 'zegarek' ? 'zegarek-test' : 'iphone-test', pro: false,
});
/** Wynik partii według kontraktu partii 4 (`WynikPartii.potwierdzone`); dziś pola nie ma. */
const potwierdzone = (w: unknown): unknown => (w as { ok: boolean; wartosc?: { potwierdzone?: unknown } }).wartosc?.potwierdzone;

async function srodowisko() {
  const s = await przygotuj();
  await wykonaj(s.baza, [projekt('p1', 'Sweter'), czesc('c1', 'p1', 'Przód'), ...licznik('l1', 'c1', 0)]);
  s.zegar.ustaw(T + 60_000);
  return s;
}

describe('P-135 Q2a scalenie zwraca id do potwierdzenia dla zegarka (ADR-0009, 2026-10-26 pkt 3)', () => {
  test('P-135 (e1): linia zegarka zapisana w `zdarzenie` jest potwierdzona; linia ekranu blokady nie', async () => {
    const s = await srodowisko();
    s.dziennik.linie.push(linia('z1', 'l1', []), linia('e1', 'l1', ['z1'], 'ekran_blokady'));
    expect(potwierdzone(await scalDziennik(s.z))).toEqual(['z1']);
  });

  test('P-135 M-02: powtórzone dostarczenie (zdarzenie już w bazie) jest potwierdzone ponownie, bez powtórzeń w liście', async () => {
    const s = await srodowisko();
    s.dziennik.linie.push(linia('z1', 'l1', []));
    await scalDziennik(s.z);
    s.dziennik.linie.push(linia('z1', 'l1', []), linia('z1', 'l1', []));
    expect(potwierdzone(await scalDziennik(s.z))).toEqual(['z1']);
  });

  test('P-135 R-021: linia zegarka bez licznika w bazie (odrzucona na stałe) jest potwierdzona — inaczej zegarek ponawiałby ją bez końca', async () => {
    const s = await srodowisko();
    s.dziennik.linie.push(linia('z9', 'brak-licznika', []));
    expect(potwierdzone(await scalDziennik(s.z))).toEqual(['z9']);
  });

  test('P-135 (e5): linia zegarka w poczekalni (rodzic jeszcze nie dotarł) nie jest potwierdzona; kolejność = pierwsze wystąpienie', async () => {
    const s = await srodowisko();
    s.dziennik.linie.push(linia('z2', 'l1', ['z-nieznany']), linia('z1', 'l1', []), linia('z3', 'l1', ['z1']));
    expect(potwierdzone(await scalDziennik(s.z))).toEqual(['z1', 'z3']);
  });
});

describe('P-135 Q2a adapter Zegarek: potwierdzone w tym samym kontekście co stan (ADR-0009, 2026-10-26 pkt 3)', () => {
  const stan = { wersja: 2, licznikId: 'l1' } as unknown as StanZegarka;
  function atrapa() {
    const wyslane: unknown[][] = [];
    const natywny = { zegarekWyslij: async (...a: unknown[]) => { wyslane.push(a); }, addListener: () => ({ remove() {} }) };
    return { wyslane, z: zegarek(natywny as unknown as Parameters<typeof zegarek>[0]) as unknown as Record<string, unknown> & { wyslijStan(s: StanZegarka): Promise<void> } };
  }

  test('P-135: potwierdz(ids), potem wyslijStan → moduł dostaje stan i listę potwierdzonych (klucze `stan` i `potwierdzone`)', async () => {
    const { wyslane, z } = atrapa();
    expect(typeof z.potwierdz).toBe('function');
    (z.potwierdz as (ids: readonly string[]) => void)(['z1', 'z2']);
    await z.wyslijStan(stan);
    // 08 partia 4 (P-139): trzeci argument = język aplikacji (null bez źródła języka); asercja stanu i listy bez zmian.
    expect(wyslane).toEqual([[JSON.stringify(stan), ['z1', 'z2'], null]]);
  });

  test(`P-135: lista trzyma ostatnie ZEGAREK_POTWIERDZENIA_MAKS (${ZEGAREK_POTWIERDZENIA_MAKS}) id bez powtórzeń; nowsze wypierają starsze`, async () => {
    const { wyslane, z } = atrapa();
    expect(typeof z.potwierdz).toBe('function');
    const ids = Array.from({ length: ZEGAREK_POTWIERDZENIA_MAKS + 10 }, (_, i) => `z${i}`);
    (z.potwierdz as (ids: readonly string[]) => void)(ids);
    (z.potwierdz as (ids: readonly string[]) => void)(['z15']);
    await z.wyslijStan(stan);
    const lista = (wyslane[0] as [string, string[]])[1];
    expect([lista.length, new Set(lista).size, lista[0], lista.includes('z9'), lista[lista.length - 1]]).toEqual([ZEGAREK_POTWIERDZENIA_MAKS, ZEGAREK_POTWIERDZENIA_MAKS, 'z10', false, 'z15']);
  });
});
