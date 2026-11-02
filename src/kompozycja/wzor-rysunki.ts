// M1-084 (DEC-31 a, b): trasa wzoru a rysunki, których widok natywny nie zapisał (WidokWzoru.swift `onBladZapisu`; kolejka w pamięci).
// Wyjście z ekranu z niezapisanymi kreskami pyta (jak Trening `confirmDiscard`: zostań / wyjdź); otwarcie wzoru przy małej ilości miejsca ostrzega.
// Teksty rysunku od 04 (DEC-28 a; M1-102, M1-110): pytanie `wzor.wyjdz_*`, ostrzeżenie `wzor.miejsce_*`.
import { Alert } from 'react-native';
import type { MagazynPlikow } from '../domena/porty';
import { RYSUNEK_MIEJSCE_MIN_MB } from '../konfiguracja';
import type { Tlumacz } from '../ekrany/wspolne';

/** „Wstecz” na wzorze: bez niezapisanych kresek od razu `wyjdz`; z nimi alert — „Cancel” zostaje, „Back” (niszczący) wychodzi bez zapisu. */
export function wyjscieZWzoru(t: Tlumacz, niezapisane: boolean, wyjdz: () => void): void {
  if (!niezapisane) { wyjdz(); return; }
  // M1-102 (04-studio-projektowe-514, DEC-28 a): pytanie o decyzję z własnymi kluczami; treść jak alert kresek tylko w pamięci, przycisk nazywa skutek.
  Alert.alert(t('wzor.wyjdz_tytul'), t('wzor.rysunek_niezapisany_opis'), [{ text: t('wzor.wyjdz_zostan'), style: 'cancel' }, { text: t('wzor.wyjdz_potwierdz'), style: 'destructive', onPress: wyjdz }]);
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
