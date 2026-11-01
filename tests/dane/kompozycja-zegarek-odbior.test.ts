// 07-jakosc-005 (F-12, ADR-0030, K-05a–K-05f): +1 z zegarka scalane przy otwartej aplikacji telefonu, bez zdarzenia AppState.
// Prawdziwa baza (node:sqlite), prawdziwe scalanie dziennika; atrapa tylko na granicy platformy: zegarek (zdarzenie `zegarekZdarzenia`)
// i Live Activity. Swift (K-05g) sprawdza `swift test` w CI macOS, urządzenie (K-05h) — właściciel (P-316).
import { migruj } from '../../src/dane/migracje/migruj';
import type { LiveActivity, StanZegarka, Zegarek, ZdarzenieWejsciowe } from '../../src/domena/porty';
import type { Wynik } from '../../src/domena/bledy';
import { utworzI18n } from '../../src/i18n/i18n';
import { ZASOBY } from '../../src/i18n/slowniki';
import { kompozycjaLicznika } from '../../src/kompozycja/licznik';
import { odbiorZegarka } from '../../src/kompozycja/zegarek-odbior';
import { ile, jeden, przygotuj, type Srodowisko } from './pomocnicze/srodowisko';

const liveActivity: LiveActivity = { start: async () => ({ ok: true, wartosc: undefined }), aktualizuj: async () => undefined, zakoncz: async () => undefined };
const MS = 5;
/** Czeka, aż warunek się spełni (zdarzenie z zegarka obsługuje kompozycja w tle, bez obietnicy dla wołającego). */
async function poczekaj(warunek: () => Promise<boolean> | boolean, limitMs = 3000): Promise<void> {
  const koniec = Date.now() + limitMs;
  while (!(await warunek())) {
    if (Date.now() > koniec) throw new Error('warunek nie spełniony w czasie');
    await new Promise((r) => setTimeout(r, MS));
  }
}
const chwila = (ms = 60) => new Promise((r) => setTimeout(r, ms));

/** Atrapa granicy platformy: zegarek z możliwością wywołania zdarzenia i śladem wywołań. */
function zegarekAtrapa() {
  let odbior: ((z: ZdarzenieWejsciowe[]) => void) | null = null;
  const a = {
    subskrypcje: 0, odpiecia: 0, potwierdzone: [] as string[][], kolejnosc: [] as string[], stany: [] as StanZegarka[],
    zdarzenie(linie: ZdarzenieWejsciowe[]) { odbior?.(linie); },
    zegarek: {
      potwierdz(ids: readonly string[]) { a.potwierdzone.push([...ids]); a.kolejnosc.push('potwierdz'); },
      async wyslijStan(s: StanZegarka) { a.stany.push(s); a.kolejnosc.push('wyslijStan'); },
      odbieraj(fn: (z: ZdarzenieWejsciowe[]) => void) { odbior = fn; a.subskrypcje += 1; return () => { odbior = null; a.odpiecia += 1; }; },
    } satisfies Zegarek,
  };
  return a;
}

async function uklad(o: { aktywna?: boolean; bezOpcji?: boolean; rzedy?: number } = {}) {
  const s = await przygotuj();
  const i = await utworzI18n({ magazyn: { odczytaj: async () => null, zapisz: async () => {} }, systemowe: () => ['en-US'], zasoby: ZASOBY });
  const z = zegarekAtrapa();
  const stan = { aktywna: o.aktywna ?? true, psuj: false, odczyty: 0 };
  const oryginal = s.dziennik.odczytaj.bind(s.dziennik);
  s.dziennik.odczytaj = async () => { // szpieg: liczba przebiegów scalenia; jeden wstrzyknięty błąd odczytu (K-05e)
    stan.odczyty += 1;
    if (stan.psuj) { stan.psuj = false; throw new Error('wstrzyknięty błąd odczytu dziennika'); }
    return oryginal();
  };
  const k = kompozycjaLicznika({ ...s.z, migruj: (b) => migruj(b), liveActivity, zegarek: z.zegarek }, { t: i.t, jezyk: i.jezyk, zegar24h: () => true },
    o.bezOpcji ? { wibracje: () => true } : { wibracje: () => true, aplikacjaAktywna: () => stan.aktywna });
  expect((await k.przygotuj()).ok).toBe(true);
  for (let n = 0; n < (o.rzedy ?? 3); n++) expect((await k.uslugi.dodajRzad()).ok).toBe(true);
  await chwila(); // domknięcie `void poZapisie` po +1 z przygotowania (ekran blokady i stan zegarka) — zanim liczymy ślad zdarzeń z zegarka
  stan.odczyty = 0; z.potwierdzone.length = 0; z.kolejnosc.length = 0; z.stany.length = 0;
  return { s, k, z, stan };
}

