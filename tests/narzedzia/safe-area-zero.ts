/* Atrapa `react-native-safe-area-context` dla testów tras, które w aplikacji stoją pod `SafeAreaProvider` z korzenia expo-router (ExpoRoot), a w Jest renderują się bez niego:
 * `useSafeAreaInsets` (BX-009, `app/zdjecie.tsx`) daje wcięcia zerowe; reszta biblioteki prawdziwa. Użycie: jest.mock('react-native-safe-area-context', () => require('../narzedzia/safe-area-zero')). */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const prawdziwa = jest.requireActual('react-native-safe-area-context') as Record<string, unknown>;
module.exports = { ...prawdziwa, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
