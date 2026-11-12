# Koszty — Oczko (od 9.11 wieczór)

| Sesja | Rola | Szacunek USD | Rzeczywisty USD | Kontekst max % | Zlecone → start → 1. commit → CI zielone → przyjęte (UTC) | Oczekiwanie | Uwagi |
|---|---|---|---|---|---|---|---|
| session_01T66VBwDzSxaKFjwDXvc3ST | 08 build 2 nr 1 | ≤10 | 8,22 | 31 | 9.11 18:45 → … → 19:22 przekazanie | — | AX5 A, instrumentacja |
| session_01T66VBxLj2oCsCTk2cumQxZ | 08 nr 2 (024) | ≤10 | 7,88 | 24 | 9.11 19:23 → 19:43 → 22:18 → 00:37 | kolejki macOS ~2 h | 024 A |
| session_01T66VByn4YqYJWZ5JpJWS6X | 08 nr 3 (06) | ≤10 | 2,66 (otwarta) | 18 | 10.11 00:38 → 00:45 → 02:48 (przebieg 8) | — | 06 |
| session_01T66VBw3GXRFNFNfsmAx7uy | M1 finalny | ≤150 (80–120) | 72,03 | 23 | 10.11 03:01 → 04:06 | — | |
| session_01T66VBx6UXGtzFfAZDeBpip | koordynator (bez M9) | — | 93,85 (od 8.11 16:00, odczyt 10.11 05:12) | 30 | — | — | przekazanie 10.11 |
| session_01T66VBzyDZ56SkwWzV5t1ZR | A: M2 naprawy | 40 (STOP 52) | 5,56 (wstrzymana) | 26 | 10.11 05:13 → 05:13 → 27e2ac1 ok. 05:28 → CI brak → — | wstrzymanie właściciela 05:25 | 303 gotowe; 301 czeka na publikację; 302, 304 nierozpoczęte |
| session_01T66VBvxBBKLAkeEUNSEf4n | koordynator M9 | — | — | — | od 10.11 05:10 | — | |
| session_01T66VBygxDoZxuZKDNHHXc8 | A2: M2 naprawy (302, 304, raport; pętla 2: 323, 324) | 34 (STOP 44) | 9,76 | 30 | 10.11 05:38 → 05:38 → ac77b39 ok. 05:46 → CI success 06:38 (run 42769467527; pierwszy run 06:10 failure = 324) → przyjęte 06:51 | odbiór 47 min od pierwszego PRZEKAZANIA 06:04: reaudyt C 18 min, pętla 2 9 min, CI 2× ok. 4–5 min, reaudyt D 13 min | następca A; zarchiwizowana 06:53 |
| session_01T66VBxhDabqriZxJMgbRsB | koordynator M9 (fable-5-2) | — | 8,00 (odczyt 06:25; przekazanie ok. 06:40) | 29 | od 10.11 05:35 | — | |
| session_01T66VBxU3pNDFL8RzCfKmf9 | B: 10 fix, publikacja 301 | 6 (STOP 8) | 0,21 | 9 | 10.11 05:44 → 05:44 → brak commita → zarchiwizowana 05:46 | odpowiedź właściciela 05:23→05:42 (w tym wstrzymanie) | |
| session_01T66VBwZkpjZzMRtFv5FgXW | C: M1 reaudit 301–304 | 25 (STOP 32) | 13,79 | 22 | 10.11 06:05 → 06:05 → raport 564cbd5 06:23 → przyjęte 06:25 | — | |
| session_01T66VBzzRjKwYyvTLy9scsA | D: M1 reaudit pętla 2 (323, 324) | 8 (STOP 10,4) | 3,21 | 20 | 10.11 06:38 → 06:38 → raport d4f7b38 06:51 → przyjęte 06:51 | — | zarchiwizowana 06:53; szacunek ×0,40 |
| session_01T66VBzsdhe1m1utdtWneFy | E: 10 build (zrzuty sklepu, 244, 326) | 15 (STOP 19,5) | 5,87 | 40 | 10.11 06:55 → 06:55 → 9aa3b90 ok. 07:02 → CI brak → przekazanie 07:51 (nieprzyjęte) | przebieg zrzutów 1: 18 min build + awaria kroku Maestro (stracony przebieg, błąd konfiguracji) | zarchiwizowana 07:52; następca E2 |
| session_01T66VBvchQHYc2grKLK3LzA | E2: 10 build (zrzuty — dokończenie) | 10 (STOP 13) | 4,15 | 28 | 10.11 07:51 → 07:51 → 992aec2 ok. 08:37 → run zrzutów zielony 09:19 (wg sesji) → PRZEKAZANIE 09:27 (nieprzyjęte: recenzja J, `ci.yml`) | przebieg zrzutów 1 czerwony (sceny 04–07), naprawczy ok. 40 min | zarchiwizowana 09:35; szacunek ×0,41 |
| session_01T66VBygrH2FB6wWhFKzzSm | koordynator M9 (fable-5-2) | — | — | — | od 10.11 06:36 | — | następca session_01T66VBxhDabqriZxJMgbRsB |
| session_01T66VBydAGZjc8FP2V9yPwi | F: 04 fix (projekt buildu 3) | 8 (STOP 10,4) | 6,13 | 28 | 10.11 08:40 → 08:40 → 738b0d6 ok. 08:55 → verify hooka (wg sesji) → przyjęte 08:58 | — | zarchiwizowana 09:00; szacunek ×0,77 |
| session_01T66VBxbRK32NjWj1jbd7ER | G: 08 fix (kod buildu 3) | 10 (STOP 13) | 4,80 | 34 | 10.11 08:58 → 08:58 → 4eac4af ok. 09:03 → verify hooka 09:26 (wg sesji) → nieprzyjęte (recenzja I) | odpowiedź koordynatora na PYTANIE i18n: 1 min | zarchiwizowana 09:30; szacunek ×0,48 |
| session_01T66VBy3eeXpsL31qf2TLYe | H: 09 build (6 kluczy × 34) | 5 (STOP 6,5) | 3,91 | 22 | 10.11 09:28 → 09:28 → 5db0155 09:39 (verify hooka wg sesji) → przyjęte formalnie 09:41 | — | zarchiwizowana 09:41; szacunek ×0,78 |
| session_01T66VByjqMZp13ZcqHKwEHH | I: 08 audit (recenzja buildu 3) | 12 (STOP 15,6) | 6,18 | 28 | 10.11 09:28 → 09:28 → raport ba13e62 09:40 → przyjęte 09:42 | — | zarchiwizowana 09:46; szacunek ×0,51 |
| session_01T66VBwQhN8XbJaX6yEYMhP | G2: 08 fix (I-001, I-002, scalenie E) | 6 (STOP 7,8) | 2,66 | 24 | 10.11 09:42 → 09:42 → 1aaa238 ok. 09:50 → push 87ade5a 10:02 → `ci.yml` zielone 10:07 → przyjęte 10:12 | „SCALAJ E” z priority next nie dotarła w trakcie tury: ok. 1 min; `ci.yml` 5 min | zarchiwizowana 10:13; szacunek ×0,44 |
| session_01T66VBzbohJZEBjcoX9Qb7q | K: 08 audit (recenzja poprawek G2) | 5 (STOP 6,5) | 2,36 | 16 | 10.11 10:06 → 10:06 → werdykt 10:11 → raport w warsztacie 59f3de6 10:13 → przyjęte 10:12 | add_repo odrzucony, raport wiadomością (WG-03) | zarchiwizowana 10:14; szacunek ×0,47 |
| session_01T66VBvdJcbv9Zfh1QVujsz | J: 10 audit (recenzja zrzutów sklepu) | 6 (STOP 7,8) | 3,86 | 23 | 10.11 09:34 → 09:34 → werdykt 09:42 → raport w warsztacie 40f3064 09:45 → przyjęte 09:43 | add_repo odrzucony: ok. 2 min + przeniesienie raportu 3 min (WG-03) | zarchiwizowana 09:46; szacunek ×0,64 |
| session_01T66VBzCiPMuAiXva784rCV | koordynator M9 (fable-5-2) | — | 8,12 (odczyt 09:31) | 27 | 10.11 08:36 → 09:34 przekazanie | — | następca session_01T66VBygrH2FB6wWhFKzzSm |

