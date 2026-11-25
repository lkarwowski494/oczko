# ZR8-1 — czy zrzuty wydanej wersji można zmienić bez nowej wersji? (źródło Apple, pobrane 2026-11-25)

Pytanie (KO-201): wersja 1.0 (build 1221) jest „Ready for Distribution”. Czy zrzuty ekranu można w niej zmienić, czy dopiero w 1.0.1 z nowym buildem i przeglądem?

**Odpowiedź (WNIOSEK Z CYTATÓW — nie dosłowne zdanie Apple o zrzutach):** zrzuty są metadanymi wersji; Apple nie wymienia ich wśród własności edytowalnych „w dowolnej chwili bez nowej wersji”, więc zmiana zrzutów wydanej wersji wymaga **nowej wersji (1.0.1) z nowym buildem wysłanym do App Review**. Własności „edytowalne bez nowej wersji” istnieją (np. teksty promocyjne), ale zrzutów w tej grupie nie potwierdzono: tabele na stronie Apple są renderowane skryptem i nie dają się odczytać jako tekst (pobranie `curl`, bez przeglądarki). **Otwarte (krok właściciela, bez wysyłki):** w App Store Connect, w wersji 1.0 „Ready for Distribution”, sprawdzić, czy pole zrzutów jest aktywne — jedno spojrzenie rozstrzyga ostatecznie.

## Cytaty (dosłownie, strona angielska, odczyt 2026-11-25)

1. „The tables also indicate the properties that can be localized and edited at any time without submitting a new version of your app.” — https://developer.apple.com/help/app-store-connect/reference/app-information/required-localizable-and-editable-properties/
2. Przypis 4 tej samej strony: „Can be entered at any time, but will be submitted for review with the next version submission.” (dla własności z tą adnotacją zmiana idzie do przeglądu przy następnej wersji).
3. „If an app status indicates as editable below, you can edit app metadata when the app has this status.” — https://developer.apple.com/help/app-store-connect/reference/app-information/app-and-submission-statuses/ (tabela „Editable” też skryptowa; z opisu statusu: „Ready for Distribution — Your app has been accepted and is ready for distribution.”).
4. Zrzuty i podglądy: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-your-app-store-assets/ („Upload app previews and screenshots to showcase your app or game in action… You can also add app previews and screenshots for other devices and localizations, or archive ones you no longer need.”) — bez zdania o wydanej wersji.
5. Tworzenie nowej wersji: https://developer.apple.com/help/app-store-connect/update-your-app/create-a-new-version/

## Skutek dla planu
Poprawione zrzuty (03 i 04, wszystkie języki) wejdą do App Store dopiero z wersją 1.0.1 (build od `main`, wysyła właściciel) albo — jeśli sprawdzenie w App Store Connect pokaże aktywne pole zrzutów w wersji 1.0 — bez nowego buildu. Wybór: koordynator i właściciel (wysyłka do Apple u właściciela, P-087).
