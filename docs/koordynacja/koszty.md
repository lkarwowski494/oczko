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
| session_01T66VBzbohJZEBjcoX9Qb7q | K: 08 audit (recenzja poprawek G2) | 5 (STOP 6,5) | — (otwarta) | — | 10.11 10:06 → 10:06 → … | — | |
| session_01T66VBvdJcbv9Zfh1QVujsz | J: 10 audit (recenzja zrzutów sklepu) | 6 (STOP 7,8) | 3,86 | 23 | 10.11 09:34 → 09:34 → werdykt 09:42 → raport w warsztacie 40f3064 09:45 → przyjęte 09:43 | add_repo odrzucony: ok. 2 min + przeniesienie raportu 3 min (WG-03) | zarchiwizowana 09:46; szacunek ×0,64 |
| session_01T66VBzCiPMuAiXva784rCV | koordynator M9 (fable-5-2) | — | 8,12 (odczyt 09:31) | 27 | 10.11 08:36 → 09:34 przekazanie | — | następca session_01T66VBygrH2FB6wWhFKzzSm |

| session_01T66VBwXXdrAfk53WkdwZsz | koordynator M9 (fable-5-2) | — | — | — | od 10.11 09:33 | — | następca session_01T66VBzCiPMuAiXva784rCV |

Mnożnik szacunku: [DO USTALENIA] (za mało sesji M9).
