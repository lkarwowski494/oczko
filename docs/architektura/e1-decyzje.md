# E1 Decyzje (rola 05-architekt, build) · 2026-10-22 · STOP E1 przyjęty (P-071: 4a, 5a, 6b; pozostałe ADR bez weta)
Wejście: E0 (`e0-rozpoznanie.md`) przyjęte P-070. ADR w `docs/adr/` (format MADR, szablon roli). Kontrola formalna: `eksperymenty/e1/kontrola-adr.mjs docs/adr` → 15/15 OK, kod wyjścia 0 (`kontrola-adr.out`); próba negatywna (ADR bez „Potwierdzenia”, ADR z jedną opcją) → 2 błędy, kod wyjścia 1.

## Indeks ADR
| ADR | Decyzja (skrót) | Status |
|---|---|---|
| [0001](../adr/0001-przechowywanie-sqlite-pliki-poza-baza.md) | SQLite w `Application Support`, WAL, pliki poza bazą z SHA-256; warianty JSON, klucz-wartość, BLOB rozważone | **przyjęta** (P-071) |
| [0002](../adr/0002-sciezka-zapisu-jedna-kolejka.md) | jedna kolejka zapisów na połączeniu z `foreign_keys = ON`; zakaz `withExclusiveTransactionAsync` | **przyjęta** (P-071) |
| [0003](../adr/0003-granice-modulow-i-stan-interfejsu.md) | domena w czystym TS z portami; stan UI w komponentach i kontekście, baza jedynym źródłem prawdy | **przyjęta** (P-071) |
| [0004](../adr/0004-kopia-eksport-import.md) | archiwum `.oczko` (`VACUUM INTO` + pliki + manifest), import scal/zastąp, nowsza wersja odrzucona | **przyjęta** (P-071 (4a)) |
| [0005](../adr/0005-synchronizacja-icloud-cloudkit-dziennik.md) | CloudKit prywatny przez `CKSyncEngine`, zdarzenia z rodzicami, konflikt pokazany | **przyjęta** (P-071) |
| [0006](../adr/0006-minimalne-wersje-ios-18-watchos-11.md) | iOS 18 / watchOS 11, zegarek 10.0 od 2026-11-15 | **przyjęta** (P-070), uzupełniona (P-819) |
| [0007](../adr/0007-cele-natywne-apple-targets-i-moduly-expo.md) | cele Swift przez `@bacons/apple-targets`, mosty Expo Modules API; wspólne wektory Swift/TS | **przyjęta** (P-071) |
| [0008](../adr/0008-plus-jeden-z-ekranu-blokady-dziennik.md) | `LiveActivityIntent` dopisuje do dziennika `.jsonl`, aplikacja scala; limit na ekranie blokady | **przyjęta** (P-071) |
| [0009](../adr/0009-zegarek-transport-limit-pro.md) | `transferUserInfo` + kontekst; Pro z telefonu i StoreKit na zegarku (zamyka OP-22) | **przyjęta** (P-071) |
| [0010](../adr/0010-zakupy-expo-iap-5-8-1.md) | `expo-iap` 5.8.1 przypięte jak Trening (6.x nie spełnia reguły 14 dni) | **przyjęta** (P-071) |
| [0011](../adr/0011-import-wzorow-rozszerzenie-pdf.md) | rozszerzenie → skrzynka w App Group → PDF na urządzeniu, oryginał zachowany | **przyjęta** (P-071 (5a)) |
| [0012](../adr/0012-rysik-i-zakreslacz-pencilkit.md) | PencilKit nad PDFKit, `pencilOnly` / `anyInput` | **przyjęta** (P-071) |
| [0013](../adr/0013-maszyny-stanow-w-domenie.md) | maszyny stanów w domenie, lista stanów w `CHECK` | **przyjęta** (P-071) |
| [0014](../adr/0014-build-i-ci.md) | testy i buildy TestFlight na runnerze macOS GitHub Actions, sekrety w środowisku `testflight` z zatwierdzeniem | **przyjęta** (P-071 (6b): GitHub Actions) |
| [0015](../adr/0015-dane-wersji-0-1-0-czysty-start.md) | czysty start, stary plik nietknięty | **przyjęta** (P-070) |

