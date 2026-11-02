// Kontekst aplikacji dla tras expo-router (app/): kontener zależności i kompozycja licznika tworzone raz na proces.
// Zmiana języka (F-36) daje nową wartość kontekstu, więc ekrany w stosie przerenderowują się z nowym t() bez ponownego uruchomienia.
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Kontener } from './kontener';
import type { KompozycjaLicznika } from './licznik';
import type { preferencje } from './preferencje';
import type { PowodTrybuAwaryjnego } from '../ekrany/TrybAwaryjny';

/** `naAwarie`: błąd startu danych na trasie (np. migracja) → ekran awaryjny korzenia, ten sam co przy błędzie kontenera (ADR-0019, M1-074). */
export type Aplikacja = { kontener: Kontener; licznik: KompozycjaLicznika; preferencje: ReturnType<typeof preferencje>; naAwarie(powod: PowodTrybuAwaryjnego): void };
const K = createContext<(Aplikacja & { jezyk: string }) | null>(null);

export function DostawcaAplikacji({ wartosc, children }: { wartosc: Aplikacja; children: React.ReactNode }): React.ReactElement {
  const [jezyk, ustawJezyk] = useState(() => wartosc.kontener.j.jezyk());
  useEffect(() => wartosc.kontener.j.naZmiane(ustawJezyk), [wartosc]);
  const v = useMemo(() => ({ ...wartosc, jezyk }), [wartosc, jezyk]);
  return <K.Provider value={v}>{children}</K.Provider>;
}
export function useAplikacja(): Aplikacja {
  const a = useContext(K);
  if (!a) throw new Error('useAplikacja poza DostawcaAplikacji');
  return a;
}
