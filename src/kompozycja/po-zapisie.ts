// M1-006 (Aneks P2 poz. 5, P-368): nieudany zapis poza licznikiem nie kończy się po cichu. Alert „Couldn’t save your changes”
// (`alertBleduZapisu(t, 'formularz')`) i haptyka `bladZapisu`, gdy w preferencjach włączone są wibracje (jak licznik, ADR-0029).
// Tylko powody zapisu (`zapis`, `brak_miejsca`): opis alertu mówi o braku miejsca, więc np. `zablokowany` albo `niedozwolone_przejscie` go nie dostają.
import { Alert } from 'react-native';
import type { Powod, Wynik } from '../domena/bledy';
import type { Haptyka } from '../domena/porty';
import { alertBleduZapisu, type MiejsceBleduZapisu } from '../ekrany/blad-zapisu';
import type { Oglos, Tlumacz, WynikEkranu } from '../ekrany/wspolne';
import { tekstBleduZapisu } from '../ekrany/WzorLicznik';
import type { WynikPlus } from '../ekrany/LicznikTypy';
import { skutekPlus } from '../ekrany/po-plusie';
import { miesiac } from './licznik';

/** To, co trasa ma z `useAplikacja()`: tłumacz, port haptyki i migawka preferencji. */
export type ZrodloBleduZapisu = { kontener: { j: { t: Tlumacz }; porty: { haptyka: Haptyka } }; preferencje: { stan(): { wibracje: boolean } } };

const POWODY_ZAPISU: readonly Powod[] = ['zapis', 'brak_miejsca'];

/** M1-006: przy błędzie zapisu alert i haptyka; `true`, gdy komunikat został pokazany (inny powód: nic, `false`). */
export function zglosBladZapisu(a: ZrodloBleduZapisu, powod: Powod, miejsce: MiejsceBleduZapisu = 'formularz'): boolean { // M1-102: teksty rysunku
  if (!POWODY_ZAPISU.includes(powod)) return false;
  if (a.preferencje.stan().wibracje) a.kontener.porty.haptyka.zagraj('bladZapisu');
  Alert.alert(...alertBleduZapisu(a.kontener.j.t, miejsce));
  return true;
}

/** M1-006: `true`, gdy zapis się udał; przy błędzie zapisu pokazuje komunikat i zwraca `false`. */
export function zapisano<W extends Wynik<unknown>>(a: ZrodloBleduZapisu, r: W): r is Extract<W, { ok: true }> {
  const w: Wynik<unknown> = r;
  if (!w.ok) zglosBladZapisu(a, w.powod);
  return w.ok;
}

/** M1-004: nieudany zapis +1/−1 z paska pod wzorem — haptyka `bladZapisu` (przy włączonych wibracjach) i jedno ogłoszenie tekstu alertu
 *  paska, jak na ekranie licznika; `limit` i `zablokowany` to nie błąd zapisu (bez zmian). Alert pod liczbą ustawia ekran (`blad`). */
export function bladPaskaLicznika(a: ZrodloBleduZapisu, r: WynikEkranu<unknown>, oglos: Oglos): void {
  if (r.ok || r.powod === 'limit' || r.powod === 'zablokowany') return;
  if (a.preferencje.stan().wibracje) a.kontener.porty.haptyka.zagraj('bladZapisu');
  oglos(tekstBleduZapisu(a.kontener.j.t));
}

/** M1-audytor-generalny-203/204 (SYS-01): wynik +1 z paska pod wzorem — haptyka (przy włączonych wibracjach) i jedno ogłoszenie jak na
 *  ekranie licznika (`skutekPlus`): udany rząd, rząd z przypomnieniem (BR-LIC-020 S1), limit, błąd zapisu. */
export type ZrodloPoPlusie = ZrodloBleduZapisu & { kontener: { j: { jezyk(): string }; z: { zegar: { teraz(): { dzien: string } } } } };
export function poPlusiePaska(a: ZrodloPoPlusie, r: WynikPlus, k: { nrRobocza: number; oczka: boolean }, oglos: Oglos): void {
  const sk = skutekPlus(a.kontener.j.t, r, { ...k, miesiac: miesiac(a.kontener.z.zegar.teraz().dzien, a.kontener.j.jezyk()) });
  if (sk.haptyka && a.preferencje.stan().wibracje) a.kontener.porty.haptyka.zagraj(sk.haptyka);
  if (sk.ogloszenie) oglos(sk.ogloszenie);
}
