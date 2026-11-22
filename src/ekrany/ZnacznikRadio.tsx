// Znacznik wyboru jednej opcji (wydzielony z Arkusz.tsx: limit rozmiaru pliku; eksportowany też z Arkusz.tsx).
import React from 'react';
import { useWindowDimensions, View } from 'react-native';
import tokeny from '../../docs/design/tokeny.json';
import { MAX_SKALA_TYTULOWA, PROG_KATEGORII_DOSTEPNOSCI, ROZMIAR_SYMBOLU_TRESCI, useKolory } from './motyw';
import { SymbolSf } from './SymbolSf';

const znaczniki = tokeny.znaczniki;

/**
 * Znacznik wyboru jednej opcji (M3-MAK-03, `znaczniki.radio`): kółko 28 pt (od AX1 40) z obwódką `tekst2`, wybrane wypełnione `przycisk` z ptaszkiem w `przyciskTekst` —
 * ten sam język wyboru co plany Oczko Pro. Dekoracyjny (ukryty przed VoiceOver): stan niesie `accessibilityState.selected` wiersza.
 */
export function ZnacznikRadio({ wybrany }: { wybrany: boolean }): React.ReactElement {
  const k = useKolory();
  const r = useWindowDimensions().fontScale >= PROG_KATEGORII_DOSTEPNOSCI ? znaczniki.radioAx5 : znaczniki.radio;
  return (
    <View testID="znacznik-radio" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={[{ width: r, height: r, borderRadius: r / 2, alignItems: 'center', justifyContent: 'center' }, wybrany ? { backgroundColor: k.przycisk } : { borderWidth: 2, borderColor: k.tekst2 }]}>
      {wybrany && <SymbolSf nazwa="checkmark" rozmiar={ROZMIAR_SYMBOLU_TRESCI} kolor={k.przyciskTekst} maxSkala={MAX_SKALA_TYTULOWA} waga="bold" />}
    </View>
  );
}


/**
 * Pole wyboru wielu opcji (011, P-619 B przyjęte P-627): kwadrat `znaczniki.poleWyboru` 28 pt (od AX1 `poleWyboruAx5` 40) z promieniem `znaczniki.poleWyboruPromien` 10 —
 * własne tokeny 04 (wartości jak dotychczasowe zastępcze). Ten sam język co `ZnacznikRadio`: puste z obwódką `tekst2`, zaznaczone wypełnione `przycisk` z `checkmark`
 * w `przyciskTekst`; kształt odróżnia je od koła radia. Dekoracyjne: stan niesie `accessibilityState.checked` wiersza.
 */
export function PoleWyboru({ zaznaczone }: { zaznaczone: boolean }): React.ReactElement {
  const k = useKolory();
  const r = useWindowDimensions().fontScale >= PROG_KATEGORII_DOSTEPNOSCI ? znaczniki.poleWyboruAx5 : znaczniki.poleWyboru;
  return (
    <View testID="pole-wyboru" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={[{ width: r, height: r, borderRadius: znaczniki.poleWyboruPromien, alignItems: 'center', justifyContent: 'center' }, zaznaczone ? { backgroundColor: k.przycisk } : { borderWidth: 2, borderColor: k.tekst2 }]}>
      {zaznaczone && <SymbolSf nazwa="checkmark" rozmiar={ROZMIAR_SYMBOLU_TRESCI} kolor={k.przyciskTekst} maxSkala={MAX_SKALA_TYTULOWA} waga="bold" />}
    </View>
  );
}
