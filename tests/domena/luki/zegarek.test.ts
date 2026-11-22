// Luki pokrycia E3 (rola 07): zegarek bez telefonu w ręku (BR-LIC-015/S1, docs/brd/wymagania-licznik.md:198) i zgodność
// zegarka z telefonem (NFR-ZEG-001, docs/brd/wymagania.md:109: „różnica 0 po synchronizacji”) — poziom domena-Node, symulowany transport.
// Wyrocznie: scenariusz BRD (10 + 3 = 13), wektor M-04 (docs/architektura/eksperymenty/e1/scal-wektory.json: równoległe zmiany = konflikt),
// własność „po pełnej wymianie obie strony mają ten sam wynik scal”, model liniowy w teście (M-01, M-06: −1 nie schodzi poniżej 0),
// złote pliki tests/wspolne/stan-zegarka-*.json (kontrakt TS ↔ Swift, ADR-0009).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import fc from 'fast-check';
import { scal } from '../../../src/domena/scal';
import type { WynikScalenia, ZdarzenieLicznika } from '../../../src/domena/scal';
import type { StanZegarka, ZdarzenieWejsciowe } from '../../../src/domena/porty';
import { stanZegarka, zdarzenieZWejscia } from '../../../src/domena/zegarek';
import type { WejscieStanuZegarka } from '../../../src/domena/zegarek';
import { opcjeWlasnosci } from '../../narzedzia/akceptacja';

const L = 'licznik-1';
const wejscie = (id: string, rodzaj: 'plus' | 'minus', rodzice: string[], zrodlo: ZdarzenieWejsciowe['zrodlo'] = 'zegarek'): ZdarzenieWejsciowe => ({
  id, licznikId: L, rodzaj, rodzice, czasMs: 1_800_000_000_000, strefa: 'Europe/Warsaw', dzien: '2027-01-15', zrodlo, urzadzenie: 'zegarek-test', pro: false,
});
/** Postać do porównania: zbiory głów, brakujących i kandydatów (jak tests/akceptacja/domena/licznik/scal.test.ts, R-038). */
function jakoZbiory(w: WynikScalenia): WynikScalenia {
  if (w.stan === 'zgodny') return { ...w, glowy: [...w.glowy].sort() };
  if (w.stan === 'czeka') return { ...w, brakujacy: [...new Set(w.brakujacy)].sort() };
  if (w.stan === 'blad') return w; // wariant blad (P-111 (4)), dopisany przez 08
  return { ...w, glowy: [...w.glowy].sort(), kandydaci: [...w.kandydaci].sort((a, b) => a.glowa.localeCompare(b.glowa)) };
}

describe('BR-LIC-015 liczenie na zegarku poza zasięgiem telefonu', () => {
  // Telefon: wpisanie 10 (głowa „a”); zegarek dostał stan z głową „a” (ADR-0009), potem 3 × +1 bez telefonu.
  const telefon: ZdarzenieLicznika[] = [{ id: 'a', licznik: L, rodzaj: 'wpisanie', wartosc: 10, rodzice: [] }];
  const zZegarka = [wejscie('z1', 'plus', ['a']), wejscie('z2', 'plus', ['z1']), wejscie('z3', 'plus', ['z2'])];

  test('BR-LIC-015/S1 licznik 10, 3 rzędy na zegarku → zegarek 13, po powrocie w zasięg telefon też 13 (jedna głowa z3)', () => {
    const zegarekWidzi = scal([...telefon, ...zZegarka.map(zdarzenieZWejscia)]);
    expect(jakoZbiory(zegarekWidzi)).toEqual({ stan: 'zgodny', wartosc: 13, glowy: ['z3'] });
    const telefonPoPowrocie = scal([...zZegarka.map(zdarzenieZWejscia).reverse(), ...telefon]); // transferUserInfo: kolejność dowolna
    expect(jakoZbiory(telefonPoPowrocie)).toEqual(jakoZbiory(zegarekWidzi));
  });
  test('BR-LIC-015/S1 zdarzenia ze źródłem „zegarek” scalane jak z ekranu blokady (to samo id, rodzice, rodzaj → ten sam wynik)', () => {
    const zZegarkaWynik = scal([...telefon, ...zZegarka.map(zdarzenieZWejscia)]);
    const zEkranu = scal([...telefon, ...zZegarka.map((z) => zdarzenieZWejscia({ ...z, zrodlo: 'ekran_blokady' }))]);
    expect(jakoZbiory(zEkranu)).toEqual(jakoZbiory(zZegarkaWynik));
    expect(zdarzenieZWejscia(zZegarka[0])).toMatchObject({ id: 'z1', licznik: L, rodzaj: 'plus', rodzice: ['a'] });
  });
  test('BR-LIC-015/S1 M-04 telefon i zegarek równolegle od 10 → konflikt pokazany (11 i 12), nie suma po cichu', () => {
    const w = scal([...telefon, { id: 't1', licznik: L, rodzaj: 'plus', rodzice: ['a'] }, ...[wejscie('z1', 'plus', ['a']), wejscie('z2', 'plus', ['z1'])].map(zdarzenieZWejscia)]);
    expect(jakoZbiory(w)).toEqual({ stan: 'konflikt', glowy: ['t1', 'z2'], kandydaci: [{ glowa: 't1', wartosc: 11 }, { glowa: 'z2', wartosc: 12 }] });
  });
});

