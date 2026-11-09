// Licznik przeglądarki wzoru: pasek pod wzorem albo kolumna obok (design-spec „Wzór, rysik i iPad” W1a, W3, W4b; te same testID co ekran licznika).
// Wydzielone bez zmian z WzorPrzegladarka.tsx (limit rozmiaru pliku, P-364); stan błędu zapisu i wywołania +1/−1 zostają w ekranie.
import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Liczba } from './Liczba';
import { MAX_SKALA_MINUSA, MAX_SKALA_TYTULOWA, PROG_KATEGORII_DOSTEPNOSCI, cel, odstep, promien, typografia, useKolory, type Kolory } from './motyw';
import tokeny from '../../docs/design/tokeny.json';
import type { Tlumacz } from './wspolne';

/** M1-audytor-generalny-203 (SYS-01): `limit` i `zablokowany` to nie błąd zapisu — tekst jak na liczniku (`skutekPlus`), `true` = błąd zapisu. */
export type BladPaska = boolean | 'limit' | 'zablokowany';

export type PropsLicznikaWzoru = {
  t: Tlumacz;
  licznik: { liczba: number; dziergany: number; znaczenie: 'skonczone' | 'w_trakcie' };
  obok: boolean;                       // kolumna obok wzoru (W3, W4b) zamiast paska pod wzorem
  szerokoscKolumny?: number | null;    // pt, tylko przy `obok`
  blad: BladPaska;                     // wynik +1/−1 nie-ok: alert pod liczbą (true = błąd zapisu)
  jezyk?: string;                      // kod języka aplikacji: języki z krojem systemowym liczą bez komórek (Liczba)
  naOferty?(): void;                   // odnośnik limitu (KP-13)
  naPlus(): void;
  naMinus(): void;
};

/** M1-004: tekst błędu zapisu paska — ten sam w alercie pod liczbą i w ogłoszeniu VoiceOver, które gra trasa (`app/wzor.tsx`). */
export const tekstBleduZapisu = (t: Tlumacz): string => t('licznik.blad_zapisu');

export function LicznikWzoru(p: PropsLicznikaWzoru): React.ReactElement {
  const { t, obok } = p;
  const k = useKolory();
  const st = style(k);
  // Granica Dynamic Type (design-spec „Wzór”, pasek −1 / rząd / +1): od AX1 liczba stoi nad rzędem −1 / +1 (04-003, jak próg licznika).
  const duzyTekst = useWindowDimensions().fontScale >= PROG_KATEGORII_DOSTEPNOSCI && !obok;
  const krojLiczby = tokeny.typografia.liczbaPaskaWzoru;
  const blok = (
    <View style={obok ? st.liczbaBlokKolumna : duzyTekst ? st.liczbaBlokAx : st.liczbaBlok} testID="wzor-liczba-blok">
      <Liczba wartosc={String(p.licznik.liczba)} styl={st.liczba} pt={krojLiczby.pt} jezyk={p.jezyk} maxFontSizeMultiplier={krojLiczby.maxSkala} testID="licznik-wartosc" />
      {p.licznik.znaczenie !== 'w_trakcie'
        ? <Text style={st.podpis} testID="licznik-teraz-rzad">{t('licznik.teraz', { n: p.licznik.dziergany })}</Text>
        : <Text style={st.podpis} testID="licznik-podpis">{t('licznik.jednostka_w_trakcie')}</Text>}{/* P2-5b, P-373: jak Licznik.tsx */}
    </View>
  );
  const komunikaty = (
    <>
      {p.blad === true && <Text style={st.tresc} accessibilityRole="alert" testID="blad-zapisu">{tekstBleduZapisu(t)}</Text>}
      {p.blad === 'zablokowany' && <Text style={st.tresc} accessibilityRole="alert">{t('licznik.zablokowany_stukniecie')}</Text>}
      {p.blad === 'limit' && (
        <View testID="limit-pasek" style={st.limit}>
          <Text style={st.tresc}>{t('limit.nie_dodano', { n: p.licznik.dziergany })}</Text>
          <Pressable accessibilityRole="link" accessibilityLabel={t('limit.pro_link')} onPress={p.naOferty} style={st.linkCel} testID="limit-oferta-link">
            <Text style={[st.tresc, st.link]}>{t('limit.pro_link')}</Text>
          </Pressable>
        </View>
      )}
    </>
  );
  const minus = (
    <Pressable accessibilityRole="button" accessibilityLabel={t('licznik.minus_a11y')} onPress={p.naMinus} style={st.minus} testID="licznik-minus">
      <Text style={st.minusTekst} maxFontSizeMultiplier={MAX_SKALA_MINUSA}>{t('licznik.minus')}</Text>
    </Pressable>
  );
  const plus = (
    <Pressable accessibilityRole="button" accessibilityLabel={t('licznik.plus_a11y', { n: p.licznik.dziergany })} onPress={p.naPlus} style={[st.plus, obok && st.plusKolumna]} testID="licznik-plus">
      <Text style={st.plusTekst} maxFontSizeMultiplier={tokeny.typografia.przyciskPlus.maxSkala}>{t('licznik.plus')}</Text>{/* M1-205: limity jak Licznik.tsx (P-277) */}
    </Pressable>
  );
  if (obok) {
    return (
      <View style={[st.kolumna, { width: p.szerokoscKolumny ?? undefined }]} testID="wzor-kolumna-licznika">
        {blok}
        {komunikaty}
        <View style={st.przyciskiKolumna}>{minus}{plus}</View>
      </View>
    );
  }
  return (
    <View style={[st.pasekLicznika, duzyTekst && st.pasekAx]} testID="wzor-pasek-licznika">
      {duzyTekst && blok}
      {komunikaty}
      <View style={st.przyciski} testID="wzor-pasek-przyciski">
        {minus}
        {!duzyTekst && blok}
        {plus}
      </View>
    </View>
  );
}

