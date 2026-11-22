// t() dla ekranu awaryjnego (ADR-0019): bez bazy — język wybrany w aplikacji z lustra `jezyk.json` obok bazy (M1-070, P-455), inaczej język systemu;
// słowniki z pakietu (ADR-0017).
import { utworzI18n } from '../i18n/i18n';
import { ZASOBY } from '../i18n/slowniki';
import { tagiSystemowe } from '../platforma/lokalizacja';
import { preferencjaJezykaAwaryjna } from './start-aplikacji';
import type { Tlumacz } from '../ekrany/wspolne';

// M1-012: nieczytelny język systemu (moduł natywny rzuca) → język źródłowy; inaczej odrzucona obietnica zostawia pustą planszę zamiast ekranu awaryjnego.
const systemoweBezpieczne = (): string[] => { try { return tagiSystemowe(); } catch { return []; } };

export async function tAwaryjny(): Promise<Tlumacz> {
  const i = await utworzI18n({ magazyn: { odczytaj: preferencjaJezykaAwaryjna, zapisz: async () => undefined }, systemowe: systemoweBezpieczne, zasoby: ZASOBY });
  return (k, p) => i.t(k, p);
}
