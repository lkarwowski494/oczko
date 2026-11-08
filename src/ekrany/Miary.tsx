// Ustawienia › Units (ADR-0029, BR-KAL-003/S6, design-spec 004): „Automatic / Metric / Imperial” jako lista z jednym ✓ (jak „Language”).
// Wybór działa od razu (kompozycja zapisuje i wraca); miary zmieniają wyświetlanie i wpisywanie, dane zostają w mm i g.
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { cel, MAX_SKALA_TYTULOWA, odstep, promien, typografiaDzianiny, useKolory, type Kolory } from './motyw';
import type { PreferencjaMiar } from '../domena/preferencje';
import type { Tlumacz } from './wspolne';
import { Wstecz } from './Pasek';

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
      {naWstecz && <Wstecz tekst={t('wspolne.wstecz')} onPress={naWstecz} />}
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
    ekran: { flex: 1, backgroundColor: k.tlo },
    tresc: { padding: odstep.l, gap: odstep.l },
    tytul: { ...typografiaDzianiny.duzyTytul, color: k.tekst },
    grupa: { borderRadius: promien.lista, backgroundColor: k.powierzchnia, overflow: 'hidden' },
    wiersz: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: cel.minimum, paddingHorizontal: odstep.l, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: k.linia },
    nazwa: { ...typografiaDzianiny.tresc, color: k.tekst },
    opisWiersza: { ...typografiaDzianiny.tresc2, color: k.tekst2 },
    znak: { ...typografiaDzianiny.tresc, color: k.tekst, fontWeight: '700' },
    opis: { ...typografiaDzianiny.tresc2, color: k.tekst2, paddingHorizontal: odstep.m },
  });
}
