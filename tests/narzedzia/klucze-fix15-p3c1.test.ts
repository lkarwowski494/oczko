// Rola 04, fix M2 partia 3c1 (P-441; design-spec „Aneks M2 partia 3c1”): teksty en i wyrocznie dla 08.
// Wyrocznia: docs/design/fix15-2026-11-03/klucze.json. Nowe i zmienione klucze en były na liście „oczekujące na falę” (P-357); pl po akceptacji
// właściciela (P-422), przekład 33 języków w fali 09 przez API 2026-11-03 (P-474; lista oczekujących pusta).
import { readFileSync, readdirSync } from 'node:fs';
import { KOPIA_PRZED_IMPORTEM_DNI, KOPIE_RATUNKOWE_DNI } from '../../src/konfiguracja';
import { join } from 'node:path';
import { KLUCZE_FOLDERU, ZDANIE_FOLDERU } from '../i18n/folder-kopii';
import { ZAKRES_FALI, brakiPrzekladu } from '../i18n/fala-2026-11-03';

const KORZEN = join(__dirname, '../..');
const czytaj = (p: string): unknown => JSON.parse(readFileSync(join(KORZEN, p), 'utf8'));
type Aneks = { grupy: Record<string, string[]>; en: Record<string, string>; kontekst: Record<string, string> };
const ANEKS = czytaj('docs/design/fix15-2026-11-03/klucze.json') as Aneks;
const EN = czytaj('src/i18n/slowniki/en.json') as Record<string, Record<string, string>>;
const KONTEKST = czytaj('src/i18n/slowniki/en.kontekst.json') as Record<string, Record<string, string>>;
const PSEUDO = czytaj('src/i18n/pseudo/en-XA.json') as Record<string, string>;
const OCZEKUJACE = (czytaj('docs/lokalizacja/oczekujace.json') as { klucze: string[] }).klucze;
const WSZYSTKIE = readdirSync(join(KORZEN, 'src/i18n/slowniki')).filter((f) => /^[a-z]{2}(-[A-Za-z0-9]+)?\.json$/.test(f) && f !== 'en.json');
// pl ma przekład od P-469 (uzupełnienie 143 brakujących tekstów); pozostałe 33 języki — z fali 2026-11-03 (P-474).
const SLOWNIKI = WSZYSTKIE.filter((f) => f !== 'pl.json');
const PL = czytaj('src/i18n/slowniki/pl.json') as Record<string, Record<string, string>>;
const wartosc = (s: Record<string, Record<string, string>>, klucz: string) => { const [sekcja, nazwa] = klucz.split('.'); return s[sekcja]?.[nazwa]; };

/** Wspólny kontrakt grupy: wartość i kontekst z wyroczni, klucz w zakresie fali (nie na liście oczekujących), wpis pseudo, kompletny przekład w 33 językach po fali 09. */
function kontraktGrupy(id: string): void {
  const klucze = ANEKS.grupy[id] ?? [];
  test(`${id}: grupa w wyroczni niepusta`, () => expect(klucze.length).toBeGreaterThan(0));
  test(`${id}: en.json = wyrocznia`, () => { for (const k of klucze) expect([k, wartosc(EN, k)]).toEqual([k, ANEKS.en[k]]); });
  // M1-audytor-generalny-055: do kontekstu kluczy z „Oczko › Backup” dopisane wspólne zdanie o folderze (folder-kopii.ts); reszta = wyrocznia bez zmian.
  const bez055 = (k: string, v: string | undefined) => ((KLUCZE_FOLDERU as readonly string[]).includes(k) ? v?.replace(` ${ZDANIE_FOLDERU}`, '') : v);
  test(`${id}: en.kontekst.json = wyrocznia`, () => { for (const k of klucze) expect([k, bez055(k, wartosc(KONTEKST, k))]).toEqual([k, ANEKS.kontekst[k]]); });
  test(`${id}: klucze w zakresie fali 2026-11-03, nie na liście oczekujących (P-474)`, () => { for (const k of klucze) { expect([k, ZAKRES_FALI.includes(k)]).toEqual([k, true]); expect([k, OCZEKUJACE.includes(k)]).toEqual([k, false]); } });
  test(`${id}: pseudolokalizacja en-XA ma klucz`, () => { for (const k of klucze) expect([k, typeof PSEUDO[k]]).toEqual([k, 'string']); });
  test(`${id}: pl ma polski przekład (P-469)`, () => {
    for (const k of klucze) expect([k, typeof wartosc(PL, k) === 'string' || typeof wartosc(PL, `${k}_other`) === 'string']).toEqual([k, true]);
  });
  test(`${id}: kompletny przekład w ${SLOWNIKI.length} słownikach po fali 09 (poza pl)`, () => {
    expect(SLOWNIKI.length).toBe(33);
    for (const k of klucze) expect([k, brakiPrzekladu(k)]).toEqual([k, []]); // każda forma CLDR języka, tekst niepusty
  });
}

