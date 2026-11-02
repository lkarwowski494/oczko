# Poprawki P2, sesja O (rola 08, tryb fix; 2026-11-02)

Gałąź: `claude/kopia-poprawki-o-2026-11-02` (baza: integracja 5, 52d29f8). Polecenie: `oczko-warsztat` c3b0e80 `koordynacja/role-2026-11-01/08-poprawki-p2.md`, sekcja O. Na roboczą nie pushowano. Pliki sekcji K i M (Ustawienia, formularze, Historia, Narzędzia, Stoper, menu akcji, tokeny) i `e2e/` nietknięte.

P-315: analogii w Treningu nie szukałem osobno — obie pozycje mają rozstrzygnięcie 04 w `design-spec.md` (Aneks P2 poz. 3, 8; F-09 :905) i decyzje P-360, P-364; `docs/fakty-wlasciciela.md` nie ma wpisów o tych pozycjach.

## Stan (2 z 2 ID sekcji O)
| ID | Rodzaj | Test (czerwony → zielony) | Commit |
|---|---|---|---|
| (strukturalnie) | — | `WzorPrzegladarka.tsx` 20 413 → 17 515 B (limit 20 480 B): licznik wydzielony do `WzorLicznik.tsx`; testy `wzor-przegladarka`, `przycisk-glowny-obrys`, `wzor-trasa-rysik` bez zmian zielone | 0dcc810 |
| P2-5 | D | `wzor-przegladarka.test.tsx` „P2-5 / F-09 / BR-LIC-012…” — 2 testy (pasek pod wzorem, kolumna obok) czerwone (`licznik-teraz-rzad` obecny) → zielone; strażnik „skończone” zachowuje linię | 044700c |
| P2-9 | D | `uklad-rysik.test.ts` 3 czerwone na asercjach (po zaślepkach zachowujących stare zachowanie) → zielone; `wzor-trasa-rysik.test.tsx` 3 czerwone (brak `narzedzieRysika`, Pen zamiast Highlightera w compact, brak przejścia przy zwężeniu) → zielone; `wzor-przegladarka.test.tsx` „stan wybrany” (2 motywy + Pen) czerwone (promień 14, brak obrysu) → zielone; kontrakt Swift: czerwony po cofnięciu linii w `WidokWzoru.swift` (mutacja) → zielony | 3ad6f10 |

## P2-5: co zmieniono
`StanPrzegladarki.licznik.znaczenie` (wymagane; `app/wzor.tsx` podaje `lw.znaczenie`); `LicznikWzoru` nie rysuje `licznik-teraz-rzad` w trybie `w_trakcie`. Dotyczy paska pod wzorem i kolumny obok (iPad/poziomo). Szukanie: `grep licznik-teraz-rzad src app` → 2 miejsca (`Licznik.tsx:145` już wg F-09, `WzorLicznik.tsx`); naprawione.

## P2-9: co zmieniono
- `src/domena/rysik.ts`: `narzedzieRysika(klasa)` (compact → zakreslacz, regular → pioro), `narzedzieDlaKlasy(n, klasa)` (Pen → Highlighter w compact), `poPierwszymRysiku(s, klasa)`.
- `app/wzor.tsx`: efekt na zmianę `uklad.klasa` (regular → compact z Pen daje Highlighter; compact → regular zostawia Highlighter), `poPierwszymRysiku(…, uklad.klasa)`, prop `narzedzieRysika` dla widoku natywnego.
- **Natywne (spec tego wymaga: „od razu rysuje zakreślaczem”):** widok natywny sam wybiera narzędzie przy pierwszym rysiku (nie czeka na JS), więc dodany prop `narzedzieRysika` (`modules/oczko-wzor/index.ts`, `OczkoWzorModule.swift`, `WidokWzoru.swift`: pole, setter, `ustawNarzedzie(narzedzieRysika)` w `pierwszyRysik`). **Swift nieskompilowany w Linuksie** — kompilację sprawdzi `swift-test` / build na macOS w przebiegu CI; test kontraktu jest statyczny.
- Stan wybranego narzędzia (`wybrane` w `WzorPrzegladarka.tsx`): obrys 2 pt `przyciskObrys`, promień `promien.pole` (10), tło `papierGrupa`, 44 pt (`ikona.minWidth/minHeight`); dotyczy też Pen w regular (spec: „wybrany jak zakreślacz”). Etykieta „Highlighter” + stan `selected` (VoiceOver: „Highlighter, selected”) — już była, dodany test.

## Dowody
Zrzuty przed/po: niewykonane (Linux, bez symulatora); dowód wizualny = asercje stylu na prawdziwych tokenach w obu motywach. Wygląd paska compact i pierwszy rysik rysikiem na iPadzie — próbka u właściciela/07 na urządzeniu (P-226: brak testu z prawdziwym rysikiem).
Pełny `verify`: patrz wiadomość do koordynatora (hash, kod, liczby).

## Nowe znaleziska / pytania (bez poprawek)
1. **Pasek licznika w trybie „rząd w trakcie” bez podpisu przy liczbie (P, brzegowy):** F-09 mówi „podpis `current row` zamiast `rows`, bez linii”, ale pasek pod wzorem nie miał nigdy podpisu jednostki, więc po P2-5 jest tam sama liczba. Opcje: A (wdrożone, literalnie wg polecenia) — sama liczba, zero nowych tekstów; B — w tym trybie pod liczbą podpis `licznik.jednostka_w_trakcie` („current row”), spójny z ekranem licznika, ale nowy element w pasku. Rekomendacja: B po akceptacji 04 (VoiceOver czyta wtedy „48, current row”).
2. `docs/architektura/moduly.md:304` (rola 05): lista właściwości `WidokWzoru` nie zna `narzedzieRysika`.
3. Symbole SF (P2-3) — zgodnie z poleceniem poza tą sesją; ta sama część paska (`narzedzie(...)` z glifami 🖍 ✎ ⌫ ↶) po zmianach tej sesji.
4. Zdanie do ZM-11 (03): w oknie compact pierwszy rysik wybiera Highlighter — wdrożone zgodnie z propozycją 04.
