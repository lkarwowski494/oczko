// Własności reguły limitu i dostępu (fast-check 4.10.2, DS-03; strategia §3.7: fast-check wypisuje ziarno i ścieżkę przy porażce).
// Każda własność wynika z decyzji podanej w nazwie/komentarzu, nie z uruchomienia wzorca.
// Generator: listopad 2026 (+ dni z innych miesięcy i lat), daty bez powtórzeń (duplikaty: [DO USTALENIA], R-102, Z07-07).
import fc from 'fast-check';
import { startDnia, mozeZaczacDzien } from '../../../src/domena/limit';
import type { WejscieDnia, DzienLimitu } from '../../../src/domena/limit';
import { decyzja } from '../../../src/domena/dostep';
import type { Uprawnienie } from '../../../src/domena/dostep';
import { LIMIT_DNI_W_MIESIACU, PRZERWA_NOWEGO_DNIA_MS, PRODUKTY_PRO } from '../../../src/konfiguracja';
import { TERAZ, GODZ, DZIEN } from './pomocnicze';

const dd = (n: number) => String(n).padStart(2, '0');
const dataListopada = fc.integer({ min: 1, max: 30 }).map((d) => `2026-11-${dd(d)}`);
const dataInnegoMiesiaca = fc.oneof(
  fc.integer({ min: 1, max: 31 }).map((d) => `2026-10-${dd(d)}`),
  fc.integer({ min: 1, max: 31 }).map((d) => `2026-12-${dd(d)}`),
  fc.integer({ min: 1, max: 30 }).map((d) => `2025-11-${dd(d)}`), // ten sam miesiąc, inny rok (D2: miesiąc kalendarzowy)
  fc.integer({ min: 1, max: 30 }).map((d) => `2027-11-${dd(d)}`),
);
const dni = (data: fc.Arbitrary<string>) => fc.uniqueArray(fc.record({ data, pro: fc.boolean() }), { selector: (d) => d.data, maxLength: 12 });
const ostatniPlus = fc.option(fc.integer({ min: -2 * GODZ, max: 3 * GODZ }).map((r) => TERAZ - r), { nil: null });

const wejscieArb: fc.Arbitrary<WejscieDnia> = fc
  .record({ dni: dni(dataListopada), dzis: dataListopada, ostatniPlus, pro: fc.boolean(), limit: fc.option(fc.integer({ min: 1, max: 10 }), { nil: undefined }) })
  .map(({ limit, ...w }) => ({ ...w, teraz: TERAZ, ...(limit === undefined ? {} : { limit }) }));
// Domyślne ziarno fast-check (wypisywane przy porażce); `includeErrorInReport`: komunikat błędu (np. znacznik zaślepki) w raporcie.
const sprawdz = <T,>(p: fc.IProperty<T>) => fc.assert(p, { includeErrorInReport: true });
const efektywnyLimit = (w: WejscieDnia) => w.limit ?? LIMIT_DNI_W_MIESIACU;

describe('KP-12 własności startDnia (P-057 D2–D5)', () => {
  test('KP-12 własność: 0 ≤ zostalo ≤ limit w startDnia i mozeZaczacDzien (D2)', () => {
    sprawdz(fc.property(wejscieArb, (w) => {
      const s = startDnia(w).zostalo;
      const z = mozeZaczacDzien(w).zostalo;
      return s >= 0 && s <= efektywnyLimit(w) && z >= 0 && z <= efektywnyLimit(w);
    }));
  });

  test('KP-12 KP-15 własność: dzień już zapisany (dowolna flaga pro) zawsze dozwolony i bez ponownego zapisu (L-02, L-11, L-16)', () => {
    sprawdz(fc.property(wejscieArb, fc.boolean(), (w, proDnia) => {
      const zDzisiaj: WejscieDnia = { ...w, dni: [...w.dni.filter((d) => d.data !== w.dzis), { data: w.dzis, pro: proDnia }] };
      const r = startDnia(zDzisiaj);
      return r.dozwolone === true && r.zapis === null;
    }));
  });

  test('KP-12 własność: wynik zależy tylko od dni bieżącego miesiąca kalendarzowego (D2, L-05)', () => {
    sprawdz(fc.property(wejscieArb, dni(dataInnegoMiesiaca), (w, inne) => {
      const zInnymi: WejscieDnia = { ...w, dni: [...inne, ...w.dni] };
      expect(startDnia(zInnymi)).toEqual(startDnia(w));
      expect(mozeZaczacDzien(zInnymi)).toEqual(mozeZaczacDzien(w));
    }));
  });

  test('KP-12 własność: przerwa < 60 min od poprzedniego +1 (nie z przyszłości) → praca w toku, bez nowego dnia (D3, L-04, L-15)', () => {
    sprawdz(fc.property(wejscieArb, fc.integer({ min: 0, max: PRZERWA_NOWEGO_DNIA_MS - 1 }), (w, przerwa) => {
      const r = startDnia({ ...w, ostatniPlus: TERAZ - przerwa });
      return r.dozwolone === true && r.zapis === null;
    }));
  });

  test('KP-12 własność: zapis dnia tylko dla dziś, nieobecnego na liście, z flagą Pro z chwili startu (D5, KP-15 „jedna data = jeden dzień”)', () => {
    sprawdz(fc.property(wejscieArb, (w) => {
      const r = startDnia(w);
      if (r.zapis === null) return true;
      return r.dozwolone && r.zapis.data === w.dzis && r.zapis.pro === w.pro && !w.dni.some((d) => d.data === w.dzis);
    }));
  });

  test('KP-12 własność: Pro zawsze dozwolone (D1: Pro zdejmuje limit; L-10)', () => {
    sprawdz(fc.property(wejscieArb, (w) => startDnia({ ...w, pro: true }).dozwolone === true));
  });

  test('KP-12 własność: dni z Pro nie zmieniają decyzji o dniu bez Pro (D5, L-09)', () => {
    sprawdz(fc.property(wejscieArb, dni(dataListopada), (w, zPro) => {
      const dodatkowe: DzienLimitu[] = zPro.filter((d) => d.data !== w.dzis && !w.dni.some((x) => x.data === d.data)).map((d) => ({ data: d.data, pro: true }));
      expect(startDnia({ ...w, dni: [...w.dni, ...dodatkowe] })).toEqual(startDnia(w));
    }));
  });

  test('KP-12 KP-13 własność: startDnia i mozeZaczacDzien nie zmieniają wejścia (stan zawczasu bez zapisu)', () => {
    sprawdz(fc.property(wejscieArb, (w) => {
      const kopia = JSON.parse(JSON.stringify(w)) as WejscieDnia;
      startDnia(w);
      mozeZaczacDzien(w);
      expect(w).toEqual(kopia);
    }));
  });
});

