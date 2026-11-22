// Adapter portu Zegar (moduly.md „Czas w przypadkach użycia”, RD-16): zegar systemu i strefa urządzenia (Intl, jedyne źródło strefy);
// dzień lokalny liczy domena (dzienLokalny, kalendarz gregoriański). Build E2E (argument startu oczkoE2eTeraz) — z ekranami w partii 4 (tryb-e2e.ts).
import { dzienLokalny } from '../domena/postep';
import type { Zegar } from '../domena/porty';

export function zegarSystemu(teraz: () => number = Date.now, strefa: () => string = () => Intl.DateTimeFormat().resolvedOptions().timeZone): Zegar {
  return {
    teraz() {
      const ms = teraz(), s = strefa();
      const d = dzienLokalny(ms, s);
      if (!d.ok) throw new Error(`Zegar: strefa urządzenia ${s} nieznana dla Intl`); // stan niemożliwy na urządzeniu (strefa z systemu); ryzyko RD-16 na Hermes
      return { ms, strefa: s, dzien: d.wartosc };
    },
  };
}
