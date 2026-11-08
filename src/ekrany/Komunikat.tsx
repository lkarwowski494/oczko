// Komunikaty błędu w arkuszach (wydzielone z Arkusz.tsx: limit rozmiaru pliku; eksportowane też z Arkusz.tsx).
import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import tokeny from '../../docs/design/tokeny.json';
import { odstep, PROG_KATEGORII_DOSTEPNOSCI, typografia, typografiaDzianiny, useKolory, type Kolory } from './motyw';
import type { Tlumacz } from './wspolne';

const ark = tokeny.arkusz;
const kolor = (k: Kolory, nazwa: string) => (k as unknown as Record<string, string>)[nazwa]!;

/**
 * Komunikat błędu; `znak` dodaje „!” w kółku przed zdaniem (makieta `formularz-czesc`: błąd tekstem i znakiem, nie samym kolorem; `arkusz.blad`, bez czerwieni).
 * VoiceOver czyta samo zdanie (etykieta alertu), znak jest ozdobny i ukryty.
 */
export function Komunikat({ tekst, znak }: { tekst: string; znak?: boolean }): React.ReactElement {
  const st = style(useKolory());
  const duzy = useWindowDimensions().fontScale >= PROG_KATEGORII_DOSTEPNOSCI;
  if (!znak) return <Text style={st.blad} accessibilityRole="alert" accessibilityLiveRegion="assertive">{tekst}</Text>;
  const r = duzy ? ark.blad.znakRozmiarAx5 : ark.blad.znakRozmiar;
  return (
    <View accessible accessibilityRole="alert" accessibilityLiveRegion="assertive" accessibilityLabel={tekst} style={st.bladWiersz}>
      <View testID="komunikat-znak" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[st.bladZnak, { width: r, height: r, borderRadius: r / 2 }]}>
        <Text style={st.bladZnakTekst} maxFontSizeMultiplier={ark.blad.znakRozmiarAx5 / ark.blad.znakRozmiar}>!</Text>
      </View>
      <Text style={[st.blad, st.rosnie]}>{tekst}</Text>
    </View>
  );
}
/** Błąd zapisu w formularzu poza licznikiem i wzorem (Aneks P2 poz. 5): tytuł mówi, co się nie udało, druga linia wspólna; arkusz zostaje z wpisanymi wartościami. */
export function KomunikatZapisu({ t }: { t: Tlumacz }): React.ReactElement {
  const st = style(useKolory());
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="assertive" style={{ gap: odstep.s }}>
      <Text style={st.blad}>{t('formularz.blad_zapisu')}</Text>
      <Text style={st.podpis}>{t('wspolne.blad_zapisu_opis')}</Text>
    </View>
  );
}

function style(k: Kolory) {
  return StyleSheet.create({
    rosnie: { flexShrink: 1, flexGrow: 1 },
    podpis: { ...typografia.podpis, color: k.tekst2 },
    blad: { ...typografia.tresc, color: kolor(k, ark.blad.kolor) },
    bladWiersz: { flexDirection: 'row', alignItems: 'flex-start', columnGap: odstep.s },
    bladZnak: { borderWidth: 2, borderColor: kolor(k, ark.blad.znakObrys), alignItems: 'center', justifyContent: 'center' },
    bladZnakTekst: { ...typografiaDzianiny.mala, fontWeight: '800', color: kolor(k, ark.blad.kolor) },
  });
}
