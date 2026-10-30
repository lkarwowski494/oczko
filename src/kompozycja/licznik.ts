// Kompozycja ekranu licznika (08 partia 4, 3A): przypadki użycia → stan ekranu (teksty przez t(), formaty Intl w języku aplikacji, ADR-0017).
// Bieżący licznik z `ostatnie_miejsce` (F-49); pierwszy +1 świeżej instalacji tworzy projekt roboczy (BR-LIC-001, NFR-PIE-001). Po każdym
// zapisie: potwierdzenia zegarka, potem ekran blokady i zegarek (ADR-0008 (7), ADR-0009 pkt 3); Live Activity startuje po pierwszym +1 procesu.
import type { Wynik } from '../domena/bledy';
import { sygnalZmiany } from '../domena/przypomnienia';
import { formatujGodzine } from '../i18n/format';
import type { BanerLicznika, StanEkranuLicznika, WynikPlus, ZdarzeniePlus } from '../ekrany/Licznik';
import type { DzialaniaLicznika, StanStartu, UslugiAplikacji } from '../ekrany/Aplikacja';
import type { Tlumacz, WynikEkranu } from '../ekrany/wspolne';
import { odswiezEkranBlokady, type ZaleznosciEkranuBlokady } from '../przypadki-uzycia/ekran-blokady';
import { cofnijSerie, dodajRzad, odejmijRzad, utworzSzybkiLicznik, ustawBlokade } from '../przypadki-uzycia/licznik';
import { naPierwszyPlan, przyTle, uruchomDane, type WynikStartuDanych } from '../przypadki-uzycia/start';
import { widokProjektu } from '../przypadki-uzycia/widok-projektu';
import { biezacyLicznik, widokLicznika, zapamietajLicznik, type WidokLicznika } from '../przypadki-uzycia/widok-licznika';
import type { ZaleznosciDziennika, ZaleznosciStartu } from '../przypadki-uzycia/zaleznosci';
import { kandydaciKonfliktu, rozstrzygnijKonflikt } from '../przypadki-uzycia/synchronizacja';

export type ZaleznosciKompozycji = ZaleznosciStartu & ZaleznosciDziennika & ZaleznosciEkranuBlokady;
export type Jezyk = { t: Tlumacz; jezyk(): string; zegar24h(): boolean };

const miesiac = (dzien: string, j: string, dzienMiesiaca = false) =>
  new Intl.DateTimeFormat(j, { month: 'long', ...(dzienMiesiaca ? { day: 'numeric' } : {}), timeZone: 'UTC' })
    .format(new Date(Date.UTC(Number(dzien.slice(0, 4)), Number(dzien.slice(5, 7)) - 1, Number(dzien.slice(8, 10)) || 1)));

/** Etykieta projektu roboczego (design-spec „Projekt roboczy”, P-126 (1b)): data i godzina startu w formacie regionu, rok tylko gdy inny niż bieżący. */
export function etykietaRobocza(utworzonoMs: number, terazMs: number, j: Jezyk, strefa: string): string {
  const rok = (ms: number) => new Intl.DateTimeFormat('en-CA', { year: 'numeric', timeZone: strefa }).format(new Date(ms));
  const data = new Intl.DateTimeFormat(j.jezyk(), {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: !j.zegar24h(), timeZone: strefa,
    ...(rok(utworzonoMs) !== rok(terazMs) ? { year: 'numeric' } : {}),
  }).format(new Date(utworzonoMs));
  return j.t('projekty.nazwa_robocza', { data });
}

