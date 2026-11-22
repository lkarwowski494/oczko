// Diagnostyka E2E BX20 (KO-136, wariant A; plan BX19): licznik PRZYJĘTYCH naciśnięć (onPress) celów, przy których scenariusze 01, 03, 42, 45 i 118 padały jako „stuknięcie dotarło, bez skutku”
// (iOS 43925652111): `dzis-plus`, `dzis-kontynuuj` (ekran „Dziś”), `nav-wstecz` (komponent „Wstecz”), `e2e-zdjecie-testowe` i `e2e-wzor-pdf` (panele menu). Napis panelu: „taps accepted: dzis-plus 2, nav-wstecz 1”
// albo „taps accepted: none”. Przy czerwieni liczba w hierarchii ostatniego kroku rozdziela „dotyk nie dotarł do JS” (cel bez zmian) od „handler ruszył, skutek nie powstał” (cel +1).
// Tylko liczy i przepuszcza wywołanie — zachowanie aplikacji bez zmian. Bez t(), jak pozostałe panele E2E; ładowany wyłącznie przez `paneleE2e` (P-238), więc poza buildem E2E nie trafia do bundla.
// Ekrany dostają hak przez `KontekstNacisniec` (src/ekrany/Pasek.tsx; wartość podaje korzeń nawigacji tylko w buildzie E2E), więc poza E2E nie robią nic ponad dotychczasowe `onPress`.
// `licznik-plus` (scenariusz 95) celowo poza tym licznikiem: ma `e2e-licznik-wejscia` (FX6b), a dodatkowa praca na „+1” zepsułaby pomiar NFR-WYD-001 (31, 122). Stan w pamięci procesu (restart zeruje).
import React, { useSyncExternalStore } from 'react';
import { Text } from 'react-native';
import type { HakiDotyku } from '../../ekrany/Pasek';

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

// BX21 (KO-140, wariant B; diagnoza KP-10 w przebiegu iOS 43964020781): CYKL DOTYKU tych samych celów (panel `e2e-dotyk`). „taps accepted” rozdziela tylko „onPress ruszył / nie ruszył”; w KP-10 (część 3)
// stuknięcie w `dzis-kontynuuj` dotarło do okna aplikacji w normalnym czasie, a panel został „none” — UIKit zalogował `systemGestureStateChange: 1` 78 ms po dotknięciu. Pola: `ts` onTouchStart (dotyk
// doszedł do widoku w JS), `pin` onPressIn (Pressable przejął responder), `pout` onPressOut (koniec naciśnięcia, także po anulowaniu), `te` onTouchEnd, `tc` onTouchCancel (system anulował dotyk).
// Czytanie: ts 0 = dotyk nie dotarł do JS; ts 1 i pin 0 = responder przejął ktoś inny; tc 1 = anulowany przez system; pin 1, pout 1, tc 0 i brak naciśnięcia = Pressable sam odrzucił naciśnięcie.
export type RodzajDotyku = 'ts' | 'pin' | 'pout' | 'te' | 'tc';
type CyklDotyku = Readonly<Record<RodzajDotyku, number>>;
const POLA: readonly RodzajDotyku[] = ['ts', 'pin', 'pout', 'te', 'tc'];
let dotyki: ReadonlyMap<string, CyklDotyku> = new Map();
const sluchaczeDotyku = new Set<() => void>();
const subskrybujDotyk = (f: () => void): (() => void) => { sluchaczeDotyku.add(f); return () => { sluchaczeDotyku.delete(f); }; };

/** Napis panelu `e2e-dotyk`: cele w kolejności pierwszego zdarzenia, wszystkie pola z liczbą (także zera). */
export const opisDotyku = (d: ReadonlyMap<string, CyklDotyku>): string =>
  d.size === 0 ? 'touch: none' : `touch: ${[...d].map(([cel, c]) => `${cel} ${POLA.map((r) => `${r}${c[r]}`).join(' ')}`).join(', ')}`;

/** Zdarzenie dotyku `rodzaj` celu `cel`. Nowa mapa przy każdej zmianie — wymóg `useSyncExternalStore`. */
export const zliczDotyk = (cel: string, rodzaj: RodzajDotyku): void => {
  const c = dotyki.get(cel) ?? { ts: 0, pin: 0, pout: 0, te: 0, tc: 0 };
  dotyki = new Map(dotyki).set(cel, { ...c, [rodzaj]: c[rodzaj] + 1 });
  sluchaczeDotyku.forEach((f) => f());
};
/** Tylko dla testów: stan wyjściowy. */
export const zerujDotyk = (): void => { dotyki = new Map(); sluchaczeDotyku.forEach((f) => f()); };

/** Obserwatory pięciu zdarzeń dla celu `cel` (rozkładane na `Pressable` przez `KontekstDotyku`); same liczą, niczego nie zmieniają ani nie blokują. */
export const haki = (cel: string): HakiDotyku => ({
  onTouchStart: () => zliczDotyk(cel, 'ts'),
  onPressIn: () => zliczDotyk(cel, 'pin'),
  onPressOut: () => zliczDotyk(cel, 'pout'),
  onTouchEnd: () => zliczDotyk(cel, 'te'),
  onTouchCancel: () => zliczDotyk(cel, 'tc'),
});

/** Mały napis `e2e-dotyk` tuż nad `e2e-nacisniecia` (`pointerEvents="none"`: nie przechwytuje stuknięć). */
export function PanelDotyku(): React.ReactElement {
  const d = useSyncExternalStore(subskrybujDotyk, () => dotyki);
  return <Text testID="e2e-dotyk" pointerEvents="none" style={{ position: 'absolute', bottom: 12, right: 0, zIndex: 1000, fontSize: 9 }}>{opisDotyku(d)}</Text>;
}
