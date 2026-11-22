# 0024. Atlas technik (1.1): rysunek w aplikacji z modelu silnika przez `react-native-svg` 15.15.4 (wersja SDK 57, jak Trening); obraz jako jeden element dostępności z opisem z `t()`
Data: 2026-10-26 · Status: **przyjęta** (P-201, Q1a: koordynator wg P-087) · Rola: 05 (build, atlas 1.1) · Zależy od: P-036, P-192, P-201, ADR-0016, ADR-0017, ADR-0022

## Kontekst i problem
Przepływy A2–A3 (karta techniki, VoiceOver; `docs/atlas/e0-rozpoznanie.md` §3) wymagają narysowania modelu z ADR-0022 na ekranie w obu motywach i w trybie „Zwiększ kontrast”, z opisem dla czytnika ekranu spoza rysunku (P-192 (2)). `react-native-svg` nie ma dziś w `package.json`.

## Czynniki decyzji
- Rejestr E0 (odczyt 2026-10-26): wersja zgodna z SDK 57: `"react-native-svg": "15.15.4"` (`expo/expo@sdk-57/packages/expo/bundledNativeModules.json:114`); wydana 2026-03-18 (≥ 14 dni, P-036); licencja MIT (rejestr npm); ta sama wersja w Treningu (`trening/package.json:61`).
- `expo-image` obsługuje SVG z zastrzeżeniem: „On iOS, the system SVG decoder does not handle every valid path…” (docs.expo.dev, SDK 57, image).
- Kolory tylko z tokenów 04 (zasada wspólna 15); motyw zmienia się bez restartu.
- 1.0 w budowie: zależność wchodzi dopiero z kodem 1.1 (zmiana `package.json` uruchamia CI iOS).

## Rozważane opcje
A. `react-native-svg` 15.15.4: komponent rysuje części z modelu (`<Path>`) z paletą z bieżącego motywu.
B. `expo-image` z plikiem SVG z generatora (plik na motyw).
C. PNG z generatora (plik na motyw i gęstość).

## Decyzja
Opcja A (P-201 Q1a).
1. **Wiersz ADR-0016 przy wdrożeniu 1.1** (rola 08): `react-native-svg` 15.15.4 (dokładnie, `npx expo install --check`), przepływy A2–A3, alternatywy B i C odrzucone tym ADR; manifest prywatności pakietu sprawdzony po instalacji (`find node_modules -name PrivacyInfo.xcprivacy`, wzorce roli). Szkic wiersza: „Uzupełnienie 2026-10-26 (atlas 1.1)” w ADR-0016.
2. **Komponent** (rola 08, `src/komponenty/atlas/`): przyjmuje model (`Rysunek`) i paletę z motywu; kolejność rysowania jak w `doSvg` (wyróżnienie pod spodem, obwódka wokół skrzyżowań, nitka); bez `Text` z `react-native-svg`.
3. **Dostępność:** cały rysunek to jeden element (`accessible`, rola obrazu) z etykietą z `t(klucze.opis_alt)`; części rysunku niedostępne osobno; podpis i kroki jako tekst obok (dynamiczna czcionka). Ruch: rysunki statyczne (fazy jako osobne obrazy), bez animacji w 1.1.
4. **Model liczony raz na kartę i krok** (memo po `id` + numer kroku); czas liczenia w budżecie E3 z pomiarem.

### Konsekwencje
- Dobre: ten sam model co w testach; motyw i kontrast bez plików; ostre przy każdym powiększeniu; wspólna wersja z Treningiem (utrzymanie).
- Złe: nowa zależność natywna (rozmiar, manifest, aktualizacje SDK); renderowanie kilkuset ścieżek na ekranie do zmierzenia na urządzeniu (E3, krok właściciela).
- Od czego zależy: start prac 1.1 (P-179); przegląd 04 wyglądu.

### Potwierdzenie
- Rola 07/08: test komponentu (liczba `<Path>` = części + obwódki + wyróżnienia z modelu; etykieta dostępności z klucza; brak elementów tekstowych w drzewie rysunku); `kontrole-repo` (wiersz ADR-0016 dla `react-native-svg`); `licencje.mjs` bez naruszeń.
- Na urządzeniu (krok właściciela, TestFlight 1.1): rysunek w motywie jasnym, ciemnym i „Zwiększ kontrast”; VoiceOver czyta jeden opis.

## Opcje: zalety i wady
### A — zalety: model = rysunek; motywy z tokenów; dostępność pod kontrolą · wady: zależność natywna.
### B — zalety: pakiet Expo, prostszy komponent · wady: plik na motyw, dekoder iOS z zastrzeżeniem, rysunek nie przechodzi przez model w aplikacji.
### C — zalety: brak nowej zależności · wady: rozmiar paczki × motywy × gęstości, rozmycie przy powiększeniu, brak „Zwiększ kontrast” bez kolejnych plików.
