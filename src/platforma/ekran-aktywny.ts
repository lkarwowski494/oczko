// Adapter portu EkranAktywny (F-10, rejestr Expo 7): expo-keep-awake z parą activateKeepAwakeAsync / deactivateKeepAwake o tym samym tagu
// (activateKeepAwake wycofane); każdy włączony tag wyłączany. Błąd modułu nie przerywa pracy (ekran zgaśnie jak zwykle).
import type { EkranAktywny } from '../domena/porty';

export interface ModulKeepAwake { activateKeepAwakeAsync(tag: string): Promise<void>; deactivateKeepAwake(tag: string): Promise<void> }

export function ekranAktywny(m: ModulKeepAwake = domyslny()): EkranAktywny {
  return {
    wlacz(tag) { void m.activateKeepAwakeAsync(tag).catch(() => undefined); },
    wylacz(tag) { void m.deactivateKeepAwake(tag).catch(() => undefined); },
  };
}
function domyslny(): ModulKeepAwake {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- leniwie: moduł natywny tylko na urządzeniu
  return require('expo-keep-awake');
}
