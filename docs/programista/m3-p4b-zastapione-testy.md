# M3 p4b — zastąpione testy (rola 08, build, 2026-11-08)

Zasada: testów zachowania i testID nie zmieniano; zmieniono tylko asercje wyglądu, których wartość wprost przeczy decyzji 04 (M3-MAK-01, `projekt.naglowekGrupy`).

| Plik | Test | Było | Jest | Powód |
|---|---|---|---|---|
| `tests/ekrany/projekt-naglowki-sekcji-13.test.tsx` | „motyw jasny/ciemny: wszystkie nagłówki … projektu” (6 nagłówków: Parts, Time, Note, Photos, Pattern, Details) | 13 pt (`typografia.mala.pt`), bez pogrubienia, kolor `tekst2` | `tokeny.projekt.naglowekGrupy`: 17 pt, `'700'`, kolor `tekst`; nazwa testu zaktualizowana | design-spec „Projekt” (M3-MAK-01/03): jeden poziom nagłówka grupy w systemie Dzianiny; zastępuje 13 pt `tekst2` (H-1c starego systemu) |
| `tests/ekrany/projekt-naglowek-zdjec.test.tsx` | „motyw jasny/ciemny: „Photos” ma ten sam krój, rozmiar, wagę i kolor co „Parts”” | punkt odniesienia `fontWeight` `undefined` (bez pogrubienia) | punkt odniesienia `'700'`; sens testu (Photos = Parts) bez zmian | ten sam powód: nagłówek grupy 17 pt / 700 / `tekst` |
| `tests/ekrany/narzedzia-probka.test.tsx` | alert błędu próbki | `props.children` alertu = `'! Enter the stitches in your swatch first.'` | `props.accessibilityLabel` = `'Enter the stitches in your swatch first.'` i widoczny tekst zdania | `Komunikat` ze `znak`: „!” w kółku (osobny element ukryty przed VoiceOver) zamiast glifu „! ” w tekście; alert jest teraz widokiem z etykietą (M3-MAK-02, `arkusz.blad`) |
| `tests/ekrany/zapas.test.tsx` | alert długości włóczki | `props.children` = `'! Enter a number above 0.'` | `accessibilityLabel` = `'Enter a number above 0.'` i widoczny tekst | jak wyżej |
| `tests/ekrany/m1-196-tysiace.test.tsx` | alert formatu liczby | `props.children` = `'! Write it as 1094.'` | `accessibilityLabel` = `'Write it as 1094.'` i widoczny tekst | jak wyżej |
