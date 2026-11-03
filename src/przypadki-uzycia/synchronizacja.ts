// Synchronizacja iCloud: przypadki użycia (moduly.md „Kontrakt partii 7”, maszyna „Synchronizacja iCloud”; ADR-0005, P-221 Q5a, P-220 N3).
// Wszystkie zapisy przez kolejkę ADR-0002. Port `Synchronizacja` (v2) to silnik (CKSyncEngine albo atrapa E2E); źródłem prawdy o zaległej
// wysyłce jest skrzynka `zmiana_icloud`. Bezpiecznik ZM-06 (`ICLOUD_W_1_0`) dotyczy tylko pokazania przełącznika — nie tego modułu.
import type { Wynik } from '../domena/bledy';
import type { MagazynPlikow, PartiaIcloud, PotwierdzenieIcloud, StanSynchronizacji, StatusKonta, Synchronizacja, ZdarzenieKonta } from '../domena/porty';
import { tabelaIcloud } from '../domena/icloud/kontrakt';
import { PARTIA_SYNCHRONIZACJI } from '../konfiguracja';
import { zapiszBladW } from '../dane/repozytoria/bledy';
import { potwierdzWyslane, stanBazy, wlaczWBazie, wylaczWBazie, zaleglosci, zastosujPartie, type WynikPartii } from '../dane/repozytoria/icloud';
import { scal } from '../domena/scal';
import { STANY, type RodzajUrzadzenia } from '../domena/stany';
import { dopiszZdarzenie, zdarzeniaDoScalenia } from '../dane/repozytoria/liczniki';
import { przeliczLicznik } from '../dane/repozytoria/przelicz';
import { zapiszUstawienie } from '../dane/repozytoria/ustawienia';
import { liczba, tekst, wiersze } from '../dane/repozytoria/wiersze';
import { wKolejce } from './kolejka';
import { operacjaZapisu } from './zapis';
import type { Zaleznosci } from './zaleznosci';

export type ZaleznosciSynchronizacji = Zaleznosci & { synchronizacja: Synchronizacja; magazyn: MagazynPlikow };
/** Przyczyna stanu `blad` (linia problemu w Data and sync); silnik odrzuca `wyslij` błędem z polem `kod`. */
export type PrzyczynaBledu = 'brak_miejsca' | 'siec' | 'inny';
export type WidokSynchronizacji = { stan: StanSynchronizacji; przyczyna: PrzyczynaBledu | null; status: StatusKonta | null; synchronizuje?: boolean }; // synchronizuje: wysyłka w toku („Syncing…”)
export type Sterownik = {
  start(): Promise<void>;
  wlacz(): Promise<WidokSynchronizacji>;
  wylacz(): Promise<void>;
  polacz(): Promise<WidokSynchronizacji>;
  nieSynchronizuj(): Promise<void>;
  wyslijZaleglosci(o?: { zawsze?: boolean }): Promise<void>;
  usunZIcloud(): Promise<Wynik<void>>;
  odbierzPartie(p: PartiaIcloud): Promise<WynikPartii>;
  widok(): WidokSynchronizacji;
  obserwuj(fn: (w: WidokSynchronizacji) => void): () => void;
  zakoncz(): void;
};

const przyczynaZ = (e: unknown): PrzyczynaBledu => {
  const kod: unknown = typeof e === 'object' && e !== null ? Reflect.get(e, 'kod') : null;
  return kod === 'brak_miejsca' ? 'brak_miejsca' : kod === 'siec' ? 'siec' : 'inny';
};

/**
 * Sterownik synchronizacji na czas życia procesu (kompozycja tworzy jeden). `start` podpina obsługę silnika zawsze (partia albo potwierdzenie
 * może przyjść po wyłączeniu — wtedy potwierdzenie czyści już pustą skrzynkę), a uruchamia silnik tylko przy `wlaczona = 1`.
 */
