// Ustawienia w „Dzianinie” (M3 p7, ZM-07): lista grupowana — ikona w kolorze, podpis od lewej, strzałka przy przejściu na inny ekran aplikacji, działania bez strzałki.
// Wybór symboli SF 08 (design-spec nie nazywa ich), do zgłoszenia 04. Wcześniej: Ustawienia (BR-ZAK-004, BR-ZAK-006/S5, S7, BR-DAN-012/S3, KP-13, KP-14, F-48). Ekran nienarysowany (design-spec.md:95, Z07-05): lista grupowana
// z komponentów design-spec, etykiety robocze w en.kontekst.json. Sygnatura: propozycja 07 (E3), granice 05 (Z07-22).
// „Rate Oczko” otwiera stronę recenzji (action=write-review), nie systemową prośbę (BR-DAN-012/S3).
// „Help” otwiera stronę wsparcia z FAQ (DEC-22 a, M1-audytor-generalny-061): wiersz jak „Privacy Policy” (link), bez nowego ekranu i bez własnych tekstów pomocy w aplikacji.
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, useWindowDimensions, View } from 'react-native';
import { Przycisk } from './Arkusz';
import { cel, MAX_SKALA_TYTULOWA, odstep, promien, PROG_KATEGORII_DOSTEPNOSCI, ROZMIAR_SYMBOLU_TRESCI, typografia, useKolory } from './motyw';
import { StrzalkaWiersza, SymbolSf, type NazwaSymbolu } from './SymbolSf';
import type { System, Tlumacz } from './wspolne';
import { trwaSubskrypcja, type AktywnePro } from './Oferty';
import type { DniNaLiscie } from './ListaProjektow';
import { NAZWY_JEZYKOW, ZRODLO, type PreferencjaJezyka } from '../i18n/jezyki';
import { Wstecz } from './Pasek';

export type PropsUstawien = {
  stan: { pro: AktywnePro; dni: DniNaLiscie; wibracje: boolean };
  t: Tlumacz;
  system: System;
  adresy: { polityka: string; wsparcie: string; recenzja: string };  // recenzja: strona App Store z action=write-review (BR-DAN-012/S3)
  naOferty(): void;                                 // drugie miejsce wejścia do ofert (KP-13)
  naWibracje(wlaczone: boolean): void;
  naZglosProblem(): void;
  naStanDanych(): void;
  /** Dane (BR-DAN-006, BR-DAN-009): kompozycja; bez nich pozycji nie ma. */
  /** naUsunWszystko: otwiera arkusz potwierdzenia `/usun-wszystko` (BR-DAN-009; usunięcie dopiero po potwierdzeniu, P-266 (3)). */
  dane?: { naEksport(): void; naImport(): void; naUsunWszystko(): void };
  /** Preferencje urządzenia (ADR-0029): „Keep screen on” (przełącznik) i „Units” (wiersz → /miary); bez nich wierszy nie ma. */
  preferencje?: { ekranNieGasnie: boolean; ukladMiar: 'auto' | 'metric' | 'imperial'; naEkranNieGasnie(wlaczone: boolean): void; naMiary(): void };
  /** Wynik eksportu albo import w toku (kompozycja), pod grupą danych. */
  wynikDanych?: React.ReactNode;
  /** Panele buildu E2E (e2e/README.md, bez t()); w buildzie wydania null. */
  panelE2e?: React.ReactNode;
  naWstecz?(): void;
  /** Język aplikacji (F-36) i jakość przekładu (BR-DAN-010): wartość = preferencja, jezyk = bieżący język tekstów. */
  jezyk?: { stan: { wartosc: PreferencjaJezyka; jezyk: string }; naJezyk(): void; naZglosTlumaczenie(): void };
  naZrodla?(): void;
};

