# M3 p3b: testy zastąpione albo zmienione przy wdrożeniu wzoru

2026-11-08 · rola 08 · gałąź `claude/kopia-08-p3b-2026-11-08`. Zmiany **wartości wyglądu i struktury liczby** (P-553, M3-S3-03) oraz kolejności zrzutów po usunięciu kroku `wzor-dodaj` (P-584, P-588); zachowanie (teksty, etykiety VoiceOver, testID, zapis) bez zmian. Bez `.skip`, bez poluzowanych progów.

| Plik | Test | Stara asercja | Nowa asercja | Powód |
|---|---|---|---|---|
| `tests/ekrany/wzor-przegladarka.test.tsx` | iPhone pionowo (W1a); P2-5 „rząd w trakcie” (2) | `licznik-wartosc`.`props.children` = '47' / '48' | `licznik-wartosc`.`props.accessibilityLabel` = '47' / '48' | liczba w komórkach stałej szerokości (`Liczba`, M3-S3-03): testID na elemencie z etykietą, cyfry w `licznik-wartosc-cyfra-N` |
| `tests/ekrany/wzor-przegladarka.test.tsx` | P-262 (b) kolumna; pasek pionowo | `fontSize` na `licznik-wartosc` | `fontSize` na `licznik-wartosc-cyfra-0` (ta sama wartość z tokenu `liczbaPaskaWzoru`) | jw. |
| `tests/ekrany/wzor-rysunek-natywny-blad.test.tsx` | M1-111 (07-jakosc-513) | `licznik-wartosc`.`props.children` = '7' | `…accessibilityLabel` = '7' | jw. |
| `tests/ekrany/przycisk-glowny-wypelniony.test.tsx` | „+1 row” w pasku licznika pod wzorem | wypełnienie przycisku głównego (`przycisk`, obrys) | `akcent`, tekst `naAkcencie`, bez obrysu (jak „+1” licznika, p3a) | makieta `wzor` (`.pasek-wz .p`) |
| `tests/jakosc/e2e-noc-2026-11-02.test.ts` | lista zrzutów NOC-2b, wiersze 21 i 22 | po: `assertVisible wzor-dodaj`, przed: `tapOn wzor-dodaj` | po: `assertVisible e2e-wzor-pdf-skan` / `e2e-wzor-zdjecie`, przed: `tapOn` tego samego | krok `wzor-dodaj` usunięty (ZM-06, P-584, P-588); zrzut „ekran-dodaj-wzor” nadal przed wyborem źródła |

## Nowe testy
`tests/ekrany/wzor-zrodla-od-razu.test.tsx` (4), `tests/ekrany/dzis-kafel-dodaj-wzor.test.tsx` (3), `tests/ekrany/wzor-pasek-dzianina.test.tsx` (17).
