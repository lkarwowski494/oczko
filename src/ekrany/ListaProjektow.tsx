// Lista projektów (F-50, F-54, F-60; design-spec.md:55, ekrany.html `projekty`). Sygnatura: propozycja 07 (E3), granice zatwierdzone przez 05.
// Wyszukiwanie liczy przypadek użycia (stan przychodzi przefiltrowany); licznik darmowych dni tylko bez Pro (design-spec „Limit dni”).
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { cel, MAX_SKALA_TYTULOWA, odstep, promien, typografia, useKolory, type Kolory } from './motyw';
import { PrzyciskSymbolu, Wstecz } from './Pasek';
import type { Tlumacz } from './wspolne';

export type WierszProjektu = { id: string; nazwa: string; opis: string; termin?: string | null; ostatniaPraca?: string | null; etykieta?: string }; // teksty sformatowane w kompozycji; etykieta = zdanie dla VoiceOver (ukończone: nazwa, data, czas)
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
  /** „Back” do licznika (M1-094, 04-studio-projektowe-501, DEC-26 a): lista jest wypychana nad licznikiem; bez przycisku pusta lista była zaułkiem. */
  naWstecz?(): void;
};

export function ListaProjektow({ stan: s, t, naSzukaj, naOtworz, naNowy, naUstawienia, naKosz, naHistoria, naNarzedzia, naWstecz }: PropsListyProjektow): React.ReactElement {
  const k = useKolory();
  const st = style(k);
  const pusto = s.wToku.length === 0 && s.ukonczone.length === 0;
  const sekcja = (naglowek: string, wiersze: WierszProjektu[], testID?: string) => wiersze.length > 0 && (
    <View style={st.grupa} testID={testID}>
      <Text style={st.naglowek} accessibilityRole="header">{naglowek}</Text>
      {wiersze.map((w) => (
        <Pressable key={w.id} accessibilityRole="button" accessibilityLabel={w.etykieta} onPress={() => naOtworz(w.id)} style={st.wiersz} testID="projekty-wiersz">
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
        {naWstecz && <Wstecz tekst={t('wspolne.wstecz')} onPress={naWstecz} />}
        <View style={st.paskaPrawa}>
        {naUstawienia && <PrzyciskSymbolu symbol="gearshape" etykieta={t('ustawienia.tytul')} onPress={naUstawienia} testID="nav-ustawienia" />}
        {naHistoria && <PrzyciskSymbolu symbol="calendar" etykieta={t('dni.tytul')} onPress={naHistoria} testID="nav-historia" />}
        {/* DEC-05 a: jedyny symbol z widocznym podpisem — kształt linijki nie mówi sam, że tu są kalkulatory, zapas i druty (przejście C1, D1) */}
        {naNarzedzia && <PrzyciskSymbolu symbol="ruler" etykieta={t('narzedzia.tytul')} podpis={t('narzedzia.tytul')} onPress={naNarzedzia} testID="nav-narzedzia" />}
        <PrzyciskSymbolu symbol="plus" etykieta={t('projekty.nowy')} onPress={naNowy} testID="projekty-nowy" />
        </View>
      </View>
      <Text style={st.tytul} accessibilityRole="header" maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{t('projekty.tytul')}</Text>
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
      {s.dni && <Text style={st.info} testID="projekty-dni-darmowe">{t('projekty.dni', { count: s.dni.limit, zostalo: s.dni.zostalo, limit: s.dni.limit, miesiac: s.dni.miesiac })}</Text>}
    </ScrollView>
  );
}

function style(k: Kolory) {
  return StyleSheet.create({
    ekran: { flex: 1, backgroundColor: k.papier },
    tresc: { padding: odstep.l, gap: odstep.l },
    pasek: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    paskaPrawa: { flexDirection: 'row', flexShrink: 0, marginLeft: 'auto' }, // symbole zostają w pasku przy AX5, „Back” zawija się jak na liczniku
    tytul: { ...typografia.tytul, color: k.grafit },
    szukaj: { ...typografia.tresc, color: k.grafit, minHeight: cel.minimum, borderRadius: promien.pole, backgroundColor: k.papierGrupa, paddingHorizontal: odstep.m },
    grupa: { borderRadius: promien.grupa, backgroundColor: k.papierGrupa, overflow: 'hidden' },
    naglowek: { ...typografia.drobny, color: k.olowek, paddingHorizontal: odstep.l, paddingTop: odstep.m }, // `.naglowek-grupy`: 13 pt (ekrany.html), H-2
    wiersz: { flexDirection: 'row', alignItems: 'center', gap: odstep.m, minHeight: cel.minimum, padding: odstep.l, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: k.linia },
    wierszTekst: { flex: 1 },
    nazwa: { ...typografia.tresc, color: k.grafit, fontWeight: '700' },
    opis: { ...typografia.podpis, color: k.olowek },
    info: { ...typografia.podpis, color: k.olowek },
  });
}
