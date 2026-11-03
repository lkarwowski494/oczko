// Pasek znacznika rzędu na wzorze (F-26, 07-jakosc-023; design-spec „Znacznik rzędu na wzorze”, BR-WZR-003 S2–S4): kierunek rzędów z „Change”, krokowiec rzędu
// schematu (domyślnie rząd w robocie), „Before the pattern”, oraz koniec strony („Row n is past the bottom of page p” + „Place on page p+1” albo
// „past the end of the pattern” + „Move marker”). Sam pas rysuje widok natywny (`oczko-wzor`); tu tylko pasek ekranu, bez ruchu.
import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { MAX_SKALA_TYTULOWA, ROZMIAR_SYMBOLU, cel as rozmiary, odstep, promien, typografia, useKolory, type Kolory } from './motyw';
import type { Tlumacz } from './wspolne';

export type StanZnacznika = { strona: number; rzad: number; kierunek: 1 | -1; pozaStrona: boolean; przedSchematem: boolean };
export type PropsPaskaZnacznika = {
  t: Tlumacz;
  znacznik: StanZnacznika | null;
  ustawianie: boolean;                            // pasek ustawiania otwarty („Mark row”, przeniesienie) do „Done”
  razemStron: number;                             // 0 = nieznana (widok jeszcze nie zgłosił liczby stron)
  naGotowe(): void;
  naKrok(delta: 1 | -1): void;                    // krokowiec rzędu: różnica, nie wartość — szybkie stuknięcia nie gubią się na odświeżaniu widoku
  naZmienKierunek(): void;
  naNastepnaStrona(): void;
  naPrzestaw(): void;                             // ostatnia strona: „Move marker” otwiera pasek ustawiania
};

