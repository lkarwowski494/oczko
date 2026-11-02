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
const TYTUL = { 'petla-startow': 'awaryjny.tytul_petla', wersja_nowsza: 'awaryjny.tytul_nowsza', uszkodzony: 'awaryjny.tytul_uszkodzony', brak_miejsca: 'awaryjny.tytul_petla' } as const; // M1-011: brak miejsca to nie uszkodzenie (teksty z systemu 04)
export function TrybAwaryjny({ stan, t, naZapiszKopie, naSprobujNormalnie, naZglosProblem, panelE2e }: PropsTrybuAwaryjnego): React.ReactElement {
  return (
    <Arkusz tytul={t(TYTUL[stan.powod])} testID="tryb-awaryjny" przyciski={
      <>
        <Przycisk tekst={t('awaryjny.zapisz_kopie')} onPress={naZapiszKopie} rodzaj="glowny" testID="awaryjny-zapisz-kopie" />
        <Przycisk tekst={t('awaryjny.sprobuj')} onPress={naSprobujNormalnie} testID="awaryjny-sprobuj-normalnie" />
        <Przycisk tekst={t('awaryjny.zglos')} onPress={naZglosProblem} rodzaj="tekstowy" testID="awaryjny-zglos-problem" />
      </>
    }>
      {stan.powod === 'brak_miejsca' && <Tresc testID="awaryjny-brak-miejsca">{t('wspolne.blad_zapisu_opis')}</Tresc>}
      <Tresc>{t('awaryjny.opis')}</Tresc>
      {stan.licznosciKopii && <Tresc podpis>{t('awaryjny.zapisano')}</Tresc>}
      {stan.licznosciKopii && <Tresc podpis testID="awaryjny-licznosci">{stan.licznosciKopii}</Tresc>}
      {panelE2e}
    </Arkusz>
  );
}
