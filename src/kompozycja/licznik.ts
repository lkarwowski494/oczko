// Kompozycja ekranu licznika (08 partia 4, 3A): przypadki użycia → stan ekranu (teksty przez t(), formaty Intl w języku aplikacji, ADR-0017).
// Bieżący licznik z `ostatnie_miejsce` (F-49); pierwszy +1 świeżej instalacji tworzy projekt roboczy (BR-LIC-001, NFR-PIE-001). Po każdym
// zapisie: potwierdzenia zegarka, potem ekran blokady i zegarek (ADR-0008 (7), ADR-0009 pkt 3); Live Activity startuje po pierwszym +1 procesu.
import type { Wynik } from '../domena/bledy';
import { czescNaLiczniku } from '../domena/nazwa-czesci';
import { formatujGodzine } from '../i18n/format';
import type { BanerLicznika, StanEkranuLicznika, WynikPlus } from '../ekrany/Licznik';
import type { DzialaniaLicznika, StanStartu, UslugiAplikacji } from '../ekrany/Aplikacja';
import type { Tlumacz, WynikEkranu } from '../ekrany/wspolne';
import { odswiezEkranBlokady, type ZaleznosciEkranuBlokady } from '../przypadki-uzycia/ekran-blokady';
import { cofnijSerie, dodajRzad, odejmijRzad, utworzSzybkiLicznik, ustawBlokade, wpiszWartosc } from '../przypadki-uzycia/licznik';
import { naPierwszyPlan, przyTle, uruchomDane, type WynikStartuDanych } from '../przypadki-uzycia/start';
import { widokProjektu } from '../przypadki-uzycia/widok-projektu';
import { biezacyLicznik, widokLicznika, zapamietajLicznik, type WidokLicznika } from '../przypadki-uzycia/widok-licznika';
import { miejscePracy, type MiejscePracy } from './miejsce-pracy';
import type { ZaleznosciDziennika, ZaleznosciStartu } from '../przypadki-uzycia/zaleznosci';
import { kandydaciKonfliktu, rozstrzygnijKonflikt } from '../przypadki-uzycia/synchronizacja';
import { celDniaOsiagniety, wejscie, zdarzeniaPlus } from './licznik-zdarzenia';
import { odbiorZZegarka } from './zegarek-odbior';
import { dostepLicznika, type DostepLicznika } from './licznik-dostep';

export type ZaleznosciKompozycji = ZaleznosciStartu & ZaleznosciDziennika & ZaleznosciEkranuBlokady;
import { etykietaRobocza, stanEkranu, type Jezyk } from './licznik-stan';
export { miesiac, etykietaRobocza, stanEkranu, type Jezyk } from './licznik-stan';

