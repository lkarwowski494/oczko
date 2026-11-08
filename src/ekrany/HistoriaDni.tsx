// Ekran „History” (F-59; BR-DNI-001–003; M3 p5, makieta dzianina/ekrany.html `historia`): kalendarz miesiąca od poniedziałku na pełną szerokość ekranu
// (dzień ≥ 44 pt także przy 320 pt; przy AX5 siatka zostaje); dzień z robótką to kwadrat w kolorze `akcent` z obwódką `akcentTekst` (jak „Ten tydzień” na „Dziś”),
// wybrany dzień ma obwódkę `tekst`, dziś jest pogrubione i podkreślone; pod kalendarzem projekty wybranego dnia i dwa bloki bez przełącznika:
// tydzień wybranego dnia i miesiąc, w kartach. Bez serii i ponagleń (BR-DNI-001 S5).
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { cel, MAX_SKALA_TYTULOWA, odstep, ROZMIAR_SYMBOLU_KAPSULY, promien, typografia, useKolory, type Kolory } from './motyw';
import type { Tlumacz } from './wspolne';
import { PrzyciskSymbolu, Wstecz } from './Pasek';

export type KomorkaDnia = { dzien: string; numer: number; robotka: boolean; dzis: boolean; a11y: string };
export type BlokHistorii = { naglowek: string; linie: string[]; bezStopera: boolean };
export type StanHistorii = {
  miesiac: string; skroty: string[]; puste: number; komorki: KomorkaDnia[]; wybrany: string; naglowekDnia: string;
  projekty: { id: string; nazwa: string; linia: string }[]; ukonczoneDnia?: string[]; tydzien: BlokHistorii; miesiacBlok: BlokHistorii; pierwsze: boolean;
};
export type PropsHistorii = { stan: StanHistorii; t: Tlumacz; naWybierz(dzien: string): void; naPoprzedni(): void; naNastepny(): void; naProjekt(id: string): void; naWstecz?(): void };

