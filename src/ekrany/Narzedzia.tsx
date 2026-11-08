// Warstwa „Tools” (P-046, P-191 P7a): zapas (F-37, BR-ZAP-001), druty, kalkulator „Swatch” (F-38; BR-KAL-001, BR-KAL-003, R-131).
// Makiety 04 fix-6 `narzedzia`, `probka`, `probka-cale`, `probka-blad`; testID z e2e/README.md. Pielęgnacja tylko tekstem albo zdjęciem
// etykiety, bez symboli (OG-13, OP-11). Wyniki kalkulatora liczy kompozycja (`licz`), ekran tylko pokazuje.
import React, { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Arkusz, Komunikat, Pole, Tresc, Wybor } from './Arkusz';
import { cel, MAX_SKALA_TYTULOWA, odstep, promien, typografiaDzianiny, useKolory, type Kolory } from './motyw';
import type { Tlumacz } from './wspolne';
import type { StanProbki, WejscieProbki } from '../kompozycja/probka';
import { Wstecz } from './Pasek';
import { StrzalkaWiersza } from './SymbolSf';

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

/** Wiersz grupy ze wskaźnikiem przejścia (`chevron.forward`, M1-146; wejście do ekranu); `wartosc` po prawej (liczba pozycji). */
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
      <StrzalkaWiersza />
    </Pressable>
  );
}

