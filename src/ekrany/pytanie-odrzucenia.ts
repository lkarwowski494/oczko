// „Discard changes?” (M1-audytor-generalny-020, 04-studio-projektowe-004; design-spec aneks M2 p2, DEC-28 a; wzorzec Treningu `confirmDiscard`):
// jedno pytanie dla arkuszy tras (`useOdrzucZmiany`) i paneli na ekranach, które nie są trasami. „Back to editing” zostaje, „Discard changes” woła `odrzuc`.
import { Alert } from 'react-native';
import type { Tlumacz } from './wspolne';

/** Opis skutku: `zmiany` — istniejąca rzecz zostaje jak była; `nowy` — nowa rzecz nie powstanie. */
export type OpisOdrzucenia = 'zmiany' | 'nowy';

export function pytajOdrzucZmiany(t: Tlumacz, opis: OpisOdrzucenia, odrzuc: () => void): void {
  Alert.alert(t('wspolne.odrzuc_tytul'), t(opis === 'nowy' ? 'wspolne.odrzuc_opis_nowy' : 'wspolne.odrzuc_opis_zmiany'), [
    { text: t('wspolne.wroc_do_edycji'), style: 'cancel' },
    { text: t('wspolne.odrzuc_zmiany'), style: 'destructive', onPress: odrzuc },
  ]);
}