/** Stan ekranu z modelu odczytu; `null` = przed pierwszym +1 (licznik bez projektu z 0, NFR-PIE-001). */
export function stanEkranu(w: WidokLicznika | null, o: { j: Jezyk; dzis: string; terazMs: number; strefa: string; baner: BanerLicznika; wibracje: boolean }): StanEkranuLicznika {
  const { j } = o;
  const mies = { nazwa: miesiac(o.dzis, j.jezyk()), wznowienie: miesiac(w ? w.wznowienie : o.dzis, j.jezyk(), true), rzedyDanych: w ? w.wartosc : 0 };
  if (!w) {
    return {
      projekt: null, czesc: null, skonczone: 0, dziergany: 1, znaczenie: 'skonczone', cel: null, celDnia: null, przypomnienie: null, powtorzenie: null,
      notatka: null, sesja: null, zablokowany: false, limit: { rodzaj: 'brak' }, miesiac: mies, baner: null, blizniak: null, wibracje: o.wibracje,
    };
  }
  return {
    projekt: w.projekt.nienazwany ? etykietaRobocza(w.projekt.utworzonoMs, o.terazMs, j, o.strefa) : w.projekt.nazwa,
    czesc: w.projekt.nienazwany ? null : w.czesc.nazwa, // nazwa części roboczej to data startu: nie pokazywana (design-spec „Projekt roboczy”)
    skonczone: w.wartosc, dziergany: w.wartosc + 1, znaczenie: w.znaczenie, cel: w.czesc.cel,
    celDnia: w.celDnia === null ? null : { rzedy: w.celDnia },
    calosc: w.calosc === null ? null : { czesc: w.czesc.nazwa, rzedy: w.calosc }, // BR-LIC-018/S1
    przypomnienie: w.przypomnienie,
    powtorzenie: w.powtorzenie && { nazwa: w.nazwa || w.czesc.nazwa, ...w.powtorzenie },
    notatka: w.projekt.notatka || null,
    sesja: w.sesja && { rzedy: w.sesja.rzedy, od: formatujGodzine(new Date(w.sesja.odMs), j.jezyk(), { uses24h: j.zegar24h(), strefa: o.strefa }) },
    zablokowany: w.zablokowany, limit: { rodzaj: w.limit }, miesiac: mies,
    baner: o.baner ?? (w.seria ? { rodzaj: 'seria', n: w.seria.ile, sekundy: w.seria.sekundy } : null),
    blizniak: w.blizniak, wibracje: o.wibracje,
  };
}

/** Sygnał wejścia w rząd z instrukcją przy zmianie skończonych (RD-13-W20–W25, P-161): tylko z `sygnalZmiany`, nigdy ze stanu pasa. */
function wejscie(w: WidokLicznika, przed: number): { rzad: number; tekst: string; ktory: number; razy: number } | null {
  for (const p of w.plany) {
    const s = sygnalZmiany(przed, w.wartosc, p);
    if (s.ok && s.wartosc.rzadSygnalu !== null) return { rzad: s.wartosc.rzadSygnalu, tekst: p.tekst, ktory: (s.wartosc.rzadSygnalu - p.od) / p.co + 1, razy: p.razy };
  }
  return null;
}
/** Zdarzenia F-48 po +1 (haptyka „rząd ze znaczeniem”): wejście w rząd z instrukcją (sygnał RD-13), koniec powtórzenia, cel części. */
function zdarzeniaPlus(w: WidokLicznika, sygnal: boolean): ZdarzeniePlus[] {
  const z: ZdarzeniePlus[] = ['rzad'];
  if (sygnal) z.push('przypomnienie');
  if (w.powtorzenie && w.powtorzenie.rzadW === 1 && w.wartosc > 0) z.push('koniec-powtorzenia');
  if (w.czesc.cel !== null && w.wartosc === w.czesc.cel) z.push('cel-czesci');
  return z;
}

