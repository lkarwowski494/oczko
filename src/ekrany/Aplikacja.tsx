// Korzeń aplikacji: pierwszy ekran, start, cykl życia (NFR-PIE-001, BR-LIC-001, KP-07, KP-08, KP-13, BR-DAN-012/S2, R-020, R-091).
// Sygnatura: propozycja 07 (E3), porty i granice zatwierdzone przez 05 (Z07-22). Pierwszy ekran to „Dziś” z kartą i „+1” — nic przed nim (NFR-PIE-001 po ZM-18, M3 p2);
// licznik na własnej trasie: `EkranLicznika` (ten sam stan i te same usługi, bez cyklu życia — korzeń „Dziś” zostaje pod licznikiem w stosie);
// nasłuch transakcji od startu (KP-07), bez przywracania i ekranu zakupu przy starcie (KP-08, KP-13); powrót na pierwszy plan scala dziennik
// +1 (R-020); przejście w tło wyłącza każdy tag ekranu aktywnego i robi checkpoint (R-091). Pozostałe działania licznika podaje kompozycja.
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import type { EkranAktywny, Haptyka, Sklep } from '../domena/porty';
import { kartaZPlusem, TAG_DZIS, TAG_LICZNIK, wejdzNaEkran } from '../przypadki-uzycia/ekran-aktywny';
import { Dzis, type DaneDzis, type KafelDzis } from './Dzis';
import { kluczRzedu, useOdliczaniePodpowiedzi } from './podpowiedz-odliczanie';
import { Licznik, type PropsLicznika, type StanEkranuLicznika, type WynikPlus } from './Licznik';
import { useKolory } from './motyw';
import type { CyklAplikacji, Oglos, System, Tlumacz } from './wspolne';

export type StanStartu = {
  licznik: StanEkranuLicznika;          // F-49: powrót do miejsca; świeża instalacja: licznik bez nazwy z 0
  ekranWlaczony: boolean;               // F-10: ekran nie gaśnie przy liczeniu
};
export interface UslugiAplikacji {
  start(): Promise<StanStartu>;
  dodajRzad(): Promise<WynikPlus>;
  scalDziennik(): Promise<void>;        // ADR-0008: przy wejściu na pierwszy plan (R-020)
  przyTle(): Promise<void>;             // wal_checkpoint(TRUNCATE) w kolejce (R-091)
  ekranWlaczony?(): boolean;            // F-10: opcja czytana przy każdym wejściu na licznik (M1-audytor-generalny-059); bez niej — wartość ze startu
}
/** Pozostałe działania ekranu licznika (kompozycja aplikacji, app/); bez nich — nic nie robią. */
export type DzialaniaLicznika = Partial<Omit<PropsLicznika, 'stan' | 't' | 'oglos' | 'haptyka' | 'naPlus'>> & {
  /** Stan licznika po zmianie z innego ekranu (np. odblokowanie, cofnięcie serii); kompozycja woła po COMMIT. */
  odswiez?(): Promise<StanEkranuLicznika>;
};
/**
 * Diagnostyka buildu E2E (FX6b, P-909): licznik wywołań obsługi „+1”/„−1”, zapisów, wartości ze stanu i odczytów stanu. Podaje ją tylko trasa licznika w buildzie E2E
 * (app/licznik.tsx przez `paneleE2e`); w wydaniu jest `undefined`, więc wywołania niczego nie robią.
 */
