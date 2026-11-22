// Arkusz „N patterns to add” nad listą projektów (design-spec R2; P-220 R1a stan zastępczy): zlecenia ze skrzynki bez projektu; wybór projektu
// w toku albo „New project”; „Not now” zostawia je w skrzynce do następnego otwarcia. Nie nad licznikiem (P-046).
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Arkusz, Przycisk } from './Arkusz';
import { cel as rozmiary, odstep, promien, typografia, useKolory, type Kolory } from './motyw';
import type { Tlumacz } from './wspolne';

export type PropsArkuszaSkrzynki = {
  t: Tlumacz;
  pozycje: { id: string; nazwa: string; opis?: string }[]; // opis: rodzaj pliku (podgląd R2)
  projekty: { id: string; nazwa: string; opis?: string }[]; // projekty w toku, kolejność listy; opis: druga linia (P-283 (a))
  naWybierz(projektId: string | null): void;      // null = nowy projekt
  naNieTeraz(): void;
};

export function ArkuszSkrzynki(p: PropsArkuszaSkrzynki): React.ReactElement {
  const { t } = p;
  const st = style(useKolory());
  return (
    <View style={st.tlo} accessibilityViewIsModal testID="skrzynka">
      <Arkusz tytul={t('skrzynka.tytul', { count: p.pozycje.length })} przyciski={<Przycisk tekst={t('wspolne.nie_teraz')} rodzaj="tekstowy" onPress={p.naNieTeraz} />}>
        {p.pozycje.map((z) => (
          <View key={z.id}>
            <Text style={st.tekst}>{z.nazwa}</Text>
            {!!z.opis && <Text style={st.podpis}>{z.opis}</Text>}
          </View>
        ))}
        <Text style={st.naglowek} accessibilityRole="header">{t('skrzynka.dodaj_do')}</Text>
        <View style={st.grupa}>
          {p.projekty.map((x) => (
            <Pressable key={x.id} accessibilityRole="button" accessibilityLabel={x.opis ? `${x.nazwa}, ${x.opis}` : x.nazwa} onPress={() => p.naWybierz(x.id)} style={st.wiersz} testID="skrzynka-projekt">
              <Text style={st.tekst}>{x.nazwa}</Text>
              {!!x.opis && <Text style={st.podpis}>{x.opis}</Text>}
            </Pressable>
          ))}
          <Pressable accessibilityRole="button" accessibilityLabel={t('udostepnij.nowy_projekt')} onPress={() => p.naWybierz(null)} style={st.wiersz}>
            <Text style={[st.tekst, st.akcja]}>{t('udostepnij.nowy_projekt')}</Text>
          </Pressable>
        </View>
      </Arkusz>
    </View>
  );
}

function style(k: Kolory) {
  return StyleSheet.create({
    tlo: { ...StyleSheet.absoluteFill, backgroundColor: k.arkusz },
    naglowek: { ...typografia.podpis, color: k.olowek, marginTop: odstep.m },
    grupa: { borderRadius: promien.grupa, backgroundColor: k.papierGrupa, overflow: 'hidden' },
    wiersz: { minHeight: rozmiary.minimum, justifyContent: 'center', paddingHorizontal: odstep.l, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: k.linia },
    tekst: { ...typografia.tresc, color: k.grafit },
    podpis: { ...typografia.podpis, color: k.olowek },
    akcja: { fontWeight: '600' },
  });
}
