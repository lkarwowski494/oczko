# 0012. Rysik i zakreślacz palcem: jeden natywny widok PencilKit nad stroną PDF (Expo Modules API), zapis `PKDrawing` jako plik na stronę
Data: 2026-10-22 · Status: **przyjęta** (P-071) · Rola: 05 (E1) · Zależy od: P-042, F-28, F-56, F-26, ADR-0001, ADR-0007, ADR-0011

## Kontekst i problem
Na iPadzie rysik pisze od razu, a palec przewija (`PKCanvasViewDrawingPolicy.pencilOnly`: „Pencil touches are the only input that draw on the canvas”, P-042); na iPhonie zakreślacz palcem jednym narzędziem (F-56). `anyInput`: „Allows drawing on the canvas from any input source” (iOS 13+; rejestr Apple 16). `PKDrawing.dataRepresentation()` serializuje rysunek (rejestr Apple 6).

## Czynniki decyzji
Odrzucanie dłoni zapewnia system (P-041: test automatem) · jedna technika dla iPhone'a i iPada · rozmiar danych (ok. 40 KB/stronę, E0 §3).

## Rozważane opcje
A. Widok natywny `PKCanvasView` nad `PDFView` (PDFKit) jako moduł Expo; polityka `pencilOnly` przy podłączonym rysiku, `anyInput` w trybie zakreślacza na iPhonie; rysunek strony jako plik `<sha256>.pkdrawing` (ADR-0001), w bazie odwołanie do (wzór, strona).
B. Rysowanie w React Native na `react-native-svg` (ścieżki SVG z gestów), dla palca i rysika.

## Decyzja
Opcja A.

### Konsekwencje
- Dobre: systemowe odrzucanie dłoni i narzędzia (zakreślacz, gumka); format Apple stabilny między wersjami.
- Złe: moduł natywny; `PKDrawing` nie jest czytelny poza Apple (eksport rysunków do PDF jako warstwa przy eksporcie wzoru — decyzja w E2, jeśli kontrakt tego wymaga; BR nie wymaga).

### Potwierdzenie
- Test UI (07, symulator iPad): w trybie `pencilOnly` przeciągnięcie palcem przewija i nie dodaje kresek (`drawing.strokes.count` bez zmian); test XCTest: `PKDrawing(data:)` z zapisanego pliku daje tyle samo kresek.
- Plik rysunku zapisany przez kolejkę plików z SHA-256 (spójność, ADR-0001).

## Uzupełnienie 2026-10-25 (fix 05: Z07-17; decyzja A bez zmian)
- **Kiedy zapis rysunku:** po każdej zmianie rysunku z opóźnieniem ≤ 1 s od ostatniej kreski (`RYSUNEK_ZAPIS_MS`) i natychmiast przy przejściu w tło (`AppState → background`, zapis krótki, pod `CzasWTle.chron`) oraz przy zmianie strony i zamknięciu wzoru. Każdy zapis tworzy nowy plik `<sha256>.pkdrawing` i jednym zapisem w kolejce przestawia odwołanie `rysunek.plik_sha256`; poprzedni plik bez odwołań usuwa sprzątanie (moduly.md, „Sprzątanie plików”). Zabicie procesu traci najwyżej kreski z ostatniej sekundy.

## Opcje: zalety i wady
### A — zalety: system robi trudną część · wady: Swift, test tylko w symulatorze.
### B — zalety: czysty JS · wady: brak odrzucania dłoni (rdzeń P-042), własna obsługa nacisku i wygładzania.

## Uzupełnienie 2026-10-26 (fix-7 05: NZ-P217-05, P-221 Q1a, P-218 Q2a, P-220 W5a, W6a; decyzja A bez zmian)
- **Technika nakładki:** `PKCanvasView` nad każdą stroną przez `PDFView.pageOverlayViewProvider` (`PDFPageOverlayViewProvider`, iOS/iPadOS 16+, odczyt 2026-10-26), w jednym widoku natywnym `WidokWzoru` modułu `oczko-wzor`; płótno ma rozmiar strony, a zoom i przewijanie robi `PDFView`. Odrzucone: pakiet PDF w React Native z osobnym płótnem (synchronizacja zoomu przez most, dwie zależności natywne; P-221 Q1b).
- **iPad bez rysika (P-218 Q2a):** zakreślacz palcem jak na iPhonie; polityka `pencilOnly` od pierwszego dotknięcia rysikiem na otwartym wzorze. Pasek narzędzi własny (P-220 W5a; iPhone: Highlighter, Eraser, Undo, Done; iPad: Highlighter, Pen, Eraser, Undo), kolor zakreślacza z tokenów 04 (W6a).
- Potwierdzenie: XCTest W3 (`pencilOnly`: przeciągnięcie palcem nie zmienia `drawing.strokes.count`), test `zapiszRysunek` (moduly.md, „Kontrakt partii 6”).
