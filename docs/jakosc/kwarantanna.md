# Kwarantanna testów (strategia §7; wzorce roli 07, „Polityka niestabilnych testów” pkt 4)

Test w kwarantannie biegnie dalej informacyjnie i nie jest liczony jako zaliczenie. Wpis ma ID testu, właściciela (rolę), termin najwyżej do następnego wydania i kontrolę zastępczą (zasada wspólna 7). Wpis znika razem z poprawką albo decyzją koordynatora. Format pilnuje `tests/jakosc/dokumenty-jakosci.test.ts` (048).

| ID testu | Gdzie | Od | Właściciel | Termin | Kontrola zastępcza | Powód i stan |
|---|---|---|---|---|---|---|
| `testW1WordNaPdf` (W1) | `modules/oczko-wzor/TestyOknaMaszyn/Testy/EksperymentyTests.swift`, zadanie `eksperymenty-wzoru` w `jakosc-ios.yml` (`continue-on-error`, P-261) | #138 (2026-11-02) | 08-programista (moduł wzoru, partia 6); diagnoza porażki: 07-jakosc | przed wysłaniem 1.0.0 (P-300) | konwersja Word → PDF w aplikacji na symulatorze: scenariusze `25-br-wzr-007-s2-plik-word.yaml` i `53-p-282-word-tabela-obraz.yaml` (zielone w #139); import `.docx` przez trasę `/wzor`: `wzor-trasa-plik-word.test.tsx` | przekroczenie czasu 60 s przy każdym z 3 plików `.docx` w #138, #139 i #140 (07-jakosc-009); `testW1StronaBezSieciToBrakSieci` i W2–W3 zielone. Przyczyna nieustalona: [DO USTALENIA] (limit czasu testu na zimnym symulatorze albo konwersja); klasyfikacja wg §7 przy następnym przebiegu. |