## Eksperymenty (zasada E1 pkt 2)
| ID | Pytanie | Komenda | Kod | Wynik |
|---|---|---|---|---|
| E1-1 | SQLite czy JSON przy 150 000 zdarzeń (ADR-0001) | `node --no-warnings eksperymenty/e1/e1-1-skala.mjs` | 0 | SQLite +1 p50 0,182 ms / p95 0,367 ms; historia i kalendarz po indeksie (p95 ≤ 0,336 ms, `SEARCH … USING INDEX`); JSON 13,2 MB przepisywany przy każdym +1: p50 128 ms / p95 176 ms. Linux, Node 22, nie iPhone — proporcja, nie budżet |
| E1-2 | Scalanie zdarzeń z wielu źródeł bez cichego sumowania (ADR-0005, 0008, 0009) | `node eksperymenty/e1/scal-test.mjs` | 0 | 7/7 wektorów M-01–M-07 (liniowo, duplikat, odwrócona kolejność, konflikt zegarek–telefon, rozstrzygnięcie, −1 przy zerze, +1 po zerowaniu); każdy też przy odwróconym wejściu; wejście niezmienione |
| E1-2m | Czy wektory łapią błąd „sumuj gałęzie” | `node eksperymenty/e1/mutant/…` (kopia z mutacją) | 1 | 6/7, M-04 BŁĄD → wektory wykrywają błąd (fix 2026-10-25, Z07-13: statyczna kopia usunięta, zastąpiona generatorem `eksperymenty/e1/mutanty-scal.mjs`, 10 mutantów, 0 przeżywa) |
| G-07 | Czy `withExclusiveTransactionAsync` otwiera nowe połączenie | `npm pack expo-sqlite@57`, `src/SQLiteDatabase.ts:181, :789` | — | tak (`useNewConnection: true`) |

Nowe wiersze rejestru (odczyt 2026-10-22): Apple 15a–15d, 16, 17.

## Pytania produktowe (rozstrzyga właściciel)
**Q4. Eksport: pliki wzorów i zdjęć w kopii (ADR-0004)** — po 3 latach intensywnego używania archiwum ma ok. 400 MB (E0 §3).
- (a) **Zawsze z plikami**: jedna kopia odtwarza wszystko; za duża na maila, do Plików/iCloud Drive w porządku. **Rekomendacja** (BR-DAN-005: kopia ma odtwarzać dane).
- (b) Wybór przy eksporcie „z plikami / tylko dane”: mały plik do szybkiej kopii, ale ryzyko, że ktoś zapisze tylko dane i straci wzory.
- (c) Tylko dane: najmniejszy plik, wzory i zdjęcia giną przy zmianie telefonu bez kopii urządzenia.

**Q5. Word (F-55, ADR-0011)** — czy `WKWebView` wiernie renderuje `.docx`, dokumentacja nie mówi (rejestr Apple 15d).
- (a) **Word → PDF na urządzeniu, jeśli test na symulatorze pokaże wierny render; jeśli nie — podgląd QuickLook bez znacznika i zakreśleń, oryginał zachowany.** **Rekomendacja** (jedna ścieżka dla znacznika, bez blokowania funkcji).
- (b) Word zawsze tylko podgląd QuickLook (bez znacznika i rysika): najmniej ryzyka, mniej funkcji.
- (c) Word poza wersją 1 (zmiana zakresu przez rolę 03).

**Q6. Buildy do TestFlight (ADR-0014)**
- (a) **EAS Free** (15 buildów iOS/mies., podpis zarządzany przez Expo, poza publicznym repo). **Rekomendacja.** Pytanie pomocnicze: czy Trening buduje przez EAS? [DO USTALENIA] — wspólny sposób zmniejsza utrzymanie.
- (b) GitHub Actions macOS z kluczem App Store Connect w sekretach repo: bez limitu, ale własny skrypt podpisu i klucz w publicznym repo (sekrety niewidoczne, ale dostępne dla workflow).

## Plan dalej
E2 (moduły, dane, konfiguracja): drzewo i porty, ERD, `schemat.sql` uruchomiony w `node:sqlite` (integrity_check, foreign_key_check, kaskada, UPSERT), polityka migracji i kopii, parametry konfiguracji, tabela ścieżek utraty danych. Agent ok. 2 h; właściciel ok. 10 min.
