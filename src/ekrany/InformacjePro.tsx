// Okno „Uczciwe zasady” (P-089 (3a), KP-16; design-spec „Okno «Uczciwe zasady»”). Kiedy pokazać: domena `oknoUczciweZasady` (src/domena/limit.ts).
// Karta planów Pro po imporcie: poza 1.0 (F-29, P-113 Q2a, P-117 Q1a, P-118 I1). Sygnatura: propozycja 07 (E3), granice 05 (Z07-22).
// Główny przycisk zamyka; plany tylko jako link (R-120); każde zamknięcie ustawia „widziane” (wołający, jak Trening `markFairRulesSeen`).
import React from 'react';
import { View } from 'react-native';
import { LIMIT_DNI_W_MIESIACU } from '../konfiguracja';
import { Arkusz, Przycisk, Tresc } from './Arkusz';
import type { Tlumacz } from './wspolne';

export type PropsOknaUczciweZasady = {
  t: Tlumacz;
  naZamknij(): void;      // główny przycisk zamyka okno
  naPlany(): void;        // link prowadzi do planów Pro (ekran ofert)
};
export function OknoUczciweZasady({ t, naZamknij, naPlany }: PropsOknaUczciweZasady): React.ReactElement {
  return (
    <View style={{ flex: 1 }} accessibilityViewIsModal testID="okno-uczciwe-zasady">
      <Arkusz tytul={t('uczciwe.tytul')} przyciski={
        <>
          <Przycisk tekst={t('uczciwe.dalej')} onPress={naZamknij} rodzaj="glowny" testID="uczciwe-zasady-zamknij" />
          <Przycisk tekst={t('uczciwe.plany')} onPress={naPlany} rodzaj="tekstowy" rola="link" testID="uczciwe-zasady-plany-pro" />
        </>
      }>
        <Tresc>{t('uczciwe.wszystko')}</Tresc>
        <Tresc>{t('uczciwe.darmowe', { count: LIMIT_DNI_W_MIESIACU })}</Tresc>
        <Tresc>{t('uczciwe.pro')}</Tresc>
      </Arkusz>
    </View>
  );
}
