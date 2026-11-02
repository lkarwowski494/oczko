// Preferencje urządzenia (ADR-0029, BR-LIC-020/S3, BR-LIC-013/S2, BR-KAL-003/S6): czyste parsowanie surowych wartości z tabeli `ustawienie`.
import { PREFERENCJE_DOMYSLNE } from '../konfiguracja';

export type PreferencjaMiar = 'auto' | 'metric' | 'imperial';
export type Preferencje = { wibracje: boolean; ekranNieGasnie: boolean; ukladMiar: PreferencjaMiar };
export type SurowePreferencje = { wibracje?: unknown; ekran_nie_gasnie?: unknown; uklad_miar?: unknown };

/**
 * Surowa wartość (JSON z tabeli `ustawienie` albo brak) → preferencja. Zły typ, nieznany napis i brak klucza dają wartość domyślną z konfiguracji
 * (ADR-0029: uszkodzony zapis = domyślna); to jedyne miejsce, gdzie brak wolno zastąpić wartością (preferencje interfejsu, nie dane użytkownika).
 */
export function preferencjeZUstawien(surowe: SurowePreferencje): Preferencje {
  const d = PREFERENCJE_DOMYSLNE;
  const miary = surowe.uklad_miar;
  return {
    wibracje: typeof surowe.wibracje === 'boolean' ? surowe.wibracje : d.wibracje,
    ekranNieGasnie: typeof surowe.ekran_nie_gasnie === 'boolean' ? surowe.ekran_nie_gasnie : d.ekranNieGasnie,
    ukladMiar: miary === 'auto' || miary === 'metric' || miary === 'imperial' ? miary : d.ukladMiar,
  };
}
