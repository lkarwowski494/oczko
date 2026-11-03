// Korzeń aplikacji: pierwszy ekran, start, cykl życia (NFR-PIE-001, BR-LIC-001, KP-07, KP-08, KP-13, BR-DAN-012/S2, R-020, R-091).
// Sygnatura: propozycja 07 (E3), porty i granice zatwierdzone przez 05 (Z07-22). Pierwszy ekran to licznik — nic przed nim (NFR-PIE-001);
// nasłuch transakcji od startu (KP-07), bez przywracania i ekranu zakupu przy starcie (KP-08, KP-13); powrót na pierwszy plan scala dziennik
// +1 (R-020); przejście w tło wyłącza każdy tag ekranu aktywnego i robi checkpoint (R-091). Pozostałe działania licznika podaje kompozycja.
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import type { EkranAktywny, Haptyka, Sklep } from '../domena/porty';
import { wejdzNaEkranLicznika } from '../przypadki-uzycia/ekran-aktywny';
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
};

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
  const d = p.dzialania ?? {};
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
  return (
    <Licznik
      stan={stan.licznik}
      t={p.t}
      oglos={p.oglos}
      haptyka={porty.haptyka}
      naPlus={naPlus}
      naMinus={async () => {
        const w = d.naMinus ? await d.naMinus() : { ok: false as const, powod: 'niedozwolone_przejscie' as const };
        if (w.ok) {
          ustawStan((s) => (s ? { ...s, licznik: { ...s.licznik, skonczone: w.wartosc.skonczone, dziergany: w.wartosc.skonczone + 1 } } : s));
          await odswiez();
        }
        return w;
      }}
      naOdblokuj={poDzialaniu(d.naOdblokuj)}
      naCofnijSerie={poDzialaniu(d.naCofnijSerie)}
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