// M1-audytor-generalny-131 (04-studio-projektowe-521; DEC-33 b, P-432): jednorazowa wskazówka gestu przy pierwszym otwarciu wzoru.
describe('M1-audytor-generalny-131: wskazówka „stuknij w rząd”', () => {
  kontraktGrupy('M1-audytor-generalny-131');
  test('tekst mówi o geście z kontraktu F-26 („stuknięcie w rząd”) i nazywa znacznik jak reszta wzoru („marker”)', () => {
    const w = wartosc(EN, 'wzor.wskazowka_znacznika') ?? '';
    expect(w).toMatch(/^Tap a row\b/);
    expect(w).toContain('marker');
    expect(wartosc(EN, 'wzor.przestaw')).toContain('marker');
  });
});

// M1-audytor-generalny-134 (04-studio-projektowe-524; DEC-34 a, P-438): jedno miejsce po przecinku w podglądzie „Swatch”, pełna wartość w obliczeniach.
// Bez nowych tekstów. Test sprawdza wyrocznię 04 dla 08 (`probka_podglad`): pełna wartość = rachunek z parametrów domeny (RD-01, RD-04),
// napis = szablon en z liczbą według reguły (wyliczona: 1 miejsce; przepisana z pola: jak wpisano). Zachowanie ekranu sprawdzi test 08.
describe('M1-audytor-generalny-134: wyrocznia liczb podglądu próbki', () => {
  type Przypadek = { opis: string; oczka: string; na: '10cm' | '4in'; szerokosc?: string; jednostka?: 'cm' | 'in'; klucz: string; pelna: number; pokazana: string; nie?: string; echo?: boolean };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { CAL_W_CM, CZTERY_CALE_W_CM } = require('../../src/domena/obliczenia/parametry') as { CAL_W_CM: number; CZTERY_CALE_W_CM: number };
  const WYR = (czytaj('docs/design/fix15-2026-11-03/klucze.json') as { probka_podglad?: { przypadki: Przypadek[] } }).probka_podglad;
  const przypadki = WYR?.przypadki ?? [];
  const liczba = (x: number, echo: boolean) => new Intl.NumberFormat('en', { maximumFractionDigits: echo ? 3 : 1 }).format(echo ? x : Math.round(x * 10) / 10);
  const rachunek = (c: Przypadek): number => {
    const p = Number(c.oczka), naCm = c.na === '10cm' ? p / 10 : p / CZTERY_CALE_W_CM;
    const szer = Number(c.szerokosc ?? 0);
    switch (c.klucz) {
      case 'probka.przeliczona': return naCm * 10;
      case 'probka.oczka_wynik': return (c.jednostka === 'in' ? szer * CAL_W_CM : szer) * naCm;
      case 'probka.z_danych_cm': return c.na === '10cm' ? p : naCm * 10;
      case 'probka.z_danych_in': return c.na === '4in' ? p : naCm * CZTERY_CALE_W_CM;
      case 'probka.na_4in_dokladnie': return naCm * CZTERY_CALE_W_CM;
      default: throw new Error(`nieznany klucz ${c.klucz}`);
    }
  };
  test('wyrocznia ma przypadki dla wszystkich pięciu kluczy z liczbą w podglądzie', () => {
    expect([...new Set(przypadki.map((c) => c.klucz))].sort()).toEqual(['probka.na_4in_dokladnie', 'probka.oczka_wynik', 'probka.przeliczona', 'probka.z_danych_cm', 'probka.z_danych_in']);
  });
  test('pełna wartość każdego przypadku = rachunek z parametrów domeny (4 in = 10,16 cm, 1 in = 2,54 cm)', () => {
    for (const c of przypadki) expect([c.opis, Math.abs(rachunek(c) - c.pelna) < 1e-6]).toEqual([c.opis, true]);
  });
  test('napis = szablon en z liczbą według reguły DEC-34 a; echo tylko bez przeliczenia', () => {
    for (const c of przypadki) {
      const echo = c.echo === true;
      if (echo) expect([c.opis, rachunek(c)]).toEqual([c.opis, Number(c.oczka)]);
      const pokazana = liczba(c.pelna, echo);
      const forma = new Intl.PluralRules('en').select(Number(pokazana.replace(/,/g, ''))) === 'one' ? 'one' : 'other';
      const szablon = wartosc(EN, `${c.klucz}_${forma}`) ?? '';
      const w = c.szerokosc === undefined ? '' : liczba(Number(c.szerokosc), true);
      expect([c.opis, szablon.replace('{{p}}', pokazana).replace('{{count}}', pokazana).replace('{{w}}', w)]).toEqual([c.opis, c.pokazana]);
      if (c.nie) expect(c.pokazana).not.toBe(c.nie);
    }
  });
  test('design-spec, kalkulator „Swatch”: `probka.przeliczona` z jednym miejscem po przecinku w podglądzie, pełna wartość w obliczeniach (BR-KAL-003 S1 po ER-62, P-446)', () => {
    const spec = readFileSync(join(KORZEN, 'docs/design/archiwum/2026-11-08-kreski/design-spec.md'), 'utf8');
    const wiersz = spec.split('\n').find((l) => l.startsWith('- Próbka na 4 in: pod polem `probka.przeliczona`')) ?? '';
    expect(wiersz).toMatch(/jedno miejsce po przecinku w podglądzie, pełna wartość w obliczeniach/);
    expect(spec).not.toMatch(/3 miejsca jak BR-KAL-003/);
  });
});

