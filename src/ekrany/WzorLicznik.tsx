// Licznik przeglądarki wzoru: pasek pod wzorem albo kolumna obok (design-spec „Wzór, rysik i iPad” W1a, W3, W4b; te same testID co ekran licznika).
// Wydzielone bez zmian z WzorPrzegladarka.tsx (limit rozmiaru pliku, P-364); stan błędu zapisu i wywołania +1/−1 zostają w ekranie.
import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Liczba } from './Liczba';
import { MAX_SKALA_MINUSA, MAX_SKALA_TYTULOWA, PROG_KATEGORII_DOSTEPNOSCI, cel, odstep, promien, typografia, typografiaDzianiny, useKolory, type Kolory } from './motyw';
import tokeny from '../../docs/design/tokeny.json';
import type { Tlumacz } from './wspolne';
import { paneleE2e } from '../platforma/tryb-e2e';

/** M1-audytor-generalny-203 (SYS-01): `limit` i `zablokowany` to nie błąd zapisu — tekst jak na liczniku (`skutekPlus`), `true` = błąd zapisu. */
export type BladPaska = boolean | 'limit' | 'zablokowany';

export type PropsLicznikaWzoru = {
  t: Tlumacz;
  licznik: { liczba: number; dziergany: number; znaczenie: 'skonczone' | 'w_trakcie'; cel?: number | null }; // cel części: „of {cel}” w kolumnie iPada (015)
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
  const okno = useWindowDimensions();
  const duzyTekst = okno.fontScale >= PROG_KATEGORII_DOSTEPNOSCI && !obok;
  // 015 (P-614 (3) A, `ipad.html`): kolumna iPada (okno ≥ kolumnaOdSzerokosci, szersze niż wyższe) — liczba `liczbaKarty`, −1 obok „+1” 168–240 pt.
  const ipad = obok && okno.width >= PW.kolumnaOdSzerokosci && okno.width > okno.height;
  const krojLiczby = ipad ? tokeny.typografia.liczbaKarty : tokeny.typografia.liczbaPaskaWzoru;
  const celCzesci = p.licznik.cel ?? null;
  // 024 diagnoza (P-629): tylko build E2E — ramki kolumny do `e2e-ramki-kolumny` (scen. 44). `paneleE2e` jest stałą procesu, więc hak wołany zawsze albo nigdy;
  // nie zależy od `obok` (obrót zmienia `obok` → „Rendered more hooks”, run 42678725514). Mierzy tylko kolumnę; zmiana `obok` zeruje pomiary.
  const ramki = paneleE2e ? paneleE2e.useRamkiE2e(RAMKI_KOLUMNY, okno, obok ? 'kolumna' : 'pasek') : null;
  const z = (n: string) => (obok ? ramki?.zmierz[n] : undefined);
  const blok = (
    <View style={ipad ? st.kartaLiczbyIpad : obok ? st.liczbaBlokKolumna : duzyTekst ? st.liczbaBlokAx : st.liczbaBlok} testID="wzor-liczba-blok" onLayout={z('blok')}>
      <Liczba wartosc={String(p.licznik.liczba)} styl={ipad ? st.liczbaIpad : st.liczba} pt={krojLiczby.pt} jezyk={p.jezyk} maxFontSizeMultiplier={krojLiczby.maxSkala} testID="licznik-wartosc" />
      {p.licznik.znaczenie !== 'w_trakcie'
        ? <Text style={st.podpis} testID="licznik-teraz-rzad">{t('licznik.teraz', { n: p.licznik.dziergany })}</Text>
        : <Text style={st.podpis} testID="licznik-podpis">{t('licznik.jednostka_w_trakcie')}</Text>}{/* P2-5b, P-373: jak Licznik.tsx */}
      {ipad && celCzesci !== null && <Text style={st.podpis2} testID="licznik-z-celu">{t('licznik.z_celu', { cel: celCzesci })}</Text>}
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
    <Pressable accessibilityRole="button" accessibilityLabel={t('licznik.minus_a11y')} onPress={p.naMinus} style={[st.minus, ipad && st.minusIpad]} testID="licznik-minus" onLayout={z('minus')}>
      <Text style={st.minusTekst} maxFontSizeMultiplier={MAX_SKALA_MINUSA}>{t('licznik.minus')}</Text>
    </Pressable>
  );
  const plus = (
    <Pressable accessibilityRole="button" accessibilityLabel={t('licznik.plus_a11y', { n: p.licznik.dziergany })} onPress={p.naPlus} style={[st.plus, obok ? st.plusKolumna : st.plusPasek, ipad && st.plusIpad]} testID="licznik-plus" onLayout={z('plus')}>
      <Text style={st.plusTekst} maxFontSizeMultiplier={tokeny.typografia.przyciskPlus.maxSkala}>{t('licznik.plus')}</Text>{/* M1-205: limity jak Licznik.tsx (P-277) */}
    </Pressable>
  );
  if (obok) {
    return (
      <View style={[st.kolumna, ipad && st.kolumnaIpad, { width: p.szerokoscKolumny ?? undefined }]} testID="wzor-kolumna-licznika" onLayout={z('kolumna')}>
        {blok}
        {komunikaty}
        <View style={ipad ? st.przyciskiIpad : st.przyciskiKolumna} testID="wzor-kolumna-przyciski" onLayout={z('przyciski')}>{minus}{plus}</View>
        {ramki && paneleE2e && <paneleE2e.TekstRamek tekst={ramki.tekst} />}
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

const PW = tokeny.cele.paskaWzoru;
const RAMKI_KOLUMNY = ['kolumna', 'blok', 'przyciski', 'minus', 'plus'] as const; // 024 diagnoza (build E2E)

function style(k: Kolory) {
  return StyleSheet.create({
    tresc: { ...typografia.tresc, color: k.tekst },
    link: { textDecorationLine: 'underline' }, // jak LicznikStyl (odnośnik limitu)
    linkCel: { minHeight: cel.minimum, justifyContent: 'center' }, // cel dotyku odnośnika ≥ 44 pt (04-001, SP-10)
    limit: { alignSelf: 'stretch' },
    podpis: { ...typografia.podpis, color: k.tekst, textAlign: 'center' },
    // Pasek (ekran `wzor` makiety): tło `pasek`, linia `pasekLinia` (kolory z tokenów, nie papier); jeden rząd −1 / rząd / +1, od AX1 kolumna: liczba nad przyciskami.
    pasekLicznika: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: k.pasekLinia, paddingHorizontal: odstep.l, paddingVertical: odstep.s, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: odstep.s, backgroundColor: k.pasek },
    pasekAx: { flexDirection: 'column', alignItems: 'stretch', flexWrap: 'nowrap' },
    liczbaBlok: { flexShrink: 1, flexGrow: 1, flexBasis: 0, alignItems: 'center' },
    liczbaBlokAx: { alignItems: 'center', alignSelf: 'stretch' },
    liczba: { ...typografia.liczbaPaska, color: k.tekst }, // pasek licznika: `liczbaPaskaWzoru` 28 pt, cyfry w komórkach (Liczba)
    // Kolumna (W3, W4b): liczba nigdy ściśnięta; +1 bierze resztę z jawną podstawą 0 — na urządzeniu blok liczby wyszedł 0 pt, a −1
    // poza kolumną (P-262 (b), przebieg 119, scen. 23 i 44; przyczyna w Yoga nieodtworzona poza urządzeniem).
    liczbaBlokKolumna: { flexShrink: 0 },
    kolumna: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: k.pasekLinia, padding: odstep.l, gap: odstep.m, backgroundColor: k.pasek },
    // M3-IPAD-01 (P-605): `width: 100%` — grupa leży w pasku-wierszu z zawijaniem; bez szerokości zwija się do zawartości i blok liczby (podstawa 0) ma 0 pt, „+1” 64 pt.
    przyciski: { flexDirection: 'row', alignItems: 'center', gap: odstep.s, alignSelf: 'center', width: '100%', maxWidth: PW.plusMaxSzerokosc + 2 * cel.przyciskMinus + 2 * odstep.s },
    przyciskiKolumna: { flexGrow: 1, flexShrink: 1, flexBasis: 0, flexDirection: 'column-reverse', gap: odstep.m },
    minus: { minWidth: cel.przyciskMinusPaska, minHeight: cel.przyciskPlusPaskaWysokosc, borderRadius: promien.przyciskDrugi, borderWidth: 2, borderColor: k.tekst2, alignItems: 'center', justifyContent: 'center' },
    minusTekst: { ...typografia.przycisk, color: k.tekst },
    plus: { minHeight: cel.przyciskPlusPaskaWysokosc, minWidth: cel.przyciskPlusPaskaSzerokosc, flexGrow: 1, flexShrink: 1, flexBasis: 0, borderRadius: promien.przyciskGlowny, backgroundColor: k.akcent, alignItems: 'center', justifyContent: 'center', padding: odstep.m },
    plusKolumna: { flexGrow: 1, flexShrink: 1, flexBasis: 0 },
    plusTekst: { ...typografia.przycisk, color: k.naAkcencie },
    // 015 (`cele.paskaWzoru`, `ipad.html`): pasek — „+1” najwyżej 480 pt, zestaw −1 / rząd / +1 wyśrodkowany (480 + 2 × 72 + 2 odstępy); kolumna iPada — −1 72 obok „+1” 168–240.
    liczbaIpad: { ...typografiaDzianiny.liczbaKarty, color: k.tekst },
    podpis2: { ...typografia.podpis, color: k.tekst2, textAlign: 'center' },
    plusPasek: { maxWidth: PW.plusMaxSzerokosc },
    // 024 runda 2 ramek (run 42686026279): wypełniacz `flex: 1` dostał 992 pt w kolumnie 972 pt i zepchnął parę pod ekran (y 1144) — para u dołu przez
    // automatyczny margines: bierze tylko wolne miejsce, bez wolnego staje pod liczbą (widoczna).
    przyciskiIpad: { flexDirection: 'row', alignItems: 'flex-end', gap: odstep.m, flexShrink: 0, marginTop: 'auto' },
    minusIpad: { width: cel.przyciskMinus, minHeight: cel.przyciskMinus, borderRadius: promien.minus },
    // 024 (P-627, regresja 015): na urządzeniu para −1/„+1” nie pojawiła się w kolumnie (scen. 44) — rozmiary jawne, bez rozciągania: „+1” `plusWysokosc` 200
    // (w granicach 168–240), para się nie kurczy; karta liczby `.nr` (tło `pasek`, promień `karta`), kolumna bez tła — rama wzoru jak makieta `ipad.html:21–25`.
    plusIpad: { minHeight: PW.kolumna.plusMinWysokosc, maxHeight: PW.kolumna.plusMaxWysokosc, height: PW.kolumna.plusWysokosc, flexBasis: 'auto', alignSelf: 'flex-end' },
    kolumnaIpad: { backgroundColor: k.wzorRama, borderLeftWidth: 0 },
    kartaLiczbyIpad: { flexShrink: 0, backgroundColor: k.pasek, borderRadius: promien.karta, padding: odstep.l, alignItems: 'center', gap: odstep.xs },
  });
}