function style(k: Kolory) {
  return StyleSheet.create({
    tresc: { ...typografia.tresc, color: k.tekst },
    link: { textDecorationLine: 'underline' }, // jak LicznikStyl (odnośnik limitu)
    linkCel: { minHeight: cel.minimum, justifyContent: 'center' }, // cel dotyku odnośnika ≥ 44 pt (04-001, SP-10)
    limit: { alignSelf: 'stretch' },
    podpis: { ...typografia.podpis, color: k.tekst, textAlign: 'center' },
    // Pasek (ekran `wzor` makiety): tło `pasek`, linia `pasekLinia` (kolory z tokenów, nie papier); jeden rząd −1 / rząd / +1, od AX1 kolumna: liczba nad przyciskami.
    pasekLicznika: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: k.pasekLinia, paddingHorizontal: odstep.l, paddingVertical: odstep.s, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: odstep.s, backgroundColor: k.pasek },
    pasekAx: { flexDirection: 'column', alignItems: 'stretch', flexWrap: 'nowrap' },
    liczbaBlok: { flexShrink: 1, flexGrow: 1, flexBasis: 0, alignItems: 'center' },
    liczbaBlokAx: { alignItems: 'center', alignSelf: 'stretch' },
    liczba: { ...typografia.liczbaPaska, color: k.tekst }, // pasek licznika: `liczbaPaskaWzoru` 28 pt, cyfry w komórkach (Liczba)
    // Kolumna (W3, W4b): liczba nigdy ściśnięta; +1 bierze resztę z jawną podstawą 0 — na urządzeniu blok liczby wyszedł 0 pt, a −1
    // poza kolumną (P-262 (b), przebieg 119, scen. 23 i 44; przyczyna w Yoga nieodtworzona poza urządzeniem).
    liczbaBlokKolumna: { flexShrink: 0 },
    kolumna: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: k.pasekLinia, padding: odstep.l, gap: odstep.m, backgroundColor: k.pasek },
    // M3-IPAD-01 (P-605): `width: 100%` — grupa leży w pasku-wierszu z zawijaniem; bez szerokości zwija się do zawartości i blok liczby (podstawa 0) ma 0 pt, „+1” 64 pt.
    przyciski: { flexDirection: 'row', alignItems: 'center', gap: odstep.s, alignSelf: 'stretch', width: '100%' },
    przyciskiKolumna: { flexGrow: 1, flexShrink: 1, flexBasis: 0, flexDirection: 'column-reverse', gap: odstep.m },
    minus: { minWidth: cel.przyciskMinusPaska, minHeight: cel.przyciskPlusPaskaWysokosc, borderRadius: promien.przyciskDrugi, borderWidth: 2, borderColor: k.tekst2, alignItems: 'center', justifyContent: 'center' },
    minusTekst: { ...typografia.przycisk, color: k.tekst },
    plus: { minHeight: cel.przyciskPlusPaskaWysokosc, minWidth: cel.przyciskPlusPaskaSzerokosc, flexGrow: 1, flexShrink: 1, flexBasis: 0, borderRadius: promien.przyciskGlowny, backgroundColor: k.akcent, alignItems: 'center', justifyContent: 'center', padding: odstep.m },
    plusKolumna: { flexGrow: 1, flexShrink: 1, flexBasis: 0 },
    plusTekst: { ...typografia.przycisk, color: k.naAkcencie },
  });
}