// M1-audytor-generalny-136 (04-studio-projektowe-526; DEC-35 b, P-438): kopia z „Make another like this” dostaje kolejny wolny numer („Harbor 2”).
describe('M1-audytor-generalny-136: nazwa kopii projektu', () => {
  kontraktGrupy('M1-audytor-generalny-136');
  type Przypadek = { oryginal: string; istniejace: string[]; baza: string; n: number; kopia: string };
  const przypadki = (czytaj('docs/design/fix15-2026-11-03/klucze.json') as { kopia_nazwa_przypadki?: { przypadki: Przypadek[] } }).kopia_nazwa_przypadki?.przypadki ?? [];
  const szablon = () => wartosc(EN, 'projekt.kopia_nazwa') ?? '';
  const wypelnij = (nazwa: string, n: number) => szablon().replace('{{nazwa}}', nazwa).replace('{{n}}', String(n));
  test('szablon ma dokładnie {{nazwa}} i {{n}}, bez słów (rozpoznawanie numeru w kopii kopii)', () => {
    expect(szablon().match(/\{\{\w+\}\}/g)?.sort()).toEqual(['{{n}}', '{{nazwa}}'].sort());
    expect(szablon().replace('{{nazwa}}', '').replace('{{n}}', '')).toMatch(/^[\s()]*$/);
  });
  test('wyrocznia: każdy przypadek spełnia regułę DEC-35 b (baza bez numeru 1–999, najmniejszy wolny numer od 2)', () => {
    expect(przypadki.length).toBeGreaterThanOrEqual(6);
    const wzor = new RegExp(`^${szablon().replace('{{nazwa}}', '(.+)').replace('{{n}}', '(\\d{1,3})')}$`);
    const klucz = (x: string) => x.trim().toLowerCase();
    for (const c of przypadki) {
      const m = wzor.exec(c.oryginal);
      expect([c.oryginal, m && Number(m[2]) >= 1 ? m[1] : c.oryginal]).toEqual([c.oryginal, c.baza]);
      const zajete = new Set(c.istniejace.map(klucz));
      for (let n = 2; n < c.n; n++) expect([c.oryginal, n, zajete.has(klucz(wypelnij(c.baza, n)))]).toEqual([c.oryginal, n, true]);
      expect([c.oryginal, zajete.has(klucz(c.kopia))]).toEqual([c.oryginal, false]);
      expect([c.oryginal, wypelnij(c.baza, c.n)]).toEqual([c.oryginal, c.kopia]);
    }
  });
});

// M1-audytor-generalny-142 (04-studio-projektowe-519; DEC-36 a, P-438): nieudany zapis kopii na ekranie awaryjnym ma własne teksty, nie tekst formularza.
describe('M1-audytor-generalny-142: alert nieudanej kopii na ekranie awaryjnym', () => {
  kontraktGrupy('M1-audytor-generalny-142');
  test('tytuł nazywa kopię, nie zmiany; opis powtarza działania z przycisków ekranu i nie mówi „Nothing was changed”', () => {
    const tytul = wartosc(EN, 'awaryjny.blad_kopii') ?? '', opis = wartosc(EN, 'awaryjny.blad_kopii_opis') ?? '';
    expect(tytul).toMatch(/\bcopy\b/);
    expect(tytul).not.toBe(wartosc(EN, 'formularz.blad_zapisu'));
    expect(opis).not.toMatch(/Nothing was changed/);
    expect(opis.toLowerCase()).toContain((wartosc(EN, 'awaryjny.sprobuj') ?? '?').toLowerCase());
    expect(opis).toContain('save a copy');
  });
});

