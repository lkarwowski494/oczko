// Warstwa „Tools” (P-046, P-191 P7a): zapas (F-37, BR-ZAP-001), druty, kalkulator „Swatch” (F-38; BR-KAL-001, BR-KAL-003, R-131).
// Makiety 04 fix-6 `narzedzia`, `probka`, `probka-cale`, `probka-blad`; testID z e2e/README.md. Pielęgnacja tylko tekstem albo zdjęciem
// etykiety, bez symboli (OG-13, OP-11). Wyniki kalkulatora liczy kompozycja (`licz`), ekran tylko pokazuje.
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Arkusz, Komunikat, Pole, Tresc, Wybor } from './Arkusz';
import { cel, MAX_SKALA_TYTULOWA, odstep, promien, typografia, useKolory, type Kolory } from './motyw';
import type { Tlumacz } from './wspolne';
import type { StanProbki, WejscieProbki } from '../kompozycja/probka';

export type PropsWloczki = {
  stan: { nazwa: string; pielegnacja: { tekst: string | null; zdjecie: string | null } }; // bez symboli pielęgnacji (OG-13, OP-11)
  t: Tlumacz;
  naZapisz(p: { tekst: string | null; zdjecie: string | null }): void;
};
export function Wloczka({ stan, t }: PropsWloczki): React.ReactElement {
  const p = stan.pielegnacja;
  return (
    <Arkusz tytul={stan.nazwa} przyciski={null}>
      <Tresc podpis>{t('narzedzia.pielegnacja')}</Tresc>
      {p.tekst && <Tresc>{p.tekst}</Tresc>}
      {p.zdjecie && <Image source={{ uri: p.zdjecie }} accessible accessibilityRole="image" accessibilityLabel={t('narzedzia.zdjecie_etykiety', { nazwa: stan.nazwa })} style={stale.zdjecie} />}
    </Arkusz>
  );
}

/** Wiersz grupy z „›” (wejście do ekranu); `wartosc` po prawej (liczba pozycji). */
export function WierszGrupy(p: { tekst: string; opis?: string; wartosc?: string; onPress(): void; testID?: string; ostatni?: boolean }): React.ReactElement {
  const st = style(useKolory());
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={[p.tekst, p.opis, p.wartosc].filter(Boolean).join(', ')}
      onPress={p.onPress} testID={p.testID} style={[st.wiersz, p.ostatni && st.wierszOstatni]}>
      <View style={st.wierszTekst}>
        <Text style={st.nazwa}>{p.tekst}</Text>
        {p.opis ? <Text style={st.opis}>{p.opis}</Text> : null}
      </View>
      {p.wartosc ? <Text style={st.opis}>{p.wartosc}</Text> : null}
      <Text style={st.opis} importantForAccessibility="no" accessibilityElementsHidden>›</Text>
    </Pressable>
  );
}

export type PropsNarzedzi = { stan: { wloczki: number; druty: number }; t: Tlumacz; naWloczki(): void; naDruty(): void; naProbke(): void };
export function Narzedzia({ stan: s, t, naWloczki, naDruty, naProbke }: PropsNarzedzi): React.ReactElement {
  const st = style(useKolory());
  return (
    <ScrollView style={st.ekran} contentContainerStyle={st.tresc}>
      <Text style={st.tytul} accessibilityRole="header" maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{t('narzedzia.tytul')}</Text>
      <Text style={st.naglowekGrupy} accessibilityRole="header">{t('narzedzia.zapas')}</Text>
      <View style={st.grupa}>
        <WierszGrupy tekst={t('narzedzia.wloczki')} wartosc={String(s.wloczki)} onPress={naWloczki} testID="narzedzia-wloczki" />
        <WierszGrupy tekst={t('narzedzia.druty')} wartosc={String(s.druty)} onPress={naDruty} testID="narzedzia-druty" ostatni />
      </View>
      <Text style={st.naglowekGrupy} accessibilityRole="header">{t('narzedzia.obliczenia')}</Text>
      <View style={st.grupa}>
        <WierszGrupy tekst={t('narzedzia.probka')} opis={t('narzedzia.probka_opis')} onPress={naProbke} testID="narzedzia-probka" ostatni />
      </View>
    </ScrollView>
  );
}

