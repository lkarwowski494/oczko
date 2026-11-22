// RD-16 dzień zmiany w strefie urządzenia (BR-DNI-002/S2, F-59; P-048 (2)) — poziom domena-Node.
// Wyrocznia: tests/wektory/brd.json RD-16-W1…W6 oraz Intl.DateTimeFormat z kalendarzem gregoriańskim i cyframi łacińskimi
// (`en-US-u-ca-gregory-nu-latn`), niezależnie od kodu. Strefy: jedna lista DS-09 (tests/narzedzia/strefy.ts); przejścia czasu
// wyliczane `przejsciaCzasu` dla roku bieżącego i następnego (plus 2026–2027 dla powtarzalności), nie wpisane datami (ER-37, R-133).
// Format `dzien`: ^\d{4}-\d{2}-\d{2}$ w ASCII także przy języku urządzenia ja-JP-u-ca-japanese i ar-EG (R-134, ER-37).
// Strefa procesu ustawiona na Pacific/Kiritimati (+14): dzień ma zależeć od parametru `strefa`, nie od strefy procesu (R-133).
import fc from 'fast-check';
import { dzienLokalny } from '../../../src/domena/postep';
import { przejsciaCzasu } from '../../narzedzia/czas';
import { STREFY_TESTOWE } from '../../narzedzia/strefy';
import { wektoryReguly, licznikWektorow, BLAD_DANYCH, opcjeWlasnosci, DOBA } from '../../narzedzia/akceptacja';

const OrygDTF = Intl.DateTimeFormat;
const wyroczniaF = new Map<string, Intl.DateTimeFormat>();
/** Dzień lokalny RRRR-MM-DD z Intl (gregoriański, cyfry łacińskie) — wyrocznia niezależna od implementacji. */
function dzienWyrocznia(ms: number, strefa: string): string {
  let f = wyroczniaF.get(strefa);
  if (!f) wyroczniaF.set(strefa, (f = new OrygDTF('en-US-u-ca-gregory-nu-latn', { timeZone: strefa, year: 'numeric', month: '2-digit', day: '2-digit' })));
  const c = Object.fromEntries(f.formatToParts(new Date(ms)).map((p) => [p.type, p.value]));
  return `${c.year.padStart(4, '0')}-${c.month}-${c.day}`;
}
/** Pierwsza sekunda lokalnego dnia `dzien` w strefie (bisekcja po sekundach; dzień lokalny rośnie z czasem w strefach DS-09). */
function polnocLokalna(dzien: string, strefa: string): number {
  const [y, m, d] = dzien.split('-').map(Number);
  let lo = Date.UTC(y, m - 1, d) / 1000 - 16 * 3600;
  let hi = Date.UTC(y, m - 1, d) / 1000 + 16 * 3600;
  if (!(dzienWyrocznia(lo * 1000, strefa) < dzien && dzienWyrocznia(hi * 1000, strefa) >= dzien)) throw new Error(`bisekcja: ${dzien} ${strefa}`);
  while (hi - lo > 1) {
    const s = Math.floor((lo + hi) / 2);
    if (dzienWyrocznia(s * 1000, strefa) >= dzien) hi = s;
    else lo = s;
  }
  return hi * 1000;
}
function nastepnyDzien(dzien: string): string {
  const [y, m, d] = dzien.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + DOBA).toISOString().slice(0, 10);
}

let tzProcesu: string | undefined;
beforeAll(() => {
  tzProcesu = process.env.TZ;
  process.env.TZ = 'Pacific/Kiritimati';
});
afterAll(() => {
  if (tzProcesu === undefined) delete process.env.TZ;
  else process.env.TZ = tzProcesu;
});

