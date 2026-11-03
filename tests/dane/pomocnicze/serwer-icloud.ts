// Sztuczny serwer iCloud dla testów warstwy danych (kod testu, nie aplikacji; plan 07 partii 7 „dane z atrapą silnika”): kilka urządzeń
// z portem `Synchronizacja` v2; wysyłka zapisuje rekordy na serwerze i potwierdza jak CloudKit; dostarczenie wywołuje `odbieraj` urządzenia.
import type { PartiaIcloud, PotwierdzenieIcloud, RekordIcloud, StatusKonta, Synchronizacja, ZdarzenieKonta, ZmianaDoWyslania } from '../../../src/domena/porty';

export type UrzadzenieTestowe = Synchronizacja & {
  /** Pełne pobranie strefy (początek, partia, koniec — ADR-0005 uzupełnienie 2026-11-03); `bezPobrania`: sama partia (kilka partii jednego pobrania). */
  dostarcz(p?: Partial<PartiaIcloud>, o?: { bezPobrania?: boolean }): Promise<void>;
  /** Sama faza pobrania (willFetchRecordZoneChanges / udany didFetchRecordZoneChanges strefy). */
  pobranie(faza: 'poczatek' | 'koniec'): Promise<void>;
  konto(e: ZdarzenieKonta): void;
  status: StatusKonta;
  bladWysylki: { kod: string } | null;
  przedPotwierdzeniem: (() => Promise<void>) | null;
  wyslano: ZmianaDoWyslania[][];
  usunietoStrefe: number;
};
export type SerwerTestowy = { rekordy: Map<string, RekordIcloud>; usuniete: Map<string, { encja: string; klucz: string }>; urzadzenie(): UrzadzenieTestowe; wszystko(): PartiaIcloud };

/** Jak CKRecord: pole z wartością nil nie istnieje (zapis nil usuwa pole, pobrany rekord go nie ma; Odwzorowanie.swift `wypelnij`/`doJs`). */
const jakCkRecord = (r: RekordIcloud): RekordIcloud => ({ ...structuredClone(r), pola: Object.fromEntries(Object.entries(r.pola).filter(([, v]) => v !== null)) });

export function serwerIcloud(): SerwerTestowy {
  const rekordy = new Map<string, RekordIcloud>();
  const usuniete = new Map<string, { encja: string; klucz: string }>();
  const wszystko = (): PartiaIcloud => ({ rekordy: [...rekordy.values()], usuniete: [...usuniete.values()], stanSilnika: new Uint8Array([rekordy.size % 256]) });
  return {
    rekordy, usuniete, wszystko,
    urzadzenie() {
      let odbior: ((p: PartiaIcloud) => Promise<void>) | null = null;
      let potw: ((p: PotwierdzenieIcloud) => Promise<void>) | null = null;
      let konto: ((e: ZdarzenieKonta) => void) | null = null;
      let pob: ((f: 'poczatek' | 'koniec') => Promise<void>) | null = null;
      const znane = new Set<string>(); // rekordy, których pola systemowe urządzenie zna (zapisane albo pobrane)
      const u: UrzadzenieTestowe = {
        status: 'dostepne', bladWysylki: null, przedPotwierdzeniem: null, wyslano: [], usunietoStrefe: 0,
        async wlacz() { return { ok: true, wartosc: undefined }; },
        async wylacz() { /* silnik zatrzymany */ },
        stan: () => 'aktywna',
        async statusKonta() { return u.status; },
        async uruchom() { /* stan silnika z bazy */ },
        async wyslij(zmiany) {
          if (u.bladWysylki) throw u.bladWysylki;
          u.wyslano.push([...zmiany]);
          // CKError.unknownItem (Silnik.swift, ADR-0005 uzupełnienie 2026-11-03 pkt 4): zapis rekordu usuniętego na serwerze przez urządzenie, które go znało,
          // nie odtwarza rekordu; silnik przekazuje go do JS jako usunięcie (partia `rekordy: []`) przed potwierdzeniem pozostałych.
          const nieznane: { encja: string; klucz: string }[] = [];
          for (const z of zmiany) {
            const n = `${z.encja}:${z.klucz}`;
            if (z.rekord && usuniete.has(n) && znane.has(n)) { znane.delete(n); nieznane.push({ encja: z.encja, klucz: z.klucz }); continue; }
            if (z.rekord) { rekordy.set(n, jakCkRecord(z.rekord)); usuniete.delete(n); znane.add(n); } else { rekordy.delete(n); usuniete.set(n, { encja: z.encja, klucz: z.klucz }); znane.delete(n); }
          }
          if (u.przedPotwierdzeniem) await u.przedPotwierdzeniem();
          if (nieznane.length) await odbior?.({ rekordy: [], usuniete: nieznane, stanSilnika: new Uint8Array([7]) });
          const ok = zmiany.filter((z) => !nieznane.some((x) => x.encja === z.encja && x.klucz === z.klucz));
          await potw?.({ wyslane: ok.map((z) => ({ encja: z.encja, klucz: z.klucz, nr: z.nr })), stanSilnika: new Uint8Array([7]) });
        },
        odbieraj(fn) { odbior = fn; return () => { odbior = null; }; },
        wyslane(fn) { potw = fn; return () => { potw = null; }; },
        zdarzeniaKonta(fn) { konto = fn; return () => { konto = null; }; },
        pobieranie(fn) { pob = fn; return () => { pob = null; }; },
        async usunStrefe() { u.usunietoStrefe += 1; rekordy.clear(); usuniete.clear(); return { ok: true, wartosc: undefined }; },
        async dostarcz(p, o) {
          const w = wszystko();
          for (const r of p?.rekordy ?? w.rekordy) znane.add(`${r.encja}:${r.klucz}`);
          for (const r of p?.usuniete ?? w.usuniete) znane.delete(`${r.encja}:${r.klucz}`);
          if (!o?.bezPobrania) await pob?.('poczatek');
          await odbior?.({ rekordy: p?.rekordy ?? w.rekordy, usuniete: p?.usuniete ?? w.usuniete, stanSilnika: p?.stanSilnika ?? w.stanSilnika });
          if (!o?.bezPobrania) await pob?.('koniec');
        },
        async pobranie(f) { await pob?.(f); },
        konto(e) { konto?.(e); },
      };
      return u;
    },
  };
}
