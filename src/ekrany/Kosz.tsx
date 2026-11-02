// Ekran „Recently deleted” (F-33, BR-DAN-008; design-spec „Ekran Recently deleted”, makieta fix5 `kosz`, `kosz-pusty`; P-183).
// Pozycje przychodzą sformatowane z kompozycji (podpis „… · until {date}”); przywrócenie przez wywołanie, ekran nie importuje danych.
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { cel, MAX_SKALA_TYTULOWA, odstep, promien, typografia, useKolory, type Kolory } from './motyw';
import { Przycisk } from './Arkusz';
import type { Tlumacz } from './wspolne';

export type PozycjaKosza = { rodzaj: 'projekt' | 'czesc' | 'licznik' | 'wzor' | 'wloczka' | 'narzedzie'; id: string; nazwa: string; podpis: string };
export type StanKosza = { dni: number; pozycje: PozycjaKosza[] }; // dni = KOSZ_DNI, pozycje od najkrótszego terminu
export type PropsKosza = { stan: StanKosza; t: Tlumacz; naPrzywroc(p: { rodzaj: PozycjaKosza['rodzaj']; id: string }): void; naWstecz?(): void };

export function Kosz({ stan: s, t, naPrzywroc, naWstecz }: PropsKosza): React.ReactElement {
  const st = style(useKolory());
  return (
    <ScrollView style={st.ekran} contentContainerStyle={st.tresc}>
      {/* Powrót jak w Ustawieniach i Sesjach (trasa bez nagłówka stosu); także w pustym koszu (P-266 (2), scen. 36). */}
      {naWstecz && <View style={{ flexDirection: 'row' }}><Przycisk tekst={`‹ ${t('wspolne.wstecz')}`} etykieta={t('wspolne.wstecz')} onPress={naWstecz} rodzaj="tekstowy" testID="nav-wstecz" /></View>}
      <Text style={st.tytul} accessibilityRole="header" maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{t('kosz.tytul')}</Text>
      {s.pozycje.length === 0 ? (
        <Text style={st.opis}>{t('kosz.pusto', { count: s.dni })}</Text>
      ) : (
        <>
          <Text style={st.opis}>{t('kosz.opis', { count: s.dni })}</Text>
          <View style={st.grupa} testID="kosz-lista">
            {s.pozycje.map((p) => (
              <View key={`${p.rodzaj}-${p.id}`} style={st.wiersz}>
                <View style={st.wierszTekst}>
                  <Text style={st.nazwa}>{p.nazwa}</Text>
                  <Text style={st.opis}>{p.podpis}</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel={t('kosz.przywroc_a11y', { nazwa: p.nazwa })} onPress={() => naPrzywroc({ rodzaj: p.rodzaj, id: p.id })}
                  style={st.przycisk} testID="kosz-przywroc">
                  <Text style={st.przyciskTekst}>{t('kosz.przywroc')}</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function style(k: Kolory) {
  return StyleSheet.create({
    ekran: { flex: 1, backgroundColor: k.papier },
    tresc: { padding: odstep.l, gap: odstep.l },
    tytul: { ...typografia.tytul, color: k.grafit },
    grupa: { borderRadius: promien.grupa, backgroundColor: k.papierGrupa, overflow: 'hidden' },
    wiersz: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: odstep.m, minHeight: cel.minimum, padding: odstep.l, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: k.linia },
    wierszTekst: { flex: 1 },
    nazwa: { ...typografia.tresc, color: k.grafit, fontWeight: '700' },
    opis: { ...typografia.podpis, color: k.olowek },
    przycisk: { minHeight: cel.minimum, minWidth: cel.minimum, justifyContent: 'center' },
    przyciskTekst: { ...typografia.tresc, color: k.grafit, fontWeight: '700' },
  });
}