// M1-audytor-generalny-143 (04-studio-projektowe-520; DEC-36 a skorygowana przez DEC-37 a, P-445): podpis o kopiach w „Data and sync” mówi, że Oczko
// usuwa je samo — po 30 dniach, przy następnym otwarciu, część wcześniej przy dużym rozmiarze (sprzątanie tylko przy starcie: src/kompozycja/start-aplikacji.ts;
// budżet i limit: src/niezawodnosc/kopie.ts, ADR-0033). `ustawienia.usun_pytanie` z tym samym zdaniem: grupa M1-audytor-generalny-160.
const TERMIN_KOPII = `Oczko deletes them after ${KOPIA_PRZED_IMPORTEM_DNI} days, when you next open it, and some sooner if they take up a lot of space.`;
describe('M1-audytor-generalny-143: podpis o kopiach bezpieczeństwa w „Data and sync”', () => {
  kontraktGrupy('M1-audytor-generalny-143');
  test('obie pule kopii sprząta ta sama liczba dni (teksty podają jedną)', () => expect(KOPIE_RATUNKOWE_DNI).toBe(KOPIA_PRZED_IMPORTEM_DNI));
  test('`stan_danych.kopie_opis`: termin z warunkiem otwarcia i wcześniejszym usuwaniem (DEC-37 a), bez „within”', () => {
    expect(wartosc(EN, 'stan_danych.kopie_opis')).toContain(TERMIN_KOPII);
    expect(wartosc(EN, 'stan_danych.kopie_opis')).not.toContain('within');
  });
  test('`stan_danych.kopie_opis` nie każe usuwać kopii ręcznie', () => {
    expect(wartosc(EN, 'stan_danych.kopie_opis')).not.toMatch(/delete the ones|no longer need/);
  });
  test('kontekst tłumacza: sprzątanie przy otwarciu aplikacji i ADR-0033', () => {
    expect(wartosc(KONTEKST, 'stan_danych.kopie_opis')).toMatch(/przy otwarciu/);
    expect(wartosc(KONTEKST, 'stan_danych.kopie_opis')).toContain('ADR-0033');
  });
});

// M1-audytor-generalny-160 (04-studio-projektowe-533; DEC-37 a, P-445): arkusz „Delete all data” — termin kopii z warunkiem otwarcia i wcześniejszym
// usuwaniem przy budżecie (ADR-0033), to samo zdanie co `stan_danych.kopie_opis` (trwała kontrola klasy 130/520: tekst i reguła sprzątania razem).
describe('M1-audytor-generalny-160: termin kopii w arkuszu „Delete all data”', () => {
  kontraktGrupy('M1-audytor-generalny-160');
  test('`usun_pytanie` i `kopie_opis`: „30 days”, warunek otwarcia i zdanie o wcześniejszym usuwaniu — to samo zdanie w obu', () => {
    for (const k of ['ustawienia.usun_pytanie', 'stan_danych.kopie_opis']) {
      const w = wartosc(EN, k) ?? '';
      expect([k, w.includes(`${KOPIA_PRZED_IMPORTEM_DNI} days`), /\bopen\b/.test(w), /\bsooner\b/.test(w), w.includes(TERMIN_KOPII)]).toEqual([k, true, true, true, true]);
    }
  });
  test('kontekst tłumacza `usun_pytanie` wymienia ADR-0033 i sprzątanie przy otwarciu', () => {
    expect(wartosc(KONTEKST, 'ustawienia.usun_pytanie')).toContain('ADR-0033');
    expect(wartosc(KONTEKST, 'ustawienia.usun_pytanie')).toMatch(/przy otwarciu/);
  });
  test('wiersz 012 w design-spec ma nowy tekst arkusza', () => {
    const spec = readFileSync(join(KORZEN, 'docs/design/archiwum/2026-11-08-kreski/design-spec.md'), 'utf8');
    const wiersz = spec.split('\n').find((l) => l.startsWith('**012 · „Delete all data”')) ?? '';
    expect(wiersz).toContain(ANEKS.en['ustawienia.usun_pytanie']);
  });
});
