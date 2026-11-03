// Atrapa silnika iCloud w buildzie E2E (P-230 Q1a, moduly.md „Atrapa silnika w E2E”, e2e/README.md `oczkoE2eIcloud`): ten sam port
// `Synchronizacja`, w procesie, bez sieci. Ładowana wyłącznie przez `src/platforma/icloud.ts` przy EXPO_PUBLIC_ICLOUD_FAKE=1 (P-242);
// nigdy w wydaniu (kontrola ATRAPA-ICLOUD, `jakosc:slady-wydania`). Potwierdza każdą wysyłkę jak serwer, więc skrzynka pustoszeje jak z CloudKit.
// Liczba wysłanych rekordów i usunięcie strefy w pliku buildu E2E (przetrwają restart i „Usuń wszystkie dane”).
import type { PartiaIcloud, PortBazy, PotwierdzenieIcloud, RekordIcloud, StanSynchronizacji, Zegar, ZdarzenieKonta } from '../domena/porty';
import type { SilnikIcloud, StanAtrapyIcloud } from './icloud';
import { liczba, tekst, tekstLubNull, wiersze } from '../dane/repozytoria/wiersze';

export type TrybAtrapy = 'wlaczony' | 'wylaczony' | 'brak-konta' | 'brak-miejsca' | 'konflikt';
const TRYBY: readonly TrybAtrapy[] = ['wlaczony', 'wylaczony', 'brak-konta', 'brak-miejsca', 'konflikt'];
export const URZADZENIE_ATRAPY = 'iPad (test)';
export const ID_KONFLIKTU = 'ffffffff-0000-4000-8000-000000000001';

function czytajStan(t: string | null): StanAtrapyIcloud {
  try {
    const v: unknown = t ? JSON.parse(t) : null;
    if (typeof v === 'object' && v !== null && 'wyslane' in v && 'usuniete' in v && typeof v.wyslane === 'number' && typeof v.usuniete === 'boolean') return { wyslane: v.wyslane, usuniete: v.usuniete };
  } catch { /* uszkodzony plik testowy: od zera */ }
  return { wyslane: 0, usuniete: false };
}

/** Druga wersja pierwszego licznika (tryb `konflikt`): wpisanie wartość + 5 z „iPad (test)”, minutę temu, rodzic = głowa sprzed ostatniej zmiany. */
export async function partiaKonfliktu(baza: PortBazy, zegar: Zegar): Promise<PartiaIcloud | null> {
  const [l] = await wiersze(baza.all(
    'SELECT id, wartosc, glowa FROM licznik WHERE usunieto_ms IS NULL AND glowa IS NOT NULL ORDER BY zmieniono_ms, id LIMIT 1'), 'partiaKonfliktu');
  const glowa = l ? tekstLubNull(l, 'glowa') : null;
  if (!l || !glowa) return null;
  const [g] = await wiersze(baza.all('SELECT rodzice FROM zdarzenie WHERE id = ?', [glowa]), 'partiaKonfliktu');
  const r: unknown = g ? JSON.parse(tekst(g, 'rodzice')) : [];
  const rodzic = Array.isArray(r) ? r.filter((x: unknown): x is string => typeof x === 'string').slice(0, 1) : [];
  const t = zegar.teraz();
  const wartosc = liczba(l, 'wartosc') + 5;
  const rekord: RekordIcloud = {
    encja: 'zdarzenie', klucz: ID_KONFLIKTU, plik: null,
    pola: { id: ID_KONFLIKTU, licznik_id: tekst(l, 'id'), rodzaj: 'wpisanie', wartosc, wartosc_po: wartosc, rodzice: JSON.stringify(rodzic), cofa: '[]', zrodlo: 'synchronizacja', urzadzenie: URZADZENIE_ATRAPY, czas_ms: t.ms - 60_000, strefa: t.strefa, dzien: t.dzien },
  };
  return { rekordy: [rekord], usuniete: [], stanSilnika: null };
}

export function atrapaIcloud(o: { tryb: string | null; baza: PortBazy; zegar: Zegar; plik: { czytaj(): string | null; zapisz(t: string): void } }): SilnikIcloud {
  const tryb: TrybAtrapy = TRYBY.find((x) => x === o.tryb) ?? 'wlaczony';
  let e2e = czytajStan(o.plik.czytaj());
  let stan: StanSynchronizacji = 'wylaczona';
  let odbior: ((p: PartiaIcloud) => Promise<void>) | null = null;
  let potw: ((p: PotwierdzenieIcloud) => Promise<void>) | null = null;
  let pob: ((f: 'poczatek' | 'koniec') => Promise<void>) | null = null;
  let wstrzyknieto = false;
  const sluchacze = new Set<() => void>();
  const zapisz = (n: StanAtrapyIcloud) => { e2e = n; o.plik.zapisz(JSON.stringify(n)); for (const f of sluchacze) f(); };
  return {
    async wlacz() { stan = 'aktywna'; return { ok: true, wartosc: undefined }; },
    async wylacz() { stan = 'wylaczona'; },
    stan: () => stan,
    async statusKonta() { return tryb === 'brak-konta' ? 'brak_konta' : 'dostepne'; },
    async uruchom() {
      stan = 'aktywna';
      if (tryb !== 'konflikt' || wstrzyknieto) return;
      wstrzyknieto = true;
      const p = await partiaKonfliktu(o.baza, o.zegar);
      if (p && odbior) await odbior(p);
    },
    async wyslij(zmiany) {
      if (tryb === 'brak-miejsca') { stan = 'blad'; throw { kod: 'brak_miejsca' }; }
      zapisz({ ...e2e, wyslane: e2e.wyslane + zmiany.length });
      await potw?.({ wyslane: zmiany.map((z) => ({ encja: z.encja, klucz: z.klucz, nr: z.nr })), stanSilnika: new Uint8Array([1]) });
      await pob?.('poczatek'); await pob?.('koniec'); // pełne pobranie bez zmian innych urządzeń: wpisy wysłane znikają (ADR-0005 uzupełnienie 2026-11-03)
    },
    odbieraj(fn) { odbior = fn; return () => { odbior = null; }; },
    wyslane(fn) { potw = fn; return () => { potw = null; }; },
    pobieranie(fn) { pob = fn; return () => { pob = null; }; },
    zdarzeniaKonta(fn: (z: ZdarzenieKonta) => void) { void fn; return () => undefined; }, // konto atrapy się nie zmienia (inne konto: test na urządzeniu)
    async usunStrefe() { zapisz({ ...e2e, usuniete: true }); return { ok: true, wartosc: undefined }; },
    e2e: { stan: () => e2e, obserwuj(fn) { sluchacze.add(fn); return () => { sluchacze.delete(fn); }; } },
  };
}
