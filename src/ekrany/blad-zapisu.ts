// Alert błędu zapisu poza licznikiem i wzorem (Aneks P2 poz. 5, 04, P-368): tytuł mówi, co się nie udało (Trening, wzorzec błędu akcji: bez gołego „Nie udało się”),
// druga linia wspólna (przyczyna i działanie), przycisk „OK”. `licznik.blad_zapisu` zostaje na liczniku i pasku licznika pod wzorem (tekst o rzędzie).
import type { Klucz } from '../i18n/typy';
import type { Tlumacz } from './wspolne';

// M1-102 (DEC-28 a, 04): rysunek na wzorze i stoper mają własne teksty — `rysunek` (kreski czekają w pliku na urządzeniu: zapis po rysowaniu,
// odzysk przy otwarciu), `rysunek_niezapisany` (kreski tylko w pamięci widoku natywnego), `stoper` (Start/Pause/Resume/Stop).
export type MiejsceBleduZapisu = 'ustawienia' | 'formularz' | 'rysunek' | 'rysunek_niezapisany' | 'stoper';
const TEKSTY: Record<MiejsceBleduZapisu, [Klucz, Klucz]> = {
  ustawienia: ['ustawienia.blad_zapisu', 'wspolne.blad_zapisu_opis'],
  formularz: ['formularz.blad_zapisu', 'wspolne.blad_zapisu_opis'],
  rysunek: ['wzor.blad_rysunku', 'wzor.blad_rysunku_opis'],
  rysunek_niezapisany: ['wzor.blad_rysunku', 'wzor.rysunek_niezapisany_opis'],
  stoper: ['stoper.blad_zapisu', 'wspolne.blad_zapisu_opis'],
};
/** Argumenty `Alert.alert(tytul, opis, przyciski)`: `Alert.alert(...alertBleduZapisu(t, 'formularz'))`. */
export function alertBleduZapisu(t: Tlumacz, miejsce: MiejsceBleduZapisu): [string, string, { text: string }[]] {
  const [tytul, opis] = TEKSTY[miejsce];
  return [t(tytul), t(opis), [{ text: t('wspolne.ok') }]];
}