export type KompozycjaLicznika = {
  przygotuj(): Promise<Wynik<{ cel: 'licznik' | 'lista' }>>;
  uslugi: UslugiAplikacji;
  dzialania: DzialaniaLicznika;
  otworz(licznikId: string): Promise<void>;
  /** Id licznika na ekranie licznika (`null` przed pierwszym +1 albo po usunięciu bez zastępstwa). */
  biezacy(): string | null;
  /** Po usunięciu w projekcie (C2): bieżący licznik w koszu → pierwszy dostępny licznik projektu albo żaden; inaczej jak `poZmianie`. */
  poUsunieciu(projektId: string): Promise<void>;
  /** Rośnie przy każdym `otworz` i `poZmianie` — ekran licznika przeładowuje stan po powrocie z listy albo arkusza. */
  wersja(): number;
  /** Bieżący model licznika dla arkuszy (menu, formularze, historia); `null` przed pierwszym +1. */
  widok(): Promise<WidokLicznika | null>;
  /** Po zapisie z arkusza: stan ekranu blokady i zegarka, potem przeładowanie ekranu licznika. */
  poZmianie(): Promise<void>;
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
/** Opcje: `icloud` = sterownik synchronizacji (partia 7), uruchamiany po danych startu i poza kolejką `uruchomDane`. */
export type OpcjeKompozycji = { wibracje(): boolean; icloud?: { start(): Promise<void> }; skrzynka?: { start(): Promise<void>; migawka(): Promise<unknown> } }; // skrzynka: partia 6 (P-246); migawka po zmianach listy projektów

/** `przygotuj` uruchamia dane raz na proces (ADR-0019: błąd → ekran awaryjny, wołający); potem ekran licznika czyta przez `uslugi`. */
export function kompozycjaLicznika(z: ZaleznosciKompozycji, j: Jezyk, o: OpcjeKompozycji = { wibracje: () => true }): KompozycjaLicznika {
  let licznikId: string | null = null;
  let start: Promise<Wynik<WynikStartuDanych>> | null = null;
  let baner: BanerLicznika = null;
  let aktywnosc = false;
  let wersja = 0;
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
    const e = await odswiezEkranBlokady(z, { licznikId: w.licznikId, nazwa, dostep: { pro: z.pro(), wygasa: null } });
    if (e.ok && !aktywnosc) {
      aktywnosc = true;
      await z.liveActivity.start(e.wartosc);
    }
  }
  const potwierdz = (ids: readonly string[]) => { if (ids.length > 0) z.zegarek.potwierdz(ids); };
  const ekranu = <T>(w: Wynik<T>): WynikEkranu<T> => (w.ok ? w : { ok: false, powod: w.powod === 'limit' || w.powod === 'zablokowany' || w.powod === 'bledne_dane' || w.powod === 'niedozwolone_przejscie' ? w.powod : 'zapis' });

  /** +1 z ekranu (BR-LIC-001/S2: pierwsze tworzy projekt roboczy); przez `uslugi.dodajRzad`, które zapamiętuje zapis w toku (P-287). */
  async function plusZEkranu(): Promise<WynikPlus> {
    if (!licznikId) { // pierwsze +1 bez projektu: projekt roboczy, potem zwykłe +1 (BR-LIC-001/S2)
      const n = await utworzSzybkiLicznik(z);
      if (!n.ok) return ekranu(n);
      licznikId = n.wartosc.licznikId;
      await zapamietajLicznik(z, { licznikId });
    }
    const r = await dodajRzad(z, { licznikId });
    if (!r.ok) return ekranu(r);
    baner = null; // baner „Removed …” znika przy kolejnym +1 (design-spec „Baner strażnika”)
    const { w } = await stan();
    void poZapisie(w);
    if (!w) return { ok: false, powod: 'bledne_dane' };
    const sygnal = wejscie(w, r.wartosc.wartosc - 1);
    return { ok: true, wartosc: { skonczone: w.wartosc, dziergany: w.wartosc + 1, zdarzenia: zdarzeniaPlus(w, sygnal !== null), wejscieWPrzypomnienie: sygnal } };
  }

  const k: KompozycjaLicznika = {
    async przygotuj() {
      const d = await (start ??= uruchomDane(z).then(async (r) => {
        if (r.ok && o.skrzynka) void o.skrzynka.start().catch(() => undefined); // partia 6: skrzynka importu i migawka w tle (konwersja może czekać na sieć; NFR-PIE-001)
        if (r.ok && o.icloud) void o.icloud.start().catch(() => undefined); // w tle jak skrzynka (P-274 Q2a): sendChanges przez sieć nie blokuje pierwszego ekranu; odebrane partie odświeżają licznik (naPartie), błąd silnika = stan w Data and sync
        return r;
      }));
      if (!d.ok) return d;
      potwierdz(d.wartosc.potwierdzone);
      const b = await biezacyLicznik(z);
      if (!b.ok) return b;
      licznikId = b.wartosc;
      if (!licznikId) {
        const [p] = await z.baza.all<{ n: number }>('SELECT count(*) AS n FROM projekt WHERE usunieto_ms IS NULL');
        if (p && p.n > 0) return { ok: true, wartosc: { cel: 'lista' } }; // moduly.md:238: miejsce w koszu → lista projektów
      }
      return { ok: true, wartosc: { cel: 'licznik' } };
    },
    wersja: () => wersja,
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
        return { licznik: s, ekranWlaczony: true }; // F-10: opcja z Ustawień (3C); domyślnie włączona
      },
      dodajRzad(): Promise<WynikPlus> {
        const p = plusZEkranu();
        plusWToku = p.catch(() => undefined);
        return p;
      },
      async scalDziennik() {
        void o.skrzynka?.start().catch(() => undefined); // partia 6: nowe zlecenia z rozszerzenia po powrocie na pierwszy plan
        const r = await naPierwszyPlan(z);
        if (r.ok) potwierdz(r.wartosc.potwierdzone);
        const { w } = await stan();
        await poZapisie(w);
      },
      przyTle: async () => { await o.skrzynka?.migawka().catch(() => undefined); await przyTle(z); },
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
        const r = await cofnijSerie(z, { licznikId, odZdarzeniaId: w.seria.odZdarzeniaId });
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