/** Wiersz listy grupowanej (ZM-07): ikona (kafelek `ikonaTlo`), podpis od lewej, wartość po prawej, strzałka tylko przy przejściu (`strzalka`). `przelacznik`: wiersz z przełącznikiem zamiast stuknięcia. */
type PropsWiersza = {
  symbol: NazwaSymbolu; tekst: string; testID: string;
  wartosc?: string; wartoscTestID?: string; etykieta?: string; strzalka?: boolean; rola?: 'button' | 'link'; onPress?(): void;
  przelacznik?: { wartosc: boolean; naZmiane(w: boolean): void };
};
function Wiersz(p: PropsWiersza): React.ReactElement {
  const k = useKolory();
  const duzyTekst = useWindowDimensions().fontScale >= PROG_KATEGORII_DOSTEPNOSCI;
  const st = StyleSheet.create({
    wiersz: { flexDirection: 'row', alignItems: 'center', gap: odstep.m, minHeight: cel.minimum, paddingHorizontal: odstep.m, paddingVertical: odstep.xs },
    ikona: { width: 32, height: 32, borderRadius: promien.pole, backgroundColor: k.ikonaTlo, alignItems: 'center', justifyContent: 'center' },
    tekst: { ...typografia.tresc, color: k.tekst, flex: duzyTekst ? undefined : 1, flexShrink: 1 },
    wartosc: { ...typografia.tresc, color: k.tekst2, flexShrink: 1, textAlign: 'right' },
  });
  const zawartosc = (
    <>
      <View style={st.ikona}><SymbolSf nazwa={p.symbol} rozmiar={ROZMIAR_SYMBOLU_TRESCI} kolor={k.ikona} maxSkala={MAX_SKALA_TYTULOWA} /></View>
      <Text style={st.tekst} importantForAccessibility={p.przelacznik ? 'no' : undefined} accessibilityElementsHidden={p.przelacznik ? true : undefined}>{p.tekst}</Text>
      {p.wartosc !== undefined && <Text style={st.wartosc} testID={p.wartoscTestID}>{p.wartosc}</Text>}
      {p.strzalka && <StrzalkaWiersza />}
    </>
  );
  if (p.przelacznik) {
    return (
      <View style={st.wiersz} testID={`${p.testID}-wiersz`}>
        {zawartosc}
        <Switch accessibilityRole="switch" accessibilityLabel={p.tekst} value={p.przelacznik.wartosc} onValueChange={p.przelacznik.naZmiane} testID={p.testID} />
      </View>
    );
  }
  return (
    <Pressable accessibilityRole={p.rola ?? 'button'} accessibilityLabel={p.etykieta ?? p.tekst} accessibilityValue={p.wartosc !== undefined ? { text: p.wartosc } : undefined} onPress={p.onPress} style={st.wiersz} testID={p.testID}>
      {zawartosc}
    </Pressable>
  );
}

