// Klasyfikacja grubości z próbki (RD-10 według P-084; BR-KAL-008) i rozmiar US drutu/szydełka (RD-11) — poziom domena-Node.
// Wyrocznia: docs/tresci/wektory.json (klasyfikacja_4in, klasyfikacja_10cm, druty, szydelka; rola 06, P-084, P-086 Q1a/Q3b)
// oraz tests/wektory/brd.json RD-10 i RD-11. RD-10 tekst i RD-10-W2 „2.3” są błędne (ER-34, ER-39): W2 czytany jako {2, 3}
// z tabeli reguly.md:164; „poza tabelą” = wynik „powyzej_tabeli” (P > 40). Kategorie porównywane jako zbiory (§3.3).
import { klasyfikujGrubosc } from '../../../src/domena/obliczenia/grubosc';
import type { Klasyfikacja } from '../../../src/domena/obliczenia/grubosc';
import { rozmiarUS } from '../../../src/domena/obliczenia/druty';
import { WEKTORY_TRESCI, wektoryReguly, licznikWektorow, wywolaj, BLAD_DANYCH } from '../../narzedzia/akceptacja';

type OczekiwaneTresci = { wynik: string; kategorie?: number[]; p4_zaokraglone?: number | null; polowka?: boolean };
const rosnaco = (a: number, b: number) => a - b;

/** Oczekiwanie z wektora treści → typ Klasyfikacja (pole `polowka` w wektorze tylko przy dokładnej połówce). */
function zTresci(o: OczekiwaneTresci): Klasyfikacja {
  const polowka = o.polowka === true;
  if (o.wynik === 'kategorie') return { wynik: 'kategorie', kategorie: [...(o.kategorie ?? [])].sort(rosnaco), p4Zaokraglone: o.p4_zaokraglone ?? null, polowka };
  if (o.wynik === 'między kategoriami') {
    const k = [...(o.kategorie ?? [])].sort(rosnaco);
    if (k.length !== 2) throw new Error('„między kategoriami” bez dwóch kategorii');
    return { wynik: 'miedzy', kategorie: [k[0], k[1]], polowka };
  }
  if (o.wynik.startsWith('poza tabelą')) return { wynik: 'powyzej_tabeli', p4Zaokraglone: o.p4_zaokraglone ?? null, polowka };
  if (o.wynik === BLAD_DANYCH) return { wynik: 'blad_danych' };
  throw new Error(`nieznany wynik wektora: ${o.wynik}`);
}
/** Wynik kodu z kategoriami posortowanymi (zbiór). */
function jakoZbior(k: Klasyfikacja): Klasyfikacja {
  if (k.wynik === 'kategorie') return { ...k, kategorie: [...k.kategorie].sort(rosnaco) };
  if (k.wynik === 'miedzy') {
    const [a, b] = [...k.kategorie].sort(rosnaco);
    return { ...k, kategorie: [a, b] };
  }
  return k;
}

describe('BR-KAL-008 klasyfikujGrubosc: wektory treści „klasyfikacja_4in” (P-084)', () => {
  const wektory = WEKTORY_TRESCI.klasyfikacja_4in;
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`BR-KAL-008 RD-10 ${w.id} (${w.rodzaj}) ${w.p4} o./4 in → ${w.oczekiwane.wynik}${w.oczekiwane.kategorie ? ' ' + w.oczekiwane.kategorie.join(',') : ''}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      expect(jakoZbior(klasyfikujGrubosc({ oczka: w.p4, na: '4in' }))).toEqual(zTresci(w.oczekiwane));
    });
  });
  test(`BR-KAL-008 RD-10 liczność: wykonano ${wektory.length} z ${wektory.length} wektorów 4 in (pusty zbiór = porażka)`, () => {
    expect(wektory.length).toBe(88);
    licznik.wynik(wektory.length);
  });
});

describe('BR-KAL-003 BR-KAL-008 klasyfikujGrubosc: wektory treści „klasyfikacja_10cm” (P-081 P3a + P-084)', () => {
  const wektory = WEKTORY_TRESCI.klasyfikacja_10cm;
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`BR-KAL-008 BR-KAL-003/S1 RD-10 ${w.id} ${w.p10} o./10 cm (= ${w.p4_dokladnie} o./4 in) → ${w.oczekiwane.wynik}${w.oczekiwane.kategorie ? ' ' + w.oczekiwane.kategorie.join(',') : ''}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      expect(jakoZbior(klasyfikujGrubosc({ oczka: w.p10, na: '10cm' }))).toEqual(zTresci(w.oczekiwane));
    });
  });
  test(`BR-KAL-008 RD-10 liczność: wykonano ${wektory.length} z ${wektory.length} wektorów 10 cm (pusty zbiór = porażka)`, () => {
    expect(wektory.length).toBe(18);
    licznik.wynik(wektory.length);
  });
});