export type KompozycjaLicznika = {
  /** Start zawsze na „Dziś” (ZM-18, P-569); `miejsce`: cel „Kontynuuj ›”. */
  przygotuj(): Promise<Wynik<{ cel: 'dzis'; miejsce: MiejscePracy }>>;
  miejsce(): Promise<Wynik<MiejscePracy>>;
  /** Kafel „Dodaj wzór” bez żadnego projektu zakłada projekt roboczy jak pierwsze „+1” (BY-003, KO-067); `true` = założono, `false` = są projekty albo bieżący licznik. */
  zalozRoboczyGdyPusto(): Promise<Wynik<boolean>>;
  uslugi: UslugiAplikacji;
  dzialania: DzialaniaLicznika;
  otworz(licznikId: string): Promise<void>;
  /** Id licznika na ekranie licznika (`null` przed pierwszym +1 albo po usunięciu bez zastępstwa). */
  biezacy(): string | null;
  /** Po usunięciu w projekcie (C2): bieżący licznik w koszu → pierwszy dostępny licznik projektu albo żaden; inaczej jak `poZmianie`. */
  poUsunieciu(projektId: string): Promise<void>;
  /** Rośnie przy każdym `otworz` i `poZmianie` — ekran licznika przeładowuje stan po powrocie z listy albo arkusza. */
  wersja(): number;
  /** 07-jakosc-005 (ADR-0030): +1 z zegarka scalone przy otwartej aplikacji (`wersja` już wzrosła) → ekran czyta stan od nowa; telefon nie wibruje (pkt 5). Zwraca odpięcie. */
  poZegarku(f: () => void): () => void;
  /** M1-063: zmiana Pro przeliczona → ekran od nowa (licznik-dostep.ts). */
  poDostepie(f: () => void): () => void;
  /** R-020 (p2): po scaleniu dziennika; odpięcie. */
  poScaleniu(f: () => void): () => void;
  /** Zamknięcie kontenera: odpięcie `Zegarek.odbieraj` (ADR-0030 pkt 1). */
  zamknij(): void;
  /** Bieżący model licznika dla arkuszy (menu, formularze, historia); `null` przed pierwszym +1. */
  widok(): Promise<WidokLicznika | null>;
  /** Po zapisie z arkusza: stan ekranu blokady i zegarka, potem przeładowanie ekranu licznika. */
  poZmianie(): Promise<void>;
  /**
   * Wpisanie wartości z arkusza (F-45; 07-jakosc-011 S4, RD-13-W23): zapis, odświeżenie i — gdy nowy rząd w robocie ma przypomnienie — jedno wejście w rząd
   * (najnowsze, nie każde pominięte). Mniejsza wartość nie daje sygnału (RD-13-W8). `wibracje` = preferencja haptyki.
   */
  wpisz(wartosc: number): Promise<WynikEkranu<{ wejscieWPrzypomnienie: ReturnType<typeof wejscie>; wibracje: boolean }>>;
  /** Po „Usuń wszystkie dane” albo imporcie „zastąp”: zapomniany licznik, ekran od zera (NFR-PIE-001). */
  zresetuj(): void;
  /** Etykieta projektu jak na ekranie (projekt roboczy przez t(), P-126 (1b)). */
  nazwaProjektu(w: WidokLicznika): string;
  /** Licznik w konflikcie iCloud (partia 7, P-220 I1a): wybory arkusza (`dane.konflikt_wybor`, `dane.konflikt_a11y`) i wybór wersji. */
  konflikt: { kandydaci(): Promise<WyborKonfliktu[]>; wybierz(glowa: string): Promise<WynikEkranu<void>> };
};
/** Nazwy własne urządzeń Apple (bez tłumaczenia, jak w tekstach 04: „this iPhone”). */
const NAZWA_URZADZENIA = { iphone: 'iPhone', ipad: 'iPad' } as const;
export type WyborKonfliktu = { glowa: string; wartosc: number; tekst: string; etykieta: string };
/** Opcje: `icloud` = sterownik synchronizacji (partia 7), uruchamiany po danych startu i poza kolejką `uruchomDane`; `aplikacjaAktywna` = `AppState === 'active'` — bez niej nie ma odbioru z zegarka (ADR-0030, ARCH-13). */
export type OpcjeKompozycji = { wibracje(): boolean; dostep?: DostepLicznika; aplikacjaAktywna?(): boolean; ekranWlaczony?(): boolean; icloud?: { start(): Promise<void> }; skrzynka?: { start(): Promise<void>; migawka(): Promise<unknown> } }; // skrzynka: partia 6 (P-246); migawka po zmianach listy projektów