| session_01T66VBwXXdrAfk53WkdwZsz | koordynator M9 (fable-5-2) | — | 10,11 (odczyt 11:16) | 31 | 10.11 09:33 → 11:22 przekazanie | — | następca session_01T66VBzCiPMuAiXva784rCV |
| L session_01T66VByaAC5LWxutR7guajC | 07 build (opus), dokument | 8 | 14,67 | 29 | 10.11 11:36 → 11:37 → ok. 11:50 → — (docs, [skip ci]) → 12:00 | 0 | 6 subagentów ok. 860 tys. tokenów; próg STOP 10,5 przekroczony bez sygnału (sesja nie zna kosztu) |
| M session_01T66VC127fsqqLHDTHoS8mi | 08 fix (opus), diagnoza e2e | 10 | 6,80 | 25 | 10.11 12:50 → 12:51 → 13:05 → — ([skip ci]) → 13:07 | 0 (diagnoza 10 min od startu) | 1 subagent 212 tys. tokenów |

| session_01T66VBzxND6Wvoct7mrNBqJ | 08 fix TF-B3-01 (N, opus) | 8 | 1,34 | 12,7 | 15:13 → 15:14 → 15:2x → ci.yml 15:31 → 15:33 | 7 min (ci.yml); recenzja subagenta równolegle | DIAGNOZA 15:17, PRZEKAZANIE 15:26; ff integracji 15:33 |
| session_01T66VBwJWnyDdMABbE9BGC4 | 04 build zawężony (O, przewodnik, opus) | 8 | 8,92 | 36 | 15:52 polecenie → 17:21 start (czekało na odpowiedź właściciela) → 17:36 → (docs, bez CI) → 17:42 | ok. 90 min — odpowiedź właściciela na AskUserQuestion | kontekst 36% ponad limit 30% (WG-05); koszt ponad pułap, poniżej STOP |
| session_01T66VBxhDabqriZxJMgbRsB | koordynator M9 (05:35, fable) | — | 10,49 | 32 | 10.11 05:31 → 06:38 | — | zarchiwizowany 17:47 na polecenie właściciela |
Mnożnik szacunku: [DO USTALENIA] (za mało sesji M9).
Przegląd przepływu 2026-11-10 (14:00): koszt doby ok. 225,6 USD (od 9.11 18:45, bez 93,85 USD sesji wielodniowej); największa strata ok. 2 h 25 min — awaria symulatora w e2e cz. 2 iphone, ponowienie ręczne → WG-07; drugie: kolejka/przebieg pełnego e2e ok. 2 h na kandydata (WG-01). Koordynator (6) session_01T66VByx9Gr7xm8SB8GYS1D: 7,49 USD (odczyt 14:01, model od ok. 12:45 claude-opus-5-5 słowami właściciela — `/model`).
| P | 08 build (przewodnik, opus) | 10 | 12,02 | 34 | 17:40 → 17:41 → ok. 18:05 → `ci.yml` 18:11 w toku → (Q) | — | ponad pułap, pod STOP; 1 subagent sonnet |
| Q | 08 audit (recenzja przewodnika, opus) | 6 | 4,35 | 25 | 18:12 → 18:13 → raport 18:22 → przyjęte 18:23 | — | TAK; verify 0 |
| R | 07 build (e2e przewodnika + lista L, opus) | 8 | 5,86 | 28 | 18:12 → 18:13 → 18:28 → `ci.yml` w toku → — | — | pytanie KO-029 |
| S | 09 build (2013 tekstów, sonnet) | 7 | 9,33 | 27 | 18:12 → 18:13 → 18:52 → `ci.yml` w toku → — | — | ponad STOP; 14 subagentów sonnet wbrew limitowi 1 (WG-06) |
| T | 08 fix (scalenie R, Q-001, Q-003, wartoscTestID, słownik, spec 640; sonnet) | 8 | 2,30 | 23 | 18:58 → 18:59 → ok. 19:14 → `ci.yml` 42886016326 w toku → (U) | ok. 17 min — PRZEKAZANIE wysłane dopiero na prośbę 19:31 | pod pułapem |
| U | 08 audit (recenzja R+T, opus) | 5 | 4,00 | 22 | 19:31 → 19:31 → raport 19:40 → — → NIE (001) | — | werdykt NIE; P2 001 |
| V | 08 fix (001 nawigacja, 002 spec; sonnet) | 4 | 1,23 | 19 | 19:41 → 19:41 → ok. 19:48 → `ci.yml` 42889541804 w toku → (W) | — | pod pułapem |
| W | 08 audit (recenzja V, opus) | 3 | 2,62 | 19 | 19:53 → 19:53 → raport 20:04 → `ci.yml` success 75242ba → przyjęte 20:05 | — | TAK, P3 1 |
| Y | 10 build (lista 1.0, sonnet) | 5 | 2,63 | 30 | 20:33 → 20:33 → 20:45 → `ci.yml` 20:51 → scalone 20:51 | — | dopisek właściciela w 2. commicie |
| X | 07 build (lista testu build 4, opus) | 6 | 5,12 | 25 | 20:33 → 20:33 → 20:51 → — (docs) → przyjęte 20:55 | — | add_repo warsztat odrzucony (KO-022) |
| Z | 07 audit (MVP w 1.0, opus) | 10 | 10,69 (ponad pułap 10, pod STOP 13) | 27 | 21:05 → 21:21 → raport 21:37 → — (raport, odczyt) → przyjęte 21:40 | — | 51 funkcji: 44/5/1/1/0; ponad szacunek ok. 60 min — w czasie |
| AA | 10 build (sonnet) | 10 | 4,19 | 35 | 22:18 → 22:19 → ok. 22:26 → (ci.yml 22:43, w toku) → (po AB) | — | ponad 30 proc. kontekstu |
| AB | 10 audit (opus) | 6 | 5,67 | 28 | 22:43 → 22:44 → raport 22:55 → — → przyjęte 22:58 | — | autor commitu w warsztacie „Claude” |
| AC | 10 fix (sonnet) | 6 | 4,54 | 35 | 22:57 → 22:57 → (zbiorczo) 23:21 → (ci.yml 23:23) → (po AD) | — | ponad 30 proc. kontekstu |
| AD | 10 audit (opus) | 5 | 5,87 (ponad pułap, pod STOP) | 29 | 23:22 → 23:22 → raport 23:37 → — → przyjęte 23:40 | — | P1 009 potwierdzone CI |
| AE | 10 fix (sonnet) | 4 | 3,63 | 30 | 23:38 → 23:38 → 7c62dc5 ok. 23:55 → ci.yml zielone 00:11 → przyjęte 00:20 | — | ponad limit 25 proc. kontekstu |
| AF | 10 audit (opus) | 5 | 2,16 | 17 | 00:05 → 00:06 → raport 00:17 → — → przyjęte 00:20 | — | add_repo warsztatu odrzucony (WG-11) |
| AG | 10 audit (opus) | 4 | 2,10 | 19 | 11:30 → 11:31 → raport 11:36 → — → przyjęte 11:39 | 120 min od C1 success 10:57 do startu (przekazanie koordynatora; budżet kontekstu poprzednika) | prompt roli w 2 częściach (WG-11) |
| AH | 10 fix (sonnet) | 6 | 3,41 | 28 | 11:39 → 11:40 → b213d37 ok. 11:50 → (C2 43017044972 w toku) → przyjęte co do formy 12:04 | — | ponad limit 25 proc. kontekstu (WG-10, 3. raz) |
| AI | 08 fix (sonnet) | 5 | 3,15 | 27 | 13:46 → 13:47 → 1983b13 ok. 14:03 → (C3 43035080611 w toku) → — | — | ponad limit 25 proc.; prompt wkleił subagent (WG-12) |
| AJ | 08 fix (sonnet) | 5 | 2,45 | 20,5 | 16:41 → 16:42 → 3395618 (ok. 16:55) → C4 43064894031 w toku → przyjęcie po AK i C4 | diagnoza 3 min; czekanie na decyzję A/B ok. 1 min | KO-039/040; C3 attempt 3 zielony niezależnie (awaria DNS przejściowa) |
| AK | 10 audit (opus) | 5 | 3,17 | 23 | 17:08 → 17:10 → (bez commitów) → — → raport 17:15 | 0 | TAK, 4×P2 |
| AL | 08 fix (sonnet) | 5 | nieznany | ? | 17:18 → 17:19 → 9dfc5e5 (ok. 17:23) → C5 43070136577 w toku → — | odpowiedź na PYTANIE 019 ok. 1 min | 4×P2 AK |
| AO | 08 fix (opus, KO-044) | 8 | 12,36 | 34,6 | 22:31 → 22:31 → (lokalnie 23:0x) → C7 43121089904 + Jakość iOS 43121094246 w toku (23:36) → odbiór po C7 i recenzji AP | push 23:18→23:35 (~17 min + ~4 USD): hak pre-push (pełne verify ~10 min) przerywany własnym `timeout 90/120` → WG-14 | **ponad STOP 10,4 USD** (zadanie skończone, PRZEKAZANIE 23:29); diagnoza (a) defekt aplikacji P1 |
| AP | 10 audit (opus) | 6 | 3,76 | 22,2 | 01:23 → 01:26 → (bez commitów) → C7 43121089904 + iOS 43121094246 success → raport 01:32 | 0 | TAK; 019 naprawione; 018 (b)+(d) |
| AQ | 08 fix (sonnet) | 8 | 4,66 | 32 | 01:37 → 01:37 → … → 2929462 (02:06) → C8 + iOS w toku (02:08) → odbiór po AR | 0 | KONIEC potwierdzony; ponad 30% (32) |
| AR | 07 audit (opus) | 5 | 6,84 | 29,8 | 04:31 → 04:32 → 54127b5 (04:43) → — → raport 04:44 | 0 | **próg STOP** (pobieranie logów/artefaktów); **zły autor** 54127b5 „Claude <noreply@anthropic.com>” |
| AS | 10 audit (opus) | 6 | 5,10 | 26 | 05:52 → 05:57 → 06:08 (raport d11483d) → iOS w toku → 06:13 przyjęte | 0 min (polecenie gotowe przed końcem C8) | sesja zgłosiła „ok. 3 USD” — szacunek sesji 1,7× za nisko |
| AV | 04 audit (opus/high) | 6 | 6,15 | 28 | 08:20 → 08:24 → 08:40 (raport e4f75e5) → — (docs, verify 0 wg sesji) → 08:48 przyjęte | 0 | w pułapie +2,5%; raport przyjęty (autor OK, tylko docs/design/av-2026-11-12/) |
| AU | 10 fix (022–027) | — | 5,98 | 35 | 08:20 → … → przyjęte 09:14 | recenzja AY 2 rundy | archiwizacja 09:14 |
| AY | 10 audit (recenzja AU ×2) | 6 | 7,55 | 27 | 08:41 → TAK 09:11 | — | archiwizacja 09:27 |
| AZ | 09 audit (recenzja AW ×2) | 5 | 6,20 | 26 | 08:43 → TAK 09:37 | przerwa limitu ok. 30 min | archiwizacja 09:52 |
| AW | 09 build (podpisy C6 + P2) | — | 2,49 | 23 | 08:27 → 09:30 | czekanie na recenzję (limit) | archiwizacja 09:52 |
| AT | 08 fix (07-001…003) | — | 2,01 | 20 | 08:16 → 09:31 | — | archiwizacja 09:52 |
| BA | 08 fix (04-001) | 8 | 1,14 | 16 | 08:44 → 08:58 | — | archiwizacja 09:52 |
| AX | 08 audit (recenzja AT, delta 003, scalenie kandydata) | — | 8,33 | 31 | 08:33 → 09:48 (kandydat 562dfc4) | — | archiwizacja 09:56 (ponad 30% — bez dalszej pracy) |
| M9 …wtoK6… (koordynator 18) | M9 | 10 | 12,91 | 35 | 08:58 → 09:50 | — | archiwizacja 09:58 przez następcę (wyjątek: lineage 8/8); …vgNA… (17) już zarchiwizowana, 18,13 USD |
| BB | 07 audit (diagnoza e2e) | 5 | 5,95 | 29 | 11:17 → 11:32 raport → 11:36 przyjęte | — | ponad pułap o 19% (high effort, logi CI) |
| BC | 07 build (lista testu buildu 5) | 3 | 4,87 | 25 | 13:12 → 13:24 raport → 13:26 przyjęte | — | ponad STOP; sesja szacowała 1,5 (prompt 69 tys. zn. + verify) |
| BD | 07 fix (JAK-05/JAK-17) | 5 | 6,46 | 24 | 14:05 → 14:09 start → 14:17 1. commit (lokalny) → 14:25 PRZEKAZANIE → ci.yml 43237109275 success 14:29 → 14:45 przyjęte (recenzja BE TAK) | 16 min: recenzja niezależna | tuż pod STOP 6,5; przegląd ścieżki wrażliwej subagentem wykrył P1 przed recenzją |
| BE | 08 audit (recenzja BD + delta BF) | 5 | 4,26 | 23 | 14:27 → 14:29 start → 14:40 raport TAK → 15:00 delta zlecona → 15:07 delta TAK → 15:12 przyjęte | 0 | dwie recenzje w jednej sesji (delta tańsza niż nowa sesja) |
| BF | 07 fix (BE 001–003) + scalenie zbiorcze | 4 | 4,32 | 21 | 14:42 → 14:45 start → 14:59 PRZEKAZANIE → ci.yml 43243028214 success 15:05 → 15:07 delta BE TAK → 15:13 scalenie 2ed5215a → 15:16 ff integracji | 0 | ponad pułap o 8% (dodatkowe zadanie scalenia), pod STOP |
