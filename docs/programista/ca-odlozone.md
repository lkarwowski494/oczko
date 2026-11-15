# CA — odłożone (poza zatwierdzonym zakresem BY-001…003)

Źródło: `docs/design/audyt-przeplywow-2026-11-15.md` (rola 04, audyt BY) i przegląd mechanizmu BY-002 przez rolę 08 (2026-11-15). Bez kodu; decyzje należą do koordynatora (P-087). Wpis decyzji: P-845.

## Znaleziska P3 z raportu BY (tylko wpis)
| ID | Rodzaj | Co | Opcje z audytu · rekomendacja audytu |
|---|---|---|---|
| 04-studio-projektowe-004 | P | Karta ukończenia: jedno „Gotowe”, bez cofnięcia pomyłki i bez słowa, gdzie jest „Wznów projekt” (`src/ekrany/Ukonczenie.tsx:50`, `app/menu.tsx:54-58`; zapis bez pytania to P-255 (2)) | (a) tekstowy przycisk „Wznów projekt” na karcie, (b) zdanie pod kartą, (c) bez zmian · (a) |
| 04-studio-projektowe-005 | D | Trzy systemowe wybory daty skonfigurowane na trzy sposoby: inny początek tygodnia i język niż „Historia” (`FormularzeProjektu.tsx:198`, `Projekt.tsx:237`, `Formularze.tsx:171`, `HistoriaDni.tsx:71`) | (a) język aplikacji i spójny początek tygodnia, jeśli biblioteka 9.1.0 pozwala, (b) „Historia” na początek tygodnia z regionu (zmienia RD-20) · (a) |
| 04-studio-projektowe-006 | D | Systemowy niebieski akcent w kalendarzach i kursorze pól zamiast akcentu z tokenów | (a) akcent z tokenów w `Pole` i dwóch kalendarzach, (b) globalny kolor akcentu iOS · (b) przy kontraście ≥ 3:1 |
| 04-studio-projektowe-007 | D | Arkusz nazwy: „Część” nad „Projektem”, odwrotnie niż makieta (`src/ekrany/Formularze.tsx:209-210`, `docs/design/prototyp.html:130`) | (a) „Projekt” nad „Częścią”, (b) zostaje z zapisaną decyzją · (a) |

## Wystąpienia mechanizmu BY-002 poza poprawką (surowa nazwa na ekranie)
- Kosz („Recently deleted”): usunięta część z nazwą zapasową (data) pokazuje datę jako nazwę pozycji (`src/przypadki-uzycia/widok-kosza.ts`, `src/kompozycja/projekt.ts` `stanKosza`).
- Formularz „What’s next?” (`co-dalej`): `czesc` i `projekt` z `src/przypadki-uzycia/czesc.ts:91` idą bez etykiety — przy projekcie roboczym pokazują surową datę (dotyczyło też stanu sprzed BY-002; nie regresja).
- Realność: brzegowy (kosz i koniec ostatniej części projektu roboczego); stwierdzone czytaniem kodu, bez testu. Poprawka wymaga etykiety w modelu odczytu; do decyzji, czy dołożyć do kolejnej partii.

## „Do sprawdzenia” z audytu BY (pewność ≤ 80%, nikt nie sprawdzał)
1. Kafel „Dodaj wzór” w projekcie z wzorami: menu dostaje pustą listę, stuknięcie w „Dodaj wzór” zwija menu (`app/wzor.tsx`, `WzorGrupa.tsx:61`).
2. `StanWczytywania` pokazuje wyjście dopiero po błędzie (przy zawieszonym odczycie zostaje gest) — teoretyczne; test trwały BY-001 sprawdza tylko obecność propsu `wyjscie`.
3. iPad: wąska kolumna poza wzorem, piąty przycisk akcji licznika zawija się.
4. Położenie „Zamknij” (prawy górny róg vs tekst na dole): „Oczko Pro” vs „Dane i synchronizacja”.
5. Jasny motyw, AX5, VoiceOver na prawdziwej aplikacji (scenariusze 29, 30; części 2–3 artefaktów CI).
6. Zegarek (watchOS 10.6.2) na urządzeniu.

## Znane ograniczenia testu trwałego BY-001 (`tests/narzedzia/wyjscia-tras.ts`)
- Statyczny: widzi obecność elementu wyjścia w komponencie renderowanym przez gałąź (do 5 poziomów), nie jego położenia, widoczności warunkowej ani działania — to zrzuty i scenariusze E2E (sesja BX).
- Wyjątki (układy, korzenie zakładek) są w pliku testu z powodem; nowy wyjątek wymaga wpisu z powodem w przeglądzie.
