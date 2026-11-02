// Stan ekranu do czasu pierwszego odczytu (E2-137-A1): „Loading…” albo błąd odczytu z „Try again”. Zamiast pustej planszy bez testID i bez wyjścia.
// Tylko istniejące elementy systemu: podpis `Tresc podpis` jak „Loading plans…” na ofertach, przycisk `Przycisk` z Arkusz, kolory i odstępy z motywu.
import React from 'react';
import { View } from 'react-native';
import { Przycisk, Tresc } from './Arkusz';
import { odstep, useKolory } from './motyw';
import type { Tlumacz } from './wspolne';

export type PropsStanuWczytywania = {
  stan: 'ladowanie' | 'blad';
  t: Tlumacz;
  /** Przedrostek testID: `<przedrostek>-ladowanie`, `<przedrostek>-blad`, `<przedrostek>-ponow`. */
  przedrostek: string;
  naPonow(): void;
};

export function StanWczytywania({ stan, t, przedrostek, naPonow }: PropsStanuWczytywania): React.ReactElement {
  const k = useKolory();
  return (
    <View style={{ flex: 1, backgroundColor: k.papier, justifyContent: 'center', alignItems: 'center', padding: odstep.xl, gap: odstep.m }} testID={`${przedrostek}-${stan}`}>
      {stan === 'ladowanie'
        ? <Tresc podpis>{t('wspolne.ladowanie')}</Tresc>
        : (
          <>
            <Tresc podpis>{t('wspolne.blad_wczytania')}</Tresc>
            <Przycisk tekst={t('wspolne.ponow')} onPress={naPonow} testID={`${przedrostek}-ponow`} />
          </>
        )}
    </View>
  );
}
