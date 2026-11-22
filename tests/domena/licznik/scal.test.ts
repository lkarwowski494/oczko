// Scalanie zdarzeń licznika z wielu źródeł (NFR-DAN-003, ADR-0005/0008/0009) — poziom domena-Node.
// Wyrocznia: docs/architektura/eksperymenty/e1/scal-wektory.json (M-01–M-08; prototyp scal.mjs NIE jest wyrocznią),
// scenariusze BRD (BR-LIC-002, BR-LIC-014, BR-LIC-017: wartości w scenariuszu), ryzyka R-018, R-036, R-037, R-038, R-039
// (docs/jakosc/e1-ryzyka.md) i zgłoszenie Z07-13. Konflikt porównywany PO GŁOWACH (mapa głowa → wartość, SC-13), nie jako
// posortowane wartości. Zbiory (`glowy`, `brakujacy`) porównywane jako zbiory, a wynik dla permutacji wejścia — w całości (R-038).
import fc from 'fast-check';
import { scal } from '../../../src/domena/scal';
import type { ZdarzenieLicznika, WynikScalenia } from '../../../src/domena/scal';
import wektoryJson from '../../../docs/architektura/eksperymenty/e1/scal-wektory.json';
import { licznikWektorow, wywolaj, opcjeWlasnosci } from '../../narzedzia/akceptacja';

const L = 'licznik-1';
type ZdarzenieWektora = { id: string; rodzaj: string; wartosc?: number; rodzice: string[]; cofa?: string[] };
type WektorScalenia = { id: string; opis: string; zdarzenia: ZdarzenieWektora[]; oczekiwane: { stan: string; wartosc?: number; wartosci?: number[]; kandydaci?: Record<string, number>; powod?: string; id?: string } };
const WEKTORY = wektoryJson as unknown as WektorScalenia[];

/** Zdarzenie wektora → typ domeny (wektory nie podają `licznik`; `cofa` z M-08 zostaje jako pole dodatkowe). */
function zdarzenia(lista: ZdarzenieWektora[]): ZdarzenieLicznika[] {
  return lista.map((z) => ({ licznik: L, ...z }) as unknown as ZdarzenieLicznika);
}
/** Głowy z definicji (ADR-0005): zdarzenia, których nikt nie wskazuje jako rodzica — policzone w teście, nie przez scal. */
function glowyZDanych(lista: { id: string; rodzice: string[] }[]): string[] {
  const rodzice = new Set(lista.flatMap((z) => z.rodzice));
  return [...new Set(lista.map((z) => z.id))].filter((id) => !rodzice.has(id)).sort();
}
/** Postać do porównania zbiorów: posortowane głowy, brakujący i kandydaci według głowy. */
function jakoZbiory(w: WynikScalenia): WynikScalenia {
  if (w.stan === 'zgodny') return { ...w, glowy: [...w.glowy].sort() };
  if (w.stan === 'czeka') return { ...w, brakujacy: [...new Set(w.brakujacy)].sort() };
  if (w.stan === 'blad') return w;
  return { ...w, glowy: [...w.glowy].sort(), kandydaci: [...w.kandydaci].sort((a, b) => a.glowa.localeCompare(b.glowa)) };
}

function brakujacyJakoZbior(w: WynikScalenia): WynikScalenia {
  return w.stan === 'czeka' ? { ...w, brakujacy: [...new Set(w.brakujacy)].sort() } : w;
}

/**
 * Przypisanie wartości do głowy w wektorach konfliktu (SC-13). Wektor podaje tylko zbiór wartości; przypisanie wynika
 * z opisu wektora: M-04 „zegarek … i telefon równolegle od tej samej wartości”: a = wpisanie 10; t1 (telefon) = 10 + 1;
 * z1 → z2 (zegarek) = 10 + 2. Test sprawdza też, że przypisanie zgadza się ze zbiorem wartości z wektora.
 */
const KANDYDACI: Record<string, Record<string, number>> = { 'M-04': { t1: 11, z2: 12 } };
// NZ-05-04 (08, partia 1): wektory 05 podają mapę `kandydaci` w `oczekiwane` (M-04, M-10b, M-16) — ona ma pierwszeństwo; M-04 zgodna z mapą wyżej.

