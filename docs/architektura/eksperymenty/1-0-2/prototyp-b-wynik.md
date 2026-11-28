# Prototyp B — wynik (PB1, 2026-11-28)

**Werdykt: NIE** wg kryterium AR1 (`docs/architektura/1-0-2.md` „Prototyp B”): (a) zachodzi, (b) nie zachodzi na symulatorze. Skutek wg kryterium: bezpiecznik 1 → B na 1.0.3, 1.0.2 = forma A. Decyzja i zapis w `docs/decyzje.md`: koordynator (P-1117).

## Przebieg
- Run **46142988157** (workflow `prototyp-b.yml`, push na `claude/pb1-prototyp-b-2026-11-28`, commit 75ae43c1, próba 1 z 2), macOS 26, symulator iPhone z Dynamic Island, build Release z flagą `OCZKO_PROTOTYP_B`; zielony, ok. 33 min (kolejka 23 min, build 20 min, przebiegi 7 min). Artefakt `prototyp-b` (ID 15264825666, ważny do 2026-12-12): 61 plików, zrzuty co 5 s, OCR, `wynik.json`.
- Dwa przebiegi w jednym jobie: start aplikacji (`OCZKO_PROTOTYP_B=1`) → Live Activity ze `staleDate` = start + 60 s i `ostatniPlusMs` = start → `simctl terminate` → zrzuty od start+10 s do start+110 s.

## Wyniki (z logu runu i artefaktu)
| Warunek | Przebieg 1 | Przebieg 2 |
|---|---|---|
| Proces aplikacji nieobecny po terminate (`pgrep` i `launchctl list`) | tak (przed: pid 58164, po: PROCES-BRAK, LAUNCHCTL-BRAK) | tak |
| Live Activity widoczna po zakończeniu procesu | tak (Dynamic Island, compact) | tak |
| (a) czas przerysowywany bez procesu | **tak**: 0:13 (t+10) … 0:30 (t+30) … 1:30 (t+90) … 1:45 (t+105); OCR i zrzut | tak: 0:15 … 1:45 |
| (b) znacznik „STALE” po `staleDate` (start+60 s) | **nie**: do t+105 s (45 s po `staleDate`) nadal licznik, brak „STALE” i czerwieni (`czerwone` = 2728 na każdym zrzucie, stała) | nie: jak obok |

Zrzuty obejrzane: `t030` (licznik 0:30) i `t090` (licznik 1:30, 30 s po `staleDate`) w obu przebiegach; widok compact bez zmiany wyglądu. Wycinki Dynamic Island w repo: `prototyp-b/dowody/p{1,2}-t{030,090}-wyspa.png` (pełne zrzuty w artefakcie).

## Ograniczenia i wniosek
- **Symulator ≠ urządzenie.** Wynik (b) mówi, że na symulatorze iOS 26 (SDK z Xcode 26.x runnera) widok nie przerysował się po `staleDate` bez procesu aplikacji. Nie dowodzi tego dla urządzenia; dokumentacja Apple jest w tej sprawie niejednoznaczna (`1-0-2.md` U7). Nie sprawdzono, czy `ActivityState` przeszedł w `stale` (prototyp tego nie logował) — brak przerysowania jest jedynym obserwowanym faktem.
- Zbadano tylko widok compact (trailing). Ekran blokady i widok rozwinięty nie były obserwowalne (brak wejścia dotykowego w CI).
- (a) jest potwierdzone na symulatorze: licznik `Text(timerInterval:)` idzie bez procesu aplikacji; to zgadza się z rejestrem 22.
- Opcja, jeśli koordynator chce pewności o urządzeniu: P2 (build TestFlight z ukrytym przełącznikiem; 5–10 min właściciela) — nie podejmowana (zakaz pytań do właściciela w PB1).
- Zmiana kodu wydania: brak. Flaga tylko w `prototyp-b.yml`; `kontrola-flagi.mjs` zielona (krok 3 runu); `jakosc:kontrole` kod 0.
- Prototyp nie jest funkcją; gałąź zostaje dowodem.
