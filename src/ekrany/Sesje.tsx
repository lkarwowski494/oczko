// Ekran „Sessions” projektu (F-51, BR-PRJ-013; P-191 P4a–P5a; makieta sesje-historia `sesje`): duży tytuł, podsumowanie, grupy według dnia
// startu (od najnowszej), wiersz z czasem i drugą linią stanu; zakończona sesja otwiera arkusz korekty, trwająca nie. Teksty sformatowane
// w kompozycji (daty Intl), druga linia przez t().
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Przycisk } from './Arkusz';
import { cel, MAX_SKALA_TYTULOWA, odstep, promien, typografia, useKolory, type Kolory } from './motyw';
import type { Tlumacz } from './wspolne';

export type DrugaLiniaSesji = { rodzaj: 'brak' } | { rodzaj: 'do_sprawdzenia'; godziny: number } | { rodzaj: 'trwa' } | { rodzaj: 'wstrzymana' } | { rodzaj: 'pauzy'; czas: string } | { rodzaj: 'skorygowana' };
export type WierszSesji = { id: string; dzien: string; wiersz: string; czas: string; a11y: string; druga: DrugaLiniaSesji; edytowalna: boolean };
export type PropsSesji = { stan: { podsumowanie: { czas: string; liczba: number }; sesje: WierszSesji[] }; t: Tlumacz; naKorekta(id: string): void; naWstecz?(): void };

function druga(d: DrugaLiniaSesji, t: Tlumacz): string | null {
  switch (d.rodzaj) {
    case 'do_sprawdzenia': return t('sesje.do_sprawdzenia', { count: d.godziny });
    case 'trwa': return t('sesje.trwa');
    case 'wstrzymana': return t('sesje.wstrzymana');
    case 'pauzy': return t('sesje.pauzy', { czas: d.czas });
    case 'skorygowana': return t('sesje.skorygowana');
    default: return null;
  }
}

export function Sesje({ stan: s, t, naKorekta, naWstecz }: PropsSesji): React.ReactElement {
  const st = style(useKolory());
  const dni = [...new Set(s.sesje.map((x) => x.dzien))];
  return (
    <ScrollView style={st.ekran} contentContainerStyle={st.tresc} testID="sesje">
      {naWstecz && <View style={{ flexDirection: 'row' }}><Przycisk tekst={`‹ ${t('wspolne.wstecz')}`} etykieta={t('wspolne.wstecz')} onPress={naWstecz} rodzaj="tekstowy" testID="nav-wstecz" /></View>}
      <Text style={st.tytul} accessibilityRole="header" maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{t('sesje.tytul')}</Text>
      <Text style={st.podpis}>{t('sesje.podsumowanie', { count: s.podsumowanie.liczba, czas: s.podsumowanie.czas })}</Text>
      <View testID="sesje-lista" style={{ gap: odstep.l }}>
        {dni.map((dzien) => (
          <View key={dzien} style={{ gap: odstep.xs }}>
            <Text style={st.naglowek} accessibilityRole="header">{dzien}</Text>
            <View style={st.grupa}>
              {s.sesje.filter((x) => x.dzien === dzien).map((x) => {
                const linia = druga(x.druga, t);
                const tresc = (
                  <>
                    <View style={st.wierszGora}>
                      <Text style={st.tekst}>{x.wiersz}</Text>
                      <Text style={st.tekst}>{x.czas}</Text>
                    </View>
                    {linia && (
                      <View style={{ flexDirection: 'row', gap: odstep.xs }} testID={x.druga.rodzaj === 'do_sprawdzenia' ? 'sesje-do-sprawdzenia' : undefined}>
                        {x.druga.rodzaj === 'do_sprawdzenia' && <Text style={st.podpis} importantForAccessibility="no" accessibilityElementsHidden>ⓘ</Text>}
                        <Text style={st.podpis}>{linia}</Text>
                      </View>
                    )}
                  </>
                );
                return x.edytowalna ? (
                  <Pressable key={x.id} accessibilityRole="button" accessibilityLabel={linia ? `${x.a11y} ${linia}` : x.a11y} onPress={() => naKorekta(x.id)} style={st.wiersz}>{tresc}</Pressable>
                ) : (
                  <View key={x.id} accessible accessibilityLabel={linia ? `${x.a11y} ${linia}` : x.a11y} style={st.wiersz}>{tresc}</View>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function style(k: Kolory) {
  return StyleSheet.create({
    ekran: { flex: 1, backgroundColor: k.papier },
    tresc: { padding: odstep.l, gap: odstep.l },
    tytul: { ...typografia.tytul, color: k.grafit },
    naglowek: { ...typografia.podpis, color: k.olowek, paddingHorizontal: odstep.m },
    podpis: { ...typografia.podpis, color: k.olowek },
    grupa: { borderRadius: promien.grupa, backgroundColor: k.papierGrupa, overflow: 'hidden' },
    wiersz: { minHeight: cel.minimum, paddingHorizontal: odstep.l, paddingVertical: odstep.s, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: k.linia },
    wierszGora: { flexDirection: 'row', justifyContent: 'space-between' },
    tekst: { ...typografia.tresc, color: k.grafit },
  });
}