export type PropsProbki = {
  t: Tlumacz;
  jednostka: 'cm' | 'in';                                   // z ustawień (R-131); podstawa próbki domyślnie wg niej
  poczatek: { oczka: string; na: WejscieProbki['na'] };     // z projektu (U-10) albo pusta
  zProjektu?: string;                                       // linia `probka.z_projektu`
  licz(w: WejscieProbki): StanProbki;
  naZmianeProbki?(p: { oczka: string; na: WejscieProbki['na'] }): void; // zapis próbki w projekcie (szerokość się nie zapisuje)
};
export function Probka({ t, jednostka, poczatek, zProjektu, licz, naZmianeProbki }: PropsProbki): React.ReactElement {
  const st = style(useKolory());
  const [oczka, ustawOczka] = useState(poczatek.oczka);
  const [na, ustawNa] = useState(poczatek.na);
  const [szerokosc, ustawSzerokosc] = useState('');
  const s = licz({ oczka, na, szerokosc, jednostka });
  const zmienProbke = (o: string, n: WejscieProbki['na']) => { ustawOczka(o); ustawNa(n); naZmianeProbki?.({ oczka: o, na: n }); };
  return (
    <ScrollView style={st.ekran} contentContainerStyle={st.tresc} keyboardShouldPersistTaps="handled">
      <Text style={st.tytul} accessibilityRole="header" maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{t('probka.tytul')}</Text>
      {zProjektu ? <Text style={st.opis}>{zProjektu}</Text> : null}
      <Pole etykieta={t('probka.oczka')} wartosc={oczka} naZmiane={(o) => zmienProbke(o, na)} dziesietne testID="probka-oczka" />
      <Wybor opcje={[{ wartosc: '10cm', tekst: t('probka.na_10cm') }, { wartosc: '4in', tekst: t('probka.na_4in') }]} wybrana={na} naWybor={(n) => zmienProbke(oczka, n)} />
      {s.bladOczka ? <Komunikat tekst={s.bladOczka} znak /> : null}
      {s.przeliczona ? <Text style={st.opis}>{s.przeliczona}</Text> : null}
      {s.uwaga4in ? <Text style={st.opis}>{s.uwaga4in}</Text> : null}
      <Pole etykieta={t(jednostka === 'cm' ? 'probka.szerokosc_cm' : 'probka.szerokosc_in')} wartosc={szerokosc} naZmiane={ustawSzerokosc} dziesietne testID="probka-szerokosc" />
      {s.bladSzerokosci ? <Komunikat tekst={s.bladSzerokosci} znak /> : null}
      {s.wynik ? (
        <View style={st.blok}>
          <Text style={st.naglowek} accessibilityRole="header">{t('probka.wynik_oczka')}</Text>
          <Text style={st.wynik} testID="probka-wynik-oczka" accessibilityLiveRegion="polite">{s.wynik.liczba}</Text>
          <Text style={st.opis}>{s.wynik.zDanych}</Text>
          <Text style={st.opis}>{s.wynik.uwaga}</Text>
        </View>
      ) : null}
      {s.grubosc ? (
        <View style={st.blok} testID="probka-wynik-grubosc">
          <Text style={st.naglowek} accessibilityRole="header">{t('probka.grubosc')}</Text>
          {s.grubosc.linie.map((l) => <Text key={l} style={st.zwykly}>{l}</Text>)}
          {s.grubosc.dokladnie ? <Text style={st.opis}>{s.grubosc.dokladnie}</Text> : null}
          {s.grubosc.uwagi.map((u) => <Text key={u} style={st.opis}>{u}</Text>)}
        </View>
      ) : null}
    </ScrollView>
  );
}

const stale = StyleSheet.create({ zdjecie: { width: '100%', aspectRatio: 4 / 3, borderRadius: promien.grupa } });
export function style(k: Kolory) {
  return StyleSheet.create({
    ekran: { flex: 1, backgroundColor: k.papier },
    tresc: { padding: odstep.l, gap: odstep.m },
    tytul: { ...typografia.tytul, color: k.grafit },
    naglowek: { ...typografia.podpis, color: k.olowek, fontWeight: '700', marginTop: odstep.s }, // etykiety wyników próbki (`.etyk`, 15 pt)
    naglowekGrupy: { ...typografia.drobny, color: k.olowek, marginTop: odstep.s }, // `.naglowek-grupy`: 13 pt `olowek`, bez wagi (narzedzia-zdjecia.html, sesje-historia.html:75), H-2, P2-4
    grupa: { borderRadius: promien.grupa, backgroundColor: k.papierGrupa, overflow: 'hidden' },
    wiersz: { flexDirection: 'row', alignItems: 'center', gap: odstep.m, minHeight: cel.minimum, padding: odstep.l, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: k.linia },
    wierszOstatni: { borderBottomWidth: 0 },
    wierszTekst: { flex: 1 },
    nazwa: { ...typografia.tresc, color: k.grafit },
    opis: { ...typografia.podpis, color: k.olowek },
    zwykly: { ...typografia.tresc, color: k.grafit },
    blok: { gap: odstep.xs, borderRadius: promien.grupa, backgroundColor: k.papierGrupa, padding: odstep.l },
    wynik: { ...typografia.tytul, color: k.grafit },
  });
}