export function HistoriaDni({ stan: s, t, naWybierz, naPoprzedni, naNastepny, naProjekt, naWstecz }: PropsHistorii): React.ReactElement {
  const k = useKolory();
  // Szerokość komórki: siedem kolumn na pełną szerokość ekranu (treść ma po bokach `odstep.l`, siatka je zabiera ujemnym marginesem). Do pierwszego pomiaru — szerokość okna.
  const okno = useWindowDimensions().width;
  const [trescSzer, ustawTrescSzer] = useState<number | null>(null);
  const komorka = Math.floor((trescSzer === null ? okno : trescSzer + 2 * odstep.l) / 7);
  const st = style(k, komorka);
  const blok = (b: BlokHistorii, testID: string) => (
    <View style={st.blok} testID={testID}>
      <Text style={st.naglowekBloku} accessibilityRole="header">{b.naglowek}</Text>
      <View style={st.karta}>
        {b.linie.map((l) => <Text key={l} style={st.tekst}>{l}</Text>)}
        {b.bezStopera && <Text style={st.podpis}>{t('dni.bez_stopera')}</Text>}
      </View>
    </View>
  );
  return (
    <ScrollView style={st.ekran} contentContainerStyle={st.tresc} testID="historia">
      {naWstecz && <Wstecz tekst={t('wspolne.wstecz')} onPress={naWstecz} />}
      <Text style={st.tytul} accessibilityRole="header" maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{t('dni.tytul')}</Text>
      <View style={st.kalendarz} onLayout={(e) => ustawTrescSzer(e.nativeEvent.layout.width)}>
        <View style={st.wierszMiesiaca}>
          <Text style={[st.tekst, st.pogrubiony]}>{s.miesiac}</Text>
          <View style={{ flexDirection: 'row' }}>
            <PrzyciskSymbolu symbol="chevron.backward" etykieta={t('dni.poprzedni_miesiac_a11y')} onPress={naPoprzedni} rozmiar={ROZMIAR_SYMBOLU_KAPSULY} />
            <PrzyciskSymbolu symbol="chevron.forward" etykieta={t('dni.nastepny_miesiac_a11y')} onPress={naNastepny} rozmiar={ROZMIAR_SYMBOLU_KAPSULY} />
          </View>
        </View>
        <View style={st.siatka} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {s.skroty.map((x, i) => <Text key={`${x}${i}`} style={[st.komorka, st.podpis, { textAlign: 'center' }]}>{x}</Text>)}
        </View>
        <View style={st.siatka} testID="historia-kalendarz">
          {Array.from({ length: s.puste }, (_, i) => <View key={`p${i}`} style={st.komorka} testID="historia-pusta-komorka" />)}
          {s.komorki.map((d) => {
            const wybrany = d.dzien === s.wybrany;
            return (
              <Pressable key={d.dzien} accessibilityRole="button" accessibilityLabel={d.a11y} accessibilityState={{ selected: wybrany }}
                onPress={() => naWybierz(d.dzien)} style={st.komorka} testID={`historia-dzien-${d.dzien}`}>
                <View style={[st.kwadrat, d.robotka && st.dziergany, wybrany && st.wybrany]}>
                  <Text style={[st.tekst, d.robotka && { color: k.naAkcencie }, d.dzis && st.dzis]}>{d.numer}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        <Text style={st.podpis}>{t('dni.od_poniedzialku')}</Text>
      </View>
      {s.pierwsze && <Text style={st.podpis}>{t('dni.pierwsze')}</Text>}
      <View style={st.blok} testID="historia-dzien">
        <Text style={st.naglowekBloku} accessibilityRole="header">{s.naglowekDnia}</Text>
        <View style={st.karta}>
          {s.projekty.length === 0 && !s.ukonczoneDnia?.length ? <Text style={st.podpis}>{t('dni.pusto_dzien')}</Text> : s.projekty.map((p) => (
            <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={`${p.nazwa}, ${p.linia}`} onPress={() => naProjekt(p.id)} style={st.wiersz}>
              <Text style={st.tekst}>{p.nazwa}</Text>
              <Text style={st.podpis}>{p.linia}</Text>
            </Pressable>
          ))}
          {!!s.ukonczoneDnia?.length && <Text style={st.podpis} testID="historia-ukonczono">{t('dni.ukonczone', { lista: s.ukonczoneDnia.join(', ') })}</Text>}
        </View>
      </View>
      {blok(s.tydzien, 'historia-tydzien')}
      {blok(s.miesiacBlok, 'historia-miesiac')}
    </ScrollView>
  );
}

function style(k: Kolory, komorka: number) {
  return StyleSheet.create({
    ekran: { flex: 1, backgroundColor: k.tlo },
    tresc: { padding: odstep.l, gap: odstep.l },
    tytul: { ...typografia.tytul, color: k.tekst },
    kalendarz: { gap: odstep.xs },
    karta: { borderRadius: promien.przycisk, backgroundColor: k.powierzchnia, padding: odstep.l, gap: odstep.xs },
    wierszMiesiaca: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' },
    // Siatka na pełną szerokość ekranu: ujemny margines zabiera boczne `odstep.l` treści, komórka = szerokość ekranu / 7 (≥ 44 pt od 308 pt).
    siatka: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -odstep.l, width: komorka * 7, alignSelf: 'center' },
    komorka: { width: komorka, minHeight: cel.minimum, padding: odstep.xs / 2, alignItems: 'stretch', justifyContent: 'center' },
    kwadrat: { flex: 1, borderRadius: promien.dzien, backgroundColor: k.dzienPusty, borderWidth: 2, borderColor: k.dzienPusty, alignItems: 'center', justifyContent: 'center' },
    dziergany: { backgroundColor: k.akcent, borderColor: k.akcentTekst },
    wybrany: { borderColor: k.tekst },
    dzis: { fontWeight: '700', textDecorationLine: 'underline' },
    blok: { gap: odstep.xs },
    naglowekBloku: { ...typografia.tresc, fontWeight: '700', color: k.tekst, marginTop: odstep.xl - odstep.l },
    tekst: { ...typografia.tresc, color: k.tekst },
    pogrubiony: { fontWeight: '700' },
    podpis: { ...typografia.podpis, color: k.tekst2 },
    wiersz: { minHeight: cel.minimum, justifyContent: 'center', paddingVertical: odstep.xs },
  });
}
