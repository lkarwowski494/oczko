// 006 (P-614 (1)): hak etykiety „wstecz” dla `KontekstWstecz` (src/ekrany/Pasek.tsx) — stan stosu z expo-router, logika w czystym `wstecz.ts`.
// Tytuły dynamiczne (nazwa projektu, licznika) rejestruje trasa ekranu przez `useTytulTrasy` (klucz trasy → tekst), żeby następny ekran mógł je pokazać.
import { useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import { useNavigation, useRoute } from 'expo-router';
import { useAplikacja } from './Kontekst';
import { miesciSieWPasku, tytulPoprzedniej, type TrasaStosu } from './wstecz';
import { MAX_SKALA_TYTULOWA, odstep, typografia } from '../ekrany/motyw';

const tytulyTras = new Map<string, string>();

/** Trasa z tytułem z danych (nazwa projektu) zgłasza go pod swoim kluczem; po zamknięciu trasy wpis znika. */
export function useTytulTrasy(tytul: string | null): void {
  const { key } = useRoute();
  useEffect(() => {
    if (tytul === null) return undefined;
    tytulyTras.set(key, tytul);
    return () => { tytulyTras.delete(key); };
  }, [key, tytul]);
}

/** Hak dla `KontekstWstecz.Provider`: tytuł poprzedniego ekranu, jeśli mieści się w ok. 1/3 paska; inaczej null („Back”). */
export function useTytulPoprzedniego(): string | null {
  const nawigacja = useNavigation();
  const { key } = useRoute();
  const okno = useWindowDimensions();
  const { kontener } = useAplikacja();
  const stan: unknown = nawigacja.getState();
  const trasy = typeof stan === 'object' && stan !== null && 'routes' in stan && Array.isArray(stan.routes) ? (stan.routes as TrasaStosu[]) : [];
  const t = tytulPoprzedniej(trasy, key, tytulyTras);
  if (t === null) return null;
  const tekst = 'klucz' in t ? kontener.j.t(t.klucz) : t.tekst;
  return miesciSieWPasku(tekst, { szerokoscOkna: okno.width, skalaTekstu: okno.fontScale, ptTresci: Number(typografia.tresc.fontSize), marginesPaska: odstep.l, maxSkala: MAX_SKALA_TYTULOWA }) ? tekst : null;
}