export function sterownikSynchronizacji(z: ZaleznosciSynchronizacji, poPartii: (w: WynikPartii) => void = () => undefined): Sterownik {
  let widok: WidokSynchronizacji = { stan: 'wylaczona', przyczyna: null, status: null };
  const sluchacze = new Set<(w: WidokSynchronizacji) => void>();
  const ustaw = (w: Partial<WidokSynchronizacji>) => { widok = { ...widok, ...w }; for (const f of sluchacze) f(widok); };
  const odpiecia: (() => void)[] = [];
  const teraz = () => z.zegar.teraz().ms;
  /** `icloud_ostatnia_udana_ms` (P-335, 07-jakosc-015): znacznik do „Last synced…” w Data and sync. Nieudany zapis znacznika nie psuje synchronizacji (tylko wyświetlana godzina). */
  const zapiszUdana = (): Promise<void> => wKolejce(z.baza, () => z.baza.transakcja((tx) => zapiszUstawienie(tx, 'icloud_ostatnia_udana_ms', teraz(), teraz()))).catch(() => undefined);

  /** `zawsze`: wysyłka także przy pustej skrzynce (po włączeniu: silnik zapisuje strefę, a to też zapis — brak miejsca widać od razu). */
  async function wyslijZaleglosci(o: { zawsze?: boolean } = {}): Promise<void> {
    const s = await stanBazy(z.baza);
    if (!s.wlaczona || widok.stan === 'konto_zmienione' || widok.stan === 'brak_konta' || (s.zalegle === 0 && !o.zawsze)) return; // konto_zmienione: wysyłka zatrzymana
    const zmiany = await zaleglosci(z.baza, PARTIA_SYNCHRONIZACJI, (sha) => z.magazyn.sciezka(sha));
    if (!zmiany.length && !o.zawsze) return;
    ustaw({ synchronizuje: true });
    try {
      await z.synchronizacja.wyslij(zmiany);
      await zapiszUdana();
      ustaw(widok.stan === 'blad' ? { stan: 'aktywna', przyczyna: null, synchronizuje: false } : { synchronizuje: false }); // ustąpienie przyczyny
    } catch (e) {
      ustaw({ stan: 'blad', przyczyna: przyczynaZ(e), synchronizuje: false }); // zmiany zostają w skrzynce do następnej próby
    }
  }
  async function wlaczZKontem(zerujSilnik: boolean): Promise<WidokSynchronizacji> {
    const status = await z.synchronizacja.statusKonta();
    if (status !== 'dostepne') { ustaw({ stan: 'brak_konta', przyczyna: null, status }); return widok; } // N3: ograniczone i inne = brak_konta, tekst 04
    await wKolejce(z.baza, () => z.baza.transakcja((tx) => wlaczWBazie(tx, teraz(), zerujSilnik)));
    ustaw({ stan: 'aktywna', przyczyna: null, status });
    await z.synchronizacja.uruchom((await stanBazy(z.baza)).stanSilnika);
    await wyslijZaleglosci({ zawsze: true });
    return widok;
  }
  async function wylaczWszystko(): Promise<void> {
    await wKolejce(z.baza, () => z.baza.transakcja((tx) => wylaczWBazie(tx, teraz())));
    await z.synchronizacja.wylacz();
    ustaw({ stan: 'wylaczona', przyczyna: null });
  }
  async function odbierzPartie(p: PartiaIcloud): Promise<WynikPartii> {
    // Zasoby do magazynu PRZED transakcją; SHA-256 ≠ klucz → bez wiersza `plik`, wpis `blad`; plik bez wiersza usuwa start (ADR-0001, 05-architekt-513).
    const pliki = new Set<string>();
    const zle: string[] = [];
    for (const r of p.rekordy) {
      if (!tabelaIcloud(r.encja)?.zasob || !r.plik) continue;
      const roz = typeof r.pola.rozszerzenie === 'string' ? r.pola.rozszerzenie : 'bin';
      const w = await z.magazyn.zapisz(r.plik, roz);
      if (!w.ok) continue;
      if (w.wartosc.sha256 === r.klucz) { pliki.add(r.klucz); continue; }
      zle.push(r.klucz);
    }
    for (const r of await wiersze(z.baza.all('SELECT sha256 FROM plik'), 'odbior')) pliki.add(tekst(r, 'sha256')); // już w magazynie
    const wynik = await wKolejce(z.baza, () => z.baza.transakcja(async (tx) => {
      for (const k of zle) { pliki.delete(k); await zapiszBladW(tx, { czasMs: teraz(), kod: 'icloud_zly_zasob', szczegoly: {} }); }
      return zastosujPartie(tx, p, teraz(), pliki);
    }));
    await zapiszUdana(); // odebrana partia to też udana synchronizacja
    poPartii(wynik);
    return wynik;
  }
  async function poPotwierdzeniu(p: PotwierdzenieIcloud): Promise<void> {
    await wKolejce(z.baza, () => z.baza.transakcja((tx) => potwierdzWyslane(tx, p)));
    if ((await stanBazy(z.baza)).zalegle > 0) await wyslijZaleglosci(); // reszta skrzynki (partie po PARTIA_SYNCHRONIZACJI)
  }
  function zdarzenieKonta(e: ZdarzenieKonta): void {
    if (widok.stan === 'wylaczona') return;
    if (e === 'zmiana_konta') ustaw({ stan: 'konto_zmienione', przyczyna: null });
    else if (e === 'wylogowano') ustaw({ stan: 'brak_konta', przyczyna: null, status: 'brak_konta' });
    else if (widok.stan === 'brak_konta') ustaw({ stan: 'aktywna', przyczyna: null, status: 'dostepne' });
  }

  return {
    async start() {
      odpiecia.push(z.synchronizacja.odbieraj(async (p) => { await odbierzPartie(p); }));
      odpiecia.push(z.synchronizacja.wyslane(poPotwierdzeniu));
      odpiecia.push(z.synchronizacja.zdarzeniaKonta(zdarzenieKonta));
      const s = await stanBazy(z.baza);
      if (!s.wlaczona) { ustaw({ stan: 'wylaczona' }); return; }
      const status = await z.synchronizacja.statusKonta();
      if (status !== 'dostepne') { ustaw({ stan: 'brak_konta', status }); return; }
      ustaw({ stan: 'aktywna', status });
      await z.synchronizacja.uruchom(s.stanSilnika);
      await wyslijZaleglosci();
    },
    wlacz: () => wlaczZKontem(false),
    wylacz: wylaczWszystko,
    polacz: () => wlaczZKontem(true), // inne konto: pełne ponowne wysłanie, scalenie przez `scal` u odbiorcy
    nieSynchronizuj: wylaczWszystko,
    wyslijZaleglosci,
    async usunZIcloud() { return z.synchronizacja.usunStrefe(); }, // po „Usuń wszystkie dane” (skrzynka pusta, synchronizacja wyłączona — L1)
    odbierzPartie,
    widok: () => widok,
    obserwuj(fn) { sluchacze.add(fn); return () => { sluchacze.delete(fn); }; },
    zakoncz() { for (const o of odpiecia.splice(0)) o(); },
  };
}

