// Alert błędu zapisu poza licznikiem i wzorem (Aneks P2 poz. 5, 04, P-368): tytuł mówi, co się nie udało (Trening, wzorzec błędu akcji: bez gołego „Nie udało się”),
// druga linia wspólna (przyczyna i działanie), przycisk „OK”. `licznik.blad_zapisu` zostaje na liczniku i pasku licznika pod wzorem (tekst o rzędzie).
import type { Tlumacz } from './wspolne';

export type MiejsceBleduZapisu = 'ustawienia' | 'formularz';
/** Argumenty `Alert.alert(tytul, opis, przyciski)`: `Alert.alert(...alertBleduZapisu(t, 'formularz'))`. */
export function alertBleduZapisu(t: Tlumacz, miejsce: MiejsceBleduZapisu): [string, string, { text: string }[]] {
  return [t(miejsce === 'ustawienia' ? 'ustawienia.blad_zapisu' : 'formularz.blad_zapisu'), t('wspolne.blad_zapisu_opis'), [{ text: t('wspolne.ok') }]];
}
