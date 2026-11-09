// 009 (P-614 (4), design-spec „Fix E5”): menu jako lista bez obrysów przycisków — tokeny `menu.*` (docs/design/tokeny.json).
// Arkusz menu (••• licznika, „Cel”; makieta `licznik-menu` `.ark-m`): tło `tlo`, „Anuluj” w lewym górnym rogu, tytuł `tresc` 700 w środku (od AX3 pod „Anuluj”),
// grupy `lista` (powierzchnia, promień lista) z pozycjami 44 i podziałką `linia`, odstęp grup 12. Menu pływające („+”/••• projektu, źródło zdjęcia; `.pr-menu`):
// 250 pt, pozycje 44, promień lista, cień (`boxShadow`, wartości CSS z tokenu — RN 0.86, nowa architektura), od AX3 na całą szerokość z marginesem 12.
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import tokeny from '../../docs/design/tokeny.json';
import { style as styleArkusza } from './Arkusz';
import { MAX_SKALA_TYTULOWA, odstep, PROG_AX3, promien, typografia, useKolory, type Kolory } from './motyw';

const m = tokeny.menu;
const cien = m.plywajace.cien;
/** Kolor cienia `#rrggbb` z tokenu + przezroczystość → `rgba(…)` dla `boxShadow`. */
const rgba = (hex: string, a: number) => `rgba(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')}, ${a})`;
const kolor = (k: Kolory, nazwa: string) => (k as unknown as Record<string, string>)[nazwa]!;

/** Arkusz menu: nagłówek (Anuluj, tytuł) nad przewijaną listą grup. testID `arkusz-zamknij` jak w arkuszu decyzji (E2E). */
export function ArkuszMenu(p: { tytul: string; anuluj: string; naAnuluj(): void; children: React.ReactNode }): React.ReactElement {
  const k = useKolory();
  const st = style(k);
  const sa = styleArkusza(k);
  const ax3 = useWindowDimensions().fontScale >= PROG_AX3;
  const anuluj = (
    <Pressable accessibilityRole="button" accessibilityLabel={p.anuluj} onPress={p.naAnuluj} style={sa.akcja} testID="arkusz-zamknij">
      <Text style={sa.anuluj}>{p.anuluj}</Text>
    </Pressable>
  );
  return (
    <View style={st.arkusz} testID="arkusz-menu">
      {ax3 ? (
        <View style={sa.naglowekDuzy} testID="arkusz-naglowek">
          {anuluj}
          <Text style={[sa.naglowekTytulOsobny, st.doLewej]} maxFontSizeMultiplier={MAX_SKALA_TYTULOWA} accessibilityRole="header">{p.tytul}</Text>
        </View>
      ) : (
        <View style={sa.naglowek} testID="arkusz-naglowek">
          {anuluj}
          <Text style={sa.naglowekTytul} maxFontSizeMultiplier={MAX_SKALA_TYTULOWA} accessibilityRole="header">{p.tytul}</Text>
          <View style={sa.akcja} />{/* symetria: tytuł na środku paska jak w makiecie (pusta trzecia kolumna) */}
        </View>
      )}
      <ScrollView contentContainerStyle={st.tresc} showsVerticalScrollIndicator={false}>{p.children}</ScrollView>
    </View>
  );
}

/** Grupa listy (`menu.arkusz.grupa` = `lista`): pozycje rozdziela podziałka `linia` (osobny element, pozycje bez obrysu). */
export function GrupaMenu(p: { children: React.ReactNode }): React.ReactElement {
  const st = style(useKolory());
  return <View style={st.grupa} testID="menu-grupa-lista">{zPodzialka(p.children, st.podzialka)}</View>;
}

/** Menu pływające (`menu.plywajace`). `polozenie`: miejsce względem przycisku, który je otworzył (np. absolutnie pod paskiem). */
export function MenuPlywajace(p: { children: React.ReactNode; testID?: string; polozenie?: StyleProp<ViewStyle> }): React.ReactElement {
  const st = style(useKolory());
  const ax3 = useWindowDimensions().fontScale >= PROG_AX3;
  // W przepływie (bez `polozenie`) od AX3 lista rozciąga się na szerokość rodzica; położona absolutnie — marginesy 12 od krawędzi.
  const szerokosc = ax3 ? (p.polozenie ? st.plywajacePelne : null) : [st.plywajaceWaskie, !p.polozenie && st.doPoczatku];
  return <View style={[p.polozenie, st.plywajace, szerokosc]} testID={p.testID}>{zPodzialka(p.children, st.podzialka)}</View>;
}

/** Pozycja menu: cały wiersz jest celem dotyku (44), tekst `tresc` w `tekst`; `niszczacy` tylko dla działania nieodwracalnego; wyłączona — `przyciskNieaktywnyTekst`. */
export function PozycjaMenu(p: { tekst: string; onPress(): void; testID?: string; etykieta?: string; podpowiedz?: string; wylaczony?: boolean; niszczacy?: boolean; plywajace?: boolean; children?: React.ReactNode }): React.ReactElement {
  const k = useKolory();
  const st = style(k);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={p.etykieta ?? p.tekst} accessibilityHint={p.podpowiedz} onPress={p.onPress} testID={p.testID}
      disabled={p.wylaczony} accessibilityState={p.wylaczony ? { disabled: true } : undefined} style={[st.pozycja, p.plywajace && st.pozycjaPlywajaca]}>
      <Text style={[st.tekst, p.niszczacy && { color: k.niszczacy }, p.wylaczony && { color: k.przyciskNieaktywnyTekst }]}>{p.tekst}</Text>
      {p.children}
    </Pressable>
  );
}

function zPodzialka(dzieci: React.ReactNode, s: ViewStyle): React.ReactNode[] {
  const lista = React.Children.toArray(dzieci).filter(React.isValidElement);
  return lista.flatMap((d, i) => (i === 0 ? [d] : [<View key={`podzialka-${i}`} style={s} testID="menu-podzialka" />, d]));
}

function style(k: Kolory) {
  return StyleSheet.create({
    arkusz: { flex: 1, backgroundColor: kolor(k, m.arkusz.tlo) },
    tresc: { paddingHorizontal: odstep.l, paddingTop: odstep.s, paddingBottom: odstep.xl, gap: m.arkusz.odstepGrup },
    doLewej: { textAlign: 'left' },
    grupa: { backgroundColor: k.powierzchnia, borderRadius: promien[m.arkusz.grupa as 'lista'], overflow: 'hidden' },
    podzialka: { height: StyleSheet.hairlineWidth, backgroundColor: kolor(k, m.plywajace.podzialka) },
    pozycja: { minHeight: m.arkusz.wysokoscPozycji, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: odstep.s, paddingVertical: odstep.s, paddingHorizontal: odstep.l },
    pozycjaPlywajaca: { minHeight: m.plywajace.wysokoscPozycji },
    tekst: { ...typografia.tresc, color: k.tekst, flexShrink: 1 },
    plywajace: {
      marginTop: m.plywajace.odstepOdPaska, backgroundColor: kolor(k, m.plywajace.tlo), borderRadius: promien[m.plywajace.promien as 'lista'],
      boxShadow: `0px ${cien.przesuniecieY}px ${cien.rozmycie}px ${rgba(cien.kolor, cien.przezroczystosc)}`, zIndex: 2,
    },
    plywajaceWaskie: { width: m.plywajace.szerokosc },
    plywajacePelne: { left: odstep.m, right: odstep.m },
    doPoczatku: { alignSelf: 'flex-start' },
  });
}
