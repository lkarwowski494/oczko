// Arkusz „Delete all data” (BR-DAN-009, design-spec:776, :890, P-229, P-328): pytanie, kopia w Plikach, przełącznik „Also delete from iCloud” (tylko przy włączonej
// synchronizacji, domyślnie wyłączony), przycisk potwierdzenia na tle `blad`. Trasa `/usun-wszystko` (arkusz jak formularze) z paskiem
// przycisków `Arkusz` — przyciski zawsze widoczne (P-266 (3), scen. 51: blok w treści Ustawień wypadał poza obszar treści).
import React, { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Arkusz, Komunikat, Przycisk, Tresc } from './Arkusz';
import { cel, odstep, typografia, useKolory } from './motyw';
import type { Tlumacz } from './wspolne';

export type PropsUsunWszystko = { t: Tlumacz; icloudWlaczona: boolean; blad: boolean; naUsun(takzeZIcloud: boolean): void; naZamknij(): void };

export function ArkuszUsunWszystko(p: PropsUsunWszystko): React.ReactElement {
  const { t } = p;
  const k = useKolory();
  const [zIcloud, ustawZIcloud] = useState(false); // P-229: osobno, domyślnie wyłączony (ochrona danych)
  return (
    <Arkusz tytul={t('ustawienia.usun_wszystko')} testID="usun-wszystko-arkusz" przyciski={<>
      <Przycisk tekst={t('ustawienia.usun_potwierdz')} onPress={() => p.naUsun(p.icloudWlaczona && zIcloud)} rodzaj="niszczacy" testID="potwierdz-usun-wszystko" />
      <Przycisk tekst={t('wspolne.anuluj')} onPress={p.naZamknij} rodzaj="tekstowy" testID="usun-wszystko-anuluj" />
    </>}>
      <Tresc>{t('ustawienia.usun_pytanie')}</Tresc>
      <Tresc>{t('ustawienia.usun_kopia')}</Tresc>
      {p.icloudWlaczona && (
        <>
          <View style={st.wiersz}>
            <Text style={{ ...typografia.tresc, color: k.grafit, flex: 1 }} importantForAccessibility="no" accessibilityElementsHidden>{t('icloud.usun_z_icloud')}</Text>
            <Switch accessibilityRole="switch" accessibilityLabel={t('icloud.usun_z_icloud')} accessibilityState={{ checked: zIcloud }} value={zIcloud} onValueChange={ustawZIcloud} testID="usun-z-icloud" />
          </View>
          <Tresc podpis>{t('icloud.usun_z_icloud_opis')}</Tresc>
          {!zIcloud && <Tresc podpis>{t('icloud.usun_zostaje')}</Tresc>}
        </>
      )}
      {p.blad && <Komunikat tekst={t('dane.blad')} znak />}
    </Arkusz>
  );
}

const st = StyleSheet.create({
  wiersz: { flexDirection: 'row', alignItems: 'center', gap: odstep.m, minHeight: cel.minimum },
});