export type DiagnostykaLicznika = {
  wejscie(akcja: 'plus' | 'minus'): void;
  zapis(akcja: 'plus' | 'minus', ok: boolean): void;
  stan(skonczone: number): void;
  odswiezenie(zdarzenie: 'start' | 'zastosowane' | 'pominiete'): void;
};
export type PropsAplikacji = {
  porty: { sklep: Sklep; ekranAktywny: EkranAktywny; haptyka: Haptyka }; // DziennikPlus czyta przypadek użycia scalDziennik
  uslugi: UslugiAplikacji;
  cykl: CyklAplikacji;
  system: System;
  oglos: Oglos;
  t: Tlumacz;
  dzialania?: DzialaniaLicznika;
  /** Stoper sesji w pasku licznika (P-191 P1a), składany w trasie „/”. */
  stoper?: React.ReactNode;
  sprawdzStopera?: React.ReactNode; // P-191 P5a
  /** Licznik albo wzór na wierzchu stosu (U11, M1-audytor-generalny-059): tylko wtedy ekran nie gaśnie. Bez trasy (testy komponentu): zawsze. */
  naWierzchu?: boolean;
  /** „Dziś” na wierzchu (P-585): ekran nie gaśnie także tu, ale tylko gdy karta ma „+1” (`kartaZPlusem`); osobny tag `oczko-dzis`. */
  dzisNaWierzchu?: boolean;
  /** „Dziś” (M3 p2): dane spoza stanu licznika (tydzień, wolne dni, miejsce pracy) i przejścia; bez nich karta z samego stanu licznika. */
  dane?: DaneDzis | null;
  jezyk?: string;
  dzis?: { naKontynuuj?(): void; naWybierzProjekt?(): void; naUstawienia?(): void; naPrzewodnik?(): void; naKafel?(k: KafelDzis): void };
};

/** Stan licznika na ekranie i działania, które go zmieniają — wspólne dla „Dziś” i trasy licznika (jeden przypadek użycia `dodajRzad`, ZM-18). */
function useStanLicznika(uslugi: Pick<UslugiAplikacji, 'dodajRzad'>, dzialania: DzialaniaLicznika | undefined, ustawStan: React.Dispatch<React.SetStateAction<StanStartu | null>>, diagnostyka?: DiagnostykaLicznika) {
  const d = dzialania ?? {};
  // Numer ostatniej zmiany stanu licznika (wpis z +1/−1 albo początek odczytu): odczyt, który nie jest już najnowszy, kończy się po nowszej zmianie i nie nadpisuje jej starszą wartością
  // (na wolnym telefonie odczyty kończą się w innej kolejności niż zaczęły; FX6b).
  const wydanie = useRef(0);
  // „+1” w locie (CP-02): numer przy wejściu i numer ostatniego „+1” zatwierdzonego na ekranie. Pełny stan starszego „+1”, który kończy się po stanie nowszego, nie wraca na ekran;
  // nowszy „+1” zakończony niepowodzeniem niczego nie zatwierdził, więc starszy dochodzi do ekranu (stąd porównanie z ostatnim zatwierdzonym, nie z ostatnio rozpoczętym).
  const numerPlusa = useRef(0);
  const zatwierdzonyPlus = useRef(0);
  async function odswiez() {
    if (!d.odswiez) return;
    const moje = ++wydanie.current;
    diagnostyka?.odswiezenie('start');
    const l = await d.odswiez();
    if (moje !== wydanie.current) { diagnostyka?.odswiezenie('pominiete'); return; }
    diagnostyka?.odswiezenie('zastosowane');
    diagnostyka?.stan(l.skonczone);
    ustawStan((s) => (s ? { ...s, licznik: l } : s));
  }
  // Działanie zmieniające licznik poza +1/−1 (cofnięcie serii, odblokowanie): po COMMIT pełny stan z kompozycji.
  const poDzialaniu = (f?: () => unknown) => async () => { await f?.(); await odswiez(); };
  async function naPlus(): Promise<WynikPlus> {
    diagnostyka?.wejscie('plus');
    const mojPlus = ++numerPlusa.current;
    const w = await uslugi.dodajRzad();
    diagnostyka?.zapis('plus', w.ok);
    if (w.ok && mojPlus > zatwierdzonyPlus.current) {
      zatwierdzonyPlus.current = mojPlus;
      wydanie.current += 1;
      diagnostyka?.stan(w.wartosc.skonczone);
      const pelny = w.wartosc.stan; // BX20: kompozycja podaje pełny stan z odczytu po zapisie — jedno zatwierdzenie zamiast dwóch i bez drugiego odczytu w oknie pomiaru NFR-WYD-001
      ustawStan((s) => (s ? { ...s, licznik: pelny ?? { ...s.licznik, skonczone: w.wartosc.skonczone, dziergany: w.wartosc.dziergany } } : s));
      if (!pelny) await odswiez(); // bez pełnego stanu: baner serii, przypomnienie, kreski i projekt roboczy po pierwszym +1 z osobnego odczytu
    }
    return w;
  }
  async function naMinus() {
    diagnostyka?.wejscie('minus');
    const w = d.naMinus ? await d.naMinus() : { ok: false as const, powod: 'niedozwolone_przejscie' as const };
    diagnostyka?.zapis('minus', w.ok);
    if (w.ok) {
      wydanie.current += 1;
      diagnostyka?.stan(w.wartosc.skonczone);
      ustawStan((s) => (s ? { ...s, licznik: { ...s.licznik, skonczone: w.wartosc.skonczone, dziergany: w.wartosc.skonczone + 1 } } : s));
      await odswiez();
    }
    return w;
  }
  return { d, odswiez, poDzialaniu, naPlus, naMinus };
}