/** `przygotuj` uruchamia dane raz na proces (ADR-0019: błąd → ekran awaryjny, wołający); potem ekran licznika czyta przez `uslugi`. */
export function kompozycjaLicznika(z: ZaleznosciKompozycji, j: Jezyk, o: OpcjeKompozycji = { wibracje: () => true }): KompozycjaLicznika {
  let licznikId: string | null = null;
  let start: Promise<Wynik<WynikStartuDanych>> | null = null;
  let baner: BanerLicznika = null;
  let aktywnosc = false;
  /** Rzędy zrobione dziś w ostatnio odczytanym stanie (punkt odniesienia „cel dnia osiągnięty” po +1; jeden dzień, jeden projekt). */
  let zrobioneDzis: { projektId: string; dzien: string; rzedy: number } | null = null;
  let wersja = 0;
  const poScaleniu = new Set<() => void>();
  // P-287: +1 w toku (pierwsze tworzy projekt roboczy i ustawia licznikId). Odczyt ekranu rozpoczęty w tym czasie (przemontowanie po naPartie,
  // poZmianie, odswiez) czeka na zapis — inaczej nowy ekran pokazałby stan sprzed stuknięcia, a wynik +1 trafiłby do odmontowanego komponentu.
  let plusWToku: Promise<unknown> = Promise.resolve();
  async function stanPoZapisie(): Promise<{ s: StanEkranuLicznika; w: WidokLicznika | null }> {
    await plusWToku;
    return stan();
  }

  async function stan(): Promise<{ s: StanEkranuLicznika; w: WidokLicznika | null }> {
    const ch = z.zegar.teraz();
    let w: WidokLicznika | null = null;
    if (licznikId) {
      const r = await widokLicznika(z, { licznikId });
      if (r.ok) w = r.wartosc;
    }
    zrobioneDzis = w && w.zrobioneDzis !== null ? { projektId: w.projektId, dzien: w.dzis, rzedy: w.zrobioneDzis } : null;
    const s = stanEkranu(w, { j, dzis: ch.dzien, terazMs: ch.ms, strefa: ch.strefa, baner, wibracje: o.wibracje() });
    return { s: { ...s, konflikt: licznikId ? await liniaKonfliktu(licznikId) : null }, w };
  }
  /** Linia konfliktu (P-220 I1a): liczba = wersja tego urządzenia, druga = najnowsza z innego urządzenia; null bez konfliktu. */
  async function liniaKonfliktu(id: string): Promise<StanEkranuLicznika['konflikt']> {
    const k = await kandydaciKonfliktu(z, id);
    if (!k) return null;
    const tutaj = k.find((x) => x.tutaj);
    const inna = k.find((x) => !x.tutaj) ?? k.find((x) => x !== tutaj);
    return inna ? { lokalna: tutaj?.wartosc ?? 0, zdalna: inna.wartosc, urzadzenie: inna.rodzaj ? NAZWA_URZADZENIA[inna.rodzaj] : inna.urzadzenie } : null;
  }
  async function poZapisie(w: WidokLicznika | null): Promise<void> {
    if (!w) return;
    const nazwa = w.projekt.nienazwany ? etykietaRobocza(w.projekt.utworzonoMs, z.zegar.teraz().ms, j, z.zegar.teraz().strefa) : w.projekt.nazwa;
    const e = await odswiezEkranBlokady(z, { licznikId: w.licznikId, nazwa, dostep: dostep.biezacy() });
    if (e.ok && !aktywnosc) {
      aktywnosc = true;
      await z.liveActivity.start(e.wartosc);
    }
  }
  const potwierdz = (ids: readonly string[]) => { if (ids.length > 0) z.zegarek.potwierdz(ids); };
  /** Przebieg odbioru +1 z zegarka (ADR-0030 pkt 2): scalenie → potwierdzenia → stan → ekran od nowa → ekran blokady i zegarek (z potwierdzonymi id). */
  async function scalenieZZegarka(): Promise<Wynik<unknown>> {
    const r = await naPierwszyPlan(z);
    if (!r.ok) return r;
    potwierdz(r.wartosc.potwierdzone);
    const { w } = await stanPoZapisie();
    wersja += 1;
    odbior?.poScaleniu();
    await poZapisie(w);
    return r;
  }
  const odbior = o.aplikacjaAktywna ? odbiorZZegarka(z, { aktywna: o.aplikacjaAktywna, scal: scalenieZZegarka }) : null;
  const dostep = dostepLicznika(o.dostep, z.pro, () => k.poZmianie()); // M1-063, M1-064
  const ekranu = <T>(w: Wynik<T>): WynikEkranu<T> => (w.ok ? w : { ok: false, powod: w.powod === 'limit' || w.powod === 'zablokowany' || w.powod === 'bledne_dane' || w.powod === 'niedozwolone_przejscie' ? w.powod : 'zapis' });

  /** Projekt roboczy z jedną częścią i licznikiem, ustawiony jako bieżący (BR-LIC-001/S2); wspólny dla pierwszego „+1” i kafla „Dodaj wzór” (BY-003). */
  async function zalozRoboczy(): Promise<Wynik<{ projektId: string; czescId: string; licznikId: string }>> {
    const n = await utworzSzybkiLicznik(z);
    if (!n.ok) return n;
    const id = n.wartosc.licznikId;
    licznikId = id;
    await zapamietajLicznik(z, { licznikId: id });
    return n;
  }

  /** +1 z ekranu (BR-LIC-001/S2: pierwsze tworzy projekt roboczy); przez `uslugi.dodajRzad`, które zapamiętuje zapis w toku (P-287). */
  async function plusZEkranu(): Promise<WynikPlus> {
    let id = licznikId;
    if (!id) { // pierwsze +1 bez projektu: projekt roboczy, potem zwykłe +1 (BR-LIC-001/S2)
      const n = await zalozRoboczy();
      if (!n.ok) return ekranu(n);
      id = n.wartosc.licznikId;
    }
    const przed = zrobioneDzis; // stan sprzed tego +1 (ekran czyta go przy starcie i po każdym +1)
    const r = await dodajRzad(z, { licznikId: id });
    if (!r.ok) return ekranu(r);
    baner = null; // baner „Removed …” znika przy kolejnym +1 (design-spec „Baner strażnika”)
    const { w } = await stan();
    void poZapisie(w);
    if (!w) return { ok: false, powod: 'bledne_dane' };
    const sygnal = wejscie(w, r.wartosc.wartosc - 1);
    return { ok: true, wartosc: { skonczone: w.wartosc, dziergany: w.wartosc + 1, zdarzenia: zdarzeniaPlus(w, sygnal !== null, celDniaOsiagniety(przed, w)), wejscieWPrzypomnienie: sygnal } };
  }

  const k: KompozycjaLicznika = {
    async przygotuj() {
      const d = await (start ??= uruchomDane(z).then(async (r) => {
        if (r.ok && o.skrzynka) void o.skrzynka.start().catch(() => undefined); // partia 6: skrzynka importu i migawka w tle (konwersja może czekać na sieć; NFR-PIE-001)
        if (r.ok && o.icloud) void o.icloud.start().catch(() => undefined); // w tle jak skrzynka (P-274 Q2a): sendChanges przez sieć nie blokuje pierwszego ekranu; odebrane partie odświeżają licznik (naPartie), błąd silnika = stan w Data and sync
        if (r.ok) odbior?.podlacz(); // 07-jakosc-005 (ADR-0030 pkt 1): po danych startu, raz na proces
        return r;
      }));
      if (!d.ok) return d;
      potwierdz(d.wartosc.potwierdzone);
      const b = await biezacyLicznik(z);
      if (!b.ok) return b;
      licznikId = b.wartosc;
      const m = await k.miejsce();
      return m.ok ? { ok: true, wartosc: { cel: 'dzis', miejsce: m.wartosc } } : m;
    },
    miejsce: () => miejscePracy(z, licznikId),
    async zalozRoboczyGdyPusto() { // BY-003 (KO-067): świeża instalacja — żadnego projektu poza koszem i żadnego bieżącego licznika → projekt roboczy; inaczej nic
      if (licznikId) return { ok: true, wartosc: false };
      try {
        const [p] = await z.baza.all('SELECT 1 AS jest FROM projekt WHERE usunieto_ms IS NULL LIMIT 1', []);
        if (p) return { ok: true, wartosc: false };
      } catch { return { ok: false, powod: 'zapis' }; }
      const n = await zalozRoboczy();
      return n.ok ? { ok: true, wartosc: true } : n;
    },
    wersja: () => wersja,
    poZegarku: (f) => odbior?.nasluchuj(f) ?? (() => undefined),
    poDostepie: dostep.poDostepie,
    poScaleniu: (f) => { poScaleniu.add(f); return () => { poScaleniu.delete(f); }; },
    zamknij: () => { odbior?.zamknij(); dostep.zamknij(); },
    biezacy: () => licznikId,
    async poUsunieciu(projektId) {
      if (licznikId && !(await widokLicznika(z, { licznikId })).ok) {
        const p = await widokProjektu(z, { projektId });
        const nastepny = p.ok ? p.wartosc.czesci.flatMap((c) => c.liczniki)[0]?.id : undefined;
        if (nastepny) await k.otworz(nastepny);
        else k.zresetuj();
      }
      await k.poZmianie();
    },
    zresetuj() { void o.skrzynka?.migawka(); licznikId = null; baner = null; aktywnosc = false; wersja += 1; void z.liveActivity.zakoncz(); },
    widok: async () => (await stan()).w,
    async poZmianie() {
      void o.skrzynka?.migawka().catch(() => undefined); // partia 6: migawka dla rozszerzenia po każdej zmianie projektu (kontrakt: po COMMIT operacji listy)
      baner = null;
      const { w } = await stanPoZapisie();
      await poZapisie(w);
      wersja += 1;
    },
    konflikt: {
      async kandydaci() {
        if (!licznikId) return [];
        const ch = z.zegar.teraz();
        const godz = (ms: number) => formatujGodzine(new Date(ms), j.jezyk(), { uses24h: j.zegar24h(), strefa: ch.strefa });
        return ((await kandydaciKonfliktu(z, licznikId)) ?? []).map((x) => {
          const u = x.rodzaj ? NAZWA_URZADZENIA[x.rodzaj] : x.urzadzenie; // P-247 U6a: rodzaj zamiast UUID; bez rodzaju (zegarek, atrapa) pole
          return {
            glowa: x.glowa, wartosc: x.wartosc,
            tekst: j.t('dane.konflikt_wybor', { count: x.wartosc, urzadzenie: u, godzina: godz(x.czasMs) }),
            etykieta: j.t('dane.konflikt_a11y', { count: x.wartosc, urzadzenie: u, godzina: godz(x.czasMs) }),
          };
        });
      },
      async wybierz(glowa) {
        if (!licznikId) return { ok: false, powod: 'bledne_dane' };
        const r = await rozstrzygnijKonflikt(z, { licznikId, glowa });
        if (!r.ok) return ekranu(r);
        await k.poZmianie();
        return { ok: true, wartosc: undefined };
      },
    },
    async wpisz(wartosc) {
      if (!licznikId) return { ok: false, powod: 'bledne_dane' };
      const przed = (await stan()).w?.wartosc;
      const r = await wpiszWartosc(z, { licznikId, wartosc });
      if (!r.ok) return ekranu(r);
      await k.poZmianie();
      const { w } = await stan();
      return { ok: true, wartosc: { wejscieWPrzypomnienie: w && przed !== undefined ? wejscie(w, przed) : null, wibracje: o.wibracje() } };
    },
    nazwaProjektu: (w) => (w.projekt.nienazwany ? etykietaRobocza(w.projekt.utworzonoMs, z.zegar.teraz().ms, j, z.zegar.teraz().strefa) : w.projekt.nazwa),
    async otworz(id) {
      licznikId = id;
      baner = null;
      wersja += 1;
      await zapamietajLicznik(z, { licznikId: id });
    },
    uslugi: {
      async start(): Promise<StanStartu> {
        const { s, w } = await stanPoZapisie();
        void poZapisie(w); // stan ekranu blokady po starcie (po scaleniu dziennika i potwierdzeniach zegarka)
        return { licznik: s, ekranWlaczony: o.ekranWlaczony?.() ?? true }; // F-10, BR-LIC-013/S2: preferencja „Keep screen on” (ADR-0029); domyślnie włączona
      },
      dodajRzad(): Promise<WynikPlus> {
        const p = plusZEkranu();
        plusWToku = p.catch(() => undefined);
        return p;
      },
      async scalDziennik() {
        dostep.odswiez(); // M1-063
        void o.skrzynka?.start().catch(() => undefined); // partia 6: nowe zlecenia z rozszerzenia po powrocie na pierwszy plan
        const r = await naPierwszyPlan(z);
        if (r.ok) potwierdz(r.wartosc.potwierdzone);
        const { w } = await stan();
        await poZapisie(w);
        poScaleniu.forEach((f) => f());
      },
      przyTle: async () => { await o.skrzynka?.migawka().catch(() => undefined); await przyTle(z); },
      ekranWlaczony: () => o.ekranWlaczony?.() ?? true, // M1-audytor-generalny-059: preferencja w chwili wejścia na licznik, nie ze startu
    },
    dzialania: {
      async naMinus() {
        if (!licznikId) return { ok: true, wartosc: { skonczone: 0 } }; // −1 przed pierwszym +1: zostaje 0, bez zapisu i bez komunikatu (BR-LIC-002/S3)
        const r = await odejmijRzad(z, { licznikId });
        if (!r.ok) return ekranu(r);
        baner = null;
        void stan().then(({ w }) => poZapisie(w));
        return { ok: true, wartosc: { skonczone: r.wartosc.wartosc } };
      },
      async naCofnijSerie() {
        if (!licznikId) return;
        const { w } = await stan();
        if (!w?.seria) return;
        const r = await cofnijSerie(z, { licznikId, odZdarzeniaId: w.seria.odZdarzeniaId, zrodlo: 'pytanie-serii' });
        if (r.ok) baner = { rodzaj: 'cofnieto', n: w.seria.ile, wartosc: r.wartosc.wartosc };
      },
      async naOdblokuj() {
        if (!licznikId) return;
        const r = await ustawBlokade(z, { licznikId, zablokowany: false });
        if (r.ok) void stan().then(({ w }) => poZapisie(w)); // N1: stan blokady na ekranie blokady i zegarku
      },
      odswiez: async () => (await stanPoZapisie()).s,
    },
  };
  return k;
}
