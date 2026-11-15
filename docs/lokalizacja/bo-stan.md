# BO — stan (podpisy zrzutów przez API, rola 09 build) · 2026-11-15

Gałąź: `claude/bo-podpisy-api-2026-11-15` (od 761b9551). Zadania 1–2 zrobione (testy czerwone fb1c4fb, kod i workflow 6a0523a; verify kod 0: `docs/lokalizacja/bo-verify.txt`).

- Moduł: `scripts/i18n/przeklad-podpisy.mjs` (przekład → krytyk, `--szacuj`, `--etap`, `--tylko`, `przyjmij --raport <katalog>`); workflow: tryb `podpisy` w `przeklad-tlumaczen.yml`.
- Szacunek lokalny (przybliżenie, Opus 5.5 high, 27 języków × 2 etapy): ≈ 1,90 USD; limit 30 USD. Założenie myślenia (1500 tokenów × mnożnik) do sprawdzenia próbą `limit=2`.
- Decyzje do weta: P-808 (przekład+krytyk, przyjęcie tylko po krytyku), P-809 (twarde kontrole). P-810 wolne.
- Zadania 3–4: koordynator wyzwala workflow (`tylko_szacuj=true`, potem płatny) z tej gałęzi i podaje run ID; potem pobrać artefakt `raport-podpisy`, przejrzeć jako tłumacz, `node scripts/i18n/przeklad-podpisy.mjs przyjmij --raport <katalog>`, testy, commit.

## Naprawy po recenzji BQ (07346b98) — 2026-11-15
Testy czerwone 3a8d32b (`bo-bq-czerwone.txt`), naprawa 6875aa5, verify kod 0 (7408 testów; `bo-verify.txt`). Decyzja P-810 (do weta). 001: `--wznow B1[,B2]`, prefiks etapu, 80 min/etap; 002: blokada przyjęcia; 003: status po etapie krytyk; 004: kontrole per język; 005: `--limit`. `przeklad-metadane.mjs` nietknięty (ten sam wzorzec :338/:352 — poza zakresem, zgłasza koordynator).

## KO-063 / P-823 (tap jak w aplikacji) — 2026-11-15
Testy czerwone 4d48788 (`bo-tap-czerwone.txt`), zmiana 9fa82d6, verify kod 0 (7410 testów). Przebieg dowodowy limit=2 (run 43698042593, cs/da): koszt ≈ 0,077 USD, pełne 27 ≈ 1,0 USD. Następnie: ponowny limit=2 (wyzwala koordynator), dopatrzenie BQ, pełny przebieg; `przyjmij` dopiero po reaudycie BQ. Znaleziony defekt cs: „dotyk” → powinno być „klepnutí” (poprawić ręcznie tylko jeśli ponowny przebieg nadal tak da).

## Zadanie 4 zakończone — 2026-11-15
Pełny przebieg run 43699678893 (9696e2d) przyjęty w 1532aaa (P-824), przegląd: `bo-przeglad-podpisow.md`, koszt API 1,345 USD (razem ≈ 1,56 USD). verify kod 0 (7410 testów). Otwarte: przegląd człowieka według progu (status [DO PRZEGLĄDU]), akceptacja en/pl przez właściciela, rozbieżności słownika aplikacji (hu/ro/sk/ru/uk/ko/fr/it/nb/zh-Hant) do ról po stronie aplikacji.