describe('RD-16 dzienLokalny: wektory BRD', () => {
  const wektory = wektoryReguly('RD-16');
  const licznik = licznikWektorow();
  test.each(wektory.map((w) => [`${w.id === 'RD-16-W1' ? 'BR-DNI-002/S2' : 'BR-DNI-002'} ${w.id} (${w.rodzaj}) ${w.wejscie['chwila [UTC]']} ${w.wejscie['strefa [IANA]']}`, w] as const))('%s', (_n, w) => {
    licznik.sprawdz(() => {
      const chwila = String(w.wejscie['chwila [UTC]']);
      const ms = chwila === 'brak' ? NaN : Date.parse(chwila);
      const wynik = dzienLokalny(ms, String(w.wejscie['strefa [IANA]']));
      const o = w.oczekiwane['dzień [data]'];
      if (o === BLAD_DANYCH) expect(wynik).toEqual({ ok: false, powod: 'bledne_dane' });
      else expect(wynik).toEqual({ ok: true, wartosc: o });
    });
  });
  test(`RD-16 liczność: wykonano ${wektory.length} z ${wektory.length} wektorów (pusty zbiór = porażka)`, () => {
    expect(wektory.length).toBe(26); // W7–W26 dopisane przez 01 (ER-37, NZ-05-01); ten sam kształt, region nie wpływa na wynik
    licznik.wynik(wektory.length);
  });
});

type Przypadek = { nazwa: string; ms: number; strefa: string; oczekiwane: string };
const rokBiezacy = new Date().getUTCFullYear(); // DS-09: rok bieżący i następny (tylko wybór lat, bez asercji na czas zegarowy)
const LATA = [...new Set([2026, 2027, rokBiezacy, rokBiezacy + 1])].sort();
function przypadkiStrefy(strefa: string, rok: number): { przypadki: Przypadek[]; przejsc: number } {
  const przypadki: Przypadek[] = [];
  const dodaj = (opis: string, ms: number) => przypadki.push({ nazwa: `${strefa} ${rok} ${opis} ${new Date(ms).toISOString()}`, ms, strefa, oczekiwane: dzienWyrocznia(ms, strefa) });
  const p = przejsciaCzasu(strefa, rok);
  const dni = new Set([`${rok}-01-01`, `${rok}-07-01`]);
  for (const x of p) {
    const t = Date.parse(x.utc);
    dodaj(`minuta przed przejściem ${x.przedMin}→${x.poMin}`, t - 60_000);
    dodaj(`chwila przejścia ${x.przedMin}→${x.poMin}`, t);
    dodaj(`minuta po przejściu ${x.przedMin}→${x.poMin}`, t + 60_000);
    const d = dzienWyrocznia(t, strefa);
    dni.add(d);
    dni.add(nastepnyDzien(d));
  }
  for (const d of [...dni].sort()) {
    const m = polnocLokalna(d, strefa);
    dodaj(`sekunda przed północą lokalną ${d}`, m - 1000);
    dodaj(`północ lokalna ${d} (włącznie, nowy dzień)`, m);
    dodaj(`sekunda po północy lokalnej ${d}`, m + 1000);
  }
  return { przypadki, przejsc: p.length };
}

describe('RD-16 R-133 ER-37 strefy DS-09: przejścia czasu i północ lokalna (wyrocznia Intl, gregoriański)', () => {
  const zestaw = STREFY_TESTOWE.flatMap((s) => LATA.map((r) => ({ s, r, ...przypadkiStrefy(s, r) })));
  const przypadki = zestaw.flatMap((z) => z.przypadki);
  const licznik = licznikWektorow();
  test.each(przypadki.map((p) => [`RD-16 R-133 ${p.nazwa} → ${p.oczekiwane}`, p] as const))('%s', (_n, p) => {
    licznik.sprawdz(() => {
      expect(dzienLokalny(p.ms, p.strefa)).toEqual({ ok: true, wartosc: p.oczekiwane });
    });
  });
  test('RD-16 R-133 zbiór przypadków niepusty i ze zmianami czasu: Warszawa, Los Angeles, Lord Howe mają przejścia w każdym roku [ZIELONY-OK: kontrola generatora przypadków, nie zachowanie]', () => {
    for (const s of ['Europe/Warsaw', 'America/Los_Angeles', 'Australia/Lord_Howe'])
      for (const r of LATA) expect(zestaw.find((z) => z.s === s && z.r === r)?.przejsc).toBe(2);
    expect(przypadki.length).toBeGreaterThan(100);
  });
  test(`RD-16 R-133 liczność: wykonano ${przypadki.length} z ${przypadki.length} przypadków stref (pusty zbiór = porażka)`, () => {
    licznik.wynik(przypadki.length);
  });
});

