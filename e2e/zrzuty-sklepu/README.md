# Zrzuty sklepu — przepływy Maestro (rola 07, P-319)

Przepływy sterują aplikacją buildu E2E w symulatorze, żeby przeprowadzić ją do sześciu kadrów z planu `docs/wydanie/metadane/zrzuty-plan.md`; sam zrzut robi skrypt `scripts/ci/zrzuty-sklepu.sh` (`xcrun simctl io … screenshot`, natywny rozmiar symulatora: iPhone 17 Pro Max 1320×2868, iPad Pro 13″ 2064×2752). To **nie są scenariusze testowe**: leżą poza `e2e/scenariusze/`, więc nie wchodzą do planu części ani do pakietów `podstawowy`/`pełny` i nie liczą się w bramce.

- Dane: kontener aplikacji dostaje przed każdym kadrem świeżą bazę `oczko.db` i pliki wzoru z generatora `tests/narzedzia/zrzuty-sklepu-ziarno.ts` (bez zmian w kodzie aplikacji); „teraz” = argument `oczkoE2eTeraz` z `podsumowanie.json` (2026-11-12T09:41:00).
- Zmienne: `TERAZ` (czas lokalny ISO) i `KLASA` (`iphone` albo `ipad`); iPad w kadrze 2 i 3 obraca się do poziomu (wzór obok licznika, BR-WZR-005/S2).
- Selektory tylko z tabeli testID w `e2e/README.md` (pilnuje `tests/jakosc/zrzuty-sklepu.test.ts`), plus jedna etykieta VoiceOver „Previous month” (`dni.poprzedni_miesiac_a11y`).
- Kadry: 01-licznik, 02-wzor, 03-zakreslenie, 04-projekty, 05-historia, 06-kalendarz. Kadr 2 i 3 zależą od warunku OG-07 (weryfikacja patentowa funkcji wzoru, etap 4): bez niej odpadają (plan zrzutów).
- **Nie uruchomione na macOS** (faza A sesji 07 bez maszyn): położenie zakreślenia (swipe) i obrót iPada to założenia do potwierdzenia pierwszym przebiegiem z `[zrzuty-sklepu]`.
