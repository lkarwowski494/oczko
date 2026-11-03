// „Zgłoś problem” z podglądem diagnostyki (F-57, BR-DAN-010, ADR-0018, R-162, R-163). Ekran nienarysowany (Z07-05).
// Diagnostykę (bez treści projektów) składa przypadek użycia; ekran pokazuje całość przed wysyłką i oddaje ją tylko arkuszowi udostępniania.
import React from 'react';
import { Arkusz, Przycisk, Tresc } from './Arkusz';
import type { System, Tlumacz } from './wspolne';

export type PoleDiagnostyki = { pole: 'wersja' | 'system' | 'model' | 'jezyk' | 'synchronizacja' | 'zegarek' | 'bledy'; wartosc: string };
export type PropsZglosProblem = {
  stan: { diagnostyka: PoleDiagnostyki[] };
  t: Tlumacz;
  system: System;          // udostepnij: jedyna droga wyjścia (bez sieci w aplikacji)
  kontakt: string;         // adres wsparcia pokazany przed „Share” (M1-audytor-generalny-057); wysyłkę wybiera użytkownik w arkuszu
  naAnuluj(): void;
};
const ETYKIETA = { wersja: 'zglos.pole_wersja', system: 'zglos.pole_system', model: 'zglos.pole_model', jezyk: 'ustawienia.jezyk', synchronizacja: 'zglos.pole_synchronizacja', zegarek: 'zglos.pole_zegarek', bledy: 'zglos.pole_bledy' } as const;
export function ZglosProblem({ stan, t, system, kontakt, naAnuluj }: PropsZglosProblem): React.ReactElement {
  const wiersze = stan.diagnostyka.map((d) => `${t(ETYKIETA[d.pole])}: ${d.wartosc}`);
  return (
    <Arkusz tytul={t('zglos.tytul')} przyciski={
      <>
        <Przycisk tekst={t('zglos.udostepnij')} onPress={() => system.udostepnij({ nazwa: t('zglos.plik'), tresc: wiersze.join('\n') })} rodzaj="glowny" />
        <Przycisk tekst={t('wspolne.anuluj')} onPress={naAnuluj} rodzaj="tekstowy" testID="arkusz-zamknij" />
      </>
    }>
      <Tresc>{t('zglos.opis')}</Tresc>
      <Tresc testID="zglos-kontakt">{t('zglos.kontakt', { adres: kontakt })}</Tresc>
      {wiersze.map((w) => <Tresc key={w} podpis>{w}</Tresc>)}
    </Arkusz>
  );
}
