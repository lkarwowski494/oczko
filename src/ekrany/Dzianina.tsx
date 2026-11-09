// Element firmowy „dzianina części” (design-spec „Element firmowy: dzianina części”, ADR-0034): kawałek dzianiny dżersejowej rośnie od nabrania (dół) do celu części (przerywana linia
// u góry). Wysokość = rzędy gotowe / cel, jaśniejszy pas u góry = rzędy dziś, igła = bieżący rząd, ząbek w brzegu = rząd najbliższego przypomnienia; oczka „V” to faktura (Pattern).
// Rysunek w react-native-svg 15.15.4, bez <Text> (tekst obok, dynamiczny krój). Dostępność: jeden element z rolą obrazu i etykietą od wywołującego (z `t()`, wzór design-spec:17);
// części rysunku niedostępne osobno. Ruch: przy zmianie liczby rzędów nowy rząd oczek wsuwa się pod igłę (180 ms, tokeny `ruch.rzadOczek`); „Ogranicz ruch” = zmiana natychmiast.
// Kolory z motywu: tło `karta`, dzianina `akcent`, pas „dziś” `akcentJasny`, igła `igla`, linia celu `kartaTekst2` (tokeny `miniatura.dzianina`, kontrast w kontrast-tabela.txt).
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, Path, Pattern, Rect } from 'react-native-svg';
import { geometriaDzianiny } from './dzianina-geometria';
import { ruch, useKolory, useOgraniczRuch } from './motyw';

export type PropsDzianiny = {
  gotowe: number;
  cel: number | null;
  dzis: number;
  /** Numer rzędu najbliższego przypomnienia albo `null`. */
  przypomnienie: number | null;
  /** Etykieta VoiceOver całego obrazu: „{część}: {gotowe} z {cel} rzędów, dziś {dziś}{, następne {przypomnienie} w rzędzie {n}}” (z `t()` u wywołującego). */
  etykieta: string;
  szerokosc: number;
  wysokosc: number;
  testID?: string;
  /** Tło kolumny; domyślnie `karta` (licznik, miniatura). Karta „Dziś” podaje nakładkę `dzianina.tloKolumnyKarty` (001, P-619). */
  tlo?: string;
  /** Margines boczny dzianiny w jednostkach rysunku (karta: 6 jak makieta `ekrany.html:629`); domyślnie 0. */
  wciecie?: number;
  /** Główka igły (makieta `ekrany.html:632`); miniatura listy bez główki. Domyślnie tak. */
  glowka?: boolean;
};

/** 001 (P-619), 021 (P-627): margines boczny dzianiny na karcie „Dziś” i na liczniku — 6 jedn. (makieta `ekrany.html:629`, wartość rysunkowa). */
export const WCIECIE_DZIANINY = 6;

/** Promień główki igły i jej odsunięcie od prawego brzegu (jednostki rysunku, makieta `ekrany.html:632`). */
const GLOWKA = { r: 3.6, odBrzegu: 3 };

// Kafelek oczek „V” (jednostki rysunku); wymiary rysunkowe, nie dziedzinowe.
const OCZKO = { w: 6, h: 6 };
const ID_OCZEK = 'dzianina-oczka';

export function Dzianina(p: PropsDzianiny): React.ReactElement {
  const k = useKolory();
  const ogranicz = useOgraniczRuch();
  const g = geometriaDzianiny(p);
  const przesuw = useRef(new Animated.Value(0)).current;
  const poprzednie = useRef(p.gotowe);
  useEffect(() => {
    if (poprzednie.current === p.gotowe) return;
    const kierunek = p.gotowe > poprzednie.current ? 1 : -1;
    poprzednie.current = p.gotowe;
    if (ogranicz) return; // „Ogranicz ruch”: zmiana natychmiast
    przesuw.setValue(kierunek * OCZKO.h);
    Animated.timing(przesuw, { toValue: 0, duration: ruch.rzadOczek, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [p.gotowe, ogranicz, przesuw]);
  const id = (s: string) => (p.testID ? `${p.testID}-${s}` : undefined);
  const x0 = p.wciecie ?? 0;
  const wD = Math.max(0, p.szerokosc - 2 * x0);
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={p.etykieta} style={{ width: p.szerokosc, height: p.wysokosc }} testID={p.testID}>
      <Animated.View style={[st.warstwa, { transform: [{ translateY: przesuw }] }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Svg width={p.szerokosc} height={p.wysokosc} viewBox={`0 0 ${p.szerokosc} ${p.wysokosc}`}>
          <Defs>
            <Pattern id={ID_OCZEK} width={OCZKO.w} height={OCZKO.h} patternUnits="userSpaceOnUse">
              <Path d={`M0.5 1 L${OCZKO.w / 2} ${OCZKO.h - 1} L${OCZKO.w - 0.5} 1`} stroke={k.karta} strokeOpacity={0.45} strokeWidth={1} fill="none" />
            </Pattern>
          </Defs>
          <Rect x={0} y={0} width={p.szerokosc} height={p.wysokosc} fill={p.tlo ?? k.karta} testID={id('tlo')} />
          {g.nabranie && (
            <G>
              <Rect x={x0} y={g.nabranie.y} width={wD} height={g.nabranie.h} fill={k.akcent} testID={id('nabranie')} />
              <Rect x={x0} y={g.nabranie.y} width={wD} height={g.nabranie.h} fill={`url(#${ID_OCZEK})`} testID={id('nabranie-oczka')} />
            </G>
          )}
          {g.dzianina.h > 0 && (
            <G>
              <Rect x={x0} y={g.dzianina.y} width={wD} height={g.dzianina.h} fill={k.akcent} testID={id('dzianina')} />
              <Rect x={x0} y={g.dzianina.y} width={wD} height={g.dzianina.h} fill={`url(#${ID_OCZEK})`} testID={id('oczka')} />
            </G>
          )}
          {g.pasDzis && <Rect x={x0} y={g.pasDzis.y} width={wD} height={g.pasDzis.h} fill={k.akcentJasny} fillOpacity={0.55} testID={id('pas-dzis')} />}
          {g.liniaCelu && <Line x1={0} y1={g.liniaCelu.y} x2={p.szerokosc} y2={g.liniaCelu.y} stroke={k.kartaTekst2} strokeWidth={1.5} strokeDasharray="4 3" testID={id('linia-celu')} />}
          {g.zabek && <Path d={`M0 ${g.zabek.y - 3} L5 ${g.zabek.y} L0 ${g.zabek.y + 3} Z`} fill={k.kartaTekst} testID={id('zabek')} />}
          <Line x1={0} y1={g.igla.y} x2={p.szerokosc} y2={g.igla.y} stroke={k.igla} strokeWidth={2.5} strokeLinecap="round" testID={id('igla')} />
          {p.glowka !== false && <Circle cx={p.szerokosc - GLOWKA.odBrzegu} cy={g.igla.y} r={GLOWKA.r} fill={k.igla} testID={id('igla-glowka')} />}
        </Svg>
      </Animated.View>
    </View>
  );
}
const st = StyleSheet.create({ warstwa: StyleSheet.absoluteFill });