const wartosc = async (s: Srodowisko) => (await jeden<{ wartosc: number }>(s.baza, 'SELECT wartosc FROM licznik')).wartosc;
/** `n` kolejnych +1 z zegarka łańcuchem od głowy licznika (rodzic = głowa albo poprzednie stuknięcie), źródło „zegarek”. */
async function stuknieciaZegarka(s: Srodowisko, ids: string[]): Promise<ZdarzenieWejsciowe[]> {
  const l = await jeden<{ id: string; glowa: string }>(s.baza, 'SELECT id, glowa FROM licznik');
  const teraz = s.zegar.teraz();
  let rodzic = l.glowa;
  return ids.map((id, n) => {
    const z: ZdarzenieWejsciowe = { id, licznikId: l.id, rodzaj: 'plus', rodzice: [rodzic], czasMs: teraz.ms + (n + 1) * 1000, strefa: teraz.strefa, dzien: teraz.dzien, zrodlo: 'zegarek', urzadzenie: 'zegarek-test', pro: false };
    rodzic = id;
    return z;
  });
}
/** Zegarek zapisuje linię w dzienniku (trwale), potem moduł zgłasza zdarzenie (modules/oczko-dziennik-plus: `dopisz`, potem `poZapisie`). */
function stuknijNaZegarku(u: Awaited<ReturnType<typeof uklad>>, linie: ZdarzenieWejsciowe[]): void {
  u.s.dziennik.linie.push(...linie);
  u.z.zdarzenie(linie);
}

describe('K-05 zegarek przy otwartej aplikacji telefonu (ADR-0030)', () => {
  test('K-05a: jedno +1 z zegarka, aplikacja aktywna → licznik w bazie i na ekranie +1 bez AppState; potwierdzenie PRZED stanem do zegarka', async () => {
    const u = await uklad();
    const wersjaPrzed = u.k.wersja();
    let odswiezen = 0;
    u.k.poZegarku(() => { odswiezen += 1; });
    stuknijNaZegarku(u, await stuknieciaZegarka(u.s, ['z1']));
    await poczekaj(async () => (await wartosc(u.s)) === 4);
    await poczekaj(() => u.z.stany.length > 0);
    expect((await u.k.widok())?.wartosc).toBe(4);
    expect(u.z.potwierdzone.flat()).toEqual(['z1']);
    expect(u.z.kolejnosc.indexOf('potwierdz')).toBeGreaterThanOrEqual(0);
    expect(u.z.kolejnosc.indexOf('potwierdz')).toBeLessThan(u.z.kolejnosc.indexOf('wyslijStan'));
    expect(u.z.stany.at(-1)?.wartosc).toBe(4);
    expect(odswiezen).toBeGreaterThanOrEqual(1); // ekran licznika przeładowuje się (app/index.tsx: ustawWersje)
    expect(u.k.wersja()).toBeGreaterThan(wersjaPrzed);
  });

  test('K-05b: 3 zdarzenia w jednej pętli zdarzeń → najwyżej 2 przebiegi scalenia, wartość +3, wszystkie 3 id potwierdzone', async () => {
    const u = await uklad();
    const [a, b, c] = await stuknieciaZegarka(u.s, ['z1', 'z2', 'z3']);
    stuknijNaZegarku(u, [a]); stuknijNaZegarku(u, [b]); stuknijNaZegarku(u, [c]);
    await poczekaj(async () => (await wartosc(u.s)) === 6);
    await chwila(); // domknięcie ewentualnego drugiego przebiegu
    expect(u.stan.odczyty).toBeGreaterThanOrEqual(1);
    expect(u.stan.odczyty).toBeLessThanOrEqual(2);
    expect([...new Set(u.z.potwierdzone.flat())].sort()).toEqual(['z1', 'z2', 'z3']);
  });

  test('K-05c: zdarzenie przy AppState ≠ active → zero scaleń; po przejściu na active linie scala istniejące naPierwszyPlan (ARCH-13)', async () => {
    const u = await uklad({ aktywna: false });
    const zdarzeniaPrzed = await ile(u.s.baza, 'zdarzenie');
    stuknijNaZegarku(u, await stuknieciaZegarka(u.s, ['z1']));
    await chwila();
    expect(u.stan.odczyty).toBe(0); // nawet odczyt dziennika nie nastąpił: żadnej pozycji kolejki w tle
    expect(await ile(u.s.baza, 'zdarzenie')).toBe(zdarzeniaPrzed);
    expect(await wartosc(u.s)).toBe(3);
    u.stan.aktywna = true;
    await u.k.uslugi.scalDziennik(); // ścieżka AppState → active (Aplikacja.tsx)
    expect(await wartosc(u.s)).toBe(4);
    expect(u.z.potwierdzone.flat()).toEqual(['z1']);
  });

  test('K-05d: to samo stuknięcie dostarczone drugi raz (M-02) → licznik bez zmiany, id nadal potwierdzone', async () => {
    const u = await uklad();
    const [z1] = await stuknieciaZegarka(u.s, ['z1']);
    stuknijNaZegarku(u, [z1]);
    await poczekaj(async () => (await wartosc(u.s)) === 4);
    await poczekaj(() => u.z.potwierdzone.length > 0);
    await chwila();
    u.z.potwierdzone.length = 0;
    stuknijNaZegarku(u, [z1]); // skrócenie dziennika nie doszło (zabicie procesu po COMMIT) — ta sama linia znów
    await poczekaj(() => u.z.potwierdzone.length > 0);
    expect(await wartosc(u.s)).toBe(4);
    expect(await ile(u.s.baza, 'zdarzenie', "zrodlo = 'zegarek'")).toBe(1);
    expect(u.z.potwierdzone.flat()).toEqual(['z1']);
  });

  test('K-05e: błąd scalenia → wpis blad „zegarek_scalenie” (bez treści), dziennik nieskrócony; kolejne zdarzenie ponawia i scala wszystko', async () => {
    const u = await uklad();
    const [z1, z2] = await stuknieciaZegarka(u.s, ['z1', 'z2']);
    u.stan.psuj = true;
    stuknijNaZegarku(u, [z1]);
    await poczekaj(async () => (await ile(u.s.baza, 'blad', "kod = 'zegarek_scalenie'")) === 1);
    expect(await wartosc(u.s)).toBe(3);
    expect(u.s.dziennik.skrocono).toEqual([]);
    expect(u.s.dziennik.linie.map((l) => l.id)).toEqual(['z1']); // linia czeka w dzienniku
    const wpis = await jeden<{ szczegoly: string }>(u.s.baza, "SELECT szczegoly FROM blad WHERE kod = 'zegarek_scalenie'");
    expect(wpis.szczegoly).not.toMatch(/Sweter|projekt|licznik/i);
    stuknijNaZegarku(u, [z2]);
    await poczekaj(async () => (await wartosc(u.s)) === 5);
    expect(u.s.dziennik.skrocono.at(-1)).toBe('z2');
    expect([...new Set(u.z.potwierdzone.flat())].sort()).toEqual(['z1', 'z2']);
  });

  test('K-05f: zamknięcie kontenera odpina subskrypcję — późniejsze zdarzenia nie scalają; przygotuj dwa razy = jedna subskrypcja', async () => {
    const u = await uklad();
    await u.k.przygotuj();
    expect(u.z.subskrypcje).toBe(1);
    u.k.zamknij();
    expect(u.z.odpiecia).toBe(1);
    stuknijNaZegarku(u, await stuknieciaZegarka(u.s, ['z1']));
    await chwila();
    expect(u.stan.odczyty).toBe(0);
    expect(await wartosc(u.s)).toBe(3);
  });

  test('bez opcji aplikacjaAktywna (kompozycja bez wiedzy o AppState) kompozycja nie subskrybuje zegarka — nigdy transakcji w tle bez ochrony (ARCH-13)', async () => {
    const u = await uklad({ bezOpcji: true });
    expect(u.z.subskrypcje).toBe(0);
  });
});

