// Diagnostyka E2E BX-019 (FX4, KO-084 B): panel `e2e-nawigacje` na ekranie licznika — ile razy naciśnięto akcję „Wzór” (i dokąd miała prowadzić) oraz ile razy
// ekran licznika zamontował się od nowa (panel stoi w slocie `sprawdzStopera`, więc przemontowuje się razem z `key={wersja}` w app/licznik.tsx).
// Scenariusz 22 padł raz (iOS 43788927541): stuknięcie dotarło do aplikacji, a ekran „/wzor” nie powstał. Liczby rozdzielą „onPress nie zadziałał” (stuknięcie pochłonięte
// albo ekran przemontowany w trakcie) od „push wywołany, ekran nie powstał”. Tylko liczy i przepuszcza wywołanie — zachowanie aplikacji bez zmian.
// Bez t(), jak pozostałe panele E2E; ładowany wyłącznie przez `paneleE2e` (P-238), więc poza buildem E2E nie trafia do bundla. Stan w pamięci procesu (restart zeruje).
import React, { useEffect, useSyncExternalStore } from 'react';
import { Text } from 'react-native';

type Stan = { nacisniecia: number; ostatni: string | null; montaze: number };
const WYJSCIOWY: Stan = { nacisniecia: 0, ostatni: null, montaze: 0 };
let stan: Stan = WYJSCIOWY;
const sluchacze = new Set<() => void>();
const zmien = (z: (s: Stan) => Stan): void => { stan = z(stan); sluchacze.forEach((f) => f()); };
const subskrybuj = (f: () => void): (() => void) => { sluchacze.add(f); return () => { sluchacze.delete(f); }; };

/** Naciśnięcie akcji „Wzór” (przed `router.push`): `cel` to trasa, do której akcja prowadzi. */
export const zliczNawigacje = (cel: string): void => zmien((s) => ({ ...s, nacisniecia: s.nacisniecia + 1, ostatni: cel }));
/** Tylko dla testów: stan wyjściowy (w aplikacji stan żyje przez cały proces, jak `ocena-stan`). */
export const zerujNawigacje = (): void => zmien(() => WYJSCIOWY);

export function PanelNawigacji(): React.ReactElement {
  const s = useSyncExternalStore(subskrybuj, () => stan);
  useEffect(() => { zmien((x) => ({ ...x, montaze: x.montaze + 1 })); }, []);
  return <Text testID="e2e-nawigacje">{`pattern presses: ${s.nacisniecia} (last: ${s.ostatni ?? 'none'}); counter screen mounts: ${s.montaze}`}</Text>;
}