/** Język i kalendarz urządzenia: domyślny locale Intl i Date#toLocale* bez podanego języka (symulacja ustawień regionu). */
function ustawJezykUrzadzenia(locale: string): () => void {
  const intl = Intl as unknown as { DateTimeFormat: unknown };
  const proto = Date.prototype as unknown as Record<string, (l?: unknown, o?: unknown) => string>;
  const metody = ['toLocaleDateString', 'toLocaleString', 'toLocaleTimeString'] as const;
  const stare = metody.map((m) => proto[m]);
  const brak = (l: unknown) => l === undefined || (Array.isArray(l) && l.length === 0);
  const Podmiana = function (l?: string | string[], o?: Intl.DateTimeFormatOptions) {
    return new OrygDTF(brak(l) ? locale : l, o);
  } as unknown as { prototype: unknown; supportedLocalesOf: unknown };
  Podmiana.prototype = OrygDTF.prototype;
  Podmiana.supportedLocalesOf = OrygDTF.supportedLocalesOf;
  intl.DateTimeFormat = Podmiana;
  metody.forEach((m, i) => {
    proto[m] = function (this: Date, l?: unknown, o?: unknown) {
      return stare[i].call(this, brak(l) ? locale : l, o);
    };
  });
  return () => {
    intl.DateTimeFormat = OrygDTF;
    metody.forEach((m, i) => (proto[m] = stare[i]));
  };
}

describe('RD-16 R-134 ER-37 format dnia niezależny od języka i kalendarza urządzenia', () => {
  const ASCII_DZIEN = /^\d{4}-\d{2}-\d{2}$/;
  test('RD-16 R-134 symulacja języka działa: domyślny Intl daje erę japońską i cyfry arabskie [ZIELONY-OK: kontrola narzędzia testu, nie zachowanie]', () => {
    let przywroc = ustawJezykUrzadzenia('ja-JP-u-ca-japanese');
    try {
      expect(new Intl.DateTimeFormat(undefined, { timeZone: 'Asia/Tokyo', year: 'numeric' }).resolvedOptions().calendar).toBe('japanese');
    } finally {
      przywroc();
    }
    przywroc = ustawJezykUrzadzenia('ar-EG');
    try {
      expect(new Date(0).toLocaleDateString(undefined, { timeZone: 'UTC' })).not.toMatch(/[0-9]/);
    } finally {
      przywroc();
    }
  });

  for (const locale of ['ja-JP-u-ca-japanese', 'ar-EG']) {
    describe(`język urządzenia ${locale}`, () => {
      let przywroc: () => void = () => undefined;
      beforeEach(() => {
        przywroc = ustawJezykUrzadzenia(locale);
      });
      afterEach(() => przywroc());

      test.each(STREFY_TESTOWE.map((s) => [s] as const))(`RD-16 R-134 ${locale} %s: 2026-10-22T22:00:00Z → RRRR-MM-DD gregoriański, cyfry ASCII`, (s) => {
        const ms = Date.parse('2026-10-22T22:00:00Z');
        const w = dzienLokalny(ms, s);
        expect(w).toEqual({ ok: true, wartosc: dzienWyrocznia(ms, s) });
        if (w.ok) expect(w.wartosc).toMatch(ASCII_DZIEN);
      });

      test(`RD-16 R-134 ${locale} własność: dowolna chwila 1990–2100 i strefa DS-09 → ^\\d{4}-\\d{2}-\\d{2}$ (ASCII) = dzień gregoriański Intl`, () => {
        fc.assert(
          fc.property(fc.integer({ min: Date.UTC(1990, 0, 1), max: Date.UTC(2100, 0, 1) }), fc.constantFrom(...STREFY_TESTOWE), (ms, s) => {
            const w = dzienLokalny(ms, s);
            expect(w).toEqual({ ok: true, wartosc: dzienWyrocznia(ms, s) });
            if (w.ok) expect(w.wartosc).toMatch(ASCII_DZIEN);
          }),
          opcjeWlasnosci(),
        );
      });
    });
  }
});
