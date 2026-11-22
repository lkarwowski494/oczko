# Oczko — plan do 1.0 i 1.1 (stan 2026-10-26, 16:20)

Autor: koordynator (sesja „Main: Oczko”). Czasy to **[OCENA]** liczona z tempa zmierzonego 26.10: partia 5, grupy A i C oraz zaległości, zajęła ok. 1 h 40 min agenta wobec szacunku roli 23–30 h. Okno maszyn macOS: od północy do ok. 15:00 czasu polskiego (P-187).
Poprzednia wersja planu (25.10, 14–21 dni agentów) — w historii git tego pliku.

## Stan
- Inwentaryzacja MVP w kodzie (`oczko-warsztat/koordynacja/2026-10-26-inwentaryzacja-mvp.md`, P-181): rano 18 z 51 funkcji zrobionych. Karta Pro po imporcie jest poza 1.0 (P-189).
- Partia 4 przyjęta (P-180). Partia 5: grupy A (projekt i części) i C (kosz) gotowe na bramce Linux (P-188), CI iOS w oknie maszyn. W toku: grupy B (sesje, kalendarz), D (narzędzia, zapas, zdjęcia, karta), E (język, stan zegarka). Makiety B i D: 04 fix-6 (P-191). Równolegle 12: niezawodność E2–E3.
- Zakres 1.0: kierunek C (P-181), do potwierdzenia na przeglądzie zakresu MVP przez właściciela 27–28.10.

## Plan do 1.0 (kierunek C)
| Kiedy | Co | Właściciel |
|---|---|---|
| 26.10 wieczór | 08: B, D, E na bramce Linux; 04 fix-6; 12 E2–E3; zbiorczy przegląd 05/07/01 | 0 |
| 27.10 noc i rano | CI iOS całej partii 5 → STOP E2 | 0 |
| 27–28.10 | **przegląd zakresu MVP**; wzór w minimum: import PDF, przeglądarka obok licznika, znacznik rzędu (Swift, testy w oknie rano) | ~30 min |
| 28–29.10 | 04 audit i poprawki; 09 przekład 35 języków przez API (≤ 6 USD, P-144); 10 strona prywatności, metadane, workflow TestFlight; 07 audyt zmian | sekrety podpisu i token CloudKit ~30 min |
| ~31.10–1.11 | **TestFlight** | test na telefonie i zegarku 45–75 min |
| ~2–6.11 | pełny audyt przed App Store, poprawki blokerów, weryfikacja patentowa funkcji wzoru (P-024) | 0 |
| ~7–8.11 | App Store Connect, „Submit for Review” | 1–1,5 h, scalenie do `main` |
| ~10–14.11 | przegląd Apple [OTWARTE: brak źródła na czas], wydanie ręczne | odpowiedź, jeśli Apple zapyta |

Ryzyka terminu: okno maszyn macOS (każda poprawka natywna to dzień kalendarza), tygodniowy limit konta, pytania Apple, wynik przeglądu zakresu.

## Plan 1.1 (ok. 4–6 tygodni po premierze; nominacja „App Enhancements” min. 3 tygodnie przed, P-147)
| Co | Ustalenia |
|---|---|
| **Atlas technik** w aplikacji i na stronie (P-093, P-095, P-179) | 31 pozycji (5 tabel słownikowych, 26 kart technik, słownik skrótów F-44); języki z przeczytanym źródłem terminologii: en, sv, pt-BR, potem pl (OP-12) |
| **Rysunki SVG z danych, bez tekstu** (P-192) | Jeden plik SVG na wszystkie języki, bez elementów `<text>` i skrótów. Są tylko geometria, strzałki, numery kroków i własne glify. Podpis, opis kroków i tekst VoiceOver idą przez `t()` i przekład API. Test generatora: żadnych liter w SVG. Bez generatora obrazów AI (P-178) |
| **Reszta wzorów** z 1.0 | zakreślanie (F-56), Apple Pencil (F-28), WWW i Word (F-55), zdjęcie → PDF i rozszerzenie udostępniania (ADR-0011), układ poziomy |
| **iCloud** (F-27) | adapter CloudKit, ukryty w 1.0 (P-091 (1)) |
| Do wyboru po premierze | Siri (F-13), kalkulatory F-39/F-42, szacunek czasu F-22/F-62 — według danych z App Store |
| Właściciel | decyzja o domenie strony atlasu (koszt) przy starcie 1.1 |

## Co tylko właściciel (P-087)
koszty (przekład ≤ 6 USD bez pytania, domena), sekrety podpisu i token CloudKit, App Store Connect i „Submit for Review”, scalenie do `main`, przegląd zakresu MVP, test TestFlight na urządzeniu, PDF-y książek do OCR (bez terminu).
