// Ekran „History” (F-59; BR-DNI-001–003; P-191 P6a; makiety sesje-historia `historia*`): kalendarz miesiąca od poniedziałku z kreską ołówkiem
// pod dniem z robótką (element firmowy niesie dane, nie kolor), wybrany dzień w kole przycisku głównego, dziś pogrubione i podkreślone;
// pod kalendarzem projekty wybranego dnia i dwa bloki bez przełącznika: tydzień wybranego dnia i miesiąc. Bez serii i ponagleń (BR-DNI-001 S5).
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Przycisk } from './Arkusz';
import { cel, odstep, promien, typografia, useKolory, type Kolory } from './motyw';
import type { Tlumacz } from './wspolne';

export type KomorkaDnia = { dzien: string; numer: number; robotka: boolean; dzis: boolean; a11y: string };
export type BlokHistorii = { naglowek: string; linie: string[]; bezStopera: boolean };
export type StanHistorii = {
  miesiac: string; skroty: string[]; puste: number; komorki: KomorkaDnia[]; wybrany: string; naglowekDnia: string;
  projekty: { id: string; nazwa: string; linia: string }[]; ukonczoneDnia?: string[]; tydzien: BlokHistorii; miesiacBlok: BlokHistorii; pierwsze: boolean;
};
export type PropsHistorii = { stan: StanHistorii; t: Tlumacz; naWybierz(dzien: string): void; naPoprzedni(): void; naNastepny(): void; naProjekt(id: string): void; naWstecz?(): void };

export function HistoriaDni({ stan: s, t, naWybierz, naPoprzedni, naNastepny, naProjekt, naWstecz }: PropsHistorii): React.ReactElement {
  const k = useKolory();
  const st = style(k);
  const blok = (b: BlokHistorii, testID: string) => (
    <View style={st.grupa} testID={testID}>
      <Text style={st.naglowekBloku} accessibilityRole="header">{b.naglowek}</Text>
      {b.linie.map((l) => <Text key={l} style={st.tekst}>{l}</Text>)}
      {b.bezStopera && <Text style={st.podpis}>{t('dni.bez_stopera')}</Text>}
    </View>
  );
  return (
    <ScrollView style={st.ekran} contentContainerStyle={st.tresc} testID="historia">
      {naWstecz && <View style={{ flexDirection: 'row' }}><Przycisk tekst={`‹ ${t('wspolne.wstecz')}`} etykieta={t('wspolne.wstecz')} onPress={naWstecz} rodzaj="tekstowy" testID="nav-wstecz" /></View>}
      <Text style={st.tytul} accessibilityRole="header">{t('dni.tytul')}</Text>
      <View style={st.grupa}>
        <View style={st.wierszMiesiaca}>
          <Text style={[st.tekst, st.pogrubiony]}>{s.miesiac}</Text>
          <View style={{ flexDirection: 'row' }}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('dni.poprzedni_miesiac_a11y')} onPress={naPoprzedni} style={st.strzalka}><Text style={st.tekst}>‹</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={t('dni.nastepny_miesiac_a11y')} onPress={naNastepny} style={st.strzalka}><Text style={st.tekst}>›</Text></Pressable>
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
                <View style={[st.kolo, wybrany && { backgroundColor: k.przyciskTlo }]}>
                  <Text style={[st.tekst, wybrany && { color: k.przyciskTekst }, d.dzis && st.dzis]}>{d.numer}</Text>
                </View>
                {d.robotka && <View style={[st.kreska, { backgroundColor: wybrany ? k.grafit : k.kreska }]} />}
              </Pressable>
            );
          })}
        </View>
        <Text style={st.podpis}>{t('dni.od_poniedzialku')}</Text>
      </View>
      {s.pierwsze && <Text style={st.podpis}>{t('dni.pierwsze')}</Text>}
      <View style={{ gap: odstep.xs }} testID="historia-dzien">
        <Text style={st.naglowekBloku} accessibilityRole="header">{s.naglowekDnia}</Text>
        <View style={st.grupa}>
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

function style(k: Kolory) {
  return StyleSheet.create({
    ekran: { flex: 1, backgroundColor: k.papier },
    tresc: { padding: odstep.l, gap: odstep.l },
    tytul: { ...typografia.tytul, color: k.grafit },
    grupa: { borderRadius: promien.grupa, backgroundColor: k.papierGrupa, padding: odstep.m, gap: odstep.xs },
    wierszMiesiaca: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    strzalka: { minWidth: cel.minimum, minHeight: cel.minimum, alignItems: 'center', justifyContent: 'center' },
    siatka: { flexDirection: 'row', flexWrap: 'wrap' },
    komorka: { width: `${100 / 7}%`, minHeight: cel.minimum, alignItems: 'center', justifyContent: 'center' },
    kolo: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    kreska: { width: 14, height: 3, borderRadius: 1.5, transform: [{ rotate: '-8deg' }] },
    dzis: { fontWeight: '700', textDecorationLine: 'underline' },
    naglowekBloku: { ...typografia.tresc, color: k.grafit, fontWeight: '700' },
    tekst: { ...typografia.tresc, color: k.grafit },
    pogrubiony: { fontWeight: '700' },
    podpis: { ...typografia.podpis, color: k.olowek },
    wiersz: { minHeight: cel.minimum, justifyContent: 'center', paddingVertical: odstep.xs },
  });
}
