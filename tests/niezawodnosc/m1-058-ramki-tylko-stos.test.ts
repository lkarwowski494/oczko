// M1-audytor-generalny-058 (12-niezawodnosc-006), przegląd ścieżki wrażliwej p3a (P2 prywatność): ramki do „Zgłoś problem” tylko z linii stosu
// („at …”), nie z dalszych linii wieloliniowego komunikatu błędu, który może nieść dane osoby w kształcie „tekst:liczba:liczba”.
import { zainstalujObslugeBledow, type WpisBledu } from '../../src/kompozycja/bledy-js';

function zlap(e: Error): WpisBledu[] {
  const zapisane: WpisBledu[] = [];
  const rn = { h: (_e: unknown, _f?: boolean) => undefined, getGlobalHandler() { return this.h; }, setGlobalHandler(h: (e: unknown, f?: boolean) => void) { this.h = h; } };
  zainstalujObslugeBledow(rn).ustawZapis(async (w) => { zapisane.push(w); });
  rn.h(e, true);
  return zapisane;
}

test('M1-058: linia komunikatu „Kasia-Nowak-pin:1234:5678” nie staje się ramką; ramki Hermesa „at …” zostają', () => {
  const e = new TypeError('x');
  e.stack = 'TypeError: nie można\nKasia-Nowak-pin:1234:5678\n    at zapisz (address at index.android.bundle:1:2345)\n    at anonymous (main.jsbundle:12:34)';
  const [w] = zlap(e);
  expect(w.szczegoly.ramki).toEqual(['index.android.bundle:1:2345', 'main.jsbundle:12:34']);
  expect(JSON.stringify(w)).not.toContain('Kasia');
});
