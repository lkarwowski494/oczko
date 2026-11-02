// Zastępnik `expo-router/react-navigation` w Jest (jak expo-file-system-node.ts, P-120 Q1a; M1-audytor-generalny-020): testy tras renderują ekran
// z atrapą `expo-router`, bez kontenera nawigacji, więc prawdziwe `usePreventRemove` i `useNavigation` rzuciłyby. Zastępnik zapamiętuje ostatnie
// `usePreventRemove(blokuj, cb)` i pozwala testowi zasymulować usunięcie ekranu (przesunięcie arkusza w dół, `router.back()`) tak jak native stack:
// przy `blokuj = true` usunięcie jest zatrzymane i woła `cb({ data: { action } })`; `useNavigation().dispatch` to atrapa (dokończenie usunięcia).
// `useNavigation` aplikacja bierze z `expo-router` (M1-audytor-generalny-122: eksport z `expo-router/react-navigation` przestarzały w SDK 57),
// więc testy tras podają go w atrapie `expo-router` z tego pliku: `useNavigation: () => require('../narzedzia/expo-router-react-navigation').useNavigation()`.
type Akcja = { type: string; payload?: object; source?: string; target?: string };
type Wywolanie = (e: { data: { action: Akcja } }) => void;

let ostatni: { blokuj: boolean; cb: Wywolanie } | null = null;

/** Nawigacja ekranu: `dispatch(akcja)` = dokończenie zatrzymanego usunięcia (w aplikacji: `navigation.dispatch(data.action)`). */
export const nawigacja = { dispatch: jest.fn<void, [Akcja]>() };

export function usePreventRemove(blokuj: boolean, cb: Wywolanie): void {
  ostatni = { blokuj, cb };
}

export function useNavigation(): typeof nawigacja {
  return nawigacja;
}

/**
 * Usunięcie ekranu z zewnątrz (gest przesunięcia arkusza w dół albo `router.back()`): `true` = zatrzymane przez `usePreventRemove`
 * (wtedy wywołane `cb` z akcją), `false` = ekran znika bez pytania (w aplikacji: bez `beforeRemove` z `preventDefault`).
 */
export function usunEkran(action: Akcja = { type: 'POP', payload: { count: 1 } }): boolean {
  if (!ostatni?.blokuj) return false;
  ostatni.cb({ data: { action } });
  return true;
}

/** Stan między testami: bez zapamiętanego ekranu i z czystą atrapą `dispatch`. */
export function wyczyscNawigacje(): void {
  ostatni = null;
  nawigacja.dispatch.mockClear();
}