// M1-016: „‹ Back” (`nav-wstecz`) jak na pozostałych ekranach push — pasek rysuje ekran (`headerShown: false`), gest od krawędzi tylko uzupełnia.
export type PropsNarzedzi = { stan: { wloczki: number; druty: number }; t: Tlumacz; naWloczki(): void; naDruty(): void; naProbke(): void; naWstecz?(): void };
export function Narzedzia({ stan: s, t, naWloczki, naDruty, naProbke, naWstecz }: PropsNarzedzi): React.ReactElement {
  const st = style(useKolory());
  return (
    <ScrollView style={st.ekran} contentContainerStyle={st.tresc}>
      {naWstecz && <Wstecz tekst={t('wspolne.wstecz')} onPress={naWstecz} />}
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
  naWstecz?(): void;                                        // M1-016: „‹ Back” (`nav-wstecz`)
  wyborNarzedzia?: boolean;                                 // M1-066 (DEC-06 a): kalkulator bez projektu — „Needles / Hook”; przy szydełku bez kategorii
};
export function Probka({ t, jednostka, poczatek, zProjektu, licz, naZmianeProbki, naWstecz, wyborNarzedzia }: PropsProbki): React.ReactElement {
  const st = style(useKolory());
  const [oczka, ustawOczka] = useState(poczatek.oczka);
  const [na, ustawNa] = useState(poczatek.na);
  const [szerokosc, ustawSzerokosc] = useState('');
  const [narzedzie, ustawNarzedzie] = useState<NonNullable<WejscieProbki['narzedzie']>>('druty'); // domyślnie druty: kategoria jak dotąd
  const s = licz({ oczka, na, szerokosc, jednostka, ...(wyborNarzedzia ? { narzedzie } : {}) });
  const zmienProbke = (o: string, n: WejscieProbki['na']) => { ustawOczka(o); ustawNa(n); naZmianeProbki?.({ oczka: o, na: n }); };
  // M1-133: klawiatura dziesiętna nie ma Return — treść odsunięta od klawiatury, chowanie gestem w dół, a przy wpisywaniu szerokości
  // pole przewija się na górę, więc wynik pod nim zostaje nad klawiaturą (04-studio-projektowe-523, opcja b, bez nowego elementu).
  const przewijanie = useRef<ScrollView>(null);
  const yPolaSzerokosci = useRef(0);
  return (
    <ScrollView ref={przewijanie} style={st.ekran} contentContainerStyle={st.tresc} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets keyboardDismissMode="interactive">
      {naWstecz && <Wstecz tekst={t('wspolne.wstecz')} onPress={naWstecz} />}
      <Text style={st.tytul} accessibilityRole="header" maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{t('probka.tytul')}</Text>
      {zProjektu ? <Text style={st.opis}>{zProjektu}</Text> : null}
      {wyborNarzedzia ? <Wybor<NonNullable<WejscieProbki['narzedzie']>> opcje={[{ wartosc: 'druty', tekst: t('projekt.druty') }, { wartosc: 'szydelko', tekst: t('projekt.szydelko') }]} wybrana={narzedzie} naWybor={ustawNarzedzie} /> : null}
      <Pole etykieta={t('probka.oczka')} wartosc={oczka} naZmiane={(o) => zmienProbke(o, na)} dziesietne testID="probka-oczka" />
      <Wybor opcje={[{ wartosc: '10cm', tekst: t('probka.na_10cm') }, { wartosc: '4in', tekst: t('probka.na_4in') }]} wybrana={na} naWybor={(n) => zmienProbke(oczka, n)} />
      {s.bladOczka ? <Komunikat tekst={s.bladOczka} znak /> : null}
      {s.przeliczona ? <Text style={st.opis}>{s.przeliczona}</Text> : null}
      {s.uwaga4in ? <Text style={st.opis}>{s.uwaga4in}</Text> : null}
      <View onLayout={(e) => { yPolaSzerokosci.current = e.nativeEvent.layout.y; }} testID="probka-szerokosc-pole">
        <Pole etykieta={t(jednostka === 'cm' ? 'probka.szerokosc_cm' : 'probka.szerokosc_in')} wartosc={szerokosc} naZmiane={ustawSzerokosc} dziesietne testID="probka-szerokosc"
          naFokus={() => przewijanie.current?.scrollTo({ y: yPolaSzerokosci.current, animated: true })} />
      </View>
      {s.bladSzerokosci ? <Komunikat tekst={s.bladSzerokosci} znak /> : null}
      {s.zaproszenie ? <Text style={st.opis} testID="probka-zaproszenie-szerokosc">{s.zaproszenie}</Text> : null}
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

const stale = StyleSheet.create({ zdjecie: { width: '100%', aspectRatio: 4 / 3, borderRadius: promien.lista } });
export function style(k: Kolory) {
  return StyleSheet.create({
    ekran: { flex: 1, backgroundColor: k.tlo },
    tresc: { padding: odstep.l, gap: odstep.m },
    tytul: { ...typografiaDzianiny.duzyTytul, color: k.tekst },
    naglowek: { ...typografiaDzianiny.tresc2, color: k.tekst2, fontWeight: '700', marginTop: odstep.s }, // etykiety wyników próbki (`.etyk`, 15 pt)
    naglowekGrupy: { ...typografiaDzianiny.mala, color: k.tekst2, marginTop: odstep.s }, // `.naglowek-grupy`: 13 pt `tekst2`, bez wagi (narzedzia-zdjecia.html, sesje-historia.html:75), H-2, P2-4
    grupa: { borderRadius: promien.lista, backgroundColor: k.powierzchnia, overflow: 'hidden' },
    wiersz: { flexDirection: 'row', alignItems: 'center', gap: odstep.m, minHeight: cel.minimum, padding: odstep.l, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: k.linia },
    wierszOstatni: { borderBottomWidth: 0 },
    wierszTekst: { flex: 1 },
    nazwa: { ...typografiaDzianiny.tresc, color: k.tekst },
    opis: { ...typografiaDzianiny.tresc2, color: k.tekst2 },
    zwykly: { ...typografiaDzianiny.tresc, color: k.tekst },
    blok: { gap: odstep.xs, borderRadius: promien.lista, backgroundColor: k.powierzchnia, padding: odstep.l },
    wynik: { ...typografiaDzianiny.duzyTytul, color: k.tekst },
  });
}
