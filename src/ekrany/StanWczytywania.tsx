// Stan ekranu do czasu pierwszego odczytu (E2-137-A1): „Loading…” albo błąd odczytu z „Try again”. Zamiast pustej planszy bez testID i bez wyjścia.
// Tylko istniejące elementy systemu: podpis jak `Tresc podpis` („Loading plans…” na ofertach), przycisk `Przycisk` z Arkusz, kolory i odstępy z motywu.
// Tło = tło treści trasy po wczytaniu (M1-089, 04-studio-projektowe-503; design-spec aneks M2 p2 „Tło StanWczytywania”): papier, arkusz albo czerń `systemCzarny`.
// „Try again” to przycisk wypełniony (`przyciskTlo` / `przyciskObrys` / `przyciskTekst`, na czerni z `systemCzarny`) w jednej formie na każdym tle (M1-119, 04-studio-projektowe-516).
import React from 'react';
import { Text, View } from 'react-native';
import { Przycisk, style } from './Arkusz';
import { Wstecz } from './Pasek';
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
  /** Wyjście ze stanu błędu (M1-094, 04-studio-projektowe-502, DEC-26 a): `wstecz` — „Back” w pasku jak na ekranie po wczytaniu (trasy push);
   *  `zamknij` — „Close” pod „Try again” (arkusze i pełnoekranowe modale, gdzie gestu zamknięcia może nie być). */
  wyjscie?: { rodzaj: 'wstecz' | 'zamknij'; naWyjdz(): void };
};

export function StanWczytywania({ stan, t, przedrostek, naPonow, tlo = 'papier', wyjscie }: PropsStanuWczytywania): React.ReactElement {
  const k = useKolory();
  const czarne = tlo === 'czarne';
  // Na czerni podpis z `systemCzarny.olowek` (podpis motywu jasnego na czerni ma 3,43:1 < 4,5).
  const podpis = [style(k).podpis, czarne && { color: systemCzarny.olowek }];
  const blad = stan === 'blad';
  return (
    <View style={{ flex: 1, backgroundColor: czarne ? systemCzarny.tlo : tlo === 'arkusz' ? k.arkusz : k.papier }} testID={`${przedrostek}-${stan}`}>
      {blad && wyjscie?.rodzaj === 'wstecz' && (
        <View style={{ paddingHorizontal: odstep.l }}><Wstecz tekst={t('wspolne.wstecz')} onPress={wyjscie.naWyjdz} kolor={czarne ? systemCzarny.grafit : undefined} /></View>
      )}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: odstep.xl, gap: odstep.m }}>
        {!blad
          ? <Text style={podpis}>{t('wspolne.ladowanie')}</Text>
          : (
            <>
              <Text style={podpis}>{t('wspolne.blad_wczytania')}</Text>
              <Przycisk tekst={t('wspolne.ponow')} onPress={naPonow} testID={`${przedrostek}-ponow`} rodzaj="glowny" naCzarnym={czarne} />
              {wyjscie?.rodzaj === 'zamknij' && <Przycisk tekst={t('wspolne.zamknij')} onPress={wyjscie.naWyjdz} testID={`${przedrostek}-zamknij`} rodzaj="tekstowy" naCzarnym={czarne} />}
            </>
          )}
      </View>
    </View>
  );
}