describe('NFR-ZEG-001 zgodność zegarka i telefonu: różnica 0 po synchronizacji (symulowany transport)', () => {
  type Krok = { strona: 'telefon' | 'zegarek'; rodzaj: 'plus' | 'minus'; wymiana: boolean };
  const krok = fc.record({ strona: fc.constantFrom('telefon' as const, 'zegarek' as const), rodzaj: fc.constantFrom('plus' as const, 'minus' as const), wymiana: fc.boolean() });
  const glowy = (zbior: Map<string, ZdarzenieWejsciowe>) => {
    const rodzice = new Set([...zbior.values()].flatMap((z) => z.rodzice));
    return [...zbior.keys()].filter((id) => !rodzice.has(id)).sort();
  };
  /** Tasowanie Fishera–Yatesa z ziarnem z fast-check (zasada 7: losowość tylko z ziarnem wypisanym przy porażce). */
  function tasuj<T>(t: T[], ziarno: number): T[] {
    const w = [...t];
    let x = ziarno + 1;
    for (let i = w.length - 1; i > 0; i--) {
      x = (x * 1103515245 + 12345) % 2147483648;
      const j = x % (i + 1);
      [w[i], w[j]] = [w[j], w[i]];
    }
    return w;
  }
  /** Symulacja: każda strona dopisuje zdarzenie z rodzicami = własne głowy; `wymiana` = obie strony w zasięgu (zbiory się łączą). */
  function symuluj(kroki: Krok[], zawszeWymiana: boolean) {
    const strony = { telefon: new Map<string, ZdarzenieWejsciowe>(), zegarek: new Map<string, ZdarzenieWejsciowe>() };
    kroki.forEach((k, i) => {
      const id = `${k.strona[0]}${i}`;
      strony[k.strona].set(id, wejscie(id, k.rodzaj, glowy(strony[k.strona]), k.strona === 'zegarek' ? 'zegarek' : 'ekran_blokady'));
      if (zawszeWymiana || k.wymiana) for (const [a, b] of [['telefon', 'zegarek'], ['zegarek', 'telefon']] as const) for (const [kk, v] of strony[a]) strony[b].set(kk, v);
    });
    for (const [kk, v] of strony.telefon) strony.zegarek.set(kk, v); // powrót w zasięg: pełna wymiana
    for (const [kk, v] of strony.zegarek) strony.telefon.set(kk, v);
    return strony;
  }
  test('NFR-ZEG-001 własność: po pełnej wymianie scal na telefonie = scal na zegarku (dowolna kolejność dostarczenia, zmiany na obu stronach)', () => {
    fc.assert(
      fc.property(fc.array(krok, { minLength: 1, maxLength: 25 }), fc.integer({ min: 0, max: 1_000_000 }), (kroki, ziarno) => {
        const s = symuluj(kroki, false);
        const tel = [...s.telefon.values()].map(zdarzenieZWejscia);
        const zeg = [...s.zegarek.values()].map(zdarzenieZWejscia);
        const przetasowane = tasuj(zeg, ziarno);
        expect(jakoZbiory(scal(przetasowane))).toEqual(jakoZbiory(scal(tel)));
      }),
      opcjeWlasnosci(),
    );
  });
  test('NFR-ZEG-001 własność: przy wymianie po każdym kroku (historia liniowa) obie strony pokazują wartość z modelu (−1 nie poniżej 0, M-06)', () => {
    fc.assert(
      fc.property(fc.array(krok, { minLength: 1, maxLength: 25 }), (kroki) => {
        const s = symuluj(kroki, true);
        const model = kroki.reduce((v, k) => (k.rodzaj === 'plus' ? v + 1 : Math.max(0, v - 1)), 0);
        const ostatni = `${kroki[kroki.length - 1].strona[0]}${kroki.length - 1}`;
        const oczekiwane = { stan: 'zgodny', wartosc: model, glowy: [ostatni] };
        expect(jakoZbiory(scal([...s.telefon.values()].map(zdarzenieZWejscia)))).toEqual(oczekiwane);
        expect(jakoZbiory(scal([...s.zegarek.values()].map(zdarzenieZWejscia)))).toEqual(oczekiwane);
      }),
      opcjeWlasnosci(),
    );
  });
});

