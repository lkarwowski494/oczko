// Ustawienia (BR-ZAK-004, BR-ZAK-006/S5, S7, BR-DAN-012/S3, KP-13, KP-14, F-48). Ekran nienarysowany (design-spec.md:95, Z07-05): lista grupowana
// z komponentów design-spec, etykiety robocze w en.kontekst.json. Sygnatura: propozycja 07 (E3), granice 05 (Z07-22).
// „Rate Oczko” otwiera stronę recenzji (action=write-review), nie systemową prośbę (BR-DAN-012/S3).
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Przycisk } from './Arkusz';
import { cel, MAX_SKALA_TYTULOWA, odstep, promien, typografia, useKolory } from './motyw';
import type { System, Tlumacz } from './wspolne';
import { trwaSubskrypcja, type AktywnePro } from './Oferty';
import type { DniNaLiscie } from './ListaProjektow';
import { NAZWY_JEZYKOW, ZRODLO, type PreferencjaJezyka } from '../i18n/jezyki';
import { Wstecz } from './Pasek';

export type PropsUstawien = {
  stan: { pro: AktywnePro; dni: DniNaLiscie; wibracje: boolean };
  t: Tlumacz;
  system: System;
  adresy: { polityka: string; recenzja: string };  // recenzja: strona App Store z action=write-review (BR-DAN-012/S3)
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
export function Ustawienia({ stan: s, t, system, adresy, naOferty, naWibracje, naZglosProblem, naStanDanych, dane, wynikDanych, panelE2e, naWstecz, jezyk, naZrodla, preferencje }: PropsUstawien): React.ReactElement {
  const k = useKolory();
  const st = StyleSheet.create({
    grupa: { borderRadius: promien.grupa, backgroundColor: k.papierGrupa, padding: odstep.s, gap: odstep.xs },
    podpis: { ...typografia.podpis, color: k.olowek, paddingHorizontal: odstep.m },
    wiersz: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: odstep.m, minHeight: cel.minimum },
  });
  return (
    <ScrollView style={{ flex: 1, backgroundColor: k.papier }} contentContainerStyle={{ padding: odstep.l, gap: odstep.l }} testID="ustawienia">
      {naWstecz && <Wstecz tekst={t('wspolne.wstecz')} onPress={naWstecz} />}
      {panelE2e /* build E2E: na górze, widoczny bez przewijania (scenariusze 08, 09) */}
      <Text style={{ ...typografia.tytul, color: k.grafit }} accessibilityRole="header" maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{t('ustawienia.tytul')}</Text>
      <View style={st.grupa}>
        <View style={st.wiersz}>
          <Przycisk tekst={t('ustawienia.oczko_pro')} etykieta={s.pro ? `${t('ustawienia.oczko_pro')}, ${t('ustawienia.pro_wlaczone')}` : undefined} onPress={naOferty} rodzaj="tekstowy" testID="ustawienia-oczko-pro" />
          {/* F-63 (07-jakosc-031): stan Pro jako wartość wiersza; VoiceOver czyta „Oczko Pro, On” */}
          {s.pro && <Text style={{ ...typografia.tresc, color: k.olowek }} testID="ustawienia-pro">{t('ustawienia.pro_wlaczone')}</Text>}
        </View>
        {trwaSubskrypcja(s.pro) && <Przycisk tekst={t('oferty.zarzadzaj')} onPress={() => system.zarzadzajSubskrypcja()} rodzaj="tekstowy" />}
        {s.dni && <Text style={st.podpis} testID="ustawienia-dni-darmowe">{t('projekty.dni', { count: s.dni.limit, zostalo: s.dni.zostalo, limit: s.dni.limit, miesiac: s.dni.miesiac })}</Text>}
      </View>
      {preferencje && <Text style={{ ...typografia.drobny, color: k.olowek, paddingHorizontal: odstep.m }} accessibilityRole="header">{t('ustawienia.grupa_liczenie')}</Text>}
      <View style={st.grupa}>
        <View style={st.wiersz}>
          <Text style={{ ...typografia.tresc, color: k.grafit }} importantForAccessibility="no" accessibilityElementsHidden>{t('ustawienia.wibracje')}</Text>
          <Switch accessibilityRole="switch" accessibilityLabel={t('ustawienia.wibracje')} value={s.wibracje} onValueChange={naWibracje} />
        </View>
        {preferencje && (
          <>
            <View style={st.wiersz}>
              <Text style={{ ...typografia.tresc, color: k.grafit }} importantForAccessibility="no" accessibilityElementsHidden>{t('ustawienia.ekran_nie_gasnie')}</Text>
              <Switch accessibilityRole="switch" accessibilityLabel={t('ustawienia.ekran_nie_gasnie')} value={preferencje.ekranNieGasnie} onValueChange={preferencje.naEkranNieGasnie} testID="ustawienia-ekran-nie-gasnie" />
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={t('ustawienia.uklad_miar')} accessibilityValue={{ text: t(`ustawienia.miary_${preferencje.ukladMiar}`) }} onPress={preferencje.naMiary} style={st.wiersz} testID="ustawienia-miary">
              <Text style={{ ...typografia.tresc, color: k.grafit }}>{t('ustawienia.uklad_miar')}</Text>
              <Text style={{ ...typografia.tresc, color: k.olowek }}>{t(`ustawienia.miary_${preferencje.ukladMiar}`)}</Text>
            </Pressable>
            <Text style={st.podpis}>{t('ustawienia.ekran_nie_gasnie_opis')}</Text>
          </>
        )}
      </View>
      {dane && (
        <View style={st.grupa}>
          <Przycisk tekst={t('ustawienia.eksport')} onPress={dane.naEksport} rodzaj="tekstowy" testID="ustawienia-eksport" />
          <Przycisk tekst={t('ustawienia.import')} onPress={dane.naImport} rodzaj="tekstowy" testID="ustawienia-import" />
          <Przycisk tekst={t('ustawienia.usun_wszystko')} onPress={dane.naUsunWszystko} rodzaj="tekstowy" testID="ustawienia-usun-wszystko" />
        </View>
      )}
      {wynikDanych}
      <View style={st.grupa}>
        <Przycisk tekst={t('ustawienia.stan_danych')} onPress={naStanDanych} rodzaj="tekstowy" />
        <Przycisk tekst={t('ustawienia.zglos')} onPress={naZglosProblem} rodzaj="tekstowy" testID="ustawienia-zglos" />
        <Przycisk tekst={t('ustawienia.ocen')} onPress={() => system.otworzAdres(adresy.recenzja)} rodzaj="tekstowy" testID="ustawienia-ocen" />
        <Przycisk tekst={t('ustawienia.polityka')} onPress={() => system.otworzAdres(adresy.polityka)} rodzaj="tekstowy" rola="link" />
        {naZrodla && <Przycisk tekst={t('ustawienia.zrodla_wiedzy')} onPress={naZrodla} rodzaj="tekstowy" testID="ustawienia-zrodla" />}
      </View>
      {jezyk && (
        <View style={st.grupa}>
          {/* design-spec „Ustawienia › Język”: wiersz z wartością; VoiceOver czyta etykietę i wartość (accessibilityValue). */}
          <Pressable accessibilityRole="button" accessibilityLabel={t('ustawienia.jezyk')} onPress={jezyk.naJezyk} style={st.wiersz} testID="ustawienia-jezyk"
            accessibilityValue={{ text: jezyk.stan.wartosc === 'auto' ? t('ustawienia.jezyk_automatyczny') : NAZWY_JEZYKOW[jezyk.stan.wartosc] }}>
            <Text style={{ ...typografia.tresc, color: k.grafit }}>{t('ustawienia.jezyk')}</Text>
            <Text style={{ ...typografia.tresc, color: k.olowek }}>{jezyk.stan.wartosc === 'auto' ? t('ustawienia.jezyk_automatyczny') : NAZWY_JEZYKOW[jezyk.stan.wartosc]}</Text>
          </Pressable>
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