describe('odbiorZegarka: jedno scalenie naraz + jedno domknięcie (ADR-0030 pkt 2–3)', () => {
  function brama() {
    let otworz: () => void = () => undefined;
    const czeka = new Promise<void>((r) => { otworz = r; });
    return { czeka, otworz };
  }
  const ok: Wynik<unknown> = { ok: true, wartosc: undefined };

  test('5 zdarzeń w trakcie trwającego scalenia → dokładnie 2 przebiegi (trwający + jedno domknięcie)', async () => {
    const b = brama();
    let przebiegi = 0;
    const o = odbiorZegarka({
      aktywna: () => true,
      scal: async () => { przebiegi += 1; if (przebiegi === 1) await b.czeka; return ok; },
      zglosBlad: async () => undefined,
    });
    o.naZdarzenie();
    for (let n = 0; n < 5; n++) o.naZdarzenie();
    b.otworz();
    await poczekaj(() => przebiegi === 2);
    await chwila();
    expect(przebiegi).toBe(2);
    o.naZdarzenie(); // po domknięciu nowe zdarzenie znów uruchamia scalenie
    await poczekaj(() => przebiegi === 3);
  });

  test('wynik niepowodzenia i wyjątek zgłaszają błąd (po jednym razie), a następne zdarzenie ponawia', async () => {
    const bledy: string[] = [];
    let n = 0;
    const o = odbiorZegarka({
      aktywna: () => true,
      scal: async () => { n += 1; if (n === 1) return { ok: false, powod: 'zapis' } as const; if (n === 2) throw new Error('x'); return ok; },
      zglosBlad: async (p) => { bledy.push(p); },
    });
    o.naZdarzenie();
    await poczekaj(() => bledy.length === 1);
    o.naZdarzenie();
    await poczekaj(() => bledy.length === 2);
    o.naZdarzenie();
    await poczekaj(() => n === 3);
    await chwila();
    expect(bledy).toEqual(['zapis', 'wyjatek']);
  });

  test('zamknięty odbiór i aplikacja poza pierwszym planem ignorują zdarzenia', async () => {
    let przebiegi = 0; let aktywna = false;
    const o = odbiorZegarka({ aktywna: () => aktywna, scal: async () => { przebiegi += 1; return ok; }, zglosBlad: async () => undefined });
    o.naZdarzenie();
    await chwila();
    expect(przebiegi).toBe(0);
    aktywna = true;
    o.zamknij();
    o.naZdarzenie();
    await chwila();
    expect(przebiegi).toBe(0);
  });
});
