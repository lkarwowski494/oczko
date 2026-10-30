// Arkusz „Nie dodano rzędu” przy limicie dni (BR-ZAK-006, KP-13) — wydzielony z Licznik.tsx (limit rozmiaru pliku, granice ROZMIAR; partia 6).
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LIMIT_DNI_W_MIESIACU } from '../konfiguracja';
import type { StanEkranuLicznika } from './LicznikTypy';
import type { Style } from './LicznikStyl';
import type { Tlumacz } from './wspolne';

export function ArkuszLimitu(p: { n: number; s: StanEkranuLicznika; t: Tlumacz; st: Style; naOferty(): void; naZamknij(): void }) {
  const { t, st, s } = p;
  return (
    <View style={st.arkusz} accessibilityViewIsModal>
      <Text style={st.tytul} accessibilityRole="header" accessibilityLabel={t('limit.nie_dodano', { n: p.n })}>{t('limit.nie_dodano', { n: p.n })}</Text>
      <Text style={st.tresc}>{t('limit.arkusz_dni', { count: LIMIT_DNI_W_MIESIACU, limit: LIMIT_DNI_W_MIESIACU, miesiac: s.miesiac.nazwa, data: s.miesiac.wznowienie })}</Text>
      <Text style={st.tresc}>{t('limit.arkusz_zachowane', { count: s.miesiac.rzedyDanych })}</Text>
      <Text style={st.podpis}>{t('limit.arkusz_pro')}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={t('limit.zobacz_pro')} onPress={p.naOferty} style={st.plus}>
        <Text style={st.plusTekst}>{t('limit.zobacz_pro')}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={t('wspolne.nie_teraz')} onPress={p.naZamknij} style={st.drugiPrzycisk}>
        <Text style={[st.tresc, st.pogrubiony]}>{t('wspolne.nie_teraz')}</Text>
      </Pressable>
    </View>
  );
}
