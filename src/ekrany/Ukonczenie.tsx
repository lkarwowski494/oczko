// Chwila ukończenia: karta projektu i pytanie o włóczkę (F-19, F-37, F-53; U-9; design-spec.md:57, :66; ekrany.html `ukonczenie`; BR-DAN-012/S1).
// Sygnatura: propozycja 07 (E3), granice zatwierdzone przez 05 (Z07-22). „Done” woła `naGotowe`; prośbę o ocenę decyduje bramka czyProsicOOcene
// w przypadku użycia (moduly.md „Prośba o ocenę”, P-150, P-160) — ekran nie woła wywołania systemowego sam.
import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Arkusz, Przycisk, Tresc } from './Arkusz';
import { cel, odstep, promien, typografia, useKolory, type Kolory } from './motyw';
import { krokMotkow, liniaZapasu } from '../domena/zapas';
import type { Oglos, System, Tlumacz } from './wspolne';
import { PrzyciskSymbolu } from './Pasek';

export type StanUkonczenia = {
  nazwa: string;
  okres: string;               // „Oct 1 – Nov 21” (sformatowane)
  dni: number;                 // dni z robótką
  rzedy: number;
  czas: string | null;         // „18 h 10 min”; null = bez stopera (BR-PRJ-015/S3)
  czesci: number;
  /** Włóczka projektu (F-37): motki = zapas przed zapisem, zuzyto = poprzednie potwierdzenie (null = brak); pusta = grupy nie ma. */
  wloczka: { id: string; nazwa: string; motki: number; zuzyto: number | null }[];
  /** Opcja B (P-330 1B): projekt bez włóczki, a zapas niepusty → cicha linia „Choose yarn”; w innych przypadkach grupy ani linii nie ma. */
  wybierzWloczke?: boolean;
  zdjecie: string | null;      // URI
  bladZapisu?: boolean;        // nieudany zapis zużycia: komunikat, karta zostaje
};
export type ZuzycieWloczki = { wloczkaId: string; motki: number };
export type PropsUkonczenia = {
  stan: StanUkonczenia;
  t: Tlumacz;
  oglos: Oglos;                // „Harbor Sweater moved to Finished.” (design-spec.md:66)
  system: System;              // port systemu (udostępnianie, 3C); prośba o ocenę przez przypadek użycia po `naGotowe` (P-160)
  /** Liczby w języku aplikacji (format i wpis wg P-097 (5a)); wpis niezgodny = null. */
  liczby: { formatuj(n: number): string; parsuj(tekst: string): number | null };
  naUdostepnij(): void;
  /** „Done”: zużycie tylko włóczek, przy których coś wpisano (brak wpisu zostaje brakiem). */
  naGotowe(zuzycie: ZuzycieWloczki[]): void;
  naEdytujZapas?(wloczkaId: string): void;
  /** Odnośnik „Choose yarn” w cichej linii: arkusz wyboru włóczek projektu. */
  naWybierzWloczke?(): void;
  /** Obraz karty do udostępnienia (P-191 P10a, P-219 2A): rysowany poza ekranem, niewidoczny dla VoiceOver; zrzut robi kompozycja. */
  obrazKarty?: React.ReactNode;
};
export function Ukonczenie({ stan: s, t, oglos, liczby, naUdostepnij, naGotowe, naEdytujZapas, naWybierzWloczke, obrazKarty }: PropsUkonczenia): React.ReactElement {
  const k = useKolory();
  const [zuzycie, ustawZuzycie] = useState<Record<string, number>>({}); // tylko wiersze zmienione na karcie
  const wartosc = (w: StanUkonczenia['wloczka'][number]): number | null => zuzycie[w.id] ?? w.zuzyto;
  useEffect(() => { oglos(t('ukonczenie.ogloszenie', { nazwa: s.nazwa })); }, [s.nazwa]); // raz przy wejściu na kartę
  const podsumowanie = [s.czas, t('ukonczenie.czesci', { count: s.czesci }), t('ukonczenie.dni', { count: s.dni })].filter(Boolean).join(' · ');
  return (
    <Arkusz tytul={s.nazwa} testID="ukonczenie-karta" przyciski={<Przycisk tekst={t('ukonczenie.gotowe')} rodzaj="glowny" testID="ukonczenie-gotowe"
      onPress={() => naGotowe(Object.entries(zuzycie).map(([wloczkaId, motki]) => ({ wloczkaId, motki })))} />}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <PrzyciskSymbolu symbol="square.and.arrow.up" etykieta={t('ukonczenie.udostepnij')} onPress={naUdostepnij} testID="karta-udostepnij" />
      </View>
      {obrazKarty ? (
        <View style={st.pozaEkranem} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{obrazKarty}</View>
      ) : null}
      <Tresc podpis>{t('ukonczenie.okres', { okres: s.okres })}</Tresc>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: odstep.s }}>
        <Text style={{ ...typografia.liczba, color: k.grafit }}>{liczby.formatuj(s.rzedy)}</Text>
        <Tresc podpis>{t('ukonczenie.jednostka', { count: s.rzedy })}</Tresc>
      </View>
      <Tresc podpis>{podsumowanie}</Tresc>
      {s.zdjecie && <Image source={{ uri: s.zdjecie }} accessible accessibilityRole="image" accessibilityLabel={t('ukonczenie.zdjecie', { nazwa: s.nazwa })} style={st.zdjecie} />}
      {s.wloczka.length > 0 && (
        <View style={{ gap: odstep.s }} testID="ukonczenie-wloczka">
          <Tresc podpis>{t('ukonczenie.wloczka_naglowek')}</Tresc>
          {s.wloczka.map((w) => (
            <WierszZuzycia key={w.id} w={w} wartosc={wartosc(w)} t={t} liczby={liczby} naZmiane={(m) => ustawZuzycie((z) => ({ ...z, [w.id]: m }))} naEdytujZapas={naEdytujZapas} />
          ))}
        </View>
      )}
      {s.wybierzWloczke && s.wloczka.length === 0 && naWybierzWloczke && (
        <View style={{ gap: odstep.xs }} testID="ukonczenie-bez-wloczki">
          <View accessible role="status" style={{ flexDirection: 'row', gap: odstep.xs }}>
            <Text style={{ ...typografia.podpis, color: k.olowek }} importantForAccessibility="no" accessibilityElementsHidden>ⓘ</Text>
            <Text style={{ ...typografia.podpis, color: k.olowek, flex: 1 }}>{t('ukonczenie.bez_wloczki')}</Text>
          </View>
          <Przycisk tekst={t('ukonczenie.wybierz_wloczke')} onPress={naWybierzWloczke} rodzaj="tekstowy" rola="link" testID="ukonczenie-wybierz-wloczke" />
        </View>
      )}
      {s.bladZapisu && <Tresc>{t('dane.blad')}</Tresc>}
    </Arkusz>
  );
}
const st = StyleSheet.create({
  zdjecie: { width: '100%', aspectRatio: 4 / 3, borderRadius: promien.grupa },
  pozaEkranem: { position: 'absolute', left: -10000, top: 0 }, // zrzut widoku wymaga, żeby był narysowany
});