export function Ustawienia({ stan: s, t, system, adresy, naOferty, naWibracje, naZglosProblem, naStanDanych, dane, wynikDanych, panelE2e, naWstecz, jezyk, naZrodla, preferencje }: PropsUstawien): React.ReactElement {
  const k = useKolory();
  const st = StyleSheet.create({
    grupa: { borderRadius: promien.lista, backgroundColor: k.powierzchnia, padding: odstep.xs, gap: odstep.xs },
    podpis: { ...typografia.podpis, color: k.tekst2, paddingHorizontal: odstep.m, paddingBottom: odstep.s },
    naglowekGrupy: { ...typografia.drobny, color: k.tekst2, paddingHorizontal: odstep.m },
  });
  const jezykWartosc = jezyk ? (jezyk.stan.wartosc === 'auto' ? t('ustawienia.jezyk_automatyczny') : NAZWY_JEZYKOW[jezyk.stan.wartosc]) : '';
  return (
    <ScrollView style={{ flex: 1, backgroundColor: k.tlo }} contentContainerStyle={{ padding: odstep.l, gap: odstep.l }} testID="ustawienia">
      {naWstecz && <Wstecz tekst={t('wspolne.wstecz')} onPress={naWstecz} />}
      {panelE2e /* build E2E: na górze, widoczny bez przewijania (scenariusze 08, 09) */}
      <Text style={{ ...typografia.tytul, color: k.tekst }} accessibilityRole="header" maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{t('ustawienia.tytul')}</Text>
      <View style={st.grupa} testID="ustawienia-grupa">
        {/* F-63 (07-jakosc-031): stan Pro jako wartość wiersza; VoiceOver czyta „Oczko Pro, On” */}
        <Wiersz symbol="sparkles" tekst={t('ustawienia.oczko_pro')} etykieta={s.pro ? `${t('ustawienia.oczko_pro')}, ${t('ustawienia.pro_wlaczone')}` : undefined}
          wartosc={s.pro ? t('ustawienia.pro_wlaczone') : undefined} wartoscTestID="ustawienia-pro" strzalka onPress={naOferty} testID="ustawienia-oczko-pro" />
        {trwaSubskrypcja(s.pro) && <Wiersz symbol="creditcard" tekst={t('oferty.zarzadzaj')} onPress={() => system.zarzadzajSubskrypcja()} testID="ustawienia-subskrypcja" />}
        {s.dni && <Text style={st.podpis} testID="ustawienia-dni-darmowe">{t('projekty.dni', { count: s.dni.limit, zostalo: s.dni.zostalo, limit: s.dni.limit, miesiac: s.dni.miesiac })}</Text>}
      </View>
      {preferencje && <Text style={st.naglowekGrupy} accessibilityRole="header">{t('ustawienia.grupa_liczenie')}</Text>}
      <View style={st.grupa} testID="ustawienia-grupa">
        <Wiersz symbol="iphone.radiowaves.left.and.right" tekst={t('ustawienia.wibracje')} testID="ustawienia-wibracje" przelacznik={{ wartosc: s.wibracje, naZmiane: naWibracje }} />
        {preferencje && (
          <>
            <Wiersz symbol="sun.max" tekst={t('ustawienia.ekran_nie_gasnie')} testID="ustawienia-ekran-nie-gasnie" przelacznik={{ wartosc: preferencje.ekranNieGasnie, naZmiane: preferencje.naEkranNieGasnie }} />
            <Wiersz symbol="ruler" tekst={t('ustawienia.uklad_miar')} wartosc={t(`ustawienia.miary_${preferencje.ukladMiar}`)} strzalka onPress={preferencje.naMiary} testID="ustawienia-miary" />
            <Text style={st.podpis}>{t('ustawienia.ekran_nie_gasnie_opis')}</Text>
          </>
        )}
      </View>
      {dane && (
        <View style={st.grupa} testID="ustawienia-grupa">
          <Wiersz symbol="square.and.arrow.up" tekst={t('ustawienia.eksport')} onPress={dane.naEksport} testID="ustawienia-eksport" />
          <Wiersz symbol="square.and.arrow.down" tekst={t('ustawienia.import')} onPress={dane.naImport} testID="ustawienia-import" />
          <Wiersz symbol="trash" tekst={t('ustawienia.usun_wszystko')} onPress={dane.naUsunWszystko} testID="ustawienia-usun-wszystko" />
        </View>
      )}
      {wynikDanych}
      <View style={st.grupa} testID="ustawienia-grupa">
        <Wiersz symbol="icloud" tekst={t('ustawienia.stan_danych')} strzalka onPress={naStanDanych} testID="ustawienia-stan-danych" />
        <Wiersz symbol="questionmark.circle" tekst={t('ustawienia.pomoc')} rola="link" onPress={() => system.otworzAdres(adresy.wsparcie)} testID="ustawienia-pomoc" />
        <Wiersz symbol="exclamationmark.bubble" tekst={t('ustawienia.zglos')} strzalka onPress={naZglosProblem} testID="ustawienia-zglos" />
        <Wiersz symbol="star" tekst={t('ustawienia.ocen')} onPress={() => system.otworzAdres(adresy.recenzja)} testID="ustawienia-ocen" />
        <Wiersz symbol="hand.raised" tekst={t('ustawienia.polityka')} rola="link" onPress={() => system.otworzAdres(adresy.polityka)} testID="ustawienia-polityka" />
        {naZrodla && <Wiersz symbol="book" tekst={t('ustawienia.zrodla_wiedzy')} strzalka onPress={naZrodla} testID="ustawienia-zrodla" />}
      </View>
      {jezyk && (
        <View style={st.grupa} testID="ustawienia-grupa">
          {/* design-spec „Ustawienia › Język”: wiersz z wartością; VoiceOver czyta etykietę i wartość (accessibilityValue). */}
          <Wiersz symbol="globe" tekst={t('ustawienia.jezyk')} wartosc={jezykWartosc} strzalka onPress={jezyk.naJezyk} testID="ustawienia-jezyk" />
          {/* BR-DAN-010 (ER-45, P-075 (2a)): tylko przy przekładzie maszynowym, czyli języku innym niż źródłowy; bez banera gdzie indziej. */}
          {jezyk.stan.jezyk !== ZRODLO && (
            <View testID="ustawienia-jakosc-tlumaczenia">
              <Text style={st.podpis}>{t('ustawienia.jakosc_tlumaczenia')}</Text>
              <Przycisk tekst={t('ustawienia.zglos_tlumaczenie')} onPress={jezyk.naZglosTlumaczenie} rodzaj="tekstowy" rola="link" testID="ustawienia-zglos-tlumaczenie" />
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}
