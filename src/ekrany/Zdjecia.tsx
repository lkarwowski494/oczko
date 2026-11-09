// Zdjęcia projektu (F-16, BR-PRJ-003; P-191 P9a; design-spec „Zdjęcia”; makiety fix6 `projekt-zdjecia`, `zdjecie-zrodlo`, `zdjecie-podglad`,
// `zdjecie-usun`). Wybór źródła jako lista w ekranie (jak menu „+” i ••• projektu, R8 P-191 — odstępstwo od arkusza systemowego do audytu 04).
// „Share” podglądu (P-219 2A): plik przekodowany bez metadanych i GPS (kompozycja), arkusz systemowy.
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { cel, MAX_SKALA_TYTULOWA, odstep, promien, PROG_KATEGORII_DOSTEPNOSCI, ROZMIAR_SYMBOLU_TRESCI, systemCzarny, typografia, useKolory, type Kolory } from './motyw';
import tokeny from '../../docs/design/tokeny.json';
import type { Tlumacz } from './wspolne';
import { SymbolSf } from './SymbolSf';
import { MenuPlywajace, PozycjaMenu } from './MenuLista';

export type Miniatura = { id: string; uri: string };
const MINIATURA = tokeny.projekt.zdjecie.miniatura; // 014: token `projekt.zdjecie.miniatura`

