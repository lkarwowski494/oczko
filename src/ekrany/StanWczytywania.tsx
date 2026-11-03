// Stan ekranu do czasu pierwszego odczytu (E2-137-A1): „Loading…” albo błąd odczytu z „Try again”. Zamiast pustej planszy bez testID i bez wyjścia.
// Tylko istniejące elementy systemu: podpis jak `Tresc podpis` („Loading plans…” na ofertach), przycisk `Przycisk` z Arkusz, kolory i odstępy z motywu.
// Tło = tło treści trasy po wczytaniu (M1-089, 04-studio-projektowe-503; design-spec aneks M2 p2 „Tło StanWczytywania”): papier, arkusz albo czerń `systemCzarny`.
// „Try again” to przycisk wypełniony (`przyciskTlo` / `przyciskObrys` / `przyciskTekst`, na czerni z `systemCzarny`) w jednej formie na każdym tle (M1-119, 04-studio-projektowe-516).
import React from 'react';
import { Text, View } from 'react-native';
import { Przycisk, style } from './Arkusz';
import { odstep, systemCzarny, useKolory } from './motyw';
import type { Tlumacz } from './wspolne';

export type PropsStanuWczytywania = {
  stan: 'ladowanie' | 'blad';
  t: Tlumacz;
  /** Przedrostek testID: `<przedrostek>-ladowanie`, `<przedrostek>-blad`, `<przedrostek>-ponow`. */
  przedrostek: string;
  naPonow(): void;
  /** Tło treści trasy po wczytaniu: `arkusz` dla tras `presentation: 'modal'`, `czarne` dla podglądu zdjęć; domyślnie `papier`. */
  tlo?: 'papier' | 'arkusz' | 'czarne';
};

export function StanWczytywania({ stan, t, przedrostek, naPonow, tlo = 'papier' }: PropsStanuWczytywania): React.ReactElement {
  const k = useKolory();
  const czarne = tlo === 'czarne';
  // Na czerni podpis z `systemCzarny.olowek` (podpis motywu jasnego na czerni ma 3,43:1 < 4,5).
  const podpis = [style(k).podpis, czarne && { color: systemCzarny.olowek }];
  return (
    <View style={{ flex: 1, backgroundColor: czarne ? systemCzarny.tlo : tlo === 'arkusz' ? k.arkusz : k.papier, justifyContent: 'center', alignItems: 'center', padding: odstep.xl, gap: odstep.m }} testID={`${przedrostek}-${stan}`}>
      {stan === 'ladowanie'
        ? <Text style={podpis}>{t('wspolne.ladowanie')}</Text>
        : (
          <>
            <Text style={podpis}>{t('wspolne.blad_wczytania')}</Text>
            <Przycisk tekst={t('wspolne.ponow')} onPress={naPonow} testID={`${przedrostek}-ponow`} rodzaj="glowny" naCzarnym={czarne} />
          </>
        )}
    </View>
  );
}
