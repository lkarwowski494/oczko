// Linijka celu części na liczniku („Goal 96 rows · 49 to go”, „Next part”; design-spec.md:24, BR-LIC-011/S1) — wydzielona z Licznik.tsx (P-268, plan-prac 1.6).
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { StanEkranuLicznika } from './LicznikTypy';
import type { Style } from './LicznikStyl';
import { MAX_SKALA_TYTULOWA } from './motyw';
import type { Tlumacz } from './wspolne';

/** Cel części osiągnięty (te same warunki co dawniej przy przycisku w treści: F-52/ZM-13). */
export const celOsiagniety = (s: StanEkranuLicznika): boolean => s.cel !== null && s.cel - s.skonczone <= 0;

export function LinijkaCelu({ s, t, st }: { s: StanEkranuLicznika; t: Tlumacz; st: Style }) {
  const c = s.cel ?? 0;
  const zostalo = c - s.skonczone;
  return (
    <View style={st.linijka}>
      <Text style={st.podpis}>{t('licznik.cel', { count: c })}</Text>
      <Text style={st.podpis}>
        {zostalo > 0 ? t('licznik.do_celu', { count: zostalo }) : zostalo === 0 ? t('licznik.cel_osiagniety') : t('licznik.ponad_cel', { count: -zostalo })}
      </Text>
    </View>
  );
}

/** B3-03 (P-664): „Next part” w stałej strefie licznika (nad rzędem akcji, od AX3 nad −1/+1), nie w przewijanej treści — zawsze w pełni widoczny i osiągalny jednym stuknięciem. */
export function PrzyciskNastepnejCzesci({ t, st, duzyTekst, naNastepnaCzesc }: { t: Tlumacz; st: Style; duzyTekst: boolean; naNastepnaCzesc(): void }) {
  return (
    <View style={duzyTekst ? st.nastepnaCzescStrefaAx : st.nastepnaCzescStrefa}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('licznik.nastepna_czesc')} onPress={naNastepnaCzesc} style={st.drugiPrzycisk} testID="licznik-nastepna-czesc">
        <Text style={[st.tresc, st.pogrubiony]} maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{t('licznik.nastepna_czesc')}</Text>
      </Pressable>
    </View>
  );
}