describe('NFR-DAN-003 scal: wektory M-01–M-20 (scal-wektory.json)', () => {
  const licznik = licznikWektorow();
  test.each(WEKTORY.map((w) => [`NFR-DAN-003 ${w.id} ${w.opis} → ${w.oczekiwane.stan}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      const wejscie = zdarzenia(w.zdarzenia);
      const wynik = scal(wejscie);
      if (w.oczekiwane.stan === 'zgodny') {
        expect(jakoZbiory(wynik)).toEqual({ stan: 'zgodny', wartosc: w.oczekiwane.wartosc, glowy: glowyZDanych(w.zdarzenia) });
      } else if (w.oczekiwane.stan === 'czeka') {
        const znane = new Set(w.zdarzenia.map((z) => z.id));
        const brakujacy = [...new Set(w.zdarzenia.flatMap((z) => z.rodzice).filter((r) => !znane.has(r)))].sort();
        expect(brakujacy.length).toBeGreaterThan(0);
        expect(jakoZbiory(wynik)).toEqual({ stan: 'czeka', brakujacy });
      } else if (w.oczekiwane.stan === 'blad') {
        // Z07-13 (moduly.md „Scalanie”): błąd danych z powodem; `id` = najmniejsze winne (wektor go nie podaje).
        expect(wynik).toMatchObject({ stan: 'blad', powod: w.oczekiwane.powod, ...(w.oczekiwane.id ? { id: w.oczekiwane.id } : {}) }); // id winnego, gdy wektor je podaje (05 fix-2)
      } else {
        const mapa = w.oczekiwane.kandydaci ?? KANDYDACI[w.id];
        if (w.oczekiwane.kandydaci && KANDYDACI[w.id]) expect(w.oczekiwane.kandydaci).toEqual(KANDYDACI[w.id]);
        if (!mapa) throw new Error(`Wektor konfliktu ${w.id} bez przypisania głowa → wartość w teście (SC-13)`);
        expect(Object.values(mapa).sort((a, b) => a - b)).toEqual([...(w.oczekiwane.wartosci ?? [])].sort((a, b) => a - b));
        expect(Object.keys(mapa).sort()).toEqual(glowyZDanych(w.zdarzenia));
        expect(jakoZbiory(wynik)).toEqual({
          stan: 'konflikt',
          glowy: Object.keys(mapa).sort(),
          kandydaci: Object.entries(mapa).map(([glowa, wartosc]) => ({ glowa, wartosc })).sort((a, b) => a.glowa.localeCompare(b.glowa)),
        });
      }
    });
  });
  test(`NFR-DAN-003 liczność: wykonano ${WEKTORY.length} z ${WEKTORY.length} wektorów M-* (pusty zbiór = porażka)`, () => {
    // NZ-05-04: lista po fixie 05 (Z07-11, Z07-13, ER-41, ER-42); brak albo nadmiar wektora = porażka.
    expect(WEKTORY.map((w) => w.id)).toEqual(['M-01', 'M-02', 'M-03', 'M-04', 'M-05', 'M-06', 'M-07', 'M-07b', 'M-08', 'M-08b', 'M-09', 'M-10', 'M-10b', 'M-12', 'M-13', 'M-14', 'M-15', 'M-16', 'M-17', 'M-18', 'M-19', 'M-20']); // M-18–M-20: P-118 W1, P-119
    licznik.wynik(WEKTORY.length);
  });
});

describe('BR-LIC-002, BR-LIC-014, BR-LIC-017: scenariusze licznika jako zdarzenia (wartości w scenariuszu)', () => {
  const p = (id: string, rodzic: string): ZdarzenieLicznika => ({ id, licznik: L, rodzaj: 'plus', rodzice: [rodzic] });
  const w = (id: string, wartosc: number, rodzice: string[] = []): ZdarzenieLicznika => ({ id, licznik: L, rodzaj: 'wpisanie', wartosc, rodzice });

  test('BR-LIC-002/S1 licznik 41, dodanie rzędu → 42', () => {
    expect(scal([w('a', 41), p('b', 'a')])).toEqual({ stan: 'zgodny', wartosc: 42, glowy: ['b'] });
  });
  test('BR-LIC-002/S2 licznik 42, odjęcie przy pruciu → 41', () => {
    expect(scal([w('a', 42), { id: 'b', licznik: L, rodzaj: 'minus', rodzice: ['a'] }])).toEqual({ stan: 'zgodny', wartosc: 41, glowy: ['b'] });
  });
  test('BR-LIC-002/S3 licznik 0, odjęcie → nadal 0 (M-06, granica zera)', () => {
    expect(scal([w('a', 0), { id: 'b', licznik: L, rodzaj: 'minus', rodzice: ['a'] }])).toEqual({ stan: 'zgodny', wartosc: 0, glowy: ['b'] });
  });
  test('BR-LIC-014/S1 licznik 22, dodanie rzędu z ekranu blokady → 23 w aplikacji', () => {
    expect(scal([w('g', 22), p('l1', 'g')])).toEqual({ stan: 'zgodny', wartosc: 23, glowy: ['l1'] });
  });
  test('BR-LIC-017/S1 wpisanie 57 przy przeniesieniu robótki, następne dodanie → 58', () => {
    expect(scal([w('a', 57), p('b', 'a')])).toEqual({ stan: 'zgodny', wartosc: 58, glowy: ['b'] });
  });
  test('BR-LIC-017/S2 licznik 30, wpisanie 35, cofnięcie wpisania z historii → 30', () => {
    const z: ZdarzenieLicznika[] = [w('a', 30), w('b', 35, ['a']), { id: 'u', licznik: L, rodzaj: 'cofniecie', wartosc: 30, rodzice: ['b'], cofa: ['b'] } as ZdarzenieLicznika];
    expect(scal(z)).toEqual({ stan: 'zgodny', wartosc: 30, glowy: ['u'] });
  });
  test('BR-LIC-017/S6 licznik 42, zerowanie → 0, cofnięcie zerowania → 42', () => {
    const z: ZdarzenieLicznika[] = [w('a', 42), { id: 'b', licznik: L, rodzaj: 'zerowanie', rodzice: ['a'] }];
    expect(scal(z)).toEqual({ stan: 'zgodny', wartosc: 0, glowy: ['b'] });
    const zc = [...z, { id: 'u', licznik: L, rodzaj: 'cofniecie', wartosc: 42, rodzice: ['b'], cofa: ['b'] } as ZdarzenieLicznika];
    expect(scal(zc)).toEqual({ stan: 'zgodny', wartosc: 42, glowy: ['u'] });
  });
});

describe('R-018 BR-LIC-014 k stuknięć od głowy G z łańcuchowaniem rodziców → zgodny G + k (zachowanie docelowe, Z07-11 (1))', () => {
  /** Stuknięcia ekranu blokady: pierwsze ma rodzica G, każde następne — poprzednie stuknięcie (wektor M-10 z Z07-11). */
  function stukniecia(g: number, k: number): ZdarzenieLicznika[] {
    const z: ZdarzenieLicznika[] = [{ id: 'g', licznik: L, rodzaj: 'wpisanie', wartosc: g, rodzice: [] }];
    for (let i = 1; i <= k; i += 1) z.push({ id: `l${i}`, licznik: L, rodzaj: 'plus', rodzice: [i === 1 ? 'g' : `l${i - 1}`] });
    return z;
  }
  test('R-018 BR-LIC-014 trzy stuknięcia od 22 (łańcuch g → l1 → l2 → l3) → zgodny 25, głowa l3', () => {
    expect(scal(stukniecia(22, 3))).toEqual({ stan: 'zgodny', wartosc: 25, glowy: ['l3'] });
  });
  test('R-018 własność: dla G ∈ [0, 1000], k ∈ [1, 50] → zgodny G + k z jedną głową', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), fc.integer({ min: 1, max: 50 }), (g, k) => {
        expect(scal(stukniecia(g, k))).toEqual({ stan: 'zgodny', wartosc: g + k, glowy: [`l${k}`] });
      }),
      opcjeWlasnosci(),
    );
  });
});

describe('R-036 NFR-DAN-003 długa historia bez przepełnienia stosu (Z07-13: scal iteracyjne)', () => {
  test('R-036 łańcuch 150 000 zdarzeń plus → zgodny 150 000, jedna głowa (bez „Maximum call stack size exceeded”)', () => {
    const N = 150_000;
    const z: ZdarzenieLicznika[] = new Array(N);
    for (let i = 0; i < N; i += 1) z[i] = { id: `e${i}`, licznik: L, rodzaj: 'plus', rodzice: i === 0 ? [] : [`e${i - 1}`] };
    expect(scal(z)).toEqual({ stan: 'zgodny', wartosc: N, glowy: [`e${N - 1}`] });
  });
});

describe('R-037 M-09 NFR-DAN-003 plus z dwoma rodzicami nie gubi gałęzi', () => {
  test('NFR-DAN-003 R-037 M-09: M-04 + plus z rodzicami [t1, z2] → nie „zgodny” (konflikt pokazany albo odrzucenie; [DO USTALENIA] 05, Z07-13)', () => {
    // Miara NFR-DAN-003: wartość inna niż ostatnia na którymkolwiek urządzeniu bez pokazania konfliktu = błąd.
    // rodzice[0] → 12 (gubi zegarek), suma → 14 (żadne urządzenie nie pokazało 14) — obie bez konfliktu łamią miarę.
    const m04 = WEKTORY.find((w) => w.id === 'M-04');
    if (!m04) throw new Error('brak wektora M-04');
    const z = [...zdarzenia(m04.zdarzenia), { id: 'p', licznik: L, rodzaj: 'plus', rodzice: ['t1', 'z2'] } as ZdarzenieLicznika];
    for (const wejscie of [z, [...z].reverse()]) {
      const r = wywolaj(() => scal(wejscie));
      if (!r.rzucil) expect(r.wynik.stan).not.toBe('zgodny');
    }
  });
});

describe('R-039 NFR-DAN-003 złe dane nie dają cichego „zgodny” (Z07-13; klasa błędu [DO USTALENIA] 05)', () => {
  const przypadki: [string, ZdarzenieLicznika[]][] = [
    ['nieznany rodzaj „plsu”', [{ id: 'a', licznik: L, rodzaj: 'plus', rodzice: [] }, { id: 'b', licznik: L, rodzaj: 'plsu' as unknown as 'plus', rodzice: ['a'] }]],
    ['cykl a ↔ b', [{ id: 'a', licznik: L, rodzaj: 'plus', rodzice: ['b'] }, { id: 'b', licznik: L, rodzaj: 'plus', rodzice: ['a'] }]],
    ['zdarzenie jest własnym rodzicem', [{ id: 'a', licznik: L, rodzaj: 'plus', rodzice: ['a'] }]],
    ['kolizja id: „b” jako plus i jako minus', [{ id: 'a', licznik: L, rodzaj: 'wpisanie', wartosc: 5, rodzice: [] }, { id: 'b', licznik: L, rodzaj: 'plus', rodzice: ['a'] }, { id: 'b', licznik: L, rodzaj: 'minus', rodzice: ['a'] }]],
  ];
  test.each(przypadki)('NFR-DAN-003 R-039 %s → wynik ≠ zgodny (błąd albo „czeka”), w obu kolejnościach wejścia', (_n, z) => {
    for (const wejscie of [z, [...z].reverse()]) {
      const r = wywolaj(() => scal(wejscie));
      if (!r.rzucil) expect(r.wynik.stan).not.toBe('zgodny');
    }
  });
});

// Generator poprawnej historii jednego licznika: DAG z jednym rodzicem dla zmian i ≥ 2 rodzicami tylko dla rozstrzygnięcia.
const historia = fc.integer({ min: 1, max: 25 }).chain((n) =>
  fc.tuple(
    ...Array.from({ length: n }, (_, i) =>
      fc.record({
        rodzaj: fc.constantFrom('plus', 'plus', 'plus', 'minus', 'wpisanie', 'zerowanie', 'rozstrzygniecie'),
        wartosc: fc.integer({ min: 0, max: 100 }),
        r1: fc.integer({ min: 0, max: Math.max(0, i - 1) }),
        r2: fc.integer({ min: 0, max: Math.max(0, i - 1) }),
        korzen: fc.boolean(),
      }).map(({ rodzaj, wartosc, r1, r2, korzen }): ZdarzenieLicznika => {
        const id = `e${String(i).padStart(2, '0')}`;
        if (i === 0) return rodzaj === 'wpisanie' ? { id, licznik: L, rodzaj, wartosc, rodzice: [] } : { id, licznik: L, rodzaj: 'plus', rodzice: [] };
        if (rodzaj === 'rozstrzygniecie') return r1 !== r2 ? { id, licznik: L, rodzaj, wartosc, rodzice: [`e${String(r1).padStart(2, '0')}`, `e${String(r2).padStart(2, '0')}`] } : { id, licznik: L, rodzaj: 'plus', rodzice: [`e${String(r1).padStart(2, '0')}`] };
        if (rodzaj === 'wpisanie') return { id, licznik: L, rodzaj, wartosc, rodzice: korzen ? [] : [`e${String(r1).padStart(2, '0')}`] };
        return { id, licznik: L, rodzaj: rodzaj as 'plus' | 'minus' | 'zerowanie', rodzice: [`e${String(r1).padStart(2, '0')}`] };
      }),
    ),
  ),
);
/** Przodkowie zdarzenia (z nim samym) — wejście dla wartości kandydata (SC-13: wartość = scal(przodkowie(głowa))). */
function przodkowie(lista: ZdarzenieLicznika[], id: string): ZdarzenieLicznika[] {
  const mapa = new Map(lista.map((z) => [z.id, z]));
  const wynik = new Map<string, ZdarzenieLicznika>();
  const stos = [id];
  while (stos.length) {
    const x = stos.pop() as string;
    const z = mapa.get(x);
    if (!z || wynik.has(x)) continue;
    wynik.set(x, z);
    stos.push(...z.rodzice);
  }
  return [...wynik.values()];
}

describe('R-038 NFR-DAN-003 własności scal (fast-check, 100 przypadków, DS-03)', () => {
  test('R-038 NFR-DAN-003 dowolna permutacja i duplikaty dostarczeń (także przy brakujących zdarzeniach) → ten sam wynik (głowy i kandydaci w tej samej kolejności, brakujący jako zbiór)', () => {
    fc.assert(
      fc.property(
        historia.chain((h) =>
          fc.record({
            baza: fc.subarray(h, { minLength: 1 }),
            duplikaty: fc.array(fc.integer({ min: 0, max: h.length - 1 }), { maxLength: 10 }),
          }).chain(({ baza, duplikaty }) => {
            const wszystkie = [...baza, ...duplikaty.map((i) => baza[i % baza.length])];
            return fc.record({ baza: fc.constant(baza), dostarczenia: fc.shuffledSubarray(wszystkie, { minLength: wszystkie.length }) });
          }),
        ),
        ({ baza, dostarczenia }) => {
          // Głowy i kandydaci w tej samej kolejności na każdym urządzeniu (R-038: wybór kandydata z listy); `brakujacy` to zbiór.
          expect(brakujacyJakoZbior(scal(dostarczenia))).toEqual(brakujacyJakoZbior(scal(baza)));
        },
      ),
      opcjeWlasnosci(),
    );
  });

  test('R-038 SC-13 NFR-DAN-003 konflikt: głowy = zdarzenia bez dzieci, a wartość kandydata = scal(przodkowie(głowa)) (zgodny)', () => {
    let konfliktow = 0;
    fc.assert(
      fc.property(historia, (h) => {
        const w = scal(h);
        expect(w.stan).not.toBe('czeka'); // historia z generatora jest kompletna
        if (w.stan === 'zgodny') {
          expect([...w.glowy].sort()).toEqual(glowyZDanych(h));
          return;
        }
        if (w.stan !== 'konflikt') return;
        konfliktow += 1;
        expect([...w.glowy].sort()).toEqual(glowyZDanych(h));
        expect(w.kandydaci.map((k) => k.glowa).sort()).toEqual(glowyZDanych(h));
        for (const k of w.kandydaci) {
          const sam = scal(przodkowie(h, k.glowa));
          expect(sam).toEqual({ stan: 'zgodny', wartosc: k.wartosc, glowy: [k.glowa] });
        }
      }),
      opcjeWlasnosci(),
    );
    expect(konfliktow).toBeGreaterThan(0); // generator musi dawać konflikty, inaczej własność nic nie sprawdza
  });
});