describe('RD-10 klasyfikujGrubosc: wektory BRD (kształt po P-097 1a: wynik + kategorie)', () => {
  // NZ-05-01 (08): brd.json podaje `wynik [-]` i zbiór `kategorie [-]` (tablica albo null); W2 = {2, 3} wprost (ER-34, ER-39 zamknięte).
  // Pola `p4Zaokraglone` i `polowka` sprawdzają wektory treści wyżej (88 + 18), tu wynik i zbiór kategorii.
  const wektory = wektoryReguly('RD-10');
  const licznik = licznikWektorow();
  const WYNIK: Record<string, Klasyfikacja['wynik']> = { kategorie: 'kategorie', 'między kategoriami': 'miedzy', 'poza tabelą': 'powyzej_tabeli', [BLAD_DANYCH]: 'blad_danych' };
  test.each(wektory.map((w) => [`${w.id === 'RD-10-W2' ? 'BR-KAL-008/S1' : 'BR-KAL-008'} ${w.id} (${w.rodzaj}) P=${w.wejscie['P [o./4 in]']} o./4 in`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      const p = Number(w.wejscie['P [o./4 in]']);
      const wynik = WYNIK[String(w.oczekiwane['wynik [-]'])];
      if (!wynik) throw new Error(`RD-10: nieznany wynik ${String(w.oczekiwane['wynik [-]'])}`);
      const k = w.oczekiwane['kategorie [-]'];
      const oczek = Array.isArray(k) ? { wynik, kategorie: k.map(Number).sort(rosnaco) } : { wynik };
      const r = jakoZbior(klasyfikujGrubosc({ oczka: p, na: '4in' }));
      expect(r).toMatchObject(oczek);
      // F07-03: `kategorie [-]` = null w wektorze → wynik bez kategorii (toMatchObject przepuszczał nadmiarowe pole).
      if (!Array.isArray(k)) expect('kategorie' in r).toBe(false);
      // F07-03, P-084 (D1b): całkowite P zaokrągla się do siebie, bez połówki (W1 = 18, W4 = 41 nie ma w wektorach treści 06).
      if (Number.isInteger(p) && (wynik === 'kategorie' || wynik === 'powyzej_tabeli')) expect(r).toMatchObject({ p4Zaokraglone: p, polowka: false });
    });
  });
  test(`RD-10 liczność: wykonano ${wektory.length} z ${wektory.length} wektorów (pusty zbiór = porażka)`, () => {
    expect(wektory.length).toBe(14); // W7–W14 dopisane przez 01 (P-084, ER-31, ER-34)
    licznik.wynik(wektory.length);
  });
});

/** „błąd danych” rozmiaru (mm ≤ 0): sygnatura `string | null` nie ma błędu (brakująca sygnatura, raport E3) — nigdy oznaczenie US. */
function oczekujBleduRozmiaru(fn: () => string | null): void {
  const r = wywolaj(fn);
  if (!r.rzucil) expect(typeof r.wynik).not.toBe('string');
}

for (const [klucz, narzedzie] of [['druty', 'druty'], ['szydelka', 'szydelko']] as const) {
  describe(`RD-11 rozmiarUS: wektory treści „${klucz}” (P-086 Q3b: brak oznaczenia = null, bez najbliższej wartości)`, () => {
    const wektory = WEKTORY_TRESCI[klucz];
    const licznik = licznikWektorow();
    test.each(wektory.map((w) => [`RD-11 ${w.id} ${narzedzie} ${w.mm} mm → ${w.oczekiwane_us === null ? 'brak' : w.oczekiwane_us}`, w] as const))('%s', (_n, w) => {
      licznik.sprawdz(() => {
        if (w.oczekiwane_us === BLAD_DANYCH) oczekujBleduRozmiaru(() => rozmiarUS(w.mm, narzedzie));
        else expect(rozmiarUS(w.mm, narzedzie)).toBe(w.oczekiwane_us);
      });
    });
    test(`RD-11 liczność: wykonano ${wektory.length} z ${wektory.length} wektorów ${klucz} (pusty zbiór = porażka)`, () => {
      expect(wektory.length).toBe(klucz === 'druty' ? 31 : 30);
      licznik.wynik(wektory.length);
    });
  });
}

describe('RD-11 rozmiarUS: wektory BRD (druty)', () => {
  const wektory = wektoryReguly('RD-11');
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`RD-11 ${w.id} (${w.rodzaj}) ${w.wejscie['d [mm]']} mm → ${w.oczekiwane['US [-]']}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      const mm = Number(w.wejscie['d [mm]']);
      const o = w.oczekiwane['US [-]'];
      if (o === BLAD_DANYCH) oczekujBleduRozmiaru(() => rozmiarUS(mm, 'druty'));
      else expect(rozmiarUS(mm, 'druty')).toBe(o === 'brak' ? null : String(o));
    });
  });
  test(`RD-11 liczność: wykonano ${wektory.length} z ${wektory.length} wektorów (pusty zbiór = porażka)`, () => {
    expect(wektory.length).toBe(7); // W5–W7 (zaokrąglenie do 0,001 mm) dopisane przez 01
    licznik.wynik(wektory.length);
  });
});
