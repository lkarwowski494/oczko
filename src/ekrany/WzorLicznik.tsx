// Licznik przeglądarki wzoru: pasek pod wzorem albo kolumna obok (design-spec „Wzór, rysik i iPad” W1a, W3, W4b; te same testID co ekran licznika).
// Wydzielone bez zmian z WzorPrzegladarka.tsx (limit rozmiaru pliku, P-364); stan błędu zapisu i wywołania +1/−1 zostają w ekranie.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MAX_SKALA_LICZBY, odstep, promien, typografia, useKolory, type Kolory } from './motyw';
import type { Tlumacz } from './wspolne';

export type PropsLicznikaWzoru = {
  t: Tlumacz;
  licznik: { liczba: number; dziergany: number; znaczenie: 'skonczone' | 'w_trakcie' };
  obok: boolean;                       // kolumna obok wzoru (W3, W4b) zamiast paska pod wzorem
  szerokoscKolumny?: number | null;    // pt, tylko przy `obok`
  blad: boolean;                       // nieudany zapis +1/−1: alert pod liczbą
  naPlus(): void;
  naMinus(): void;
};

export function LicznikWzoru(p: PropsLicznikaWzoru): React.ReactElement {
  const { t, obok } = p;
  const st = style(useKolory());
  return (
    <View style={obok ? [st.kolumna, { width: p.szerokoscKolumny ?? undefined }] : st.pasekLicznika} testID={obok ? 'wzor-kolumna-licznika' : 'wzor-pasek-licznika'}>
      <View style={obok ? st.liczbaBlokKolumna : st.liczbaBlok} testID="wzor-liczba-blok">
        <Text style={obok ? st.liczbaKolumna : st.liczba} maxFontSizeMultiplier={MAX_SKALA_LICZBY} testID="licznik-wartosc">{String(p.licznik.liczba)}</Text>
        {p.licznik.znaczenie !== 'w_trakcie'
          ? <Text style={st.podpis} testID="licznik-teraz-rzad">{t('licznik.teraz', { n: p.licznik.dziergany })}</Text>
          : <Text style={st.podpis} testID="licznik-podpis">{t('licznik.jednostka_w_trakcie')}</Text>}{/* P2-5b, P-373: jak Licznik.tsx:100 */}
      </View>
      {p.blad && <Text style={st.tresc} accessibilityRole="alert" testID="blad-zapisu">{t('licznik.blad_zapisu')}</Text>}
      <View style={obok ? st.przyciskiKolumna : st.przyciski}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('licznik.minus_a11y')} onPress={p.naMinus} style={st.minus} testID="licznik-minus">
          <Text style={st.minusTekst}>{t('licznik.minus')}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('licznik.plus_a11y', { n: p.licznik.dziergany })} onPress={p.naPlus} style={[st.plus, obok && st.plusKolumna]} testID="licznik-plus">
          <Text style={st.plusTekst}>{t('licznik.plus')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function style(k: Kolory) {
  return StyleSheet.create({
    tresc: { ...typografia.tresc, color: k.grafit },
    podpis: { ...typografia.podpis, color: k.olowek, paddingHorizontal: odstep.l },
    pasekLicznika: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: k.linia, paddingHorizontal: odstep.l, paddingVertical: odstep.s, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: odstep.m, backgroundColor: k.papier },
    kolumna: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: k.linia, padding: odstep.l, gap: odstep.m, backgroundColor: k.papier },
    liczbaBlok: { flexShrink: 1 },
    liczba: { ...typografia.liczba, fontSize: 40, lineHeight: 48, color: k.grafit }, // pasek licznika: 40 pt (design-spec W1a)
    // Kolumna (W3, W4b): liczba 64 pt, nigdy ściśnięta; +1 bierze resztę z jawną podstawą 0 — na urządzeniu blok liczby wyszedł 0 pt, a −1
    // poza kolumną (P-262 (b), przebieg 119, scen. 23 i 44; przyczyna w Yoga nieodtworzona poza urządzeniem).
    liczbaBlokKolumna: { flexShrink: 0 },
    liczbaKolumna: { ...typografia.liczba, fontSize: 64, lineHeight: 64, color: k.grafit },
    przyciski: { flexDirection: 'row', alignItems: 'center', gap: odstep.m, flexGrow: 1, justifyContent: 'flex-end' },
    przyciskiKolumna: { flexGrow: 1, flexShrink: 1, flexBasis: 0, flexDirection: 'column-reverse', gap: odstep.m },
    minus: { width: 56, height: 56, borderRadius: promien.przyciskDrugi, borderWidth: 2, borderColor: k.drugiPrzyciskObrys, alignItems: 'center', justifyContent: 'center' },
    minusTekst: { ...typografia.przycisk, color: k.grafit },
    plus: { minHeight: 72, minWidth: 132, flexGrow: 1, borderRadius: promien.przyciskGlowny, backgroundColor: k.przyciskTlo, borderWidth: 2, borderColor: k.przyciskObrys, alignItems: 'center', justifyContent: 'center', padding: odstep.m },
    plusKolumna: { flexGrow: 1, flexShrink: 1, flexBasis: 0 },
    plusTekst: { ...typografia.przycisk, color: k.przyciskTekst },
  });
}
