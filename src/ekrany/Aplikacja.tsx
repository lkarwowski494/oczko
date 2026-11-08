// Korzeń aplikacji: pierwszy ekran, start, cykl życia (NFR-PIE-001, BR-LIC-001, KP-07, KP-08, KP-13, BR-DAN-012/S2, R-020, R-091).
// Sygnatura: propozycja 07 (E3), porty i granice zatwierdzone przez 05 (Z07-22). Pierwszy ekran to „Dziś” z kartą i „+1” — nic przed nim (NFR-PIE-001 po ZM-18, M3 p2);
// licznik na własnej trasie: `EkranLicznika` (ten sam stan i te same usługi, bez cyklu życia — korzeń „Dziś” zostaje pod licznikiem w stosie);
// nasłuch transakcji od startu (KP-07), bez przywracania i ekranu zakupu przy starcie (KP-08, KP-13); powrót na pierwszy plan scala dziennik
// +1 (R-020); przejście w tło wyłącza każdy tag ekranu aktywnego i robi checkpoint (R-091). Pozostałe działania licznika podaje kompozycja.
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import type { EkranAktywny, Haptyka, Sklep } from '../domena/porty';
import { wejdzNaEkranLicznika } from '../przypadki-uzycia/ekran-aktywny';
import { Dzis, type DaneDzis, type KafelDzis } from './Dzis';
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
  /** „Dziś” (M3 p2): dane spoza stanu licznika (tydzień, wolne dni, miejsce pracy) i przejścia; bez nich karta z samego stanu licznika. */
  dane?: DaneDzis | null;
  jezyk?: string;
  dzis?: { naKontynuuj?(): void; naWybierzProjekt?(): void; naUstawienia?(): void; naKafel?(k: KafelDzis): void };
};

/** Stan licznika na ekranie i działania, które go zmieniają — wspólne dla „Dziś” i trasy licznika (jeden przypadek użycia `dodajRzad`, ZM-18). */
function useStanLicznika(uslugi: Pick<UslugiAplikacji, 'dodajRzad'>, dzialania: DzialaniaLicznika | undefined, ustawStan: React.Dispatch<React.SetStateAction<StanStartu | null>>) {
  const d = dzialania ?? {};
  async function odswiez() {
    if (!d.odswiez) return;
    const l = await d.odswiez();
    ustawStan((s) => (s ? { ...s, licznik: l } : s));
  }
  // Działanie zmieniające licznik poza +1/−1 (cofnięcie serii, odblokowanie): po COMMIT pełny stan z kompozycji.
  const poDzialaniu = (f?: () => unknown) => async () => { await f?.(); await odswiez(); };
  async function naPlus(): Promise<WynikPlus> {
    const w = await uslugi.dodajRzad();
    if (w.ok) {
      ustawStan((s) => (s ? { ...s, licznik: { ...s.licznik, skonczone: w.wartosc.skonczone, dziergany: w.wartosc.dziergany } } : s));
      await odswiez(); // baner serii, przypomnienie, kreski i projekt roboczy po pierwszym +1
    }
    return w;
  }
  async function naMinus() {
    const w = d.naMinus ? await d.naMinus() : { ok: false as const, powod: 'niedozwolone_przejscie' as const };
    if (w.ok) {
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
  const wTle = useRef(false);
  // Wejście na ekran licznika (F-10, BR-LIC-013): po starcie, na pierwszym planie i z licznikiem albo wzorem na wierzchu; opcja czytana teraz,
  // więc przełącznik w Ustawieniach działa po powrocie na licznik bez ponownego uruchomienia (M1-audytor-generalny-059).
  const wejdz = () => {
    if (ekranWlaczony.current === null || wyjscieEkranu.current || wTle.current || !wierzch.current) return;
    wyjscieEkranu.current = wejdzNaEkranLicznika({ ekran: porty.ekranAktywny }, { opcjaWlaczona: uslugi.ekranWlaczony?.() ?? ekranWlaczony.current });
  };
  const wyjdz = () => { wyjscieEkranu.current?.(); wyjscieEkranu.current = null; };

  const l = useStanLicznika(uslugi, p.dzialania, ustawStan);
  useEffect(() => porty.sklep.obserwuj(nic), [porty.sklep]); // KP-07: nasłuch transakcji od startu
  useEffect(() => {
    let zywy = true;
    void uslugi.start().then((s) => {
      if (!zywy) return;
      ustawStan(s);
      ekranWlaczony.current = s.ekranWlaczony;
      wejdz();
    });
    return () => { zywy = false; wyjdz(); };
  }, [uslugi, porty.ekranAktywny]);
  useEffect(() => { if (naWierzchu) wejdz(); else wyjdz(); }, [naWierzchu]); // lista projektów, Ustawienia, Narzędzia nad licznikiem: ekran gaśnie (U11)
  useEffect(() => cykl.naZmiane((c) => {
    if (c === 'background') {
      wTle.current = true;
      wyjdz(); // każdy włączony tag wyłączony (rejestr Expo 7)
      void uslugi.przyTle();
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
      naKafel={z.naKafel}
    />
  );
}

export type PropsEkranuLicznika = Pick<PropsAplikacji, 't' | 'oglos' | 'dzialania' | 'stoper' | 'sprawdzStopera'> & {
  uslugi: Pick<UslugiAplikacji, 'start' | 'dodajRzad'>;
  porty: { haptyka: Haptyka };
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
  const l = useStanLicznika(uslugi, p.dzialania, ustawStan);
  const odswiez = useRef(l.odswiez);
  odswiez.current = l.odswiez;
  useEffect(() => poScaleniu?.(() => void odswiez.current()), [poScaleniu]);
  if (!stan) return <View style={{ flex: 1, backgroundColor: k.papier }} />;
  const d = l.d;
  return (
    <Licznik
      stan={stan.licznik}
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
      naProjekty={d.naProjekty}
      naProjekt={d.naProjekt}
      naWzor={d.naWzor}
      stoper={p.stoper}
      sprawdzStopera={p.sprawdzStopera}
      naKonflikt={d.naKonflikt}
    />
  );
}
