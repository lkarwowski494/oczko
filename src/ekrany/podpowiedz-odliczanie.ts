// ZM-25 (U7 forma A, P-1103): odliczanie podpowiedzi „+1” na otwartym liczniku. Termin z czystej funkcji (`terminPodpowiedzi`, znacznik czasu, nie zliczanie ticków);
// jeden `setTimeout` do terminu, po nim stan „pokazana dla tego rzędu” i jedno wywołanie `poPokazaniu` (wibracja ostrzeżenia). Zegar wstrzyknięty (`teraz`).
// „Raz na rząd”: klucz rzędu (licznik + wartość) zmienia się przy +1/−1 → podpowiedź znika i odliczanie startuje od nowa; wyjście z ekranu = odmontowanie = koniec.
import { useEffect, useRef, useState } from 'react';
import { terminPodpowiedzi } from '../domena/podpowiedz';

export type WejscieOdliczania = {
  progMin: number | null; ostatniaZmianaMs: number | null; klucz: string; blokada: boolean;
  teraz(): number; poPokazaniu?(): void;
};
export function useOdliczaniePodpowiedzi(w: WejscieOdliczania): { minuty: number } | null {
  const [pokazana, ustawPokazana] = useState<string | null>(null);
  const otwarto = useRef<number | null>(null);
  if (otwarto.current === null) otwarto.current = w.teraz();
  const poPokazaniu = useRef(w.poPokazaniu);
  poPokazaniu.current = w.poPokazaniu;
  useEffect(() => {
    const termin = terminPodpowiedzi({ progMin: w.progMin, ostatniaZmianaMs: w.ostatniaZmianaMs, otwartoMs: otwarto.current ?? w.teraz(), blokada: w.blokada });
    if (termin === null) return undefined;
    const pokaz = () => { ustawPokazana(w.klucz); poPokazaniu.current?.(); };
    const opoznienie = termin - w.teraz();
    if (opoznienie <= 0) { pokaz(); return undefined; }
    const uchwyt = setTimeout(pokaz, opoznienie);
    return () => clearTimeout(uchwyt);
  }, [w.klucz, w.progMin, w.ostatniaZmianaMs, w.blokada]); // eslint-disable-line react-hooks/exhaustive-deps -- `teraz` to wstrzyknięty zegar, nie zależność
  return w.progMin !== null && !w.blokada && pokazana === w.klucz ? { minuty: w.progMin } : null;
}
