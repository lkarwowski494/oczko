// Model odczytu „Recently deleted” (F-33, BR-DAN-008; 08 partia 5, C1; sygnatura 08 do przeglądu 05, P-182 Q3a). Przywracanie: `przywroc*` w projekt.ts.
import type { Wynik } from '../domena/bledy';
import { elementyKosza, type ElementKosza } from '../dane/repozytoria/kosz';
import { operacjaZapisu } from './zapis';
import type { Zaleznosci } from './zaleznosci';

export type { ElementKosza };
export function widokKosza(z: Zaleznosci): Promise<Wynik<ElementKosza[]>> {
  return operacjaZapisu(z, 'widokKosza', async (tx, _teraz, chwila) => ({ ok: true, wartosc: await elementyKosza(tx, chwila.strefa, chwila.ms) }));
}
