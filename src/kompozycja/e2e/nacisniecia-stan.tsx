// Diagnostyka E2E BX20 (KO-136, wariant A; plan BX19): licznik PRZYJĘTYCH naciśnięć (onPress) celów, przy których scenariusze 01, 03, 42, 45 i 118 padały jako „stuknięcie dotarło, bez skutku”
// (iOS 43925652111): `dzis-plus`, `dzis-kontynuuj` (ekran „Dziś”), `nav-wstecz` (komponent „Wstecz”), `e2e-zdjecie-testowe` i `e2e-wzor-pdf` (panele menu). Napis panelu: „taps accepted: dzis-plus 2, nav-wstecz 1”
// albo „taps accepted: none”. Przy czerwieni liczba w hierarchii ostatniego kroku rozdziela „dotyk nie dotarł do JS” (cel bez zmian) od „handler ruszył, skutek nie powstał” (cel +1).
// Tylko liczy i przepuszcza wywołanie — zachowanie aplikacji bez zmian. Bez t(), jak pozostałe panele E2E; ładowany wyłącznie przez `paneleE2e` (P-238), więc poza buildem E2E nie trafia do bundla.
// Ekrany dostają hak przez `KontekstNacisniec` (src/ekrany/Pasek.tsx; wartość podaje korzeń nawigacji tylko w buildzie E2E), więc poza E2E nie robią nic ponad dotychczasowe `onPress`.
// `licznik-plus` (scenariusz 95) celowo poza tym licznikiem: ma `e2e-licznik-wejscia` (FX6b), a dodatkowa praca na „+1” zepsułaby pomiar NFR-WYD-001 (31, 122). Stan w pamięci procesu (restart zeruje).
import React, { useSyncExternalStore } from 'react';
import { Text } from 'react-native';

let nacisniecia: ReadonlyMap<string, number> = new Map();
const sluchacze = new Set<() => void>();
const subskrybuj = (f: () => void): (() => void) => { sluchacze.add(f); return () => { sluchacze.delete(f); }; };

/** Napis panelu (osobno, żeby test nie zależał od renderowania): cele w kolejności pierwszego naciśnięcia. */
export const opisNacisniec = (n: ReadonlyMap<string, number>): string =>
  n.size === 0 ? 'taps accepted: none' : `taps accepted: ${[...n].map(([cel, ile]) => `${cel} ${ile}`).join(', ')}`;

/** Przyjęte naciśnięcie celu `cel` (wołane na początku `onPress`, przed blokadą ani pracą handlera). Nowa mapa przy każdej zmianie — wymóg `useSyncExternalStore`. */
export const zliczNacisniecie = (cel: string): void => {
  nacisniecia = new Map(nacisniecia).set(cel, (nacisniecia.get(cel) ?? 0) + 1);
  sluchacze.forEach((f) => f());
};
/** Tylko dla testów: stan wyjściowy (w aplikacji stan żyje przez cały proces, jak `nawigacje-stan`). */
export const zerujNacisniecia = (): void => { nacisniecia = new Map(); sluchacze.forEach((f) => f()); };

/**
 * Mały napis `e2e-nacisniecia` w rogu okna (`pointerEvents="none"`: nie przechwytuje stuknięć). Stoi w korzeniu nawigacji jak `e2e-okno`; menu „Add photo” i „Add pattern” to widoki
 * wewnątrz ekranu (nie modale), więc korzeń jest w hierarchii XCUI także, gdy menu jest otwarte.
 */
export function PanelNacisniec(): React.ReactElement {
  const n = useSyncExternalStore(subskrybuj, () => nacisniecia);
  return <Text testID="e2e-nacisniecia" pointerEvents="none" style={{ position: 'absolute', bottom: 0, right: 0, zIndex: 1000, fontSize: 9 }}>{opisNacisniec(n)}</Text>;
}