/** „Which way do rows go on this page?” — bez wartości domyślnej (P-126 (3a)); wybór wraca do wywołującego, który wie, po co pyta (ustawienie, zmiana, przytrzymanie). */
export function PytanieKierunku(p: { t: Tlumacz; naWybor(kierunek: 1 | -1): void }): React.ReactElement {
  const k = useKolory();
  const st = style(k);
  return (
    <View style={st.karta} accessibilityRole="summary" testID="wzor-kierunek">
      <Text style={st.tresc}>{p.t('wzor.kierunek_pytanie')}</Text>
      {([[-1, 'wzor.kierunek_gora', 'wzor.kierunek_gora_opis', '↑'], [1, 'wzor.kierunek_dol', 'wzor.kierunek_dol_opis', '↓']] as const).map(([kier, k1, k2, znak]) => (
        <Pressable key={kier} accessibilityRole="button" accessibilityLabel={`${p.t(k1)}, ${p.t(k2)}`} style={st.przycisk} onPress={() => p.naWybor(kier)}>
          <Text style={st.tresc}>{`${znak} ${p.t(k1)}, ${p.t(k2)}`}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function PasekZnacznika(p: PropsPaskaZnacznika): React.ReactElement | null {
  const { t, znacznik: z } = p;
  const k = useKolory();
  const st = style(k);
  if (!z) return null;
  const rzad = Math.max(1, z.rzad); // krokowiec pokazuje rząd schematu od 1; „przed schematem” to osobna linia
  const przycisk = (tekst: string, id: string, f: () => void, opis = tekst) => (
    <Pressable accessibilityRole="button" accessibilityLabel={opis} testID={id} onPress={f} style={st.przycisk}><Text style={[st.tresc, st.pogrubiony]}>{tekst}</Text></Pressable>
  );
  const nastepna = p.razemStron > 0 && z.strona + 1 < p.razemStron;
  return (
    <>
      {p.ustawianie && (
        <View style={st.karta} testID="wzor-znacznik-pasek">
          <View style={st.wiersz}>
            <Text style={[st.tresc, st.rosnie]}>{t(z.kierunek === -1 ? 'wzor.kierunek_stan_gora' : 'wzor.kierunek_stan_dol')}</Text>
            {przycisk(t('wzor.kierunek_zmien'), 'wzor-znacznik-zmien', p.naZmienKierunek)}
          </View>
          <View style={st.wiersz} accessibilityRole="adjustable" accessibilityLabel={t('wzor.rzad_znacznika')} accessibilityValue={{ text: String(rzad) }}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={(e) => p.naKrok(e.nativeEvent.actionName === 'increment' ? 1 : -1)}>
            <Text style={[st.tresc, st.rosnie]}>{t('wzor.rzad_znacznika')}</Text>
            {przycisk('−', 'wzor-znacznik-rzad-minus', () => p.naKrok(-1), `${t('wzor.rzad_znacznika')} −`)}
            <Text style={[st.tresc, st.pogrubiony, st.liczba]} testID="wzor-znacznik-rzad">{String(rzad)}</Text>
            {przycisk('+', 'wzor-znacznik-rzad-plus', () => p.naKrok(1), `${t('wzor.rzad_znacznika')} +`)}
          </View>
          {przycisk(t('wspolne.gotowe'), 'wzor-znacznik-gotowe', p.naGotowe)}
        </View>
      )}
      {z.przedSchematem && <Text style={[st.tresc, st.linia]} accessibilityRole="summary" testID="wzor-przed-schematem">{t('wzor.przed_schematem')}</Text>}
      {z.pozaStrona && !p.ustawianie && (
        <View style={st.karta} accessibilityRole="summary" testID="wzor-koniec-strony">
          <Text style={st.tresc}>{nastepna || p.razemStron === 0
            ? t(z.kierunek === -1 ? 'wzor.koniec_strony_gora' : 'wzor.koniec_strony_dol', { n: z.rzad, strona: z.strona + 1 })
            : t('wzor.koniec_wzoru', { n: z.rzad })}</Text>
          {(nastepna || p.razemStron === 0) && <Text style={st.podpis}>{t('wzor.koniec_strony_opis', { n: z.rzad })}</Text>}
          {nastepna || p.razemStron === 0
            ? przycisk(t('wzor.poloz_na_stronie', { strona: z.strona + 2 }), 'wzor-nastepna-strona', p.naNastepnaStrona)
            : przycisk(t('wzor.przestaw'), 'wzor-przestaw', p.naPrzestaw)}
        </View>
      )}
    </>
  );
}

function style(k: Kolory) {
  return StyleSheet.create({
    karta: { padding: odstep.m, marginHorizontal: odstep.l, marginBottom: odstep.s, borderRadius: promien.grupa, backgroundColor: k.papierGrupa, gap: odstep.s },
    wiersz: { flexDirection: 'row', alignItems: 'center', gap: odstep.s },
    rosnie: { flex: 1 },
    tresc: { ...typografia.tresc, color: k.grafit },
    podpis: { ...typografia.podpis, color: k.olowek },
    linia: { paddingHorizontal: odstep.l },
    pogrubiony: { fontWeight: '700' },
    liczba: { minWidth: 36, textAlign: 'center' },
    przycisk: { minWidth: rozmiary.minimum, minHeight: rozmiary.minimum, alignItems: 'center', justifyContent: 'center', paddingHorizontal: odstep.m, borderRadius: promien.przyciskDrugi, borderWidth: 2, borderColor: k.drugiPrzyciskObrys },
  });
}

/** M1-131 (DEC-33 b, design-spec „Aneks M2 partia 3c1” pkt 2): glif „Mark row” = uchwyt pasa znacznika z tokenów — pole ROZMIAR_SYMBOLU (skala jak symbole
 *  paska, najwyżej ×1,8), linia 0,1 pola przez całą szerokość w połowie wysokości (`grafit`), okrąg 0,5 pola ze środkiem na 0,7 szerokości, obrys 0,1 pola
 *  `grafit`, wypełnienie `papier` (tło paska). Dekoracyjny: etykieta VoiceOver zostaje na przycisku. */
export function GlifZnacznika({ k }: { k: Kolory }): React.ReactElement {
  const { fontScale } = useWindowDimensions();
  const pole = Math.round(ROZMIAR_SYMBOLU * Math.min(Math.max(fontScale, 1), MAX_SKALA_TYTULOWA));
  const gr = pole * 0.1, sr = pole * 0.5;
  return (
    <View style={{ width: pole, height: pole }} testID="wzor-zaznacz-glif" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={{ position: 'absolute', left: 0, width: pole, height: gr, top: (pole - gr) / 2, backgroundColor: k.grafit }} testID="wzor-zaznacz-glif-linia" />
      <View style={{ position: 'absolute', width: sr, height: sr, borderRadius: sr / 2, borderWidth: gr, borderColor: k.grafit, backgroundColor: k.papier, left: pole * 0.7 - sr / 2, top: (pole - sr) / 2 }} testID="wzor-zaznacz-glif-okrag" />
    </View>
  );
}
