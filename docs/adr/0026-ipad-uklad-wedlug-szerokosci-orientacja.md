# 0026. iPad w 1.0: `supportsTablet`, orientacja domyślna bez `UIRequiresFullScreen`, układ według szerokości okna, pion na iPhonie poza ekranem wzoru
Data: 2026-10-26 · Status: **przyjęta** (P-221 Q3a, Q4a; koordynator wg P-087) · Rola: 05 (fix-7, NZ-P217-05) · Zależy od: P-217, P-218 Q3a, P-220 W1a, W4b, ADR-0006, ADR-0009, ADR-0011, ADR-0012

## Kontekst i problem
P-217 włącza do 1.0 pisanie po wzorze rysikiem (F-28), a ono wymaga iPada. Do tej pory aplikacja była tylko na iPhone'a i tylko w pionie (`app.json`: `"orientation": "portrait"`, `"supportsTablet": false`, `UIRequiresFullScreen: true`). BR-WZR-005 wymaga wzoru i licznika obok siebie na telefonie w poziomie, a NFR-UKL-001 (P-218 Q3a) iPada w obu orientacjach i w wąskim oknie.

## Czynniki decyzji
- Apple, TN3192 (odczyt 2026-10-26): „Starting in iPadOS 26, `UIRequiresFullScreen` and its associated compatibility mode are deprecated”; „Starting in iOS 27 and iPadOS 27, `UIRequiresFullScreen` no longer opts your app out of resizing on either platform” przy budowaniu z SDK 27. Warunki aplikacji o zmiennym rozmiarze: ekran startowy i wszystkie orientacje.
- `UIRequiresFullScreen` (dokumentacja klucza, odczyt 2026-10-26): „Opting out of iPad multitasking and dynamic resizing is deprecated”.
- `WCSession.isSupported()` zwraca false na urządzeniach bez parowania zegarka („Session objects are … available on iPhones that support pairing with an Apple Watch”), więc zegarek (ADR-0009) na iPadzie nie działa.
- Live Activity działa na iPadzie („On iPad and iPhone, it appears on the Lock Screen…”, ActivityKit), bez Dynamic Island.
- Liczba ekranów do przeprojektowania przez 04 i liczba scenariuszy E2E.

## Rozważane opcje
- A. `supportsTablet: true`, `orientation: "default"`, bez `UIRequiresFullScreen`; na iPhonie pion wszędzie poza ekranem wzoru (pierwotnie przez `expo-screen-orientation` 57.0.3; od 2026-10-27 opcja `orientation` ekranów react-native-screens, P-259 — niżej); na iPadzie bez blokad, układ według szerokości okna.
- B. Jak A, ale bez nowej zależności: wszystkie ekrany iPhone'a działają też poziomo.
- C. iPhone tylko w pionie, wzór obok licznika tylko na iPadzie.

## Decyzja
Wybrano A (P-221 Q3a). Blokada pionu na iPhonie poza ekranem wzoru oszczędza przeprojektowania pozostałych ekranów, a usunięcie `UIRequiresFullScreen` i tak będzie wymagane od SDK 27. Na iPadzie nie blokujemy orientacji, bo wielozadaniowość jej nie dopuszcza. Układ zależy od szerokości okna (compact = układ telefonu, regular = kolumna maks. 640 pt; P-220), nie od orientacji. E2E iPada to osobne zadanie nocne z własnym pakietem (P-221 Q4a).


**Adnotacja 08 (2026-10-27, P-259 wariant A; przejrzana przez 05 2026-10-27 — przyjęta, szczegóły w `moduly.md` „iPad i orientacja”):** mechanizm blokady pionu zmieniony bez zmiany decyzji A: zamiast `expo-screen-orientation` (usunięty, ADR-0016) opcja `orientation` ekranów react-native-screens — `portrait_up` na iPhonie poza `/wzor`, `all` na `/wzor` i na iPadzie wszędzie (reguła `orientacjaEkranu` w `src/domena/uklad.ts`, `app/_layout.tsx`). Powód: pakiet przy każdym starcie wysyłał żądanie obrotu (także w pionie) i podmieniał główny kontroler; react-native-screens prosi o obrót tylko, gdy bieżąca orientacja jest poza maską (P-258: dowód z logów symulatora). Punkt „Złe: nowa zależność natywna” nieaktualny.

### Konsekwencje
- Dobre: F-28 i F-25 bez osobnej aplikacji; wąskie okno działa jak telefon; zgodność z SDK 27.
- Złe: ~~nowa zależność natywna (`expo-screen-orientation`)~~ nieaktualne od P-259 (orientację deklaruje react-native-screens, zależność już obecna); każdy istniejący ekran trzeba sprawdzić w szerokości regular (zrzuty E2E iPada); zegarek i Dynamic Island na iPadzie nie istnieją (stany 04).
- Od czego zależy: recenzja Apple 2.4.1 (aplikacja na iPadzie ma działać na iPadzie) — kontrola zrzutami przed wysłaniem (rola 10).

### Potwierdzenie
- Orientacja (P-259): test reguły `orientacjaEkranu` w Node (`tests/domena/wzor/orientacja-ekranu.test.ts`) (iPhone: `portrait_up` poza `/wzor`, `all` na `/wzor`; iPad: `all`) i brak `expo-screen-orientation` w `package.json`; modal otwierany z wzoru dostaje maskę wzoru (przegląd przy każdej nowej trasie z `app/wzor.tsx`).
- `app.json` po łatce L3a: `supportsTablet: true`, `orientation: "default"`, brak `UIRequiresFullScreen` (kontrola po prebuild, rola 07: `Info.plist` bez klucza, `UISupportedInterfaceOrientations~ipad` z czterema orientacjami).
- Test ekranu `tests/akceptacja/ekrany/wzor-ipad.test.tsx` (układ według szerokości) i pakiet E2E `ipad` (moduly.md, „Kontrakt partii 6”).
- Test adaptera zegarka: `isSupported() == false` → brak wyjątku, `wyslijStan`, `potwierdz` no-op (XCTest po prebuild, okno maszyn).
- Wąskie okno (Split View): ryzyko szczątkowe, sprawdzenie na iPadzie przy TestFlight (lista TT, rola 07).

## Opcje: zalety i wady
### A — zalety: najmniej ekranów do zmiany, zgodność z SDK 27, F-25 na telefonie · wady: ekrany do sprawdzenia na iPadzie (zależność natywna `expo-screen-orientation` usunięta, P-259).
### B — zalety: bez zależności · wady: każdy ekran w dwóch orientacjach u 04 i w E2E.
### C — zalety: najmniej pracy · wady: łamie BR-WZR-005 („telefon stoi poziomo”).
