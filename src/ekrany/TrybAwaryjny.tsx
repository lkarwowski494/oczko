// Ekran trybu awaryjnego (ADR-0019; R-079): „Zapisz kopię danych”, „Spróbuj normalnie”, „Zgłoś problem”. Ekranu nie narysowano (Z07-05).
// W tym trybie ekran nie dostaje żadnego portu zapisu do bazy (ADR-0019: „nic nie zmienia danych”). Sygnatura: propozycja 07, granice 05 (Z07-22).
import React from 'react';
import { Arkusz, Przycisk, Tresc } from './Arkusz';
import type { Tlumacz } from './wspolne';

export type PowodTrybuAwaryjnego = 'petla-startow' | 'wersja_nowsza' | 'uszkodzony' | 'brak_miejsca';
export type PropsTrybuAwaryjnego = {
  stan: { powod: PowodTrybuAwaryjnego; licznosciKopii?: string | null };
  t: Tlumacz;
  naZapiszKopie(): void;
  naSprobujNormalnie(): void;
  naZglosProblem(): void;
  /** Panel buildu E2E (`e2e-sha-bazy`, bez t()); w buildzie wydania brak. */
  panelE2e?: React.ReactNode;
};
const TYTUL = { 'petla-startow': 'awaryjny.tytul_petla', wersja_nowsza: 'awaryjny.tytul_nowsza', uszkodzony: 'awaryjny.tytul_uszkodzony', brak_miejsca: 'awaryjny.tytul_brak_miejsca' } as const; // M1-011: brak miejsca to nie uszkodzenie; M1-094 (DEC-26 a): własny nagłówek
export function TrybAwaryjny({ stan, t, naZapiszKopie, naSprobujNormalnie, naZglosProblem, panelE2e }: PropsTrybuAwaryjnego): React.ReactElement {
  // Brak miejsca (M1-094, 04-studio-projektowe-504): kopia zwykle się nie zmieści, więc główne jest „Try starting normally” po zwolnieniu miejsca; kopia druga.
  const miejsce = stan.powod === 'brak_miejsca';
  const kopia = <Przycisk tekst={t('awaryjny.zapisz_kopie')} onPress={naZapiszKopie} rodzaj={miejsce ? 'drugi' : 'glowny'} testID="awaryjny-zapisz-kopie" />;
  const sprobuj = <Przycisk tekst={t('awaryjny.sprobuj')} onPress={naSprobujNormalnie} rodzaj={miejsce ? 'glowny' : 'drugi'} testID="awaryjny-sprobuj-normalnie" />;
  return (
    <Arkusz tytul={t(TYTUL[stan.powod])} testID="tryb-awaryjny" przyciski={
      <>
        {miejsce ? <>{sprobuj}{kopia}</> : <>{kopia}{sprobuj}</>}
        <Przycisk tekst={t('awaryjny.zglos')} onPress={naZglosProblem} rodzaj="tekstowy" testID="awaryjny-zglos-problem" />
      </>
    }>
      {miejsce ? <Tresc testID="awaryjny-brak-miejsca">{t('awaryjny.opis_brak_miejsca')}</Tresc> : <Tresc>{t('awaryjny.opis')}</Tresc>}
      {stan.licznosciKopii && <Tresc podpis>{t('awaryjny.zapisano')}</Tresc>}
      {stan.licznosciKopii && <Tresc podpis testID="awaryjny-licznosci">{stan.licznosciKopii}</Tresc>}
      {panelE2e}
    </Arkusz>
  );
}
