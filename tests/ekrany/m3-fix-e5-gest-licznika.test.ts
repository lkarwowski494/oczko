// M3 fix E5, poz. 17 (P-617 A): na liczniku wyłączony pełnoekranowy gest „wstecz” iOS 26; zostaje gest od lewej krawędzi.
// Źródło: react-native-screens 4.26.2 `src/types.tsx:182-189` — `fullScreenSwipeEnabled`: „For iOS 26 and up, native `interactiveContentPopGestureRecognizer`
// is used, and this prop controls whether it should be enabled or not. When not set, it defaults to `false` on iOS < 26 and `true` for iOS >= 26.”
// Opcja ekranu expo-router `fullScreenGestureEnabled` → `fullScreenSwipeEnabled` (expo-router build/react-navigation/native-stack/views/NativeStackView.native.js:210).
// `gestureEnabled` (gest od krawędzi) zostaje domyślny (true). Kontrola źródła jak narzedzia-wstecz-trasa.test.tsx (Jest nie uruchamia natywnego stosu).
import fs from 'node:fs';
import path from 'node:path';

const uklad = fs.readFileSync(path.join(__dirname, '../../app/_layout.tsx'), 'utf8');
const ekranLicznika = uklad.match(/<Stack\.Screen name="licznik"[^>]*\/>/)?.[0] ?? '';

test('P-617 A: ekran „licznik” ma fullScreenGestureEnabled: false, bez wyłączania gestu od krawędzi', () => {
  expect(ekranLicznika).toMatch(/fullScreenGestureEnabled: false/);
  expect(ekranLicznika).not.toMatch(/[^n]gestureEnabled: false/);
});

test('P-617 A: zainstalowana wersja react-native-screens ma opisaną opcję (inna wersja → sprawdź źródło od nowa)', () => {
  const typy = fs.readFileSync(require.resolve('react-native-screens/src/types.tsx'), 'utf8');
  expect(typy).toContain('For iOS 26 and up, native `interactiveContentPopGestureRecognizer` is used, and this prop controls whether it should');
  const widok = fs.readFileSync(require.resolve('expo-router/build/react-navigation/native-stack/views/NativeStackView.native.js'), 'utf8');
  expect(widok).toContain('fullScreenSwipeEnabled: fullScreenGestureEnabled');
});