/** Wiersz włóczki: nazwa, zapas, krokowiec − [pole] + (VoiceOver: jedno pole adjustable) i linia informacji przy zużyciu ponad zapas. */
function WierszZuzycia(p: {
  w: StanUkonczenia['wloczka'][number]; wartosc: number | null; t: Tlumacz; liczby: PropsUkonczenia['liczby'];
  naZmiane(m: number): void; naEdytujZapas?(id: string): void;
}): React.ReactElement {
  const { w, wartosc, t, liczby } = p;
  const s2 = styleWiersza(useKolory());
  const [tekst, ustawTekst] = useState<string | null>(null); // wpis w toku; null = pokazuj wartość
  const pokazana = wartosc === null ? '' : liczby.formatuj(wartosc);
  const krok = (kierunek: 1 | -1) => { ustawTekst(null); p.naZmiane(krokMotkow(wartosc, kierunek)); };
  const zatwierdz = () => {
    if (tekst !== null) { const n = liczby.parsuj(tekst); if (n !== null) p.naZmiane(n); } // zapis niezgodny odrzucony (P-097 (5a))
    ustawTekst(null);
  };
  const linia = liniaZapasu({ zapas: w.motki, zuzycie: wartosc, poprzednie: w.zuzyto });
  return (
    <View style={{ gap: odstep.xs }}>
      <Text style={s2.nazwa}>{w.nazwa}</Text>
      <Text style={s2.podpis}>{t('ukonczenie.w_zapasie', { count: w.motki })}</Text>
      <View accessible accessibilityRole="adjustable" accessibilityLabel={t('ukonczenie.zuzycie_etykieta', { nazwa: w.nazwa })}
        accessibilityValue={{ text: pokazana }} accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => krok(e.nativeEvent.actionName === 'increment' ? 1 : -1)} style={s2.krokowiec}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('ukonczenie.zuzycie_mniej')} onPress={() => krok(-1)} style={s2.przycisk}>
          <Text style={s2.znak}>−</Text>
        </Pressable>
        <TextInput value={tekst ?? pokazana} onChangeText={ustawTekst} onEndEditing={zatwierdz} onSubmitEditing={zatwierdz} keyboardType="decimal-pad"
          testID={`ukonczenie-zuzycie-${w.id}`} style={s2.pole} />
        <Pressable accessibilityRole="button" accessibilityLabel={t('ukonczenie.zuzycie_wiecej')} onPress={() => krok(1)} style={s2.przycisk}>
          <Text style={s2.znak}>+</Text>
        </Pressable>
      </View>
      {linia.rodzaj !== 'brak' && (
        <>
          <View accessible role="status" accessibilityLiveRegion="polite" style={{ flexDirection: 'row', gap: odstep.xs }}>
            <Text style={s2.podpis} importantForAccessibility="no" accessibilityElementsHidden>ⓘ</Text>
            <Text style={[s2.podpis, { flex: 1 }]}>{linia.rodzaj === 'ponad' ? t('ukonczenie.zuzycie_ponad_zapas', { count: linia.zapas }) : t('ukonczenie.zapas_juz_pusty')}</Text>
          </View>
          {p.naEdytujZapas && <Przycisk tekst={t('ukonczenie.edytuj_zapas')} podpowiedz={t('ukonczenie.edytuj_zapas_opis')} onPress={() => p.naEdytujZapas?.(w.id)} rodzaj="tekstowy" rola="link" testID={`ukonczenie-edytuj-zapas-${w.id}`} />}
        </>
      )}
    </View>
  );
}
function styleWiersza(k: Kolory) {
  return StyleSheet.create({
    nazwa: { ...typografia.tresc, color: k.grafit, fontWeight: '700' },
    podpis: { ...typografia.podpis, color: k.olowek },
    krokowiec: { flexDirection: 'row', alignItems: 'center', gap: odstep.s },
    // obrysy drugiPrzyciskObrys (≥ 3:1, design-spec), jak przycisk „drugi” i pole w Arkusz.tsx
    przycisk: { minWidth: cel.minimum, minHeight: cel.minimum, alignItems: 'center', justifyContent: 'center', borderRadius: promien.przyciskDrugi, borderWidth: 2, borderColor: k.drugiPrzyciskObrys },
    znak: { ...typografia.tresc, color: k.grafit, fontWeight: '700' },
    pole: { ...typografia.tresc, color: k.grafit, minHeight: cel.minimum, minWidth: cel.przyciskMinus, textAlign: 'center', borderRadius: promien.pole, borderWidth: 2, borderColor: k.drugiPrzyciskObrys },
  });
}
