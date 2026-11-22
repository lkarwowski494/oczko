// Ekran „Źródła wiedzy” (BR-KAL-008, ZM-04, P-108, P-112, P-126 (5); design-spec „Ekran «Źródła wiedzy»”): jedno ogólne zdanie i linia
// źródła wymagana warunkami użycia organizacji standardów, stylem podpisu (ołówek). Nic więcej; linia nie jest odnośnikiem; działa bez sieci.
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { MAX_SKALA_TYTULOWA, odstep, typografia, useKolory } from './motyw';
import type { Tlumacz } from './wspolne';
import { Wstecz } from './Pasek';

export function ZrodlaWiedzy({ t, naWstecz }: { t: Tlumacz; naWstecz?(): void }): React.ReactElement {
  const k = useKolory();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: k.tlo }} contentContainerStyle={{ padding: odstep.l, gap: odstep.l }} testID="zrodla-wiedzy">
      {naWstecz && <Wstecz tekst={t('wspolne.wstecz')} onPress={naWstecz} />}
      <Text style={{ ...typografia.tytul, color: k.tekst }} accessibilityRole="header" maxFontSizeMultiplier={MAX_SKALA_TYTULOWA}>{t('ustawienia.zrodla_wiedzy')}</Text>
      <Text style={{ ...typografia.tresc, color: k.tekst }}>{t('zrodla.zdanie')}</Text>
      <Text style={{ ...typografia.podpis, color: k.tekst2 }}>{t('zrodla.linia_standardow')}</Text>
    </ScrollView>
  );
}
