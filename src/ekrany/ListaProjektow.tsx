// Lista projektów (F-50, F-54, F-60; design-spec.md:55, ekrany.html `projekty`). Sygnatura: propozycja 07 (E3), granice zatwierdzone przez 05.
// Wyszukiwanie liczy przypadek użycia (stan przychodzi przefiltrowany); licznik darmowych dni tylko bez Pro (design-spec „Limit dni”).
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { cel, odstep, promien, typografia, useKolory, type Kolory } from './motyw';
import type { Tlumacz } from './wspolne';

export type WierszProjektu = { id: string; nazwa: string; opis: string; kolorWloczki: string | null; termin?: string | null; ostatniaPraca?: string | null }; // teksty sformatowane w kompozycji
/** Licznik darmowych dni (P-065 (2a), design-spec.md:18); `null` przy Pro (design-spec.md:19). */
export type DniNaLiscie = { zostalo: number; limit: number; miesiac: string } | null;
export type StanListyProjektow = { wToku: WierszProjektu[]; ukonczone: WierszProjektu[]; zapytanie: string; dni: DniNaLiscie; kosz?: number };
export type PropsListyProjektow = {
  stan: StanListyProjektow; // wToku i ukonczone już przefiltrowane przez zapytanie (wyszukiwanie: przypadek użycia)
  t: Tlumacz;
  naSzukaj(zapytanie: string): void;
  naOtworz(id: string): void;
  naNowy(): void;
  naUstawienia?(): void;
  /** Wejścia do „History” (P-191 P6a) i „Tools” (P7a; nav-narzedzia, kontrakt 07) — odstępstwo nazwane 08: design-spec nie podaje miejsca. */
  naHistoria?(): void;
  naNarzedzia?(): void;
  naKosz?(): void;
};

export function ListaProjektow({ stan: s, t, naSzukaj, naOtworz, naNowy, naUstawienia, naKosz, naHistoria, naNarzedzia }: PropsListyProjektow): React.ReactElement {
  const k = useKolory();
  const st = style(k);
  const pusto = s.wToku.length === 0 && s.ukonczone.length === 0;
  const sekcja = (naglowek: string, wiersze: WierszProjektu[], testID?: string) => wiersze.length > 0 && (
    <View style={st.grupa} testID={testID}>
      <Text style={st.naglowek} accessibilityRole="header">{naglowek}</Text>
      {wiersze.map((w) => (
        <Pressable key={w.id} accessibilityRole="button" onPress={() => naOtworz(w.id)} style={st.wiersz} testID="projekty-wiersz">
          {w.kolorWloczki && <View style={[st.kropka, { backgroundColor: w.kolorWloczki }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />}
          <View style={st.wierszTekst}>
            <Text style={st.nazwa}>{w.nazwa}</Text>
            {w.opis !== '' && <Text style={st.opis}>{w.opis}</Text>}
            {w.termin && <Text style={st.opis}>{w.termin}</Text>}
            {/* „last worked …” w każdym wierszu w toku, bez progu (BR-PRJ-016, P-182, P-183 1a) */}
            {w.ostatniaPraca && <Text style={st.opis} testID="projekty-ostatnia-praca">{w.ostatniaPraca}</Text>}
          </View>
        </Pressable>
      ))}
    </View>
  );
  return (
    <ScrollView style={st.ekran} contentContainerStyle={st.tresc} testID="projekty-lista">
      <View style={st.pasek}>
        {naUstawienia && (
          <Pressable accessibilityRole="button" accessibilityLabel={t('ustawienia.tytul')} onPress={naUstawienia} style={st.ikona} testID="nav-ustawienia">
            <Text style={st.ikonaTekst} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">⚙︎</Text>
          </Pressable>
        )}
        {naHistoria && (
          <Pressable accessibilityRole="button" accessibilityLabel={t('dni.tytul')} onPress={naHistoria} style={st.ikona} testID="nav-historia">
            <Text style={st.ikonaTekst} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">◷</Text>
          </Pressable>
        )}
        {naNarzedzia && (
          <Pressable accessibilityRole="button" accessibilityLabel={t('narzedzia.tytul')} onPress={naNarzedzia} style={st.ikona} testID="nav-narzedzia">
            <Text style={st.ikonaTekst} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">✂︎</Text>
          </Pressable>
        )}
        <Pressable accessibilityRole="button" accessibilityLabel={t('projekty.nowy')} onPress={naNowy} style={st.ikona} testID="projekty-nowy">
          <Text style={st.ikonaTekst} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">＋</Text>
        </Pressable>
      </View>
      <Text style={st.tytul} accessibilityRole="header">{t('projekty.tytul')}</Text>
      <TextInput placeholder={t('projekty.szukaj')} accessibilityLabel={t('projekty.szukaj')} placeholderTextColor={k.olowek} value={s.zapytanie}
        onChangeText={naSzukaj} style={st.szukaj} autoCorrect={false} testID="projekty-szukaj" />
      {pusto && <Text style={st.info}>{s.zapytanie ? t('projekty.brak_wynikow', { zapytanie: s.zapytanie }) : t('projekty.pusto')}</Text>}
      {sekcja(t('projekty.w_toku'), s.wToku)}
      {sekcja(t('projekty.ukonczone'), s.ukonczone, 'projekty-ukonczone')}
      {/* Wejście do „Recently deleted”: ostatni wiersz, tylko przy niepustym koszu (P-183 2a) */}
      {naKosz && (s.kosz ?? 0) > 0 && (
        <View style={st.grupa}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('projekty.kosz_a11y', { count: s.kosz ?? 0 })} onPress={naKosz} style={st.wiersz} testID="projekty-kosz">
            <Text style={[st.nazwa, st.wierszTekst]}>{t('projekty.kosz')}</Text>
            <Text style={st.opis}>{s.kosz}</Text>
          </Pressable>
        </View>
      )}
      {s.dni && <Text style={st.info} testID="projekty-dni-darmowe">{t('projekty.dni', { count: s.dni.zostalo, zostalo: s.dni.zostalo, limit: s.dni.limit, miesiac: s.dni.miesiac })}</Text>}
    </ScrollView>
  );
}

function style(k: Kolory) {
  return StyleSheet.create({
    ekran: { flex: 1, backgroundColor: k.papier },
    tresc: { padding: odstep.l, gap: odstep.l },
    pasek: { flexDirection: 'row', justifyContent: 'flex-end' },
    ikona: { minWidth: cel.minimum, minHeight: cel.minimum, alignItems: 'center', justifyContent: 'center' },
    ikonaTekst: { ...typografia.instrukcja, color: k.grafit },
    tytul: { ...typografia.tytul, color: k.grafit },
    szukaj: { ...typografia.tresc, color: k.grafit, minHeight: cel.minimum, borderRadius: promien.pole, backgroundColor: k.papierGrupa, paddingHorizontal: odstep.m },
    grupa: { borderRadius: promien.grupa, backgroundColor: k.papierGrupa, overflow: 'hidden' },
    naglowek: { ...typografia.podpis, color: k.olowek, paddingHorizontal: odstep.l, paddingTop: odstep.m },
    wiersz: { flexDirection: 'row', alignItems: 'center', gap: odstep.m, minHeight: cel.minimum, padding: odstep.l, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: k.linia },
    kropka: { width: odstep.m, height: odstep.m, borderRadius: odstep.m / 2 },
    wierszTekst: { flex: 1 },
    nazwa: { ...typografia.tresc, color: k.grafit, fontWeight: '700' },
    opis: { ...typografia.podpis, color: k.olowek },
    info: { ...typografia.podpis, color: k.olowek },
  });
}