export function GrupaZdjec(p: {
  t: Tlumacz; miniatury: Miniatura[]; naWybierz(z: 'aparat' | 'biblioteka'): void; naOtworz(i: number): void; panelE2e?: React.ReactNode;
  naglowek?: string; testID?: string; // arkusz włóczki: „Label photo” (P-191 P9a: jedna grupa zdjęć, bez rozróżnienia)
}): React.ReactElement {
  const { t } = p;
  const st = style(useKolory());
  const [zrodlo, ustawZrodlo] = useState(false);
  const wybierz = (z: 'aparat' | 'biblioteka') => () => { ustawZrodlo(false); p.naWybierz(z); };
  return (
    <View testID={p.testID ?? 'projekt-zdjecia'} style={{ gap: odstep.s }}>
      <Text style={st.naglowek} accessibilityRole="header">{p.naglowek ?? t('zdjecia.naglowek')}</Text>
      <ScrollView horizontal contentContainerStyle={st.rzad} showsHorizontalScrollIndicator={false}>
        {p.miniatury.map((m, i) => (
          <Pressable key={m.id} accessibilityRole="imagebutton" accessibilityLabel={t('zdjecia.a11y', { n: i + 1, count: p.miniatury.length })}
            onPress={() => p.naOtworz(i)} testID="zdjecia-miniatura">
            <Image source={{ uri: m.uri }} style={st.miniatura} />
          </Pressable>
        ))}
        <Pressable accessibilityRole="button" accessibilityLabel={t('zdjecia.dodaj')} onPress={() => ustawZrodlo((x) => !x)} style={st.kafel} testID="zdjecia-dodaj">
          <SymbolSf nazwa="plus" rozmiar={Number(typografia.tytul.fontSize)} kolor={st.plus.color} maxSkala={MAX_SKALA_TYTULOWA} />
          <Text style={st.kafelTekst}>{t('zdjecia.dodaj')}</Text>
        </Pressable>
      </ScrollView>
      {zrodlo && (
        <>
          {p.panelE2e}
          <MenuPlywajace testID="zdjecia-zrodlo-lista">{/* 009: lista pływająca `menu.plywajace` (250, 44, cień) */}
            <PozycjaMenu tekst={t('zdjecia.zrob')} onPress={wybierz('aparat')} plywajace />
            <PozycjaMenu tekst={t('zdjecia.wybierz')} onPress={wybierz('biblioteka')} plywajace />
            <PozycjaMenu tekst={t('wspolne.anuluj')} onPress={() => ustawZrodlo(false)} plywajace />
          </MenuPlywajace>
        </>
      )}
    </View>
  );
}
/** Podgląd na czarnym tle (P-191 P9a): przesunięcie w bok między zdjęciami; alternatywa — miniatury na ekranie projektu. */
export function PodgladZdjec(p: {
  t: Tlumacz; zdjecia: Miniatura[]; poczatek: number; naZamknij(): void; naUsun(id: string): void; naUdostepnij(id: string): void;
  potwierdz(tytul: string, opis: string, przycisk: string, f: () => void): void;
}): React.ReactElement {
  const { t } = p;
  const st = style(useKolory());
  const { width } = useWindowDimensions();
  const duzyTekst = useWindowDimensions().fontScale >= PROG_KATEGORII_DOSTEPNOSCI;
  const [i, ustawI] = useState(Math.min(p.poczatek, Math.max(0, p.zdjecia.length - 1)));
  const biezace = p.zdjecia[i];
  // Licznik „1 z 2”: obok akcji, od AX1 nad nimi (makieta `zdjecie`, `.duzy .zd-d span { order: -1 }`).
  const licznik = <Text style={st.licznik}>{t('zdjecia.a11y', { n: i + 1, count: p.zdjecia.length })}</Text>;
  return (
    <View style={st.podglad}>
      <View style={st.pasekGora}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('wspolne.zamknij')} onPress={p.naZamknij} style={st.przycisk} testID="zdjecie-zamknij">
          <Text style={st.akcja}>{t('wspolne.zamknij')}</Text>
        </Pressable>
      </View>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentOffset={{ x: i * width, y: 0 }}
        onMomentumScrollEnd={(e) => ustawI(Math.round(e.nativeEvent.contentOffset.x / Math.max(1, width)))}>
        {p.zdjecia.map((z, k) => (
          <Image key={z.id} source={{ uri: z.uri }} resizeMode="contain" accessible accessibilityRole="image"
            accessibilityLabel={t('zdjecia.a11y', { n: k + 1, count: p.zdjecia.length })} style={{ width, flex: 1 }} />
        ))}
      </ScrollView>
      <View style={[st.pasek, duzyTekst && st.pasekDuzy]}>
        {duzyTekst && licznik}
        <Pressable accessibilityRole="button" accessibilityLabel={t('ukonczenie.udostepnij')} onPress={() => { if (biezace) p.naUdostepnij(biezace.id); }}
          style={st.przycisk} testID="zdjecie-udostepnij">
          <SymbolSf nazwa="square.and.arrow.up" rozmiar={ROZMIAR_SYMBOLU_TRESCI} kolor={systemCzarny.akcentTekst} maxSkala={MAX_SKALA_TYTULOWA} />
          <Text style={st.akcja}>{t('ukonczenie.udostepnij')}</Text>
        </Pressable>
        {!duzyTekst && licznik}
        <Pressable accessibilityRole="button" accessibilityLabel={t('zdjecia.usun')} testID="zdjecie-usun" style={st.przycisk}
          onPress={() => { if (biezace) p.potwierdz(t('zdjecia.usun_tytul'), t('zdjecia.usun_opis'), t('zdjecia.usun'), () => p.naUsun(biezace.id)); }}>
          <SymbolSf nazwa="trash" rozmiar={ROZMIAR_SYMBOLU_TRESCI} kolor={systemCzarny.akcentTekst} maxSkala={MAX_SKALA_TYTULOWA} />
          <Text style={st.akcja}>{t('zdjecia.usun')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function style(k: Kolory) {
  return StyleSheet.create({
    naglowek: { ...typografia.instrukcja, color: k.tekst }, // jak nagłówki grup ekranu projektu (Projekt.tsx): 17 pt / 700 / tekst (`projekt.naglowekGrupy`, M3 p4b)
    rzad: { gap: odstep.s, alignItems: 'center' },
    miniatura: { width: MINIATURA, height: MINIATURA, borderRadius: promien.pole },
    // Kafel „Dodaj zdjęcie” (makieta `.zdj .d`): `powierzchnia` bez obrysu, plus w `ikona`, podpis 600 w `tekst`.
    kafel: { minWidth: MINIATURA, minHeight: MINIATURA, padding: odstep.s, borderRadius: promien.pole, backgroundColor: k.powierzchnia, alignItems: 'center', justifyContent: 'center', rowGap: odstep.xs },
    plus: { ...typografia.tytul, color: k.ikona },
    kafelTekst: { ...typografia.podpis, color: k.tekst, fontWeight: '600', textAlign: 'center' },
    tekst: { ...typografia.tresc, color: k.tekst },
    // Podgląd: czarne tło (makieta `zdjecie-podglad`) — tokeny kolor.systemCzarny, bez nowych kolorów.
    podglad: { flex: 1, backgroundColor: systemCzarny.tlo },
    pasekGora: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: odstep.l, minHeight: cel.minimum }, // Zamknij w prawym górnym rogu (podgladZdjecia, słownik interakcji)
    pasek: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: odstep.l, minHeight: cel.minimum },
    pasekDuzy: { flexDirection: 'column', alignItems: 'stretch' }, // od AX1: licznik nad akcjami, akcje jedna pod drugą
    przycisk: { minHeight: cel.minimum, minWidth: cel.minimum, flexDirection: 'row', alignItems: 'center', columnGap: odstep.s },
    akcja: { ...typografia.tresc, fontWeight: '600', color: systemCzarny.akcentTekst }, // `podgladZdjecia.akcja`
    licznik: { ...typografia.tresc, color: systemCzarny.tekst2, textAlign: 'center' }, // `podgladZdjecia.licznik`
  });
}
