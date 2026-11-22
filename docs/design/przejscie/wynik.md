# Przejście poznawcze (E3, 2026-10-22) · [OCENA]
Metoda (P-052 (2), P-061 (3a)): klikalny prototyp `docs/design/prototyp.html`, scenorys 5 zadań nagrany automatem (`narzedzia/scenorys.mjs`, lista w `scenorys.txt`), cztery pytania NN/g. Runda 1: cztery niezależne subagenty (nowa osoba, ręce zajęte, VoiceOver, płacący i limit). Runda 2 po poprawkach: jeden niezależny subagent w czterech perspektywach. Bez ludzi: ryzyko szczątkowe (P-041), sprawdzenie po wydaniu przez F-57 i recenzje; powtórka na Expo web w audycie roli 04 po roli 08.

## Wyniki zadań (runda 2)
| Zadanie (przepływ) | Nowa osoba | Ręce zajęte | VoiceOver | Płacący i limit |
|---|---|---|---|---|
| 1 Pierwszy rząd (PR-01) | poz. | poz. | poz. | poz. |
| 2 Cofnięcie serii stuknięć (PR-02, F-47) | poz. | poz. | poz. | poz. |
| 3 Sweter: nazwa, cel, przeniesienie, przypomnienie (PR-03, PR-04, PR-13) | poz. | poz. | neg. → poprawione po rundzie 2 (etykiety pól), bez ponownej oceny | poz. |
| 4 Limit, wariant domyślny (blokada przy stuknięciu) | poz. | **neg.** | poz. | **neg.** |
| 4 Limit, wariant „zawczasu” (decyzja STOP E3) | poz. | poz. | poz. | poz. |
| 5 Ukończenie i włóczka (PR-07, U-9) | poz. | poz. | poz. | poz. |

Runda 1 (przed poprawkami): zadania 2, 4, 5 negatywne w części perspektyw; poprawki opisane w `docs/design/design-spec.md` (komponenty, VoiceOver) i w historii commitów 04 E3.

## Dla roli 03: kolumna „Intuicyjność” (przez bramkę `zmiany-zakresu`)
| Funkcja | Wynik |
|---|---|
| F-01, F-10 (pierwsze +1, nic przed licznikiem) | wynik: pozytywny, 2026-10-22, docs/design/przejscie/wynik.md |
| F-02, F-47 (historia z cofnięciem, strażnik) | wynik: pozytywny, 2026-10-22, docs/design/przejscie/wynik.md |
| F-03 (blokada) | wynik: pozytywny po przeniesieniu do menu ••• z widocznym stanem (kłódka w pasku czytana jako znak płatnej funkcji), 2026-10-22, jw. |
| F-06, F-08, F-14, F-45 (przypomnienie z podglądem, cel, projekt z pierwszego licznika, wpisanie wartości) | wynik: pozytywny, 2026-10-22, jw. (VoiceOver: po poprawce etykiet bez ponownej oceny) |
| F-19, F-37, F-53 (ukończenie, zużycie włóczki, karta) | wynik: pozytywny, 2026-10-22, jw. |
| F-35 i BR-ZAK-005/006 (limit, oferty) | wynik: pozytywny w wariancie „zawczasu” wybranym przez właściciela (P-065 (1a)), 2026-10-22, docs/design/przejscie/wynik.md; wariant kontraktu negatywny (ręce zajęte, płacący); zgodność z KP-12, KP-13 do potwierdzenia przez 02 |
| pozostałe F | czeka na 04 (wzór poziomo F-25/F-26, zegarek F-12, ekran blokady F-11/F-21, kalendarz F-59: makiety w E4 albo audycie) |

## Zgłoszenia do innych ról
- **02 (kontrakt płatności):** wariant „zawczasu” pokazuje stan limitu na ekranie licznika przed pierwszym +1 nowego dnia (zamiast przycisku +1, bez ekranu zakupu) — zgodność z KP-12, KP-13 do potwierdzenia, jeśli właściciel go wybierze. OP-32: −1 na limicie (prototyp pozwala, wpisanie blokuje jak D4).
- **01 (BRD):** BR-LIC-019 bez zmian (P-065 (5a)); BR-ZAK-006 opisuje komunikat przy stuknięciu, a P-065 (1a) przesuwa go zawczasu: ER do 01 po potwierdzeniu przez 02.
- **11 (OP-33):** prośba o ocenę tuż po ukończeniu bywa odbierana jako wymuszanie (soczewka płacącego); rozważyć kolejne uruchomienie po ukończeniu.