describe('KP-13 własności mozeZaczacDzien (P-065 (1a), (2a))', () => {
  test('KP-13 własność: limitZawczasu ⇔ startDnia niedozwolone (ta sama reguła, odczyt bez zapisu; monetyzacja.md „Fix 2026-10-22”)', () => {
    sprawdz(fc.property(wejscieArb, (w) => mozeZaczacDzien(w).limitZawczasu === !startDnia(w).dozwolone));
  });

  test('KP-13 R-099 własność: przy Pro nigdy ostatniDarmowy ani limitZawczasu (P-065 (2a), D1)', () => {
    sprawdz(fc.property(wejscieArb, (w) => {
      const z = mozeZaczacDzien({ ...w, pro: true });
      return z.ostatniDarmowy === false && z.limitZawczasu === false;
    }));
  });
});

// Dostęp (KP-02, KP-06, W-05/W-08/W-14).
const produkt = fc.constantFrom(...PRODUKTY_PRO, 'oczko.napiwek');
const uprawnienie: fc.Arbitrary<Uprawnienie> = fc.record({
  produkt,
  wygasa: fc.option(fc.integer({ min: -30 * DZIEN, max: 30 * DZIEN }).map((r) => TERAZ + r), { nil: null }),
  odebrane: fc.boolean(),
});

describe('KP-06 własności decyzja (dostęp do Pro)', () => {
  test('KP-02 własność: uprawnienia odebrane (zwrot, Family Sharing) nigdy nie dają dostępu (W-05, W-14)', () => {
    sprawdz(fc.property(fc.array(uprawnienie, { maxLength: 4 }), (u) => {
      const tylkoOdebrane = u.map((x) => ({ ...x, odebrane: true }));
      return decyzja({ zrodlo: 'sklep', uprawnienia: tylkoOdebrane }, null, TERAZ, PRODUKTY_PRO).dostep === false;
    }));
  });

  test('KP-06 własność: produkt spoza listy odblokowujących nigdy nie daje dostępu (W-08)', () => {
    sprawdz(fc.property(fc.array(uprawnienie, { maxLength: 4 }), (u) => {
      const obce = u.map((x) => ({ ...x, produkt: 'oczko.napiwek', odebrane: false }));
      return decyzja({ zrodlo: 'sklep', uprawnienia: obce }, null, TERAZ, PRODUKTY_PRO).dostep === false;
    }));
  });

  test('KP-06 własność: pamięć z udanego odczytu sklepu daje bez sieci ten sam dostęp w tej samej chwili (W-03, W-11, W-18)', () => {
    sprawdz(fc.property(fc.array(uprawnienie, { maxLength: 4 }), (u) => {
      const zeSklepu = decyzja({ zrodlo: 'sklep', uprawnienia: u }, null, TERAZ, PRODUKTY_PRO);
      expect(decyzja({ zrodlo: 'blad' }, zeSklepu.pamiec, TERAZ, PRODUKTY_PRO).dostep).toBe(zeSklepu.dostep);
    }));
  });

  test('KP-06 R-113 własność: ważność pamięci = najpóźniejsza ważność wśród ważnych uprawnień (null = bez końca)', () => {
    sprawdz(fc.property(fc.array(uprawnienie, { maxLength: 4 }), (u) => {
      const wazne = u.filter((x) => !x.odebrane && PRODUKTY_PRO.includes(x.produkt) && (x.wygasa === null || x.wygasa > TERAZ));
      fc.pre(wazne.length > 0 && u.every((x) => x.wygasa === null || x.wygasa !== TERAZ)); // bez styku `wygasa === teraz` ([DO USTALENIA])
      const d = decyzja({ zrodlo: 'sklep', uprawnienia: u }, null, TERAZ, PRODUKTY_PRO);
      const oczekiwana = wazne.some((x) => x.wygasa === null) ? null : Math.max(...wazne.map((x) => x.wygasa as number));
      expect(d.dostep).toBe(true);
      expect(d.pamiec?.wygasa).toBe(oczekiwana);
    }));
  });
});
