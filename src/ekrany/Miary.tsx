// Ustawienia › Units (ADR-0029, BR-KAL-003/S6, design-spec 004): „Automatic / Metric / Imperial” jako lista z jednym ✓ (jak „Language”).
// Wybór działa od razu (kompozycja zapisuje i wraca); miary zmieniają wyświetlanie i wpisywanie, dane zostają w mm i g.
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Przycisk } from './Arkusz';
import { cel, MAX_SKALA_TYTULOWA, odstep, promien, typografia, useKolory, type Kolory } from './motyw';
import type { PreferencjaMiar } from '../domena/preferencje';
import type { Tlumacz } from './wspolne';

export type PropsWyboruMiar = { t: Tlumacz; wybrany: PreferencjaMiar; naWybierz(p: PreferencjaMiar): void; naWstecz?(): void };

export function WyborMiar({ t, wybrany, naWybierz, naWstecz }: PropsWyboruMiar): React.ReactElement {
  const st = style(useKolory());
  const opcje: { p: PreferencjaMiar; nazwa: string; opis: string | null }[] = [
    { p: 'auto', nazwa: t('ustawienia.miary_auto'), opis: null },
    { p: 'metric', nazwa: t('ustawienia.miary_metric'), opis: t('ustawienia.miary_metric_opis') },
    { p: 'imperial', nazwa: t('ustawienia.miary_imperial'), opis: t('ustawienia.miary_imperial_opis') },
  ];
  return (
    <ScrollView style={st.ekran} contentContainerStyle={st.tresc} testID="miary">
      {naWstecz && <View style={{ flexDirection: 'row' }}><Przycisk tekst={`‹ ${t('wspolne.wstecz')}`} etykieta={t('wspolne.wstecz')} onPress={naWstecz} rodzaj="tekstowy" testID="nav-wstecz" /></View>}
      <Text style={st.tytul} accessibilityRole="header" maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{t('ustawienia.uklad_miar')}</Text>
      <View style={st.grupa} accessibilityRole="radiogroup">
        {opcje.map((o) => {
          const w = o.p === wybrany;
          return (
            <Pressable key={o.p} accessibilityRole="radio" accessibilityState={{ checked: w }} accessibilityLabel={o.opis ? `${o.nazwa}, ${o.opis}` : o.nazwa} onPress={() => naWybierz(o.p)} style={st.wiersz} testID={`miary-${o.p}`}>
              <View>
                <Text style={st.nazwa}>{o.nazwa}</Text>
                {o.opis && <Text style={st.opisWiersza}>{o.opis}</Text>}
              </View>
              {w && <Text style={st.znak} importantForAccessibility="no" accessibilityElementsHidden>✓</Text>}
            </Pressable>
          );
        })}
      </View>
      <Text style={st.opis}>{t('ustawienia.miary_opis')}</Text>
    </ScrollView>
  );
}

function style(k: Kolory) {
  return StyleSheet.create({
    ekran: { flex: 1, backgroundColor: k.papier },
    tresc: { padding: odstep.l, gap: odstep.l },
    tytul: { ...typografia.tytul, color: k.grafit },
    grupa: { borderRadius: promien.grupa, backgroundColor: k.papierGrupa, overflow: 'hidden' },
    wiersz: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: cel.minimum, paddingHorizontal: odstep.l, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: k.linia },
    nazwa: { ...typografia.tresc, color: k.grafit },
    opisWiersza: { ...typografia.podpis, color: k.olowek },
    znak: { ...typografia.tresc, color: k.grafit, fontWeight: '700' },
    opis: { ...typografia.podpis, color: k.olowek, paddingHorizontal: odstep.m },
  });
}
