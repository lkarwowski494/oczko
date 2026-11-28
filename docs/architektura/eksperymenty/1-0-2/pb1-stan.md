# PB1 — stan (rola 08, fix; prototyp B)

Aktualizacja: 2026-11-28. Polecenie: `koordynacja:docs/koordynacja/polecenia/PB1.md` @ 48f9a128. Gałąź: `claude/pb1-prototyp-b-2026-11-28` (baza 9275460e).

## Zrobione
- Prototyp pod flagą kompilacji `OCZKO_PROTOTYP_B` (tylko `.github/workflows/prototyp-b.yml`): `modules/oczko-dziennik-plus/ios/PrototypB.swift` (start Live Activity, `staleDate` = start + 60 s, `ostatniPlusMs` = start), haczyki `#if` w `OczkoDziennikPlusModule.swift`, znacznik w `targets/widget/Aktywnosc.swift` (compact trailing: licznik czasu, po `isStale` „STALE” na czerwono).
- Narzędzia w `docs/architektura/eksperymenty/1-0-2/prototyp-b/`: `przebieg.sh` (2 przebiegi: start, terminate, brak procesu, zrzuty co 5 s), `ocr.swift` (Vision), `werdykt.mjs` + `werdykt-test.mjs` (5/5 na danych syntetycznych), `kontrola-flagi.mjs`.
- `npm run jakosc:kontrole` kod 0; sprawdz-workflowy 0 naruszeń.

## Następny krok
Push, przebieg macOS (najwyżej 2 próby), obejrzeć zrzuty z artefaktu `prototyp-b`, napisać `prototyp-b-wynik.md` (P-1117), PRZEKAZANIE do koordynatora.