const nic = () => undefined;

export function Aplikacja(p: PropsAplikacji): React.ReactElement {
  const k = useKolory();
  const [stan, ustawStan] = useState<StanStartu | null>(null);
  const ekranWlaczony = useRef<boolean | null>(null); // opcja F-10 ze startu (null = przed startem); gdy usługi nie czytają opcji na bieżąco
  const wyjscieEkranu = useRef<(() => void) | null>(null);
  const { uslugi, porty, cykl } = p;
  const naWierzchu = p.naWierzchu ?? true;
  const wierzch = useRef(naWierzchu);
  wierzch.current = naWierzchu;
  const dzisWierzch = useRef(p.dzisNaWierzchu ?? false);
  dzisWierzch.current = p.dzisNaWierzchu ?? false;
  const daneDzis = useRef(p.dane ?? null);
  daneDzis.current = p.dane ?? null;
  const stanRef = useRef<StanStartu | null>(null);
  stanRef.current = stan;
  const wTle = useRef(false);
  const wyjscieTag = useRef<string | null>(null);
  /** Który tag ma teraz trzymać ekran: licznik albo wzór na wierzchu (BR-LIC-013) → `oczko-licznik`; „Dziś” z kartą „+1” (P-585) → `oczko-dzis`; inaczej żaden. */
  const tagTeraz = (): string | null => {
    if (wierzch.current) return TAG_LICZNIK;
    const s = stanRef.current;
    return dzisWierzch.current && s && kartaZPlusem(s.licznik, daneDzis.current) ? TAG_DZIS : null;
  };
  // Wejście na ekran (F-10, BR-LIC-013): po starcie, na pierwszym planie i z licznikiem, wzorem albo „Dziś” z kartą „+1” na wierzchu; opcja czytana teraz,
  // więc przełącznik w Ustawieniach działa po powrocie na licznik bez ponownego uruchomienia (M1-audytor-generalny-059).
  const wejdz = () => {
    if (ekranWlaczony.current === null || wyjscieEkranu.current || wTle.current) return;
    const tag = tagTeraz();
    if (tag === null) return;
    wyjscieTag.current = tag;
    wyjscieEkranu.current = wejdzNaEkran({ ekran: porty.ekranAktywny }, { opcjaWlaczona: uslugi.ekranWlaczony?.() ?? ekranWlaczony.current }, tag);
  };
  const wyjdz = () => { wyjscieEkranu.current?.(); wyjscieEkranu.current = null; wyjscieTag.current = null; };
  const tagWymagany = wierzch.current ? TAG_LICZNIK : dzisWierzch.current && stan && kartaZPlusem(stan.licznik, p.dane ?? null) ? TAG_DZIS : null;

  const l = useStanLicznika(uslugi, p.dzialania, ustawStan);
  useEffect(() => porty.sklep.obserwuj(nic), [porty.sklep]); // KP-07: nasłuch transakcji od startu
  // M1-audytor-generalny-240: powrót na „Dziś” (licznik albo wzór zdjęty ze stosu) → stan licznika z kompozycji. +1/−1 na liczniku nie zmienia `wersja`,
  // więc bez tego karta zostawała przy stanie sprzed wejścia na licznik (bez przemontowania — licznik pod spodem zachowuje swój stan).
  const dzisPoprzednio = useRef(p.dzisNaWierzchu ?? false);
  useEffect(() => {
    const teraz = p.dzisNaWierzchu ?? false;
    if (teraz && !dzisPoprzednio.current) void l.odswiez();
    dzisPoprzednio.current = teraz;
  }, [p.dzisNaWierzchu]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    let zywy = true;
    void uslugi.start().then((s) => {
      if (!zywy) return;
      ustawStan(s);
      ekranWlaczony.current = s.ekranWlaczony;
      stanRef.current = s; // wejdz() czyta stan sprzed następnego renderu (karta „+1” na „Dziś”)
      wejdz();
    });
    return () => { zywy = false; wyjdz(); };
  }, [uslugi, porty.ekranAktywny]);
  // Zmiana tagu (lista projektów, Ustawienia, Narzędzia nad licznikiem: ekran gaśnie, U11; „Dziś” ↔ licznik: jeden tag naraz) → wyjście ze starego, wejście do nowego.
  useEffect(() => { if (wyjscieTag.current !== null && wyjscieTag.current !== tagWymagany) wyjdz(); wejdz(); }, [tagWymagany]);
  useEffect(() => cykl.naZmiane((c) => {
    if (c === 'background') {
      wTle.current = true;
      wyjdz(); // każdy włączony tag wyłączony (rejestr Expo 7)
      void uslugi.przyTle();
    } else if (c === 'inactive') {
      // EB1 (P-1082, KO-226): iOS wychodzi z tła przez „inactive” (animacja powrotu); scalenie +1 z ekranu blokady zaczyna się już wtedy, więc po „active”
      // ekran nie pokazuje przez chwilę wartości sprzed scalenia. Ponowne scalenie na „active” jest idempotentne (UUID, ADR-0008).
      if (wTle.current) void uslugi.scalDziennik().then(async () => { if (p.dzialania?.odswiez) { const l = await p.dzialania.odswiez(); ustawStan((s) => (s ? { ...s, licznik: l } : s)); } });
    } else if (c === 'active') {
      void uslugi.scalDziennik().then(async () => { if (p.dzialania?.odswiez) { const l = await p.dzialania.odswiez(); ustawStan((s) => (s ? { ...s, licznik: l } : s)); } });
      wTle.current = false;
      wejdz();
    }
  }), [cykl, uslugi, porty.ekranAktywny, p.dzialania]);

  if (!stan) return <View style={{ flex: 1, backgroundColor: k.papier }} />;
  const z = p.dzis ?? {};
  return (
    <Dzis
      stan={stan.licznik}
      dane={p.dane ?? null}
      jezyk={p.jezyk}
      t={p.t}
      oglos={p.oglos}
      haptyka={porty.haptyka}
      naPlus={l.naPlus}
      naCofnijSerie={l.poDzialaniu(l.d.naCofnijSerie)}
      naOferty={l.d.naOferty ?? nic}
      naKontynuuj={z.naKontynuuj ?? nic}
      naWybierzProjekt={z.naWybierzProjekt ?? nic}
      naUstawienia={z.naUstawienia}
      naPrzewodnik={z.naPrzewodnik}
      naKafel={z.naKafel}
    />
  );
}

