// Adapter portu Haptyka (F-48, P-135 Q4a): wzorzec = klucz tokenu 04 (docs/design/tokeny.json „haptyka”), styl z tekstu tokenu:
// plus .light, piataKreska .medium, rzadZInstrukcja dwa .medium co 90 ms, minus .soft, blokadaStukniecie .rigid, bladZapisu notification .error,
// stoperStart .light (M1-107: start stopera, design-spec „Stoper na liczniku”: „haptyka lekka”).
// Rozpoznawalne tylko plus i rzadZInstrukcja (F-48), reszta systemowa; brak dźwięku (BR-LIC-005). Błąd modułu pomijany (nie zmienia operacji).
import type { Haptyka, WzorzecHaptyki } from '../domena/porty';

export type StylUderzenia = 'light' | 'medium' | 'soft' | 'rigid';
export interface ModulHaptyki { impactAsync(styl: StylUderzenia): Promise<void>; notificationAsync(typ: 'error'): Promise<void> }
export const ODSTEP_PRZYPOMNIENIA_MS = 90; // tokeny „rzadZInstrukcja”: dwa uderzenia co 90 ms

const STYL: Record<Exclude<WzorzecHaptyki, 'rzadZInstrukcja' | 'bladZapisu'>, StylUderzenia> = {
  plus: 'light', piataKreska: 'medium', minus: 'soft', blokadaStukniecie: 'rigid', stoperStart: 'light',
};

export function haptyka(m: ModulHaptyki = domyslny(), czekaj: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms))): Haptyka {
  const uderz = (s: StylUderzenia) => m.impactAsync(s).catch(() => undefined);
  return {
    zagraj(w) {
      if (w === 'rzadZInstrukcja') void uderz('medium').then(() => czekaj(ODSTEP_PRZYPOMNIENIA_MS)).then(() => uderz('medium'));
      else if (w === 'bladZapisu') void m.notificationAsync('error').catch(() => undefined);
      else void uderz(STYL[w]);
    },
  };
}
function domyslny(): ModulHaptyki {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- leniwie: moduł natywny tylko na urządzeniu
  const h: { impactAsync(s: unknown): Promise<void>; notificationAsync(t: unknown): Promise<void>; ImpactFeedbackStyle: Record<'Light' | 'Medium' | 'Soft' | 'Rigid', unknown>; NotificationFeedbackType: { Error: unknown } } = require('expo-haptics');
  const styl = { light: h.ImpactFeedbackStyle.Light, medium: h.ImpactFeedbackStyle.Medium, soft: h.ImpactFeedbackStyle.Soft, rigid: h.ImpactFeedbackStyle.Rigid };
  return { impactAsync: (s) => h.impactAsync(styl[s]), notificationAsync: () => h.notificationAsync(h.NotificationFeedbackType.Error) };
}
