// Obraz karty ukończenia (F-53; P-191 P10a, BR-PRJ-015, ER-24; P-219 2A; design-spec „Obraz karty ukończenia”, makiety fix6 `karta-obraz`,
// `karta-obraz-bez-stopera`). Widok 360 × 450 pt (4:5) zawsze w kolorach motywu jasnego; zrzut przez view-shot do PNG 1080 × 1350 px
// (`rozmiarZrzutu`). Wielkości liczone od szerokości obrazu, nie od Dynamic Type (to plik, nie ekran) — `allowFontScaling={false}`.
// Zdjęcie: górne 46%, przycięte do wypełnienia; bez zdjęcia treść na środku papieru. Zrzut z pikseli — bez metadanych źródła.
// Odstępstwa do audytu 04: bez kropki koloru włóczki (zapas trzyma kolor tekstem) i bez znaku kresek w stopce (zasób SVG bez biblioteki SVG).
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { kolorJasny as k } from './motyw';
import type { Tlumacz } from './wspolne';

export type StanObrazuKarty = { nazwa: string; okres: string; rzedy: number; dni: number; czas: string | null; czesci: number; wloczka: string[]; zdjecie: string | null };
const SZEROKOSC = 360, WYSOKOSC = 450; // pt; 4:5
const PIKSELE = { width: 1080, height: 1350 };
/** Rozmiar zrzutu w punktach: view-shot na iOS rysuje w skali ekranu (`RNViewShot.mm`: rendererFormat.scale = 0). */
export function rozmiarZrzutu(skala: number): { width: number; height: number } {
  return { width: PIKSELE.width / skala, height: PIKSELE.height / skala };
}

const bezLiczby = (tekst: string, n: number) => tekst.replace(String(n), '').trim(); // podpis pod dużą liczbą („crafting days”)
export const ObrazKarty = React.forwardRef<View, { stan: StanObrazuKarty; t: Tlumacz }>(function ObrazKarty({ stan: s, t }, ref) {
  const kolumny: [string, string][] = [
    [String(s.rzedy), t('ukonczenie.jednostka')],
    [String(s.dni), bezLiczby(t('ukonczenie.dni', { count: s.dni }), s.dni)],
    ...(s.czas ? [[s.czas, t('karta.czas')] as [string, string]] : []),
  ];
  const linia = [s.wloczka.join(', '), t('ukonczenie.czesci', { count: s.czesci })].filter(Boolean).join(' · ');
  return (
    <View ref={ref} collapsable={false} testID="karta-obraz" style={[st.karta, !s.zdjecie && st.srodek]}>
      {s.zdjecie ? <Image source={{ uri: s.zdjecie }} resizeMode="cover" style={st.zdjecie} /> : null}
      <View style={st.tresc}>
        <Text allowFontScaling={false} style={st.okres}>{t('ukonczenie.okres', { okres: s.okres })}</Text>
        <Text allowFontScaling={false} style={st.nazwa} numberOfLines={2}>{s.nazwa}</Text>
        <View style={st.kolumny}>
          {kolumny.map(([liczba, podpis]) => (
            <View key={podpis} style={st.kolumna}>
              <Text allowFontScaling={false} style={st.liczba}>{liczba}</Text>
              <Text allowFontScaling={false} style={st.podpis}>{podpis}</Text>
            </View>
          ))}
        </View>
        <Text allowFontScaling={false} style={st.podpis} numberOfLines={2}>{linia}</Text>
      </View>
      <Text allowFontScaling={false} style={st.stopka}>{t('karta.stopka')}</Text>
    </View>
  );
});

const U = SZEROKOSC / 100; // jednostka = 1% szerokości obrazu
const st = StyleSheet.create({
  karta: { width: SZEROKOSC, height: WYSOKOSC, backgroundColor: k.papier, overflow: 'hidden' },
  srodek: { justifyContent: 'center' },
  zdjecie: { width: SZEROKOSC, height: WYSOKOSC * 0.46 },
  tresc: { paddingHorizontal: 6 * U, paddingTop: 4 * U, gap: 2 * U },
  okres: { fontSize: 3.6 * U, color: k.olowek },
  nazwa: { fontSize: 7.2 * U, fontWeight: '700', color: k.grafit },
  kolumny: { flexDirection: 'row', gap: 6 * U, marginVertical: 2 * U },
  kolumna: { gap: 0.5 * U },
  liczba: { fontSize: 8.4 * U, fontWeight: '700', color: k.grafit },
  podpis: { fontSize: 3.6 * U, color: k.olowek },
  stopka: { position: 'absolute', left: 6 * U, bottom: 4 * U, fontSize: 3.3 * U, color: k.olowek },
});
