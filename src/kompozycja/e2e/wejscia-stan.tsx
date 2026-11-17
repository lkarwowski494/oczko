// Diagnostyka E2E FX6b (P-909, opcja 2 z raportu FX6, wzór BX-019 `nawigacje-stan.tsx`): dwa panele rozdzielające „zdarzenie wejścia nie dotarło do JS” od „dotarło, ale wynik nie trafił na ekran”.
//  • `e2e-licznik-wejscia` (ekran licznika, slot pod kreskami jak `e2e-nawigacje`): ile razy wywołano obsługę „+1” i „−1” (po sprawdzeniu blokady na ekranie), ile zapisów skończyło się
//    wynikiem ok / błędem, ostatnia wartość wpisana do stanu ekranu oraz odczyty stanu z kompozycji: rozpoczęte, zastosowane, pominięte jako nieaktualne.
//  • `e2e-nazwa-wejscia` (formularz nazwy, za polami): liczba zdarzeń zmiany tekstu w polach „Project” i „Part” i długość ostatniej wartości odebranej w JS.
// Scenariusze 64 i 69 padły na iOS 43806685504 (stuknięcie „−1” bez zmiany wartości; z „Harbor” w polu została „H”); stan JS widać dopiero z tych liczb.
// Tylko liczy i przepuszcza wywołanie — zachowanie aplikacji bez zmian. Bez t(), jak pozostałe panele E2E; ładowany wyłącznie przez `paneleE2e` (P-238), więc poza buildem E2E
// nie trafia do bundla. Stan w pamięci procesu (restart zeruje).
import React, { useSyncExternalStore } from 'react';
import { Text } from 'react-native';
import type { DiagnostykaLicznika } from '../../ekrany/Aplikacja';

type Akcja = 'plus' | 'minus';
type Pole = { zdarzenia: number; dlugosc: number | null };
type Stan = {
  wejscia: Record<Akcja, number>;
  zapisyOk: Record<Akcja, number>;
  zapisyBlad: number;
  wartosc: number | null;
  odswiezenia: { start: number; zastosowane: number; pominiete: number };
  nazwa: { projekt: Pole; czesc: Pole };
};
const WYJSCIOWY: Stan = {
  wejscia: { plus: 0, minus: 0 }, zapisyOk: { plus: 0, minus: 0 }, zapisyBlad: 0, wartosc: null,
  odswiezenia: { start: 0, zastosowane: 0, pominiete: 0 },
  nazwa: { projekt: { zdarzenia: 0, dlugosc: null }, czesc: { zdarzenia: 0, dlugosc: null } },
};
let stan: Stan = WYJSCIOWY;
const sluchacze = new Set<() => void>();
// BX22 (KO-143, scenariusz 31): w oknie pomiaru NFR-WYD-001 (od „+1” do drugiej klatki po zapisie) panel dokładał ≈ 34 ms (iOS 43994041193: p95 116 ms z panelem, 82 ms bez — scen. 122).
// Stan w pamięci zmienia się od razu, ale powiadomienia słuchaczy (czyli render panelu) są wstrzymywane od `wejscie('plus')` do `wznowPowiadomienia()` (app/licznik.tsx, po próbce)
// i idą jednym zatwierdzeniem. Bezpiecznik czasowy: bez zwolnienia panel odświeża się sam po 1,5 s. Tylko build E2E (moduł nie trafia do bundla wydania, P-238).
const BEZPIECZNIK_MS = 1500;
let wstrzymane = false;
let zalegle = false;
let bezpiecznik: ReturnType<typeof setTimeout> | null = null;
const powiadom = (): void => { sluchacze.forEach((f) => f()); };
const zmien = (z: (s: Stan) => Stan): void => { stan = z(stan); if (wstrzymane) { zalegle = true; return; } powiadom(); };
const wstrzymaj = (): void => {
  wstrzymane = true;
  if (bezpiecznik) clearTimeout(bezpiecznik);
  bezpiecznik = setTimeout(wznowPowiadomienia, BEZPIECZNIK_MS);
};
/** Zwalnia wstrzymane powiadomienia: jeden render panelu, jeśli w międzyczasie coś się zmieniło. Bez wstrzymania nic nie robi. */
export function wznowPowiadomienia(): void {
  if (bezpiecznik) { clearTimeout(bezpiecznik); bezpiecznik = null; }
  wstrzymane = false;
  if (zalegle) { zalegle = false; powiadom(); }
}
const subskrybuj = (f: () => void): (() => void) => { sluchacze.add(f); return () => { sluchacze.delete(f); }; };

/** Haki dla `EkranLicznika` (src/ekrany/Aplikacja.tsx, prop `diagnostyka`). */
export const diagnostykaLicznika: DiagnostykaLicznika = {
  wejscie: (a) => { if (a === 'plus') wstrzymaj(); zmien((s) => ({ ...s, wejscia: { ...s.wejscia, [a]: s.wejscia[a] + 1 } })); },
  zapis: (a, ok) => zmien((s) => (ok ? { ...s, zapisyOk: { ...s.zapisyOk, [a]: s.zapisyOk[a] + 1 } } : { ...s, zapisyBlad: s.zapisyBlad + 1 })),
  stan: (n) => zmien((s) => ({ ...s, wartosc: n })),
  odswiezenie: (z) => zmien((s) => ({ ...s, odswiezenia: { ...s.odswiezenia, [z]: s.odswiezenia[z] + 1 } })),
};
/** Hak dla formularza nazwy (src/ekrany/Formularze.tsx, prop `diagnostyka`): zdarzenie zmiany tekstu odebrane w JS. */
export const zliczWpisNazwy = (pole: 'projekt' | 'czesc', tekst: string): void =>
  zmien((s) => ({ ...s, nazwa: { ...s.nazwa, [pole]: { zdarzenia: s.nazwa[pole].zdarzenia + 1, dlugosc: tekst.length } } }));
/** Tylko dla testów: stan wyjściowy (w aplikacji stan żyje przez cały proces, jak `nawigacje-stan`). */
export const zerujWejscia = (): void => { wznowPowiadomienia(); zmien(() => WYJSCIOWY); };

export function PanelLicznika(): React.ReactElement {
  const s = useSyncExternalStore(subskrybuj, () => stan);
  const o = s.odswiezenia;
  return (
    <Text testID="e2e-licznik-wejscia">
      {`counter input: plus ${s.wejscia.plus}, minus ${s.wejscia.minus}; saves ok: plus ${s.zapisyOk.plus}, minus ${s.zapisyOk.minus}; saves failed: ${s.zapisyBlad}; state value: ${s.wartosc ?? 'none'}; refresh: started ${o.start}, applied ${o.zastosowane}, skipped ${o.pominiete}`}
    </Text>
  );
}

export function PanelNazwy(): React.ReactElement {
  const s = useSyncExternalStore(subskrybuj, () => stan);
  const opis = (p: Pole) => `events ${p.zdarzenia}, last length ${p.dlugosc ?? 'none'}`;
  return <Text testID="e2e-nazwa-wejscia">{`name form: project ${opis(s.nazwa.projekt)}; part ${opis(s.nazwa.czesc)}`}</Text>;
}