export type PropsEkranuLicznika = Pick<PropsAplikacji, 't' | 'oglos' | 'dzialania' | 'stoper' | 'sprawdzStopera' | 'jezyk'> & {
  diagnostyka?: DiagnostykaLicznika; // FX6b: tylko build E2E
  uslugi: Pick<UslugiAplikacji, 'start' | 'dodajRzad'>;
  porty: { haptyka: Haptyka };
  zegar?(): number; // ZM-25: wstrzyknięty zegar odliczania podpowiedzi „+1” (testy); domyślnie `Date.now`
  /** R-020 po p2: korzeń („Dziś”) scala dziennik raz; licznik na wierzchu czyta stan po scaleniu (`kompozycja.poScaleniu`). Zwraca odpięcie. */
  poScaleniu?(f: () => void): () => void;
};

/** Ekran licznika na własnej trasie (M3 p2, bez zakładek): stan i działania jak na „Dziś”, bez cyklu życia (ma go korzeń pod spodem). */
export function EkranLicznika(p: PropsEkranuLicznika): React.ReactElement {
  const k = useKolory();
  const [stan, ustawStan] = useState<StanStartu | null>(null);
  const { uslugi, poScaleniu } = p;
  useEffect(() => {
    let zywy = true;
    void uslugi.start().then((s) => { if (zywy) ustawStan(s); });
    return () => { zywy = false; };
  }, [uslugi]);
  const l = useStanLicznika(uslugi, p.dzialania, ustawStan, p.diagnostyka);
  const odswiez = useRef(l.odswiez);
  odswiez.current = l.odswiez;
  useEffect(() => poScaleniu?.(() => void odswiez.current()), [poScaleniu]);
  // ZM-25 (U7 forma A): odliczanie „bez +1” na otwartym liczniku; klucz rzędu zmienia +1/−1 (podpowiedź znika i liczy od nowa). Zegar wstrzyknięty (`zegar`).
  const sl = stan?.licznik;
  const podpowiedz = useOdliczaniePodpowiedzi({
    progMin: sl?.podpowiedzProg ?? null, ostatniaZmianaMs: sl?.ostatniaZmianaMs ?? null, klucz: kluczRzedu({ licznikId: sl?.licznikId, skonczone: sl?.skonczone }),
    blokada: !sl || sl.zablokowany || sl.limit.rodzaj === 'zawczasu' || sl.stoperWstrzymany === true, teraz: p.zegar ?? Date.now,
    poPokazaniu: () => { if (sl?.wibracje) p.porty.haptyka.zagraj('rzadZInstrukcja'); }, // jedna wibracja ostrzeżenia na rząd
  });
  if (!stan) return <View style={{ flex: 1, backgroundColor: k.papier }} />;
  const d = l.d;
  return (
    <Licznik
      stan={podpowiedz ? { ...stan.licznik, podpowiedz } : stan.licznik}
      t={p.t}
      oglos={p.oglos}
      haptyka={p.porty.haptyka}
      naPlus={l.naPlus}
      naMinus={l.naMinus}
      naOdblokuj={l.poDzialaniu(d.naOdblokuj)}
      naCofnijSerie={l.poDzialaniu(d.naCofnijSerie)}
      naOferty={d.naOferty ?? nic}
      naHistorie={d.naHistorie ?? nic}
      naMenu={d.naMenu ?? nic}
      naNastepnaCzesc={d.naNastepnaCzesc ?? nic}
      jezyk={p.jezyk}
      naWstecz={d.naWstecz}
      naProjekt={d.naProjekt}
      naWzor={d.naWzor}
      naNotatka={d.naNotatka}
      naCel={d.naCel}
      stoper={p.stoper}
      sprawdzStopera={p.sprawdzStopera}
      naKonflikt={d.naKonflikt}
    />
  );
}
