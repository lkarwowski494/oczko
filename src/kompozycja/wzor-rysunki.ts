// M1-084 (DEC-31 a, b): trasa wzoru a rysunki, których widok natywny nie zapisał (WidokWzoru.swift `onBladZapisu`; kolejka w pamięci).
// Wyjście z ekranu z niezapisanymi kreskami pyta (jak Trening `confirmDiscard`: zostań / wyjdź); otwarcie wzoru przy małej ilości miejsca ostrzega.
// Teksty: alert błędu zapisu z systemu (M1-006, `alertBleduZapisu(t, 'formularz')`), jak w 084 JS; własne teksty rysunku projektuje 04 (DEC-28).
import { Alert } from 'react-native';
import type { MagazynPlikow } from '../domena/porty';
import { RYSUNEK_MIEJSCE_MIN_MB } from '../konfiguracja';
import { alertBleduZapisu } from '../ekrany/blad-zapisu';
import type { Tlumacz } from '../ekrany/wspolne';

/** „Wstecz” na wzorze: bez niezapisanych kresek od razu `wyjdz`; z nimi alert — „Cancel” zostaje, „Back” (niszczący) wychodzi bez zapisu. */
export function wyjscieZWzoru(t: Tlumacz, niezapisane: boolean, wyjdz: () => void): void {
  if (!niezapisane) { wyjdz(); return; }
  const [tytul, opis] = alertBleduZapisu(t, 'formularz');
  Alert.alert(tytul, opis, [{ text: t('wspolne.anuluj'), style: 'cancel' }, { text: t('wspolne.wstecz'), style: 'destructive', onPress: wyjdz }]);
}

/**
 * DEC-31 b (tańsza kontrola): wolne miejsce poniżej `RYSUNEK_MIEJSCE_MIN_MB` → ostrzeżenie przed rysowaniem; `true`, gdy pokazane. Błąd odczytu: bez ostrzeżenia.
 * M1-110: `mozna()` sprawdzane po odczycie miejsca — gdy w międzyczasie przyszedł alert błędu zapisu rysunku, ostrzeżenia już nie ma (jeden alert).
 */
export async function ostrzezenieMiejsca(magazyn: Pick<MagazynPlikow, 'wolneMiejsce'>, t: Tlumacz, mozna: () => boolean = () => true): Promise<boolean> {
  let wolne: number;
  try { wolne = await magazyn.wolneMiejsce(); } catch { return false; }
  if (!(wolne < RYSUNEK_MIEJSCE_MIN_MB * 1024 * 1024) || !mozna()) return false;
  Alert.alert(t('wzor.miejsce_tytul'), t('wzor.miejsce_opis'), [{ text: t('wspolne.ok') }]); // M1-110, DEC-28 a: ostrzeżenie przed działaniem, nie zdanie błędu
  return true;
}