describe('NFR-ZEG-001 ADR-0009 stan zegarka = złote pliki tests/wspolne/stan-zegarka-*.json', () => {
  const KATALOG = join(__dirname, '../../wspolne');
  const PLIKI = ['stan-zegarka-typowy.json', 'stan-zegarka-pro-dozywotni.json', 'stan-zegarka-pro-subskrypcja.json', 'stan-zegarka-najwiekszy.json'];
  /** Wejście z danych bazy, nie ze złotego pliku wprost: dni limitu z innego miesiąca i w odwróconej kolejności (filtr i sortowanie po stronie kodu). */
  function wejscieDla(z: StanZegarka): WejscieStanuZegarka {
    const [r, m] = z.dzien.split('-').map(Number);
    const poprzedni = `${m === 1 ? r - 1 : r}-${String(m === 1 ? 12 : m - 1).padStart(2, '0')}-28`;
    return {
      licznik: { id: z.licznikId, wartosc: z.wartosc, glowa: z.glowa, znaczenie: z.znaczenie, zablokowany: z.zablokowany }, // wersja 2 (08 partia 3, P-111 (3)): znaczenie, ostatniPlusMs, przypomnienia; wersja 3 (08 partia 4, N1): zablokowany
      nazwa: z.nazwa,
      dzis: z.dzien,
      dzienDozwolony: z.dzienDozwolony,
      sesjaStartMs: z.sesjaStartMs,
      ostatniPlusMs: z.ostatniPlusMs,
      przypomnienia: z.przypomnienia,
      dostep: { pro: z.pro, wygasa: z.proWaznoscDo },
      dniLimitu: [{ data: poprzedni, pro: false }, ...[...z.dniWMiesiacu].reverse().map((d) => ({ data: d.dzien, pro: d.pro }))],
    };
  }
  test.each(PLIKI.map((p) => [p] as const))('NFR-ZEG-001 BR-LIC-015 %s: stanZegarka(dane) daje dokładnie złoty plik', (plik) => {
    const zloty = JSON.parse(readFileSync(join(KATALOG, plik), 'utf8')) as StanZegarka;
    expect(stanZegarka(wejscieDla(zloty))).toStrictEqual(zloty);
  });
  test(`NFR-ZEG-001 liczność: ${PLIKI.length} złotych plików stanu zegarka obecnych w katalogu (pusty zbiór = porażka)`, () => {
    const wKatalogu = readdirSync(KATALOG).filter((n) => /^stan-zegarka-.*\.json$/.test(n) && !/-v[12]\.json$/.test(n)).sort(); // pliki wersji 1 i 2 (*-v1.json, *-v2.json) poza zestawem bieżącym (08 partia 3, partia 4 N1)
    expect(wKatalogu).toEqual([...PLIKI].sort());
    expect(stanZegarka(wejscieDla(JSON.parse(readFileSync(join(KATALOG, PLIKI[0]), 'utf8'))))).toBeDefined();
  });
});