/** Wersja licznika w konflikcie do wyboru (P-220 I1a, design-spec „iCloud”): wartość gałęzi, urządzenie i czas jej ostatniej zmiany. */
export type KandydatKonfliktu = { glowa: string; wartosc: number; urzadzenie: string; rodzaj: RodzajUrzadzenia | null; czasMs: number; tutaj: boolean };

/** Kandydaci liczeni przy pokazaniu (moduly.md „Ścieżka zapisu +1”: +1 w konflikcie zmienia lokalną gałąź); null = brak konfliktu. Najnowsza pierwsza. */
export async function kandydaciKonfliktu(z: Pick<Zaleznosci, 'baza' | 'urzadzenie'>, licznikId: string): Promise<KandydatKonfliktu[] | null> {
  const w = scal(await zdarzeniaDoScalenia(z.baza, licznikId));
  if (w.stan !== 'konflikt') return null;
  const out: KandydatKonfliktu[] = [];
  for (const k of w.kandydaci) {
    const [r] = await wiersze(z.baza.all('SELECT urzadzenie, urzadzenie_rodzaj, czas_ms FROM zdarzenie WHERE id = ?', [k.glowa]), 'kandydaciKonfliktu');
    const rodzaj = r ? STANY['zdarzenie.urzadzenie_rodzaj'].find((x) => x === r.urzadzenie_rodzaj) ?? null : null;
    if (r) out.push({ glowa: k.glowa, wartosc: k.wartosc, urzadzenie: tekst(r, 'urzadzenie'), rodzaj, czasMs: liczba(r, 'czas_ms'), tutaj: tekst(r, 'urzadzenie') === z.urzadzenie });
  }
  return out.sort((a, b) => b.czasMs - a.czasMs || a.glowa.localeCompare(b.glowa));
}

/**
 * Wybór wersji: zdarzenie `rozstrzygniecie` z rodzicami = wszystkie głowy i wartością wybranej (jedyne zdarzenie łączące gałęzie, M-09); nie zaczyna dnia
 * limitu (`edycja-historii`, P-067). Druga wersja zostaje w historii. Głowa spoza bieżących kandydatów → `bledne_dane` (ekran pokazał stary stan).
 */
export function rozstrzygnijKonflikt(z: Zaleznosci, w: { licznikId: string; glowa: string }): Promise<Wynik<{ wartosc: number }>> {
  return operacjaZapisu(z, 'rozstrzygnijKonflikt', async (tx, terazMs, chwila) => {
    const s = scal(await zdarzeniaDoScalenia(tx, w.licznikId));
    const wybrany = s.stan === 'konflikt' ? s.kandydaci.find((k) => k.glowa === w.glowa) : undefined;
    if (s.stan !== 'konflikt' || !wybrany) return { ok: false, powod: 'bledne_dane' };
    await dopiszZdarzenie(tx, {
      id: z.id.nowy(), licznikId: w.licznikId, rodzaj: 'rozstrzygniecie', wartosc: wybrany.wartosc, wartoscPo: wybrany.wartosc, rodzice: [...s.glowy], cofa: [],
      zrodlo: 'aplikacja', urzadzenie: z.urzadzenie, urzadzenieRodzaj: z.rodzajUrzadzenia, czasMs: terazMs, strefa: chwila.strefa, dzien: chwila.dzien,
    });
    await przeliczLicznik(tx, w.licznikId, terazMs);
    return { ok: true, wartosc: { wartosc: wybrany.wartosc } };
  });
}
