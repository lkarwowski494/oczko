// Kompozycja danych w Ustawieniach (BR-DAN-006, BR-DAN-009, P-091 (6a)): liczności archiwum słowami („1 project, 1 counter, 2 changes”)
// i wynik importu „scal” jako różnica projektów przed i po (powtórny import = „0 new”).
import type { Licznosci } from '../domena/porty';
import type { Tlumacz } from '../ekrany/wspolne';

export function licznosciTekst(l: Licznosci, t: Tlumacz): string {
  return [t('dane.l_projekt', { count: l.projekt ?? 0 }), t('dane.l_licznik', { count: l.licznik ?? 0 }), t('dane.l_zmiana', { count: l.zdarzenie ?? 0 })].join(', ');
}
export function wynikScalenia(przed: Licznosci, po: Licznosci, t: Tlumacz): string {
  const nowe = Math.max(0, (po.projekt ?? 0) - (przed.projekt ?? 0));
  return t('dane.zaimportowano', { nowe: t('dane.nowe', { count: nowe }), licznosci: licznosciTekst(po, t) });
}
