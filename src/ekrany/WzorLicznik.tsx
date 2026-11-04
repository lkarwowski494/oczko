// Licznik przeglądarki wzoru: pasek pod wzorem albo kolumna obok (design-spec „Wzór, rysik i iPad” W1a, W3, W4b; te same testID co ekran licznika).
// Wydzielone bez zmian z WzorPrzegladarka.tsx (limit rozmiaru pliku, P-364); stan błędu zapisu i wywołania +1/−1 zostają w ekranie.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MAX_SKALA_LICZBY, MAX_SKALA_MINUSA, MAX_SKALA_TYTULOWA, cel, odstep, promien, typografia, useKolory, type Kolory } from './motyw';
import type { Tlumacz } from './wspolne';

/** M1-audytor-generalny-203 (SYS-01): `limit` i `zablokowany` to nie błąd zapisu — tekst jak na liczniku (`skutekPlus`), `true` = błąd zapisu. */
export type BladPaska = boolean | 'limit' | 'zablokowany';

export type PropsLicznikaWzoru = {
  t: Tlumacz;
  licznik: { liczba: number; dziergany: number; znaczenie: 'skonczone' | 'w_trakcie' };
  obok: boolean;                       // kolumna obok wzoru (W3, W4b) zamiast paska pod wzorem
  szerokoscKolumny?: number | null;    // pt, tylko przy `obok`
  blad: BladPaska;                     // wynik +1/−1 nie-ok: alert pod liczbą (true = błąd zapisu)
  naOferty?(): void;                   // odnośnik limitu (KP-13)
  naPlus(): void;
  naMinus(): void;
};

/** M1-004: tekst błędu zapisu paska — ten sam w alercie pod liczbą i w ogłoszeniu VoiceOver, które gra trasa (`app/wzor.tsx`). */
export const tekstBleduZapisu = (t: Tlumacz): string => t('licznik.blad_zapisu');

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
      {p.blad === true && <Text style={st.tresc} accessibilityRole="alert" testID="blad-zapisu">{tekstBleduZapisu(t)}</Text>}
      {p.blad === 'zablokowany' && <Text style={st.tresc} accessibilityRole="alert">{t('licznik.zablokowany_stukniecie')}</Text>}
      {p.blad === 'limit' && (
        <View testID="limit-pasek">
          <Text style={st.tresc}>{t('limit.nie_dodano', { n: p.licznik.dziergany })}</Text>
          <Pressable accessibilityRole="link" accessibilityLabel={t('limit.pro_link')} onPress={p.naOferty} testID="limit-oferta-link">
            <Text style={[st.tresc, st.link]}>{t('limit.pro_link')}</Text>
          </Pressable>
        </View>
      )}
      <View style={obok ? st.przyciskiKolumna : st.przyciski}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('licznik.minus_a11y')} onPress={p.naMinus} style={st.minus} testID="licznik-minus">
          <Text style={st.minusTekst} maxFontSizeMultiplier={MAX_SKALA_MINUSA}>{t('licznik.minus')}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('licznik.plus_a11y', { n: p.licznik.dziergany })} onPress={p.naPlus} style={[st.plus, obok && st.plusKolumna]} testID="licznik-plus">
          <Text style={st.plusTekst} maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{t('licznik.plus')}</Text>{/* M1-205: limity jak Licznik.tsx (P-277) */}
        </Pressable>
      </View>
    </View>
  );
}

function style(k: Kolory) {
  return StyleSheet.create({
    tresc: { ...typografia.tresc, color: k.grafit },
    link: { textDecorationLine: 'underline' }, // jak LicznikStyl (odnośnik limitu)
    podpis: { ...typografia.podpis, color: k.olowek, paddingHorizontal: odstep.l },
    pasekLicznika: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: k.linia, paddingHorizontal: odstep.l, paddingVertical: odstep.s, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: odstep.m, backgroundColor: k.papier },
    kolumna: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: k.linia, padding: odstep.l, gap: odstep.m, backgroundColor: k.papier },
    liczbaBlok: { flexShrink: 1 },
    liczba: { ...typografia.liczbaPaska, color: k.grafit }, // pasek licznika: 40 pt (design-spec W1a)
    // Kolumna (W3, W4b): liczba 64 pt, nigdy ściśnięta; +1 bierze resztę z jawną podstawą 0 — na urządzeniu blok liczby wyszedł 0 pt, a −1
    // poza kolumną (P-262 (b), przebieg 119, scen. 23 i 44; przyczyna w Yoga nieodtworzona poza urządzeniem).
    liczbaBlokKolumna: { flexShrink: 0 },
    liczbaKolumna: { ...typografia.liczbaKolumny, color: k.grafit },
    przyciski: { flexDirection: 'row', alignItems: 'center', gap: odstep.m, flexGrow: 1, justifyContent: 'flex-end' },
    przyciskiKolumna: { flexGrow: 1, flexShrink: 1, flexBasis: 0, flexDirection: 'column-reverse', gap: odstep.m },
    minus: { width: cel.przyciskMinusPaska, height: cel.przyciskMinusPaska, borderRadius: promien.przyciskDrugi, borderWidth: 2, borderColor: k.drugiPrzyciskObrys, alignItems: 'center', justifyContent: 'center' },
    minusTekst: { ...typografia.przycisk, color: k.grafit },
    plus: { minHeight: cel.przyciskPlusPaskaWysokosc, minWidth: cel.przyciskPlusPaskaSzerokosc, flexGrow: 1, borderRadius: promien.przyciskGlowny, backgroundColor: k.przyciskTlo, borderWidth: 2, borderColor: k.przyciskObrys, alignItems: 'center', justifyContent: 'center', padding: odstep.m },
    plusKolumna: { flexGrow: 1, flexShrink: 1, flexBasis: 0 },
    plusTekst: { ...typografia.przycisk, color: k.przyciskTekst },
  });
}
